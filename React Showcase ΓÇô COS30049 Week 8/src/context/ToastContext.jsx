/**
 * ToastContext – a global notification system.
 *
 * Any component can pop up a small message in the corner of the screen:
 *
 *   const { showToast } = useToast();
 *   showToast({ type: 'success', title: 'Saved', message: 'Your profile was updated.' });
 *
 * The toasts are rendered with createPortal() directly into <body>, so they
 * float above everything no matter where showToast() was called from.
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleCheck, CircleAlert, Info, TriangleAlert, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1); // useRef keeps a value between renders without re-rendering

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', title, message, duration = 3500 }) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, type, title, message }]);
      if (duration > 0) {
        setTimeout(() => dismissToast(id), duration);
      }
      return id;
    },
    [dismissToast],
  );

  // useMemo keeps the same object between renders so consumers don't re-render needlessly.
  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-region" role="region" aria-live="polite" aria-label="Notifications">
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type] ?? Info;
            return (
              <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
                <Icon size={20} className="toast-icon" aria-hidden="true" />
                <div className="toast-content">
                  {toast.title && <strong>{toast.title}</strong>}
                  {toast.message && <p>{toast.message}</p>}
                </div>
                <button
                  type="button"
                  className="btn-icon btn-ghost"
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Dismiss notification"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast() must be used inside <ToastProvider>');
  return context;
}
