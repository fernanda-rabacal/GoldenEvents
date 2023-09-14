import styles from "./styles.module.scss"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { FormInput } from "../FormInput"
import { useCart } from "@/hooks/useCart"
import { formatMoney } from "@/utils/format_money"

interface InstalmentsProps {
    value: number;
    fees: number
}

export function CreditCardForm() {
    const { event } = useCart()
    
    const [selectedMonth, setSelectedMonth] = useState(1)
    const [daysInMonth, setDayInMonth] = useState<number[]>([])
    const [installmentsOptions, setInstallmentsOptions] = useState<InstalmentsProps[]>(() => {
        return calculateInstallmentOptions()
    })

    const months = Array.from({ length: 12 }).map((_, index) => index + 1)


    function calculateInstallmentOptions() {
        const options = Array.from({ length: 6 }).map((_, index) => {
            const tax = event!.price * 0.1 
            const total = ((event!.price + tax) * event!.quantity)
            const installmentValue = total / (index + 1)
            
            const fees = index > 0 ? installmentValue * 0.015 * index + 1 : 0

            return { value: installmentValue, fees}
        })

        return options
    }


    useEffect(() => {
        setInstallmentsOptions(calculateInstallmentOptions())
    }, [event!.quantity])

    useEffect(() => {
        const days = Array.from({
            length: dayjs().month(selectedMonth - 1).daysInMonth()
        }).map((_, index) => index + 1)

        setDayInMonth(days)
    }, [selectedMonth])

    return (
        <div className={styles.container}>
            <div className={styles.installmentOptionsContainer}>
                <label htmlFor="installment_options">Quantidade de parcelas: </label>
                <select id="installment_options">
                    {installmentsOptions.map((installment, index) => {
                        const total = installment.value + installment.fees

                        const formattedPrice = formatMoney(total)

                        return (
                            <option key={installment.value} value={total}>
                                { index + 1 }X de  R$ {formattedPrice}
                            </option>
                        )})}
                </select>
            </div>

            <div>
                <label htmlFor="credit_card_number">Numero do Cartão</label>
                <FormInput type="number" id="credit_card_number" placeholder="0000 0000 0000 0000"/>
            </div>
            <div>
                <label htmlFor="titular_name">Nome do titular</label>
                <FormInput type="text" id="titular_name" />
            </div>

            <div className={styles.creditCardInfos}>
                <div>
                    <label id="credit_card_expiration">Data de expiração</label>

                    <div className={styles.selectsContainer}>
                        <select aria-labelledby="credit_card_expiration">
                            {daysInMonth.map(day => <option key={day} value={day}>{day}</option>)}
                        </select>
                        /
                        <select 
                            aria-labelledby="credit_card_expiration" 
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                            {months.map(month => <option key={month} value={month}>{month}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="CVV">CVV</label>
                    <FormInput type="number" id="CVV"/>
                </div>
            </div>
        </div>
    )
}