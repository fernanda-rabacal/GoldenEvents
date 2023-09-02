import styles from "./styles.module.scss"
import Link from "next/link"
import { useContext } from "react"
import { AuthContext } from "@/contexts/AuthContext"
import { ShoppingCart } from "phosphor-react"

export function Header() {
  const { user } = useContext(AuthContext)

  const userFirstName = user?.name.slice(0, user?.name.indexOf(" "))

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
            <Link href={`/profile/${user.name}`}  className={styles.loginLink}>{userFirstName}</Link>
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