/**
 * registration.js – the data and rules behind RegistrationForm.jsx.
 *
 * Keeping validation in plain functions (no React inside!) makes it easy to
 * read, reuse and test. The component just calls validate(values).
 */

export const INITIAL_VALUES = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  portfolio: '',
  age: '', // inputs always give us strings – convert to a number on submit
  startDate: '',
  meetingTime: '',
  unit: '',
  role: '',
  skills: [], // checkbox group → array of the ticked values
  hours: '10',
  teamColour: '#4f46e5',
  bio: '',
  avatar: null, // a File object (or null)
  agree: false,
};

export const UNITS = [
  { code: 'COS30049', name: 'Computing Technology Innovation Project' },
  { code: 'COS30043', name: 'Interface Design and Development' },
  { code: 'SWE30003', name: 'Software Architectures and Design' },
  { code: 'COS20007', name: 'Object Oriented Programming' },
];
export const ROLES = ['Front-end', 'Back-end', 'Machine learning', 'Project manager'];
export const SKILLS = ['React', 'JavaScript', 'Python', 'FastAPI', 'scikit-learn', 'Git', 'UI design'];
export const BIO_MAX = 200;

// en-CA formats dates as YYYY-MM-DD – the format <input type="date"> uses – in LOCAL time.
export const today = () => new Date().toLocaleDateString('en-CA');

export function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return { score, label: ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][score] };
}

function isHttpUrl(value) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** Returns { fieldName: 'message' } for every invalid field, in form order. */
export function validate(values) {
  const errors = {};
  const name = values.fullName.trim();

  if (!name) errors.fullName = 'Please enter your full name.';
  else if (name.length < 2) errors.fullName = 'Name must be at least 2 characters.';

  if (!values.email) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email, e.g. alex@student.example.edu.au';

  if (!values.password) errors.password = 'Choose a password.';
  else if (getPasswordStrength(values.password).score < 3) {
    errors.password = 'Too weak – use 8+ characters with upper & lower case letters and a number.';
  }

  if (values.phone && !/^\+?[\d\s()-]{8,}$/.test(values.phone)) errors.phone = 'Use digits only, e.g. +61 412 345 678.';

  if (values.portfolio && !isHttpUrl(values.portfolio)) errors.portfolio = 'Enter a full URL starting with https://';

  if (values.age === '') errors.age = 'Age is required.';
  else if (Number(values.age) < 16 || Number(values.age) > 99) errors.age = 'Age must be between 16 and 99.';

  if (!values.startDate) errors.startDate = 'Pick a start date.';
  else if (values.startDate < today()) errors.startDate = 'The start date cannot be in the past.'; // 'YYYY-MM-DD' strings sort like dates

  if (values.meetingTime && (values.meetingTime < '08:00' || values.meetingTime > '20:00')) {
    errors.meetingTime = 'Meetings must be between 08:00 and 20:00.';
  }

  if (!values.unit) errors.unit = 'Select your unit.';
  if (!values.role) errors.role = 'Choose a role.';
  if (values.skills.length < 2) errors.skills = 'Pick at least two skills.';

  if (values.avatar) {
    if (!values.avatar.type.startsWith('image/')) errors.avatar = 'The avatar must be an image.';
    else if (values.avatar.size > 1024 * 1024) errors.avatar = 'The image must be smaller than 1 MB.';
  }

  if (!values.agree) errors.agree = 'You must accept the team charter.';
  return errors;
}

/** Pretend back-end: waits 1.5 s, and rejects one "already used" email. */
export function fakeRegister(values) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (values.email.toLowerCase() === 'taken@example.com') {
        reject(new Error('This email is already registered to another team.'));
      } else {
        resolve({ id: Math.floor(Math.random() * 9000) + 1000 });
      }
    }, 1500);
  });
}
