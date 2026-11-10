import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  itemLabel = 'componentes',
}) {
  if (totalPages <= 1 && totalItems <= pageSize) return null

  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  const getPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages = [1]
    if (currentPage > 4) {
      pages.push('...')
    }

    const rangeStart = Math.max(2, currentPage - 1)
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1)

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 3) {
      pages.push('...')
    }

    pages.push(totalPages)
    return pages
  }

  return (
    <div className="table-pagination" aria-label="Navegación de páginas">
      <div className="pagination-summary">
        Mostrando <strong>{start}–{end}</strong> de <strong>{totalItems}</strong> {itemLabel}
        <span className="pagination-page-indicator" style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>
          (Página {currentPage} de {totalPages})
        </span>
      </div>

      <div className="pagination-controls" role="navigation" aria-label="Páginas">
        <button
          type="button"
          className="pagination-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          <span className="pagination-btn-text">Anterior</span>
        </button>

        {getPages().map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="pagination-ellipsis" aria-hidden="true">
                …
              </span>
            )
          }

          const isCurrent = p === currentPage
          return (
            <button
              key={p}
              type="button"
              className={`pagination-btn ${isCurrent ? 'active' : ''}`}
              aria-current={isCurrent ? 'page' : undefined}
              aria-label={`Ir a la página ${p}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        })}

        <button
          type="button"
          className="pagination-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          aria-label="Página siguiente"
        >
          <span className="pagination-btn-text">Siguiente</span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

