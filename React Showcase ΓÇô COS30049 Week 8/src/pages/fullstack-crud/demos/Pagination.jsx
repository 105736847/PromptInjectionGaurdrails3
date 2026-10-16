/**
 * Pagination – "Showing 11–20 of 60", page buttons and a page-size select.
 * It only reports what the user wants (onPage / onPageSize); the parent owns
 * the state and sends the request. The numbers come from the server's reply.
 */
import { useId } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export const PAGE_SIZES = [5, 10, 20, 50];

export default function Pagination({ page, pages, pageSize, total, disabled, onPage, onPageSize }) {
  const sizeId = useId();
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const lastPage = Math.max(1, pages);

  return (
    <nav className="crud-pagination" aria-label="Pagination">
      <p className="small muted m-0" aria-live="polite">
        Showing <strong>{first}–{last}</strong> of <strong>{total}</strong>
      </p>

      <div className="row crud-pagination-buttons">
        <button type="button" className="btn-icon" onClick={() => onPage(1)} disabled={disabled || page <= 1} aria-label="First page">
          <ChevronsLeft size={18} />
        </button>
        <button type="button" className="btn-icon" onClick={() => onPage(page - 1)} disabled={disabled || page <= 1} aria-label="Previous page">
          <ChevronLeft size={18} />
        </button>
        <span className="small nowrap">
          Page {page} of {lastPage}
        </span>
        <button type="button" className="btn-icon" onClick={() => onPage(page + 1)} disabled={disabled || page >= lastPage} aria-label="Next page">
          <ChevronRight size={18} />
        </button>
        <button type="button" className="btn-icon" onClick={() => onPage(lastPage)} disabled={disabled || page >= lastPage} aria-label="Last page">
          <ChevronsRight size={18} />
        </button>
      </div>

      <div className="row crud-page-size">
        <label className="small" htmlFor={sizeId}>Rows per page</label>
        <select id={sizeId} className="input" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>
    </nav>
  );
}
