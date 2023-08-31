import { useContext } from "react"
import { AuthContext } from "@/contexts/AuthContext"
import styles from "./styles.module.scss"
import Link from "next/link"
import { ShoppingCart } from "phosphor-react"

export function Header() {
  const { user } = useContext(AuthContext)

  return(
    <header className={styles.headerContainer}>
        <Link href="./home">
          <img src="/images/logo.svg" />
        </Link>
        <div className={styles.linksWrapper}>
          <Link href="./home#upcoming_events">Próximos eventos</Link>
          <Link href="./login">Contato</Link>
          {
            user ?
            <Link href={`/${user.name}`}  className={styles.loginLink}>{user.name}</Link>
            :
            <Link href="./login"  className={styles.loginLink}>Login</Link>
          }
          <Link href="/checkout">
            <ShoppingCart size={24}/>
          </Link>
      </div>
    </header>
  )
}