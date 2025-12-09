from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import io
import logging

from ..database import get_session
from ..models import User, ChatSession, ChatMessage
from ..auth import get_current_user
from ..ai_service import generate_chat_response

# Try importing pypdf
try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

router = APIRouter(prefix="/chat", tags=["chat"])

# Models for Request/Response
class ChatSessionRead(BaseModel):
    id: int
    title: str
    created_at: datetime

class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageRead(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime

# --- Endpoints ---

@router.get("/sessions", response_model=List[ChatSessionRead])
def get_sessions(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    stmt = select(ChatSession).where(ChatSession.user_id == user.id).order_by(ChatSession.created_at.desc())
    results = session.exec(stmt).all()
    return results

@router.post("/sessions", response_model=ChatSessionRead)
def create_session(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    new_session = ChatSession(user_id=user.id, title="New Chat")
    session.add(new_session)
    session.commit()
    session.refresh(new_session)
    return new_session

@router.get("/sessions/{session_id}", response_model=List[ChatMessageRead])
def get_messages(session_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    chat_session = session.get(ChatSession, session_id)
    if not chat_session or chat_session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Sort messages by timestamp
    return sorted(chat_session.messages, key=lambda m: m.timestamp)

@router.post("/sessions/{session_id}/messages", response_model=ChatMessageRead)
async def send_message(session_id: int, message: ChatMessageCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    chat_session = session.get(ChatSession, session_id)
    if not chat_session or chat_session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    # 1. Save User Message
    user_msg = ChatMessage(session_id=session_id, role="user", content=message.content)
    session.add(user_msg)
    session.commit()
    session.refresh(user_msg)

    # 2. Update Title if it's the first message and title is default
    if chat_session.title == "New Chat":
        # Generate title using AI
        from ..ai_service import generate_chat_title
        new_title = await generate_chat_title(message.content)
        chat_session.title = new_title
        session.add(chat_session)
        session.commit()
        session.refresh(chat_session)

    # 3. Build Context for AI
    # Fetch all previous messages to maintain context history
    # Limit to last 10-20 to avoid token limits? For now, let's take last 20.
    all_msgs = sorted(chat_session.messages, key=lambda m: m.timestamp)
    # We need to construct the list for the AI service
    ai_context = [{"role": "system", "content": "You are a helpful and encouraging educational AI mentor."}]
    for m in all_msgs:
        ai_context.append({"role": m.role, "content": m.content})
    
    # 4. Generate AI Response
    ai_response_text = await generate_chat_response(ai_context)

    # 5. Save AI Message
    ai_msg = ChatMessage(session_id=session_id, role="assistant", content=ai_response_text)
    session.add(ai_msg)
    session.commit()
    session.refresh(ai_msg)

    return ai_msg

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    content = ""
    try:
        file_bytes = await file.read()
        
        if file.filename.lower().endswith(".pdf"):
            if PdfReader:
                reader = PdfReader(io.BytesIO(file_bytes))
                for page in reader.pages:
                    content += page.extract_text() + "\n"
            else:
                return {"text": "[Server] PDF file detected but pypdf is not installed. Please upload text files."}
        else:
            # Assume text/code file
            content = file_bytes.decode("utf-8", errors="ignore")
            
        # Limit content length to avoid exploding context?
        # Let's truncate if huge, e.g. 10k chars
        if len(content) > 20000:
            content = content[:20000] + "\n...[truncated]"

        if not content.strip():
            return {"text": "[Server] Useable text could not be extracted from this file."}

        return {"text": f"Context from file '{file.filename}':\n\n{content}"}

    except Exception as e:
        logging.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process file")

@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    chat_session = session.get(ChatSession, session_id)
    if not chat_session or chat_session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Cascade delete messages? 
    # SQLModel relationships with cascade can handle this, 
    # but to be safe/explicit let's delete messages first if cascade isn't configured in DB
    for msg in chat_session.messages:
        session.delete(msg)
        
    session.delete(chat_session)
    session.commit()
    return {"ok": True}
