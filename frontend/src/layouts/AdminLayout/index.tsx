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
  const [isCollapsed, setIsCollapsed] = useState(false);

  function toggleSidebarCollapse() {
    setIsCollapsed(prevState => !prevState)
  }

  useEffect(() => {
    const width = window && window.innerWidth;

    if (width && width < 667) {
      setIsCollapsed(true)
    }
  }, [])

  return (
    <div className={styles.container}>
      <ToastContainer />
      <Sidebar isCollapsed={isCollapsed} onCollapse={toggleSidebarCollapse} />

      <div className={styles.page}>
        <AdminHeader onSidebarCollapse={toggleSidebarCollapse} />

        <div className={styles.pageContent}>
          { children }
        </div>
      </div>
    </div>
  )
} 