import styles from "./styles.module.scss"
import Link from "next/link"
import { useState } from "react"
import { List } from "phosphor-react"
import { useAuth } from "@/hooks/useAuth"

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth()

  const userFirstName = user?.name.slice(0, user?.name.indexOf(" "))

  function toggleMenu() {
    setMenuOpen(prevState => !prevState)
  }

  function toggleUserMenu() {
    setUserMenuOpen(prevState => !prevState)
  }

  return(
    <header className={styles.headerContainer} data-opened-menu={menuOpen}>
        <Link href="/">
          <img src="/images/logo.svg" />
        </Link>

        <button className={styles.openMenuBtn} onClick={toggleMenu}>
          <List size={32} color="#eba417" />
        </button>

        <div className={styles.linksWrapper}>
          <Link href="/#upcoming_events">Próximos eventos</Link>
          <Link href="/login">Contato</Link>
          {user ? (
              <div className={styles.userMenu} data-open={userMenuOpen}>
                <button className={styles.loginLink} onClick={toggleUserMenu}>{userFirstName}</button>

                <ul>
                  <li>
                    <Link href="/organizador/perfil">Perfil</Link>
                  </li>
                  <li>
                    <Link href="/organizador">Área do Produtor</Link>
                  </li>
                  <li onClick={signOut}>Sair</li>
                </ul>
              </div>
            )
            :
            <Link href="/login" className={styles.loginLink}>Login</Link>
          }
      </div>
    </header>
  )
}