/**
 * ClassTimer – the "old" way: a CLASS component.
 *
 * Before hooks (React 16.8, 2019) this was the only way to have state and
 * lifecycle. You will still meet class components in older projects and
 * tutorials, so it's worth being able to read one:
 *
 *   constructor            → set up this.state (like useState's initial value)
 *   this.setState(...)     → like calling a state setter
 *   componentDidMount      → like useEffect(…, [])      (after the first render)
 *   componentDidUpdate     → like useEffect(…, [deps])  (after later renders)
 *   componentWillUnmount   → like an effect's cleanup function
 *   render()               → returns the JSX (the function body in a function component)
 */
import { Component } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

export default class ClassTimer extends Component {
  constructor(props) {
    super(props); // always call super(props) first
    this.state = { seconds: 0, running: true };
    this.intervalId = null; // an instance field – like useRef in a function component
    // Methods lose `this` when passed as callbacks, so bind them once here.
    this.toggle = this.toggle.bind(this);
    this.reset = this.reset.bind(this);
  }

  componentDidMount() {
    this.startTicking();
  }

  componentDidUpdate(prevProps, prevState) {
    // Only react when `running` actually changed (like a dependency array).
    if (prevState.running !== this.state.running) {
      if (this.state.running) this.startTicking();
      else this.stopTicking();
    }
  }

  componentWillUnmount() {
    this.stopTicking(); // clean up, or the interval keeps running forever
  }

  startTicking() {
    this.stopTicking();
    this.intervalId = setInterval(() => {
      // Updater form, exactly like setSeconds(s => s + 1)
      this.setState((state) => ({ seconds: state.seconds + 1 }));
    }, 1000);
  }

  stopTicking() {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  toggle() {
    this.setState((state) => ({ running: !state.running }));
  }

  reset() {
    this.setState({ seconds: 0 }); // setState MERGES: `running` is kept
  }

  render() {
    const { seconds, running } = this.state;
    const { label = 'Class component' } = this.props;
    return (
      <div className="card stack-sm hooks-timer">
        <span className="badge badge-code">{label}</span>
        <span className="hooks-timer-value">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span>
        <div className="row">
          <button type="button" className="btn btn-sm" onClick={this.toggle}>
            {running ? <Pause size={14} /> : <Play size={14} />} {running ? 'Pause' : 'Resume'}
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={this.reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>
    );
  }
}
