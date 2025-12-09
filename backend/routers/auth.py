from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session
from datetime import timedelta
from ..database import get_session
from ..models import User
from ..auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/signup", response_model=Token)
def signup(user: UserCreate, session: Session = Depends(get_session)):
    db_user = session.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pwd = get_password_hash(user.password)
    new_user = User(username=user.username, email=user.email, hashed_password=hashed_pwd)
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

class UserRead(BaseModel):
    id: int
    username: str
    email: str

@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

class UserUpdate(BaseModel):
    email: str

@router.put("/me", response_model=UserRead)
def update_user_me(user_update: UserUpdate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    current_user.email = user_update.email
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
def change_password(pwd_change: PasswordChange, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if not verify_password(pwd_change.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.hashed_password = get_password_hash(pwd_change.new_password)
    session.add(current_user)
    session.commit()
    return {"message": "Password updated successfully"}
