import styles from './styles.module.scss'

interface ErrorMessageProps {
  children: string
}

export function ErrorMessage({ children }: ErrorMessageProps) {
  return (
    <p className={styles.errorMessage}>{children}</p>
  )
}