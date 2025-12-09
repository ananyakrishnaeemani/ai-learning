import os
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# We use the generic OpenAI client but point it to Groq or any compatible API if needed.
# For Groq, the base_url is https://api.groq.com/openai/v1
# If the user provides an OpenAI key, we could default to standard OpenAI, 
# but the prompt implies free version of Grok/Groq.

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
BASE_URL = "https://api.groq.com/openai/v1" 

# fallback to generic if key is missing (it will fail at runtime but avoids crash on import)
if not GROQ_API_KEY:
    print("Warning: GROQ_API_KEY not found in environment.")

client = AsyncOpenAI(
    api_key=GROQ_API_KEY,
    base_url=BASE_URL
)

# Model to use. Groq supports llama3-8b-8192, mixtral-8x7b-32768, etc.
MODEL = "llama-3.3-70b-versatile"

async def generate_roadmap_ai(topic: str, difficulty: str, duration: int, description: str):
    prompt = f"""
    Create a learning roadmap for the topic: "{topic}".
    Difficulty: {difficulty}.
    Duration: {duration} days.
    Description/Focus: {description}.
    
    Return a valid JSON object with a key "modules" which is a list of objects.
    Each object must have:
    - "title": string
    - "description": string (brief summary)
    - "order_index": integer (1-based)
    
    Ensure the roadmap covers the duration appropriately.
    Do not return markdown formatting, just raw JSON.
    """
    
    try:
        response = await client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful educational AI assistant. Always return pure JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"Error generating roadmap: {e}")
        # Fallback mock data if AI fails
        return {
            "modules": [
                {"title": f"Introduction to {topic}", "description": "Basics and Setup", "order_index": 1},
                {"title": f"Core Concepts of {topic}", "description": "Deep dive into main ideas", "order_index": 2},
                {"title": f"Advanced {topic}", "description": "Complex topics and projects", "order_index": 3}
            ]
        }

async def generate_module_content_ai(topic: str, module_title: str):
    prompt = f"""
    Generate detailed educational content for the module "{module_title}" of the topic "{topic}".
    
    Return a valid JSON object with two keys: "slides" and "quizzes".
    
    "slides": A list of objects, each with:
    - "content": string (Markdown format with headings, bullet points, etc. Make it detailed.)
    - "order_index": integer (1-based)
    Target about 4-6 slides.
    
    "quizzes": A LIST of objects (5 questions) representing the quiz for this module, each with:
    - "question": string
    - "options": list of strings (4 options)
    - "correct_answer": string (must strictly match one of the options)
    
    Do not return markdown formatting for the JSON itself, just raw JSON.
    """
    
    try:
        response = await client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful educational AI assistant. Always return pure JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"Error generating content: {e}")
        return {
            "slides": [
                {"content": "# Error \n Could not generate content.", "order_index": 1}
            ],
            "quizzes": [
                {
                    "question": "Error generating quiz?",
                    "options": ["Yes", "No", "Maybe", "Unsure"],
                    "correct_answer": "Yes"
                }
            ]
        }
