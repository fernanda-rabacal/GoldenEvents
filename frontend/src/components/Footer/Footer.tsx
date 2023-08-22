'use client'
import { InstagramLogo, LinkedinLogo, WhatsappLogo } from "phosphor-react";
import styles from "./footer.module.scss"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return(
    <footer className={styles.footerContainer}>
      <div className={styles.footerContent}>
        <div>
          <div className={styles.about}>
            <img src="/images/logo.svg" />

            <p>Golden is a Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex ea mollitia quisquam commodi molestias sapiente corporis quasi ipsa iste, sequi officia officiis possimus hic beatae delectus rem accusamus quia! Impedit!</p>
            <div>
              <a href="">
                <InstagramLogo size={32}/>
              </a>
              <a href="">
                <WhatsappLogo size={32}/>
              </a>
              <a href="">
                <LinkedinLogo size={32}/>
              </a>
            </div>
          </div>

          <div className={styles.navigations}>
            <nav>
              <h4>Planeje eventos</h4>
              <ul>
                <li>Crie e organize</li>
                <li>Venda tickets</li>
                <li>Eventos online</li>
              </ul>
            </nav>
            <nav>
              <h4>Golden Eventos</h4>
              <ul>
                <li>Sobre nós</li>
                <li>Imprensa</li>
                <li>Contate-nos</li>
                <li>Central de ajuda</li>
                <li>Como funciona</li>
                <li>Privacidade</li>
                <li>Termos e condições</li>
              </ul>
            </nav>
          </div>

          <div className={styles.newsletter}>
            <h4>Mantenha-se informado</h4>
            <p>Participe da nossa newsletter e fique informado sobre oos nossos eventos mais recentes</p>
            <div>
              <input />
              <button>Inscreva-se</button>
            </div>
          </div>
        </div>
        <p> &copy; Golden eventos, {currentYear}. Todos os direitos reservados</p>
      </div>
    </footer>
  )
}