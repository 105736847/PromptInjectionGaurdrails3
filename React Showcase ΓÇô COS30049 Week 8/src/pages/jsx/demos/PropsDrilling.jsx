/**
 * PropsDrilling – a component tree, drawn as nested boxes.
 *
 * App owns the `user` state. Only <UserMenu> (3 levels down) actually needs
 * it, but <Dashboard> and <Sidebar> must accept it and pass it along.
 * Passing props through components that don't use them is called
 * "prop drilling". It works, but it gets tedious in big trees –
 * useContext (see the Hooks page) is the usual fix.
 */
import { useId, useState } from 'react';

// Draws a labelled box so you can SEE the component tree.
function TreeBox({ name, note, uses, children }) {
  return (
    <div className={`jsx-tree-box ${uses ? 'is-using' : ''}`}>
      <span className="jsx-tree-label">&lt;{name}&gt;</span>
      {note && <p className="small muted m-0">{note}</p>}
      {children}
    </div>
  );
}

function UserMenu({ user }) {
  return (
    <TreeBox name="UserMenu" note="props: { user } ← actually USES it" uses>
      <div className="row">
        <span className="avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase() || '?'}</span>
        <span>
          Signed in as <strong>{user.name || 'Anonymous'}</strong>
          <br />
          <span className="small muted">{user.role}</span>
        </span>
      </div>
    </TreeBox>
  );
}

function Sidebar({ user }) {
  return (
    <TreeBox name="Sidebar" note="props: { user } – doesn't use it, just passes it on">
      <UserMenu user={user} />
    </TreeBox>
  );
}

function Dashboard({ user }) {
  return (
    <TreeBox name="Dashboard" note="props: { user } – doesn't use it, just passes it on">
      <Sidebar user={user} />
    </TreeBox>
  );
}

export default function PropsDrilling() {
  const [user, setUser] = useState({ name: 'Mia', role: 'Student' });
  const id = useId();

  return (
    <TreeBox name="App" note="state: user – the single source of truth" uses>
      <div className="jsx-filter-bar">
        <div className="field">
          <label className="label" htmlFor={`${id}-name`}>user.name</label>
          <input id={`${id}-name`} className="input" value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })} />
        </div>
        <div className="field">
          <label className="label" htmlFor={`${id}-role`}>user.role</label>
          <select id={`${id}-role`} className="input" value={user.role}
            onChange={(e) => setUser({ ...user, role: e.target.value })}>
            <option>Student</option>
            <option>Tutor</option>
            <option>Unit convenor</option>
          </select>
        </div>
      </div>
      {/* user → Dashboard → Sidebar → UserMenu */}
      <Dashboard user={user} />
    </TreeBox>
  );
}
