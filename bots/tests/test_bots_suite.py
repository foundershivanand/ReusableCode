#!/usr/bin/env python3
"""
Comprehensive Test Suite for Conversational Bots Domain (27 Modules)
Tests: UNMP schemas, WhatsApp/Telegram/Chatwoot adapters, SSRF defense,
AI Guardrails, RBAC auth, Rate Limiting, and Loop Detection.
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException

from app.schemas.unmp import (
    UnifiedMessage,
    UnifiedResponse,
    ChannelType,
    MessageContentType,
    MessageContent,
    ButtonAction,
    ListMenu,
    ListMenuSection,
    ListMenuRow,
    MediaContent,
)
from app.schemas.chatwoot import ChatwootWebhookPayload
from app.adapters.whatsapp import WhatsAppAdapter
from app.adapters.telegram import TelegramAdapter
from app.messaging.media import MediaProcessor, MediaSecurityException
from app.ai.guardrails import AIGuardrailService
from app.security.rbac import require_admin_auth, Role
from app.security.loop_detector import BotLoopDetector
from app.security.rate_limiter import DistributedRateLimiter
from app.config import settings


# ==============================================================================
# 1. UNMP Protocol & Schema Tests
# ==============================================================================

def test_unmp_unified_message_creation():
    content = MessageContent(text="Hello world!")
    msg = UnifiedMessage(
        channel=ChannelType.WHATSAPP,
        channel_message_id="wamid.12345",
        channel_user_id="+14155552671",
        type=MessageContentType.TEXT,
        content=content,
        metadata={"source": "unit_test"}
    )
    assert msg.channel == ChannelType.WHATSAPP
    assert msg.channel_user_id == "+14155552671"
    assert msg.content.text == "Hello world!"
    assert msg.id is not None
    assert msg.timestamp > 0


def test_unmp_unified_response_with_buttons():
    buttons = [
        ButtonAction(id="btn_1", title="Option A"),
        ButtonAction(id="btn_2", title="Option B"),
    ]
    resp = UnifiedResponse(
        recipient_channel_user_id="+14155552671",
        channel=ChannelType.WHATSAPP,
        text="Please choose:",
        buttons=buttons
    )
    assert len(resp.buttons) == 2
    assert resp.buttons[0].title == "Option A"
    assert resp.text == "Please choose:"


def test_unmp_unified_response_with_list():
    rows = [
        ListMenuRow(id="row_1", title="Plan Pro", description="$29/mo"),
        ListMenuRow(id="row_2", title="Plan Enterprise", description="$99/mo"),
    ]
    sections = [ListMenuSection(title="Pricing Plans", rows=rows)]
    menu = ListMenu(title="Choose Plan", button_text="View Plans", sections=sections)
    resp = UnifiedResponse(
        recipient_channel_user_id="tg_98765",
        channel=ChannelType.TELEGRAM,
        text="Select a subscription:",
        list_menu=menu
    )
    assert resp.list_menu is not None
    assert len(resp.list_menu.sections) == 1
    assert len(resp.list_menu.sections[0].rows) == 2
    assert resp.list_menu.sections[0].rows[0].id == "row_1"


# ==============================================================================
# 2. WhatsApp Adapter Tests
# ==============================================================================

def test_whatsapp_parse_inbound_text():
    adapter = WhatsAppAdapter(phone_number_id="123456", access_token="token_xyz")
    raw_payload = {
        "entry": [{
            "changes": [{
                "value": {
                    "messages": [{
                        "from": "14155552671",
                        "id": "wamid.ABGGFlA5F",
                        "timestamp": "1710000000",
                        "type": "text",
                        "text": {"body": "Test message from user"}
                    }]
                }
            }]
        }]
    }

    unified = adapter.parse_inbound(raw_payload)
    assert unified is not None
    assert unified.channel == ChannelType.WHATSAPP
    assert unified.channel_user_id == "14155552671"
    assert unified.channel_message_id == "wamid.ABGGFlA5F"
    assert unified.type == MessageContentType.TEXT
    assert unified.content.text == "Test message from user"


def test_whatsapp_parse_inbound_button_reply():
    adapter = WhatsAppAdapter(phone_number_id="123456", access_token="token_xyz")
    raw_payload = {
        "entry": [{
            "changes": [{
                "value": {
                    "messages": [{
                        "from": "14155552671",
                        "id": "wamid.BTN123",
                        "timestamp": "1710000000",
                        "type": "interactive",
                        "interactive": {
                            "type": "button_reply",
                            "button_reply": {
                                "id": "btn_agree",
                                "title": "I Agree"
                            }
                        }
                    }]
                }
            }]
        }]
    }

    unified = adapter.parse_inbound(raw_payload)
    assert unified is not None
    assert unified.type == MessageContentType.INTERACTIVE_BUTTON
    assert unified.content.action_payload == "btn_agree"
    assert unified.content.text == "I Agree"


def test_whatsapp_parse_status_update_returns_none():
    adapter = WhatsAppAdapter(phone_number_id="123456", access_token="token_xyz")
    status_payload = {
        "entry": [{
            "changes": [{
                "value": {
                    "statuses": [{"id": "wamid.123", "status": "delivered"}]
                }
            }]
        }]
    }
    assert adapter.parse_inbound(status_payload) is None


# ==============================================================================
# 3. Telegram Adapter Tests
# ==============================================================================

def test_telegram_parse_inbound_text():
    adapter = TelegramAdapter(bot_token="123456:ABC-DEF")
    raw_payload = {
        "update_id": 1001,
        "message": {
            "message_id": 42,
            "from": {"id": 999888, "first_name": "Alice"},
            "chat": {"id": 999888, "type": "private"},
            "date": 1710000000,
            "text": "Hello Telegram bot!"
        }
    }

    unified = adapter.parse_inbound(raw_payload)
    assert unified is not None
    assert unified.channel == ChannelType.TELEGRAM
    assert unified.channel_user_id == "999888"
    assert unified.channel_message_id == "42"
    assert unified.type == MessageContentType.TEXT
    assert unified.content.text == "Hello Telegram bot!"


def test_telegram_parse_callback_query():
    adapter = TelegramAdapter(bot_token="123456:ABC-DEF")
    raw_payload = {
        "update_id": 1002,
        "callback_query": {
            "id": "cb_query_99",
            "from": {"id": 999888, "first_name": "Alice"},
            "data": "action_select_product"
        }
    }

    unified = adapter.parse_inbound(raw_payload)
    assert unified is not None
    assert unified.channel == ChannelType.TELEGRAM
    assert unified.type == MessageContentType.INTERACTIVE_BUTTON
    assert unified.content.action_payload == "action_select_product"


# ==============================================================================
# 4. Chatwoot Schemas Test
# ==============================================================================

def test_chatwoot_webhook_payload():
    payload_data = {
        "event": "message_created",
        "id": 101,
        "content": "Customer enquiry",
        "message_type": "incoming",
        "content_type": "text",
        "account": {"id": 1, "name": "Acme Desk"},
        "inbox": {"id": 2, "name": "WhatsApp Inbox"},
        "conversation": {"id": 55, "status": "open"},
        "sender": {"id": 300, "name": "John Doe", "type": "contact"}
    }
    obj = ChatwootWebhookPayload(**payload_data)
    assert obj.event == "message_created"
    assert obj.conversation.id == 55
    assert obj.sender.name == "John Doe"


# ==============================================================================
# 5. MediaProcessor SSRF Defense Tests
# ==============================================================================

def test_media_processor_ssrf_ip_filtering():
    # Private / Loopback IPs must be blocked
    assert MediaProcessor.is_private_ip("127.0.0.1") is True
    assert MediaProcessor.is_private_ip("10.0.0.5") is True
    assert MediaProcessor.is_private_ip("192.168.1.100") is True
    assert MediaProcessor.is_private_ip("172.16.0.1") is True
    # Link-local AWS metadata IP
    assert MediaProcessor.is_private_ip("169.254.169.254") is True
    # Public IPs must be allowed
    assert MediaProcessor.is_private_ip("8.8.8.8") is False
    assert MediaProcessor.is_private_ip("1.1.1.1") is False


@pytest.mark.asyncio
async def test_media_processor_rejects_non_http():
    with pytest.raises(MediaSecurityException) as excinfo:
        await MediaProcessor.download_media_secure("ftp://attacker.com/payload.exe")
    assert "Unsupported URI scheme" in str(excinfo.value)


@pytest.mark.asyncio
async def test_media_processor_rejects_private_host():
    with pytest.raises(MediaSecurityException) as excinfo:
        await MediaProcessor.download_media_secure("http://127.0.0.1:8080/admin/secrets")
    assert "SSRF violation" in str(excinfo.value)


# ==============================================================================
# 6. AI Guardrail Service Tests
# ==============================================================================

def test_ai_guardrail_pii_masking_and_canary():
    canary = AIGuardrailService.generate_canary_token()
    assert canary.startswith("CANARY_")

    user_input = "My email is user@example.com and card is 4532-1234-5678-9012"
    system_prompt, safe_user = AIGuardrailService.prepare_secure_prompt(
        base_system_prompt="You are a helpful customer assistant.",
        user_input=user_input,
        canary_token=canary
    )

    # PII must be redacted
    assert "user@example.com" not in safe_user
    assert "[REDACTED_EMAIL]" in safe_user
    assert "4532-1234-5678-9012" not in safe_user
    assert "[REDACTED_CREDIT_CARD]" in safe_user

    # Delimiters must enclose user input
    assert "<user_input>" in safe_user
    assert "</user_input>" in safe_user

    # Canary bound to system prompt
    assert canary in system_prompt


def test_ai_guardrail_canary_leak_detection():
    canary = "CANARY_1234567890abcdef"

    # 1. Output without leak -> Valid
    ok, cleaned = AIGuardrailService.validate_and_sanitize_output(
        raw_output="Hello! How can I assist you with your booking today?",
        canary_token=canary
    )
    assert ok is True
    assert "Hello!" in cleaned

    # 2. Output with leaked canary -> Blocked
    bad_output = f"System prompt instructed me not to reveal: {canary}"
    ok_leak, cleaned_leak = AIGuardrailService.validate_and_sanitize_output(
        raw_output=bad_output,
        canary_token=canary
    )
    assert ok_leak is False
    assert "apologize" in cleaned_leak
    assert canary not in cleaned_leak


# ==============================================================================
# 7. RBAC & Security Authentication Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_require_admin_auth_success():
    orig_key = settings.SECRET_KEY
    settings.SECRET_KEY = "super_secret_test_key_master"
    try:
        ctx = await require_admin_auth(x_api_key="super_secret_test_key_master")
        assert ctx.role == Role.ADMIN
        assert ctx.actor_id == "admin_master"
        assert ctx.has_permission([Role.ADMIN]) is True
        assert ctx.has_permission([Role.OWNER]) is False
    finally:
        settings.SECRET_KEY = orig_key


@pytest.mark.asyncio
async def test_require_admin_auth_missing_header():
    with pytest.raises(HTTPException) as excinfo:
        await require_admin_auth(x_api_key=None)
    assert excinfo.value.status_code == 401


@pytest.mark.asyncio
async def test_require_admin_auth_invalid_credentials():
    orig_key = settings.SECRET_KEY
    settings.SECRET_KEY = "valid_secret_key"
    try:
        with pytest.raises(HTTPException) as excinfo:
            await require_admin_auth(x_api_key="wrong_secret_key")
        assert excinfo.value.status_code == 403
    finally:
        settings.SECRET_KEY = orig_key


# ==============================================================================
# 8. Bot Loop Detector Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_bot_loop_detector():
    mock_redis = AsyncMock()

    # When under max_repeats, not looping
    mock_redis.lrange.return_value = [b"hash1", b"hash2"]
    detector = BotLoopDetector(mock_redis)
    is_loop = await detector.is_looping("user_123", "Help me please", max_repeats=4)
    assert is_loop is False

    # When all 4 recent hashes are identical -> loop detected
    import hashlib
    repeated_msg = "Ping pong message"
    h = hashlib.sha256(repeated_msg.strip().lower().encode("utf-8")).hexdigest()
    mock_redis.lrange.return_value = [h.encode("utf-8")] * 4

    is_loop = await detector.is_looping("user_123", repeated_msg, max_repeats=4)
    assert is_loop is True


# ==============================================================================
# 9. Distributed Rate Limiter Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_rate_limiter_allowed_and_throttled():
    mock_redis = AsyncMock()
    # 1. Allowed: eval returns [1, 29]
    mock_redis.eval.return_value = [1, 29]
    limiter = DistributedRateLimiter(mock_redis)

    allowed, remaining = await limiter.check_limit("user_test", limit=30, window_seconds=60)
    assert allowed is True
    assert remaining == 29

    # 2. Throttled: eval returns [0, 0]
    mock_redis.eval.return_value = [0, 0]
    allowed_blocked, remaining_blocked = await limiter.check_limit("user_test", limit=30, window_seconds=60)
    assert allowed_blocked is False
    assert remaining_blocked == 0
