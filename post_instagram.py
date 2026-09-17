"""Geracao de legendas com Claude + publicacao no Instagram via Composio.

Plataforma Dr. Antonio Felipe (Dr. Saude Mental).

Fluxo do dia:
    1. Anthropic (claude-opus-5, thinking adaptativo) gera a legenda
       clinico-acolhedora do pilar do dia (ou de --tema, se informado),
       seguindo a voz de marca e as regras de compliance de saude mental.
    2. Composio (toolkit Instagram) publica a legenda com a midia informada
       em --media-url na conta Instagram Business/Creator conectada:

           INSTAGRAM_POST_IG_USER_MEDIA         -> creation_id (container)
           INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH  -> publica o container

A Composio cuida da autenticacao e da renovacao do token do Instagram — a
conta precisa estar conectada uma vez pelo dashboard (https://app.composio.dev)
antes do primeiro uso deste script. Isso evita o processo manual de renovar
token de longa duracao que publicar_instagram.py precisa fazer via Meta API.

Credenciais lidas de .env.local na raiz do projeto:

    ANTHROPIC_API_KEY=<chave da API da Anthropic>
    COMPOSIO_API_KEY=<chave da API da Composio>
    INSTAGRAM_ACCOUNT_ID=<ig-user-id da conta Instagram Business/Creator>

Opcionais:

    COMPOSIO_USER_ID=<id do usuario/entidade conectado na Composio>  (default "default")
    INSTAGRAM_MEDIA_URL_PADRAO=<URL HTTPS usada quando --media-url nao e informado>

Dependencias: anthropic, composio, python-dotenv.

Uso via linha de comando:

    python post_instagram.py gerar --tema "ansiedade no trabalho"
    python post_instagram.py gerar                                    # pilar do dia
    python post_instagram.py publicar --media-url https://...
    python post_instagram.py publicar --media-url https://... --tema "burnout"
    python post_instagram.py publicar --media-url https://... --dry-run
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from datetime import date
from pathlib import Path
from typing import Any

import anthropic
from dotenv import dotenv_values

# --------------------------------------------------------------------------- #
# Constantes
# --------------------------------------------------------------------------- #

ARQUIVO_ENV = Path(__file__).resolve().parent / ".env.local"

MODELO = "claude-opus-5"
LIMITE_LEGENDA = 2_200
TIMEOUT_PUBLICACAO_S = 300

# Pilares de conteudo — mesma linha editorial do calendario de 30 dias
# (CONTEUDO_INSTAGRAM/CALENDARIO_30_DIAS.md). Rotaciona por dia do ano para a
# publicacao automatica diaria ter variedade sem exigir --tema todo dia.
PILARES = [
    "ansiedade e sintomas fisicos",
    "burnout em profissionais de saude",
    "qualidade do sono e saude mental",
    "relacionamentos e saude emocional",
    "autoestima e autocritica excessiva",
    "quando e como buscar ajuda profissional",
    "rotina, produtividade e saude mental",
]

SISTEMA_LEGENDA = """Voce escreve legendas de Instagram para a Plataforma Dr. Antonio Felipe \
(Dr. Saude Mental), um consultorio de saude mental online.

Voz de marca: clinico-acolhedora. Autoridade medica sem frieza, calma sem \
infantilizacao. O texto nunca pode parecer saida de um gerador de texto em massa.

Regras obrigatorias:
- Beneficio antes de feature, prova antes de promessa.
- A primeira linha carrega a ideia central por si so — nunca depende do \
paragrafo seguinte para fazer sentido.
- Nunca abra com "No mundo atual...", "Na era digital..." ou qualquer \
frase-guarda-chuva. Nunca use "alem disso", "portanto" ou "em suma" como \
muleta de transicao.
- Nunca use listas de tres adjetivos em serie (ex.: "rapido, eficiente e \
confiavel") nem paragrafo-conclusao que apenas resume o que ja foi dito.
- Cada frase acrescenta um fato, uma decisao ou uma nuance nova — corte \
qualquer frase que possa ser removida sem perda. Varie o ritmo entre frases \
curtas e longas.
- Nunca prometa cura, resultado garantido ou diagnostico a distancia. \
Linguagem responsavel e inegociavel, mesmo sob pressao de conversao.
- Termine com uma unica chamada para acao clara e especifica (ex.: "Agende \
uma consulta"), nunca generica ("Clique aqui", "Saiba mais").
- Maximo de 1500 caracteres no total, incluindo de 3 a 6 hashtags relevantes \
ao final.
- Responda apenas com o texto da legenda — sem aspas, sem explicacao, sem \
markdown."""


# --------------------------------------------------------------------------- #
# Erros
# --------------------------------------------------------------------------- #


class ErroPost(RuntimeError):
    """Falha em qualquer etapa da geracao da legenda ou da publicacao."""


class ErroCredencial(ErroPost):
    """Credencial ausente, placeholder ou invalida em .env.local."""


# --------------------------------------------------------------------------- #
# Configuracao
# --------------------------------------------------------------------------- #

_PLACEHOLDERS = ("seu_", "sua_", "your_", "xxx", "<", "changeme")


def _valor_util(valor: str | None) -> str | None:
    """Rejeita vazio e placeholders do .env.local versionado."""
    if not valor:
        return None
    limpo = valor.strip().strip('"').strip("'")
    if not limpo:
        return None
    if limpo.lower().startswith(_PLACEHOLDERS):
        return None
    return limpo


def carregar_configuracao(caminho: Path | None = None) -> dict[str, str | None]:
    """Le as credenciais de .env.local, com fallback no ambiente do processo."""
    arquivo = caminho or ARQUIVO_ENV
    do_arquivo = dotenv_values(arquivo) if arquivo.exists() else {}

    def busca(chave: str) -> str | None:
        return _valor_util(do_arquivo.get(chave)) or _valor_util(os.environ.get(chave))

    return {
        "anthropic_api_key": busca("ANTHROPIC_API_KEY"),
        "composio_api_key": busca("COMPOSIO_API_KEY"),
        "ig_user_id": busca("INSTAGRAM_ACCOUNT_ID") or busca("IG_USER_ID"),
        "composio_user_id": busca("COMPOSIO_USER_ID") or "default",
        "media_url_padrao": busca("INSTAGRAM_MEDIA_URL_PADRAO"),
    }


# --------------------------------------------------------------------------- #
# Geracao da legenda (Anthropic)
# --------------------------------------------------------------------------- #


def escolher_pilar(referencia: date | None = None) -> str:
    """Pilar do dia, por rotacao deterministica — mesma escolha se chamado
    mais de uma vez no mesmo dia (importante para retries do agendador)."""
    dia_do_ano = (referencia or date.today()).timetuple().tm_yday
    return PILARES[dia_do_ano % len(PILARES)]


def gerar_legenda(tema: str, *, client: anthropic.Anthropic) -> str:
    """Gera a legenda do dia com Claude, seguindo a voz de marca e as regras
    de compliance de saude mental. Levanta ErroPost se Claude recusar, se a
    resposta vier sem texto, ou se exceder o limite de caracteres do Instagram.
    """
    resposta = client.messages.create(
        model=MODELO,
        max_tokens=4096,
        system=[
            {
                "type": "text",
                "text": SISTEMA_LEGENDA,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        thinking={"type": "adaptive"},
        output_config={"effort": "medium"},
        messages=[
            {"role": "user", "content": f"Escreva a legenda de hoje sobre: {tema}."}
        ],
    )

    if resposta.stop_reason == "refusal":
        detalhe = resposta.stop_details.explanation if resposta.stop_details else "sem detalhe"
        raise ErroPost(f"Claude recusou gerar a legenda ({detalhe}).")

    legenda = next((b.text for b in resposta.content if b.type == "text"), "").strip()
    if not legenda:
        raise ErroPost("Resposta da Anthropic nao trouxe texto de legenda.")
    if len(legenda) > LIMITE_LEGENDA:
        raise ErroPost(
            f"Legenda gerada com {len(legenda)} caracteres excede o limite de {LIMITE_LEGENDA} do Instagram."
        )
    return legenda


# --------------------------------------------------------------------------- #
# Publicacao (Composio)
# --------------------------------------------------------------------------- #


def _extrair_campo(resultado: Any, campo: str) -> str | None:
    """Le um campo do retorno de sessao.execute(), tolerando tanto o envelope
    {"data": {...}, "successful": bool, "error": ...} quanto o dict puro."""
    if not isinstance(resultado, dict):
        return None
    if resultado.get("successful") is False:
        raise ErroPost(f"Acao Composio falhou: {resultado.get('error') or resultado}")
    dados = resultado.get("data", resultado)
    if isinstance(dados, dict):
        return dados.get(campo)
    return None


def publicar_composio(
    media_url: str,
    legenda: str,
    *,
    ig_user_id: str,
    composio_api_key: str,
    composio_user_id: str,
    media_type: str = "IMAGE",
    timeout_s: int = TIMEOUT_PUBLICACAO_S,
) -> str:
    """Publica midia + legenda no Instagram via toolkit Instagram da Composio.

    Segue o mesmo fluxo oficial de 2 etapas da Meta Graph API (criar
    container -> publicar), mas delegado a Composio, que mantem a conexao
    OAuth da conta Instagram e evita a renovacao manual de token.
    """
    from composio import Composio  # import tardio: so quem publica precisa do SDK

    composio = Composio(api_key=composio_api_key)
    sessao = composio.create(user_id=composio_user_id)

    campos_midia = (
        {"image_url": media_url} if media_type == "IMAGE" else {"video_url": media_url}
    )
    container = sessao.execute(
        tool_slug="INSTAGRAM_POST_IG_USER_MEDIA",
        arguments={
            "ig_user_id": ig_user_id,
            "caption": legenda,
            "media_type": media_type,
            **campos_midia,
        },
    )
    creation_id = _extrair_campo(container, "id") or _extrair_campo(container, "creation_id")
    if not creation_id:
        raise ErroPost(f"INSTAGRAM_POST_IG_USER_MEDIA nao devolveu creation_id: {container}")

    publicado = sessao.execute(
        tool_slug="INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH",
        arguments={
            "ig_user_id": ig_user_id,
            "creation_id": creation_id,
            "max_wait_seconds": timeout_s,
        },
    )
    media_id = _extrair_campo(publicado, "id")
    if not media_id:
        raise ErroPost(f"INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH nao devolveu id: {publicado}")
    return media_id


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #


def _montar_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="post_instagram.py",
        description="Gera legendas de saude mental com Claude e publica no Instagram via Composio.",
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="log detalhado de cada etapa")
    sub = parser.add_subparsers(dest="comando", required=True)

    p_gerar = sub.add_parser("gerar", help="gerar so a legenda (sem publicar)")
    p_gerar.add_argument("--tema", default=None, help="tema da legenda; default: pilar do dia")

    p_publicar = sub.add_parser(
        "publicar", help="gerar a legenda do dia e publicar no Instagram via Composio"
    )
    p_publicar.add_argument(
        "--media-url", default=None, help="URL HTTPS da midia; default: INSTAGRAM_MEDIA_URL_PADRAO"
    )
    p_publicar.add_argument("--tema", default=None, help="tema da legenda; default: pilar do dia")
    p_publicar.add_argument(
        "--tipo-midia", choices=["imagem", "video"], default="imagem", help="tipo da midia em --media-url"
    )
    p_publicar.add_argument(
        "--dry-run", action="store_true", help="gerar e mostrar a legenda, sem chamar a Composio"
    )

    return parser


def main(argv: list[str] | None = None) -> int:
    args = _montar_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.INFO if args.verbose else logging.WARNING,
        format="%(asctime)s  %(message)s",
        datefmt="%H:%M:%S",
    )

    config = carregar_configuracao()
    if not config["anthropic_api_key"]:
        print("Erro: preencha ANTHROPIC_API_KEY em .env.local.", file=sys.stderr)
        return 1

    tema = args.tema or escolher_pilar()
    client = anthropic.Anthropic(api_key=config["anthropic_api_key"])

    try:
        legenda = gerar_legenda(tema, client=client)
        print(legenda)

        if args.comando == "gerar":
            return 0

        if args.dry_run:
            print("\n[dry-run] legenda gerada — nenhuma chamada a Composio foi feita.")
            return 0

        media_url = args.media_url or config["media_url_padrao"]
        if not media_url:
            print(
                "Erro: informe --media-url ou preencha INSTAGRAM_MEDIA_URL_PADRAO em .env.local.",
                file=sys.stderr,
            )
            return 1

        faltando = [
            nome
            for nome, valor in (
                ("COMPOSIO_API_KEY", config["composio_api_key"]),
                ("INSTAGRAM_ACCOUNT_ID", config["ig_user_id"]),
            )
            if not valor
        ]
        if faltando:
            print(f"Erro: preencha {' e '.join(faltando)} em .env.local.", file=sys.stderr)
            return 1

        media_id = publicar_composio(
            media_url,
            legenda,
            ig_user_id=config["ig_user_id"],  # type: ignore[arg-type]
            composio_api_key=config["composio_api_key"],  # type: ignore[arg-type]
            composio_user_id=config["composio_user_id"],  # type: ignore[arg-type]
            media_type="VIDEO" if args.tipo_midia == "video" else "IMAGE",
        )
        print(f"\nPublicado no Instagram via Composio. media_id={media_id}")

    except anthropic.AuthenticationError:
        print("Erro: ANTHROPIC_API_KEY invalida.", file=sys.stderr)
        return 1
    except anthropic.RateLimitError as exc:
        print(f"Erro: limite de taxa da Anthropic atingido — {exc}", file=sys.stderr)
        return 1
    except anthropic.APIStatusError as exc:
        print(f"Erro: falha na API da Anthropic — {exc}", file=sys.stderr)
        return 1
    except anthropic.APIConnectionError:
        print("Erro: falha de rede ao chamar a Anthropic.", file=sys.stderr)
        return 1
    except ErroPost as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
