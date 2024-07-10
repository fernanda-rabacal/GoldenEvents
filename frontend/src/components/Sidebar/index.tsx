import { useAuth } from "@/hooks/useAuth";
import styles from "./styles.module.scss"
import { useRouter } from "next/router";
import { ArrowLeft, ArrowRight, CalendarPlus, ClipboardText, House, ShoppingBag, User } from "phosphor-react";

interface SidebarProps {
  isCollapsed: boolean;
  onCollapse: () => void;
}

export function Sidebar({ isCollapsed, onCollapse } : SidebarProps) {
  const router = useRouter();
  const { user } = useAuth();

  function handleNavigate(href: string) {
    router.push(href)
  }

  const sidebarItems = [
    {
      name: "Home",
      href: "/organizador",
      icon: House,
    },
    {
      name: "Perfil",
      href: `/perfil/${user?.id}`,
      icon: User,
    },
    {
      name: "Criar Evento",
      href: "/organizador/eventos/criar",
      icon: CalendarPlus,
    },
    {
      name: "Meus Eventos",
      href: "/organizador/meus-eventos",
      icon: ClipboardText,
    },
    {
      name: "Minhas Compras",
      href: "/organizador/minhas-compras",
      icon: ShoppingBag,
    },
  ];

  return (
    <div className={styles.sidebarWrapper} data-collapse={isCollapsed}>
      <button className={styles.openSidebarBtn} onClick={onCollapse}>
        {isCollapsed ? <ArrowRight /> : <ArrowLeft />}
      </button>
      
      <aside className={styles.sidebar} id="sidebar">
        <div className={styles.sidebarTop}>
            <span>GOLDEN EVENTS</span>
          </div>

          <ul className={styles.sidebarList}>
            {sidebarItems.map(({ name, href, icon: Icon }) => {
              return (
                <li key={name}>
                  <button
                    className={`${styles.sidebarLink} ${
                      router.pathname === href ? styles.sidebarLinkActive : ""
                    }`}
                    onClick={() => handleNavigate(href)}
                  >
                    <span className={styles.sidebarIcon}>
                      <Icon size={22} />
                    </span>
                    <span className={styles.sidebarName}>{name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
      </aside>
    </div>
  )
}