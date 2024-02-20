import styles from './styles.module.scss';
import Head from "next/head";
import { GetStaticProps } from "next"
import { api } from "@/lib/axios"
import { Sidebar } from "@/components/Sidebar";
import { Event } from "@/@types/interfaces";
import Link from 'next/link';
import { Pencil } from 'phosphor-react';
import { Select } from '@/components/Select';
import { formatDate } from '@/utils/format_date';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminLayout } from '@/layouts/AdminLayout';

export default function EventsList({ events }: { events: Event[] }) {

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
              options={[
                'Teatro',
                'Escola',
                'Esportes',
                'Negócios',
                'Cursos'
              ]}

              onChangeSelect={(option: string) => { console.log(option) }}
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
  return {
    props: {
      events: [
        {
          id: 1, 
          name: "Evento Teste 1",
          category: "Teatro",
          capacity: 100,
          created_at: "2023-12-31T12:00:00",
          start_date: "2023-12-31T12:00:00",
        },
        {
          id: 2, 
          name: "Evento Teste 2",
          category: "Esportes",
          capacity: 105,
          created_at: "2023-12-31T12:00:00",
          start_date: "2023-12-31T12:00:00",
        },
        {
          id: 3, 
          name: "Evento Teste 3",
          category: "Esportes",
          capacity: 105,
          created_at: "2023-12-31T12:00:00",
          start_date: "2023-12-31T12:00:00",
        },
        {
          id: 4, 
          name: "Evento Teste 4",
          category: "Esportes",
          capacity: 105,
          created_at: "2023-12-31T12:00:00",
          start_date: "2023-12-31T12:00:00",
        },
      ],
      categories: [
        {
          id: 1,
          name: 'Teatro',
        },
        {
          id: 2,
          name: 'Esportes'
        }
      ]
    }
  }
}