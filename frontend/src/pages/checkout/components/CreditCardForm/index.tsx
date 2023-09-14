import styles from "./styles.module.scss"
import dayjs from "dayjs"
import { useEffect, useState } from "react"

export function CreditCardForm() {
    const [selectedMonth, setSelectedMonth] = useState(1)
    const [daysInMonth, setDayInMonth] = useState<number[]>([])

    const months = Array.from({ length: 12 }).map((_, index) => index + 1)

    useEffect(() => {
        const days = Array.from({
            length: dayjs().month(selectedMonth - 1).daysInMonth()
        }).map((_, index) => index + 1)

        setDayInMonth(days)
    }, [selectedMonth])

    return (
        <>
            <div className={styles.container}>
                <div>
                    <label htmlFor="credit_card_number">Numero do Cartão</label>
                    <input type="number" id="credit_card_number" placeholder="0000 0000 0000 0000"/>
                </div>
                <div>
                    <label htmlFor="titular_name">Nome do titular</label>
                    <input type="text" id="titular_name"/>
                </div>

                <div className={styles.creditCardInfos}>
                    <div>
                        <label id="credit_card_expiration">Data de expiração</label>

                        <div className={styles.selectsContainer}>
                            <select aria-labelledby="credit_card_expiration">
                                {daysInMonth.map(day => <option value={day}>{day}</option>)}
                            </select>
                            /
                            <select 
                                aria-labelledby="credit_card_expiration" 
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            >
                                {months.map(month => <option value={month}>{month}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="CVV">CVV</label>
                        <input type="number" id="CVV"/>
                    </div>
                </div>
            </div>
        </>
    )
}