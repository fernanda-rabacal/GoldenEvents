import { AdminHeader } from "@/components/AdminHeader";
import { Sidebar } from "@/components/Sidebar";
import { ReactNode, useEffect, useState } from "react";
import styles from './styles.module.scss'

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(0);
  

  function toggleSidebarCollapse() {
    setIsCollapsed(prevState => !prevState)
  }

  useEffect(() => {
    setWidth(window?.innerWidth)
  }, [])

  useEffect(() => {
    if (width < 667) {
      setIsCollapsed(true)
    }
  }, [width])

  return (
    <div className={styles.container}>
      <Sidebar isCollapsed={isCollapsed} onCollapse={toggleSidebarCollapse} screenWidth={width} />

      <div className={styles.content}>
        <AdminHeader onSidebarCollapse={toggleSidebarCollapse} />

        { children }
      </div>
    </div>
  )
} 