from pydantic import BaseModel, Field


class DemoRequestCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    gym_name: str = Field(..., min_length=2, max_length=150)
    phone: str = Field(..., min_length=8, max_length=20)
    city: str = Field(..., min_length=2, max_length=60)
    locality: str | None = Field(default=None, max_length=80)
    email: str | None = Field(default=None, max_length=120)
    source: str | None = Field(default="public_site", max_length=50)


class DemoRequestResponse(BaseModel):
    id: str
    message: str

    class Config:
        from_attributes = True
