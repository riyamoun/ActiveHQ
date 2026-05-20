"""
Enhance members, memberships, and biometric tables for flexible data import from multiple software systems.

Adds:
1. Member model enhancements:
   - source_system: Track which system data came from (e.g., "GymSoft", "eTimeTrack", "Manual")
   - alternative_phone: Additional contact for flexibility
   - enrollment_status: NEW/ACTIVE/INACTIVE/PAUSED (better tracking)
   - biometric_enrolled: Flag for biometric enrollment status
   - aadhaar_verified: For India-specific identity verification
   - import_metadata: JSON for storing extra unmapped fields from source systems
   - last_biometric_sync: Track biometric device sync
   - remarks: More detailed notes for admin

2. Membership model enhancements:
   - renewal_date: Explicit renewal tracking
   - freeze_start_date/freeze_end_date: For paused memberships
   - discount_amount: Track discounts separately
   - payment_method: Store preferred payment method
   - auto_renewal: Enable auto-renewal
   - import_ref: Reference to source system ID
   - renewal_reminder_sent_at: Track reminders

3. New BiometricFaceEncoding model:
   - Store face templates separately for multi-device enrollment
   - enrollment_quality: Confidence score of face enrollment
   - last_verified: Track face recognition success

4. Enhanced DeviceUserMapping:
   - is_enrolled: Explicit enrollment flag
   - enrollment_date: When added to device
   - biometric_template_id: Link to face encoding
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260520_100000"
down_revision = "20260518_140000"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add columns to members table
    op.add_column("members", sa.Column("source_system", sa.String(length=100), nullable=True))
    op.add_column("members", sa.Column("alternative_phone", sa.String(length=15), nullable=True))
    op.add_column(
        "members",
        sa.Column(
            "enrollment_status",
            sa.String(length=20),
            nullable=False,
            server_default="ACTIVE"  # NEW, ACTIVE, INACTIVE, PAUSED
        )
    )
    op.add_column("members", sa.Column("biometric_enrolled", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("members", sa.Column("aadhaar_verified", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("members", sa.Column("import_metadata", postgresql.JSON(), nullable=True))  # Store unmapped fields
    op.add_column("members", sa.Column("last_biometric_sync", sa.DateTime(timezone=True), nullable=True))
    op.add_column("members", sa.Column("remarks", sa.Text(), nullable=True))
    
    # Create index for enrollment status (for reporting)
    op.create_index("idx_member_enrollment_status", "members", ["gym_id", "enrollment_status"])

    # 2. Add columns to memberships table
    op.add_column("memberships", sa.Column("renewal_date", sa.Date(), nullable=True))
    op.add_column("memberships", sa.Column("freeze_start_date", sa.Date(), nullable=True))
    op.add_column("memberships", sa.Column("freeze_end_date", sa.Date(), nullable=True))
    op.add_column("memberships", sa.Column("discount_amount", sa.Numeric(10, 2), nullable=False, server_default="0"))
    op.add_column("memberships", sa.Column("payment_method", sa.String(50), nullable=True))  # CASH, UPI, CARD, CHEQUE
    op.add_column("memberships", sa.Column("auto_renewal", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("memberships", sa.Column("import_ref", sa.String(255), nullable=True))  # Reference to source system ID
    op.add_column("memberships", sa.Column("renewal_reminder_sent_at", sa.DateTime(timezone=True), nullable=True))
    
    # Create index for renewal tracking
    op.create_index("idx_membership_renewal_date", "memberships", ["gym_id", "renewal_date"])
    op.create_index("idx_membership_auto_renewal", "memberships", ["gym_id", "auto_renewal"])

    # 3. Create new BiometricFaceEncoding table (separate model for face templates)
    op.create_table(
        "biometric_face_encodings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("gym_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("device_id", postgresql.UUID(as_uuid=True), nullable=True),  # Optional: specific device
        sa.Column("face_template", sa.LargeBinary(), nullable=False),  # Binary face encoding (512-dim vector or JPEG2000)
        sa.Column("face_template_format", sa.String(50), nullable=False, server_default="unknown"),  # e.g., "vector_512", "jpeg2000"
        sa.Column("enrollment_quality", sa.Numeric(3, 2), nullable=True),  # 0.00 to 1.00 confidence score
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.true()),  # Primary face for matching
        sa.Column("last_verified", sa.DateTime(timezone=True), nullable=True),  # When face match last succeeded
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["gym_id"], ["gyms.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["member_id"], ["members.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["device_id"], ["biometric_devices.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_face_encoding_member", "biometric_face_encodings", ["gym_id", "member_id"])
    op.create_index("idx_face_encoding_device", "biometric_face_encodings", ["device_id"])
    op.create_index("idx_face_encoding_primary", "biometric_face_encodings", ["gym_id", "is_primary"])

    # 4. Enhance DeviceUserMapping table
    op.add_column("device_user_mappings", sa.Column("is_enrolled", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("device_user_mappings", sa.Column("enrollment_date", sa.DateTime(timezone=True), nullable=True))
    op.add_column("device_user_mappings", sa.Column("biometric_template_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_device_user_mapping_face_encoding",
        "device_user_mappings",
        "biometric_face_encodings",
        ["biometric_template_id"],
        ["id"],
        ondelete="SET NULL"
    )
    op.create_index("idx_device_user_enrollment", "device_user_mappings", ["gym_id", "is_enrolled"])

    # 5. Add index to biometric_events for better event tracking
    op.create_index("idx_bio_event_member_device", "biometric_events", ["member_id", "device_id", "event_time"])


def downgrade() -> None:
    # Drop new table and indexes
    op.drop_table("biometric_face_encodings")
    
    # Drop new columns from members
    op.drop_index("idx_member_enrollment_status", table_name="members")
    op.drop_column("members", "remarks")
    op.drop_column("members", "last_biometric_sync")
    op.drop_column("members", "import_metadata")
    op.drop_column("members", "aadhaar_verified")
    op.drop_column("members", "biometric_enrolled")
    op.drop_column("members", "enrollment_status")
    op.drop_column("members", "alternative_phone")
    op.drop_column("members", "source_system")
    
    # Drop new columns from memberships
    op.drop_index("idx_membership_renewal_date", table_name="memberships")
    op.drop_index("idx_membership_auto_renewal", table_name="memberships")
    op.drop_column("memberships", "renewal_reminder_sent_at")
    op.drop_column("memberships", "import_ref")
    op.drop_column("memberships", "auto_renewal")
    op.drop_column("memberships", "payment_method")
    op.drop_column("memberships", "discount_amount")
    op.drop_column("memberships", "freeze_end_date")
    op.drop_column("memberships", "freeze_start_date")
    op.drop_column("memberships", "renewal_date")
    
    # Drop new columns from device_user_mappings
    op.drop_index("idx_device_user_enrollment", table_name="device_user_mappings")
    op.drop_constraint("fk_device_user_mapping_face_encoding", "device_user_mappings", type_="foreignkey")
    op.drop_column("device_user_mappings", "biometric_template_id")
    op.drop_column("device_user_mappings", "enrollment_date")
    op.drop_column("device_user_mappings", "is_enrolled")
    
    # Drop indexes
    op.drop_index("idx_bio_event_member_device", table_name="biometric_events")
