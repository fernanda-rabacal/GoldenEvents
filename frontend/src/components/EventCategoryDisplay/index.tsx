import styles from './styles.module.scss'

interface EventCategoryDisplayProps {
    name: string;
    photo: string
}

export function EventCategoryDisplay({ name, photo } : EventCategoryDisplayProps) {
 return (
    <div className={styles.categoryDisplay}>
        <img src={photo} alt={`${name} poster`} />
        <span>{name}</span>
    </div>
 )
}