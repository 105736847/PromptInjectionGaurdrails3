"""
dataset.py – a deterministic, SYNTHETIC dataset of labelled URLs.

    urls, labels = make_dataset(n=4000, seed=42)     # label 1 = suspicious, 0 = safe

This is a TOY. Every site is fictional and uses names reserved for examples
(.example / .test / .invalid and the documentation IP ranges 192.0.2.x,
198.51.100.x, 203.0.113.x), so nothing here points to a real website, and
the model trained on it knows nothing about real-world phishing.

Deterministic (seeded) data means everybody who runs `python -m app.ml.train`
gets exactly the same model and the same numbers on the React page.

A little ambiguity is added on purpose (real login pages, tokens in safe links,
typo-squatted hosts and ~2% wrong labels) so the model is good but not
perfect – otherwise the precision/recall trade-off would be invisible.
"""
import csv
import random
from pathlib import Path

SAFE_HOSTS = [
    "www.brightwater-uni.example", "library.brightwater-uni.example", "learn.brightwater-uni.example",
    "brightwater-uni.example", "student.portal.brightwater-uni.example", "www.harbourcity-news.example",
    "shop.greenleaf-books.example", "docs.pyfriends.example", "pyfriends.example", "www.southbay-weather.example",
    "maps.roamly.example", "www.cafe-aurora.example", "careers.northwind-labs.example", "www.citytransit.test",
    "blog.pixelgarden.example", "pixelgarden.example",
]
SAFE_SEGMENTS = [
    "courses", "cos30049", "news", "2026", "events", "open-day", "timetable", "search", "books",
    "react-hooks", "weather", "melbourne", "jobs", "graduate", "about", "contact", "menu", "docs",
    "tutorial", "fastapi", "getting-started", "blog", "photos", "campus", "parking", "week-8",
]
SAFE_FILES = ["index.html", "unit-guide.pdf", "map.png", "timetable.ics", "notes.txt", "report-2026.pdf"]
# Real sites use "trigger" words too – a lexical model must not rely on them alone.
SAFE_ACCOUNT_PAGES = [
    "login", "signin", "account/settings", "account", "news/security-update", "help/secure-payments",
    "password-reset", "verify-email", "account/orders",
]
SAFE_QUERIES = ["?q=react+hooks", "?page=2", "?sort=newest", "?lang=en", "?id=1042", "?week=8", "?utm_source=newsletter"]

BRANDS = ["brightwater-uni", "greenleaf-books", "harbourcity-bank", "roamly", "pyfriends", "northwind-mail"]
TRIGGER_WORDS = ["login", "verify", "account", "update", "secure", "signin", "confirm", "password", "banking", "wallet"]
FILLER_WORDS = ["support", "service", "online", "portal", "auth", "id", "center", "help", "alert", "billing", "cloud"]
ODD_TLDS = [".example", ".test", ".invalid"]
DOC_IP_PREFIXES = ["192.0.2.", "198.51.100.", "203.0.113."]  # reserved for documentation (RFC 5737)
TOKEN_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789"


def _token(rng: random.Random, low: int, high: int, chars: str = TOKEN_CHARS) -> str:
    return "".join(rng.choice(chars) for _ in range(rng.randint(low, high)))


def safe_url(rng: random.Random) -> str:
    scheme = "https" if rng.random() < 0.9 else "http"
    host = rng.choice(SAFE_HOSTS)
    roll = rng.random()
    if roll < 0.12:  # real login / account pages exist – "login" alone is not proof
        return f"https://{host}/{rng.choice(SAFE_ACCOUNT_PAGES)}"
    segments = rng.sample(SAFE_SEGMENTS, rng.randint(0, 2))
    if rng.random() < 0.15:
        segments.append(rng.choice(SAFE_FILES))
    url = f"{scheme}://{host}/" + "/".join(segments)
    if roll < 0.18:  # legitimate links can carry long random-looking tokens
        url += f"?session={_token(rng, 16, 24, '0123456789abcdef')}"
    elif roll < 0.34:
        url += rng.choice(SAFE_QUERIES)
    return url


def _tracking_query(rng: random.Random) -> str:
    """Phishing kits often add tokens so that every victim gets a unique link."""
    return f"?{rng.choice(['id', 'user', 'ref', 's'])}={_token(rng, 8, 20)}&n={rng.randint(100, 99999)}"


def suspicious_url(rng: random.Random) -> str:
    brand, filler, tld = rng.choice(BRANDS), rng.choice(FILLER_WORDS), rng.choice(ODD_TLDS)
    trigger = rng.choice(TRIGGER_WORDS)
    # Only some phishing links shout "login" – many use neutral paths.
    word = trigger if rng.random() < 0.6 else rng.choice(SAFE_SEGMENTS)
    scheme = "https" if rng.random() < 0.35 else "http"  # attackers use HTTPS too
    ip = rng.choice(DOC_IP_PREFIXES) + str(rng.randint(1, 254))
    query = _tracking_query(rng) if rng.random() < 0.7 else ""
    folder = f"/{rng.choice(['wp-content', 'secure', 'files', 'docs', 'app'])}" if rng.random() < 0.5 else ""
    roll = rng.random()
    if roll < 0.12:  # raw IP address instead of a name
        return f"{scheme}://{ip}{folder}/{brand}/{word}{query}"
    if roll < 0.18:  # the '@' trick: everything before @ is ignored by the browser
        return f"http://{brand}.example@{ip}/{word}"
    if roll < 0.42:  # look-alike host made of hyphenated words
        return f"{scheme}://{brand}-{filler}-{trigger}{tld}{folder}/{word}/{_token(rng, 4, 10)}{query}"
    if roll < 0.62:  # many sub-domains so the real brand appears "inside" the host
        return f"{scheme}://{brand}.example.{filler}.{trigger}.{_token(rng, 3, 6)}{tld}{folder}/{word}{query}"
    if roll < 0.82:  # random-looking host and path
        return f"{scheme}://{_token(rng, 8, 14)}{tld}/{_token(rng, 5, 10)}/{word}{_tracking_query(rng)}"
    if roll < 0.88:  # short "link shortener" style URL – short, but random
        return f"{scheme}://sh{_token(rng, 1, 3)}{tld}/{_token(rng, 5, 8, TOKEN_CHARS + 'ABCDEFGHJKLMNPQRSTUVWXYZ')}"
    # typo-squatting: looks almost normal – the hardest case for a lexical model
    typo = brand.replace("i", "l", 1) if "i" in brand else brand + "s"
    return f"https://www.{typo}.example/{word}"


def make_dataset(n: int = 4000, suspicious_ratio: float = 0.35, seed: int = 42, label_noise: float = 0.02):
    """Return (urls, labels) – the same lists every time for the same arguments."""
    rng = random.Random(seed)
    urls, labels = [], []
    for _ in range(n):
        label = 1 if rng.random() < suspicious_ratio else 0
        urls.append(suspicious_url(rng) if label else safe_url(rng))
        if rng.random() < label_noise:  # real datasets contain mistakes too
            label = 1 - label
        labels.append(label)
    return urls, labels


# One vocabulary for labels, used by training (load_csv) AND by the batch endpoint,
# so a labelled CSV that works in the React demo also works for `--csv`.
LABEL_WORDS = {"1": 1, "suspicious": 1, "true": 1, "0": 0, "safe": 0, "false": 0}


def parse_label(value: str) -> int | None:
    """'1' / 'suspicious' / 'true' → 1, '0' / 'safe' / 'false' → 0, anything else → None."""
    return LABEL_WORDS.get(value.strip().lower())


def require_both_classes(labels: list[int], source: str = "the data") -> None:
    """A train/test split that keeps the class balance needs at least 2 examples of EACH class."""
    safe, suspicious = labels.count(0), labels.count(1)
    if min(safe, suspicious) < 2:
        raise ValueError(f"{source}: need at least 2 examples of BOTH classes to train and test a classifier, "
                         f"got {safe} safe and {suspicious} suspicious")


def load_csv(path: str | Path) -> tuple[list[str], list[int]]:
    """Read your own data: a CSV with a `url` column and a `label` column (1/suspicious or 0/safe)."""
    urls, labels = [], []
    with open(path, newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        columns = {name.strip().lower(): name for name in reader.fieldnames or []}
        if "url" not in columns or "label" not in columns:
            raise ValueError(f"{path}: the CSV needs 'url' and 'label' columns, found {list(columns)}")
        for row in reader:
            url, raw = (row[columns["url"]] or "").strip(), row[columns["label"]] or ""
            if not url:
                continue
            label = parse_label(raw)
            if label is None:
                # reader.line_num = the file line this row ended on (correct even for multi-line cells)
                raise ValueError(f"{path}, line {reader.line_num}: label must be 0/1 or safe/suspicious, got {raw!r}")
            urls.append(url)
            labels.append(label)
    require_both_classes(labels, str(path))
    return urls, labels
