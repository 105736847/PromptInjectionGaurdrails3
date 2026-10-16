/**
 * flowSteps.js – the eight stops of ONE request, drawn by RequestFlow.jsx.
 *
 * Each step says who talks to whom (`from` → `to`, see ACTORS) and how the
 * arrow is drawn: 'call' →, 'return' ⇠ (dashed), 'roundtrip' → and back, 'self' ↻.
 */
export const ACTORS = [
  { id: 'react', label: 'React' },
  { id: 'fastapi', label: 'FastAPI' },
  { id: 'pydantic', label: 'Pydantic' },
  { id: 'sqlmodel', label: 'SQLModel' },
  { id: 'sqlite', label: 'SQLite' },
];

export const STEPS = [
  {
    title: 'React sends the request',
    from: 'react', to: 'fastapi', kind: 'call', tag: 'fetch',
    file: 'src/…/useStudents.js',
    text: 'The hook calls fetch() through client.js. In development the Vite server forwards every /api/… request to FastAPI on port 8000 (a proxy), so the browser never meets a CORS problem.',
    code: "const data = await api.get('/api/students?q=li&sort=score&order=desc&page_size=3', { signal });",
  },
  {
    title: 'The router picks the endpoint',
    from: 'fastapi', to: 'fastapi', kind: 'self', tag: 'route',
    file: 'backend/app/routers/students.py',
    text: 'FastAPI compares the method and path with every route: prefix "/api/students" + @router.get("") → list_students(). It also prepares the dependencies – SessionDep opens a database session just for this request.',
    code: 'router = APIRouter(prefix="/api/students", tags=["students"])\n\n@router.get("", response_model=StudentPage)\ndef list_students(session: SessionDep, params: Annotated[StudentQuery, Query()]):',
  },
  {
    title: 'Pydantic validates the input',
    from: 'fastapi', to: 'pydantic', kind: 'roundtrip', tag: 'validate',
    file: 'backend/app/models/student.py',
    text: 'A query string is only text. Pydantic converts it into typed values ("3" → 3) and checks every rule in StudentQuery. If anything is wrong, FastAPI answers 422 straight away – your function never runs.',
    code: 'class StudentQuery(SQLModel):\n    q: str | None = Field(default=None, max_length=100)\n    sort: SortField = "last_name"   # a Literal = the whitelist\n    order: Literal["asc", "desc"] = "asc"\n    page: int = Field(default=1, ge=1, le=100_000)\n    page_size: int = Field(default=10, ge=1, le=100)',
  },
  {
    title: 'SQLModel builds the query',
    from: 'fastapi', to: 'sqlmodel', kind: 'call', tag: 'select()',
    file: 'backend/app/routers/students.py',
    text: 'We describe the query with Python objects, not SQL strings. SQLModel (built on SQLAlchemy) writes the SQL for whichever database is configured – SQLite here, PostgreSQL in production, same code.',
    code: 'column = SORTABLE_COLUMNS[params.sort]  # "score" → Student.score\nstatement = (\n    select(Student)\n    .where(*filters)\n    .order_by(column.desc(), *tie_breakers)  # order="desc"\n    .offset((params.page - 1) * params.page_size)\n    .limit(params.page_size)\n)\nstudents = session.exec(statement).all()',
  },
  {
    title: 'SQLite runs the SQL',
    from: 'sqlmodel', to: 'sqlite', kind: 'roundtrip', tag: 'SQL',
    file: 'backend/app.db',
    text: 'The SQL text and the values travel separately (bound parameters), so user input can never change the query itself. SQLite returns rows and SQLModel turns each row into a Student object.',
    code: "SELECT * FROM student\nWHERE first_name || ' ' || last_name LIKE :q\n   OR email LIKE :q OR student_id LIKE :q  -- :q = '%li%'\nORDER BY score DESC, last_name, first_name, id\nLIMIT 3 OFFSET 0;",
  },
  {
    title: 'response_model shapes the output',
    from: 'fastapi', to: 'pydantic', kind: 'roundtrip', tag: 'serialise',
    file: 'backend/app/models/student.py',
    text: 'The return value is checked and filtered against response_model=StudentPage: only declared fields leave the server (a password hash never would), the computed grade is added and dates become strings.',
    code: 'class StudentRead(StudentFields):  # plain types – stored data is trusted\n    id: int\n\n    @computed_field\n    @property\n    def grade(self) -> str:\n        return grade_for(self.score)',
  },
  {
    title: 'JSON travels back',
    from: 'fastapi', to: 'react', kind: 'return', tag: 'JSON',
    file: 'HTTP response',
    text: 'FastAPI sends the JSON with a status code that means something: 200 OK here, 201 after a create, 204 after a delete, 4xx when the client got something wrong. The database session is closed automatically.',
    code: 'HTTP/1.1 200 OK\ncontent-type: application/json\n\n{"items": [ … ], "total": 11, "page": 1, "page_size": 3, "pages": 4}',
  },
  {
    title: 'React stores it in state',
    from: 'react', to: 'react', kind: 'self', tag: 'setState',
    file: 'src/…/useStudents.js',
    text: 'The hook stores the data with setState – unless the answer is stale because the user already asked for something else. React re-renders and the table shows the rows: State → View, the one-way data flow.',
    code: 'if (!isCurrent && ignoreStale) return; // an old answer – ignore it\nsetState({ data, dataUrl: url, error: null, loading: false });',
  },
];

/** Steps that never happen when validation fails (422) or the server is unreachable. */
export function skippedSteps(outcome) {
  if (outcome === 'invalid') return new Set([3, 4, 5]); // no query, no SQL, no response_model
  if (outcome === 'offline') return new Set([1, 2, 3, 4, 5, 6]);
  return new Set();
}
