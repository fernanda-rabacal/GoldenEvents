import { useRouter } from "next/router";
import styles from "./event.module.scss"

interface EventCardProps {
  id: string;
  slug: string;
  name: string;
  photo: string;
  start_date: string;
  description: string
}

export function EventCard({ name, description, photo, start_date, id, slug } : EventCardProps) {
  const router = useRouter()

  const day = new Date(start_date).toLocaleDateString('pt-br', { weekday: 'short' })
  const date = new Date(start_date).getDate()

  function navigateToDetails() {
    router.push(`/eventos/${slug}`)
  }

  return(
    <div className={styles.cardContainer} onClick={navigateToDetails}>
      <img src={photo || "/images/photo-placeholder.jpg"} alt={`${name} poster` || "default empty photo"} />
      <div className={styles.infos}>
        <div className={styles.dateContainer}>
          <span>{day}</span>
          {date}
        </div>
        <div>
          <h4>{name}</h4>
          <div className={styles.description} dangerouslySetInnerHTML={{ __html: description }} />
        </div>
      </div>
    </div>
  )
}