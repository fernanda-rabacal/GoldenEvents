import styles from './styles.module.scss'
import Head from 'next/head'
import { useCart } from '@/hooks/useCart'
import { formatDate } from '@/utils/format_date'
import { ChangeEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { formatMoney } from '@/utils/format_money'
import { QuantityInput } from '@/components/QuantityInput'
import { Header } from '@/components/Header'
import { CreditCardForm } from './components/CreditCardForm'
import { BilletForm } from './components/BilletForm'
import { PixForm } from './components/PixForm'


export default function Checkout() {
    const [paymentMethod, setPaymentMethod] = useState("credit")
    const router = useRouter()
    const { event, changeEventQuantity } = useCart()
    
    useEffect(() => {
        if(!event) {
            router.push('/')
        }
    }, [])
    
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

    const handleOptionChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPaymentMethod(e.target.value)
    }


    return (
        <>
            <Head>
                <title>Checkout - Golden Eventos</title>
            </Head>
            <Header />
            
            <main className={styles.container}>
                <section className={styles.paymentMethods}>
                    <h2>Escolha sua forma de pagamento</h2>

                    <form>
                        <div className={styles.paymentTypes}>
                            <div>
                                <input 
                                    type='radio' 
                                    id='credit'
                                    value="credit"
                                    name='payment_option'
                                    checked={paymentMethod === "credit"}
                                    onChange={handleOptionChange}
                                    />
                                <label htmlFor='credit'>Crédito</label>
                            </div>
                            <div>
                                <input 
                                    type='radio' 
                                    id="pix"
                                    value="pix"
                                    name='payment_option'
                                    checked={paymentMethod === "pix"}
                                    onChange={handleOptionChange}
                                    />
                                <label htmlFor='pix'>Pix</label>
                            </div>
                            <div>
                                <input 
                                    type='radio' 
                                    id="billet"
                                    value="billet"
                                    name='payment_option'
                                    checked={paymentMethod === "billet"}
                                    onChange={handleOptionChange}
                                    />
                                <label>Boleto</label>
                            </div>
                        </div>
                        {
                            paymentMethod === "credit" ?
                                <CreditCardForm />
                                :
                            paymentMethod === "billet" ?
                                <BilletForm /> 
                                :
                                <PixForm />
                        }
                    </form>
                </section>

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
                        <strong>Total</strong>
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
            </main>
        </>
    )
}