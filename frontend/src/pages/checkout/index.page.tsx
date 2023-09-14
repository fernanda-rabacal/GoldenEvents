import styles from './styles.module.scss'
import Head from 'next/head'
import { useCart } from '@/hooks/useCart'
import { formatDate } from '@/utils/format_date'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { formatMoney } from '@/utils/format_money'
import { QuantityInput } from '@/components/QuantityInput'
import { Header } from '@/components/Header'
import { CreditCardForm } from './components/CreditCardForm'

export default function Checkout() {
    const router = useRouter()
    const { event, changeEventQuantity } = useCart()

    if(!event) {
        return <></>
    }

    const eventDate = formatDate(event.start_date)
    const eventPrice = formatMoney(event.price * event.quantity)
    const tax = formatMoney(event.price * 0.1 * event.quantity)
    const totalCost = formatMoney(event.price * 1.1 * event.quantity)

    const handleIncrease = () => {
        changeEventQuantity("increase")
      }
    
    const handleDecrease = () => {
        changeEventQuantity("decrease")
    }

    useEffect(() => {
        if(!event) {
            router.push('/')
        }
    }, [])

    return (
        <>
            <Head>
                <title>Checkout - Golden Eventos</title>
            </Head>
            <Header />
            
            <main className={styles.container}>

                <section className={styles.selectedTicket}>
                    <h1>Resumo da compra</h1>

                    <div className={styles.eventInfos}>
                        <div>
                            <h2>{event.name}</h2>
                            <p>{eventDate}</p>
                        </div>
                        <div>
                            <span>Quantidade</span>
                            <QuantityInput 
                                onIncrease={handleIncrease}
                                onDecrease={handleDecrease}
                                quantity={event.quantity}
                            />
                        </div>
                    </div>

                    <div className={styles.priceInfos}>
                        <div>
                            <h4>Valor</h4>
                            <h4>+ Taxa</h4>
                        </div>
                        <div>
                            <span>R$ {eventPrice}</span>
                            <span>R$ {tax}</span>
                        </div>
                    </div>

                    <div className={styles.finishBuyingTicket}>
                        <h2>Total</h2>
                        <div>
                            <strong>R$ {totalCost}</strong>
                            <span style={{color: "#00b60d"}}>
                                <b>Pague em até 6x</b>
                            </span>
                        </div>
                    </div>

                    <div className={styles.actionButtons}> 
                        <button className={styles.cancelBuyingButton}>Cancelar</button>
                        <button className={styles.buyTicketButton}>Comprar</button>
                    </div>
                </section>

                <section className={styles.paymentMethods}>
                    <h2>Escolha sua forma de pagamento</h2>

                    <form>
                        <div className={styles.paymentTypes}>
                            <div>
                                <input type='radio' name=''/>
                                <label>Pix</label>
                            </div>
                            <div>
                                <input type='radio' name=''/>
                                <label>Crédito</label>
                            </div>
                            <div>
                                <input type='radio' name=''/>
                                <label>Boleto</label>
                            </div>
                        </div>

                        <CreditCardForm />
                    </form>
                </section>
            </main>
        </>
    )
}