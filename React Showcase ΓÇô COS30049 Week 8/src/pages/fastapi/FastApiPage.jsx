import PageHeader from '../../components/common/PageHeader.jsx';
import BackendStatus from '../../components/common/BackendStatus.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';
import CodeBlock from '../../components/common/CodeBlock.jsx';

// The Python and config files are imported as TEXT (Vite's ?raw) for the Code tabs.
import basicsPy from '../../../backend/app/routers/basics.py?raw';
import mainPy from '../../../backend/app/main.py?raw';
import viteConfigCode from '../../../vite.config.js?raw';
import clientCode from '../../api/client.js?raw';
import { pyRegion } from './pySource.js';

import RequestJourney from './demos/RequestJourney.jsx';
import requestJourneyCode from './demos/RequestJourney.jsx?raw';
import HelloEndpoint from './demos/HelloEndpoint.jsx';
import helloEndpointCode from './demos/HelloEndpoint.jsx?raw';
import useRequestCode from './demos/useRequest.js?raw';
import responseViewCode from './demos/ResponseView.jsx?raw';
import UnitLookup from './demos/UnitLookup.jsx';
import unitLookupCode from './demos/UnitLookup.jsx?raw';
import FeedbackForm from './demos/FeedbackForm.jsx';
import feedbackFormCode from './demos/FeedbackForm.jsx?raw';
import StatusCodes from './demos/StatusCodes.jsx';
import statusCodesCode from './demos/StatusCodes.jsx?raw';
import ResponseModelDemo from './demos/ResponseModelDemo.jsx';
import responseModelCode from './demos/ResponseModelDemo.jsx?raw';
import PaginationDemo from './demos/PaginationDemo.jsx';
import paginationCode from './demos/PaginationDemo.jsx?raw';
import ApiKeyDemo from './demos/ApiKeyDemo.jsx';
import apiKeyCode from './demos/ApiKeyDemo.jsx?raw';
import TimeoutCancel from './demos/TimeoutCancel.jsx';
import timeoutCancelCode from './demos/TimeoutCancel.jsx?raw';
import RetryBackoff from './demos/RetryBackoff.jsx';
import retryBackoffCode from './demos/RetryBackoff.jsx?raw';
import ParallelRequests from './demos/ParallelRequests.jsx';
import parallelRequestsCode from './demos/ParallelRequests.jsx?raw';
import ApiPlayground from './demos/ApiPlayground.jsx';
import apiPlaygroundCode from './demos/ApiPlayground.jsx?raw';
import openapiCode from './demos/openapi.js?raw';
import SwaggerEmbed from './demos/SwaggerEmbed.jsx';
import swaggerEmbedCode from './demos/SwaggerEmbed.jsx?raw';
import './fastapi.css';

const BASICS = 'backend/app/routers/basics.py';
const py = (...regions) => ({ name: BASICS, code: pyRegion(basicsPy, regions) });

const BACKEND_TERMINAL = `# Terminal 1 – the Python back end (from the project folder)
cd backend
python -m venv .venv                # first time only
source .venv/bin/activate           # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt     # first time only
uvicorn app.main:app --reload --port 8000
# → API on http://localhost:8000, docs on /api/docs
# (shortcut from the project folder: npm run backend)`;

const FRONTEND_TERMINAL = `# Terminal 2 – the React front end (from the project folder)
npm install                         # first time only
npm start
# → http://localhost:3000 – requests to /api/* are
#   forwarded to port 8000 by the Vite proxy`;

const PRODUCTION_ENV = `# .env.production – read by Vite when you run "npm run build"
VITE_API_URL=https://api.your-team-project.example

# …and on the server, allow the site's origin (see config.py):
# CORS_ORIGINS=https://your-team-project.example`;

export default function FastApiPage() {
  return (
    <>
      <PageHeader
        eyebrow="Full-Stack (FastAPI)"
        title="FastAPI Basics"
        intro="How a React front end talks to a Python back end. Every example on this page sends a real HTTP request to the FastAPI server in backend/ – and every Code tab shows the React component next to the Python function that answers it."
        concepts={['FastAPI', 'uvicorn', 'Vite proxy', 'path & query parameters', 'Pydantic', 'status codes', 'response_model', 'Depends()', 'async def', 'AbortController', 'OpenAPI']}
        docs={[
          { label: 'FastAPI tutorial', href: 'https://fastapi.tiangolo.com/tutorial/' },
          { label: 'Pydantic docs', href: 'https://docs.pydantic.dev/latest/' },
          { label: 'MDN: HTTP status codes', href: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status' },
        ]}
      />
      <BackendStatus />

      {/* 1 ------------------------------------------------------------------ */}
      <SectionTitle
        title="How the pieces fit"
        intro="Your app is two programs: React runs in the browser, FastAPI runs in Python. They only ever talk through HTTP requests. Press the button and follow one request all the way through."
      />
      <DemoCard
        title="The journey of one request"
        description="The request is real; the animation is slowed down so you can follow it. Switch to /api/health to see a request that also asks the database."
        concepts={['HTTP', 'Vite proxy', 'APIRouter', 'include_router', 'performance.now()']}
        files={[
          { name: 'RequestJourney.jsx', code: requestJourneyCode },
          { name: 'backend/app/main.py', code: mainPy },
          { name: 'vite.config.js', code: viteConfigCode },
          { name: 'src/api/client.js', code: clientCode },
        ]}
      >
        <RequestJourney />
      </DemoCard>

      <Callout type="note" title="Two servers, two terminals – and why there is no CORS error">
        <ul>
          <li>
            <strong>Two programs:</strong> Vite (port 3000) serves your React code, uvicorn (port 8000) runs your Python
            code. Start both, each in its own terminal, and keep both running.
          </li>
          <li>
            <strong>Proxy (development):</strong> the browser only ever talks to <code>localhost:3000</code>. Vite
            forwards every <code>/api/…</code> request to port 8000 (<code>vite.config.js</code>). One origin → the
            browser has nothing to block.
          </li>
          <li>
            <strong>CORS:</strong> if the page called <code>http://localhost:8000</code> directly, that is a different
            origin (the port differs), so the browser only accepts the answer if FastAPI says it may – that is what{' '}
            <code>CORSMiddleware</code> in <code>main.py</code> does.
          </li>
          <li>
            <strong>Production:</strong> <code>npm run build</code> makes static files and there is no Vite proxy any
            more. Set <code>VITE_API_URL</code> to your API’s address; <code>client.js</code> puts it in front of every
            path (<code>API_BASE</code>).
          </li>
        </ul>
      </Callout>
      <div className="fastapi-terminals">
        <div className="demo-card">
          <CodeBlock code={BACKEND_TERMINAL} filename="Terminal 1 – back end" language="shell" />
        </div>
        <div className="demo-card">
          <CodeBlock code={FRONTEND_TERMINAL} filename="Terminal 2 – front end" language="shell" />
        </div>
      </div>
      <div className="demo-card">
        <CodeBlock code={PRODUCTION_ENV} filename=".env.production" language="shell" />
      </div>

      {/* 2 ------------------------------------------------------------------ */}
      <SectionTitle
        title="Your first endpoint"
        intro="A FastAPI endpoint is a normal Python function with a decorator that says which method and path it answers. Its parameters become the request’s inputs; its return value becomes JSON."
      />
      <DemoCard
        title="GET /api/basics/hello"
        description="Type a name and send it. You see the exact URL, the status code, the time it took and the JSON that came back. The Python tab shows the whole endpoint – it really is this short."
        concepts={['@router.get', 'query parameter', 'return type', 'JSON', 'encodeURIComponent']}
        files={[
          { name: 'HelloEndpoint.jsx', code: helloEndpointCode },
          py('router', 'hello'),
          { name: 'useRequest.js', code: useRequestCode },
          { name: 'ResponseView.jsx', code: responseViewCode },
        ]}
      >
        <HelloEndpoint />
      </DemoCard>

      {/* 3 ------------------------------------------------------------------ */}
      <SectionTitle
        title="Path & query parameters"
        intro="Path parameters identify WHICH thing (/units/AIM30003); query parameters describe HOW you want it (?semester=2). Declare a type and FastAPI converts and checks the text for you."
      />
      <DemoCard
        title="Typed parameters and 422 errors"
        description="Edit the fields and watch the URL being built, then Send. Each “Try” button fills in an example and sends it straight away – the wrong values get a 422 that explains exactly which parameter broke which rule."
        concepts={['Path()', 'Query()', 'int / bool / Enum', 'ge / le / pattern', 'Optional', '422', 'URLSearchParams']}
        files={[{ name: 'UnitLookup.jsx', code: unitLookupCode }, py('units')]}
      >
        <UnitLookup />
      </DemoCard>
      <Callout type="tip" title="422 or 404?">
        <p>
          <code>aim30003</code> gives <strong>422</strong>: it doesn’t match the pattern, so FastAPI rejects it before
          your function runs. <code>ZZZ99999</code> gives <strong>404</strong>: the format is fine, your function ran,
          looked it up and found nothing. Let FastAPI handle the format; you handle the meaning.
        </p>
      </Callout>

      {/* 4 ------------------------------------------------------------------ */}
      <SectionTitle
        title="Request bodies & Pydantic validation"
        intro="POST and PUT requests carry a JSON body. Describe its shape once as a Pydantic model and FastAPI parses, validates and documents it – your function only ever sees valid data."
      />
      <DemoCard
        title="POST /api/basics/feedback"
        description="Send valid feedback, then press “Fill with invalid data”. The browser stops you first; switch on “Skip browser validation” and the server’s 422 errors land next to the right fields. Posting anonymously leaves name and email out – a model_validator decides when they are required."
        concepts={['BaseModel', 'Field()', 'EmailStr', 'field_validator', 'model_validator', 'extra="forbid"', 'fieldErrors', '201 Created']}
        files={[
          { name: 'FeedbackForm.jsx', code: feedbackFormCode },
          py('feedback'),
          { name: 'src/api/client.js', code: clientCode },
        ]}
      >
        <FeedbackForm />
      </DemoCard>
      <Callout type="warning" title="Browser checks are for comfort, server checks are for safety">
        <p>
          Anyone can skip your React form and send a request with curl, Postman or the playground below. Keep the HTML
          checks (<code>required</code>, <code>type=&quot;email&quot;</code>…) for quick feedback, but always validate
          again on the server – with Pydantic that costs one line per rule.
        </p>
      </Callout>

      {/* 5 ------------------------------------------------------------------ */}
      <SectionTitle
        title="Status codes & errors"
        intro="The status code is the server’s one-number summary: 2xx worked, 4xx the client must change something, 5xx the server has a problem. Your UI should react differently to each."
      />
      <DemoCard
        title="Every status code, live"
        description="Press a code: the endpoint answers with exactly that status. The right panel shows what client.js gave your component – a resolved promise for 2xx, a thrown ApiError otherwise. Also try “crash” and look at the uvicorn terminal."
        concepts={['HTTPException', 'status_code', 'Response(204)', 'exception handler', 'ApiError', 'response.ok']}
        files={[
          { name: 'StatusCodes.jsx', code: statusCodesCode },
          py('status'),
          { name: 'backend/app/main.py', code: mainPy },
          { name: 'src/api/client.js', code: clientCode },
        ]}
      >
        <StatusCodes />
      </DemoCard>

      {/* 6 ------------------------------------------------------------------ */}
      <SectionTitle
        title="response_model: send only what you should"
        intro="Your database rows often hold things the browser must never see. A response model is a whitelist: FastAPI sends the declared fields and silently drops everything else."
      />
      <DemoCard
        title="Hiding secret fields"
        description="Both endpoints return the same internal user record. The unsafe twin uses that stored UserRecord as its return type – so the password hash and API secret leak out; the safe one sends four fields."
        concepts={['response_model', 'model inheritance', 'data filtering', 'Promise.all']}
        files={[{ name: 'ResponseModelDemo.jsx', code: responseModelCode }, py('profiles')]}
      >
        <ResponseModelDemo />
      </DemoCard>
      <Callout type="note" title="Why always declare a response model?">
        <ul>
          <li><strong>Security</strong> – new columns (hashes, tokens, notes) can’t leak by accident.</li>
          <li><strong>A contract</strong> – /api/docs shows the exact shape, so the front-end team knows what to expect.</li>
          <li><strong>Checked output</strong> – if your function returns the wrong shape, FastAPI fails loudly on the server instead of sending bad data.</li>
          <li><strong>Conversion</strong> – datetimes, enums and nested models become clean JSON automatically.</li>
        </ul>
      </Callout>

      {/* 7 ------------------------------------------------------------------ */}
      <SectionTitle
        title="Dependencies with Depends()"
        intro="A dependency is a function FastAPI runs before your endpoint and whose result it hands in. Write shared logic – pagination, database sessions, API keys, the logged-in user – once, and reuse it everywhere."
      />
      <DemoCard
        title="One pagination dependency, two endpoints"
        description="Search, change the page size or page through. Both lists are served by different endpoints that share the same pagination() dependency – so they accept exactly the same q, skip and limit."
        concepts={['Depends()', 'Annotated', 'reusable query parameters', 'Generic Page[T]', 'useEffect + AbortController']}
        files={[{ name: 'PaginationDemo.jsx', code: paginationCode }, py('dependencies')]}
      >
        <PaginationDemo />
      </DemoCard>
      <DemoCard
        title="A header dependency: X-API-Key"
        description="Send the request with and without the header, or with a wrong key. The dependency answers 401 before the endpoint function ever runs."
        concepts={['Header()', 'dependencies=[...]', '401 Unauthorized', 'custom headers']}
        files={[{ name: 'ApiKeyDemo.jsx', code: apiKeyCode }, py('dependencies')]}
      >
        <ApiKeyDemo />
      </DemoCard>

      {/* 8 ------------------------------------------------------------------ */}
      <SectionTitle
        title="Slow responses, timeouts & cancelling"
        intro="A machine-learning prediction or a big query can take seconds. The UI must stay responsive: show progress, give up after a while, let the user cancel, retry hiccups – and never wait for things one by one when it doesn’t have to."
      />
      <DemoCard
        title="Timeout and Cancel"
        description="Set how long the server takes and how long the client is willing to wait, then Send. Press Cancel while it runs. The server counters show that FastAPI stops working when the browser hangs up."
        concepts={['async def', 'asyncio.sleep', 'timeout', 'AbortController', 'request.is_disconnected()']}
        files={[{ name: 'TimeoutCancel.jsx', code: timeoutCancelCode }, py('slow')]}
      >
        <TimeoutCancel />
      </DemoCard>
      <DemoCard
        title="Retry with exponential backoff"
        description="The /flaky endpoint fails the first N calls with 503. The client retries with growing pauses and gives up after the maximum number of attempts."
        concepts={['503 Service Unavailable', 'retry', 'exponential backoff', 'which errors to retry']}
        files={[{ name: 'RetryBackoff.jsx', code: retryBackoffCode }, py('slow')]}
      >
        <RetryBackoff />
      </DemoCard>
      <DemoCard
        title="One after another vs Promise.all"
        description="Three independent slow requests, first awaited one by one, then all at once. The bars show when each request started and finished."
        concepts={['await in a loop', 'Promise.all', 'concurrency', 'async server']}
        files={[{ name: 'ParallelRequests.jsx', code: parallelRequestsCode }, py('slow')]}
      >
        <ParallelRequests />
      </DemoCard>
      <Callout type="tip" title="def or async def?">
        <p>
          Use <code>async def</code> only when the function <code>await</code>s something (asyncio.sleep, an async
          HTTP client, a WebSocket). For normal blocking work – SQLModel queries, scikit-learn’s{' '}
          <code>model.predict()</code> – write a plain <code>def</code>: FastAPI runs it in a thread pool so other
          requests aren’t blocked. A blocking call inside <code>async def</code> (like <code>time.sleep</code>) freezes
          the whole server.
        </p>
      </Callout>

      {/* 9 ------------------------------------------------------------------ */}
      <SectionTitle
        title="API playground"
        intro="FastAPI describes every endpoint in a machine-readable file, /api/openapi.json. This mini Postman reads it and lets you call any endpoint of the whole back end – including the other Full-Stack pages."
      />
      <DemoCard
        title="Call any endpoint"
        description="Pick an endpoint (grouped by tag), fill in its parameters, headers and body, and Send. Log in with POST /api/auth/login, then press “Use this token” to call protected endpoints."
        concepts={['OpenAPI', '$ref', 'fetch()', 'response headers', 'Authorization: Bearer']}
        files={[
          { name: 'ApiPlayground.jsx', code: apiPlaygroundCode },
          { name: 'openapi.js', code: openapiCode },
          { name: BASICS, code: basicsPy },
        ]}
      >
        <ApiPlayground />
      </DemoCard>

      {/* 10 ----------------------------------------------------------------- */}
      <SectionTitle
        title="Interactive docs"
        intro="You never write API documentation by hand: FastAPI builds Swagger UI (/api/docs) and ReDoc (/api/redoc) from your code. Summaries, docstrings, Field descriptions and examples all appear there."
      />
      <DemoCard
        title="Swagger UI and ReDoc"
        description="The real /api/docs page in a frame. Open an endpoint, press “Try it out” and “Execute” – or open it in its own tab. Share this link with your front-end teammates."
        concepts={['/api/docs', '/api/redoc', '<iframe>', 'sandbox', 'loading="lazy"']}
        files={[
          { name: 'SwaggerEmbed.jsx', code: swaggerEmbedCode },
          { name: 'backend/app/main.py', code: mainPy },
        ]}
      >
        <SwaggerEmbed />
      </DemoCard>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>basics.py</code>, add <code>GET /api/basics/goodbye?name=…</code> that returns{' '}
            <code>{'{"message": "Goodbye, Mia!"}'}</code>. Find it in the playground and in /api/docs without touching
            any React code – then add a “Say goodbye” button to <code>HelloEndpoint.jsx</code>.
          </li>
          <li>
            Change <code>hello()</code> to <code>name: Annotated[str, Query(max_length=20)] = &quot;World&quot;</code>.
            Send a 30-character name from <code>HelloEndpoint.jsx</code> and explain the 422’s <code>loc</code>,{' '}
            <code>msg</code> and <code>type</code>.
          </li>
          <li>
            Add a <code>field_validator</code> to <code>FeedbackIn</code> that only accepts emails ending in{' '}
            <code>.edu</code>. Without editing <code>FeedbackForm.jsx</code>, check that the message appears under the
            Email field – why does that work?
          </li>
          <li>
            Give the <code>pagination</code> dependency an optional <code>sort: Literal[&quot;asc&quot;, &quot;desc&quot;]</code>{' '}
            parameter and add a matching select to <code>PaginationDemo.jsx</code>. Why do both endpoints support it
            immediately?
          </li>
          <li>
            In <code>RetryBackoff.jsx</code>, add random “jitter” (±30 %) to every delay. Why does jitter matter when
            hundreds of browsers retry against the same server at the same moment?
          </li>
        </ol>
      </Callout>
    </>
  );
}
