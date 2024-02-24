import styles from './styles.module.scss';
import Head from "next/head";
import { GetStaticProps } from "next"
import { api } from "@/lib/axios"
import { Sidebar } from "@/components/Sidebar";
import { Event, EventCategory } from "@/@types/interfaces";
import Link from 'next/link';
import { Pencil } from 'phosphor-react';
import { Select } from '@/components/Select';
import { formatDate } from '@/utils/format_date';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminLayout } from '@/layouts/AdminLayout';

interface EventsListPageProps {
  events: Event[],
  categories: EventCategory[]
}

export default function EventsList({ events, categories }: EventsListPageProps) {

  const formattedCategories = categories?.map(category => ({
    key: category.id,
    value: category.name
  }))

  return (
    <>
      <Head>Meus Eventos</Head>

      <AdminLayout>
        <div className={styles.content}>
          <h2>Meus Eventos</h2>

          <div className={styles.filters}>
            <input placeholder='ID' />
            <input placeholder='Nome' />
            <Select 
              placeholder="Categoria" 
              options={formattedCategories}
              onChangeSelect={(option) => { console.log(option) }}
              />
            <input placeholder='Data de Início' />
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Capacidade</th>
                <th>Data de início</th>
                <th>Criado em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {
                events.map(event => (
                  <tr key={event.id}>
                    <td>{event.id}</td>
                    <td>{event.name}</td>
                    <td>{event.category}</td>
                    <td>{event.capacity}</td>
                    <td>{formatDate(event.start_date)}</td>
                    <td>{formatDate(event.created_at)}</td>
                    <td>
                      <Link href={`/editar/${event.id}`}>
                        <Pencil size={22} />
                      </Link>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </AdminLayout>
    </>
  )

}

export const getStaticProps: GetStaticProps = async () => {
  const eventData = await api.get('/events')
  const categoryData = await api.get('/events/categories')

  return {
    props: {
        events: eventData.data.events ? eventData.data.events : [],
        categories: categoryData.data.categories ? categoryData.data.categories : [],  
    }
  }
}