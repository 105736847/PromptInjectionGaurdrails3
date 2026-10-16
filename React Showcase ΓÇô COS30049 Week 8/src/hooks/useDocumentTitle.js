import { useEffect } from 'react';

/**
 * useDocumentTitle – sets the text shown in the browser tab.
 *
 *   useDocumentTitle('Forms & Inputs');
 */
export default function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · React Showcase` : 'React Showcase';
    // The cleanup function restores the old title when the component unmounts.
    return () => {
      document.title = previous;
    };
  }, [title]);
}
