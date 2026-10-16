# main.py – a minimal FastAPI back-end that serves an ML model to React.
# Install:  pip install fastapi uvicorn scikit-learn joblib
# Run:      uvicorn main:app --reload --port 8000
# Docs:     http://localhost:8000/docs  (try your endpoint in the browser!)
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Student Success Predictor")

# CORS: allow the React dev server (a different origin/port) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # not "*" in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model ONCE when the server starts – not on every request.
model = joblib.load("model.joblib")


class PredictRequest(BaseModel):
    # Field names must match the JSON keys the front-end sends.
    study_hours: float = Field(ge=0, le=80)
    attendance: float = Field(ge=0, le=100)
    quiz_average: float = Field(ge=0, le=100)


class PredictResponse(BaseModel):
    prediction: str
    probability: float


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    # Invalid input never gets here: FastAPI answers 422 automatically.
    features = [[request.study_hours, request.attendance, request.quiz_average]]
    try:
        probability = float(model.predict_proba(features)[0][1])
    except Exception as error:
        raise HTTPException(status_code=500, detail="The model could not make a prediction.") from error
    return PredictResponse(
        prediction="Pass" if probability >= 0.5 else "At risk",
        probability=round(probability, 3),
    )
