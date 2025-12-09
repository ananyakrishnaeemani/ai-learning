from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Dict, Any
from datetime import datetime, timedelta
from ..database import get_session
from ..models import User, Progress, Topic, Module, MockAttempt
from ..auth import get_current_user
from ..ai_service import client, MODEL
import json

router = APIRouter(prefix="/progress", tags=["progress"])

@router.get("/dashboard")
async def get_progress_dashboard(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # 1. Basic Stats
    total_topics = len(user.topics)
    
    # Calculate modules completed and total
    user_progress = session.query(Progress).filter(Progress.user_id == user.id).all()
    
    modules_completed = sum(1 for p in user_progress if p.is_completed)
    total_modules_enrolled = sum(len(t.modules) for t in user.topics)
    
    # Average Score
    scores = [p.score for p in user_progress if p.score is not None and p.score > 0]
    avg_score = int(sum(scores) / len(scores)) if scores else 0
    
    # 2. Streak Calculation & Heatmap Data
    activity_dates = []
    if user_progress:
        valid_dates = [p.completed_at.date() for p in user_progress if p.completed_at]
        valid_dates.sort()
        
        date_counts = {}
        for d in valid_dates:
            d_str = d.isoformat()
            date_counts[d_str] = date_counts.get(d_str, 0) + 1
            
        activity_dates = [{"date": k, "count": v} for k, v in date_counts.items()]
    
    streak = 0
    today = datetime.utcnow().date()
    if any(p.completed_at and p.completed_at.date() == today for p in user_progress):
        streak = 1
        check_date = today - timedelta(days=1)
    else:
        check_date = today - timedelta(days=1)
        if any(p.completed_at and p.completed_at.date() == check_date for p in user_progress):
            streak = 1
            check_date = check_date - timedelta(days=1)
        else:
            streak = 0
            
    if streak > 0:
        unique_dates_set = {p.completed_at.date() for p in user_progress if p.completed_at}
        while check_date in unique_dates_set:
            streak += 1
            check_date -= timedelta(days=1)

    # 3. Topic Breakdown
    topic_stats = []
    total_xp = 0
    
    # Mock Exam XP
    mock_attempts = session.query(MockAttempt).filter(MockAttempt.user_id == user.id, MockAttempt.passed == True).all()
    for att in mock_attempts:
        total_xp += (att.score * 5) # 5 points per question roughly? Or just use score directly. Let's use score * 10 for meaningful XP.
        # Just use score as base xp
    
    topics_started_count = 0
    topics_done_count = 0

    for topic in user.topics:
        t_modules_total = len(topic.modules)
        t_completed_records = [p for p in user_progress if p.topic_id == topic.id and p.is_completed]
        t_completed = len(t_completed_records)
        
        # XP Calculation
        for p in t_completed_records:
            total_xp += 10
            if p.score:
                total_xp += int(p.score / 10)
        
        percent = int((t_completed / t_modules_total) * 100) if t_modules_total > 0 else 0
        
        if percent > 0:
            topics_started_count += 1
        if percent == 100:
            topics_done_count += 1
        
        topic_stats.append({
            "id": topic.id,
            "title": topic.title,
            "total_modules": t_modules_total,
            "completed_modules": t_completed,
            "percent": percent
        })

    # 4. Estimated Hours
    estimated_hours = round(modules_completed * 0.33, 1)

    # 5. Last 7 Days Activity
    chart_data = []
    today_date = datetime.utcnow().date()
    for i in range(6, -1, -1):
        d = today_date - timedelta(days=i)
        count = 0
        if user_progress:
            count = sum(1 for p in user_progress if p.completed_at and p.completed_at.date() == d)
        
        chart_data.append({
            "name": d.strftime("%a"),
            "progress": count
        })
        
    # 6. Resume Module
    resume_module = None
    if user_progress:
        last_completed = sorted([p for p in user_progress if p.completed_at], key=lambda x: x.completed_at, reverse=True)
        if last_completed:
            last_p = last_completed[0]
            next_mod = session.query(Module).filter(
                Module.topic_id == last_p.topic_id,
                Module.order_index > session.get(Module, last_p.module_id).order_index
            ).order_by(Module.order_index).first()
            
            if next_mod:
                topic_title = session.get(Topic, last_p.topic_id).title
                resume_module = {
                    "id": next_mod.id,
                    "title": next_mod.title,
                    "topic_title": topic_title
                }

    return {
        "stats": {
            "total_topics": total_topics,
            "modules_completed": modules_completed,
            "total_modules": total_modules_enrolled,
            "avg_score": avg_score,
            "streak": streak,
            "total_xp": total_xp,
            "topics_started": topics_started_count,
            "topics_done": topics_done_count,
            "estimated_hours": estimated_hours
        },
        "heatmap": activity_dates,
        "topics": topic_stats,
        "chart_data": chart_data,
        "resume_module": resume_module
    }

@router.get("/ai-insights")
async def get_ai_insights(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    recent_activity = session.query(Progress).filter(
        Progress.user_id == user.id,
        Progress.score != None
    ).order_by(Progress.completed_at.desc()).limit(10).all()
    
    if not recent_activity:
        return {"message": "Start learning to get AI insights!"}
        
    data_summary = []
    for p in recent_activity:
        mod = session.get(Module, p.module_id)
        data_summary.append(f"Module: {mod.title}, Score: {p.score}%")
        
    prompt = f"""
    Analyze this student's recent performance:
    {json.dumps(data_summary)}
    
    1. Identify one main strength.
    2. Identify one area for improvement.
    3. Give a short 1-sentence motivational quote tailored to them.
    
    Return as JSON: {{ "strength": "...", "weakness": "...", "motivation": "..." }}
    """
    
    try:
        response = await client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are an encouraging learning coach."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"AI Insight Error: {e}")
        return {
            "strength": "Consistency",
            "weakness": "None detected yet",
            "motivation": "Keep pushing forward!"
        }
