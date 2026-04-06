"""
Member management API endpoints.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import FileResponse

from app.auth.dependencies import TenantDep, DbDep, require_manager_or_above, require_owner
from app.members.schemas import (
    MemberCreate,
    MemberUpdate,
    MemberResponse,
    MemberWithMembership,
    MemberListResponse,
)
from app.members.service import MemberService
from app.members.photo_storage import (
    delete_member_photo_file,
    guess_media_type,
    get_member_photo_file_path,
    save_member_photo,
)
from app.services.import_service import get_import_service, ImportResult


router = APIRouter()


@router.post("", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def create_member(
    request: MemberCreate,
    tenant: TenantDep,
    db: DbDep,
    _: None = Depends(require_manager_or_above),
):
    """
    Create a new member.
    
    Members are gym customers who have memberships.
    They do not login to the system.
    Requires: Owner or Manager (Staff cannot add members).
    """
    service = MemberService(db)
    
    # Check if phone already exists
    existing = service.get_member_by_phone(tenant.gym_id, request.phone)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A member with this phone number already exists",
        )
    
    member = service.create_member(tenant.gym_id, request)
    return MemberResponse.model_validate(member)


@router.get("", response_model=MemberListResponse)
def list_members(
    tenant: TenantDep,
    db: DbDep,
    query: str | None = Query(None, description="Search by name, phone, or member code"),
    status: str | None = Query(None, description="Filter: active, expired, or all"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    List members with search and filtering.
    
    - **query**: Search by name, phone number, or member code
    - **status**: Filter by membership status (active, expired, or all)
    - Supports pagination
    """
    service = MemberService(db)
    return service.list_members(
        gym_id=tenant.gym_id,
        query=query,
        status=status,
        page=page,
        page_size=page_size,
    )


@router.get("/expiring", response_model=list[MemberWithMembership])
def get_expiring_members(
    tenant: TenantDep,
    db: DbDep,
    days: int = Query(7, ge=1, le=90, description="Days until expiry"),
):
    """
    Get members whose membership is expiring soon.
    
    Useful for sending renewal reminders.
    """
    service = MemberService(db)
    return service.get_expiring_members(tenant.gym_id, days)


@router.get("/with-dues", response_model=list[MemberWithMembership])
def get_members_with_dues(
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get members with pending payment dues.
    
    Useful for payment follow-ups.
    """
    service = MemberService(db)
    return service.get_members_with_dues(tenant.gym_id)


@router.get("/{member_id}", response_model=MemberWithMembership)
def get_member(
    member_id: str,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get a specific member with their current membership info.
    """
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member ID format",
        )
    
    service = MemberService(db)
    member = service.get_member_with_membership(tenant.gym_id, member_uuid)
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    
    return member


@router.put("/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: str,
    request: MemberUpdate,
    tenant: TenantDep,
    db: DbDep,
    _: None = Depends(require_manager_or_above),
):
    """
    Update member details.
    """
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member ID format",
        )
    
    service = MemberService(db)
    member = service.get_member(tenant.gym_id, member_uuid)
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    
    # Check phone uniqueness if changing
    if request.phone and request.phone != member.phone:
        existing = service.get_member_by_phone(tenant.gym_id, request.phone)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A member with this phone number already exists",
            )
    
    updated = service.update_member(member, request)
    return MemberResponse.model_validate(updated)


@router.post("/{member_id}/photo", response_model=MemberResponse)
def upload_member_photo(
    member_id: str,
    tenant: TenantDep,
    db: DbDep,
    _: None = Depends(require_manager_or_above),
    photo: UploadFile = File(...),
):
    """
    Upload/update a member profile photo.
    Requires: Owner or Manager.
    """
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member ID format",
        )

    service = MemberService(db)
    member = service.get_member(tenant.gym_id, member_uuid)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    try:
        saved_name = save_member_photo(
            gym_id=tenant.gym_id,
            member_id=member.id,
            upload=photo,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    member.photo_url = saved_name
    updated = service.update_member(member, data=MemberUpdate())
    return MemberResponse.model_validate(updated)


@router.get("/{member_id}/photo")
def get_member_photo(
    member_id: str,
    tenant: TenantDep,
    db: DbDep,
):
    """
    Get member profile photo file.
    Authenticated and tenant-scoped.
    """
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member ID format",
        )

    service = MemberService(db)
    member = service.get_member(tenant.gym_id, member_uuid)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    if not member.photo_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member photo not found",
        )

    path = get_member_photo_file_path(tenant.gym_id, member.photo_url)
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member photo not found",
        )

    return FileResponse(path=path, media_type=guess_media_type(member.photo_url))


@router.delete("/{member_id}/photo", response_model=MemberResponse)
def delete_member_photo(
    member_id: str,
    tenant: TenantDep,
    db: DbDep,
    _: None = Depends(require_manager_or_above),
):
    """
    Delete member profile photo.
    Requires: Owner or Manager.
    """
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member ID format",
        )

    service = MemberService(db)
    member = service.get_member(tenant.gym_id, member_uuid)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    if member.photo_url:
        delete_member_photo_file(tenant.gym_id, member.photo_url)
        member.photo_url = None
        updated = service.update_member(member, data=MemberUpdate())
        return MemberResponse.model_validate(updated)

    return MemberResponse.model_validate(member)


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(
    member_id: str,
    tenant: TenantDep,
    db: DbDep,
    _: None = Depends(require_owner),
):
    """
    Deactivate a member (soft delete).
    
    Member data is preserved for historical records.
    Requires: Owner only (Manager/Staff cannot delete members).
    """
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member ID format",
        )
    
    service = MemberService(db)
    member = service.get_member(tenant.gym_id, member_uuid)
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    
    service.deactivate_member(member)
    return None


@router.post("/{member_id}/reactivate", response_model=MemberResponse)
def reactivate_member(
    member_id: str,
    tenant: TenantDep,
    db: DbDep,
    _: None = Depends(require_owner),
):
    """
    Reactivate a previously deactivated member.
    Requires: Owner only.
    """
    try:
        member_uuid = uuid.UUID(member_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid member ID format",
        )
    
    service = MemberService(db)
    
    # Get member including inactive ones
    from sqlalchemy import select
    from app.models import Member
    
    member = db.execute(
        select(Member).where(
            Member.gym_id == tenant.gym_id,
            Member.id == member_uuid,
        )
    ).scalar_one_or_none()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    
    if member.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Member is already active",
        )
    
    reactivated = service.reactivate_member(member)
    return MemberResponse.model_validate(reactivated)


@router.post("/import/bulk", response_model=ImportResult)
async def bulk_import_members(
    tenant: TenantDep,
    db: DbDep,
    file: UploadFile = File(...),
    _: None = Depends(require_manager_or_above),
):
    """
    Bulk import members from CSV or JSON file.
    
    **Supported formats:**
    - CSV: Columns required: name, phone. Optional: email, date_of_birth, address, city, membership_type, start_date, notes
    - JSON: Array of objects with same fields, or object with 'data' or 'records' key
    
    **Example JSON:**
    ```json
    {
      "data": [
        {
          "name": "John Doe",
          "phone": "9999999999",
          "email": "john@example.com",
          "date_of_birth": "1990-01-01",
          "membership_type": "Premium",
          "start_date": "2025-04-06"
        }
      ]
    }
    ```
    
    **CSV Example:**
    ```
    name,phone,email,date_of_birth,membership_type,start_date
    John Doe,9999999999,john@example.com,1990-01-01,Premium,2025-04-06
    ```
    
    Requires: Owner or Manager
    Returns: Summary with total records, successful imports, and any errors
    """
    # Read file content
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty",
        )
    
    # Use import service to parse and validate
    import_service = get_import_service()
    result = await import_service.import_file(
        file_content=content,
        filename=file.filename or "import.csv",
        import_type="members",
    )
    
    # TODO: In a real implementation, you would:
    # 1. Create members in database from validated records
    # 2. Handle duplicates (skip or update)
    # 3. Send confirmations
    # 4. Update result with actual created count
    
    return result

