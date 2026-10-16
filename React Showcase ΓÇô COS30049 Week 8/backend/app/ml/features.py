"""
features.py – turn a URL (text) into numbers a model can learn from.

A scikit-learn model cannot read text: it needs a fixed-length row of numbers.
This "feature extraction" step must be IDENTICAL when training and when
serving, so train.py and model.py both import `extract_features` from here.
Two separate copies that drift apart is a classic bug called
"training/serving skew" – the model silently receives different inputs in
production from the ones it was trained on.

The features are deliberately simple and human-readable, so the React page can
explain every prediction feature by feature.

It also holds ClipToTrainingRange, the first step of the model pipeline: the
model has only seen URLs of a certain size, so new inputs are clipped to the
range it was trained on instead of letting a linear model extrapolate.
"""
import ipaddress
import math
from collections import Counter
from collections.abc import Iterable
from urllib.parse import urlsplit

import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin

# Words that often appear in fake "log in to fix your account" links.
SUSPICIOUS_WORDS = ("login", "signin", "verify", "account", "update", "secure", "confirm", "password", "banking", "wallet")
SPECIAL_CHARACTERS = set("=&?%_~+!*$#")

# (name, label for people, description). The ORDER here is the column order of
# the feature matrix – never reorder it without retraining the model.
FEATURES: list[tuple[str, str, str]] = [
    # Host length, not the length of the whole URL: anyone can pad a path with letters, and a
    # "whole URL length" feature let a padded suspicious URL look safe.
    ("host_length", "Host length", "Characters in the host name – look-alike hosts are often long."),
    ("dots", "Dots", "How many '.' characters – many dots usually means many sub-domains."),
    ("hyphens", "Hyphens", "How many '-' characters, e.g. secure-login-update."),
    ("digits", "Digits", "How many 0–9 characters."),
    ("special_chars", "Special characters", "Characters such as = & ? % _ ~ + ! (long query strings)."),
    ("https", "Uses HTTPS", "1 if the URL starts with https://, otherwise 0."),
    ("ip_host", "IP address as host", "1 if the host is a raw IP address instead of a name."),
    ("subdomains", "Sub-domains", "Host parts before the main domain: a.b.site.example → 2."),
    ("path_depth", "Path depth", "Number of /folders/ in the path."),
    ("has_at", "Contains '@'", "1 if the URL contains '@' – browsers ignore everything before it."),
    ("suspicious_words", "Suspicious words", "Count of words such as login, verify, account, update, secure."),
    ("entropy", "Character entropy", "Shannon entropy in bits per character – random-looking text scores high."),
]
FEATURE_NAMES = [name for name, _, _ in FEATURES]
FEATURE_LABELS = {name: label for name, label, _ in FEATURES}
FEATURE_DESCRIPTIONS = {name: description for name, _, description in FEATURES}


def shannon_entropy(text: str) -> float:
    """Average information per character: 'aaaa' → 0 bits, random characters → high."""
    if not text:
        return 0.0
    counts = Counter(text)
    n = len(text)
    return -sum(c / n * math.log2(c / n) for c in counts.values())


def _parse(url: str) -> tuple[str, str, str]:
    """Return (scheme, host, path). Never raises – odd input still gets a score."""
    text = url if "://" in url else f"http://{url}"  # "site.example/x" – read it like a browser would
    try:
        parts = urlsplit(text)
        return parts.scheme.lower(), (parts.hostname or "").lower(), parts.path
    except ValueError:  # e.g. "http://[not-an-ip" – malformed, but we can still count characters
        return "", "", ""


def _is_ip(host: str) -> bool:
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        return False


def extract_features(url: str) -> dict[str, float]:
    """One URL → {feature name: value}, in FEATURE_NAMES order."""
    url = url.strip()
    lower = url.lower()
    scheme, host, path = _parse(url)
    ip_host = _is_ip(host)
    labels = [part for part in host.split(".") if part]

    values = {
        "host_length": len(host),
        "dots": url.count("."),
        "hyphens": url.count("-"),
        "digits": sum(ch.isdigit() for ch in url),
        "special_chars": sum(ch in SPECIAL_CHARACTERS for ch in url),
        "https": scheme == "https",
        "ip_host": ip_host,
        # "www.site.example" → 1, "a.b.site.example" → 2 (the last two parts are the main domain)
        "subdomains": 0 if ip_host else max(0, len(labels) - 2),
        "path_depth": len([segment for segment in path.split("/") if segment]),
        "has_at": "@" in url,
        "suspicious_words": sum(lower.count(word) for word in SUSPICIOUS_WORDS),
        "entropy": round(shannon_entropy(lower), 4),
    }
    # float() turns True/False into 1.0/0.0 so every feature is a plain number.
    return {name: float(values[name]) for name in FEATURE_NAMES}


def features_matrix(urls: Iterable[str]) -> np.ndarray:
    """Many URLs → a 2-D array with one row per URL and one column per feature."""
    rows = [list(extract_features(url).values()) for url in urls]  # dicts keep FEATURE_NAMES order
    return np.array(rows, dtype=float).reshape(-1, len(FEATURE_NAMES))


class ClipToTrainingRange(TransformerMixin, BaseEstimator):
    """Pipeline step: remember each column's min/max in fit(), clip new rows to that range in transform().

    The API accepts URLs up to 2,048 characters, but the training URLs are far shorter. A linear
    model keeps adding weight × value however far a value is outside what it has seen, so ONE
    extreme feature could outvote all the others. Clipping keeps every feature inside the
    training range. It lives in this module (not train.py) because joblib saves only the class
    NAME: loading the model must be able to `import app.ml.features.ClipToTrainingRange`.
    """

    def fit(self, X, y=None):
        X = np.asarray(X, dtype=float)
        self.min_, self.max_ = X.min(axis=0), X.max(axis=0)  # trailing _ = learned from data (scikit-learn style)
        return self

    def transform(self, X):
        return np.clip(np.asarray(X, dtype=float), self.min_, self.max_)
