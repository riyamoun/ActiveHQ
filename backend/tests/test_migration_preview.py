"""Import preview dry-run tests."""

from datetime import date
from decimal import Decimal

from app.migration.schemas import (
    MemberImportRequest,
    MemberImportRow,
    MembershipImportRequest,
    MembershipImportRow,
)
from app.migration.service import MigrationService
from app.models import Member
from app.models.enums import MembershipStatus


def test_preview_members_create_and_skip(db_session, test_gym, test_owner_user):
    db_session.add(
        Member(
            gym_id=test_gym.id,
            name="Existing",
            phone="9999999999",
            joined_date=date.today(),
            is_active=True,
        )
    )
    db_session.commit()

    svc = MigrationService(db_session)
    result = svc.preview_members(
        test_gym.id,
        MemberImportRequest(
            members=[
                MemberImportRow(name="New One", phone="8888888888"),
                MemberImportRow(name="Dup", phone="9999999999"),
            ],
            skip_duplicates=True,
        ),
    )
    assert result.will_create == 1
    assert result.will_skip == 1
    assert result.error_count == 0


def test_preview_memberships_requires_member(db_session, test_gym, test_owner_user):
    svc = MigrationService(db_session)
    result = svc.preview_memberships(
        test_gym.id,
        MembershipImportRequest(
            memberships=[
                MembershipImportRow(
                    member_phone="7777777777",
                    plan_name="Monthly",
                    start_date=date(2026, 1, 1),
                    end_date=date(2026, 1, 31),
                    amount_total=Decimal("1500"),
                    status=MembershipStatus.ACTIVE,
                ),
            ],
        ),
    )
    assert result.error_count == 1
    assert result.will_create == 0


def test_preview_memberships_plan_auto_create_note(db_session, test_gym, test_owner_user, test_plan):
    member = Member(
        gym_id=test_gym.id,
        name="Raj",
        phone="9876543210",
        joined_date=date.today(),
        is_active=True,
    )
    db_session.add(member)
    db_session.commit()

    svc = MigrationService(db_session)
    result = svc.preview_memberships(
        test_gym.id,
        MembershipImportRequest(
            memberships=[
                MembershipImportRow(
                    member_phone="9876543210",
                    plan_name="Quarterly",
                    start_date=date(2026, 1, 1),
                    end_date=date(2026, 3, 31),
                    amount_total=Decimal("4000"),
                    status=MembershipStatus.ACTIVE,
                ),
            ],
        ),
    )
    assert result.will_create == 1
    assert "plan will be created" in result.rows[0].summary.lower()
