from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    
    topics: List["Topic"] = Relationship(back_populates="user")

class Topic(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    difficulty: str
    duration_days: int
    description: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    user_id: int = Field(foreign_key="user.id")
    user: User = Relationship(back_populates="topics")
    
    modules: List["Module"] = Relationship(back_populates="topic")
    progress: List["Progress"] = Relationship(back_populates="topic")

class Module(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    order_index: int
    
    topic_id: int = Field(foreign_key="topic.id")
    topic: Topic = Relationship(back_populates="modules")
    
    slides: List["Slide"] = Relationship(back_populates="module")
    quizzes: List["Quiz"] = Relationship(back_populates="module")
    
    # helper for checking completion for a specific user requires a join, 
    # but we will track it in Progress table generally.

class Slide(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str # Markdown content
    order_index: int
    
    module_id: int = Field(foreign_key="module.id")
    module: Module = Relationship(back_populates="slides")

class Quiz(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    question: str
    options: str  # Stored as JSON string list ["A", "B", "C", "D"]
    correct_answer: str
    
    module_id: int = Field(foreign_key="module.id")
    module: Module = Relationship(back_populates="quizzes")

class Progress(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    topic_id: int = Field(foreign_key="topic.id")
    module_id: int = Field(foreign_key="module.id")
    is_completed: bool = Field(default=False)
    score: Optional[int] = Field(default=None) # For quiz
    completed_at: Optional[datetime] = Field(default=None)

    topic: Topic = Relationship(back_populates="progress")
    # We can add relationships to User and Module if needed for deep queries

class ChatSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    title: str = Field(default="New Chat")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    messages: List["ChatMessage"] = Relationship(back_populates="session")

class ChatMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="chatsession.id")
    role: str # user, assistant, system
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    session: ChatSession = Relationship(back_populates="messages")

class MockExam(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    topic_name: str
    difficulty: str
    questions_json: str # JSON string of list of questions
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MockAttempt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    mock_exam_id: int = Field(foreign_key="mockexam.id")
    user_id: int = Field(foreign_key="user.id")
    score: int
    total_questions: int
    answers_json: str # JSON string of user answers
    passed: bool
    created_at: datetime = Field(default_factory=datetime.utcnow)
