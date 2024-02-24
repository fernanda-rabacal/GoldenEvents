import { CaretDown, CaretUp, List, SignOut } from "phosphor-react";
import styles from './styles.module.scss'
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AdminHeaderProps {
  onSidebarCollapse: () => void;
}

export function AdminHeader({ onSidebarCollapse }: AdminHeaderProps) {
  const [openMenu, setOpenMenu] = useState(false)
  const { user } = useAuth()

  function toggleMenu() {
    setOpenMenu(prev => !prev)
  }

  function handleLogout() {

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
          </ul>
        )}
      </button>
    </header>
  )
}