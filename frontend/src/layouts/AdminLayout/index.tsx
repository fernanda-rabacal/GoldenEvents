import { AdminHeader } from "@/components/AdminHeader";
import { Sidebar } from "@/components/Sidebar";
import { ReactNode, useState } from "react";
import styles from './styles.module.scss'

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  function toggleSidebarCollapse() {
    setIsCollapsed(prevState => !prevState)
  }

  return (
    <div className={styles.container}>
      <Sidebar isCollapsed={isCollapsed} onCollapse={toggleSidebarCollapse} />

      <div className={styles.content}>
        <AdminHeader onSidebarCollapse={toggleSidebarCollapse} />

        { children }
      </div>
    </div>
  )
} 