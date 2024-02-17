import { useState } from "react";
import styles from "./styles.module.scss"
import { useRouter } from "next/router";
import { ArrowLeft, ArrowRight, CalendarPlus, ClipboardText, User } from "phosphor-react";
import Image from "next/image";
import Link from "next/link";

const sidebarItems = [
  {
    name: "Perfil",
    href: "/organizador",
    icon: User,
  },
  {
    name: "Criar Evento",
    href: "/organizador/criar-evento",
    icon: CalendarPlus,
  },
  {
    name: "Meus Eventos",
    href: "/organizador/eventos",
    icon: ClipboardText,
  },
];

export function Sidebar() {
  const router = useRouter();

  const [isCollapsed, setIsCollapsed] = useState(false);

  function toggleSidebarcollapse() {
    setIsCollapsed(prevState => !prevState)
  }

  return (
    <div className={styles.sidebarWrapper} data-collapse={isCollapsed}>
      <button className={styles.openSidebarBtn} onClick={toggleSidebarcollapse}>
        {isCollapsed ? <ArrowRight /> : <ArrowLeft />}
      </button>
      
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
            <Image
              width={80}
              height={80}
              className={styles.sidebarLogo}
              src="/images/logo.svg"
              alt="logo"
            />
          </div>

          <ul className={styles.sidebarList}>
            {sidebarItems.map(({ name, href, icon: Icon }) => {
              return (
                <li key={name}>
                  <Link
                    className={`${styles.sidebarLink} ${
                      router.pathname === href ? styles.sidebarLinkActive : ""
                    }`}
                    href={href}
                  >
                    <span className={styles.sidebarIcon}>
                      <Icon />
                    </span>
                    <span className={styles.sidebarName}>{name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
      </aside>
    </div>
  )
}