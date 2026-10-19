import { PrismaClient } from '@prisma/client';
import { summarizeLots } from '@golden-events/shared';

type SeedLot = {
  name: string;
  price: number;
  quantity: number;
  sales_start?: Date;
  sales_end?: Date;
};

type SeedSector = { name: string; lots: SeedLot[] };

function singleSector(price: number, quantity: number): SeedSector[] {
  return [{ name: 'Geral', lots: [{ name: 'Lote único', price, quantity }] }];
}

// Datas relativas ao dia do seed, para estes eventos sempre aparecerem como próximos
function daysFromNow(days: number, time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();

  date.setDate(date.getDate() + days);
  date.setHours(hours, minutes, 0, 0);

  return date;
}

// A descrição é markdown: a indentação do template string viraria bloco de código
function removeIndentation(text: string) {
  return text.replace(/^[ \t]+/gm, '');
}

export async function createEvents(prisma: PrismaClient) {
  const events = [
    {
      name: 'XI Caminhada Anual nas Montanhas',
      slug: 'xi-caminhada-anual-nas-montanhas',
      photo:
        'https://www.atletasdobem.com.br/wp-content/uploads/2022/06/voce-esta-pronto-para-fazer-um-evento-de-caminhada.1200x800-1024x683.jpg',
      description: `Nossa caminhada começa com uma saudação calorosa ao ar livre, onde os participantes se reúnem para se preparar para a jornada à frente. Equipados com calçados confortáveis e disposição para explorar, partiremos em uma jornada que nos levará por trilhas serenas, através de bosques exuberantes e ao longo de riachos tranquilos.

        Durante o percurso, nossos guias especializados compartilharão conhecimentos sobre a flora e fauna locais, destacando pontos de interesse e fornecendo informações sobre a história natural da área. Os participantes terão a oportunidade de fotografar a beleza natural ao redor, capturando momentos inesquecíveis ao longo do caminho.
        
        Para tornar a experiência ainda mais memorável, faremos pausas estratégicas para desfrutar de lanches saudáveis e refrescantes, garantindo que todos estejam energizados para continuar explorando. Além disso, incentivamos a interação entre os participantes, promovendo um senso de comunidade e camaradagem durante toda a caminhada.
        
        À medida que nos aproximamos do final da jornada, seremos recebidos com uma sensação de realização e satisfação, tendo explorado os tesouros naturais de nossa região. Ao concluir a caminhada, os participantes terão a oportunidade de compartilhar suas experiências e reflexões, criando memórias duradouras e laços com a natureza e com os outros participantes.
        
        Não perca esta oportunidade de se reconectar com a natureza e desfrutar de uma jornada revigorante durante nossa Caminhada da Natureza. Junte-se a nós para uma experiência única e enriquecedora que certamente deixará uma impressão duradoura em sua mente e em seu coração.`,
      start_date: new Date('2024-02-02T12:00:00'),
      user_id: 1,
      category_id: 7,
      sectors: singleSector(0, 300),
      location: 'Praça do Papa, Belo Horizonte - MG',
    },
    {
      name: 'TechXperience: Explorando o Futuro da Inteligência Artificial',
      slug: 'techxperience-explorando-o-futuro-da-inteligencia-artificial',
      photo:
        'https://s3.amazonaws.com/assets.dotlib.com/public/images/os-tres-estagios-da-ia-inteligencia-artificial-geral.png',
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
      sectors: singleSector(5000, 200),
      location: 'Av. Pinto de Aguiar, Salvador - BA',
    },
    {
      name: 'Sabor & Sabedoria: Uma Jornada Gastronômica',
      slug: 'sabor-e-sabedoria-uma-jornada-gastronomica',
      photo:
        'https://img.imageboss.me/revista-cdn/cdn/25022/102ffafb377c109835894e3abc086702237091ea.jpg?1573769704',
      description: `Bem-vindo a uma experiência única para os amantes da gastronomia! O evento "Sabor & Sabedoria: Uma Jornada Gastronômica" é uma celebração da culinária, cultura e criatividade culinária.

        Durante este evento emocionante, os participantes terão a oportunidade de explorar uma variedade de pratos deliciosos, saborear iguarias locais e descobrir segredos culinários com chefs renomados.
        
        Desde demonstrações de culinária ao vivo até workshops práticos, degustações e experiências interativas, haverá algo para todos os paladares e interesses gastronômicos.
        
        Além de desfrutar de uma ampla variedade de alimentos e bebidas, os participantes também terão a chance de aprender sobre a história da gastronomia local, técnicas de preparo de alimentos, combinações de sabores e muito mais.
        
        Junte-se a nós nesta jornada gastronômica inesquecível, onde cada prato conta uma história e cada sabor desperta novas sensações. Prepare-se para uma experiência culinária que estimulará todos os seus sentidos e deixará uma impressão duradoura em seu paladar.`,
      start_date: new Date('2024-03-17T09:00:00'),
      user_id: 1,
      category_id: 8,
      sectors: singleSector(6500, 200),
      location: 'Av. Pinto de Aguiar, Salvador - BA',
    },
    {
      name: 'Sunset Paradise',
      slug: 'sunset-paradise',
      photo:
        'https://www.eletromusica.com.br/wp-content/uploads/2014/08/O-QUE-SAO-SUNSET-PARTIES.jpg',
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
      sectors: [
        { name: 'Pista', lots: [{ name: 'Lote único', price: 12000, quantity: 300 }] },
        { name: 'Camarote', lots: [{ name: 'Lote único', price: 25000, quantity: 50 }] },
      ],
      location: 'Av. Pinto de Aguiar, Salvador - BA',
    },
    {
      name: 'Risos em Cena: Noites de Stand Up Comedy',
      slug: 'risos-em-cena-noites-de-stand-up-comedy',
      photo:
        'https://offloadmedia.feverup.com/saopaulosecreto.com/wp-content/uploads/2020/12/07051648/bogomil-mihaylov-ekHSHvgr27k-unsplash-1024x683.jpg',
      description: `Prepare-se para uma noite repleta de risadas e entretenimento com o evento "Risos em Cena: Noites de Stand Up Comedy". Esta é a oportunidade perfeita para dar boas gargalhadas e desfrutar de apresentações hilárias de alguns dos melhores comediantes locais.

        Neste evento eletrizante, os participantes serão transportados para o mundo da comédia stand up, onde talentosos comediantes irão se revezar no palco, apresentando seus melhores números, piadas e observações humorísticas sobre a vida, o cotidiano e as peculiaridades da sociedade.
        
        De humor inteligente a humor irreverente, cada performance promete arrancar risos e garantir uma noite memorável para todos os presentes. Com uma variedade de estilos e temas, há algo para todos os gostos e senso de humor.
        
        Então junte-se a nós para uma noite de diversão e risadas ininterruptas. Traga seus amigos, relaxe e prepare-se para uma experiência de comédia que deixará seu rosto dolorido de tanto rir!`,
      start_date: new Date('2024-03-10T21:00:00'),
      user_id: 1,
      category_id: 10,
      sectors: singleSector(8500, 100),
      location: 'Av. Pinto de Aguiar, Salvador - BA',
    },
    {
      name: 'Festival de Verão',
      subtitle:
        'Uma noite para celebrar a música, encontrar pessoas e viver Salvador de um jeito inesquecível.',
      slug: 'festival-de-verao',
      photo:
        'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=85',
      description: `Uma tarde e noite inteiras de música ao ar livre no Parque da Cidade. O Festival de Verão reúne bandas locais e atrações nacionais em dois palcos, com área de alimentação, espaço kids e pôr do sol garantido.

        Traga sua canga, chame os amigos e venha celebrar a estação mais quente do ano com muito som, dança e boas energias.`,
      start_date: daysFromNow(7, '18:00'),
      user_id: 1,
      category_id: 1,
      // O 1º lote da pista já encerrou as vendas: quem compra hoje cai no 2º
      sectors: [
        {
          name: 'Pista',
          lots: [
            {
              name: '1º lote',
              price: 4500,
              quantity: 500,
              sales_end: daysFromNow(-1, '23:59'),
            },
            { name: '2º lote', price: 6000, quantity: 1000 },
            { name: '3º lote', price: 7500, quantity: 300 },
          ],
        },
        {
          name: 'Camarote',
          lots: [{ name: 'Lote único', price: 18000, quantity: 200 }],
        },
      ],
      location: 'Parque da Cidade, Salvador - BA',
    },
    {
      name: 'Design & Coffee',
      subtitle:
        'Uma manhã de criatividade, prototipação e cafés especiais com designers convidados.',
      slug: 'design-e-coffee',
      photo:
        'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=85',
      description: `Um workshop prático para quem quer tirar ideias do papel. Durante a manhã, designers convidados conduzem exercícios de criatividade, prototipação e apresentação de projetos, tudo acompanhado de cafés especiais.

        As vagas são limitadas para garantir a troca entre os participantes. Leve seu notebook ou caderno de anotações.`,
      start_date: daysFromNow(13, '09:00'),
      user_id: 1,
      category_id: 6,
      sectors: singleSector(3000, 40),
      location: 'Casa Criativa, Salvador - BA',
    },
    {
      name: 'Noite de Stand-up',
      subtitle:
        'Quatro comediantes da nova geração do stand-up baiano em uma noite de muitas risadas.',
      slug: 'noite-de-stand-up',
      photo:
        'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=900&q=85',
      description: `Uma noite de humor com quatro comediantes da nova geração do stand-up baiano. Cada artista apresenta seu melhor material, com piadas sobre o cotidiano, a vida na cidade e situações que todo mundo já viveu.

        Classificação indicativa: 16 anos. Chegue cedo para garantir os melhores lugares.`,
      start_date: daysFromNow(22, '20:00'),
      user_id: 1,
      category_id: 10,
      // As mesas só abrem para venda daqui a alguns dias
      sectors: [
        { name: 'Plateia', lots: [{ name: 'Lote único', price: 2500, quantity: 400 }] },
        {
          name: 'Mesa VIP',
          lots: [
            {
              name: 'Lote único',
              price: 6000,
              quantity: 100,
              sales_start: daysFromNow(3, '10:00'),
            },
          ],
        },
      ],
      location: 'Teatro Castro Alves, Salvador - BA',
    },
    {
      name: 'Festival Sabores da Bahia',
      subtitle:
        'O melhor da culinária baiana reunido no Mercado Modelo, com entrada gratuita.',
      slug: 'festival-sabores-da-bahia',
      photo:
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=85',
      description: `O Mercado Modelo recebe chefs, quituteiras e produtores locais para um festival dedicado à culinária baiana. Acarajé, moqueca, cocadas e muito mais, com aulas abertas e apresentações culturais ao longo do dia.

        A entrada é gratuita e os pratos são vendidos diretamente pelos expositores.`,
      start_date: daysFromNow(28, '12:00'),
      user_id: 1,
      category_id: 8,
      sectors: singleSector(0, 1500),
      location: 'Mercado Modelo, Salvador - BA',
    },
    {
      name: 'Feira de Arte Independente',
      subtitle:
        'Exposições, ilustrações e arte autoral de artistas independentes no Solar do Unhão.',
      slug: 'feira-de-arte-independente',
      photo:
        'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=85',
      description: `Artistas independentes ocupam o Solar do Unhão com exposições, ilustrações, cerâmica, fotografia e gravuras à venda. Uma ótima oportunidade para conhecer novos talentos e levar arte autoral para casa.

        A programação também conta com rodas de conversa e apresentações musicais ao fim da tarde.`,
      start_date: daysFromNow(34, '10:00'),
      user_id: 1,
      category_id: 2,
      sectors: singleSector(0, 800),
      location: 'Solar do Unhão, Salvador - BA',
    },
    {
      name: 'Corrida Golden 5K',
      subtitle: 'Cinco quilômetros pela Orla da Barra com largada ao nascer do sol.',
      slug: 'corrida-golden-5k',
      photo:
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=85',
      description: `Cinco quilômetros pela Orla da Barra com largada ao nascer do sol. A corrida é aberta a todos os níveis, de iniciantes a atletas experientes, e conta com cronometragem, pontos de hidratação e medalha para quem completar o percurso.

        O kit do participante inclui camiseta, número de peito e chip de cronometragem.`,
      start_date: daysFromNow(41, '06:30'),
      user_id: 1,
      category_id: 7,
      sectors: singleSector(6500, 600),
      location: 'Orla da Barra, Salvador - BA',
    },
  ];

  for (const { sectors, ...event } of events) {
    const lots = sectors.flatMap(({ lots }) =>
      lots.map(lot => ({ ...lot, quantity_left: lot.quantity })),
    );

    await prisma.event.create({
      data: {
        ...event,
        description: removeIndentation(event.description),
        ...summarizeLots(lots),
        sectors: {
          create: sectors.map((sector, position) => ({
            name: sector.name,
            position,
            lots: {
              create: sector.lots.map((lot, lotPosition) => ({
                ...lot,
                position: lotPosition,
                quantity_left: lot.quantity,
              })),
            },
          })),
        },
      },
    });
  }
}
