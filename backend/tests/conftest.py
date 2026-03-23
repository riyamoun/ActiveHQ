import os
import sys
from datetime import datetime, timedelta, date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.main import app
from app.core.database import get_db
from app.core.base import Base
from app.core.security import create_access_token, hash_password
from app.models import User, Gym, Plan, Member


# Test database using in-memory SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def db_engine():
    """Create test database engine (SQLite for testing)."""
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # IMPORTANT: Replace JSONB columns with JSON for SQLite compatibility
    # This must be done BEFORE creating tables
    from sqlalchemy.dialects.postgresql import JSONB
    from sqlalchemy import JSON
    
    for table in Base.metadata.tables.values():
        for column in table.columns:
            # Check if column type is JSONB
            if hasattr(column.type, '__class__') and column.type.__class__.__name__ == 'JSONB':
                # Replace with JSON for SQLite
                column.type = JSON()
    
    # Now create all tables with JSON instead of JSONB
    Base.metadata.create_all(bind=engine)
    
    yield engine
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create test database session."""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(autocommit=False, autoflush=False, bind=connection)()
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Create test API client with test database."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def test_gym(db_session) -> Gym:
    """Create test gym."""
    import uuid
    gym = Gym(
        name="Test Gym",
        slug=f"test-gym-{uuid.uuid4().hex[:8]}",
        owner_name="Test Owner",
        email="gym@test.com",
        phone="9999999999",
        address="123 Test St",
        city="Test City",
        state="Test State",
        pincode="123456",
        is_active=True,
    )
    db_session.add(gym)
    db_session.commit()
    db_session.refresh(gym)
    return gym


@pytest.fixture
def test_owner_user(db_session, test_gym) -> User:
    """Create test owner user."""
    from app.models.enums import UserRole
    
    user = User(
        gym_id=test_gym.id,
        email="owner@test.com",
        password_hash=hash_password("Owner@123"),
        name="Test Owner",
        phone="9999999999",
        role=UserRole.OWNER,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_manager_user(db_session, test_gym) -> User:
    """Create test manager user."""
    from app.models.enums import UserRole
    
    user = User(
        gym_id=test_gym.id,
        email="manager@test.com",
        password_hash=hash_password("Manager@123"),
        name="Test Manager",
        phone="9999999988",
        role=UserRole.MANAGER,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_staff_user(db_session, test_gym) -> User:
    """Create test staff user."""
    from app.models.enums import UserRole
    
    user = User(
        gym_id=test_gym.id,
        email="staff@test.com",
        password_hash=hash_password("Staff@123"),
        name="Test Staff",
        phone="9999999977",
        role=UserRole.STAFF,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_super_admin_user(db_session, test_gym) -> User:
    """Create test super admin user (platform-level)."""
    from app.models.enums import UserRole
    
    user = User(
        gym_id=test_gym.id,
        email="superadmin@test.com",
        password_hash=hash_password("SuperAdmin@123"),
        name="Test Super Admin",
        phone="9999999966",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def owner_token(test_owner_user) -> str:
    """Get owner JWT token."""
    return create_access_token(data={"sub": str(test_owner_user.id)}, expires_delta=timedelta(hours=1))


@pytest.fixture
def manager_token(test_manager_user) -> str:
    """Get manager JWT token."""
    return create_access_token(data={"sub": str(test_manager_user.id)}, expires_delta=timedelta(hours=1))


@pytest.fixture
def staff_token(test_staff_user) -> str:
    """Get staff JWT token."""
    return create_access_token(data={"sub": str(test_staff_user.id)}, expires_delta=timedelta(hours=1))


@pytest.fixture
def super_admin_token(test_super_admin_user) -> str:
    """Get super admin JWT token (platform-level)."""
    return create_access_token(data={"sub": str(test_super_admin_user.id)}, expires_delta=timedelta(hours=1))

@pytest.fixture
def test_plan(db_session, test_gym) -> Plan:
    """Create test membership plan."""
    plan = Plan(
        gym_id=test_gym.id,
        name="Monthly",
        duration_days=30,
        price=Decimal("1000.00"),
        is_active=True,
    )
    db_session.add(plan)
    db_session.commit()
    db_session.refresh(plan)
    return plan


@pytest.fixture
def test_member(db_session, test_gym) -> Member:
    """Create test member."""
    member = Member(
        gym_id=test_gym.id,
        name="Test Member",
        phone="9999999966",
        email="member@test.com",
        date_of_birth=datetime(2000, 1, 1).date(),
        joined_date=date.today(),
        is_active=True,
    )
    db_session.add(member)
    db_session.commit()
    db_session.refresh(member)
    return member
