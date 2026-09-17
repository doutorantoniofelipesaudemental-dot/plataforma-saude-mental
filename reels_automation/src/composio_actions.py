"""Integracao opcional com Composio para notificacoes do pipeline (ex.: avisar
por email/Slack quando um Reel e publicado ou quando uma etapa falha).

A publicacao em si no Instagram via Composio (toolkit Instagram) ja existe em
post_instagram.py na raiz do repo e e reaproveitada por instagram_bridge.py —
este modulo cobre apenas notificacoes extras, desligadas por padrao
(settings.json > composio.notify_on_success / notify_on_failure).

Pacote correto: "composio" (`from composio import Composio`). NAO instalar
"composio-core" (legado, quebra build no Windows com Python 3.14).
"""

from __future__ import annotations

from typing import Any

from .config import SETTINGS
from .logger import get_logger

logger = get_logger(__name__)

_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client

    try:
        from composio import Composio
    except ImportError as exc:
        raise RuntimeError(
            "Pacote 'composio' nao instalado. Rode `pip install composio` "
            "(nao 'composio-core') para usar notificacoes via Composio."
        ) from exc

    api_key = SETTINGS.env_get("COMPOSIO_API_KEY")
    if not api_key:
        raise RuntimeError(
            "COMPOSIO_API_KEY nao configurada (esperada em ../.env.local ou .env)."
        )

    _client = Composio(api_key=api_key)
    return _client


def notificar(mensagem: str, *, sucesso: bool, contexto: dict[str, Any] | None = None) -> None:
    """Dispara a acao Composio configurada em settings.json > composio.notify_action,
    se notificacoes estiverem habilitadas para esse tipo de evento. Nunca levanta
    excecao para nao derrubar o pipeline por causa de uma notificacao — apenas loga.
    """
    flag = "notify_on_success" if sucesso else "notify_on_failure"
    if not SETTINGS.get("composio", flag, default=False):
        logger.debug("Notificacao Composio desabilitada (%s=false) — pulando.", flag)
        return

    action_slug = SETTINGS.get("composio", "notify_action", default="")
    if not action_slug:
        logger.warning("Notificacao habilitada mas composio.notify_action nao configurado — pulando.")
        return

    user_id = SETTINGS.env_get("COMPOSIO_USER_ID", "default")

    try:
        client = _get_client()
        client.actions.execute(
            action=action_slug,
            entity_id=user_id,
            params={"message": mensagem, **(contexto or {})},
        )
        logger.info("Notificacao Composio ('%s') enviada com sucesso.", action_slug)
    except Exception as exc:  # noqa: BLE001 - notificacao nunca deve derrubar o pipeline
        logger.error("Falha ao enviar notificacao via Composio: %s", exc)
