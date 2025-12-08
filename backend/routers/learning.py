from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List, Optional
from ..database import get_session
from ..models import User, Module, Slide, Quiz, Progress, Topic
from ..auth import get_current_user
from ..ai_service import generate_module_content_ai
from pydantic import BaseModel
import json
from datetime import datetime

router = APIRouter(prefix="/learning", tags=["learning"])

class SlideRead(BaseModel):
    id: int
    content: str
    order_index: int

class QuizRead(BaseModel):
    id: int
    question: str
    options: List[str]
    # correct answer should NOT be sent to frontend if we want secure grading,
    # but for simple immediate feedback mode we can send it or check on server.
    # Let's check on server for better design.

class ModuleContent(BaseModel):
    module_id: int
    title: str
    slides: List[SlideRead]
    quiz: Optional[QuizRead]

class QuizSubmit(BaseModel):
    selected_option: str

@router.get("/module/{module_id}", response_model=ModuleContent)
async def get_module_content(module_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # Verify access (user owns the topic of this module)
    # Join Module -> Topic -> User
    module = session.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    topic = session.get(Topic, module.topic_id)
    if topic.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if content exists
    if not module.slides:
        # Generate content
        content_data = await generate_module_content_ai(topic.title, module.title)
        
        # Save slides
        slides_data = content_data.get("slides", [])
        for s in slides_data:
            db_slide = Slide(
                content=s.get("content"), 
                order_index=s.get("order_index"), 
                module_id=module.id
            )
            session.add(db_slide)
        
        # Save quiz
        quiz_data = content_data.get("quiz")
        if quiz_data:
            db_quiz = Quiz(
                question=quiz_data.get("question"),
                options=json.dumps(quiz_data.get("options")), # Store as JSON string
                correct_answer=quiz_data.get("correct_answer"),
                module_id=module.id
            )
            session.add(db_quiz)
        
        session.commit()
        session.refresh(module)
    
    # Construct response
    slides_resp = [SlideRead(id=s.id, content=s.content, order_index=s.order_index) for s in module.slides]
    slides_resp.sort(key=lambda x: x.order_index)
    
    quiz_resp = None
    if module.quiz:
        # We assume one quiz per module for now
        # Actually module.quiz is a list relation in models? 
        # Wait, in models I defined: quiz: Optional["Quiz"] = Relationship(back_populates="module")
        # But One-to-One is tricky in SQLModel if not careful, usually it creates a list unless uselist=False.
        # Let's assume it might be a list in `module.quiz` if I didn't set sa_relationship_kwargs={"uselist": False}
        # But I defined `quiz` as a single object type hint? 
        # SQLModel relationships are list by default for the 'many' side.
        # Let's treat it safely.
        
        # Actually looking at models.py: 
        # quiz: Optional["Quiz"] = Relationship(back_populates="module")
        # In the Quiz model: module: Module = Relationship(back_populates="quiz")
        # This implies One-to-Many (One Module has Many Quizzes) unless specified.
        # I'll retrieve the first quiz.
        
        # Hotfix: I'll just query Quiz table directly for safety.
        q = session.query(Quiz).filter(Quiz.module_id == module.id).first()
        if q:
            quiz_resp = QuizRead(
                id=q.id,
                question=q.question,
                options=json.loads(q.options)
            )
            
    return ModuleContent(
        module_id=module.id,
        title=module.title,
        slides=slides_resp,
        quiz=quiz_resp
    )

@router.post("/module/{module_id}/complete_slide")
def complete_slide(module_id: int):
    # Optional endpoint if we want to track slide-by-slide progress
    return {"ok": True}

@router.post("/module/{module_id}/submit_quiz")
def submit_quiz(module_id: int, submit: QuizSubmit, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # Verify access
    module = session.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Get the quiz
    q = session.query(Quiz).filter(Quiz.module_id == module.id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    is_correct = (submit.selected_option == q.correct_answer)
    
    # Update progress
    progress = session.query(Progress).filter(
        Progress.module_id == module_id, 
        Progress.user_id == user.id
    ).first()
    
    if progress:
        progress.is_completed = True # Mark module as completed regardless of score? Or only if correct?
        # User requirement: "I'll be writing the quiz and the first module is done"
        # Let's say completion requires attempting the quiz.
        if is_correct:
            progress.score = 100
        else:
            progress.score = 0
        progress.completed_at = datetime.utcnow()
        session.add(progress)
        session.commit()
    
    return {"correct": is_correct, "correct_answer": q.correct_answer}
