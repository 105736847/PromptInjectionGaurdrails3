# main.py – serving the React build (the dist/ folder) from FastAPI.
# Every URL that is not an API route or a real file returns index.html,
# and React Router then shows the right page in the browser.
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()
DIST = Path("dist")  # created by `npm run build`


@app.post("/api/predict")  # 1. API routes first …
def predict():
    ...


app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")  # 2. JS/CSS files


@app.get("/{full_path:path}")  # 3. … and the catch-all LAST
def spa_fallback(full_path: str):
    file = (DIST / full_path).resolve()
    # Serve real files such as /favicon.svg – but never anything outside dist/
    if full_path and file.is_file() and file.is_relative_to(DIST.resolve()):
        return FileResponse(file)
    return FileResponse(DIST / "index.html")  # /routing/students/3 → index.html
