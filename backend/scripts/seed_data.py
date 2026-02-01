"""
Seed data script for ActiveHQ.

Creates sample data for testing:
- 1 Gym
- 1 Owner user
- 3 Staff users
- 5 Plans
- 20 Members with memberships
- Sample payments and attendance

Usage:
    cd backend
    python scripts/seed_data.py
"""

import sys
import os
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import random

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import hash_password
from app.core.base import Base
from app.models import (
    Gym, User, Member, Plan, Membership, Payment, Attendance
)
from app.models.enums import (
    SubscriptionStatus, BillingCycle, UserRole, Gender,
    MembershipStatus, PaymentMode
)

# Sample data
INDIAN_FIRST_NAMES = [
    "Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Rajesh", "Pooja",
    "Arjun", "Neha", "Karan", "Divya", "Rohit", "Meera", "Sanjay", "Kavita",
    "Arun", "Ritu", "Deepak", "Swati"
]

INDIAN_LAST_NAMES = [
    "Sharma", "Patel", "Singh", "Kumar", "Verma", "Gupta", "Joshi", "Reddy",
    "Nair", "Rao", "Mehta", "Iyer", "Shah", "Pillai", "Das", "Menon"
]

def generate_phone():
    """Generate a random Indian phone number."""
    return f"9{random.randint(100000000, 999999999)}"

def generate_email(name: str):
    """Generate email from name."""
    domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]
    clean_name = name.lower().replace(" ", ".")
    return f"{clean_name}{random.randint(1, 99)}@{random.choice(domains)}"

def main():
    print("🌱 Starting seed data generation...")
    
    # Create engine and session
    engine = create_engine(settings.database_url, echo=False)
    
    # Create all tables
    print("📦 Creating database tables...")
    Base.metadata.create_all(engine)
    
    Session = sessionmaker(bind=engine)
    db = Session()
    
    try:
        # Check if data already exists
        existing_gym = db.query(Gym).first()
        if existing_gym:
            print("⚠️  Data already exists. Skipping seed.")
            print(f"   Existing gym: {existing_gym.name}")
            return
        
        # Create Gym
        print("🏋️ Creating gym...")
        gym = Gym(
            name="FitZone Premium Gym",
            slug="fitzone-premium-gym",
            owner_name="Rajesh Kumar",
            email="contact@fitzonegym.com",
            phone="9876543210",
            address="123, MG Road, Koramangala",
            city="Bangalore",
            state="Karnataka",
            pincode="560034",
            subscription_status=SubscriptionStatus.ACTIVE,
            subscription_start=date.today() - timedelta(days=30),
            subscription_end=date.today() + timedelta(days=335),
            setup_fee_paid=True,
            billing_cycle=BillingCycle.YEARLY,
            settings={"timezone": "Asia/Kolkata", "currency": "INR"},
            is_active=True,
        )
        db.add(gym)
        db.flush()
        print(f"   ✅ Created gym: {gym.name}")
        
        # Create Owner
        print("👤 Creating owner user...")
        owner = User(
            gym_id=gym.id,
            email="owner@fitzonegym.com",
            password_hash=hash_password("Owner@123"),
            name="Rajesh Kumar",
            phone="9876543210",
            role=UserRole.OWNER,
            is_active=True,
        )
        db.add(owner)
        print(f"   ✅ Created owner: {owner.email} (password: Owner@123)")
        
        # Create Staff
        print("👥 Creating staff users...")
        staff_data = [
            ("Priya Sharma", "manager@fitzonegym.com", UserRole.MANAGER),
            ("Amit Patel", "staff1@fitzonegym.com", UserRole.STAFF),
            ("Neha Singh", "staff2@fitzonegym.com", UserRole.STAFF),
        ]
        
        for name, email, role in staff_data:
            user = User(
                gym_id=gym.id,
                email=email,
                password_hash=hash_password("Staff@123"),
                name=name,
                phone=generate_phone(),
                role=role,
                is_active=True,
            )
            db.add(user)
            print(f"   ✅ Created {role.value}: {email} (password: Staff@123)")
        
        db.flush()
        
        # Create Plans
        print("📋 Creating plans...")
        plans_data = [
            ("Monthly", "Basic monthly membership", 30, 1500),
            ("Quarterly", "3 months membership with 10% discount", 90, 4000),
            ("Half Yearly", "6 months membership with 15% discount", 180, 7500),
            ("Yearly", "Annual membership with 20% discount", 365, 14000),
            ("Personal Training", "1 month with personal trainer", 30, 5000),
        ]
        
        plans = []
        for name, desc, days, price in plans_data:
            plan = Plan(
                gym_id=gym.id,
                name=name,
                description=desc,
                duration_days=days,
                price=Decimal(price),
                is_active=True,
            )
            db.add(plan)
            plans.append(plan)
            print(f"   ✅ Created plan: {name} - ₹{price}")
        
        db.flush()
        
        # Create Members
        print("🏃 Creating members...")
        members = []
        
        for i in range(20):
            first_name = random.choice(INDIAN_FIRST_NAMES)
            last_name = random.choice(INDIAN_LAST_NAMES)
            name = f"{first_name} {last_name}"
            
            # Random join date in last 6 months
            join_offset = random.randint(0, 180)
            joined = date.today() - timedelta(days=join_offset)
            
            member = Member(
                gym_id=gym.id,
                name=name,
                email=generate_email(name) if random.random() > 0.3 else None,
                phone=generate_phone(),
                gender=random.choice([Gender.MALE, Gender.FEMALE]),
                date_of_birth=date(
                    random.randint(1980, 2005),
                    random.randint(1, 12),
                    random.randint(1, 28)
                ),
                address=f"{random.randint(1, 500)}, {random.choice(['1st', '2nd', '3rd', '4th', '5th'])} Cross, Bangalore",
                joined_date=joined,
                member_code=f"FZ{str(i+1).zfill(4)}",
                is_active=True,
            )
            db.add(member)
            members.append(member)
        
        print(f"   ✅ Created {len(members)} members")
        db.flush()
        
        # Create Memberships
        print("📝 Creating memberships...")
        memberships = []
        
        for member in members:
            # Select random plan
            plan = random.choice(plans)
            
            # Calculate dates
            start_offset = random.randint(0, 60)
            start_date = member.joined_date + timedelta(days=start_offset)
            end_date = start_date + timedelta(days=plan.duration_days)
            
            # Determine status based on end date
            if end_date < date.today():
                status = MembershipStatus.EXPIRED
            elif random.random() < 0.1:  # 10% paused
                status = MembershipStatus.PAUSED
            else:
                status = MembershipStatus.ACTIVE
            
            # Random payment amount (some full, some partial)
            if random.random() < 0.7:  # 70% fully paid
                amount_paid = plan.price
            else:
                amount_paid = Decimal(int(plan.price * Decimal(random.uniform(0.3, 0.8))))
            
            membership = Membership(
                gym_id=gym.id,
                member_id=member.id,
                plan_id=plan.id,
                start_date=start_date,
                end_date=end_date,
                amount_total=plan.price,
                amount_paid=amount_paid,
                status=status,
                created_by=owner.id,
            )
            db.add(membership)
            memberships.append(membership)
        
        print(f"   ✅ Created {len(memberships)} memberships")
        db.flush()
        
        # Create Payments
        print("💰 Creating payments...")
        payment_count = 0
        
        for membership in memberships:
            if membership.amount_paid > 0:
                # Create one or more payments
                remaining = membership.amount_paid
                payment_date = membership.start_date
                
                while remaining > 0:
                    if remaining > 2000 and random.random() < 0.3:
                        # Partial payment
                        amount = Decimal(random.randint(1000, int(remaining / 2)))
                    else:
                        amount = remaining
                    
                    payment = Payment(
                        gym_id=gym.id,
                        member_id=membership.member_id,
                        membership_id=membership.id,
                        amount=amount,
                        tax_amount=Decimal("0"),
                        payment_mode=random.choice([
                            PaymentMode.CASH, PaymentMode.CASH, PaymentMode.UPI,
                            PaymentMode.UPI, PaymentMode.CARD
                        ]),
                        payment_date=payment_date,
                        reference_number=f"TXN{random.randint(100000, 999999)}" if random.random() > 0.5 else None,
                        received_by=owner.id,
                    )
                    db.add(payment)
                    payment_count += 1
                    
                    remaining -= amount
                    payment_date += timedelta(days=random.randint(1, 15))
        
        print(f"   ✅ Created {payment_count} payments")
        db.flush()
        
        # Create Attendance (last 30 days)
        print("📅 Creating attendance records...")
        attendance_count = 0
        
        active_members = [m for m in members if random.random() < 0.7]  # 70% of members attend
        
        for day_offset in range(30):
            attendance_date = date.today() - timedelta(days=day_offset)
            
            # Random subset of members for each day
            daily_attendees = random.sample(
                active_members,
                min(len(active_members), random.randint(5, 12))
            )
            
            for member in daily_attendees:
                # Random check-in time between 5 AM and 9 PM
                check_in_hour = random.randint(5, 21)
                check_in_minute = random.randint(0, 59)
                
                check_in = datetime(
                    attendance_date.year,
                    attendance_date.month,
                    attendance_date.day,
                    check_in_hour,
                    check_in_minute,
                    tzinfo=timezone.utc
                )
                
                # 80% have checkout
                check_out = None
                if random.random() < 0.8:
                    duration_minutes = random.randint(45, 150)
                    check_out = check_in + timedelta(minutes=duration_minutes)
                
                attendance = Attendance(
                    gym_id=gym.id,
                    member_id=member.id,
                    check_in_time=check_in,
                    check_out_time=check_out,
                    marked_by=owner.id,
                )
                db.add(attendance)
                attendance_count += 1
        
        print(f"   ✅ Created {attendance_count} attendance records")
        
        # Commit all
        db.commit()
        
        print("\n✨ Seed data created successfully!")
        print("\n📋 Login Credentials:")
        print("   Owner:   owner@fitzonegym.com / Owner@123")
        print("   Manager: manager@fitzonegym.com / Staff@123")
        print("   Staff:   staff1@fitzonegym.com / Staff@123")
        print("\n🔗 API: http://localhost:8000")
        print("📚 Docs: http://localhost:8000/docs")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
