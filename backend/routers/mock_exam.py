from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session, select
from typing import List, Dict, Any
import json
from ..database import get_session
from ..models import User, MockExam, MockAttempt
from ..auth import get_current_user
from ..ai_service import generate_mock_exam

router = APIRouter(prefix="/mock-exam", tags=["mock-exam"])

@router.get("/debug-history")
async def get_debug_history(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    total_attempts = session.exec(select(MockAttempt)).all()
    user_attempts = session.exec(
        select(MockAttempt).where(MockAttempt.user_id == user.id)
    ).all()
    
    # Get all exam IDs referenced by user attempts
    exam_ids = {a.mock_exam_id for a in user_attempts}
    exams = session.exec(
        select(MockExam).where(MockExam.id.in_(exam_ids))
    ).all()
    found_exam_ids = {e.id for e in exams}
    
    return {
        "user_id": user.id,
        "username": user.username,
        "total_db_attempts": len(total_attempts),
        "user_db_attempts": len(user_attempts),
        "user_attempts_details": [
            {"id": a.id, "exam_id": a.mock_exam_id, "score": a.score}
            for a in user_attempts
        ],
        "found_exams": list(found_exam_ids),
        "missing_exams": list(exam_ids - found_exam_ids),
    }

@router.post("/generate")
async def create_generated_exam(
    topic_name: str = Body(...),
    difficulty: str = Body(...),
    count: int = Body(5),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
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
        questions_json=questions_str,
    )
    session.add(mock_exam)
    session.commit()
    session.refresh(mock_exam)
    
    return mock_exam

@router.post("/{exam_id}/submit")
async def submit_exam(
    exam_id: int,
    answers: List[Dict[str, Any]] = Body(...),  # [{"question_index": 0, "answer": "A"}, ...]
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
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
        passed=passed,
    )
    session.add(attempt)
    session.commit()
    
    return {
        "score": score,
        "total": total,
        "passed": passed,
        "xp_earned": (score * 10) if passed else 0,
    }

# ------- IMPORTANT: history & attempt BEFORE /{exam_id} -------- #

@router.get("/history")
async def get_exam_history(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Simple query for all attempts of the user
    attempts = session.exec(
        select(MockAttempt).where(MockAttempt.user_id == user.id)
    ).all()
    
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
        except Exception:
            pass
            
        # Standard XP: 10 per correct answer if passed
        xp = (att.score * 10) if att.passed else 0
            
        history.append({
            "id": att.id,
            "topic": topic_name,
            "difficulty": difficulty,
            "score": att.score,
            "total": att.total_questions,
            "passed": att.passed,
            "date": att.created_at,
            "xp": xp
        })
            
    return history

@router.get("/attempt/{attempt_id}")
async def get_attempt_details(
    attempt_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    attempt = session.get(MockAttempt, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    if attempt.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    exam = session.get(MockExam, attempt.mock_exam_id)
    if not exam:
        # Should not happen if foreign keys are enforced, but handle gracefully
        raise HTTPException(status_code=404, detail="Associated exam not found")
        
    questions = json.loads(exam.questions_json)
    user_answers = json.loads(attempt.answers_json)
    
    # Merge data
    # user_answers structure: [{"question_index": 0, "answer": "A"}, ...]
    ans_map = {a.get("question_index"): a.get("answer") for a in user_answers}
    
    review_data = []
    for i, q in enumerate(questions):
        user_ans = ans_map.get(i)
        correct_ans = q.get("correct_answer")
        q_type = q.get("type", "mcq")
        
        is_correct = False
        if q_type in ["mcq", "boolean"] and user_ans:
            if str(user_ans).lower().strip() == str(correct_ans).lower().strip():
                is_correct = True
        elif q_type == "code":
            # Loose check for now as per submit logic
            if user_ans and len(str(user_ans)) > 10:
                is_correct = True
                
        review_data.append({
            "question": q.get("question"),
            "options": q.get("options"),
            "type": q_type,
            "user_answer": user_ans,
            "correct_answer": correct_ans,
            "is_correct": is_correct,
            "explanation": q.get("explanation", "No explanation provided."),
        })
        
    return {
        "id": attempt.id,
        "exam_id": exam.id,
        "topic": exam.topic_name,
        "difficulty": exam.difficulty,
        "score": attempt.score,
        "total": attempt.total_questions,
        "passed": attempt.passed,
        "date": attempt.created_at,
        "review_data": review_data,
    }

# This MUST stay last so it doesn't shadow /history, /attempt, etc.
@router.get("/{exam_id}")
async def get_exam(
    exam_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    exam = session.get(MockExam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    # Return questions parsed
    return {
        "id": exam.id,
        "topic": exam.topic_name,
        "difficulty": exam.difficulty,
        "questions": json.loads(exam.questions_json),
    }
