"""
app.ml – a small, explainable machine-learning model served by FastAPI.

A TOY "suspicious URL" classifier trained on synthetic, fictional URLs. It exists
to show HOW a model is served (Assignment 3 architecture), not to detect real
phishing.

    features.py   URL text → 12 numbers + the clip step (shared by training AND serving)
    dataset.py    a deterministic synthetic dataset of labelled URLs
    train.py      offline training:  python -m app.ml.train  → artifacts/
    model.py      load the artifact once, predict + explain per request
"""
