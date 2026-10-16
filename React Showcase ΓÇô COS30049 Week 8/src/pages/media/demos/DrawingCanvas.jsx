import { useEffect, useRef, useState } from 'react';
import { Brush, Download, Eraser, Trash2, Undo2 } from 'lucide-react';
import styles from './DrawingCanvas.module.css';

/**
 * A drawing pad on <canvas> using POINTER events (mouse, touch and pen alike).
 *
 * - Canvas is imperative: we draw with the 2D context API via a ref, React
 *   only renders the toolbar. Values that must not trigger a re-render while
 *   drawing (is the pointer down? last point?) live in refs, not state.
 * - devicePixelRatio: a canvas has its own pixel grid. On a "retina" screen
 *   (ratio 2) we make it twice as big and scale the context, so lines are crisp.
 * - Undo stores ImageData snapshots taken before every stroke.
 */
const COLORS = ['#4f46e5', '#0e9f8e', '#e8833a', '#d9467a', '#7c9a2e', '#8b93a5'];
const HEIGHT = 340;
const MAX_UNDO = 10; // each snapshot is a full copy of the pixels – keep the list short

export default function DrawingCanvas() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const logicalSize = useRef({ width: 0, height: HEIGHT });
  const isDrawing = useRef(false);
  const lastPoint = useRef(null);
  const history = useRef([]); // ImageData snapshots
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(6);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'
  const [undoCount, setUndoCount] = useState(0);
  const [pointerType, setPointerType] = useState('–');

  // Set up the canvas once, after it is in the DOM and has a size.
  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.getBoundingClientRect().width || 600; // fallback if not visible yet
    canvas.width = Math.round(width * dpr); // real (device) pixels
    canvas.height = Math.round(HEIGHT * dpr);
    // willReadFrequently: we call getImageData() for every stroke (undo), so keep pixels in CPU memory
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.scale(dpr, dpr); // from now on we draw in CSS pixels
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;
    logicalSize.current = { width, height: HEIGHT };
  }, []);

  function getPoint(event) {
    const rect = canvasRef.current.getBoundingClientRect();
    // If the page was resized after set-up, scale the position to the original size.
    return {
      x: (event.clientX - rect.left) * (logicalSize.current.width / rect.width),
      y: (event.clientY - rect.top) * (logicalSize.current.height / rect.height),
    };
  }

  function drawLine(from, to, event) {
    const ctx = ctxRef.current;
    // destination-out = "remove pixels" → a true eraser on a transparent canvas
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    // Pens report pressure (0–1); mouse and touch report a fixed value.
    const pressure = event.pointerType === 'pen' ? 0.3 + event.pressure * 1.4 : 1;
    ctx.lineWidth = (tool === 'eraser' ? size * 3 : size) * pressure;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  function saveSnapshot() {
    const canvas = canvasRef.current;
    history.current.push(ctxRef.current.getImageData(0, 0, canvas.width, canvas.height));
    if (history.current.length > MAX_UNDO) history.current.shift();
    setUndoCount(history.current.length);
  }

  function handlePointerDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId); // keep getting moves outside the canvas
    saveSnapshot();
    isDrawing.current = true;
    lastPoint.current = getPoint(event);
    drawLine(lastPoint.current, lastPoint.current, event); // a single tap draws a dot
    setPointerType(event.pointerType);
  }

  function handlePointerMove(event) {
    if (!isDrawing.current) return;
    const point = getPoint(event);
    drawLine(lastPoint.current, point, event);
    lastPoint.current = point;
  }

  const stopDrawing = () => { isDrawing.current = false; };

  function undo() {
    const snapshot = history.current.pop();
    if (snapshot) ctxRef.current.putImageData(snapshot, 0, 0); // putImageData ignores the scale
    setUndoCount(history.current.length);
  }

  function clear() {
    saveSnapshot(); // so "Clear" can be undone too
    const { width, height } = logicalSize.current;
    ctxRef.current.clearRect(0, 0, width, height);
  }

  function download() {
    const canvas = canvasRef.current;
    // The canvas is transparent – paint it onto white so the PNG looks right everywhere.
    const out = document.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, 0, 0);
    const link = document.createElement('a');
    link.href = out.toDataURL('image/png'); // the image as a "data:image/png;base64,…" URL
    link.download = 'my-drawing.png';
    link.click();
  }

  return (
    <div className="stack-sm">
      <div className={styles.toolbar}>
        <div className="row" style={{ gap: 4 }} role="group" aria-label="Tool">
          <button type="button" className={`btn btn-sm ${tool === 'pen' ? 'btn-secondary' : ''}`} aria-pressed={tool === 'pen'} onClick={() => setTool('pen')}>
            <Brush size={15} aria-hidden="true" /> Pen
          </button>
          <button type="button" className={`btn btn-sm ${tool === 'eraser' ? 'btn-secondary' : ''}`} aria-pressed={tool === 'eraser'} onClick={() => setTool('eraser')}>
            <Eraser size={15} aria-hidden="true" /> Eraser
          </button>
        </div>

        <div className="row" style={{ gap: 6 }} role="group" aria-label="Colour">
          {COLORS.map((c) => (
            <button key={c} type="button" className={styles.swatch} style={{ background: c }} aria-label={`Colour ${c}`}
              aria-pressed={color === c} onClick={() => { setColor(c); setTool('pen'); }} />
          ))}
          <input type="color" value={color} onChange={(e) => { setColor(e.target.value); setTool('pen'); }}
            aria-label="Custom colour" className={styles.picker} />
        </div>

        <label className="row small" style={{ gap: 6 }}>
          Size
          <input type="range" min="1" max="30" value={size} onChange={(e) => setSize(Number(e.target.value))} />
          <span className="mono" style={{ width: 24 }}>{size}</span>
        </label>

        <div className="row" style={{ gap: 4 }}>
          <button type="button" className="btn btn-sm" onClick={undo} disabled={undoCount === 0}>
            <Undo2 size={15} aria-hidden="true" /> Undo ({undoCount})
          </button>
          <button type="button" className="btn btn-sm" onClick={clear}>
            <Trash2 size={15} aria-hidden="true" /> Clear
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={download}>
            <Download size={15} aria-hidden="true" /> PNG
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ height: HEIGHT, cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
        role="img"
        aria-label="Drawing area"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
      />
      <p className="hint m-0">
        Last input device: <strong>{pointerType}</strong> – try a mouse, a finger on a touch screen, or a stylus.
      </p>
    </div>
  );
}
