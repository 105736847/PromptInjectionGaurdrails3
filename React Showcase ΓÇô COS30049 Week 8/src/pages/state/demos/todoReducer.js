/**
 * todoReducer – ALL the ways the todo state can change, in one pure function.
 *
 *   (currentState, action) => nextState
 *
 * Rules for a reducer:
 *  - Pure: no fetch, no Math.random(), no Date.now(), no changing the old state.
 *    (That's why the new todo's id is created in the component and sent in the action.)
 *  - Always RETURN a new state object/array instead of modifying the old one.
 *  - `action.type` describes WHAT HAPPENED ("added"), not how to change the state.
 */
export const initialState = {
  filter: 'all', // 'all' | 'active' | 'done'
  todos: [
    { id: 1, text: 'Watch the Week 8 lecture', done: true },
    { id: 2, text: 'Finish the React lab exercises', done: false },
    { id: 3, text: 'Plan the Assignment 3 components', done: false },
  ],
};

export default function todoReducer(state, action) {
  switch (action.type) {
    case 'added':
      return { ...state, todos: [...state.todos, { id: action.id, text: action.text, done: false }] };

    case 'toggled':
      return {
        ...state,
        todos: state.todos.map((todo) => (todo.id === action.id ? { ...todo, done: !todo.done } : todo)),
      };

    case 'edited':
      return {
        ...state,
        todos: state.todos.map((todo) => (todo.id === action.id ? { ...todo, text: action.text } : todo)),
      };

    case 'deleted':
      return { ...state, todos: state.todos.filter((todo) => todo.id !== action.id) };

    case 'cleared_completed':
      return { ...state, todos: state.todos.filter((todo) => !todo.done) };

    case 'filter_changed':
      return { ...state, filter: action.filter };

    default:
      // Catch typos like dispatch({ type: 'addded' }) early.
      throw new Error(`Unknown action: ${action.type}`);
  }
}
