from sqlmodel import Session, select
from backend.database import engine
from backend.models import MockExam, MockAttempt, User
import logging

# Silence logs
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.CRITICAL)

def test_history_logic(user_id):
    with Session(engine) as session:
        print(f"Testing logic for User {user_id}")
        user = session.get(User, user_id)
        if not user:
            print("User not found")
            return

        attempts = session.exec(select(MockAttempt).where(MockAttempt.user_id == user.id).order_by(MockAttempt.created_at.desc())).all()
        print(f"Found {len(attempts)} attempts in DB")
        
        history = []
        for att in attempts:
            try:
                print(f"Processing Attempt {att.id}, ExamID {att.mock_exam_id}")
                exam = session.get(MockExam, att.mock_exam_id)
                
                topic_name = exam.topic_name if exam else "Unknown Topic"
                difficulty = exam.difficulty if exam else "N/A"
                print(f"  -> Exam Found: {exam is not None}, Topic: {topic_name}")
                
                item = {
                    "id": att.id,
                    "topic": topic_name,
                    "difficulty": difficulty,
                    "score": att.score,
                    "total": att.total_questions,
                    "passed": att.passed,
                    "date": att.created_at
                }
                history.append(item)
                print("  -> Appended to history")
            except Exception as e:
                print(f"  -> ERROR: {e}")
        
        print("\nFinal History List:")
        print(history)

if __name__ == "__main__":
    test_history_logic(2)
