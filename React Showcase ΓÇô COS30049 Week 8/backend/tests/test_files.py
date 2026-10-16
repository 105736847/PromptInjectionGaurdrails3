"""Tests for app/routers/files.py – uploads, downloads, deletes and the CSV summary."""
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64  # the 8 "magic" bytes every PNG starts with
CSV = b"name,score,hours,campus\nAna,71,5.5,Hawthorn\nBen,88,7,Online\nCai,,3.5,Hawthorn\nDee,64,4,Sarawak\n"


def upload(client, *files):
    """files: (filename, bytes, content_type) tuples → the response of POST /api/files."""
    return client.post("/api/files", files=[("files", f) for f in files])


def test_upload_list_download_delete_round_trip(client, tmp_path):
    response = upload(client, ("notes.txt", b"hello world", "text/plain"), ("logo.png", PNG, "image/png"))
    assert response.status_code == 201, response.text
    saved = response.json()
    assert [f["name"] for f in saved] == ["notes.txt", "logo.png"]
    assert saved[0]["size"] == 11 and saved[0]["content_type"] == "text/plain"
    assert saved[0]["uploaded_at"].endswith("Z") or "+00:00" in saved[0]["uploaded_at"]

    # Stored on disk under a random name – never under the user's name.
    stored = list((tmp_path / "uploads").iterdir())
    assert len(stored) == 2 and all(p.name not in {"notes.txt", "logo.png"} for p in stored)

    listing = client.get("/api/files").json()
    assert [f["name"] for f in listing] == ["logo.png", "notes.txt"]  # newest first

    download = client.get(saved[0]["url"])
    assert download.status_code == 200
    assert download.content == b"hello world"
    assert 'attachment; filename="notes.txt"' in download.headers["content-disposition"]
    assert download.headers["x-content-type-options"] == "nosniff"
    inline = client.get(f"{saved[1]['url']}?inline=true")
    assert inline.headers["content-disposition"].startswith("inline")
    assert inline.headers["content-type"] == "image/png"

    assert client.delete(saved[0]["url"]).status_code == 204
    assert client.get(saved[0]["url"]).status_code == 404
    assert len(list((tmp_path / "uploads").iterdir())) == 1


def test_path_traversal_names_are_harmless(client, tmp_path):
    response = upload(client, ("../../evil.txt", b"x", "text/plain"))
    assert response.status_code == 201
    assert response.json()[0]["name"] == "evil.txt"
    assert not (tmp_path / "evil.txt").exists()


def test_wrong_extension_is_415(client):
    response = upload(client, ("virus.exe", b"MZ...", "application/octet-stream"))
    assert response.status_code == 415
    assert "virus.exe" in response.json()["detail"]


def test_fake_png_is_415(client):
    # The name and content type say PNG, but the bytes don't – never trust the client.
    response = upload(client, ("photo.png", b"<html>not an image</html>", "image/png"))
    assert response.status_code == 415
    assert "does not look like" in response.json()["detail"]


def test_too_large_is_413_and_nothing_is_kept(client, tmp_path):
    big = b"a" * (5 * 1024 * 1024 + 1)
    response = upload(client, ("ok.txt", b"fine", "text/plain"), ("big.txt", big, "text/plain"))
    assert response.status_code == 413
    assert "5 MB" in response.json()["detail"]
    assert list((tmp_path / "uploads").iterdir()) == []  # all-or-nothing
    assert client.get("/api/files").json() == []


def test_empty_file_is_422(client):
    assert upload(client, ("empty.csv", b"", "text/csv")).status_code == 422


def test_missing_files_field_is_422(client):
    assert client.post("/api/files").status_code == 422


def test_unknown_file_is_404(client):
    assert client.get("/api/files/999").status_code == 404
    assert client.delete("/api/files/999").status_code == 404


def test_csv_summary(client):
    response = client.post("/api/files/csv-summary?bins=4", files={"file": ("marks.csv", CSV, "text/csv")})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["rows"] == 4
    assert [c["name"] for c in body["columns"]] == ["name", "score", "hours", "campus"]

    score = body["columns"][1]
    assert score["kind"] == "numeric"
    assert (score["count"], score["missing"]) == (3, 1)
    assert (score["min"], score["max"], score["median"]) == (64, 88, 71)
    assert len(score["histogram"]) == 4
    assert sum(b["count"] for b in score["histogram"]) == 3
    assert score["histogram"][0]["x0"] == 64 and score["histogram"][-1]["x1"] == 88

    campus = body["columns"][3]
    assert campus["kind"] == "text"
    assert campus["top"][0] == {"value": "Hawthorn", "count": 2}
    assert body["preview"][0] == {"name": "Ana", "score": "71", "hours": "5.5", "campus": "Hawthorn"}


def test_csv_summary_rejects_bad_input(client):
    def post(name, content):
        return client.post("/api/files/csv-summary", files={"file": (name, content, "text/csv")})

    assert post("marks.txt", CSV).status_code == 415
    assert post("empty.csv", b"").status_code == 422
    assert post("header-only.csv", b"a,b,c\n").status_code == 422
    assert post("latin1.csv", "name\nJosé\n".encode("latin-1")).status_code == 422
    assert post("huge.csv", b"a\n" + b"1\n" * (3 * 1024 * 1024)).status_code == 413
    assert client.post("/api/files/csv-summary?bins=1", files={"file": ("m.csv", CSV)}).status_code == 422


def test_more_than_ten_files_is_413(client):
    response = upload(client, *[(f"n{i}.txt", b"hi", "text/plain") for i in range(11)])
    assert response.status_code == 413
    assert "at most 10" in response.json()["detail"]


def test_fake_jpg_and_pdf_are_415(client):
    for name in ("photo.jpg", "handout.pdf"):
        assert upload(client, (name, b"just some text", "application/octet-stream")).status_code == 415
    real_pdf = upload(client, ("handout.pdf", b"%PDF-1.7\n...", "application/pdf"))
    assert real_pdf.status_code == 201


def test_long_names_keep_their_extension(client):
    long_name = "COS30049_" + "x" * 140 + ".csv"  # 153 characters
    response = upload(client, (long_name, CSV, "text/csv"))
    assert response.status_code == 201, response.text
    saved = response.json()[0]["name"]
    assert len(saved) == 120 and saved.endswith(".csv")
    summary = client.post("/api/files/csv-summary", files={"file": (long_name, CSV, "text/csv")})
    assert summary.status_code == 200


def test_huge_content_length_is_refused_before_reading(client, monkeypatch):
    from app.routers import files

    monkeypatch.setattr(files, "MAX_REQUEST_BYTES", 1000)
    response = upload(client, ("notes.txt", b"a" * 2000, "text/plain"))
    assert response.status_code == 413
    assert "before reading" in response.json()["detail"]


def test_stored_files_are_capped_and_the_list_is_limited(client, monkeypatch):
    from app.routers import files

    monkeypatch.setattr(files, "MAX_STORED_FILES", 3)
    assert upload(client, ("a.txt", b"a", "text/plain"), ("b.txt", b"b", "text/plain")).status_code == 201
    assert upload(client, ("c.txt", b"c", "text/plain"), ("d.txt", b"d", "text/plain")).status_code == 507
    assert upload(client, ("c.txt", b"c", "text/plain")).status_code == 201
    assert [f["name"] for f in client.get("/api/files?limit=2").json()] == ["c.txt", "b.txt"]
    assert client.get("/api/files?limit=0").status_code == 422


def test_csv_opens_as_plain_text_in_the_browser(client):
    saved = upload(client, ("marks.csv", CSV, "text/csv")).json()[0]
    assert client.get(saved["url"]).headers["content-type"].startswith("text/csv")
    # Browsers download text/csv even with "inline", so ?inline=true sends it as text/plain.
    assert client.get(f"{saved['url']}?inline=true").headers["content-type"].startswith("text/plain")


def post_csv(client, content, name="data.csv", bins=10):
    return client.post(f"/api/files/csv-summary?bins={bins}", files={"file": (name, content, "text/csv")})


def test_csv_summary_reads_mac_line_endings(client):
    # Excel for Mac ("CSV (Macintosh)") ends lines with \r only.
    body = post_csv(client, b"name,score\rAna,71\rBen,88\r").json()
    assert body["rows"] == 2 and body["columns"][1]["max"] == 88


def test_csv_summary_answers_422_not_500_for_odd_files(client):
    huge_cell = post_csv(client, b'a\n"' + b"x" * 140_000 + b'"\n')
    assert huge_cell.status_code == 422 and "Could not read the CSV" in huge_cell.json()["detail"]
    wide = ",".join(f"c{i}" for i in range(51))
    too_wide = post_csv(client, f"{wide}\n{wide}\n".encode())
    assert too_wide.status_code == 422 and "at most 50 columns" in too_wide.json()["detail"]
    assert post_csv(client, CSV, bins=31).status_code == 422


def test_csv_summary_survives_absurd_numbers(client):
    for content in (b"x\n1e308\n1e308\n", b"x\n-1e308\n1e308\n"):
        response = post_csv(client, content)
        assert response.status_code == 200
        assert response.json()["columns"][0]["kind"] == "text"  # too big to add up → not treated as numbers


def test_csv_summary_analyses_at_most_max_rows(client, monkeypatch):
    from app.routers import files

    monkeypatch.setattr(files, "MAX_ROWS", 10)
    body = post_csv(client, b"x\n" + b"1\n" * 25).json()
    assert (body["rows"], body["truncated"]) == (10, True)
    assert post_csv(client, CSV).json()["truncated"] is False
