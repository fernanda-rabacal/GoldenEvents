import { CaretDown, CaretUp, List, SignOut, House } from "phosphor-react";
import styles from './styles.module.scss'
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/router";
import Link from "next/link";

interface AdminHeaderProps {
  onSidebarCollapse: () => void;
}

export function AdminHeader({ onSidebarCollapse }: AdminHeaderProps) {
  const [openMenu, setOpenMenu] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()

  function toggleMenu() {
    setOpenMenu(prev => !prev)
  }

  function handleLogout() {
    signOut()

    router.push("/")
  }

  return (
    <header className={styles.header}>
      <button className={styles.openSidebar} onClick={onSidebarCollapse}>
        <List size={22}  weight="bold" />
      </button>

      <button className={styles.userInfo} onClick={toggleMenu}>
        <span>{user?.name}</span>

        <CaretDown size={22} />

        {openMenu && (
          <ul className={styles.menuList}>
            <li onClick={handleLogout}>
              <SignOut size={16} weight="bold" />
              <span>Sair</span>
            </li>
            <li>
              <Link href="/">
                <House size={16} weight="bold" />
                <span>Ir para início</span>
              </Link>
            </li>
          </ul>
        )}
      </button>
    </header>
  )
}