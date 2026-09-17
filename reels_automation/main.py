"""CLI do pipeline de automacao de Reels (Dr. Saude Mental).

Exemplos:

    python main.py run-all --tema "ansiedade no trabalho"
    python main.py run-all --numero 1
    python main.py run-all --tema "burnout" --publicar --metodo graph
    python main.py run-all --tema "burnout" --publicar --dry-run

    python main.py roteiro --tema "sono e saude mental"
    python main.py narracao --texto "..." --saida assets/output/teste.mp3
    python main.py legendas --audio assets/output/teste.mp3
    python main.py imagens --prompts "cena 1" "cena 2" --saida-dir assets/images/teste
    python main.py video --imagens-dir assets/images/teste --audio assets/output/teste.mp3 \
        --legendas assets/captions/teste.json --saida assets/output/final.mp4
    python main.py publicar --video assets/output/final.mp4 --slug meu-slug \
        --legenda "..." --tema "..." --metodo graph
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from src.logger import get_logger
from src.utils import PipelineError

logger = get_logger("main")


def _cmd_run_all(args: argparse.Namespace) -> int:
    from src.pipeline import rodar_pipeline

    resultado = rodar_pipeline(
        tema=args.tema,
        numero=args.numero,
        publicar=args.publicar,
        metodo_publicacao=args.metodo,
        dry_run=args.dry_run,
    )
    print(f"\nVideo gerado: {resultado.video_path}")
    if resultado.media_id:
        print(f"Publicado no Instagram. media_id={resultado.media_id}")
    return 0


def _cmd_roteiro(args: argparse.Namespace) -> int:
    from src.llm_ollama import gerar_roteiro

    roteiro = gerar_roteiro(tema=args.tema, numero=args.numero)
    destino = Path(args.saida) if args.saida else Path("assets/output") / f"{roteiro.slug}_roteiro.json"
    roteiro.save(destino)
    print(json.dumps(roteiro.to_dict(), ensure_ascii=False, indent=2))
    return 0


def _cmd_narracao(args: argparse.Namespace) -> int:
    from src.tts_edge import gerar_narracao

    destino = Path(args.saida)
    gerar_narracao(args.texto, destino)
    print(f"Audio gerado: {destino}")
    return 0


def _cmd_legendas(args: argparse.Namespace) -> int:
    from src.transcribe_whisperx import gerar_legendas

    audio_path = Path(args.audio)
    saida_dir = Path(args.saida_dir) if args.saida_dir else audio_path.parent
    srt_path, json_path, chunks = gerar_legendas(audio_path, saida_dir, nome_base=audio_path.stem)
    print(f"SRT: {srt_path}")
    print(f"JSON: {json_path}")
    print(f"{len(chunks)} chunks de legenda gerados.")
    return 0


def _cmd_imagens(args: argparse.Namespace) -> int:
    from src.image_gen_sd import gerar_imagens

    caminhos = gerar_imagens(args.prompts, Path(args.saida_dir), nome_base=args.nome_base)
    for c in caminhos:
        print(c)
    return 0


def _cmd_video(args: argparse.Namespace) -> int:
    from src.transcribe_whisperx import ChunkLegenda
    from src.video_builder import montar_video

    imagens = sorted(Path(args.imagens_dir).glob("*.png")) + sorted(Path(args.imagens_dir).glob("*.jpg"))
    if not imagens:
        raise PipelineError(f"Nenhuma imagem .png/.jpg encontrada em {args.imagens_dir}")

    chunks_data = json.loads(Path(args.legendas).read_text(encoding="utf-8"))
    chunks = [ChunkLegenda(texto=c["texto"], inicio=c["inicio"], fim=c["fim"]) for c in chunks_data]

    destino = Path(args.saida)
    montar_video(imagens=imagens, audio_path=Path(args.audio), chunks_legenda=chunks, destino=destino)
    print(f"Video gerado: {destino}")
    return 0


def _cmd_publicar(args: argparse.Namespace) -> int:
    from src.instagram_bridge import publicar_reel

    media_id = publicar_reel(
        video_path=Path(args.video),
        slug=args.slug,
        legenda=args.legenda,
        tema=args.tema or args.slug,
        metodo=args.metodo,
    )
    print(f"Publicado. media_id={media_id}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Pipeline de automacao de Reels — Dr. Saude Mental")
    sub = parser.add_subparsers(dest="comando", required=True)

    p_run_all = sub.add_parser("run-all", help="roda o pipeline completo, do roteiro a publicacao")
    p_run_all.add_argument("--tema", default=None, help="tema livre do reel")
    p_run_all.add_argument("--numero", type=int, default=None, help="numero da linha em 30_REELS_FACELESS.csv")
    p_run_all.add_argument("--publicar", action="store_true", help="publica no Instagram ao final")
    p_run_all.add_argument("--metodo", choices=["graph", "composio"], default=None, help="metodo de publicacao")
    p_run_all.add_argument("--dry-run", action="store_true", help="gera tudo mas nao publica")
    p_run_all.set_defaults(func=_cmd_run_all)

    p_roteiro = sub.add_parser("roteiro", help="gera so o roteiro (JSON) via Ollama")
    p_roteiro.add_argument("--tema", default=None)
    p_roteiro.add_argument("--numero", type=int, default=None)
    p_roteiro.add_argument("--saida", default=None)
    p_roteiro.set_defaults(func=_cmd_roteiro)

    p_narracao = sub.add_parser("narracao", help="gera so o audio de narracao via Edge-TTS")
    p_narracao.add_argument("--texto", required=True)
    p_narracao.add_argument("--saida", required=True)
    p_narracao.set_defaults(func=_cmd_narracao)

    p_legendas = sub.add_parser("legendas", help="transcreve e alinha um audio com WhisperX")
    p_legendas.add_argument("--audio", required=True)
    p_legendas.add_argument("--saida-dir", default=None)
    p_legendas.set_defaults(func=_cmd_legendas)

    p_imagens = sub.add_parser("imagens", help="gera imagens via Stable Diffusion")
    p_imagens.add_argument("--prompts", nargs="+", required=True)
    p_imagens.add_argument("--saida-dir", required=True)
    p_imagens.add_argument("--nome-base", default="cena")
    p_imagens.set_defaults(func=_cmd_imagens)

    p_video = sub.add_parser("video", help="monta o video final (MoviePy) a partir de imagens/audio/legendas ja gerados")
    p_video.add_argument("--imagens-dir", required=True)
    p_video.add_argument("--audio", required=True)
    p_video.add_argument("--legendas", required=True, help="arquivo .json de chunks gerado pelo comando 'legendas'")
    p_video.add_argument("--saida", required=True)
    p_video.set_defaults(func=_cmd_video)

    p_publicar = sub.add_parser("publicar", help="publica um video ja pronto no Instagram")
    p_publicar.add_argument("--video", required=True)
    p_publicar.add_argument("--slug", required=True)
    p_publicar.add_argument("--legenda", required=True)
    p_publicar.add_argument("--tema", default=None)
    p_publicar.add_argument("--metodo", choices=["graph", "composio"], default=None)
    p_publicar.set_defaults(func=_cmd_publicar)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except PipelineError as exc:
        logger.error("Pipeline interrompido: %s", exc)
        print(f"\nErro: {exc}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        logger.warning("Interrompido pelo usuario.")
        return 130
    except Exception as exc:  # noqa: BLE001 - ultima rede de seguranca do CLI
        logger.exception("Erro inesperado: %s", exc)
        print(f"\nErro inesperado: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
