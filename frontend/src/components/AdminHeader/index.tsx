import { HomeOutlined, KeyboardArrowDownOutlined, LogoutOutlined, MenuOutlined } from "@mui/icons-material";
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
        <MenuOutlined sx={{ fontSize: 22 }} />
      </button>

      <button className={styles.userInfo} onClick={toggleMenu}>
        <span>{user?.name}</span>

        <KeyboardArrowDownOutlined sx={{ fontSize: 22 }} />

        {openMenu && (
          <ul className={styles.menuList}>
            <li onClick={handleLogout}>
              <LogoutOutlined sx={{ fontSize: 16 }} />
              <span>Sair</span>
            </li>
            <li>
              <Link href="/">
                <HomeOutlined sx={{ fontSize: 16 }} />
                <span>Ir para início</span>
              </Link>
            </li>
          </ul>
        )}
      </button>
    </header>
  )
}