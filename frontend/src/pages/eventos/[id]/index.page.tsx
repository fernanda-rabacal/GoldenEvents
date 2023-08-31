import styles from './styles.module.scss'
import { GetStaticPaths, GetStaticProps } from 'next'
import { Event } from '@/@types/interfaces'
import { api } from '@/lib/axios'
import Head from 'next/head'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer/Footer'
import { Button } from '@/components/Button'
import { CaretLeft, Clock } from 'phosphor-react'
import { formatDate } from '@/utils/format_date'
import Link from 'next/link'

interface PageProps {
  event: Event
}

export default function EventDetails({ event }: PageProps) {
  const date = formatDate(event.start_date)

  return (
    <>
      <Head>
        <title>{event.name} | Eventos</title>
      </Head>
      <main>
        <Header />


        <section className={styles.container}>
          <Link href="/" className={styles.goBackButton}>
            <CaretLeft />
            Voltar
            </Link>

          <img src={event.photo} />

          <div className={styles.eventDetails}>
            <div className={styles.titleAndDay}>
              <h1>{event.name}</h1>
              <time>
                <Clock />
                {date}
              </time>
              <p>{event.description}</p>
            </div>

            <aside className={styles.buyTicket}>
                <span>Ingressos por <strong>R$ 35,00</strong> /pessoa</span>

                <div>
                  <input type='number' />
                  <button>Reservar</button>
                </div>
              </aside>
          </div>

        </section>
      </main>

      <Footer />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {

  return {
    paths: [],
    fallback: 'blocking'
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const data = await api.get(`/events/${params?.id}`)

  console.log(data)

  return {
    props: {
      event: data.data.event
    },
    revalidate: 60 * 60
  }
}

