import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, type CourseLevel, type PaymentMethod, type PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

const YT = {
  market: 'https://www.youtube.com/watch?v=p7HKvqRI_Bo',
  bonds: 'https://www.youtube.com/watch?v=Qn6S6n1nX0U',
  risk: 'https://www.youtube.com/watch?v=uYZftCq2efg',
};

const COVER = {
  market: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80',
  trade: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&q=80',
  portfolio: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80',
  law: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=80',
  sukuk: 'https://images.unsplash.com/photo-1546412414-e1885259563a?w=1200&q=80',
  esg: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80',
  listing: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
};

function daysAgo(days: number, hours = 12) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, 20, 0, 0);
  return d;
}

function monthsAgo(months: number, day = 8) {
  const d = new Date();
  d.setMonth(d.getMonth() - months, day);
  d.setHours(11, 0, 0, 0);
  return d;
}

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.courseReview.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.magicLinkToken.deleteMany();
  await prisma.telegramOtpChallenge.deleteMany();
  await prisma.telegramLinkToken.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('Student123!', 10);
  const adminHash = await bcrypt.hash('Admin123!', 10);
  const teacherHash = await bcrypt.hash('Teacher123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@edu.local',
      passwordHash: adminHash,
      role: 'ADMIN',
      createdAt: monthsAgo(8),
      profile: {
        create: {
          firstName: 'Айбек',
          lastName: 'Токтогулов',
          phone: '+996 312 31-14-84',
          bio: 'Администратор учебного центра КФБ',
          avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=AT',
        },
      },
    },
  });

  const [t1, t2, t3] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'teacher@edu.local',
        passwordHash: teacherHash,
        role: 'TEACHER',
        createdAt: monthsAgo(7),
        profile: {
          create: {
            firstName: 'Айгуль',
            lastName: 'Бердиева',
            phone: '+996 555 12-40-18',
            bio: 'Преподаватель рынка ценных бумаг, 12 лет практики на КФБ',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aigul',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'teacher2@edu.local',
        passwordHash: teacherHash,
        role: 'TEACHER',
        createdAt: monthsAgo(6),
        profile: {
          create: {
            firstName: 'Нурлан',
            lastName: 'Садыков',
            phone: '+996 700 88-21-05',
            bio: 'Брокер, торговые системы и клиринг КФБ',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nurlan',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'teacher3@edu.local',
        passwordHash: teacherHash,
        role: 'TEACHER',
        createdAt: monthsAgo(5),
        profile: {
          create: {
            firstName: 'Асель',
            lastName: 'Жунусова',
            phone: '+996 772 63-79-97',
            bio: 'Корпоративное управление, ESG и исламские финансы',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Asel',
          },
        },
      },
    }),
  ]);

  const studentRows: Array<[string, string, string, Date, string?]> = [
    ['student@edu.local', 'Жантай', 'Тилекеев', daysAgo(12), '+996 704 64-28-66'],
    ['student2@edu.local', 'Айдана', 'Омуралиева', monthsAgo(1, 4)],
    ['student3@edu.local', 'Эрлан', 'Бекбоев', monthsAgo(1, 18)],
    ['student4@edu.local', 'Мээрим', 'Касымова', monthsAgo(2, 6)],
    ['student5@edu.local', 'Бакыт', 'Исаков', monthsAgo(2, 21)],
    ['aida.s@edu.local', 'Аида', 'Сыдыкова', daysAgo(20)],
    ['talant.k@edu.local', 'Талант', 'Кудайбергенов', monthsAgo(3, 3)],
    ['nurzhan.a@edu.local', 'Нуржан', 'Абдыкадыров', monthsAgo(3, 19)],
    ['eliza.m@edu.local', 'Элиза', 'Мамбетова', monthsAgo(4, 8)],
    ['kanat.t@edu.local', 'Канат', 'Турсунбеков', monthsAgo(4, 22)],
    ['gulnara.b@edu.local', 'Гульнара', 'Бекмуратова', monthsAgo(5, 5)],
    ['almaz.s@edu.local', 'Алмаз', 'Сатаров', monthsAgo(5, 17)],
    ['dinara.u@edu.local', 'Динара', 'Усеналиева', daysAgo(2)],
    ['ruslan.j@edu.local', 'Руслан', 'Жумабеков', daysAgo(6)],
    ['aigerim.n@edu.local', 'Айгерим', 'Нурланова', daysAgo(3)],
    ['tilek.o@edu.local', 'Тилек', 'Осмонов', daysAgo(8)],
    ['samara.k@edu.local', 'Самара', 'Каримова', monthsAgo(1, 27)],
    ['adilet.b@edu.local', 'Адилет', 'Баялиев', monthsAgo(2, 14)],
  ];

  const students = await Promise.all(
    studentRows.map(([email, firstName, lastName, createdAt, phone], i) =>
      prisma.user.create({
        data: {
          email,
          passwordHash: hash,
          role: 'STUDENT',
          createdAt,
          profile: {
            create: {
              firstName,
              lastName,
              phone: phone ?? `+996 555 ${String(110 + i).padStart(3, '0')}-${String(20 + i).padStart(2, '0')}-${String(10 + i).padStart(2, '0')}`,
              avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName)}`,
            },
          },
        },
      }),
    ),
  );

  const [catInvest, catMarket, catCorp, catIslam] = await Promise.all(
    [
      ['Инвесторам', 'investors', 'Программы для частных инвесторов и студентов'],
      ['Участникам рынка', 'market-participants', 'Брокеры, банки, сотрудники эмитентов'],
      ['Корпоративное управление', 'governance', 'ESG, листинг, советы директоров'],
      ['Исламские финансы', 'islamic-finance', 'Сукук и инструменты исламского финансирования'],
    ].map(([name, slug, description]) => prisma.category.create({ data: { name, slug, description } })),
  );

  const lesson = (
    title: string,
    order: number,
    type: 'VIDEO' | 'TEXT' | 'LINK',
    min: number,
    extra: { content?: string; videoUrl?: string; linkUrl?: string } = {},
  ) => ({
    title,
    order,
    contentType: type,
    durationMin: min,
    content: extra.content ?? title,
    videoUrl: extra.videoUrl,
    linkUrl: extra.linkUrl,
  });

  const course = async (opts: {
    title: string;
    slug: string;
    description: string;
    coverUrl: string;
    level: CourseLevel;
    hours: number;
    price: number;
    rating: number;
    status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
    teacherId: string;
    categoryId: string;
    createdAt: Date;
    modules: Array<{ title: string; lessons: ReturnType<typeof lesson>[] }>;
  }) =>
    prisma.course.create({
      data: {
        title: opts.title,
        slug: opts.slug,
        description: opts.description,
        coverUrl: opts.coverUrl,
        level: opts.level,
        durationHours: opts.hours,
        price: opts.price,
        rating: opts.rating,
        status: opts.status ?? 'PUBLISHED',
        teacherId: opts.teacherId,
        categoryId: opts.categoryId,
        createdAt: opts.createdAt,
        modules: {
          create: opts.modules.map((m, i) => ({
            title: m.title,
            order: i + 1,
            lessons: { create: m.lessons },
          })),
        },
      },
      include: { modules: { include: { lessons: true } } },
    });

  const cMarket = await course({
    title: 'Рынок и его участники',
    slug: 'rynok-i-uchastniki',
    description:
      'Что такое КФБ, финансовые инструменты, роли брокера, эмитента и инвестора — первые шаги без жаргона.',
    coverUrl: COVER.market,
    level: 'BEGINNER',
    hours: 8,
    price: 0,
    rating: 4.9,
    teacherId: t1.id,
    categoryId: catInvest.id,
    createdAt: daysAgo(40),
    modules: [
      {
        title: 'Биржа и инфраструктура',
        lessons: [
          lesson('Что такое КФБ', 1, 'VIDEO', 7, { videoUrl: YT.market, content: 'Как устроена Кыргызская фондовая биржа.' }),
          lesson('Участники рынка', 2, 'TEXT', 6, { content: 'Инвестор, брокер, эмитент, депозитарий, регулятор.' }),
          lesson('Как читать котировки', 3, 'TEXT', 8, { content: 'Цена, объём, лот и спред на примерах КФБ.' }),
          lesson('Сайт и торговый терминал', 4, 'LINK', 5, { linkUrl: 'https://www.kse.kg/ru', content: 'Где смотреть инструменты и итоги торгов.' }),
        ],
      },
      {
        title: 'Инструменты',
        lessons: [
          lesson('Акции', 1, 'VIDEO', 9, { videoUrl: YT.bonds, content: 'Обыкновенные и привилегированные акции.' }),
          lesson('Облигации', 2, 'TEXT', 10, { content: 'Купон, номинал, доходность к погашению.' }),
          lesson('Госбумаги и ликвидность', 3, 'TEXT', 7, { content: 'Чем отличаются ГЦБ и корпоративные выпуски.' }),
          lesson('Практика: список инструментов', 4, 'TEXT', 8, { content: 'Разбираем 5 бумаг с kse.kg.' }),
        ],
      },
      {
        title: 'Первые шаги инвестора',
        lessons: [
          lesson('Как открыть счёт у брокера', 1, 'VIDEO', 8, { videoUrl: YT.market }),
          lesson('Документы и комплаенс', 2, 'TEXT', 6, { content: 'Идентификация клиента и налоговый статус.' }),
          lesson('Ошибки новичков', 3, 'TEXT', 7, { content: 'Маржинальность, слухи, отсутствие плана.' }),
          lesson('Квиз: участники рынка', 4, 'TEXT', 5, { content: 'Проверьте, кто за что отвечает на КФБ.' }),
        ],
      },
    ],
  });

  const cDeal = await course({
    title: 'Как проходит сделка',
    slug: 'kak-prohodit-sdelka',
    description: 'Торговое приложение, виды заявок, клиринг и расчёты. Путь ордера на реальных примерах КФБ.',
    coverUrl: COVER.trade,
    level: 'INTERMEDIATE',
    hours: 10,
    price: 4900,
    rating: 4.7,
    teacherId: t2.id,
    categoryId: catInvest.id,
    createdAt: daysAgo(32),
    modules: [
      {
        title: 'Заявки',
        lessons: [
          lesson('Лимитная и рыночная заявка', 1, 'VIDEO', 8, { videoUrl: YT.market }),
          lesson('Стоп и айсберг', 2, 'TEXT', 7, { content: 'Когда нужна защита и скрытый объём.' }),
          lesson('Стакан и спред', 3, 'TEXT', 9, { content: 'Как читать книгу заявок.' }),
          lesson('Практика: первый ордер', 4, 'VIDEO', 11, { videoUrl: YT.market }),
        ],
      },
      {
        title: 'Клиринг и расчёты',
        lessons: [
          lesson('T+ цикл', 1, 'TEXT', 8, { content: 'Когда бумага и деньги меняют владельца.' }),
          lesson('Депозитарий', 2, 'TEXT', 6, { content: 'Учёт прав на ценные бумаги.' }),
          lesson('Комиссии брокера и биржи', 3, 'TEXT', 5, { content: 'Что входит в стоимость сделки.' }),
          lesson('Сбой и отмена сделки', 4, 'TEXT', 6, { content: 'Технические и регуляторные случаи.' }),
        ],
      },
      {
        title: 'После сделки',
        lessons: [
          lesson('Выписка и отчёт', 1, 'TEXT', 5, { content: 'Что хранить для налогов.' }),
          lesson('Корпоративные действия', 2, 'TEXT', 7, { content: 'Дивиденды, сплит, оферта.' }),
          lesson('Кейс: покупка облигации', 3, 'VIDEO', 12, { videoUrl: YT.bonds }),
          lesson('Квиз: механика сделки', 4, 'TEXT', 5, { content: 'Проверьте путь ордера.' }),
        ],
      },
    ],
  });

  const cRisk = await course({
    title: 'Портфель и риски',
    slug: 'portfel-i-riski',
    description: 'Управление капиталом, психология инвестора и первый портфель из инструментов кыргызского рынка.',
    coverUrl: COVER.portfolio,
    level: 'ADVANCED',
    hours: 12,
    price: 7900,
    rating: 4.8,
    teacherId: t1.id,
    categoryId: catInvest.id,
    createdAt: daysAgo(25),
    modules: [
      {
        title: 'Риск и капитал',
        lessons: [
          lesson('Типы рисков', 1, 'VIDEO', 9, { videoUrl: YT.risk }),
          lesson('Диверсификация на узком рынке', 2, 'TEXT', 8, { content: 'Как не класть всё в одну бумагу КФБ.' }),
          lesson('Горизонт и ликвидность', 3, 'TEXT', 7, { content: 'Когда нельзя быстро выйти.' }),
          lesson('Психология убытка', 4, 'TEXT', 6, { content: 'Стоп, реванш, FOMO.' }),
        ],
      },
      {
        title: 'Сборка портфеля',
        lessons: [
          lesson('Базовый портфель 60/40', 1, 'VIDEO', 10, { videoUrl: YT.risk }),
          lesson('Облигации как якорь', 2, 'TEXT', 8, { content: 'Купон и реинвест.' }),
          lesson('Ребалансировка', 3, 'TEXT', 7, { content: 'Раз в квартал или по порогу.' }),
          lesson('Кейс: портфель на 200 000 сом', 4, 'TEXT', 12, { content: 'Разбор состава и комиссий.' }),
        ],
      },
      {
        title: 'Контроль',
        lessons: [
          lesson('Дневник сделок', 1, 'TEXT', 5, { content: 'Что записывать после каждой сделки.' }),
          lesson('Налоги инвестора', 2, 'TEXT', 9, { content: 'Базовые правила КР (обзор, не консультация).' }),
          lesson('Когда звать советника', 3, 'TEXT', 5, { content: 'Граница самостоятельной торговли.' }),
          lesson('Итоговый кейс', 4, 'VIDEO', 14, { videoUrl: YT.risk }),
        ],
      },
    ],
  });

  const cLaw = await course({
    title: 'Организация и функционирование рынка ценных бумаг',
    slug: 'organizaciya-rcb',
    description: 'Базовый курс учебного центра КФБ: законы КР, инфраструктура рынка и роль участников.',
    coverUrl: COVER.law,
    level: 'INTERMEDIATE',
    hours: 16,
    price: 12000,
    rating: 4.6,
    teacherId: t2.id,
    categoryId: catMarket.id,
    createdAt: daysAgo(60),
    modules: [
      {
        title: 'Правовая база',
        lessons: [
          lesson('Закон о рынке ценных бумаг', 1, 'TEXT', 15, { content: 'Ключевые нормы для участников.' }),
          lesson('Закон об АО', 2, 'TEXT', 12, { content: 'Права акционеров и раскрытие.' }),
          lesson('Регулятор и лицензии', 3, 'VIDEO', 10, { videoUrl: YT.market }),
        ],
      },
      {
        title: 'Инфраструктура КФБ',
        lessons: [
          lesson('Торговая система', 1, 'TEXT', 10, { content: 'Сессии, инструменты, режимы.' }),
          lesson('Клиринг', 2, 'TEXT', 9, { content: 'Расчёты и обеспечение.' }),
          lesson('Членство на бирже', 3, 'TEXT', 8, { content: 'Требования к брокерам.' }),
        ],
      },
    ],
  });

  const cSukuk = await course({
    title: 'Исламские финансы (сукук)',
    slug: 'islamskie-finansy-sukuk',
    description: 'Принципы исламского финансирования и как устроены сукук на практике.',
    coverUrl: COVER.sukuk,
    level: 'INTERMEDIATE',
    hours: 8,
    price: 8900,
    rating: 4.5,
    teacherId: t3.id,
    categoryId: catIslam.id,
    createdAt: daysAgo(18),
    modules: [
      {
        title: 'Основы',
        lessons: [
          lesson('Почему не риба', 1, 'VIDEO', 8, { videoUrl: YT.bonds }),
          lesson('Контракты: мурабаха, иджара', 2, 'TEXT', 11, { content: 'Отличие от классического кредита.' }),
          lesson('Сукук vs облигация', 3, 'TEXT', 9, { content: 'Доля в активе, а не долг.' }),
          lesson('Кейс выпуска', 4, 'TEXT', 10, { content: 'Структура простого сукука.' }),
        ],
      },
    ],
  });

  const cEsg = await course({
    title: 'Корпоративное управление и ESG',
    slug: 'korporativnoe-upravlenie-esg',
    description: 'Совет директоров, раскрытие информации и ESG-практики для эмитентов КФБ.',
    coverUrl: COVER.esg,
    level: 'ADVANCED',
    hours: 10,
    price: 9500,
    rating: 4.4,
    teacherId: t3.id,
    categoryId: catCorp.id,
    createdAt: daysAgo(14),
    modules: [
      {
        title: 'Управление',
        lessons: [
          lesson('Роль совета директоров', 1, 'TEXT', 10, { content: 'Независимость и комитеты.' }),
          lesson('Права миноритариев', 2, 'TEXT', 8, { content: 'Собрание, дивиденды, сделки с заинтересованностью.' }),
          lesson('ESG-метрики', 3, 'VIDEO', 12, { videoUrl: YT.risk }),
          lesson('Отчётность эмитента', 4, 'TEXT', 9, { content: 'Что публиковать на бирже.' }),
        ],
      },
    ],
  });

  await course({
    title: 'Подготовка к листингу на КФБ',
    slug: 'podgotovka-k-listingu',
    description: 'Черновик корпоративного трека: документы, due diligence и коммуникация с инвесторами.',
    coverUrl: COVER.listing,
    level: 'ADVANCED',
    hours: 14,
    price: 25000,
    rating: 0,
    status: 'DRAFT',
    teacherId: t3.id,
    categoryId: catCorp.id,
    createdAt: daysAgo(5),
    modules: [
      {
        title: 'Подготовка',
        lessons: [lesson('Чек-лист листинга', 1, 'TEXT', 20, { content: 'Документы и этапы.' })],
      },
    ],
  });

  await course({
    title: 'Введение в фондовый рынок (архив)',
    slug: 'vvedenie-fondovyi-rynok-arhiv',
    description: 'Архивная ознакомительная программа 2024 года — заменена курсом «Рынок и его участники».',
    coverUrl: COVER.market,
    level: 'BEGINNER',
    hours: 4,
    price: 0,
    rating: 4.2,
    status: 'ARCHIVED',
    teacherId: t1.id,
    categoryId: catInvest.id,
    createdAt: monthsAgo(6, 2),
    modules: [
      {
        title: 'Обзор',
        lessons: [lesson('Запись вебинара', 1, 'VIDEO', 40, { videoUrl: YT.market })],
      },
    ],
  });

  const published = [cMarket, cDeal, cRisk, cLaw, cSukuk, cEsg];

  const enroll = async (
    userId: string,
    c: (typeof cMarket),
    done: number,
    activityDays: number,
  ) => {
    const lessons = c.modules.flatMap((m) => m.lessons);
    const total = lessons.length;
    const completed = Math.min(done, total);
    const rec = await prisma.enrollment.create({
      data: {
        userId,
        courseId: c.id,
        totalLessons: total,
        completedLessons: completed,
        progressPercent: total ? Math.round((completed / total) * 1000) / 10 : 0,
        lastActivityAt: daysAgo(activityDays, 16),
        completedAt: completed === total ? daysAgo(activityDays) : null,
        createdAt: daysAgo(activityDays + 4),
      },
    });
    if (completed > 0) {
      await prisma.progress.createMany({
        data: lessons.slice(0, completed).map((l) => ({
          enrollmentId: rec.id,
          lessonId: l.id,
          completed: true,
          completedAt: daysAgo(activityDays),
        })),
      });
    }
    return rec;
  };

  await enroll(students[0].id, cMarket, 5, 2);
  await enroll(students[0].id, cDeal, 2, 1);
  await enroll(students[1].id, cMarket, 12, 3);
  await enroll(students[2].id, cMarket, 4, 6);
  await enroll(students[3].id, cDeal, 6, 4);
  await enroll(students[4].id, cRisk, 3, 5);
  await enroll(students[5].id, cMarket, 8, 8);
  await enroll(students[6].id, cLaw, 2, 9);
  await enroll(students[7].id, cSukuk, 1, 3);
  await enroll(students[8].id, cEsg, 2, 7);
  await enroll(students[9].id, cMarket, 12, 12);
  await enroll(students[10].id, cDeal, 4, 11);
  await enroll(students[11].id, cRisk, 8, 10);
  await enroll(students[12].id, cMarket, 3, 2);
  await enroll(students[13].id, cLaw, 5, 15);
  await enroll(students[14].id, cSukuk, 4, 4);
  await enroll(students[15].id, cMarket, 1, 1);
  await enroll(students[16].id, cDeal, 0, 2);
  await enroll(students[17].id, cEsg, 1, 6);

  const a1 = await prisma.assignment.create({
    data: {
      courseId: cMarket.id,
      creatorId: t1.id,
      title: 'Карта участников рынка',
      description: 'Нарисуйте схему: инвестор → брокер → биржа → клиринг. Кратко опишите роль каждого.',
      deadline: daysAgo(-10),
      createdAt: daysAgo(9),
    },
  });
  const a2 = await prisma.assignment.create({
    data: {
      courseId: cDeal.id,
      creatorId: t2.id,
      title: 'Разбор заявки',
      description: 'Опишите лимитную заявку на покупку 10 лотов выбранной бумаги КФБ: цена, срок, риски.',
      deadline: daysAgo(-5),
      createdAt: daysAgo(6),
    },
  });
  const a3 = await prisma.assignment.create({
    data: {
      courseId: cRisk.id,
      creatorId: t1.id,
      title: 'Черновик портфеля',
      description: 'Соберите портфель на 100 000 сом из 3–5 инструментов. Обоснуйте доли.',
      deadline: daysAgo(-20),
      createdAt: daysAgo(4),
    },
  });
  const a4 = await prisma.assignment.create({
    data: {
      courseId: cSukuk.id,
      creatorId: t3.id,
      title: 'Сукук vs облигация',
      description: 'Сравнительная таблица: доход, риск, шариат-комплаенс.',
      deadline: daysAgo(-3),
      createdAt: daysAgo(2),
    },
  });

  await prisma.submission.createMany({
    data: [
      {
        assignmentId: a1.id,
        studentId: students[0].id,
        textAnswer: 'Схема приложена: инвестор открывает счёт у брокера, ордер уходит на КФБ, клиринг закрывает сделку.',
        status: 'REVIEWED',
        grade: 92,
        comment: 'Чётко. Добавьте депозитарий в схему.',
        submittedAt: daysAgo(7),
        reviewedAt: daysAgo(6),
      },
      {
        assignmentId: a1.id,
        studentId: students[1].id,
        textAnswer: 'Инвестор покупает через брокера, биржа сводит заявки.',
        status: 'SUBMITTED',
        submittedAt: daysAgo(3),
      },
      {
        assignmentId: a2.id,
        studentId: students[0].id,
        textAnswer: 'Лимит 185.00, 10 лотов, день. Риск — заявка не исполнится при гэпе.',
        status: 'SUBMITTED',
        submittedAt: daysAgo(1),
      },
      {
        assignmentId: a3.id,
        studentId: students[11].id,
        textAnswer: '40% ГЦБ, 40% корп. облигации, 20% акции голубых фишек.',
        status: 'REVIEWED',
        grade: 88,
        comment: 'Хороший якорь в облигациях.',
        submittedAt: daysAgo(8),
        reviewedAt: daysAgo(7),
      },
      {
        assignmentId: a4.id,
        studentId: students[14].id,
        textAnswer: 'Сукук — доля в активе, облигация — долг. Доход сукука от аренды/прибыли.',
        status: 'LATE',
        submittedAt: daysAgo(0, 20),
      },
    ],
  });

  const pay = (
    userId: string,
    courseId: string,
    amount: number,
    status: PaymentStatus,
    method: PaymentMethod,
    at: Date,
  ) => ({
    userId,
    courseId,
    amount,
    status,
    paymentMethod: method,
    paidAt: status === 'PAID' ? at : null,
    createdAt: at,
  });

  await prisma.payment.createMany({
    data: [
      pay(students[0].id, cDeal.id, 4900, 'PAID', 'CARD', daysAgo(8)),
      pay(students[1].id, cDeal.id, 4900, 'PAID', 'QR', monthsAgo(1, 4)),
      pay(students[2].id, cRisk.id, 7900, 'PENDING', 'BANK_TRANSFER', daysAgo(1)),
      pay(students[3].id, cDeal.id, 4900, 'PAID', 'CARD', monthsAgo(1, 16)),
      pay(students[4].id, cRisk.id, 7900, 'PAID', 'CARD', monthsAgo(2, 9)),
      pay(students[5].id, cLaw.id, 12000, 'PAID', 'BANK_TRANSFER', monthsAgo(2, 21)),
      pay(students[6].id, cLaw.id, 12000, 'FAILED', 'CARD', daysAgo(12)),
      pay(students[7].id, cSukuk.id, 8900, 'PAID', 'QR', monthsAgo(3, 5)),
      pay(students[8].id, cEsg.id, 9500, 'PAID', 'CARD', monthsAgo(3, 18)),
      pay(students[9].id, cRisk.id, 7900, 'PAID', 'CARD', monthsAgo(4, 7)),
      pay(students[10].id, cDeal.id, 4900, 'PAID', 'MOCK', monthsAgo(4, 20)),
      pay(students[11].id, cRisk.id, 7900, 'PAID', 'CARD', monthsAgo(5, 3)),
      pay(students[12].id, cSukuk.id, 8900, 'PENDING', 'QR', daysAgo(2)),
      pay(students[13].id, cLaw.id, 12000, 'PAID', 'BANK_TRANSFER', monthsAgo(5, 19)),
      pay(students[14].id, cSukuk.id, 8900, 'PAID', 'CARD', daysAgo(22)),
      pay(students[16].id, cDeal.id, 4900, 'FAILED', 'CARD', daysAgo(3)),
      pay(students[17].id, cEsg.id, 9500, 'PAID', 'CARD', monthsAgo(1, 27)),
      pay(students[3].id, cRisk.id, 7900, 'PAID', 'QR', monthsAgo(2, 12)),
      pay(students[5].id, cEsg.id, 9500, 'PAID', 'CARD', monthsAgo(3, 28)),
      pay(students[10].id, cLaw.id, 12000, 'REFUNDED', 'CARD', monthsAgo(4, 11)),
      pay(students[15].id, cDeal.id, 4900, 'PAID', 'CARD', daysAgo(4)),
      pay(students[4].id, cLaw.id, 12000, 'PAID', 'BANK_TRANSFER', monthsAgo(5, 11)),
    ],
  });

  await prisma.courseReview.createMany({
    data: [
      { courseId: cMarket.id, userId: students[1].id, rating: 5, comment: 'Коротко и по делу — наконец поняла, кто есть кто на КФБ.' },
      { courseId: cMarket.id, userId: students[9].id, rating: 5, comment: 'Хороший старт перед сделками.' },
      { courseId: cDeal.id, userId: students[3].id, rating: 4, comment: 'Заявки объяснили ясно, хотелось бы больше скринкастов терминала.' },
      { courseId: cRisk.id, userId: students[11].id, rating: 5, comment: 'Кейс на 200 тысяч — самое полезное.' },
      { courseId: cSukuk.id, userId: students[14].id, rating: 4, comment: 'Сложная тема, но примеры помогли.' },
    ],
  });

  const conv1 = await prisma.conversation.create({
    data: {
      courseId: cMarket.id,
      studentId: students[0].id,
      teacherId: t1.id,
      lastMessageAt: daysAgo(0, 10),
      messages: {
        create: [
          { senderId: students[0].id, body: 'Айгуль эже, в уроке про котировки — спред это разница bid/ask?', createdAt: daysAgo(1, 9) },
          { senderId: t1.id, body: 'Да. Ask − bid. Чем уже спред, тем ликвиднее бумага.', createdAt: daysAgo(1, 10), readAt: daysAgo(1, 11) },
          { senderId: students[0].id, body: 'Спасибо, тогда к заданию по схеме.', createdAt: daysAgo(0, 10) },
        ],
      },
    },
  });
  await prisma.conversation.create({
    data: {
      courseId: cDeal.id,
      studentId: students[3].id,
      teacherId: t2.id,
      lastMessageAt: daysAgo(2, 14),
      messages: {
        create: [
          { senderId: students[3].id, body: 'Лимитная заявка может висеть несколько дней?', createdAt: daysAgo(3, 11) },
          { senderId: t2.id, body: 'Да, если брокер даёт GTC. На КФБ чаще день — уточните в приложении.', createdAt: daysAgo(2, 14) },
        ],
      },
    },
  });
  void conv1;

  await prisma.notification.createMany({
    data: [
      { userId: students[0].id, type: 'NEW_ASSIGNMENT', title: 'Новое задание', message: 'Карта участников рынка — срок через 10 дней' },
      { userId: students[0].id, type: 'PAYMENT_SUCCESS', title: 'Оплата прошла', message: 'Курс «Как проходит сделка» оплачен', isRead: true },
      { userId: students[0].id, type: 'NEW_MESSAGE', title: 'Сообщение от преподавателя', message: 'Айгуль Бердиева ответила в чате курса' },
      { userId: t1.id, type: 'ENROLLMENT', title: 'Новая запись', message: 'Жантай Тилекеев записался на «Рынок и его участники»' },
      { userId: t2.id, type: 'ENROLLMENT', title: 'Новая запись', message: 'Мээрим Касымова на курсе «Как проходит сделка»' },
      { userId: admin.id, type: 'SYSTEM', title: 'Оплаты за неделю', message: 'Поступило 5 успешных платежей по программам учебного центра' },
      { userId: students[1].id, type: 'COURSE_COMPLETED', title: 'Курс завершён', message: 'Вы прошли «Рынок и его участники»' },
      { userId: students[11].id, type: 'ASSIGNMENT_REVIEWED', title: 'Работа проверена', message: 'Черновик портфеля: 88 баллов' },
    ],
  });

  console.log('Seed completed — учебный центр КФБ');
  console.log('Admin:    admin@edu.local / Admin123!');
  console.log('Teacher:  teacher@edu.local / Teacher123!');
  console.log('Student:  student@edu.local / Student123!');
  console.log(`Courses: ${published.length} published + 1 draft`);
  console.log(`Students: ${students.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
