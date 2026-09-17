"""Testes de fumaca: nao chamam nenhum servico externo (Ollama/SD/TTS/WhisperX/
Instagram), so validam config, utilitarios e parsing — rapido o suficiente
para rodar sempre antes de qualquer execucao real do pipeline.

Rodar com:  .venv\\Scripts\\python.exe -m pytest tests\\ -v
(ou, sem pytest instalado: .venv\\Scripts\\python.exe tests\\test_smoke.py)
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.config import SETTINGS  # noqa: E402
from src.llm_ollama import _extract_json  # noqa: E402
from src.transcribe_whisperx import ChunkLegenda, agrupar_em_chunks, PalavraTimestamp, salvar_srt  # noqa: E402
from src.utils import slugify  # noqa: E402


def test_settings_carrega() -> None:
    assert SETTINGS.ollama_model
    assert SETTINGS.get("video", "resolution") == [1080, 1920]


def test_slugify() -> None:
    assert slugify("Ansiedade no Trabalho!") == "ansiedade-no-trabalho"
    assert slugify("   ") == "reel-sem-titulo"


def test_extract_json_com_markdown_fence() -> None:
    bruto = "Aqui esta:\n```json\n{\"a\": 1, \"b\": [\"x\"]}\n```\nObrigado."
    parsed = _extract_json(bruto)
    assert parsed == {"a": 1, "b": ["x"]}


def test_extract_json_puro() -> None:
    assert _extract_json('{"ok": true}') == {"ok": True}


def test_agrupar_em_chunks() -> None:
    palavras = [
        PalavraTimestamp("Isso", 0.0, 0.3),
        PalavraTimestamp("e", 0.3, 0.4),
        PalavraTimestamp("um", 0.4, 0.5),
        PalavraTimestamp("teste.", 0.5, 0.9),
        PalavraTimestamp("Mais", 1.0, 1.2),
        PalavraTimestamp("uma", 1.2, 1.3),
        PalavraTimestamp("frase", 1.3, 1.6),
    ]
    chunks = agrupar_em_chunks(palavras, max_palavras=4)
    assert chunks[0].texto == "Isso e um teste."
    assert chunks[0].inicio == 0.0
    assert chunks[0].fim == 0.9
    assert chunks[-1].texto == "Mais uma frase"


def test_salvar_srt(tmp_path: Path) -> None:
    chunks = [ChunkLegenda(texto="Ola mundo", inicio=0.0, fim=1.5)]
    destino = tmp_path / "legenda.srt"
    salvar_srt(chunks, destino)
    conteudo = destino.read_text(encoding="utf-8")
    assert "00:00:00,000 --> 00:00:01,500" in conteudo
    assert "Ola mundo" in conteudo


if __name__ == "__main__":
    import inspect

    testes = [obj for name, obj in list(globals().items()) if name.startswith("test_")]
    falhas = 0
    for teste in testes:
        try:
            if "tmp_path" in inspect.signature(teste).parameters:
                import tempfile

                with tempfile.TemporaryDirectory() as td:
                    teste(Path(td))
            else:
                teste()
            print(f"OK   {teste.__name__}")
        except AssertionError as exc:
            falhas += 1
            print(f"FALHOU {teste.__name__}: {exc}")
    sys.exit(1 if falhas else 0)
