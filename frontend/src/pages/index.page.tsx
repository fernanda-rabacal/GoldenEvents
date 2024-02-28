import styles from "./styles.module.scss"
import Head from "next/head"
import { Calendar, CheckCircle, ClipboardText, MagnifyingGlass } from "phosphor-react"
import { Input } from "@/components/Input"
import { EventCard } from "@/components/EventCard"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer/Footer"
import { GetStaticProps } from "next"
import { api } from "@/lib/axios"
import { Event, EventCategory } from "@/@types/interfaces"
import { use, useEffect, useState } from "react"
import { EventCategoryDisplay } from "@/components/EventCategoryDisplay"
import { ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css';
import { useQueryData } from "@/hooks/apiHooks"

interface PageProps {
    categories: EventCategory[]
}

export default function Home({ categories } : PageProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [search, setSearch] = useState("")
    const [events, setEvents] = useState<Event[]>([])

    const now = new Date().toISOString()
    const url = `/event?take=6&skip=${currentPage - 1}&name=${search}`;

    const { data, isLoading } = useQueryData(url);

    const handleLoadMoreEvents = () => {
      setCurrentPage(prevState => prevState + 1)
    }

    useEffect(() => {
        if (data) {
            setEvents([...events, ...data?.content])
        }
    }, [currentPage, data])

  return (
    <>  
        <Head>
            <title>Golden Eventos</title>
        </Head>
        
        <main className={styles.pageContainer}>
            <Header />
            <ToastContainer />
            <section>
                <div className={styles.homeContent}>
                    <img src="/images/home_image.png" alt="" />
                    <h1>Descubra os próximos eventos</h1>
                    <p>E agende instantaneamente conosco</p>
                </div>
                <div className={styles.searchWrapper}>
                    <input  
                        type="search" 
                        placeholder="Encontre o evento que deseja.." 
                        onChange={(e) => setSearch(e.target.value)}
                        />
                    <MagnifyingGlass size={32} weight="bold" color="#fff" />
                </div>
            </section>

            <section className={styles.eventsSection} id="upcoming_events">
                <h2>Próximos eventos</h2>

                <div>
                    {events?.map((event: Event) => {
                        return (
                            <EventCard 
                                key={event.id}
                                id={event.id}
                                slug={event.slug}
                                name={event.name}
                                description={event.description}
                                photo={event.photo}
                                start_date={event.start_date}
                            />
                        )
                    })}
                </div>

                <button onClick={handleLoadMoreEvents}>Carregar Mais</button>
            </section>
            <section className={styles.contactSection}>
                <img src="/images/make_events.png" alt=""/>

                <div>  
                    <h4>Faça seu próprio evento</h4>
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quidem ratione hic, tenetur rem sed atque. Alias, delectus atque minus culpa dolor nihil corporis, et eius iure deleniti unde tenetur odit.
                    </p>

                    <button>Criar eventos</button>
                </div>
            </section>

            <section className={styles.categoriesSection}>
                <h2>Explore as categorias</h2>

                <div className="categories">
                    {categories?.map(category => {
                        return (
                            <EventCategoryDisplay
                                key={category.id} 
                                name={category.name}
                                photo={category.photo}
                                />
                        )
                    })}
                </div>
            </section>

            <section className={styles.advantagesSection}>
                <h2>Faça memórias com a Golden Eventos</h2>

                <div>
                    <div>
                        <Calendar />
                        <p>Encontre uma grande variedade de eventos</p>
                    </div>
                    <div>
                        <ClipboardText />
                        <p>Organize seus eventos com  mais confiança</p>
                    </div>
                    <div>
                        <CheckCircle />
                        <p>Aproveite todas as vantagens do nosso site</p>
                    </div>
                </div>
            </section>
        </main>
        
        <Footer />
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
    const categoryData = await api.get("/event/categories")

    return {
      props: {
        categories: categoryData.data, 
      },
      revalidate: 60 * 60 
    }
  }
  