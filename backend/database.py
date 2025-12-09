from sqlmodel import SQLModel, create_engine, Session
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = "sqlite:///./learning_assistant_v2.db" # os.getenv("DATABASE_URL", "sqlite:///./learning_assistant.db")

connect_args = {"check_same_thread": False}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
