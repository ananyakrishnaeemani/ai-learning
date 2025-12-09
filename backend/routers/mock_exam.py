from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session, select
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
from ..database import get_session
from ..models import User, MockExam, MockAttempt
from ..auth import get_current_user
from ..ai_service import generate_mock_exam

router = APIRouter(prefix="/mock-exam", tags=["mock-exam"])

@router.get("/debug-history")
async def get_debug_history(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    total_attempts = session.exec(select(MockAttempt)).all()
    user_attempts = session.exec(select(MockAttempt).where(MockAttempt.user_id == user.id)).all()
    
    # Get all exam IDs referenced by user attempts
    exam_ids = {a.mock_exam_id for a in user_attempts}
    exams = session.exec(select(MockExam).where(MockExam.id.in_(exam_ids))).all()
    found_exam_ids = {e.id for e in exams}
    
    return {
        "user_id": user.id,
        "username": user.username,
        "total_db_attempts": len(total_attempts),
        "user_db_attempts": len(user_attempts),
        "user_attempts_details": [{"id": a.id, "exam_id": a.mock_exam_id, "score": a.score} for a in user_attempts],
        "found_exams": list(found_exam_ids),
        "missing_exams": list(exam_ids - found_exam_ids)
    }

@router.post("/generate")
async def create_generated_exam(
    topic_name: str = Body(...),
    difficulty: str = Body(...),
    count: int = Body(5),
    user: User = Depends(get_current_user), 
    session: Session = Depends(get_session)
):
    # 1. Generate via AI
    exam_data = await generate_mock_exam(topic_name, difficulty, count)
    
    # 2. Save to DB
    # exam_data is {"questions": [...]}
    questions_list = exam_data.get("questions", [])
    questions_str = json.dumps(questions_list)
    
    mock_exam = MockExam(
        user_id=user.id,
        topic_name=topic_name,
        difficulty=difficulty,
        questions_json=questions_str
    )
    session.add(mock_exam)
    session.commit()
    session.refresh(mock_exam)
    
    return mock_exam

@router.post("/{exam_id}/submit")
async def submit_exam(
    exam_id: int,
    answers: List[Dict[str, Any]] = Body(...), # [{"question_index": 0, "answer": "A"}, ...]
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    exam = session.get(MockExam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    questions = json.loads(exam.questions_json)
    score = 0
    total = len(questions)
    
    # Grading Logic
    for ans_obj in answers:
        q_idx = ans_obj.get("question_index")
        user_ans = ans_obj.get("answer")
        
        if q_idx is not None and 0 <= q_idx < total:
            question = questions[q_idx]
            q_type = question.get("type", "mcq")
            
            if q_type in ["mcq", "boolean"]:
                correct = question.get("correct_answer")
                if str(user_ans).lower().strip() == str(correct).lower().strip():
                    score += 1
            elif q_type == "code":
                # Simple heuristic for now: logic should ideally be client-side test passing
                # or AI grading. We'll award point if length > 10.
                if user_ans and len(str(user_ans)) > 10:
                    score += 1
                    
    passed = (score / total) >= 0.75 if total > 0 else False
    
    attempt = MockAttempt(
        mock_exam_id=exam.id,
        user_id=user.id,
        score=score,
        total_questions=total,
        answers_json=json.dumps(answers),
        passed=passed
    )
    session.add(attempt)
    session.commit()
    
    return {"score": score, "total": total, "passed": passed, "xp_earned": score if passed else 0}

@router.get("/{exam_id}")
async def get_exam(exam_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    exam = session.get(MockExam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    # Return questions parsed
    return {
        "id": exam.id,
        "topic": exam.topic_name,
        "difficulty": exam.difficulty,
        "questions": json.loads(exam.questions_json)
    }

@router.get("/history")
async def get_exam_history(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # Reverting to simple query to debug
    # Removed order_by temporarily
    attempts = session.exec(select(MockAttempt).where(MockAttempt.user_id == user.id)).all()
    
    history = []
    for att in attempts:
        topic_name = "Unknown"
        difficulty = "N/A"
        
        # Try to fetch exam details
        try:
            exam = session.get(MockExam, att.mock_exam_id)
            if exam:
                topic_name = exam.topic_name
                difficulty = exam.difficulty
        except:
            pass
            
        history.append({
            "id": att.id,
            "topic": topic_name,
            "difficulty": difficulty,
            "score": att.score,
            "total": att.total_questions,
            "passed": att.passed,
            "date": att.created_at
        })
            
    return history
