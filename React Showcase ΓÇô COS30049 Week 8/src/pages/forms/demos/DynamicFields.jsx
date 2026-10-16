import { useId, useRef, useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';

/**
 * Dynamic form fields: add / remove team-member rows.
 *
 * - The rows live in an ARRAY in state. Adding = new array with one more item,
 *   removing = filter(), editing = map() that replaces one item. Never mutate.
 * - Each row gets a stable, unique `id` used as its key. Using the array index
 *   as key here would mix up the inputs when a middle row is removed!
 */
const ROLES = ['Front-end', 'Back-end', 'ML engineer', 'Project manager', 'Tester'];
const MAX_MEMBERS = 5;

export default function DynamicFields() {
  const uid = useId();
  const nextId = useRef(2); // survives re-renders without causing them
  const [members, setMembers] = useState([{ id: 1, name: '', role: 'Front-end', studentId: '' }]);

  function addMember() {
    const id = nextId.current++; // create the id OUTSIDE the updater – updaters must be pure
    setMembers((prev) => [...prev, { id, name: '', role: 'Back-end', studentId: '' }]);
  }

  function removeMember(id) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function updateMember(id, field, value) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  }

  const complete = members.filter((m) => m.name.trim() && /^\d{9}$/.test(m.studentId)).length;

  return (
    <div className="stack">
      <div className="table-wrap">
        <table className="table">
          <caption className="small">
            <Users size={16} aria-hidden="true" style={{ verticalAlign: '-3px' }} /> Team members ({members.length}/{MAX_MEMBERS})
          </caption>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Full name</th>
              <th scope="col">Role</th>
              <th scope="col">Student ID</th>
              <th scope="col"><span className="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => {
              const idInvalid = member.studentId !== '' && !/^\d{9}$/.test(member.studentId);
              return (
                <tr key={member.id}>
                  <td>{index + 1}</td>
                  <td>
                    <input className="input" aria-label={`Member ${index + 1} name`} value={member.name}
                      placeholder="e.g. Priya Sharma" onChange={(e) => updateMember(member.id, 'name', e.target.value)} />
                  </td>
                  <td>
                    <select className="input" aria-label={`Member ${index + 1} role`} value={member.role}
                      onChange={(e) => updateMember(member.id, 'role', e.target.value)}>
                      {ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>
                    <input className="input" aria-label={`Member ${index + 1} student ID`} value={member.studentId}
                      inputMode="numeric" maxLength={9} placeholder="9 digits" aria-invalid={idInvalid}
                      aria-describedby={idInvalid ? `${uid}-id-hint` : undefined}
                      onChange={(e) => updateMember(member.id, 'studentId', e.target.value.replace(/\D/g, ''))} />
                  </td>
                  <td>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeMember(member.id)}
                      disabled={members.length === 1} aria-label={`Remove member ${index + 1}`}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p id={`${uid}-id-hint`} className="hint">Student IDs have exactly 9 digits (fictional, e.g. 103456789).</p>

      <div className="row-between">
        <button type="button" className="btn btn-secondary" onClick={addMember} disabled={members.length >= MAX_MEMBERS}>
          <Plus size={16} aria-hidden="true" /> Add member
        </button>
        <span className="small muted">{complete} of {members.length} rows complete</span>
      </div>

      <pre className="demo-output">{JSON.stringify(members, null, 2)}</pre>
    </div>
  );
}
