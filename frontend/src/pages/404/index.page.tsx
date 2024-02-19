import Link from "next/link";
import styles from "./styles.module.scss"
import Head from "next/head";
import { Header } from "@/components/Header";

export default function NotFound() {
    return (
        <>
            <Head>
                <title>404 - Golden Eventos</title>
            </Head>


            <Header />
            <main className={styles.container}>
                <div>
                    <h1>404</h1>
                    <p>Oops... parece que esta rota não foi encontrada</p>
                    <Link href="/">Voltar para o inicio</Link>
                </div>
                
                <img src="/images/20.svg" alt="" />

            </main>
        </>
    )
}