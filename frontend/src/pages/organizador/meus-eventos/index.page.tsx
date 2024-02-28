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
import { useQueryData } from '@/hooks/apiHooks';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';
import { toastNotify } from '@/lib/toastify';
import { Pagination } from '@/components/Pagination';
import { useDebounce } from '@/hooks/useDebounce';

interface EventsListPageProps {
  categories: EventCategory[]
}

export default function EventsList({ categories }: EventsListPageProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState({
    name: '',
    categoryId: '',
    active: '',
    startDate: ''
  })
  const debouncedQueryName = useDebounce(searchQuery.name)
  const debouncedQueryCategory = useDebounce(searchQuery.categoryId)
  const debouncedQueryStartDate = useDebounce(searchQuery.startDate)
  const debouncedQueryActive = useDebounce(searchQuery.active)
  const url = `/event?take=10&skip=${currentPage - 1}&name=${debouncedQueryName}&category_id=${debouncedQueryCategory}&start_date=${debouncedQueryStartDate}&active=${debouncedQueryActive}`

  const router = useRouter()

  const { data, isLoading, isError, refetch } = useQueryData(url)

  if (isError) {
    toastNotify('error', "Não foi possivel captar os eventos")
  }

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

  function handleSearchQuery(key: keyof typeof searchQuery, value: string) {
    setSearchQuery(prev => ({...prev, [key]: value }))
  }

  useEffect(() => {
    console.log(url)
    setCurrentPage(1)
    refetch()
  }, [
    debouncedQueryName,
    debouncedQueryCategory,
    debouncedQueryStartDate,
    debouncedQueryActive,
    refetch,
  ])

  return (
    <>
      <Head>Meus Eventos</Head>

      <AdminLayout>
        <div className={styles.content}>
          <h2>Meus Eventos</h2>

          <div className={styles.filters}>
            <Input placeholder='Nome' onChange={(e) => handleSearchQuery('name', e.target.value)} />
            <Select 
              placeholder="Categoria" 
              options={formattedCategories}
              onChangeSelect={(option) => handleSearchQuery('categoryId', String(option))}
              />
            <Input 
              placeholder='Data de Início' 
              onChange={(e) => handleSearchQuery('startDate', e.target.value)}  
              />
            <Select 
              placeholder="Ativo" 
              options={[{ key: 1, value: "Sim" }, { key: 0, value: 'Não'}]}
              onChangeSelect={(option) => handleSearchQuery('active', String(option))}
              />
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
                <th>Ativo</th> 
                <th></th>
              </tr>
            </thead>
            <tbody>
              {
                data?.content?.map((event: Event) => (
                  <tr key={event.id}>
                    <td>{event.id}</td>
                    <td>{event.name}</td>
                    <td>{getCategoryName(event.category_id)}</td>
                    <td>{event.capacity}</td>
                    <td>{formatDate(event.start_date)}</td>
                    <td>{formatDate(event.created_at)}</td>
                    <td>{event.active ? "Sim" : "Não"}</td>
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
          
          <div className={styles.pagination}>
            <Pagination
              totalPages={data?.totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
            </div>
        </div>

      </AdminLayout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const eventData = await api.get('/event')
  const categoryData = await api.get('/event/categories')

  return {
    props: {
        events: eventData.data,
        categories: categoryData.data,  
    }
  }
}