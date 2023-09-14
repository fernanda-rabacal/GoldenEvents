import styles from "./styles.module.scss"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"

export function Header() {
  const { user } = useAuth()

  const userFirstName = user?.name.slice(0, user?.name.indexOf(" "))

  return(
    <header className={styles.headerContainer}>
        <Link href="/">
          <img src="/images/logo.svg" />
        </Link>

        <div className={styles.linksWrapper}>
          <Link href="/#upcoming_events">Próximos eventos</Link>
          <Link href="/login">Contato</Link>
          {
            user ?
            <Link href={`/profile/${user.name}`}  className={styles.loginLink}>{userFirstName}</Link>
            :
            <Link href="/login"  className={styles.loginLink}>Login</Link>
          }
      </div>
    </header>
  )
}