import styles from './styles.module.scss'

export function Loading() {
    return (
        <div className={styles.loading}>
            <svg viewBox="25 25 50 50">
               <circle r="20" cy="50" cx="50"></circle>
            </svg>
        </div>
    )
}