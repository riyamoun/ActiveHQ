"""
Plan management service.
"""

import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Plan
from app.plans.schemas import PlanCreate, PlanUpdate


class PlanService:
    """Service class for plan operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_plan(
        self,
        gym_id: uuid.UUID,
        data: PlanCreate,
    ) -> Plan:
        """Create a new plan."""
        plan = Plan(
            gym_id=gym_id,
            name=data.name,
            description=data.description,
            duration_days=data.duration_days,
            price=data.price,
            is_active=True,
        )
        
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)
        
        return plan
    
    def get_plan(
        self,
        gym_id: uuid.UUID,
        plan_id: uuid.UUID,
    ) -> Plan | None:
        """Get plan by ID."""
        return self.db.execute(
            select(Plan).where(
                Plan.gym_id == gym_id,
                Plan.id == plan_id,
            )
        ).scalar_one_or_none()
    
    def update_plan(
        self,
        plan: Plan,
        data: PlanUpdate,
    ) -> Plan:
        """Update plan details."""
        update_data = data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(plan, field, value)
        
        self.db.commit()
        self.db.refresh(plan)
        
        return plan
    
    def list_plans(
        self,
        gym_id: uuid.UUID,
        active_only: bool = True,
    ) -> list[Plan]:
        """List all plans for a gym."""
        query = select(Plan).where(Plan.gym_id == gym_id)
        
        if active_only:
            query = query.where(Plan.is_active == True)  # noqa: E712
        
        query = query.order_by(Plan.duration_days)
        
        result = self.db.execute(query)
        return list(result.scalars().all())
    
    def deactivate_plan(self, plan: Plan) -> Plan:
        """Deactivate a plan (soft delete)."""
        plan.is_active = False
        self.db.commit()
        self.db.refresh(plan)
        return plan
