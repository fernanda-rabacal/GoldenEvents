import styles from './styles.module.scss'

export function PixForm() {
    return (
        <div className={styles.container}>
            <h1>Leia este QR code com o aplicativo do seu banco</h1>
            <img src='/images/qr_code.jpg' />
        </div>
    )
}