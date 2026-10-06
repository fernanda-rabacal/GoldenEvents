import { useAuth } from "@/hooks/useAuth";
import styles from "./styles.module.scss"
import { useRouter } from "next/router";
import { ArrowBackOutlined, ArrowForwardOutlined, AssignmentOutlined, EditCalendarOutlined, HomeOutlined, PersonOutlined, ShoppingBagOutlined } from "@mui/icons-material";

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
      icon: HomeOutlined,
    },
    {
      name: "Perfil",
      href: `/perfil/${user?.id}`,
      icon: PersonOutlined,
    },
    {
      name: "Criar Evento",
      href: "/organizador/eventos/criar",
      icon: EditCalendarOutlined,
    },
    {
      name: "Meus Eventos",
      href: "/organizador/meus-eventos",
      icon: AssignmentOutlined,
    },
    {
      name: "Minhas Compras",
      href: "/organizador/minhas-compras",
      icon: ShoppingBagOutlined,
    },
  ];

  return (
    <div className={styles.sidebarWrapper} data-collapse={isCollapsed}>
      <button className={styles.openSidebarBtn} onClick={onCollapse}>
        {isCollapsed ? <ArrowForwardOutlined fontSize="inherit" /> : <ArrowBackOutlined fontSize="inherit" />}
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
                      <Icon sx={{ fontSize: 22 }} />
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