import { useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import BackendStatus from '../../components/common/BackendStatus.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';
import CodeBlock from '../../components/common/CodeBlock.jsx';

import FileUploader from './demos/FileUploader.jsx';
import fileUploaderCode from './demos/FileUploader.jsx?raw';
import uploadedFilesCode from './demos/UploadedFiles.jsx?raw';
import uploadWithProgressCode from './demos/uploadWithProgress.js?raw';
import CsvAnalyser from './demos/CsvAnalyser.jsx';
import csvAnalyserCode from './demos/CsvAnalyser.jsx?raw';
import miniHistogramCode from './demos/MiniHistogram.jsx?raw';
import sampleCsvCode from './demos/data/sampleCsv.js?raw';
import BackgroundJobs from './demos/BackgroundJobs.jsx';
import backgroundJobsCode from './demos/BackgroundJobs.jsx?raw';
import jobCardCode from './demos/JobCard.jsx?raw';
import jobKindsCode from './demos/jobKinds.js?raw';
import usePollingCode from './demos/usePolling.js?raw';
import LiveTraining from './demos/LiveTraining.jsx';
import liveTrainingCode from './demos/LiveTraining.jsx?raw';
import trainingChartsCode from './demos/TrainingCharts.jsx?raw';
import useWebSocketCode from './demos/useWebSocket.js?raw';
import connectionPillCode from './demos/ConnectionPill.jsx?raw';
import ChatRoom from './demos/ChatRoom.jsx';
import chatRoomCode from './demos/ChatRoom.jsx?raw';
import EventFeed from './demos/EventFeed.jsx';
import eventFeedCode from './demos/EventFeed.jsx?raw';
import ChooseTransport from './demos/ChooseTransport.jsx';
import chooseTransportCode from './demos/ChooseTransport.jsx?raw';

// The Python code that answers each demo – shown next to the React code in the Code tabs.
import filesPy from '../../../backend/app/routers/files.py?raw';
import jobsPy from '../../../backend/app/routers/jobs.py?raw';
import realtimePy from '../../../backend/app/routers/realtime.py?raw';
import './realtime.css';

const SSE_WIRE = `$ curl -N http://localhost:8000/api/stream/events

event: hello
data: {"connection_id": "3fa2c1d0", "resumed_after": null, "listeners": 1}
retry: 2000

event: submission
data: {"kind":"submission","text":"Mia Chen submitted Assignment 2","unit":"COS30049","time":"…"}
id: 1

event: heartbeat
data: {"time": "…", "listeners": 1}
`;

export default function RealtimePage() {
  // Opened as /fullstack-realtime#chat-room-over-websocket (the chat's "second tab" link)?
  // Jump to that card. The layout scrolls to the top when a page mounts, so wait one tick.
  // 'instant', not smooth: the cards above are still loading and growing, and the browser keeps
  // an instantly-reached card in place while they do (scroll anchoring).
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return undefined;
    const timer = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'instant' }), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Full-Stack (FastAPI)"
        title="Files, Jobs & Real-time"
        intro="Beyond one request, one response: upload files with a real progress bar, hand slow work to the server and poll it, and let the server push data to the browser with WebSockets and Server-Sent Events. Every example talks to the FastAPI back end – open a card’s Code tab to see the React and the Python side by side."
        concepts={['UploadFile', 'FormData', 'upload progress', '202 Accepted', 'polling', 'WebSocket', 'EventSource', 'asyncio']}
        docs={[
          { label: 'FastAPI: Request Files', href: 'https://fastapi.tiangolo.com/tutorial/request-files/' },
          { label: 'FastAPI: Background Tasks', href: 'https://fastapi.tiangolo.com/tutorial/background-tasks/' },
          { label: 'FastAPI: WebSockets', href: 'https://fastapi.tiangolo.com/advanced/websockets/' },
          { label: 'MDN: Server-sent events', href: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events' },
          { label: 'MDN: WebSocket', href: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSocket' },
          { label: 'MDN: XMLHttpRequest.upload', href: 'https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload' },
        ]}
      />
      <BackendStatus />

      <SectionTitle
        title="Uploading files"
        intro="Files travel as multipart/form-data. FastAPI hands each one to your function as an UploadFile – spooled to a temporary file, so a large upload never fills the server’s memory."
      />
      <DemoCard
        title="Upload files with progress"
        description="Drop files, browse, or click a test file. The progress bar is real: it counts the bytes the browser has sent. Tick the switch to skip the browser’s checks and watch the server answer 413 (too large) and 415 (wrong type)."
        concepts={['drag & drop', '<input type="file">', 'FormData', 'xhr.upload.onprogress', 'AbortController', 'UploadFile', 'FileResponse']}
        files={[
          { name: 'FileUploader.jsx', code: fileUploaderCode },
          { name: 'uploadWithProgress.js', code: uploadWithProgressCode },
          { name: 'UploadedFiles.jsx', code: uploadedFilesCode },
          { name: 'backend/app/routers/files.py', code: filesPy },
        ]}
      >
        <FileUploader />
      </DemoCard>

      <Callout type="note" title="Why XMLHttpRequest and not fetch()?">
        <p>
          <code>fetch()</code> can read a <em>response</em> piece by piece (download progress), but browsers give it no
          event for how much of the <em>request body</em> has been sent. <code>XMLHttpRequest</code> has{' '}
          <code>xhr.upload.onprogress</code>, so upload progress bars still use it – wrapped in a Promise
          (<code>uploadWithProgress.js</code>) so the rest of the code looks just like <code>fetch</code>.
        </p>
      </Callout>
      <Callout type="tip" title="Make the progress bar crawl">
        <p>
          On localhost even 4 MB arrive in a few milliseconds. In Chrome DevTools open <strong>Network</strong>, change{' '}
          <em>No throttling</em> to <em>3G</em> and upload the “4 MB CSV” test file – now you can watch the bar and press
          Cancel halfway.
        </p>
      </Callout>

      <DemoCard
        title="Analyse a CSV on the server"
        description="Python reads the file with the csv module and sends back statistics and histogram bins as JSON; React and D3 only draw them. Change the number of bins and the server calculates again."
        concepts={['FormData', 'csv module', 'statistics', 'response_model', 'D3 calculates, React renders', 'stale requests']}
        files={[
          { name: 'CsvAnalyser.jsx', code: csvAnalyserCode },
          { name: 'MiniHistogram.jsx', code: miniHistogramCode },
          { name: 'data/sampleCsv.js', code: sampleCsvCode },
          { name: 'backend/app/routers/files.py', code: filesPy },
        ]}
      >
        <CsvAnalyser />
      </DemoCard>

      <SectionTitle
        title="Slow work: background jobs"
        intro="A request should be answered in well under a second. For slow work the server answers 202 Accepted with a job id straight away, keeps working in the background, and the browser asks for progress."
      />
      <DemoCard
        title="Background jobs + polling"
        description="Start several jobs at once. Each card polls GET /api/jobs/{id} every 500 ms and stops as soon as its job has finished – or when you remove the card. Cancel asks the job to stop at its next step."
        concepts={['202 Accepted', 'asyncio.create_task', 'polling', 'setTimeout loop', 'custom hook', 'useEffectEvent', 'effect cleanup']}
        files={[
          { name: 'BackgroundJobs.jsx', code: backgroundJobsCode },
          { name: 'JobCard.jsx', code: jobCardCode },
          { name: 'jobKinds.js', code: jobKindsCode },
          { name: 'usePolling.js', code: usePollingCode },
          { name: 'backend/app/routers/jobs.py', code: jobsPy },
        ]}
      >
        <BackgroundJobs />
      </DemoCard>

      <Callout type="warning" title="Polling is simple – but every poll is a request">
        <p>
          Each card sends two requests a second, even when nothing has changed. Pick a sensible interval (0.5–5 s), stop
          when the job is finished, and always stop in the effect cleanup. These jobs live in the server’s memory and
          vanish on a restart – real projects keep them in a database or a task queue such as Celery or RQ.
        </p>
      </Callout>

      <SectionTitle
        title="Real time: the server pushes"
        intro="With polling the browser keeps asking. With WebSockets and Server-Sent Events the connection stays open, and the server sends data the moment it has some."
      />
      <DemoCard
        title="Live training chart over WebSocket"
        description="Choose epochs and a learning rate, then press Start: the server streams one message per epoch and both D3 charts grow live. “Drop connection” closes the socket as if the Wi-Fi died – watch the hook reconnect, waiting longer after every failure."
        concepts={['new WebSocket()', 'send / onmessage', 'reconnect + backoff', 'useEffectEvent', 'asyncio.create_task', 'd3.line']}
        files={[
          { name: 'LiveTraining.jsx', code: liveTrainingCode },
          { name: 'useWebSocket.js', code: useWebSocketCode },
          { name: 'TrainingCharts.jsx', code: trainingChartsCode },
          { name: 'ConnectionPill.jsx', code: connectionPillCode },
          { name: 'backend/app/routers/realtime.py', code: realtimePy },
        ]}
      >
        <LiveTraining />
      </DemoCard>

      <Callout type="note" title="How a WebSocket reaches FastAPI during development">
        <p>
          The browser connects to <code>ws://localhost:3000/api/ws/…</code> – the Vite dev server – and{' '}
          <code>ws: true</code> in <code>vite.config.js</code> forwards the connection to FastAPI on port 8000.{' '}
          <code>wsUrl()</code> in <code>src/api/client.js</code> builds the address from the page’s own origin, so the
          same code keeps working after deployment (behind nginx, remember to forward the <code>Upgrade</code> and{' '}
          <code>Connection</code> headers).
        </p>
      </Callout>

      <DemoCard
        title="Chat room over WebSocket"
        description="Join with a nickname, then open this page in a second tab and join with another name (a phone on the same Wi-Fi works too, once Vite is started with npm run dev -- --host). Each message goes to the server once and is broadcast to everyone in the room."
        concepts={['WebSocket events', 'broadcast', 'ConnectionManager', 'join / leave', 'role="log"']}
        files={[
          { name: 'ChatRoom.jsx', code: chatRoomCode },
          { name: 'ConnectionPill.jsx', code: connectionPillCode },
          { name: 'backend/app/routers/realtime.py', code: realtimePy },
        ]}
      >
        <ChatRoom />
      </DemoCard>

      <DemoCard
        title="Server-sent events"
        description="A live activity feed over one long HTTP response. Pause closes the connection; “Drop connection” asks the server to end the stream, and EventSource reconnects by itself, sending the last id it saw. The server also ends every stream after 30 s, so a restart of uvicorn --reload never has to wait for an open tab."
        concepts={['EventSource', 'text/event-stream', 'named events', 'Last-Event-ID', 'EventSourceResponse', 'StreamingResponse', 'yield']}
        files={[
          { name: 'EventFeed.jsx', code: eventFeedCode },
          { name: 'ConnectionPill.jsx', code: connectionPillCode },
          { name: 'backend/app/routers/realtime.py', code: realtimePy },
        ]}
      >
        <EventFeed />
      </DemoCard>

      <Callout type="tip" title="Look at the raw stream">
        <p>An event stream is just text. Run this in a terminal (<code>-N</code> turns off curl’s buffering):</p>
        <div className="demo-card m-0">
          <CodeBlock code={SSE_WIRE} filename="Terminal" language="shell" />
        </div>
        <p>
          Most tutorials (and older FastAPI versions) write these lines by hand and return a{' '}
          <code>StreamingResponse(…, media_type=&quot;text/event-stream&quot;)</code> – see <code>countdown()</code> at the end
          of <code>realtime.py</code>, and try <code className="rt-break">curl -N &quot;http://localhost:8000/api/stream/countdown?start=3&quot;</code>.
        </p>
      </Callout>

      <SectionTitle title="Which one should I use?" />
      <DemoCard
        title="Polling vs SSE vs WebSocket"
        description="Choose what your feature needs – the matching column lights up."
        concepts={['polling', 'Server-Sent Events', 'WebSocket']}
        code={chooseTransportCode}
        filename="ChooseTransport.jsx"
      >
        <ChooseTransport />
      </DemoCard>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>FileUploader.jsx</code>, show a small preview of each image before it is uploaded. Hint:{' '}
            <code>URL.createObjectURL(file)</code> – and call <code>URL.revokeObjectURL</code> when the preview goes away.
          </li>
          <li>
            Add <code>.json</code> to <code>ALLOWED_TYPES</code> in <code>files.py</code> (and to <code>ALLOWED</code> in{' '}
            <code>FileUploader.jsx</code>). Then add a test to <code>tests/test_files.py</code> that uploads a JSON file.
          </li>
          <li>
            Add a fourth job kind, <code>"evaluate-model"</code>: extend <code>JobKind</code>, <code>_describe</code> and{' '}
            <code>_result</code> in <code>jobs.py</code> and the <code>JOB_KINDS</code> list in <code>jobKinds.js</code> (the form
            and every <code>JobCard</code> read their labels from it).
          </li>
          <li>
            Add an “Early stopping” checkbox to <code>LiveTraining.jsx</code>: send <code>{'{ action: \'stop\' }'}</code>{' '}
            automatically when the validation loss has not improved for 5 epochs.
          </li>
          <li>
            Give <code>ChatRoom.jsx</code> a “… is typing” line: send <code>{'{ "typing": true }'}</code>, and in{' '}
            <code>realtime.py</code> broadcast a <code>typing</code> event to everyone else.
          </li>
        </ol>
      </Callout>
    </>
  );
}
