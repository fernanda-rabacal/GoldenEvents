import { CaretDown, CaretUp, List, SignOut } from "phosphor-react";
import styles from './styles.module.scss'
import { useState } from "react";

export function AdminHeader() {
  const [openMenu, setOpenMenu] = useState(false)

  function toggleMenu() {
    setOpenMenu(prev => !prev)
  }

  function handleLogout() {

  }

  return (
    <header className={styles.header}>
      <button className={styles.openSidebar}>
        <List size={22}  weight="bold" />
      </button>

      <button className={styles.userInfo} onClick={toggleMenu}>
        <span>Fernanda</span>

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