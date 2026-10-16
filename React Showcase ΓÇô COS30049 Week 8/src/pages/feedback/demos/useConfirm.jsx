/**
 * useConfirm – a Promise-based replacement for window.confirm().
 *
 *   const [confirm, confirmDialog] = useConfirm();
 *
 *   async function handleDelete() {
 *     if (await confirm({ title: 'Delete?', message: '…', danger: true })) { …delete… }
 *   }
 *   return <>…{confirmDialog}</>;   // ← render the dialog somewhere
 *
 * How it works: confirm() creates a Promise and stores its resolve function in
 * a ref. The dialog's buttons call resolve(true) or resolve(false), which lets
 * the awaiting code continue.
 */
import { useCallback, useRef, useState } from 'react';
import Modal from './Modal.jsx';

export default function useConfirm() {
  const [options, setOptions] = useState(null); // null = dialog closed
  const resolveRef = useRef(null); // useRef: changing it must NOT re-render

  const confirm = useCallback(
    (dialogOptions) =>
      new Promise((resolve) => {
        resolveRef.current = resolve;
        setOptions(dialogOptions);
      }),
    [],
  );

  const settle = useCallback((answer) => {
    resolveRef.current?.(answer);
    resolveRef.current = null;
    setOptions(null);
  }, []);

  const cancel = useCallback(() => settle(false), [settle]);

  const confirmDialog = (
    <Modal
      open={options !== null}
      onClose={cancel}
      title={options?.title}
      size="sm"
      role="alertdialog" // "alertdialog" = a dialog that needs an answer
      footer={
        <>
          {/* The SAFE choice gets focus first, so pressing Enter by accident does no harm. */}
          <button type="button" className="btn btn-ghost" onClick={cancel} data-autofocus>
            {options?.cancelLabel ?? 'Cancel'}
          </button>
          <button type="button" className={`btn ${options?.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => settle(true)}>
            {options?.confirmLabel ?? 'Confirm'}
          </button>
        </>
      }
    >
      <p>{options?.message}</p>
    </Modal>
  );

  return [confirm, confirmDialog];
}
