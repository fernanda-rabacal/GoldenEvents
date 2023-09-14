import Link from 'next/link'
import Head from 'next/head'
import { GetStaticPaths, GetStaticProps } from 'next'
import { Event } from '@/@types/interfaces'
import { api } from '@/lib/axios'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer/Footer'
import { CaretLeft, Clock } from 'phosphor-react'
import { formatDate } from '@/utils/format_date'
import { useRouter } from 'next/router'
import { formatMoney } from '@/utils/format_money'
import { useCart } from '@/hooks/useCart'
import { useState } from 'react'
import styles from './styles.module.scss'
import { QuantityInput } from '@/components/QuantityInput'

interface PageProps {
  event: Event
}

export default function EventDetails({ event }: PageProps) {
  const [quantity, setQuantity] = useState(1)
  const router = useRouter()

  const { addEventToCart } = useCart()

  const date = formatDate(event.start_date)
  const price = formatMoney(event.price)

  const handleNavigateToCheckout = () => {
    const eventToBuy = {
      ...event,
      quantity
    }

    addEventToCart(eventToBuy)

    router.push(`/checkout?id=${event.id}`)
  }

  function handleIncrease() {
    setQuantity((state) => state + 1);
  }

  function handleDecrease() {
    setQuantity((state) => state - 1);
  }

  return (
    <>
      <Head>
        <title>{event.name} | Eventos</title>
      </Head>
      
      <Header />

      <main>
        <section className={styles.container}>
          <Link href="/" className={styles.goBackButton}>
            <CaretLeft />
            Voltar
            </Link>

           
          <img src={event.photo} alt={`${event.name} poster`}/>

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
                <span>Ingressos por R$ <strong>{price}</strong> /pessoa</span>

                <div>
                  <QuantityInput 
                    onIncrease={handleIncrease}
                    onDecrease={handleDecrease}
                    quantity={quantity}
                  />
                  <button className={styles.buyButton} onClick={handleNavigateToCheckout}>Reservar</button>
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

