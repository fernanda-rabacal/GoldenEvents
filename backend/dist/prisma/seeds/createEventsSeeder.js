"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEvents = void 0;
async function createEvents(prisma) {
    await prisma.event.createMany({
        data: [
            {
                name: 'XI Caminhada Anual nas Montanhas',
                slug: 'xi-caminhada-anual-nas-montanhas',
                photo: 'https://www.atletasdobem.com.br/wp-content/uploads/2022/06/voce-esta-pronto-para-fazer-um-evento-de-caminhada.1200x800-1024x683.jpg',
                description: `Nossa caminhada começa com uma saudação calorosa ao ar livre, onde os participantes se reúnem para se preparar para a jornada à frente. Equipados com calçados confortáveis e disposição para explorar, partiremos em uma jornada que nos levará por trilhas serenas, através de bosques exuberantes e ao longo de riachos tranquilos.

        Durante o percurso, nossos guias especializados compartilharão conhecimentos sobre a flora e fauna locais, destacando pontos de interesse e fornecendo informações sobre a história natural da área. Os participantes terão a oportunidade de fotografar a beleza natural ao redor, capturando momentos inesquecíveis ao longo do caminho.
        
        Para tornar a experiência ainda mais memorável, faremos pausas estratégicas para desfrutar de lanches saudáveis e refrescantes, garantindo que todos estejam energizados para continuar explorando. Além disso, incentivamos a interação entre os participantes, promovendo um senso de comunidade e camaradagem durante toda a caminhada.
        
        À medida que nos aproximamos do final da jornada, seremos recebidos com uma sensação de realização e satisfação, tendo explorado os tesouros naturais de nossa região. Ao concluir a caminhada, os participantes terão a oportunidade de compartilhar suas experiências e reflexões, criando memórias duradouras e laços com a natureza e com os outros participantes.
        
        Não perca esta oportunidade de se reconectar com a natureza e desfrutar de uma jornada revigorante durante nossa Caminhada da Natureza. Junte-se a nós para uma experiência única e enriquecedora que certamente deixará uma impressão duradoura em sua mente e em seu coração.`,
                start_date: new Date('2024-02-02T12:00:00'),
                user_id: 1,
                category_id: 7,
                capacity: 300,
                quantity_left: 300,
                price: 0,
                location: 'Praça do Papa, Belo Horizonte - MG',
            },
            {
                name: 'TechXperience: Explorando o Futuro da Inteligência Artificial',
                slug: 'techxperience-explorando-o-futuro-da-inteligencia-artificial',
                photo: 'https://s3.amazonaws.com/assets.dotlib.com/public/images/os-tres-estagios-da-ia-inteligencia-artificial-geral.png',
                description: `Bem-vindo ao emocionante mundo da Inteligência Artificial (IA)! Este evento é uma oportunidade única para explorar os avanços mais recentes, as aplicações inovadoras e as tendências futuras no campo da IA.

        Durante este evento, os participantes terão a chance de mergulhar fundo no fascinante universo da IA, com palestras de especialistas renomados, demonstrações práticas e discussões interativas. Desde os fundamentos teóricos até as aplicações práticas, cobriremos uma ampla gama de tópicos, incluindo aprendizado de máquina, redes neurais, processamento de linguagem natural, visão computacional e muito mais.
        
        Nossos palestrantes líderes da indústria compartilharão insights valiosos sobre como as empresas estão utilizando a IA para impulsionar a inovação, otimizar processos, melhorar a experiência do cliente e criar soluções inteligentes para desafios complexos. Os participantes terão a oportunidade de aprender com casos de uso reais, estudos de caso inspiradores e exemplos práticos de implementação bem-sucedida de IA em diversos setores.
        
        Além das palestras informativas, o evento contará com sessões práticas, workshops práticos e demonstrações ao vivo, permitindo que os participantes aprimorem suas habilidades técnicas, explorem ferramentas e tecnologias de IA de ponta e interajam com especialistas do setor. Os participantes também terão a chance de se conectar com outros profissionais de IA, compartilhar ideias, trocar experiências e expandir suas redes de contatos.
        
        Não importa se você é um iniciante curioso, um profissional experiente ou um entusiasta da tecnologia, este evento é projetado para inspirar, educar e capacitar todos os interessados em IA. Junte-se a nós para uma jornada emocionante rumo ao futuro da inteligência artificial!
        
        ### Tópicos principais a serem abordados:
        
        - Fundamentos da Inteligência Artificial
        - Aprendizado de Máquina e Redes Neurais
        - Processamento de Linguagem Natural
        - Visão Computacional
        - Aplicações Práticas de IA em diversos setores
        - Ética e Responsabilidade na IA
        - Tendências Futuras em IA`,
                start_date: new Date('2024-02-02T18:30:00'),
                user_id: 1,
                category_id: 12,
                capacity: 200,
                quantity_left: 200,
                price: 50.0,
                location: 'Av. Pinto de Aguiar, Salvador - BA',
            },
            {
                name: 'Sabor & Sabedoria: Uma Jornada Gastronômica',
                slug: 'sabor-e-sabedoria-uma-jornada-gastronomica',
                photo: 'https://img.imageboss.me/revista-cdn/cdn/25022/102ffafb377c109835894e3abc086702237091ea.jpg?1573769704',
                description: `Bem-vindo a uma experiência única para os amantes da gastronomia! O evento "Sabor & Sabedoria: Uma Jornada Gastronômica" é uma celebração da culinária, cultura e criatividade culinária.

        Durante este evento emocionante, os participantes terão a oportunidade de explorar uma variedade de pratos deliciosos, saborear iguarias locais e descobrir segredos culinários com chefs renomados.
        
        Desde demonstrações de culinária ao vivo até workshops práticos, degustações e experiências interativas, haverá algo para todos os paladares e interesses gastronômicos.
        
        Além de desfrutar de uma ampla variedade de alimentos e bebidas, os participantes também terão a chance de aprender sobre a história da gastronomia local, técnicas de preparo de alimentos, combinações de sabores e muito mais.
        
        Junte-se a nós nesta jornada gastronômica inesquecível, onde cada prato conta uma história e cada sabor desperta novas sensações. Prepare-se para uma experiência culinária que estimulará todos os seus sentidos e deixará uma impressão duradoura em seu paladar.`,
                start_date: new Date('2024-03-17T09:00:00'),
                user_id: 1,
                category_id: 8,
                capacity: 200,
                quantity_left: 200,
                price: 65.0,
                location: 'Av. Pinto de Aguiar, Salvador - BA',
            },
            {
                name: 'Sunset Paradise',
                slug: 'sunset-paradise',
                photo: 'https://www.eletromusica.com.br/wp-content/uploads/2014/08/O-QUE-SAO-SUNSET-PARTIES.jpg',
                description: `Sobre o Evento:

        Prepare-se para uma experiência de festa como nenhuma outra! O "Sunset Paradise" vai te fazer vibrar com uma mistura explosiva de batidas contagiantes, drinks gelados e uma energia contagiante que vai te manter dançando até o amanhecer.
        
        Line-up de DJs:
        
        DJ Summer Splash: Eletrizando a pista de dança com seus hits de verão e remixes exclusivos, DJ Summer Splash vai fazer você se sentir como se estivesse em um festival de música à beira-mar.
        
        DJ Sandy Beats: Com seu estilo único e uma seleção de músicas que vão desde o house até o funk, DJ Sandy Beats vai transformar a areia em uma pista de dança quente e pulsante.
        
        DJ Wave Rider: Com sua vibe relaxada e batidas relaxantes, DJ Wave Rider vai te levar em uma jornada musical através das ondas do oceano, criando a trilha sonora perfeita para uma noite sob as estrelas.
        
        Atividades:
        
        Além da incrível música dos nossos DJs, o "Sunset Paradise" também oferece uma variedade de atividades para garantir que a diversão nunca pare. Desde jogos de vôlei de praia até competições de dança, há algo para todos os gostos e estilos.
        
        Ingressos:
        
        Garanta o seu ingresso antecipado para garantir seu lugar nesta festa épica! Os ingressos estão disponíveis online e também serão vendidos na entrada do evento, sujeitos à disponibilidade.
        
        Não perca a chance de fazer parte do "Sunset Paradise" e criar memórias que durarão para sempre. Junte-se a nós para uma noite de festa, diversão e celebração na praia mais badalada do verão!`,
                start_date: new Date('2024-03-24T16:00:00'),
                end_date: new Date('2024-03-24T22:00:00'),
                user_id: 1,
                category_id: 10,
                capacity: 350,
                quantity_left: 350,
                price: 120.0,
                location: 'Av. Pinto de Aguiar, Salvador - BA',
            },
            {
                name: 'Risos em Cena: Noites de Stand Up Comedy',
                slug: 'risos-em-cena-noites-de-stand-up-comedy',
                photo: 'https://offloadmedia.feverup.com/saopaulosecreto.com/wp-content/uploads/2020/12/07051648/bogomil-mihaylov-ekHSHvgr27k-unsplash-1024x683.jpg',
                description: `Prepare-se para uma noite repleta de risadas e entretenimento com o evento "Risos em Cena: Noites de Stand Up Comedy". Esta é a oportunidade perfeita para dar boas gargalhadas e desfrutar de apresentações hilárias de alguns dos melhores comediantes locais.

        Neste evento eletrizante, os participantes serão transportados para o mundo da comédia stand up, onde talentosos comediantes irão se revezar no palco, apresentando seus melhores números, piadas e observações humorísticas sobre a vida, o cotidiano e as peculiaridades da sociedade.
        
        De humor inteligente a humor irreverente, cada performance promete arrancar risos e garantir uma noite memorável para todos os presentes. Com uma variedade de estilos e temas, há algo para todos os gostos e senso de humor.
        
        Então junte-se a nós para uma noite de diversão e risadas ininterruptas. Traga seus amigos, relaxe e prepare-se para uma experiência de comédia que deixará seu rosto dolorido de tanto rir!`,
                start_date: new Date('2024-03-10T21:00:00'),
                user_id: 1,
                category_id: 10,
                capacity: 100,
                quantity_left: 100,
                price: 85.0,
                location: 'Av. Pinto de Aguiar, Salvador - BA',
            },
        ],
    });
}
exports.createEvents = createEvents;
//# sourceMappingURL=createEventsSeeder.js.map