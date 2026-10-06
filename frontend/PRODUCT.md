# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Public visitors of kse.kg: investors, issuers, journalists, and students in Kyrgyzstan who check whether the trading session is open, what moved, issuer disclosures, and exchange news. They read Russian, Kyrgyz, or English.

Cabinet users sign in as an investor or an issuer.

CMS operators publish news, pages, menu, slider, media, and settings from the admin.

## Product Purpose

The official website of the Kyrgyz Stock Exchange (Кыргызская фондовая биржа, KSE), founded in 1994 in Bishkek. It publishes the session, instruments, listing, members, government securities auctions, disclosures, news, and the training center, and lets staff edit that content.

Success means a visitor can tell the session state and find a quote, a disclosure, or a news item, and an editor can publish a news item and see that it was added.

## Positioning

One exchange site: live session state, quotes, and issuer disclosure in Russian, Kyrgyz, and English, edited in the same CMS that feeds the public pages.

## Operating Context

Visitors use the public site on a desktop or a phone, often during the Bishkek session (weekdays 09:00–17:00, Asia/Bishkek). Editors use the admin at `/admin` after signing in. Content is stored in PostgreSQL and served by the Express API behind the Next.js site.

## Capabilities and Constraints

Public routes stay: home, market and quotes, news, disclosure, listing, members, GCB auctions, analytics, education, about, contacts, cabinet, search. The admin stays: news, menu and pages, slider, hubs, management, media, settings, requests, users, visits, audit.

Copy, market figures, and issuer facts already in the product stay. Do not invent prices, customers, or capabilities. Three languages stay: Russian is the source, Kyrgyz and English are translations.

The user confirmed a full visual replacement of both the public site and the admin. Behavior, routes, and wording stay.

## Brand Commitments

The name is Кыргызская фондовая биржа, also Kyrgyz Stock Exchange and KSE. The mark and wordmark already in the product stay recognizable. Voice is institutional and plain, not promotional.

## Evidence on Hand

Real session copy, instrument and issuer data, news, disclosures, management names, and photography already shipped in `frontend/public` and the CMS. Do not replace those facts with synthetic market claims.

## Product Principles

- The session state is the first thing a visitor can verify.
- Disclosure and news read as exchange publications, not marketing posts.
- Russian, Kyrgyz, and English carry the same structure.
- Editors get a clear result when a news item is saved.
- Trust comes from specific figures and documents, not slogans.

## Accessibility & Inclusion

The public site and admin must stay usable with a keyboard, readable text, and visible focus. Respect `prefers-reduced-motion`.
