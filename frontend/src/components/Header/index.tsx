import styles from "./styles.module.scss"
import Link from "next/link"
import { useState } from "react"
import { List } from "phosphor-react"
import { useAuth } from "@/hooks/useAuth"

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth()

  const userFirstName = user?.name.slice(0, user?.name.indexOf(" "))

  function toggleMenu() {
    setMenuOpen(prevState => !prevState)
  }

  return(
    <header className={styles.headerContainer}>
        <Link href="/">
          <img src="/images/logo.svg" />
        </Link>

        <button className={styles.openMenuBtn} onClick={toggleMenu}>
          <List size={32} color="#eba417" />
        </button>

        <div className={`${styles.linksWrapper} ${menuOpen && styles.linksWrapperOpen}`}>
          <Link href="/#upcoming_events">Próximos eventos</Link>
          <Link href="/login">Contato</Link>
          {user ?
            <Link href={`/profile/${user.name}`}  className={styles.loginLink}>{userFirstName}</Link>
            :
            <Link href="/login"  className={styles.loginLink}>Login</Link>
          }
      </div>
    </header>
  )
}