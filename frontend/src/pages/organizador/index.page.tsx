import styles from './styles.module.scss'
import Head from 'next/head'
import { Sidebar } from '@/components/Sidebar'

export default function OrganizerDashboard() {

  return (
    <>
      <Head>
        Organizador - Golden Eventos
      </Head>

      <div>
        <Sidebar />


      </div>
    </>
  )
}