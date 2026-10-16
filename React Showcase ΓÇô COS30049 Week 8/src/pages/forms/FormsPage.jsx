import PageHeader from '../../components/common/PageHeader.jsx';
import DemoCard from '../../components/common/DemoCard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import Callout from '../../components/common/Callout.jsx';
import CodeBlock from '../../components/common/CodeBlock.jsx';

import RegistrationForm from './demos/RegistrationForm.jsx';
import registrationFormCode from './demos/RegistrationForm.jsx?raw';
import registrationCode from './demos/registration.js?raw';
import registrationFormCss from './demos/RegistrationForm.module.css?raw';
import InputGallery from './demos/InputGallery.jsx';
import inputGalleryCode from './demos/InputGallery.jsx?raw';
import inputGalleryCss from './demos/InputGallery.module.css?raw';
import ValidationCompare from './demos/ValidationCompare.jsx';
import validationCompareCode from './demos/ValidationCompare.jsx?raw';
import validationCompareCss from './demos/ValidationCompare.module.css?raw';
import FileUpload from './demos/FileUpload.jsx';
import fileUploadCode from './demos/FileUpload.jsx?raw';
import fileUploadCss from './demos/FileUpload.module.css?raw';
import ControlledVsUncontrolled from './demos/ControlledVsUncontrolled.jsx';
import controlledVsUncontrolledCode from './demos/ControlledVsUncontrolled.jsx?raw';
import DynamicFields from './demos/DynamicFields.jsx';
import dynamicFieldsCode from './demos/DynamicFields.jsx?raw';
import TagInput from './demos/TagInput.jsx';
import tagInputCode from './demos/TagInput.jsx?raw';
import tagInputCss from './demos/TagInput.module.css?raw';
import Autocomplete from './demos/Autocomplete.jsx';
import autocompleteCode from './demos/Autocomplete.jsx?raw';
import autocompleteCss from './demos/Autocomplete.module.css?raw';
import ActionForm from './demos/ActionForm.jsx';
import actionFormCode from './demos/ActionForm.jsx?raw';

const sendJsonCode = `// Sending the registration data to a FastAPI back-end as JSON
async function registerTeam(values) {
  const response = await fetch('http://localhost:8000/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
  if (!response.ok) {
    // FastAPI puts validation problems in "detail"
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail ?? \`Request failed (\${response.status})\`);
  }
  return response.json();
}`;

const uploadJsCode = `// React: send selected File objects to FastAPI as multipart/form-data
async function uploadFiles(files) {
  const body = new FormData();
  files.forEach((file) => body.append('files', file)); // same key for every file

  // Do NOT set a Content-Type header yourself –
  // the browser adds "multipart/form-data; boundary=…" automatically.
  const response = await fetch('http://localhost:8000/upload', { method: 'POST', body });
  if (!response.ok) throw new Error(\`Upload failed (\${response.status})\`);
  return response.json();
}`;

const uploadPyCode = `# FastAPI: receive the files (needs: pip install python-multipart)
from fastapi import FastAPI, UploadFile

app = FastAPI()

@app.post("/upload")
async def upload(files: list[UploadFile]):
    return [{"name": f.filename, "type": f.content_type} for f in files]`;

export default function FormsPage() {
  return (
    <>
      <PageHeader
        eyebrow="HTML Elements"
        title="Forms & Inputs"
        intro="Forms are how users talk to your app – and, in Assignment 3, how they send data to your machine-learning model. This page covers every input type, controlled and uncontrolled inputs, validation, file uploads, custom inputs and React 19's new form actions."
        concepts={['controlled inputs', 'onChange', 'onSubmit', 'validation', 'FormData', 'useRef', 'file upload', 'useActionState', 'useFormStatus']}
        docs={[
          { label: '<input> in React', href: 'https://react.dev/reference/react-dom/components/input' },
          { label: '<form> actions', href: 'https://react.dev/reference/react-dom/components/form' },
          { label: 'useActionState', href: 'https://react.dev/reference/react/useActionState' },
          { label: 'MDN: Web forms', href: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms' },
        ]}
      />

      <SectionTitle
        title="A complete form"
        intro="Start here. This one form combines almost everything on the page: one state object, a generic change handler, validation with accessible error messages, and an async submit."
      />
      <DemoCard
        title="Project team registration"
        description="Try submitting it empty: every error appears and the first invalid field gets focus. Fill it in to see the spinner, a toast, and the JSON that would be sent to the server."
        concepts={['one state object', 'event.target.name', 'derived errors', 'onBlur touched', 'aria-invalid', 'aria-describedby', 'async submit', 'useToast']}
        files={[
          { name: 'RegistrationForm.jsx', code: registrationFormCode },
          { name: 'registration.js', code: registrationCode },
          { name: 'RegistrationForm.module.css', code: registrationFormCss },
        ]}
      >
        <RegistrationForm />
      </DemoCard>

      <Callout type="tip" title="Validate twice: in the browser AND on the server">
        <p>
          Front-end validation is for a friendly user experience – anyone can bypass it with the browser’s
          DevTools. Your FastAPI back-end must validate again (Pydantic models do this for you). Sending the
          form data to it is a single <code>fetch</code> call:
        </p>
      </Callout>
      <div className="demo-card">
        <CodeBlock code={sendJsonCode} filename="api.js" />
      </div>

      <SectionTitle
        title="Every input type"
        intro="HTML has more than 20 input types. Most give you a specialised keyboard on phones and a native picker for free."
      />
      <DemoCard
        title="Input type gallery"
        description="Each card shows one control and the exact value React receives from it. Note that numbers, dates and colours all arrive as strings."
        concepts={['type="…"', 'e.target.value', 'e.target.checked', 'e.target.files', 'selectedOptions', '<optgroup>', '<datalist>']}
        files={[
          { name: 'InputGallery.jsx', code: inputGalleryCode },
          { name: 'InputGallery.module.css', code: inputGalleryCss },
        ]}
      >
        <InputGallery />
      </DemoCard>

      <SectionTitle
        title="Validation"
        intro="The browser can validate many rules on its own. Custom JavaScript validation takes more code but gives you complete control."
      />
      <DemoCard
        title="Native HTML5 vs custom JavaScript validation"
        description="The same rules implemented twice. On the left, attributes + CSS :user-invalid and the browser's messages; on the right, a validate() function with our own wording."
        concepts={['required', 'minLength', 'pattern', 'min / max', ':user-invalid', 'validationMessage', 'onInvalidCapture', 'noValidate']}
        files={[
          { name: 'ValidationCompare.jsx', code: validationCompareCode },
          { name: 'ValidationCompare.module.css', code: validationCompareCss },
        ]}
      >
        <ValidationCompare />
      </DemoCard>

      <SectionTitle
        title="File uploads"
        intro="Uploading an image or CSV for your model to process is a common Assignment 3 feature."
      />
      <DemoCard
        title="Drag-and-drop upload with previews"
        description="Drop files on the zone or browse. Images get a thumbnail; wrong types, big files and duplicates are rejected with a reason."
        concepts={['onDragOver / onDrop', 'dataTransfer.files', 'URL.createObjectURL', 'revokeObjectURL cleanup', 'hidden input + ref']}
        files={[
          { name: 'FileUpload.jsx', code: fileUploadCode },
          { name: 'FileUpload.module.css', code: fileUploadCss },
        ]}
      >
        <FileUpload />
      </DemoCard>
      <div className="demo-card">
        <CodeBlock code={uploadJsCode} filename="upload.js" />
        <CodeBlock code={uploadPyCode} filename="main.py" />
      </div>

      <SectionTitle
        title="Controlled vs uncontrolled"
        intro="Two ways to own an input’s value. Controlled is the React default; uncontrolled is simpler when you only need the values on submit."
      />
      <DemoCard
        title="Controlled vs uncontrolled inputs"
        description="Left: the DOM keeps the values and we read them with a ref or FormData. Right: React state keeps them, so we can preview, transform and clear them from code."
        concepts={['defaultValue', 'useRef', 'new FormData()', 'formData.getAll()', 'value + onChange']}
        code={controlledVsUncontrolledCode}
        filename="ControlledVsUncontrolled.jsx"
      >
        <ControlledVsUncontrolled />
      </DemoCard>

      <Callout type="warning" title="“A component is changing an uncontrolled input to be controlled”">
        <p>
          This console warning means an input’s <code>value</code> started as <code>undefined</code> and later
          became a string. Always initialise state with an empty string (<code>useState('')</code>), never
          leave it undefined, and never mix <code>value</code> with <code>defaultValue</code>.
        </p>
      </Callout>

      <SectionTitle
        title="Building custom inputs"
        intro="When HTML has no element for the job, compose one from inputs, buttons and state – and remember keyboard users."
      />
      <DemoCard
        title="Dynamic fields: team members"
        description="Add and remove rows. Each row has a stable id used as its key, so removing a middle row never mixes up the inputs."
        concepts={['array state', 'map / filter', 'stable keys', 'useRef counter', 'immutable updates']}
        code={dynamicFieldsCode}
        filename="DynamicFields.jsx"
      >
        <DynamicFields />
      </DemoCard>

      <DemoCard
        title="Tag (chip) input"
        description="Press Enter or type a comma to add a keyword, Backspace to remove the last one. Paste “a, b, c” to add several at once."
        concepts={['onKeyDown', 'event.key', 'preventDefault', 'no duplicates', ':focus-within']}
        files={[
          { name: 'TagInput.jsx', code: tagInputCode },
          { name: 'TagInput.module.css', code: tagInputCss },
        ]}
      >
        <TagInput />
      </DemoCard>

      <DemoCard
        title="Autocomplete with keyboard navigation"
        description="Search the unit list. Use the arrow keys to move, Enter to choose and Esc to close. Matching text is highlighted."
        concepts={['role="combobox"', 'aria-activedescendant', 'derived results', 'onMouseDown preventDefault', 'scrollIntoView', '<mark>']}
        files={[
          { name: 'Autocomplete.jsx', code: autocompleteCode },
          { name: 'Autocomplete.module.css', code: autocompleteCss },
        ]}
      >
        <Autocomplete />
      </DemoCard>

      <SectionTitle
        title="React 19 form actions"
        intro="New in React 19: pass a function to <form action> and let React handle pending state, results and resetting the form."
      />
      <DemoCard
        title="Subscribe form with useActionState"
        description="Submit an empty or invalid email, then a valid one, then the same one again. The button knows it is pending through useFormStatus."
        concepts={['<form action={fn}>', 'useActionState', 'useFormStatus', 'FormData', 'isPending']}
        code={actionFormCode}
        filename="ActionForm.jsx"
      >
        <ActionForm />
      </DemoCard>

      <Callout type="note" title="Which approach should I use?">
        <p>
          For most assignment forms, a controlled form with <code>onSubmit</code> (like the registration form)
          is the clearest. Form actions shine when you want less boilerplate for simple submit-and-show-result
          forms, and they integrate with frameworks that run actions on the server.
        </p>
      </Callout>

      <Callout type="exercise">
        <ol>
          <li>
            In <code>registration.js</code>, add a “Confirm password” field to <code>INITIAL_VALUES</code> and a rule
            in <code>validate()</code> that checks it matches. Then render it in <code>RegistrationForm.jsx</code>.
          </li>
          <li>
            In <code>DynamicFields.jsx</code>, prevent two rows from having the same student ID and show an error
            on the duplicate row.
          </li>
          <li>
            Extend <code>FileUpload.jsx</code> to accept <code>.csv</code> files (type <code>text/csv</code>) and show
            the first line of the file using <code>await file.text()</code>.
          </li>
          <li>
            Make <code>Autocomplete.jsx</code> reusable: turn <code>UNITS</code> into an <code>items</code> prop and
            call an <code>onSelect</code> prop when an item is chosen.
          </li>
          <li>
            Rewrite the uncontrolled form in <code>ControlledVsUncontrolled.jsx</code> using{' '}
            <code>{'<form action={…}>'}</code> and <code>useActionState</code>.
          </li>
        </ol>
      </Callout>
    </>
  );
}
