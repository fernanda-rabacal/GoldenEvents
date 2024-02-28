import styles from './styles.module.scss'
import Head from 'next/head'
import { useCart } from '@/hooks/useCart'
import { formatDateExtensive } from '@/utils/format_date'
import { ChangeEvent, useState } from 'react'
import { useRouter } from 'next/router'
import { formatMoney } from '@/utils/format_money'
import { QuantityInput } from '@/components/QuantityInput'
import { Header } from '@/components/Header'
import { CreditCardForm } from './components/CreditCardForm'
import { BilletForm } from './components/BilletForm'
import { PixForm } from './components/PixForm'
import { api } from '@/lib/axios'
import { toastNotify } from '@/lib/toastify'
import { parseCookies } from 'nookies'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
import { useMutationData } from '@/hooks/apiHooks'
import { useAuth } from '@/hooks/useAuth'


export default function Checkout() {
    const [paymentMethod, setPaymentMethod] = useState(3)
    const router = useRouter()
    const { event, changeEventQuantity } = useCart()
    const { user } = useAuth()
    
    const { mutate: buyTicket, isLoading } = useMutationData(`/event/${event!.id}/buy-ticket`,
        'post',
        data => {
            toastNotify("success", data.message || "Compra realizada com sucesso!")
            router.push("/")
        },
        error => {
            toastNotify("error", error.response.data.message)
        }
    )

    const eventDate = formatDateExtensive(event!.start_date)
    const eventPrice = formatMoney(event!.price * event!.quantity)
    const tax = formatMoney(event!.price * 0.1 * event!.quantity)
    const totalCost = formatMoney(event!.price * 1.1 * event!.quantity)


    const handleIncrease = () => {
        changeEventQuantity("increase")
    }
    
    const handleDecrease = () => {
        changeEventQuantity("decrease")
    }

    const handleOptionChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPaymentMethod(Number(e.target.value))
    }

    const handleBuyTicket = async () => {
        const ticketInfos = {
            quantity: event!.quantity,
            paymentMethodId: paymentMethod,
            eventId: event!.id,
        }

        buyTicket(ticketInfos)
    }

    const handleCancelOperation = () => {
        router.push("/")
    }

    return (
        <>
            <Head>
                <title>Checkout - Golden Eventos</title>
            </Head>
            <ToastContainer />
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
                                    value="3"
                                    name='payment_option'
                                    checked={paymentMethod === 3}
                                    onChange={handleOptionChange}
                                    />
                                <label htmlFor='credit'>Crédito</label>
                            </div>
                            <div>
                                <input 
                                    type='radio' 
                                    id="pix"
                                    value="2"
                                    name='payment_option'
                                    checked={paymentMethod === 2}
                                    onChange={handleOptionChange}
                                    />
                                <label htmlFor='pix'>Pix</label>
                            </div>
                            <div>
                                <input 
                                    type='radio' 
                                    id="billet"
                                    value="1"
                                    name='payment_option'
                                    checked={paymentMethod === 1}
                                    onChange={handleOptionChange}
                                    />
                                <label>Boleto</label>
                            </div>
                        </div>
                        {paymentMethod === 3 ?
                            <CreditCardForm />
                            :
                        paymentMethod === 1 ?
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
                            <h2>{event?.name}</h2>
                            <p>{eventDate}</p>
                        </div>
                        <div>
                            <span>Quantidade</span>
                            <QuantityInput 
                                onIncrease={handleIncrease}
                                onDecrease={handleDecrease}
                                quantity={event?.quantity || 1}
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
                        <button onClick={handleCancelOperation} className={styles.cancelBuyingButton}>Cancelar</button>
                        <button onClick={handleBuyTicket} className={styles.buyTicketButton}>Comprar</button>
                    </div>
                </section>
            </main>
        </>
    )
}

