import styles from './styles.module.scss'
import Head from 'next/head'
import { AdminLayout } from '@/layouts/AdminLayout'

export default function OrganizerDashboard() {

  return (
    <>
      <Head>
        Organizador - Golden Eventos
      </Head>

      <AdminLayout>
        <div className={styles.container}></div>
      </AdminLayout>
    </>
  )
}