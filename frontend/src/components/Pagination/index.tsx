import styles from './styles.module.scss'

interface PaginationProps {
  totalPages: number
  currentPage?: number
  onPageChange: (page: number) => void
  siblingsCount?: number
}

const generatePagesArray = (from: number, to: number) =>
  [...new Array(to - from)].map((_, index) => from + index + 1).filter((page) => page > 0)

export const Pagination = ({
  totalPages,
  currentPage = 1,
  onPageChange,
  siblingsCount = 2,
}: PaginationProps) => {
  const previewsPages = currentPage > 1
    ? generatePagesArray(currentPage - 1 - siblingsCount, currentPage - 1)
    : []

  const nextPages = currentPage < totalPages
    ? generatePagesArray(currentPage, Math.min(currentPage + siblingsCount, totalPages))
    : []

  return (
    <ol className={styles.paginationContainer}>
      {currentPage > siblingsCount + 1 && (
        <PaginationItem pageNumber={1} onPageChange={onPageChange} />
      )}

      {currentPage > siblingsCount + 2 && (
        <li className={styles.restPagination}>...</li>
      )}

      {previewsPages?.map((page) => (
        <PaginationItem key={page} pageNumber={page} onPageChange={onPageChange} />
      ))}

      <li className={styles.currentPage}>
        {currentPage}
      </li>

      {nextPages?.map((page) => (
        <PaginationItem key={page} pageNumber={page} onPageChange={onPageChange} />
      ))}

      {currentPage + 1 + siblingsCount < totalPages && (
        <li className={styles.restPagination}>...</li>
      )}
      {currentPage + siblingsCount < totalPages && (
        <PaginationItem pageNumber={totalPages} onPageChange={onPageChange} />
      )}
    </ol>
  )
}

type PaginationItemProps = {
  pageNumber: number
  onPageChange: (page: number) => void
}

const PaginationItem = ({ pageNumber, onPageChange }: PaginationItemProps) => (
  <li>
    <button
      className={styles.pageButtons}
      onClick={() => onPageChange(pageNumber)}
    >
      {pageNumber}
    </button>
  </li>
)
