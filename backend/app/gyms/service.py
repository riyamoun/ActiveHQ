"""
Gym management service.
"""

import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Gym
from app.gyms.schemas import GymUpdate, GymSettingsUpdate


class GymService:
    """Service class for gym operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_gym(self, gym_id: uuid.UUID) -> Gym | None:
        """Get gym by ID."""
        return self.db.execute(
            select(Gym).where(Gym.id == gym_id)
        ).scalar_one_or_none()
    
    def update_gym(self, gym: Gym, data: GymUpdate) -> Gym:
        """Update gym details."""
        update_data = data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(gym, field, value)
        
        self.db.commit()
        self.db.refresh(gym)
        return gym
    
    def update_settings(self, gym: Gym, data: GymSettingsUpdate) -> Gym:
        """Update gym settings (merge with existing)."""
        # Merge new settings with existing
        current_settings = gym.settings or {}
        current_settings.update(data.settings)
        gym.settings = current_settings
        
        self.db.commit()
        self.db.refresh(gym)
        return gym
    
    def get_all_gyms(self, active_only: bool = True) -> list[Gym]:
        """
        Get all gyms. For admin/super-admin use.
        
        Note: This bypasses multi-tenancy - use carefully.
        """
        query = select(Gym)
        
        if active_only:
            query = query.where(Gym.is_active == True)  # noqa: E712
        
        query = query.order_by(Gym.name)
        
        result = self.db.execute(query)
        return list(result.scalars().all())
