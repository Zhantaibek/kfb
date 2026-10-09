export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "KSE CMS API",
    version: "0.1.0",
    description:
      "API Кыргызской фондовой биржи: публичный контент, кабинет и админ-CMS.\n\nКабинет эмитента: `issuer@kse.kg` / `kse` (`POST /api/auth/session`). CMS: `admin@kse.kg` / `admin` (`POST /api/admin/session`).",
  },
  servers: [
    { url: "http://localhost:4000", description: "Локальный backend" },
    { url: "http://localhost:3000", description: "Через Next.js-прокси" },
  ],
  tags: [
    { name: "Health" },
    { name: "Public" },
    { name: "Auth" },
    { name: "CMS" },
    { name: "Media" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "kse-admin",
        description: "HttpOnly-cookie после POST /api/admin/session",
      },
      userCookie: {
        type: "apiKey",
        in: "cookie",
        name: "kse-user",
        description: "HttpOnly-cookie после POST /api/auth/session",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
      AdminSession: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", example: "admin@kse.kg" },
          name: { type: "string", example: "Администратор" },
          role: { type: "string", enum: ["admin", "editor"] },
        },
      },
      UserSession: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", example: "issuer@kse.kg" },
          name: { type: "string", example: "Эмитент" },
          role: { type: "string", enum: ["issuer"] },
        },
      },
      CmsNews: {
        type: "object",
        properties: {
          id: { type: "string" },
          slug: { type: "string" },
          date: { type: "string", example: "18.08.2026" },
          tag: { type: "string" },
          kind: { type: "string", enum: ["exchange", "company", "urgent"] },
          status: { type: "string", enum: ["draft", "published"] },
          title: { type: "string" },
          excerpt: { type: "string" },
          body: { type: "string" },
          photo: { type: "string" },
          issuerSlug: { type: "string", description: "slug эмитента, если kind = company" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CmsSlide: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          text: { type: "string" },
          href: { type: "string" },
          value: { type: "string" },
          photo: { type: "string" },
          order: { type: "integer" },
        },
      },
      CmsMedia: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          url: { type: "string", example: "/uploads/uuid.jpg" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CmsPage: {
        type: "object",
        properties: {
          id: { type: "string" },
          path: { type: "string", example: "/about" },
          title: { type: "string" },
          lead: { type: "string" },
          body: { type: "string" },
          status: { type: "string", enum: ["draft", "published"] },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CmsMenuItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          href: { type: "string" },
          group: { type: "string" },
          order: { type: "integer" },
          parentId: { type: "string", nullable: true },
        },
      },
      CmsManagementPerson: {
        type: "object",
        properties: {
          id: { type: "string" },
          slug: { type: "string" },
          name: { type: "string" },
          role: { type: "string" },
          group: { type: "string", enum: ["board", "executive"] },
          photo: { type: "string" },
          bio: { type: "string", description: "Абзацы разделены переводом строки" },
          education: { type: "string", description: "Пункты разделены переводом строки" },
          career: {
            type: "array",
            items: {
              type: "object",
              properties: {
                org: { type: "string" },
                role: { type: "string" },
                period: { type: "string" },
              },
            },
          },
          order: { type: "integer" },
          status: { type: "string", enum: ["draft", "published"] },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CmsRequest: {
        type: "object",
        properties: {
          id: { type: "string" },
          source: { type: "string" },
          payload: { type: "object", additionalProperties: { type: "string" } },
          status: { type: "string", enum: ["new", "done"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      CmsUserPublic: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          role: { type: "string", enum: ["admin", "editor", "issuer"] },
        },
      },
      CmsVisit: {
        type: "object",
        properties: {
          id: { type: "string" },
          path: { type: "string" },
          at: { type: "string", format: "date-time" },
        },
      },
      CmsAudit: {
        type: "object",
        properties: {
          id: { type: "string" },
          action: { type: "string" },
          entity: { type: "string" },
          detail: { type: "string" },
          actor: { type: "string" },
          at: { type: "string", format: "date-time" },
        },
      },
      CmsIssuer: {
        type: "object",
        description: "Эмитент Центра раскрытия информации (/disclosure/<slug>)",
        properties: {
          id: { type: "string" },
          slug: { type: "string" },
          name: { type: "string" },
          activity: { type: "string" },
          director: { type: "string" },
          position: { type: "string" },
          address: { type: "string" },
          phone: { type: "string" },
          registrar: { type: "string" },
          security: { type: "string" },
          count: { type: "string" },
          price: { type: "string" },
          status: { type: "string", description: "Статус профиля, например «Активен»" },
          order: { type: "integer" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CmsListingEntry: {
        type: "object",
        description: "Бумага официального списка КФБ (/listing) с карточкой листинга",
        properties: {
          id: { type: "string" },
          code: { type: "string", example: "MAIR4" },
          category: { type: "string", enum: ["A", "B", "C", "delisted"] },
          order: { type: "integer" },
          name: { type: "string" },
          issuerSlug: { type: "string" },
          security: { type: "string" },
          price: { type: "string" },
          cap: { type: "string" },
          count: { type: "string" },
          doc: { type: "string" },
          symbols: { type: "string" },
          industry: { type: "string" },
          activity: { type: "string" },
          listedAt: { type: "string", description: "ГГГГ-ММ-ДД" },
          auditor: { type: "string" },
          registrar: { type: "string" },
          marketMaker: { type: "string" },
          documents: {
            type: "array",
            items: { type: "object", properties: { name: { type: "string" }, url: { type: "string" } } },
          },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      IssuerData: {
        type: "object",
        properties: {
          issuers: { type: "array", items: { $ref: "#/components/schemas/CmsIssuer" } },
          listing: { type: "array", items: { $ref: "#/components/schemas/CmsListingEntry" } },
        },
      },
      AdminStore: {
        type: "object",
        properties: {
          news: { type: "array", items: { $ref: "#/components/schemas/CmsNews" } },
          slides: { type: "array", items: { $ref: "#/components/schemas/CmsSlide" } },
          media: { type: "array", items: { $ref: "#/components/schemas/CmsMedia" } },
          pages: { type: "array", items: { $ref: "#/components/schemas/CmsPage" } },
          menu: { type: "array", items: { $ref: "#/components/schemas/CmsMenuItem" } },
          management: { type: "array", items: { $ref: "#/components/schemas/CmsManagementPerson" } },
          issuers: { type: "array", items: { $ref: "#/components/schemas/CmsIssuer" } },
          listing: { type: "array", items: { $ref: "#/components/schemas/CmsListingEntry" } },
          requests: { type: "array", items: { $ref: "#/components/schemas/CmsRequest" } },
          users: { type: "array", items: { $ref: "#/components/schemas/CmsUserPublic" } },
          visits: { type: "array", items: { $ref: "#/components/schemas/CmsVisit" } },
          audit: { type: "array", items: { $ref: "#/components/schemas/CmsAudit" } },
        },
      },
      PublicContent: {
        type: "object",
        properties: {
          news: { type: "array", items: { $ref: "#/components/schemas/CmsNews" } },
          slides: { type: "array", items: { $ref: "#/components/schemas/CmsSlide" } },
          media: { type: "array", items: { $ref: "#/components/schemas/CmsMedia" } },
          pages: { type: "array", items: { $ref: "#/components/schemas/CmsPage" } },
          menu: { type: "array", items: { $ref: "#/components/schemas/CmsMenuItem" } },
          management: { type: "array", items: { $ref: "#/components/schemas/CmsManagementPerson" } },
        },
      },
      MutateBody: {
        type: "object",
        required: ["op", "collection"],
        properties: {
          op: { type: "string", enum: ["create", "update", "delete"] },
          collection: {
            type: "string",
            enum: ["news", "slides", "media", "pages", "menu", "management", "issuers", "listing", "requests", "users", "visits"],
          },
          id: { type: "string", description: "Нужен для update и delete" },
          item: { type: "object", additionalProperties: true, description: "Поля записи для create/update" },
        },
        example: {
          op: "create",
          collection: "news",
          item: {
            slug: "example",
            date: "19.08.2026",
            tag: "Биржа",
            kind: "exchange",
            status: "published",
            title: "Пример новости",
            excerpt: "Кратко",
            body: "Текст",
            photo: "/carousel/trading.jpg",
          },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Проверка живости API",
        responses: {
          "200": {
            description: "Сервис доступен",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    service: { type: "string", example: "kse-api" },
                    db: {
                      type: "object",
                      properties: {
                        driver: { type: "string", example: "postgresql" },
                        database: { type: "string", example: "kse" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/public/content": {
      get: {
        tags: ["Public"],
        summary: "Опубликованный контент сайта",
        responses: {
          "200": {
            description: "Новости, слайды, медиа, страницы, меню",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PublicContent" } } },
          },
        },
      },
    },
    "/api/public/issuers": {
      get: {
        tags: ["Public"],
        summary: "Эмитенты и официальный список КФБ",
        responses: {
          "200": {
            description: "Эмитенты Центра раскрытия информации и бумаги листинга",
            content: { "application/json": { schema: { $ref: "#/components/schemas/IssuerData" } } },
          },
        },
      },
    },
    "/api/public/request": {
      post: {
        tags: ["Public"],
        summary: "Заявка с сайта",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  source: { type: "string", example: "contacts" },
                  payload: {
                    type: "object",
                    additionalProperties: { type: "string" },
                    example: { name: "Айбек", phone: "+996", message: "Вопрос по листингу" },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Принято",
            content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" } } } } },
          },
        },
      },
    },
    "/api/public/market/{key}": {
      get: {
        tags: ["Public"],
        summary: "Живые данные торгов с kse.kg",
        description:
          "Последний снимок раздела kse.kg (обновляется раз в 15 минут). stale=true — последняя попытка обновления не удалась, отдаются прежние данные.",
        parameters: [
          {
            name: "key",
            in: "path",
            required: true,
            schema: {
              type: "string",
              enum: ["trade-results", "trade-archive", "index", "quotes", "quotes-metals", "auction-schedule", "auction-results", "volume-gs", "deposit-auctions", "members-rating", "finmarket", "members"],
            },
          },
        ],
        responses: {
          "200": { description: "{ key, data, fetchedAt, sourceUrl, stale }" },
          "404": { description: "Неизвестный раздел или данные ещё не загружены" },
        },
      },
    },
    "/api/public/search": {
      get: {
        tags: ["Public"],
        summary: "Поиск по всему сайту",
        description:
          "Страницы и пункты меню, новости, эмитенты, листинг и его документы, руководство, курсы учебного центра. Все слова запроса должны встретиться (в любом языке); регистр и «ё» не важны.",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string", example: "аэропорт" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 5, maximum: 100 }, description: "Результатов в каждой группе" },
        ],
        responses: {
          "200": { description: "{ query, total, groups: [{ kind, label, total, items: [{ title, href, meta?, snippet? }] }] }" },
        },
      },
    },
    "/api/public/visit": {
      post: {
        tags: ["Public"],
        summary: "Учёт посещения страницы",
        description:
          "IP и устройство берутся из запроса. Повтор той же страницы тем же посетителем за 30 минут, а также /admin, /api и боты не записываются.",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  path: { type: "string", example: "/" },
                  visitorId: { type: "string", description: "Случайный id посетителя из localStorage", example: "v_3k9f8a2d1c" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "recorded=false — посещение не засчитано (повтор, бот, служебный путь)",
            content: {
              "application/json": {
                schema: { type: "object", properties: { ok: { type: "boolean" }, recorded: { type: "boolean" } } },
              },
            },
          },
        },
      },
    },
    "/api/auth/session": {
      get: {
        tags: ["Auth"],
        summary: "Сессия кабинета",
        security: [{ userCookie: [] }],
        responses: {
          "200": {
            description: "Текущий пользователь или `user: null`, если нет сессии",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { anyOf: [{ $ref: "#/components/schemas/UserSession" }, { type: "null" }] } },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Auth"],
        summary: "Вход в кабинет",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "issuer@kse.kg" },
                  password: { type: "string", example: "kse" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Cookie `kse-user` установлена",
            content: {
              "application/json": {
                schema: { type: "object", properties: { user: { $ref: "#/components/schemas/UserSession" } } },
              },
            },
          },
          "401": {
            description: "Неверный логин или пароль",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
      delete: {
        tags: ["Auth"],
        summary: "Выход из кабинета",
        responses: {
          "200": {
            description: "Cookie сброшена",
            content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" } } } } },
          },
        },
      },
    },
    "/api/admin/session": {
      get: {
        tags: ["Auth"],
        summary: "Текущая сессия администратора",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Авторизован",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { $ref: "#/components/schemas/AdminSession" } },
                },
              },
            },
          },
          "401": {
            description: "Нет сессии",
            content: { "application/json": { schema: { type: "object", properties: { user: { nullable: true } } } } },
          },
        },
      },
      post: {
        tags: ["Auth"],
        summary: "Вход в CMS",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "admin@kse.kg" },
                  password: { type: "string", example: "admin" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Cookie `kse-admin` установлена",
            headers: {
              "Set-Cookie": { schema: { type: "string" }, description: "kse-admin=...; HttpOnly; Path=/" },
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { $ref: "#/components/schemas/AdminSession" } },
                },
              },
            },
          },
          "401": {
            description: "Неверный логин или пароль",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
      delete: {
        tags: ["Auth"],
        summary: "Выход",
        responses: {
          "200": {
            description: "Cookie сброшена",
            content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" } } } } },
          },
        },
      },
    },
    "/api/admin/analytics/summary": {
      get: {
        tags: ["CMS"],
        summary: "Посещения: сводка и графики",
        description: "Сегодня / 7 дней / месяц / всего (+ уникальные), 14 дней по дням, по дням недели, устройства, популярные страницы.",
        security: [{ cookieAuth: [] }],
        responses: { "200": { description: "Сводка" }, "401": { description: "Нет сессии админки" } },
      },
    },
    "/api/admin/analytics/visits": {
      get: {
        tags: ["CMS"],
        summary: "Посещения: список с фильтром и страницами",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "period", in: "query", schema: { type: "string", enum: ["today", "week", "month", "all"], default: "today" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 10, maximum: 100 } },
        ],
        responses: { "200": { description: "{ items: [{ id, path, ip, device, at }], total, page, pageSize, pageCount }" } },
      },
    },
    "/api/admin/data": {
      get: {
        tags: ["CMS"],
        summary: "Полное состояние CMS",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Данные без паролей пользователей",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AdminStore" } } },
          },
          "401": { description: "Нужна сессия", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      post: {
        tags: ["CMS"],
        summary: "Создать, обновить или удалить запись",
        description: "Коллекция `audit` только для чтения. Для `users` пустой `password` при update не перезаписывается.",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/MutateBody" } } },
        },
        responses: {
          "200": {
            description: "Обновлённое состояние CMS",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AdminStore" } } },
          },
          "400": { description: "Некорректный запрос", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Нужна сессия", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Запись не найдена", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/admin/upload": {
      post: {
        tags: ["Media"],
        summary: "Загрузить изображение",
        description: "JPG, PNG, WEBP или GIF, до 4 МБ. Файл сохраняется в `backend/uploads/`.",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: { file: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Созданная медиа-запись",
            content: { "application/json": { schema: { $ref: "#/components/schemas/CmsMedia" } } },
          },
          "400": { description: "Нет файла, слишком большой или неверный тип", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Нужна сессия", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
  },
} as const;
