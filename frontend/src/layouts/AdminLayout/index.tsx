import { AdminHeader } from "@/components/AdminHeader";
import { Sidebar } from "@/components/Sidebar";
import { ReactNode, useEffect, useState } from "react";
import styles from './styles.module.scss'
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
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
      <ToastContainer />
      <Sidebar isCollapsed={isCollapsed} onCollapse={toggleSidebarCollapse} screenWidth={width} />

      <div className={styles.page}>
        <AdminHeader onSidebarCollapse={toggleSidebarCollapse} />

        <div className={styles.pageContent}>
          { children }
        </div>
      </div>
    </div>
  )
} 