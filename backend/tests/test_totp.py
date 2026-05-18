"""Tests for optional TOTP 2FA."""

import pyotp

from app.auth.totp import generate_totp_secret, provisioning_uri, verify_totp_code


def test_totp_roundtrip():
    secret = generate_totp_secret()
    code = pyotp.TOTP(secret).now()
    assert verify_totp_code(secret, code)
    assert provisioning_uri(secret, "owner@test.com").startswith("otpauth://")
