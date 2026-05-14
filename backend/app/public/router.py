from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx

from app.core.config import settings
from app.core.database import get_db
from app.core.demo_seed import create_demo_data
from app.core.logger import logger
from app.models import Gym
from app.public.schemas import DemoRequestCreate, DemoRequestResponse
from app.models.demo_request import DemoRequest

router = APIRouter()


@router.get("/seed-demo")
def seed_demo(db: Session = Depends(get_db)):
    """
    Create demo gym + owner if no gym exists (development / staging only).

    Disabled in production to prevent accidental seeding via unauthenticated endpoint.
    Used so the "Try demo" flow works on first deploy without manual setup.
    """
    if settings.environment.lower() == "production":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not available in this environment",
        )

    existing = db.query(Gym).first()
    if existing:
        return {
            "status": "already_setup",
            "message": "Demo data already exists",
            "gym": existing.name,
        }
    created = create_demo_data(db)
    if created:
        return {
            "status": "created",
            "message": "Demo data created. Sign in with the seeded owner account from your environment docs.",
        }
    return {"status": "already_setup", "message": "Demo data already exists"}


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
    """Post lead payload to an external webhook/CRM endpoint.

    Errors are logged but never re-raised so lead creation never fails on a flaky CRM.
    """
    try:
        with httpx.Client(timeout=5.0) as client:
            client.post(settings.lead_webhook_url, json=payload)
    except Exception as exc:
        logger.warning(
            "lead_webhook_failed",
            extra={
                "lead_id": payload.get("id"),
                "error": str(exc),
            },
        )
        return
