"""Publicacao no Instagram via Meta Graph API v19.0 (Dr. Saude Mental).

Cobre Reels, Stories e Carrosseis seguindo o fluxo oficial de 2 etapas:

    1. POST /{ig-user-id}/media           -> devolve creation_id (container)
    2. GET  /{creation_id}?fields=status_code  -> poll ate FINISHED
    3. POST /{ig-user-id}/media_publish   -> publica o container

Credenciais sao lidas de .env.local na raiz do projeto:

    INSTAGRAM_ACCOUNT_ID=<id da conta Instagram Business/Creator>
    INSTAGRAM_ACCESS_TOKEN=<token de longa duracao, 60 dias>

Opcionais, usados apenas por renovar_token_longa_duracao():

    FACEBOOK_APP_ID=<app id>
    FACEBOOK_APP_SECRET=<app secret>

Dependencias: requests, python-dotenv.

Uso via linha de comando:

    python publicar_instagram.py reels     --video-url URL --legenda "texto"
    python publicar_instagram.py story     --media-url URL [--tipo video]
    python publicar_instagram.py carrossel --midias URL1 URL2 ... --legenda "texto"
    python publicar_instagram.py limite
    python publicar_instagram.py renovar-token

Observacao sobre as URLs: a Meta baixa a midia do servidor de origem, entao todo
arquivo precisa estar em URL publica HTTPS (nao aceita caminho local).

--- Modo Local Assistant (sem Meta API) ---

Para quem vai publicar manualmente (sem token do Instagram, sem chamar a API):
o subcomando `local` le CONTEUDO_INSTAGRAM/CALENDARIO_30_DIAS.md e empacota
cada post em prontos_para_postar/<NN>-<slug>/, com as midias ja renderizadas
de carrosseis-instagram/<slug>/ copiadas e um legenda.txt pronto pra colar.
Nao faz nenhuma chamada de rede nem exige credencial.

    python publicar_instagram.py local --dia 1
    python publicar_instagram.py local --slug burnout-medicos-enfermeiros
    python publicar_instagram.py local --todos
"""

from __future__ import annotations

import argparse
import logging
import os
import random
import re
import shutil
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Sequence

import requests
from dotenv import dotenv_values

# --------------------------------------------------------------------------- #
# Constantes
# --------------------------------------------------------------------------- #

VERSAO_API = "v19.0"
BASE_URL = f"https://graph.facebook.com/{VERSAO_API}"
ARQUIVO_ENV = Path(__file__).resolve().parent / ".env.local"

LIMITE_LEGENDA = 2_200
LIMITE_HASHTAGS = 30
CARROSSEL_MIN = 2
CARROSSEL_MAX = 10

# Poll do container. Reels de ~60s costumam terminar em 15-40s; o teto de 5 min
# cobre video pesado sem deixar o processo pendurado indefinidamente.
POLL_INTERVALO_S = 5
POLL_TIMEOUT_S = 300

# Backoff para HTTP 429 / 5xx.
TENTATIVAS_MAX = 5
BACKOFF_BASE_S = 2.0
BACKOFF_TETO_S = 60.0

TIMEOUT_HTTP = (10, 60)  # (connect, read)

# Modo Local Assistant — nao usa a Meta API, so o sistema de arquivos local.
RAIZ_PROJETO = ARQUIVO_ENV.parent
PASTA_CARROSSEIS = RAIZ_PROJETO / "carrosseis-instagram"
PASTA_PRONTOS = RAIZ_PROJETO / "prontos_para_postar"
CALENDARIO_MD = RAIZ_PROJETO / "CONTEUDO_INSTAGRAM" / "CALENDARIO_30_DIAS.md"
# Usado so para montar a URL do artigo que substitui [LINK] na legenda.
SITE_BASE_URL = os.environ.get("SITE_BASE_URL", "https://drsaudemental.com").rstrip("/")
EXTENSOES_MIDIA_LOCAL = {".png", ".jpg", ".jpeg", ".webp", ".mp4", ".mov"}

log = logging.getLogger("publicar_instagram")


# --------------------------------------------------------------------------- #
# Erros
# --------------------------------------------------------------------------- #


class ErroInstagram(RuntimeError):
    """Falha em qualquer etapa do fluxo de publicacao."""


class ErroCredencial(ErroInstagram):
    """Credencial ausente, placeholder ou invalida em .env.local."""


class ErroProcessamento(ErroInstagram):
    """Container retornou ERROR/EXPIRED ou estourou o tempo de processamento."""


class ErroCalendario(ErroInstagram):
    """Falha ao ler CALENDARIO_30_DIAS.md ou localizar midias locais (modo Local Assistant)."""


# --------------------------------------------------------------------------- #
# Credenciais
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


def carregar_credenciais(caminho: Path | None = None) -> tuple[str, str]:
    """Le (account_id, access_token) de .env.local, com fallback no ambiente.

    Levanta ErroCredencial com instrucao acionavel quando algo falta — evita o
    erro generico "OAuthException" da Meta, que nao diz o que preencher.
    """
    arquivo = caminho or ARQUIVO_ENV
    do_arquivo = dotenv_values(arquivo) if arquivo.exists() else {}

    def busca(*chaves: str) -> str | None:
        for chave in chaves:
            valor = _valor_util(do_arquivo.get(chave)) or _valor_util(os.environ.get(chave))
            if valor:
                return valor
        return None

    account_id = busca("INSTAGRAM_ACCOUNT_ID", "IG_USER_ID", "INSTAGRAM_BUSINESS_ACCOUNT_ID")
    token = busca("INSTAGRAM_ACCESS_TOKEN", "IG_ACCESS_TOKEN", "META_ACCESS_TOKEN")

    faltando = [
        nome
        for nome, valor in (("INSTAGRAM_ACCOUNT_ID", account_id), ("INSTAGRAM_ACCESS_TOKEN", token))
        if not valor
    ]
    if faltando:
        raise ErroCredencial(
            f"Preencha {' e '.join(faltando)} em {arquivo}. "
            "O account id e o ID numerico da conta Instagram Business vinculada a Pagina; "
            "o token precisa ser de longa duracao (60 dias) com as permissoes "
            "instagram_basic, instagram_content_publish e pages_read_engagement."
        )

    return account_id, token  # type: ignore[return-value]


# --------------------------------------------------------------------------- #
# Camada HTTP com backoff
# --------------------------------------------------------------------------- #


def _espera_backoff(tentativa: int, resposta: requests.Response | None) -> float:
    """Retry-After quando a Meta manda; senao exponencial com jitter."""
    if resposta is not None:
        cabecalho = resposta.headers.get("Retry-After")
        if cabecalho:
            try:
                return min(float(cabecalho), BACKOFF_TETO_S)
            except ValueError:
                pass
    espera = min(BACKOFF_BASE_S * (2 ** (tentativa - 1)), BACKOFF_TETO_S)
    return espera + random.uniform(0, espera * 0.25)


def _mensagem_erro(resposta: requests.Response) -> str:
    try:
        erro = resposta.json().get("error", {})
    except ValueError:
        return f"HTTP {resposta.status_code}: {resposta.text[:300]}"
    partes = [
        f"HTTP {resposta.status_code}",
        erro.get("message", ""),
        f"(code={erro.get('code')}, subcode={erro.get('error_subcode')})",
    ]
    if erro.get("error_user_msg"):
        partes.append(f"- {erro['error_user_msg']}")
    return " ".join(p for p in partes if p).strip()


def _requisicao(metodo: str, caminho: str, token: str, **parametros: Any) -> dict[str, Any]:
    """Chamada a Graph API com retry em 429 e 5xx.

    O token vai no corpo (POST) ou na query (GET) — nunca logado.
    """
    url = f"{BASE_URL}/{caminho.lstrip('/')}"
    dados = {k: v for k, v in parametros.items() if v is not None}
    dados["access_token"] = token

    ultima_falha = ""
    for tentativa in range(1, TENTATIVAS_MAX + 1):
        try:
            if metodo == "GET":
                resposta = requests.get(url, params=dados, timeout=TIMEOUT_HTTP)
            else:
                resposta = requests.post(url, data=dados, timeout=TIMEOUT_HTTP)
        except requests.RequestException as exc:
            ultima_falha = f"falha de rede: {exc}"
            if tentativa == TENTATIVAS_MAX:
                break
            espera = _espera_backoff(tentativa, None)
            log.warning("%s — nova tentativa em %.1fs (%d/%d)", ultima_falha, espera, tentativa, TENTATIVAS_MAX)
            time.sleep(espera)
            continue

        if resposta.ok:
            return resposta.json()

        ultima_falha = _mensagem_erro(resposta)

        # 429 = rate limit da app/conta; 4 = "Application request limit reached".
        recuperavel = resposta.status_code == 429 or resposta.status_code >= 500
        if not recuperavel or tentativa == TENTATIVAS_MAX:
            raise ErroInstagram(f"{metodo} /{caminho} falhou — {ultima_falha}")

        espera = _espera_backoff(tentativa, resposta)
        log.warning(
            "Rate limit/instabilidade em /%s — aguardando %.1fs (%d/%d)",
            caminho,
            espera,
            tentativa,
            TENTATIVAS_MAX,
        )
        time.sleep(espera)

    raise ErroInstagram(f"{metodo} /{caminho} falhou apos {TENTATIVAS_MAX} tentativas — {ultima_falha}")


# --------------------------------------------------------------------------- #
# Validacao de entrada
# --------------------------------------------------------------------------- #


def _validar_url(url: str, rotulo: str = "midia") -> str:
    url = url.strip()
    if not url.lower().startswith("https://"):
        raise ErroInstagram(
            f"URL de {rotulo} precisa ser HTTPS publica (a Meta baixa o arquivo do servidor de origem): {url!r}"
        )
    return url


def _validar_legenda(legenda: str | None) -> str | None:
    if legenda is None:
        return None
    if len(legenda) > LIMITE_LEGENDA:
        raise ErroInstagram(
            f"Legenda com {len(legenda)} caracteres excede o limite de {LIMITE_LEGENDA} do Instagram."
        )
    if legenda.count("#") > LIMITE_HASHTAGS:
        raise ErroInstagram(
            f"Legenda com {legenda.count('#')} hashtags excede o limite de {LIMITE_HASHTAGS} por publicacao."
        )
    return legenda


# --------------------------------------------------------------------------- #
# Etapas do fluxo oficial
# --------------------------------------------------------------------------- #


def criar_container(account_id: str, token: str, **campos: Any) -> str:
    """Etapa 1: POST /{ig-user-id}/media -> creation_id."""
    resposta = _requisicao("POST", f"{account_id}/media", token, **campos)
    creation_id = resposta.get("id")
    if not creation_id:
        raise ErroInstagram(f"Resposta de /media sem creation_id: {resposta}")
    log.info("Container criado: %s", creation_id)
    return creation_id


def aguardar_container(
    creation_id: str,
    token: str,
    timeout_s: int = POLL_TIMEOUT_S,
    intervalo_s: int = POLL_INTERVALO_S,
) -> None:
    """Etapa 2: poll de status_code ate FINISHED.

    Publicar antes de FINISHED devolve erro da Meta, entao esta etapa e
    obrigatoria para video (Reels, Stories em video, itens de carrossel).
    """
    limite = time.monotonic() + timeout_s
    while True:
        resposta = _requisicao(
            "GET", creation_id, token, fields="status_code,status,id"
        )
        status = resposta.get("status_code", "UNKNOWN")

        if status == "FINISHED":
            log.info("Container %s pronto para publicacao.", creation_id)
            return
        if status in {"ERROR", "EXPIRED"}:
            raise ErroProcessamento(
                f"Container {creation_id} terminou como {status}: {resposta.get('status', 'sem detalhe')}"
            )

        if time.monotonic() >= limite:
            raise ErroProcessamento(
                f"Container {creation_id} continuou em {status} apos {timeout_s}s. "
                "Verifique tamanho, codec e duracao do arquivo de origem."
            )

        log.info("Container %s em %s — nova checagem em %ds.", creation_id, status, intervalo_s)
        time.sleep(intervalo_s)


def publicar_container(account_id: str, token: str, creation_id: str) -> str:
    """Etapa 3: POST /{ig-user-id}/media_publish -> id da publicacao."""
    resposta = _requisicao("POST", f"{account_id}/media_publish", token, creation_id=creation_id)
    media_id = resposta.get("id")
    if not media_id:
        raise ErroInstagram(f"Resposta de /media_publish sem id: {resposta}")
    log.info("Publicado: %s", media_id)
    return media_id


def _fluxo_completo(
    account_id: str,
    token: str,
    campos: dict[str, Any],
    aguardar: bool = True,
    timeout_s: int = POLL_TIMEOUT_S,
) -> str:
    creation_id = criar_container(account_id, token, **campos)
    if aguardar:
        aguardar_container(creation_id, token, timeout_s=timeout_s)
    return publicar_container(account_id, token, creation_id)


# --------------------------------------------------------------------------- #
# API publica
# --------------------------------------------------------------------------- #


def publicar_reels(
    video_url: str,
    legenda: str | None = None,
    *,
    cover_url: str | None = None,
    thumb_offset: int | None = None,
    share_to_feed: bool = True,
    localizacao_id: str | None = None,
    colaboradores: Sequence[str] | None = None,
    credenciais: tuple[str, str] | None = None,
    timeout_s: int = POLL_TIMEOUT_S,
) -> str:
    """Publica um Reels (video 9:16, 3s a 15min).

    cover_url tem prioridade sobre thumb_offset quando os dois vem preenchidos.
    share_to_feed=True mantem o Reels tambem na grade do perfil.
    Retorna o media_id da publicacao.
    """
    account_id, token = credenciais or carregar_credenciais()
    campos: dict[str, Any] = {
        "media_type": "REELS",
        "video_url": _validar_url(video_url, "video"),
        "caption": _validar_legenda(legenda),
        "share_to_feed": "true" if share_to_feed else "false",
        "location_id": localizacao_id,
    }
    if cover_url:
        campos["cover_url"] = _validar_url(cover_url, "capa")
    elif thumb_offset is not None:
        campos["thumb_offset"] = int(thumb_offset)
    if colaboradores:
        campos["collaborators"] = ",".join(colaboradores)

    log.info("Publicando Reels...")
    return _fluxo_completo(account_id, token, campos, timeout_s=timeout_s)


def publicar_story(
    media_url: str,
    *,
    tipo: str = "imagem",
    credenciais: tuple[str, str] | None = None,
    timeout_s: int = POLL_TIMEOUT_S,
) -> str:
    """Publica um Story (imagem ou video ate 60s). Retorna o media_id.

    tipo: "imagem" ou "video". Story nao aceita legenda pela API — stickers,
    enquetes e link precisam ser aplicados no app.
    """
    account_id, token = credenciais or carregar_credenciais()
    normalizado = tipo.strip().lower()
    if normalizado in {"imagem", "image", "foto"}:
        chave = "image_url"
    elif normalizado in {"video", "vídeo"}:
        chave = "video_url"
    else:
        raise ErroInstagram(f"tipo de story invalido: {tipo!r}. Use 'imagem' ou 'video'.")

    campos = {"media_type": "STORIES", chave: _validar_url(media_url, "story")}

    log.info("Publicando Story (%s)...", normalizado)
    # Imagem processa de imediato, mas o poll e barato e evita corrida no publish.
    return _fluxo_completo(account_id, token, campos, aguardar=True, timeout_s=timeout_s)


def publicar_carrossel(
    midias: Iterable[str | dict[str, Any]],
    legenda: str | None = None,
    *,
    localizacao_id: str | None = None,
    credenciais: tuple[str, str] | None = None,
    timeout_s: int = POLL_TIMEOUT_S,
) -> str:
    """Publica um carrossel de 2 a 10 itens. Retorna o media_id.

    Cada item pode ser a URL direta (tratada como imagem) ou um dict:
        {"url": "https://...", "tipo": "video"}
    Os containers filhos sao criados com is_carousel_item=true e so entram no
    container pai depois de FINISHED — publicar antes descarta itens em silencio.
    """
    itens = list(midias)
    if not CARROSSEL_MIN <= len(itens) <= CARROSSEL_MAX:
        raise ErroInstagram(
            f"Carrossel aceita de {CARROSSEL_MIN} a {CARROSSEL_MAX} itens; recebidos {len(itens)}."
        )
    _validar_legenda(legenda)
    account_id, token = credenciais or carregar_credenciais()

    filhos: list[str] = []
    for indice, item in enumerate(itens, start=1):
        if isinstance(item, str):
            url, tipo = item, "imagem"
        else:
            url, tipo = item["url"], str(item.get("tipo", "imagem"))

        e_video = tipo.strip().lower() in {"video", "vídeo"}
        campos: dict[str, Any] = {"is_carousel_item": "true"}
        if e_video:
            campos["media_type"] = "VIDEO"
            campos["video_url"] = _validar_url(url, f"item {indice}")
        else:
            campos["image_url"] = _validar_url(url, f"item {indice}")

        log.info("Carrossel — criando item %d/%d (%s).", indice, len(itens), "video" if e_video else "imagem")
        creation_id = criar_container(account_id, token, **campos)
        aguardar_container(creation_id, token, timeout_s=timeout_s)
        filhos.append(creation_id)

    log.info("Carrossel — montando container pai com %d itens.", len(filhos))
    campos_pai = {
        "media_type": "CAROUSEL",
        "children": ",".join(filhos),
        "caption": legenda,
        "location_id": localizacao_id,
    }
    return _fluxo_completo(account_id, token, campos_pai, timeout_s=timeout_s)


def consultar_limite_publicacao(credenciais: tuple[str, str] | None = None) -> dict[str, Any]:
    """Quota de publicacao das ultimas 24h (teto de 50 posts por conta)."""
    account_id, token = credenciais or carregar_credenciais()
    resposta = _requisicao(
        "GET",
        f"{account_id}/content_publishing_limit",
        token,
        fields="config,quota_usage",
    )
    dados = (resposta.get("data") or [{}])[0]
    return {
        "usado": dados.get("quota_usage", 0),
        "teto": (dados.get("config") or {}).get("quota_total", 50),
        "janela_horas": (dados.get("config") or {}).get("quota_duration", 86_400) // 3_600,
    }


def renovar_token_longa_duracao(credenciais: tuple[str, str] | None = None) -> dict[str, Any]:
    """Troca o token atual por um novo de longa duracao (~60 dias).

    Exige FACEBOOK_APP_ID e FACEBOOK_APP_SECRET em .env.local. O token retornado
    NAO e gravado automaticamente — copie para .env.local depois de conferir.
    """
    _, token = credenciais or carregar_credenciais()
    valores = dotenv_values(ARQUIVO_ENV) if ARQUIVO_ENV.exists() else {}
    app_id = _valor_util(valores.get("FACEBOOK_APP_ID")) or _valor_util(os.environ.get("FACEBOOK_APP_ID"))
    app_secret = _valor_util(valores.get("FACEBOOK_APP_SECRET")) or _valor_util(
        os.environ.get("FACEBOOK_APP_SECRET")
    )
    if not app_id or not app_secret:
        raise ErroCredencial(
            "Renovacao exige FACEBOOK_APP_ID e FACEBOOK_APP_SECRET em .env.local."
        )

    url = f"{BASE_URL}/oauth/access_token"
    resposta = requests.get(
        url,
        params={
            "grant_type": "fb_exchange_token",
            "client_id": app_id,
            "client_secret": app_secret,
            "fb_exchange_token": token,
        },
        timeout=TIMEOUT_HTTP,
    )
    if not resposta.ok:
        raise ErroInstagram(f"Renovacao de token falhou — {_mensagem_erro(resposta)}")

    dados = resposta.json()
    return {
        "access_token": dados.get("access_token", ""),
        "expira_em_dias": round(int(dados.get("expires_in", 0)) / 86_400, 1),
    }


# --------------------------------------------------------------------------- #
# Modo Local Assistant — le CALENDARIO_30_DIAS.md e empacota localmente,
# sem chamar a Meta API. Para quem publica manualmente pelo app.
# --------------------------------------------------------------------------- #


@dataclass(frozen=True)
class PostCalendario:
    """Um post do calendario, ja com [LINK] resolvido na legenda."""

    dia: int
    dia_semana: str
    data: str  # "14/09" (sem ano — ver `ano`)
    ano: int
    pilar: str
    titulo: str
    slug: str
    legenda: str  # legenda sugerida + hashtags fixas + hashtags extras, pronta pra colar
    hashtags_extras: str


_PADRAO_DIA_CALENDARIO = re.compile(
    r"^## Dia (?P<dia>\d+) — (?P<dia_semana>[^,]+), (?P<data>\d{2}/\d{2}) — (?P<pilar>.+)$",
    re.MULTILINE,
)
_PADRAO_ARTIGO_CALENDARIO = re.compile(r"\*\*Artigo-base:\*\*\s*\"(?P<titulo>[^\"]+)\"\s*\(`(?P<slug>[^`]+)`\)")
_PADRAO_LEGENDA_CALENDARIO = re.compile(
    r"\*\*Legenda sugerida:\*\*\s*\n(?P<legenda>.*?)\n\n\*\*Hashtags extras:\*\*\s*(?P<hashtags>[^\n]+)",
    re.DOTALL,
)
_PADRAO_HASHTAGS_FIXAS = re.compile(r"```\n(?P<bloco>#saudemental.*?)\n```", re.DOTALL)
_PADRAO_ANO_CAMPANHA = re.compile(r"\d{2}/\d{2}/(?P<ano>\d{4})")


def carregar_calendario(caminho: Path | None = None) -> list[PostCalendario]:
    """Le CALENDARIO_30_DIAS.md e devolve os posts em ordem, com [LINK] ja
    trocado pela URL real do artigo (SITE_BASE_URL/blog/<slug>), conforme a
    propria instrucao do calendario ("Troque [LINK] pelo link do artigo").
    """
    arquivo = caminho or CALENDARIO_MD
    if not arquivo.exists():
        raise ErroCalendario(f"Calendario nao encontrado: {arquivo}")
    texto = arquivo.read_text(encoding="utf-8")

    fixas_m = _PADRAO_HASHTAGS_FIXAS.search(texto)
    hashtags_fixas = fixas_m.group("bloco").strip() if fixas_m else ""

    ano_m = _PADRAO_ANO_CAMPANHA.search(texto)
    ano_campanha = int(ano_m.group("ano")) if ano_m else datetime.now().year

    cabecalhos = list(_PADRAO_DIA_CALENDARIO.finditer(texto))
    if not cabecalhos:
        raise ErroCalendario(f"Nenhum cabecalho '## Dia N' encontrado em {arquivo} — o formato mudou?")

    posts: list[PostCalendario] = []
    for i, m in enumerate(cabecalhos):
        inicio = m.end()
        fim = cabecalhos[i + 1].start() if i + 1 < len(cabecalhos) else len(texto)
        bloco = texto[inicio:fim]

        artigo_m = _PADRAO_ARTIGO_CALENDARIO.search(bloco)
        legenda_m = _PADRAO_LEGENDA_CALENDARIO.search(bloco)
        if not artigo_m or not legenda_m:
            raise ErroCalendario(
                f"Dia {m.group('dia')}: nao consegui extrair 'Artigo-base' ou 'Legenda sugerida' — "
                "verifique se a secao segue o template padrao do calendario."
            )

        slug = artigo_m.group("slug")
        artigo_url = f"{SITE_BASE_URL}/blog/{slug}"
        legenda_corpo = legenda_m.group("legenda").strip().replace("[LINK]", artigo_url)
        hashtags_extras = legenda_m.group("hashtags").strip()
        legenda_final = "\n\n".join(p for p in (legenda_corpo, hashtags_fixas, hashtags_extras) if p)

        posts.append(
            PostCalendario(
                dia=int(m.group("dia")),
                dia_semana=m.group("dia_semana").strip(),
                data=m.group("data"),
                ano=ano_campanha,
                pilar=m.group("pilar").strip(),
                titulo=artigo_m.group("titulo"),
                slug=slug,
                legenda=legenda_final,
                hashtags_extras=hashtags_extras,
            )
        )
    return posts


def _avisos_legenda(legenda: str) -> list[str]:
    """Mesmos limites do Instagram usados na publicacao real, mas aqui so como
    aviso — modo local nao deve travar por causa de um post longo demais."""
    avisos = []
    if len(legenda) > LIMITE_LEGENDA:
        avisos.append(f"legenda com {len(legenda)} caracteres (limite do Instagram: {LIMITE_LEGENDA}).")
    total_hashtags = legenda.count("#")
    if total_hashtags > LIMITE_HASHTAGS:
        avisos.append(f"{total_hashtags} hashtags (limite do Instagram: {LIMITE_HASHTAGS}).")
    return avisos


def _selecionar_posts(
    posts: Sequence[PostCalendario],
    *,
    dia: int | None = None,
    slug: str | None = None,
    todos: bool = False,
) -> list[PostCalendario]:
    if todos:
        return list(posts)
    if dia is not None:
        encontrado = next((p for p in posts if p.dia == dia), None)
        if not encontrado:
            raise ErroCalendario(f"Dia {dia} nao existe no calendario (vai de 1 a {len(posts)}).")
        return [encontrado]
    if slug is not None:
        encontrado = next((p for p in posts if p.slug == slug), None)
        if not encontrado:
            disponiveis = ", ".join(p.slug for p in posts)
            raise ErroCalendario(f"Slug {slug!r} nao esta no calendario. Disponiveis: {disponiveis}")
        return [encontrado]
    raise ErroCalendario("Informe dia, slug ou todos=True para selecionar os posts.")


_PADRAO_PREFIXO_NUMERICO = re.compile(r"^(\d+)-")


def _listar_midias_atuais(pasta: Path) -> list[Path]:
    """Lista as midias de uma pasta de carrossel, em ordem, descartando slides
    obsoletos deixados por uma regeneracao anterior com estrutura diferente.

    Achado real no projeto: como o gerador (backend/tools/gerar-carrosseis.js)
    nao limpa a pasta antes de escrever, uma pasta regenerada com uma slide a
    menos pode deixar para tras um arquivo do mesmo indice (ex.: "03-cta.png"
    de uma versao antiga de 6 slides, ao lado do atual "03-conteudo.png" de
    uma versao de 5). Entre arquivos com o mesmo prefixo numerico, mantem
    so o mais recente — confirmado contra o `slides:` de info.txt em todas
    as pastas do projeto no momento em que este script foi escrito.
    """
    candidatos = [
        p for p in pasta.iterdir() if p.is_file() and p.suffix.lower() in EXTENSOES_MIDIA_LOCAL
    ]
    grupos: dict[str, list[Path]] = {}
    for arquivo in candidatos:
        m = _PADRAO_PREFIXO_NUMERICO.match(arquivo.name)
        chave = m.group(1) if m else arquivo.name
        grupos.setdefault(chave, []).append(arquivo)

    mais_recentes = [max(grupo, key=lambda p: p.stat().st_mtime) for grupo in grupos.values()]
    return sorted(mais_recentes, key=lambda p: p.name)


def preparar_post_local(post: PostCalendario, *, forcar: bool = False) -> Path:
    """Copia as midias ja renderizadas de carrosseis-instagram/<slug>/ para
    prontos_para_postar/<NN>-<slug>/, escreve legenda.txt (pronta pra colar)
    e info.txt (metadados de agenda). 100% local — nenhuma chamada de rede.
    """
    pasta_origem = PASTA_CARROSSEIS / post.slug
    if not pasta_origem.is_dir():
        raise ErroCalendario(
            f"Dia {post.dia} ({post.slug}): pasta {pasta_origem} nao existe. "
            f"Gere as imagens primeiro: npm run carrosseis -- --slug={post.slug}"
        )

    midias = _listar_midias_atuais(pasta_origem)
    if not midias:
        raise ErroCalendario(f"Dia {post.dia} ({post.slug}): nenhuma midia encontrada em {pasta_origem}.")

    pasta_destino = PASTA_PRONTOS / f"{post.dia:02d}-{post.slug}"
    pasta_destino.mkdir(parents=True, exist_ok=True)

    nomes_atuais = {midia.name for midia in midias}
    for midia in midias:
        destino = pasta_destino / midia.name
        # So recopia se for novo, forcado, ou se a origem mudou desde a ultima copia.
        if forcar or not destino.exists() or destino.stat().st_mtime < midia.stat().st_mtime:
            shutil.copy2(midia, destino)

    # Remove sobras de uma execucao anterior — ex.: slide que existia numa
    # versao mais antiga do carrossel e nao faz mais parte da atual.
    for existente in pasta_destino.iterdir():
        if (
            existente.is_file()
            and existente.suffix.lower() in EXTENSOES_MIDIA_LOCAL
            and existente.name not in nomes_atuais
        ):
            existente.unlink()

    (pasta_destino / "legenda.txt").write_text(post.legenda + "\n", encoding="utf-8")

    info = (
        f"dia: {post.dia}\n"
        f"data: {post.data}/{post.ano} ({post.dia_semana})\n"
        f"pilar: {post.pilar}\n"
        f"titulo: {post.titulo}\n"
        f"slug: {post.slug}\n"
        f"artigo: {SITE_BASE_URL}/blog/{post.slug}\n"
        f"midias: {len(midias)}\n"
        f"gerado em: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}\n"
    )
    (pasta_destino / "info.txt").write_text(info, encoding="utf-8")

    for aviso in _avisos_legenda(post.legenda):
        log.warning("Dia %d (%s): %s", post.dia, post.slug, aviso)

    log.info("Dia %d — %s pronto em %s (%d midias).", post.dia, post.slug, pasta_destino, len(midias))
    return pasta_destino


def _gravar_agenda(preparados: list[tuple[Path, PostCalendario]]) -> None:
    """Indice legivel em prontos_para_postar/_AGENDA.txt quando mais de um
    post e preparado na mesma chamada — ordem e datas pra quem vai postar."""
    linhas = ["Agenda de publicacao — gerado por publicar_instagram.py (modo local)", ""]
    for pasta, post in preparados:
        linhas.append(f"Dia {post.dia:02d} — {post.dia_semana}, {post.data}/{post.ano} — {post.pilar}")
        linhas.append(f"  Pasta:  {pasta.name}")
        linhas.append(f"  Titulo: {post.titulo}")
        linhas.append("")
    (PASTA_PRONTOS / "_AGENDA.txt").write_text("\n".join(linhas), encoding="utf-8")


def preparar_local(
    *,
    dia: int | None = None,
    slug: str | None = None,
    todos: bool = False,
    forcar: bool = False,
    calendario: Path | None = None,
) -> list[Path]:
    """Modo Local Assistant: prepara 1, 1 por slug, ou todos os posts do
    CALENDARIO_30_DIAS.md em prontos_para_postar/, sem chamar a Meta API.

    Um post com pasta de midia ausente e pulado (nao aborta o lote inteiro);
    os erros de cada um pulado sao reportados ao final.
    """
    posts = carregar_calendario(calendario)
    selecionados = _selecionar_posts(posts, dia=dia, slug=slug, todos=todos)

    preparados: list[tuple[Path, PostCalendario]] = []
    erros: list[str] = []
    for post in selecionados:
        try:
            pasta = preparar_post_local(post, forcar=forcar)
            preparados.append((pasta, post))
        except ErroCalendario as exc:
            erros.append(str(exc))
            log.warning("Pulando dia %d: %s", post.dia, exc)

    if erros and not preparados:
        raise ErroCalendario("Nenhum post preparado:\n" + "\n".join(erros))

    if len(preparados) > 1:
        PASTA_PRONTOS.mkdir(parents=True, exist_ok=True)
        _gravar_agenda(preparados)

    if erros:
        print(f"Aviso: {len(erros)} post(s) pulado(s) por erro:", file=sys.stderr)
        for e in erros:
            print(f"  - {e}", file=sys.stderr)

    return [pasta for pasta, _ in preparados]


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #


def _montar_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="publicar_instagram.py",
        description="Publica Reels, Stories e Carrosseis no Instagram via Meta Graph API v19.0.",
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="log detalhado de cada etapa")
    sub = parser.add_subparsers(dest="comando", required=True)

    p_reels = sub.add_parser("reels", help="publicar um Reels")
    p_reels.add_argument("--video-url", required=True)
    p_reels.add_argument("--legenda", default=None)
    p_reels.add_argument("--cover-url", default=None, help="URL da capa (prioridade sobre --thumb-offset)")
    p_reels.add_argument("--thumb-offset", type=int, default=None, help="ms do frame usado como capa")
    p_reels.add_argument(
        "--sem-feed", action="store_true", help="nao exibir o Reels na grade do perfil"
    )

    p_story = sub.add_parser("story", help="publicar um Story")
    p_story.add_argument("--media-url", required=True)
    p_story.add_argument("--tipo", choices=["imagem", "video"], default="imagem")

    p_carrossel = sub.add_parser("carrossel", help="publicar um carrossel (2 a 10 itens)")
    p_carrossel.add_argument("--midias", nargs="+", required=True, help="URLs na ordem dos slides")
    p_carrossel.add_argument("--legenda", default=None)
    p_carrossel.add_argument(
        "--videos",
        nargs="*",
        type=int,
        default=[],
        help="indices (1-based) de --midias que sao video",
    )

    sub.add_parser("limite", help="consultar quota de publicacao das ultimas 24h")
    sub.add_parser("renovar-token", help="trocar o token atual por um novo de 60 dias")

    p_local = sub.add_parser(
        "local",
        help="Local Assistant: empacota posts do CALENDARIO_30_DIAS.md em prontos_para_postar/ (sem Meta API)",
    )
    selecao = p_local.add_mutually_exclusive_group(required=True)
    selecao.add_argument("--dia", type=int, help="dia do calendario (1 a 30)")
    selecao.add_argument("--slug", help="slug do artigo-base (ex.: burnout-medicos-enfermeiros)")
    selecao.add_argument("--todos", action="store_true", help="preparar todos os posts do calendario")
    p_local.add_argument(
        "--forcar", action="store_true", help="recopiar midias mesmo se o destino ja estiver atualizado"
    )

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = _montar_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.INFO if args.verbose else logging.WARNING,
        format="%(asctime)s  %(message)s",
        datefmt="%H:%M:%S",
    )

    try:
        if args.comando == "reels":
            media_id = publicar_reels(
                args.video_url,
                args.legenda,
                cover_url=args.cover_url,
                thumb_offset=args.thumb_offset,
                share_to_feed=not args.sem_feed,
            )
            print(f"Reels publicado. media_id={media_id}")

        elif args.comando == "story":
            media_id = publicar_story(args.media_url, tipo=args.tipo)
            print(f"Story publicado. media_id={media_id}")

        elif args.comando == "carrossel":
            indices_video = set(args.videos)
            itens = [
                {"url": url, "tipo": "video" if i in indices_video else "imagem"}
                for i, url in enumerate(args.midias, start=1)
            ]
            media_id = publicar_carrossel(itens, args.legenda)
            print(f"Carrossel publicado. media_id={media_id}")

        elif args.comando == "limite":
            limite = consultar_limite_publicacao()
            print(
                f"Publicacoes: {limite['usado']}/{limite['teto']} "
                f"nas ultimas {limite['janela_horas']}h."
            )

        elif args.comando == "renovar-token":
            novo = renovar_token_longa_duracao()
            print(f"Novo token valido por ~{novo['expira_em_dias']} dias.")
            print("Grave em .env.local como INSTAGRAM_ACCESS_TOKEN:")
            print(novo["access_token"])

        elif args.comando == "local":
            pastas = preparar_local(dia=args.dia, slug=args.slug, todos=args.todos, forcar=args.forcar)
            print(f"{len(pastas)} post(s) preparado(s) em {PASTA_PRONTOS}:")
            for pasta in pastas:
                print(f"  - {pasta.relative_to(RAIZ_PROJETO)}")

    except ErroInstagram as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
