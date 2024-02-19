import { useState } from "react";
import styles from "./styles.module.scss"
import { useRouter } from "next/router";
import { ArrowLeft, ArrowRight, CalendarPlus, ClipboardText, House, User } from "phosphor-react";
import Image from "next/image";
import Link from "next/link";

const sidebarItems = [
  {
    name: "Home",
    href: "/organizador",
    icon: House,
  },
  {
    name: "Perfil",
    href: "/organizador/perfil",
    icon: User,
  },
  {
    name: "Criar Evento",
    href: "/organizador/criar-evento",
    icon: CalendarPlus,
  },
  {
    name: "Meus Eventos",
    href: "/organizador/meus-eventos",
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
           {/*  <Image
              width={80}
              height={80}
              className={styles.sidebarLogo}
              src="/images/logo.svg"
              alt="logo"
            />
 */}
            <span>GOLDEN EVENTS</span>
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
                      <Icon size={22} />
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