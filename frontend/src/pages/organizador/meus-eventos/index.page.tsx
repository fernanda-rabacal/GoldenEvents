import styles from './styles.module.scss';
import Head from "next/head";
import { GetStaticProps } from "next"

import Link from 'next/link';
import { Pencil, Trash } from 'phosphor-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Select } from '@/components/Select';
import { Input } from '@/components/Input';

import { Event, EventCategory } from "@/@types/interfaces";
import { formatDate } from '@/utils/format_date';
import { api } from "@/lib/axios"
import { useMutationData } from '@/hooks/apiHooks';
import { useState } from 'react';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';
import { toastNotify } from '@/lib/toastify';

interface EventsListPageProps {
  events: Event[],
  categories: EventCategory[]
}

export default function EventsList({ events, categories }: EventsListPageProps) {
  const router = useRouter()

  const formattedCategories = categories?.map(category => ({
    key: category.id,
    value: category.name
  }))

  function getCategoryName(categoryId: number) {
    const eventCategory = categories.find(category => category.id === categoryId)

    return eventCategory?.name 
  }

  function handleEditEvent(event: Event) {
    const eventAlreadyHappened = dayjs(event.start_date).isBefore(dayjs())

    if (eventAlreadyHappened) {
      return toastNotify("error", 'Você não pode editar um evento que já passou.')
    }

    router.push(`/organizador/eventos/editar/${event.slug}`)
  }


  return (
    <>
      <Head>Meus Eventos</Head>

      <AdminLayout>
        <div className={styles.content}>
          <h2>Meus Eventos</h2>

          <div className={styles.filters}>
            <Input placeholder='ID' />
            <Input placeholder='Nome' />
            <Select 
              placeholder="Categoria" 
              options={formattedCategories}
              onChangeSelect={(option) => { console.log(option) }}
              />
            <Input placeholder='Data de Início' />
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
                    <td>{getCategoryName(event.category_id)}</td>
                    <td>{event.capacity}</td>
                    <td>{formatDate(event.start_date)}</td>
                    <td>{formatDate(event.created_at)}</td>
                    <td>
                      <button onClick={() => handleEditEvent(event)}>
                        <Pencil size={22} />
                      </button>
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