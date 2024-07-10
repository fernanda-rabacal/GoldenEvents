import styles from './styles.module.scss';
import Head from "next/head";

import { AdminLayout } from "@/layouts/AdminLayout";
import { GetStaticProps } from 'next';
import { api } from '@/lib/axios';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useQueryData } from '@/hooks/apiHooks';
import { toastNotify } from '@/lib/toastify';
import { formatDate } from '@/utils/format_date';
import { Pagination } from '@/components/Pagination';
import { formatMoney } from '@/utils/format_money';
import { Button } from '@/components/Button';

export default function MyTickets() {
  const [currentPage, setCurrentPage] = useState(1)
  const { user } = useAuth();

  const url = `/user/tickets/${user?.id}?take=10&skip=${currentPage - 1}`

  const { data, isLoading, isError, refetch } = useQueryData(url);

  if (isError) {
    toastNotify('error', "Não foi possivel captar seus ingressos")
  }

  function handleCancelTicket(ticketId: number) {

  }

  useEffect(() => {
    refetch()
  }, [user])

  return (
    <>
      <Head>Minhas compras</Head>

      <AdminLayout>
        <div className={styles.content}>
          <h2>Minhas compras</h2>

          <table>
            <thead>
              <tr>
                <th>Nome do evento</th>
                <th>Categoria</th>
                <th>Início</th>
                <th>Término</th> 
                <th>Quantidade</th> 
                <th>Preço</th> 
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.content.map((ticket: any) => (
                <tr key={ticket.id}>
                  <td>{ticket.event.name}</td>
                  <td>{ticket.category}</td>
                  <td>{formatDate(ticket.event.start_date)}</td>
                  <td>{formatDate(ticket.event.created_at)}</td>
                  <td>{ticket.quantity}</td>
                  <td>{formatMoney(ticket.price)}</td>
                  <td>
                      <Button onClick={() => handleCancelTicket(ticket.id)}>
                        Cancelar
                      </Button>
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
