"""Unit tests for Super Agents FastAPI app (no external API keys required)."""

from __future__ import annotations

import json
import os
import sys
import unittest
from unittest.mock import AsyncMock, patch

# Ensure main is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient

import main


class SuperAgentsApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(main.app)
        self._env = os.environ.copy()

    def tearDown(self) -> None:
        os.environ.clear()
        os.environ.update(self._env)

    def test_health(self) -> None:
        r = self.client.get("/health")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertTrue(body.get("ok"))
        self.assertEqual(body.get("service"), "super-agents")

    def test_inventory_structure(self) -> None:
        r = self.client.get("/api/inventory")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertIn("hub", body)
        self.assertEqual(body["hub"]["fly_app"], "super-agents")
        self.assertIn("daytona", body)
        self.assertIn("fly", body)
        self.assertIn("agents", body)

    def test_pick_provider_routes(self) -> None:
        self.assertEqual(main._pick_provider("Hermes-4-70B"), "nous")
        self.assertEqual(main._pick_provider("gpt-4o"), "openai")
        self.assertEqual(main._pick_provider("mimo-v2.5-pro"), "mimo")

    def test_chat_openai_without_key_returns_503(self) -> None:
        os.environ.pop("OPENAI_API_KEY", None)
        r = self.client.post(
            "/v1/chat/completions",
            json={"model": "gpt-4o", "messages": [{"role": "user", "content": "hi"}]},
        )
        self.assertEqual(r.status_code, 503)

    @patch("httpx.AsyncClient.post", new_callable=AsyncMock)
    def test_chat_openai_proxies_when_key_set(self, mock_post: AsyncMock) -> None:
        os.environ["OPENAI_API_KEY"] = "test-key"
        mock_post.return_value = type(
            "R",
            (),
            {
                "content": json.dumps(
                    {"choices": [{"message": {"content": "ok"}}]}
                ).encode(),
                "status_code": 200,
                "headers": {"content-type": "application/json"},
            },
        )()
        r = self.client.post(
            "/v1/chat/completions",
            json={"model": "gpt-4o", "messages": [{"role": "user", "content": "hi"}]},
            headers={"X-Studex-Provider": "openai"},
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.headers.get("x-studex-provider"), "openai")
        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args.kwargs
        self.assertIn("Authorization", call_kwargs["headers"])


if __name__ == "__main__":
    unittest.main()
