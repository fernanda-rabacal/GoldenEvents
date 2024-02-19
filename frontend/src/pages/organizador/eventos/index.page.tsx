import styles from './styles.module.scss';
import Head from "next/head";
import { GetStaticProps } from "next"
import { api } from "@/lib/axios"
import { Sidebar } from "@/components/Sidebar";
import { Event } from "@/@types/interfaces";
import Link from 'next/link';
import { Pencil } from 'phosphor-react';

export default function EventsList({ events }: { events: Event[] }) {

  return (
    <>
      <Head>Meus Eventos</Head>

      <div className={styles.container}>
        <Sidebar />

        <div className={styles.content}>
          <h2>Meus Eventos</h2>

          <div className={styles.filters}>
            <input placeholder='ID' />
            <input placeholder='Nome' />
            <input placeholder='Categoria' />
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
                    <td>{event.start_date}</td>
                    <td>{event.created_at}</td>
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
      </div>
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