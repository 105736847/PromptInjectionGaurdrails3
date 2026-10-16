import PageHeader from '../../components/common/PageHeader.jsx';
import BackendStatus from '../../components/common/BackendStatus.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';

import { StudentsDataProvider } from './demos/StudentsData.jsx';
import RequestFlow from './demos/RequestFlow.jsx';
import RestContract from './demos/RestContract.jsx';
import StudentTable from './demos/StudentTable.jsx';
import CreateStudent from './demos/CreateStudent.jsx';
import EditStudent from './demos/EditStudent.jsx';
import DeleteStudents from './demos/DeleteStudents.jsx';
import StatsDashboard from './demos/StatsDashboard.jsx';
import HookLab from './demos/HookLab.jsx';

// ?raw = the file's source code as a string, shown in each card's "Code" tab
import requestFlowCode from './demos/RequestFlow.jsx?raw';
import sequenceDiagramCode from './demos/SequenceDiagram.jsx?raw';
import flowStepsCode from './demos/flowSteps.js?raw';
import restContractCode from './demos/RestContract.jsx?raw';
import studentTableCode from './demos/StudentTable.jsx?raw';
import paginationCode from './demos/Pagination.jsx?raw';
import requestPanelCode from './demos/RequestPanel.jsx?raw';
import createStudentCode from './demos/CreateStudent.jsx?raw';
import studentFieldsCode from './demos/StudentFields.jsx?raw';
import editStudentCode from './demos/EditStudent.jsx?raw';
import editDialogCode from './demos/EditDialog.jsx?raw';
import deleteStudentsCode from './demos/DeleteStudents.jsx?raw';
import statsDashboardCode from './demos/StatsDashboard.jsx?raw';
import statBarsCode from './demos/StatBars.jsx?raw';
import hookLabCode from './demos/HookLab.jsx?raw';
import useStudentsCode from './demos/useStudents.js?raw';
import studentsDataCode from './demos/StudentsData.jsx?raw';
import studentsApiCode from './demos/studentsApi.js?raw';
import studentBitsCode from './demos/StudentBits.jsx?raw';
// …and the Python that answers those requests
import studentsRouterPy from '../../../backend/app/routers/students.py?raw';
import studentModelPy from '../../../backend/app/models/student.py?raw';
import studentsTestPy from '../../../backend/tests/test_students.py?raw';
import './fullstack-crud.css';

const routerFile = { name: 'backend/app/routers/students.py', code: studentsRouterPy };
const modelFile = { name: 'backend/app/models/student.py', code: studentModelPy };
const hookFile = { name: 'useStudents.js', code: useStudentsCode };
const bitsFile = { name: 'StudentBits.jsx', code: studentBitsCode }; // RequestError: the offline message

export default function CrudPage() {
  return (
    // One shared data layer: after any change, every demo on the page refetches.
    <StudentsDataProvider>
      <PageHeader
        eyebrow="Full-Stack (FastAPI)"
        title="Database CRUD"
        intro="Create, Read, Update and Delete – the four operations behind almost every web app. Here React talks to a real FastAPI server that stores students in SQLite through SQLModel. Every table, form and chart below sends real HTTP requests, and every Code tab shows the React component next to the Python endpoint that answers it."
        concepts={['REST', 'GET · POST · PATCH · DELETE', 'SQLModel', 'SQLite', 'Pydantic', 'pagination', 'optimistic UI', 'AbortController']}
        docs={[
          { label: 'FastAPI: SQL databases', href: 'https://fastapi.tiangolo.com/tutorial/sql-databases/' },
          { label: 'SQLModel', href: 'https://sqlmodel.tiangolo.com/' },
          { label: 'Fetching data in Effects', href: 'https://react.dev/learn/synchronizing-with-effects#fetching-data' },
          { label: 'HTTP status codes', href: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status' },
          { label: 'AbortController', href: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController' },
        ]}
      />
      <BackendStatus />

      <SectionTitle
        title="How a request flows"
        intro="Before building anything, follow one request all the way from a React component to the database and back. Every demo on this page makes this same journey."
      />
      <DemoCard
        title="Follow one request"
        description="Step through the sequence diagram, press Play, or send a real request to see the live values at every stop. The invalid request shows Pydantic rejecting bad input before your Python function even runs."
        concepts={['sequence diagram', 'router', 'Pydantic', 'SessionDep', 'response_model', '422']}
        files={[
          { name: 'RequestFlow.jsx', code: requestFlowCode },
          { name: 'SequenceDiagram.jsx', code: sequenceDiagramCode },
          { name: 'flowSteps.js', code: flowStepsCode },
          routerFile,
          modelFile,
          hookFile,
        ]}
      >
        <RequestFlow />
      </DemoCard>

      <DemoCard
        title="The REST contract"
        description="Seven endpoints, one resource. The verb says what to do, the path says to what, and the status code tells the front end how it went. Reset the demo data whenever the class has deleted too much."
        concepts={['REST', 'status codes', 'request body', '/api/docs', 'pytest']}
        files={[
          { name: 'RestContract.jsx', code: restContractCode },
          { name: 'studentsApi.js', code: studentsApiCode },
          routerFile,
          { name: 'backend/tests/test_students.py', code: studentsTestPy },
        ]}
      >
        <RestContract />
      </DemoCard>

      <Callout type="tip" title="Route order matters in FastAPI">
        <p>
          Routes are matched from top to bottom. <code>GET /api/students/stats</code> is declared <em>before</em>{' '}
          <code>GET /api/students/{'{id}'}</code> in <code>students.py</code> – otherwise FastAPI would try to read
          “stats” as an integer id and answer <code>422</code>.
        </p>
      </Callout>

      <SectionTitle
        title="Read: a server-side table"
        intro="Searching, filtering, sorting and paging all happen in the database. The browser only ever downloads one page."
      />
      <DemoCard
        title="Server-side table"
        description="Type to search (debounced), filter, click a header to sort, change the page. Every control becomes a query parameter – look at the address bar: the view is shareable. The old rows stay visible, dimmed, while the next page loads."
        concepts={['useSearchParams', 'debounce', 'aria-sort', 'LIMIT / OFFSET', 'COUNT(*)', 'whitelisted sort']}
        files={[
          { name: 'StudentTable.jsx', code: studentTableCode },
          { name: 'Pagination.jsx', code: paginationCode },
          { name: 'RequestPanel.jsx', code: requestPanelCode },
          hookFile,
          bitsFile,
          routerFile,
          modelFile,
        ]}
      >
        <StudentTable />
      </DemoCard>

      <Callout type="note" title="Why not just load everything and filter in React?">
        <p>
          With 60 students you could. With 60 000 you would download megabytes, freeze the browser while sorting and
          still show only 10 rows. Databases are built for <code>WHERE</code>, <code>ORDER BY</code> and{' '}
          <code>COUNT</code> – and an index makes them fast. The sort column is looked up in a whitelist, so a URL like{' '}
          <code>?sort=score;DROP TABLE student</code> is answered with <code>422</code>, never run.
        </p>
      </Callout>

      <SectionTitle
        title="Create, update and delete"
        intro="Every successful change calls notifyChange() from one small shared data layer, so the table above, the lists here and the charts below all refetch and highlight the changed row."
      />
      <DemoCard
        title="Create: POST with validation on both sides"
        description="Fill in the form or press “Fill example”. Turn “Check in the browser first” off and submit nonsense to see FastAPI’s 422 errors land under the right fields; try an existing student ID for a 409."
        concepts={['POST', '201 Created', '422 → field errors', '409 Conflict', 'noValidate', 'notifyChange']}
        files={[
          { name: 'CreateStudent.jsx', code: createStudentCode },
          { name: 'StudentFields.jsx', code: studentFieldsCode },
          { name: 'studentsApi.js', code: studentsApiCode },
          bitsFile,
          routerFile,
          modelFile,
        ]}
      >
        <CreateStudent />
      </DemoCard>

      <Callout type="warning" title="Browser validation is a convenience, not security">
        <p>
          Anyone can skip your JavaScript with curl, Postman or <code>/api/docs</code>. The rules that protect your data
          live in the Pydantic models on the server; the browser copy only gives faster feedback. The server also
          guards uniqueness twice: a friendly check first, then the database’s <code>UNIQUE</code> constraint.
        </p>
      </Callout>

      <DemoCard
        title="Update with PATCH"
        description="Edit a student: the dialog sends ONLY the fields you changed, and shows the exact payload before you save. Then try the 404 path: let “another user” delete the student while the dialog is open, and press Save."
        concepts={['PATCH vs PUT', 'exclude_unset', '<dialog>', 'derived state', '404 Not Found']}
        files={[
          { name: 'EditStudent.jsx', code: editStudentCode },
          { name: 'EditDialog.jsx', code: editDialogCode },
          { name: 'StudentFields.jsx', code: studentFieldsCode },
          routerFile,
          modelFile,
        ]}
      >
        <EditStudent />
      </DemoCard>

      <DemoCard
        title="Delete: optimistic with rollback"
        description="The row disappears the moment you confirm – before the server has answered. If the request fails, the row comes back and a toast explains why. Changed your mind? Undo within 5 seconds."
        concepts={['DELETE', '204 No Content', 'optimistic update', 'rollback', 'undo', 'Set in state']}
        files={[
          { name: 'DeleteStudents.jsx', code: deleteStudentsCode },
          { name: 'StudentsData.jsx', code: studentsDataCode },
          { name: 'studentsApi.js', code: studentsApiCode }, // remove() and toCreatePayload() for Undo
          routerFile,
        ]}
      >
        <DeleteStudents />
      </DemoCard>

      <Callout type="note" title="Hard delete, soft delete and undo">
        <p>
          <code>DELETE</code> here really removes the row, so Undo has to <em>create</em> the student again – with a new
          id, because SQLite’s <code>AUTOINCREMENT</code> never re-uses one. Many real systems prefer a{' '}
          <strong>soft delete</strong> instead: a <code>deleted_at</code> column that hides the row, so undo (and
          auditing) is trivial. Another option is to wait 5 seconds before sending the <code>DELETE</code> at all.
        </p>
      </Callout>

      <SectionTitle
        title="Aggregates in SQL"
        intro="Dashboards need counts and averages, not rows. Let the database compute them."
      />
      <DemoCard
        title="Stats computed by the database"
        description="GET /api/students/stats runs COUNT, AVG, GROUP BY and a CASE expression inside SQLite and returns a few dozen numbers instead of every row. Create, edit or delete a student above and the tiles and bars refresh by themselves."
        concepts={['GROUP BY', 'AVG', 'CASE', 'KPI tiles', 'D3 scales', 'D3 calculates, React renders']}
        files={[
          { name: 'StatsDashboard.jsx', code: statsDashboardCode },
          { name: 'StatBars.jsx', code: statBarsCode },
          routerFile,
          modelFile,
        ]}
      >
        <StatsDashboard />
      </DemoCard>

      <SectionTitle
        title="A reusable data hook"
        intro="useStudents() powers every list on this page. Here it is on its own, with a log of every request it sends."
      />
      <DemoCard
        title="useStudents() under the microscope"
        description="Type into the box and watch the log: older requests are aborted or ignored. Switch both protections off (latency on) and press “Type “chen” fast” to reproduce a real race condition."
        concepts={['custom hook', 'AbortController', 'race condition', 'effect cleanup', 'useEffectEvent']}
        files={[
          { name: 'HookLab.jsx', code: hookLabCode },
          hookFile,
          { name: 'StudentsData.jsx', code: studentsDataCode },
          { name: 'studentsApi.js', code: studentsApiCode },
          routerFile,
        ]}
      >
        <HookLab />
      </DemoCard>

      <Callout type="tip" title="In a bigger app">
        <p>
          Libraries such as TanStack Query or SWR give you this hook plus caching, retries and “invalidate after a
          mutation” out of the box. They are worth using – and now you know exactly what they do for you.
        </p>
      </Callout>

      <Callout type="exercise">
        <ol>
          <li>
            Add a <code>min_score</code> query parameter to <code>StudentQuery</code> (<code>student.py</code>) and a{' '}
            <code>WHERE score &gt;= :min_score</code> filter in <code>list_students()</code>. Then add a range slider to{' '}
            <code>StudentTable.jsx</code> that stores it in the URL. Check the SQL panel.
          </li>
          <li>
            Add a <code>model_validator</code> to <code>StudentCreate</code>: a student with status{' '}
            <code>graduated</code> must be in year 4. Show the 422 message in <code>CreateStudent.jsx</code> – where does
            an error without a field name appear?
          </li>
          <li>
            Turn the hard delete into a <strong>soft delete</strong>: add <code>deleted_at: datetime | None = None</code>{' '}
            to <code>StudentFields</code>, then stop the server and delete <code>backend/app.db</code> –{' '}
            <code>create_all()</code> never adds a column to an existing table (real projects use a migration tool such
            as Alembic). Let <code>DELETE</code> set it, make <code>get_or_404()</code>, <code>list_students()</code> and{' '}
            <code>student_stats()</code> ignore those rows, and add <code>POST /api/students/{'{id}'}/restore</code> that
            clears it (careful: <code>get_or_404()</code> now hides the very row it must find). Undo in{' '}
            <code>DeleteStudents.jsx</code> then calls it – and the id stays the same.
          </li>
          <li>
            Protect POST, PATCH and DELETE with <code>Depends(require_role(&quot;lecturer&quot;))</code> (see the Login
            &amp; JWT page), then handle <code>401</code>/<code>403</code> in <code>studentsApi.js</code>. Write a pytest in{' '}
            <code>test_students.py</code> for each status code.
          </li>
          <li>
            In <code>useStudents.js</code>, keep a small cache (a <code>Map</code> from URL to data) so going back to a
            page you have already seen shows it instantly while it refetches in the background.
          </li>
        </ol>
      </Callout>
    </StudentsDataProvider>
  );
}
