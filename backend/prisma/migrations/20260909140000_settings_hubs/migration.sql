CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "phones" TEXT NOT NULL DEFAULT '',
    "emails" TEXT NOT NULL DEFAULT '',
    "fax" TEXT NOT NULL DEFAULT '',
    "license" TEXT NOT NULL DEFAULT '',
    "copyright" TEXT NOT NULL DEFAULT '',
    "eduUrl" TEXT NOT NULL DEFAULT '',
    "disclosure_phone" TEXT NOT NULL DEFAULT '',
    "edu_phone" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hubs" (
    "id" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "hubs_pkey" PRIMARY KEY ("id")
);
