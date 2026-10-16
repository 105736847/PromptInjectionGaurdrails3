/**
 * ProfileEditor – an OBJECT in state, updated immutably.
 *
 * Never change the object you got from useState (profile.name = 'x').
 * Instead build a NEW object with the spread operator and hand it to the setter:
 *
 *   setProfile({ ...profile, name: 'x' })                   // copy, then override one field
 *   setProfile({ ...profile, address: { ...profile.address, campus: 'x' } })  // nested: copy each level
 *
 * One change handler serves every input thanks to the input's `name`
 * attribute and a computed property key: { [name]: value }.
 */
import { useId, useState } from 'react';

const INITIAL_PROFILE = {
  firstName: 'Minh',
  lastName: 'Pham',
  email: 'minh.pham@student.example.edu',
  newsletter: true,
  address: { campus: 'Hawthorn', building: 'ATC' },
};

export default function ProfileEditor() {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [changes, setChanges] = useState(0);
  const id = useId();

  // Works for text inputs AND checkboxes.
  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setProfile((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setChanges((n) => n + 1);
  }

  // Nested object: copy the outer object AND the inner one.
  function handleAddressChange(event) {
    const { name, value } = event.target;
    setProfile((current) => ({
      ...current,
      address: { ...current.address, [name]: value },
    }));
    setChanges((n) => n + 1);
  }

  return (
    <div className="grid-2">
      <form className="stack" onSubmit={(e) => e.preventDefault()}>
        <div className="grid-2">
          <div className="field">
            <label className="label" htmlFor={`${id}-first`}>First name</label>
            <input id={`${id}-first`} className="input" name="firstName" value={profile.firstName} onChange={handleChange} />
          </div>
          <div className="field">
            <label className="label" htmlFor={`${id}-last`}>Last name</label>
            <input id={`${id}-last`} className="input" name="lastName" value={profile.lastName} onChange={handleChange} />
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor={`${id}-email`}>Email</label>
          <input id={`${id}-email`} className="input" type="email" name="email" value={profile.email} onChange={handleChange} />
        </div>
        <div className="grid-2">
          <div className="field">
            <label className="label" htmlFor={`${id}-campus`}>Campus (nested)</label>
            <select id={`${id}-campus`} className="input" name="campus" value={profile.address.campus}
              onChange={handleAddressChange}>
              <option>Hawthorn</option>
              <option>Sarawak</option>
              <option>Online</option>
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor={`${id}-building`}>Building (nested)</label>
            <input id={`${id}-building`} className="input" name="building" value={profile.address.building}
              onChange={handleAddressChange} />
          </div>
        </div>
        <label className="check">
          <input type="checkbox" name="newsletter" checked={profile.newsletter} onChange={handleChange} />
          Subscribe to the newsletter
        </label>
        <div className="row">
          <button type="button" className="btn btn-sm btn-ghost"
            onClick={() => { setProfile(INITIAL_PROFILE); setChanges(0); }}>
            Reset
          </button>
          <span className="small muted">{changes} new objects created so far</span>
        </div>
      </form>

      <div className="stack-sm">
        <span className="label">Current state – a brand-new object after every change</span>
        <pre className="demo-output">{JSON.stringify(profile, null, 2)}</pre>
        <p className="small muted m-0">
          Hello {profile.firstName} {profile.lastName} from {profile.address.campus}!
        </p>
      </div>
    </div>
  );
}
