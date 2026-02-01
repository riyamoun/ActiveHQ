from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.public.schemas import DemoRequestCreate, DemoRequestResponse
from app.models.demo_request import DemoRequest

router = APIRouter()


@router.post("/demo-request", response_model=DemoRequestResponse, status_code=status.HTTP_201_CREATED)
def create_demo_request(payload: DemoRequestCreate, db: Session = Depends(get_db)):
    demo = DemoRequest(
        name=payload.name,
        gym_name=payload.gym_name,
        phone=payload.phone,
        city=payload.city,
        locality=payload.locality,
        email=payload.email,
        source=payload.source or "public_site",
    )
    db.add(demo)
    db.commit()
    db.refresh(demo)
    return DemoRequestResponse(id=str(demo.id), message="Demo request received")
