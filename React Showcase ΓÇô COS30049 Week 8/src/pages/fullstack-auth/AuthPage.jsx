import { CircleCheck } from 'lucide-react';

import PageHeader from '../../components/common/PageHeader.jsx';
import BackendStatus from '../../components/common/BackendStatus.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';
import CodeBlock from '../../components/common/CodeBlock.jsx';

import { AuthProvider } from './AuthContext.jsx';
import authContextCode from './AuthContext.jsx?raw';
import jwtCode from './jwt.js?raw';
import sessionBarCode from './SessionBar.jsx?raw';
import useNowCode from './useNow.js?raw';
import authUtilsCode from './authUtils.js?raw';
import LoginForm from './demos/LoginForm.jsx';
import loginFormCode from './demos/LoginForm.jsx?raw';
import RegisterForm from './demos/RegisterForm.jsx';
import registerFormCode from './demos/RegisterForm.jsx?raw';
import JwtInspector from './demos/JwtInspector.jsx';
import jwtInspectorCode from './demos/JwtInspector.jsx?raw';
import TokenStorage from './demos/TokenStorage.jsx';
import tokenStorageCode from './demos/TokenStorage.jsx?raw';
import ProtectedProfile from './demos/ProtectedProfile.jsx';
import protectedProfileCode from './demos/ProtectedProfile.jsx?raw';
import RoleGate from './demos/RoleGate.jsx';
import roleGateCode from './demos/RoleGate.jsx?raw';
import TokenExpiry from './demos/TokenExpiry.jsx';
import tokenExpiryCode from './demos/TokenExpiry.jsx?raw';

// The Python that answers these requests – shown next to the React code.
import authPy from '../../../backend/app/routers/auth.py?raw';
import securityPy from '../../../backend/app/security.py?raw';
import userPy from '../../../backend/app/models/user.py?raw';
import testAuthPy from '../../../backend/tests/test_auth.py?raw';
import './auth.css';

const AUTH_CONTEXT = { name: 'AuthContext.jsx', code: authContextCode };
const AUTH_PY = { name: 'backend/app/routers/auth.py', code: authPy };
const SECURITY_PY = { name: 'backend/app/security.py', code: securityPy };
// Small helpers several demos share – shown in the cards that lean on them most.
const SESSION_BAR = { name: 'SessionBar.jsx', code: sessionBarCode };
const USE_NOW = { name: 'useNow.js', code: useNowCode };
const AUTH_UTILS = { name: 'authUtils.js', code: authUtilsCode };

// The login "conversation" between the React app and FastAPI, step by step.
const FLOW = [
  { lane: 'browser', who: 'React → FastAPI', title: 'POST /api/auth/login', text: 'username + password as form data' },
  {
    lane: 'server',
    who: 'FastAPI',
    title: 'verify_password()',
    text: 'compares with the salted hash in the database – wrong → 401, too many failures → 429',
  },
  {
    lane: 'server',
    who: 'FastAPI → React',
    title: 'create_access_token()',
    text: 'signs {sub, role, exp} with SECRET_KEY → 200 {access_token, token_type, expires_in}',
  },
  { lane: 'browser', who: 'React', title: 'AuthProvider keeps the token', text: 'in React state – any component reads it with useAuth()' },
  { lane: 'browser', who: 'React → FastAPI', title: 'GET /api/auth/me', text: 'authFetch() adds Authorization: Bearer <token>' },
  {
    lane: 'server',
    who: 'FastAPI',
    title: 'get_current_user / require_role',
    text: 'bad signature or expired → 401; valid token but wrong role → 403',
  },
  { lane: 'browser', who: 'React', title: 'Show the data – or log out', text: '200 → render it; 401 → authFetch() forgets the token' },
];

const CHECKLIST = [
  <>Hash passwords with a slow, salted algorithm (bcrypt, argon2, PBKDF2) – never store or log plain text.</>,
  <>Keep <code>SECRET_KEY</code> and database passwords in environment variables – never commit them to Git.</>,
  <>Serve everything over HTTPS in production – tokens and passwords travel in every request.</>,
  <>Keep access tokens short-lived (minutes, not days) and never put secrets inside a JWT – anyone can read it.</>,
  <>Never trust the client: validate every input with Pydantic and check roles on the server, not just in React.</>,
  <>Allow only your real front-end origins in CORS (<code>CORS_ORIGINS</code>) – no <code>&quot;*&quot;</code>.</>,
  <>
    Rate-limit logins, and answer “unknown user” and “wrong password” with the same message. Sign-up and
    “forgot password” forms reveal whether an account exists too – rate-limit them as well, or always answer
    the same way (“if this address is new, we’ve sent you a link”).
  </>,
  <>Return users through a response model (like <code>UserPublic</code>) so hashes can never leak.</>,
];

export default function AuthPage() {
  return (
    // One AuthProvider around the whole page: every demo below shares the same login.
    <AuthProvider>
      <PageHeader
        eyebrow="Full-Stack (FastAPI)"
        title="Login & JWT"
        intro="Authentication and authorisation end to end: a FastAPI back end that hashes passwords and signs JSON Web Tokens, and a React front end that logs in, keeps the token, sends it with every request and reacts to 401 and 403. Log in once – every demo on this page shares the same session."
        concepts={['OAuth2 password flow', 'JWT', 'Depends()', 'useContext', 'Authorization header', '401 vs 403', 'rate limiting']}
        docs={[
          { label: 'FastAPI Security', href: 'https://fastapi.tiangolo.com/tutorial/security/' },
          { label: 'OAuth2 with JWT', href: 'https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/' },
          { label: 'Introduction to JWT', href: 'https://jwt.io/introduction' },
          { label: 'useContext', href: 'https://react.dev/reference/react/useContext' },
          {
            label: 'MDN: Authorization header',
            href: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Authorization',
          },
        ]}
      />
      <BackendStatus />

      <SectionTitle
        title="How token login works"
        intro="HTTP is stateless: the server does not remember you between requests. So after checking your password once, it gives you a signed token, and you show that token with every request – like a wristband at a festival."
      />
      <div className="auth-flow">
        <div className="auth-flow-lanes" aria-hidden="true">
          <span>React (browser)</span>
          <span>FastAPI (server)</span>
        </div>
        <ol aria-label="Token login, step by step">
          {FLOW.map((step, index) => (
            <li key={step.title} className={`auth-flow-step auth-flow-${step.lane}`}>
              <span className="auth-flow-num">{index + 1}</span>
              <div>
                <strong className="mono">{step.title}</strong>
                <span className="auth-flow-who">{step.who}</span>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <Callout type="note" title="Authentication vs authorisation">
        <p>
          <strong>Authentication</strong> answers “who are you?” – no token, a forged token or an expired token gets{' '}
          <code>401 Unauthorized</code>. <strong>Authorisation</strong> answers “what may you do?” – a valid token
          with the wrong role gets <code>403 Forbidden</code>. In FastAPI both are dependencies:{' '}
          <code>CurrentUser</code> and <code>Depends(require_role(&quot;lecturer&quot;))</code>.
        </p>
      </Callout>

      <SectionTitle
        title="Logging in and signing up"
        intro="Try the demo accounts, a wrong password, and a brute-force attack. Everything you do here updates the session bars in the demos further down."
      />
      <DemoCard
        title="Log in"
        description="A controlled form that posts form data to POST /api/auth/login. Wrong passwords get 401; after five failures in a minute the server answers 429 with a Retry-After time, and the button counts down."
        concepts={['OAuth2PasswordRequestForm', 'URLSearchParams', 'useContext', '401', '429 Retry-After']}
        files={[{ name: 'LoginForm.jsx', code: loginFormCode }, AUTH_CONTEXT, AUTH_UTILS, AUTH_PY, SECURITY_PY]}
      >
        <LoginForm />
      </DemoCard>

      <DemoCard
        title="Register"
        description="The password rules update as you type. Switch off the browser check to send invalid data and watch FastAPI’s 422 errors land on the right fields. A duplicate username gets 409; success logs you in automatically."
        concepts={['Pydantic Field', 'field_validator', '201 Created', '409 Conflict', '422 → fieldErrors']}
        files={[
          { name: 'RegisterForm.jsx', code: registerFormCode },
          AUTH_PY,
          { name: 'backend/app/models/user.py', code: userPy },
          AUTH_CONTEXT,
        ]}
      >
        <RegisterForm />
      </DemoCard>

      <SectionTitle
        title="Inside the token"
        intro="A JWT is readable by anyone – what makes it trustworthy is the signature that only the server can create and check."
      />
      <DemoCard
        title="What’s inside a JWT"
        description="The token is split at the dots and base64url-decoded in your browser. Then try to cheat: change the payload without re-signing it and send it – the server’s signature check answers 401."
        concepts={['base64url', 'header.payload.signature', 'claims: sub, exp, iat', 'HS256', 'tampering']}
        files={[
          { name: 'JwtInspector.jsx', code: jwtInspectorCode },
          { name: 'jwt.js', code: jwtCode },
          USE_NOW,
          SECURITY_PY,
          AUTH_PY,
        ]}
      >
        <JwtInspector />
      </DemoCard>

      <Callout type="warning" title="Decoding ≠ verifying">
        <p>
          Decoding a JWT only needs base64 – any website, browser extension or person who sees the token can read
          its claims. <strong>Never put secrets (passwords, personal data) in a token.</strong> And the browser
          can’t tell a real token from a forged one: only the server, with <code>SECRET_KEY</code>, can verify the
          signature. That is why React may <em>display</em> <code>role</code> from the token, but the server must
          never <em>trust</em> a claim it did not verify.
        </p>
      </Callout>

      <DemoCard
        title="Where should the token live?"
        description="By default the AuthProvider keeps the token only in memory. The switch also saves it in sessionStorage so a reload keeps you logged in – press “Run an XSS script” to see the price."
        concepts={['useState', 'useEffect sync', 'sessionStorage', 'XSS', 'httpOnly cookie']}
        files={[{ name: 'TokenStorage.jsx', code: tokenStorageCode }, AUTH_CONTEXT]}
      >
        <TokenStorage />
      </DemoCard>

      <Callout type="tip" title="What about httpOnly cookies?">
        <p>
          The server can put the token in a cookie with{' '}
          {/* <wbr /> = "may break the line here" – keeps this long code inside the box on phones */}
          <code>
            response.set_cookie(<wbr />&quot;access_token&quot;, token, httponly=True, secure=True, samesite=&quot;lax&quot;)
          </code>
          .
          JavaScript can’t read it at all, so XSS can’t steal it – but the browser now sends it automatically, so
          you must defend against CSRF (SameSite, CSRF tokens) and configure CORS with credentials. For
          Assignment 3, a short-lived token in memory is a perfectly reasonable choice.
        </p>
      </Callout>

      <SectionTitle
        title="Protecting endpoints"
        intro="Adding one parameter – user: CurrentUser – turns an endpoint into a protected one. React’s job is to send the token and to handle 401 and 403 gracefully."
      />
      <DemoCard
        title="Protected data"
        description="Your profile comes from GET /api/auth/me and is saved with PATCH /api/auth/me. Log out to see what the same request looks like without an Authorization header."
        concepts={['CurrentUser', 'Authorization: Bearer', 'authFetch()', 'PATCH', 'AbortController']}
        files={[
          { name: 'ProtectedProfile.jsx', code: protectedProfileCode },
          SESSION_BAR,
          AUTH_CONTEXT,
          AUTH_PY,
          SECURITY_PY,
        ]}
      >
        <ProtectedProfile />
      </DemoCard>

      <DemoCard
        title="Roles: student vs lecturer"
        description="The lecturer-only endpoint is guarded by require_role(&quot;lecturer&quot;). As a student you get 403, as a lecturer you see the class summary. Hide the button for students – and notice that the endpoint is still one curl command away."
        concepts={['require_role()', '403 Forbidden', 'conditional rendering', 'server-side enforcement']}
        files={[{ name: 'RoleGate.jsx', code: roleGateCode }, SECURITY_PY, AUTH_PY, AUTH_CONTEXT]}
      >
        <RoleGate />
      </DemoCard>

      <Callout type="tip" title="Hide in the UI, enforce on the server">
        <p>
          Hiding a button for students is good UX – it doesn’t show options that won’t work. But it is not
          security: anyone can open the browser’s dev tools, edit the JavaScript, or call your API with curl or
          Postman. Every protected endpoint needs its own check on the server.
        </p>
      </Callout>

      <DemoCard
        title="Token expiry"
        description="Log in with a token that lives for one minute and watch the clock. One second after it expires, a request goes out, the server answers 401, and authFetch() logs you out with a message."
        concepts={['exp claim', 'setTimeout + cleanup', 'derived state', '401 → logout', 'useCallback']}
        files={[
          { name: 'TokenExpiry.jsx', code: tokenExpiryCode },
          USE_NOW,
          AUTH_UTILS,
          AUTH_CONTEXT,
          SECURITY_PY,
          AUTH_PY,
        ]}
      >
        <TokenExpiry />
      </DemoCard>

      <SectionTitle
        title="Testing the back end"
        intro="Every rule above has a test – for the happy path AND the error paths (401, 403, 409, 422, 429). TestClient talks to the app without starting a server, using a fresh in-memory database."
      />
      <div className="demo-card">
        <CodeBlock
          code={'cd backend\nsource .venv/bin/activate      # Windows: .venv\\Scripts\\activate\npython -m pytest tests/test_auth.py -v'}
          filename="Terminal"
          language="shell"
        />
      </div>
      <div className="demo-card">
        <CodeBlock code={testAuthPy} filename="backend/tests/test_auth.py" />
      </div>

      <Callout type="warning" title="Security checklist for Assignment 3">
        <ul className="auth-checklist">
          {CHECKLIST.map((item, index) => (
            <li key={index}>
              <CircleCheck size={15} aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Callout>

      <Callout type="exercise">
        <ol>
          <li>
            Add <code>POST /api/auth/me/password</code> to <code>auth.py</code>: it needs the current password and a
            new one (same rules as <code>RegisterRequest</code>). Write two tests in <code>test_auth.py</code> – one
            that succeeds and one that gets 401 for a wrong current password.
          </li>
          <li>
            In <code>AuthContext.jsx</code>, log out <em>proactively</em>: start a <code>setTimeout</code> that fires at{' '}
            <code>expiresAt</code> (clean it up in the effect!) and show a warning toast one minute before.
          </li>
          <li>
            Build a <code>&lt;RequireRole role=&quot;lecturer&quot;&gt;</code> wrapper component that renders its children
            only for lecturers and a friendly message otherwise, and use it in <code>RoleGate.jsx</code>. Why does
            the server still need <code>require_role</code>?
          </li>
          <li>
            Add <code>GET /api/auth/users</code> (lecturers only) that lists all users as <code>UserPublic</code>, and
            show the list in <code>RoleGate.jsx</code> when the lecturer is logged in.
          </li>
          <li>
            Change the rate limit in <code>auth.py</code> to 3 failures per 30 seconds. Which test in{' '}
            <code>test_auth.py</code> fails, and how should it change?
          </li>
        </ol>
      </Callout>
    </AuthProvider>
  );
}
