from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session
from typing import List, Optional
from ..database import get_session
from ..models import User, Topic, Module, Progress
from ..auth import get_current_user
from ..ai_service import generate_roadmap_ai
from pydantic import BaseModel

router = APIRouter(prefix="/topics", tags=["topics"])

class TopicCreate(BaseModel):
    title: str
    difficulty: str
    duration_days: int
    description: str

class TopicRead(BaseModel):
    id: int
    title: str
    difficulty: str
    duration_days: int
    description: str
    # completed percentage could be computed here

class ModuleRead(BaseModel):
    id: int
    title: str
    description: str
    order_index: int
    is_completed: bool
    score: Optional[int] = 0

class TopicWithModules(TopicRead):
    modules: List[ModuleRead]

@router.post("/", response_model=TopicRead)
async def create_topic(topic_in: TopicCreate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # 1. Generate Roadmap via AI
    # (In a real prodd app, we might want to do this in background if it takes too long, 
    # but for this demo we'll await it to give immediate feedback)
    
    roadmap_data = await generate_roadmap_ai(topic_in.title, topic_in.difficulty, topic_in.duration_days, topic_in.description)
    
    # 2. Save Topic
    db_topic = Topic(
        title=topic_in.title, 
        difficulty=topic_in.difficulty, 
        duration_days=topic_in.duration_days, 
        description=topic_in.description, 
        user_id=user.id
    )
    session.add(db_topic)
    session.commit()
    session.refresh(db_topic)
    
    # 3. Save Modules and Init Progress
    modules_list = roadmap_data.get("modules", [])
    for mod in modules_list:
        db_module = Module(
            title=mod.get("title"),
            description=mod.get("description"),
            order_index=mod.get("order_index"),
            topic_id=db_topic.id
        )
        session.add(db_module)
        session.commit()
        session.refresh(db_module)
        
        # Init progress
        prog = Progress(
            user_id=user.id,
            topic_id=db_topic.id,
            module_id=db_module.id,
            is_completed=False,
            score=0
        )
        session.add(prog)
    
    session.commit()
    return db_topic

@router.get("/", response_model=List[TopicRead])
def get_topics(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    return user.topics

@router.get("/{topic_id}", response_model=TopicWithModules)
def get_topic_details(topic_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    topic = session.query(Topic).filter(Topic.id == topic_id, Topic.user_id == user.id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Construct response with manually checked progress if needed, 
    # but for now we trust the client to fetch progress separately or we join.
    # To keep it simple, we list modules. Completion status is in Progress table.
    # Let's simple check progress table map.
    
    progress_map = {p.module_id: p for p in topic.progress}
    
    modules_resp = []
    for m in topic.modules:
        prog = progress_map.get(m.id)
        modules_resp.append(ModuleRead(
            id=m.id,
            title=m.title,
            description=m.description,
            order_index=m.order_index,
            is_completed=prog.is_completed if prog else False,
            score=prog.score if prog else 0
        ))
    
    # Sort by order
    modules_resp.sort(key=lambda x: x.order_index)
    
    return TopicWithModules(
        id=topic.id,
        title=topic.title,
        difficulty=topic.difficulty,
        duration_days=topic.duration_days,
        description=topic.description,
        modules=modules_resp
    )

@router.delete("/{topic_id}")
def delete_topic(topic_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    topic = session.query(Topic).filter(Topic.id == topic_id, Topic.user_id == user.id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Cascade delete (SQLModel/SQLAlchemy might handle this if configured, but let's be explicit manually or rely on DB CASCADE)
    # For simplicity in SQLite with SQLModel defaults, we might need manual cleanup if relationships aren't set to cascade.
    # We will just delete the topic and let the frontend handle the refresh.
    # In a real app, delete modules, slides, progress etc.
    session.delete(topic)
    session.commit()
    return {"ok": True}
