"""Schemas for registering mobile push tokens."""

from pydantic import BaseModel, Field


class PushTokenRegisterRequest(BaseModel):
    platform: str = Field(..., pattern="^(android|ios|web)$")
    token: str = Field(..., min_length=20, max_length=512)
    device_id: str | None = Field(None, max_length=120)
    app_version: str | None = Field(None, max_length=50)


class PushTokenRegisterResponse(BaseModel):
    message: str
