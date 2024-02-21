import Link from "next/link";
import styles from "./styles.module.scss"
import Head from "next/head";
import { useRouter } from "next/router";

export default function NotFound() {
    const router = useRouter()
    const finalSlashIndex = router.asPath.lastIndexOf('/')
    const previousPath = router.asPath.slice(0, finalSlashIndex)

    return (
        <>
            <Head>
                <title>404 - Golden Eventos</title>
            </Head>

            <main className={styles.container}>
                <div>
                    <h1>404</h1>
                    <p>Oops... parece que esta rota não foi encontrada</p>
                    <Link href={previousPath} >Voltar para o inicio</Link>
                </div>
                
                <img src="/images/20.svg" alt="" />
            </main>
        </>
    )
}