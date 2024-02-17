import { useRouter } from "next/router";
import styles from "./event.module.scss"

interface EventCardProps {
  id: string;
  slug: string;
  name: string;
  photo: string;
  start_date: Date;
  description: string
}

export function EventCard({ name, description, photo, start_date, id, slug } : EventCardProps) {

  const router = useRouter()

  const day = new Date(start_date).toLocaleDateString('pt-br', { weekday: 'short'})
  const date = new Date(start_date).getDate()

  function navigateToDetails() {
    router.push(`/eventos/${slug}`)
  }

  return(
    <div className={styles.cardContainer} onClick={navigateToDetails}>
      <img src={photo} alt=""/>
      <div className={styles.description}>
        <div className={styles.dateContainer}>
          <span>{day}</span>
          {date}
        </div>
        <div>
          <h4>{name}</h4>
          <p>{description}</p>
        </div>
      </div>
    </div>
  )
}