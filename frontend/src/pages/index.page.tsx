import styles from "./styles.module.scss"
import Head from "next/head"
import { Calendar, CheckCircle, ClipboardText, MagnifyingGlass } from "phosphor-react"
import { Input } from "@/components/Input"
import { EventCard } from "@/components/EventCard"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer/Footer"
import { GetStaticProps } from "next"
import { api } from "@/lib/axios"
import { Event } from "@/@types/interfaces"
import { useEffect, useState } from "react"
import { EventCategoryDisplay } from "@/components/EventCategoryDisplay"
import { ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css';

interface PageProps {
    events: Event[],
    categories: {
        id: string;
        name: string;
        photo: string;
    }[]
}

export default function Home( { events, categories } : PageProps) {
    const [offset, setOffset] = useState(6)
    const [filteredEvents, setFilteredEvents] = useState(events)
    const [search, setSearch] = useState("")

    const handleLoadMoreEvents = () => {
        
      //  setFilteredEvents(filteredEvents)
        setOffset(prevState => prevState + 6)
    }

    const filterEvents = () => {
        let updatedEvents : Event[] = []

        updatedEvents = events.filter((event : Event) => {
            if(search) {
                const name = event.name.toLowerCase()
    
                return name.includes(search.toLowerCase())
            }

            return event
        })
        
        updatedEvents = updatedEvents.filter((_ : any, index: number) => index < offset)

        setFilteredEvents(updatedEvents)
    }

    /* const filterPerQuantity = (_ : any, index: number) => {
        return index < offset
    }

    const filterPerSearch = (event : Event) => {
        const name = event.name.toLowerCase()

        return name.includes(search.toLowerCase())
    } */

    useEffect(() => {
        filterEvents()
    }, [search, offset])

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
                    <Input  
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
                    {filteredEvents?.map(event => {
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
    const eventData = await api.get("/events")
    const categoryData = await api.get("/events/categories")

    return {
      props: {
        events: eventData.data.events ? eventData.data.events : [],
        categories: categoryData.data.categories ? categoryData.data.categories : [], 
      },
      revalidate: 60 * 60 
    }
  }
  