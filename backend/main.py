from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import create_db_and_tables
from .routers import auth, topics, learning, progress, chat, mock_exam
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan, title="AI Learning Assistant API")

# Allow all origins for development
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(topics.router)
app.include_router(learning.router)
app.include_router(progress.router)
app.include_router(chat.router)
app.include_router(mock_exam.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Learning Assistant API"}
