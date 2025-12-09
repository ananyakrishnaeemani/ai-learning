import logging
# Force silence
logging.getLogger('sqlalchemy.engine').setLevel(logging.CRITICAL)
logging.getLogger('sqlalchemy.pool').setLevel(logging.CRITICAL)
logging.getLogger('sqlalchemy.dialects').setLevel(logging.CRITICAL)
logging.getLogger('sqlalchemy.orm').setLevel(logging.CRITICAL)

from sqlmodel import Session, select
from backend.database import engine
# Try to disable echo if property exists, though it's usually init-time
engine.echo = False
from backend.models import MockExam, MockAttempt, User

def debug():
    with Session(engine) as session:
        print("--- USERS ---")
        users = session.exec(select(User)).all()
        for u in users:
            print(f"ID: {u.id}, Name: {u.username}")

        print("\n--- MOCK EXAMS ---")
        exams = session.exec(select(MockExam)).all()
        for e in exams:
            print(f"ID: {e.id}, Topic: {e.topic_name}, User: {e.user_id}")
            
        print("\n--- ATTEMPTS ---")
        attempts = session.exec(select(MockAttempt)).all()
        for a in attempts:
            print(f"ID: {a.id}, ExamID: {a.mock_exam_id}, User: {a.user_id}, Score: {a.score}, Passed: {a.passed}")

if __name__ == "__main__":
    debug()
