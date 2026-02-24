from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session
import httpx

from app.core.config import settings
from app.core.database import get_db
from app.public.schemas import DemoRequestCreate, DemoRequestResponse
from app.models.demo_request import DemoRequest

router = APIRouter()


@router.post("/demo-request", response_model=DemoRequestResponse, status_code=status.HTTP_201_CREATED)
def create_demo_request(
    payload: DemoRequestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
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

    if settings.lead_webhook_url:
        background_tasks.add_task(
            send_lead_webhook,
            {
                "id": str(demo.id),
                "name": demo.name,
                "gym_name": demo.gym_name,
                "phone": demo.phone,
                "city": demo.city,
                "locality": demo.locality,
                "email": demo.email,
                "source": demo.source,
                "created_at": demo.created_at.isoformat() if demo.created_at else None,
            },
        )

    return DemoRequestResponse(id=str(demo.id), message="Demo request received")


def send_lead_webhook(payload: dict) -> None:
    """Post lead payload to an external webhook/CRM endpoint."""
    try:
        with httpx.Client(timeout=5.0) as client:
            client.post(settings.lead_webhook_url, json=payload)
    except Exception:
        # Swallow webhook errors so lead creation never fails.
        return
