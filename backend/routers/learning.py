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
    quizzes: List[QuizRead]

class QuizSubmitItem(BaseModel):
    quiz_id: int
    selected_option: str

class QuizSubmit(BaseModel):
    answers: List[QuizSubmitItem]

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
        quizzes_data = content_data.get("quizzes", [])
        for q_data in quizzes_data:
            db_quiz = Quiz(
                question=q_data.get("question"),
                options=json.dumps(q_data.get("options")), # Store as JSON string
                correct_answer=q_data.get("correct_answer"),
                module_id=module.id
            )
            session.add(db_quiz)
        
        session.commit()
        session.refresh(module)
    
    # Construct response
    slides_resp = [SlideRead(id=s.id, content=s.content, order_index=s.order_index) for s in module.slides]
    slides_resp.sort(key=lambda x: x.order_index)
    
    quizzes_resp = []
    # Explicitly query to ensure we get them all
    db_quizzes = session.query(Quiz).filter(Quiz.module_id == module.id).all()
    for q in db_quizzes:
        quizzes_resp.append(QuizRead(
            id=q.id,
            question=q.question,
            options=json.loads(q.options)
        ))
            
    return ModuleContent(
        module_id=module.id,
        title=module.title,
        slides=slides_resp,
        quizzes=quizzes_resp
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
    
    # Get all quizzes
    db_quizzes = session.query(Quiz).filter(Quiz.module_id == module.id).all()
    quiz_map = {q.id: q for q in db_quizzes}
    
    correct_count = 0
    total_questions = len(db_quizzes)
    
    results = []
    
    for ans in submit.answers:
        q = quiz_map.get(ans.quiz_id)
        if not q:
            continue
            
        is_correct = (ans.selected_option == q.correct_answer)
        if is_correct:
            correct_count += 1
            
        results.append({
            "quiz_id": q.id,
            "correct": is_correct,
            "correct_answer": q.correct_answer
        })
        
    score_percentage = int((correct_count / total_questions) * 100) if total_questions > 0 else 0
    passed = score_percentage >= 80

    # Update progress
    progress = session.query(Progress).filter(
        Progress.module_id == module_id, 
        Progress.user_id == user.id
    ).first()
    
    if progress:
        # Only mark completed if passed
        if passed:
            progress.is_completed = True 
        
        # Always update score to the latest attempt (or max? let's do latest for retry logic)
        progress.score = score_percentage
        progress.completed_at = datetime.utcnow()
        session.add(progress)
        session.commit()
    
    return {
        "passed": passed,
        "score": score_percentage,
        "results": results
    }
