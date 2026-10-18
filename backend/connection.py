from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import core

def init_conn():
    uvicorn.run(app)

app = FastAPI()

# class Message(BaseModel):
#     message: str

# CORS (Cross-Origin Resource Sharing) middleware configuration
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# @app.get("/")
# def read_data():
#     return {"message": "Hello World"}

# @app.post("/")
# def create_data(data: Message):
#     return {
#         "received": data.message,
#         "status": "success"
#     }

class Prompt(BaseModel):
    prompt: str

@app.post("/prompt")
def process_prompt(data: Prompt):
    core.process_prompt(prompt=data.prompt)
    return {
        "received": data.prompt,
    }

@app.get("/history")
def read_data():
    return core.get_prompts()