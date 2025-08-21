Hyvä, nyt kootaan tämä **PRD (Product Requirements Document)** teknisestä näkökulmasta. Tämä on pohja, jolla tiimi voi lähteä rakentamaan SaaS-tuotetta Next.js\:llä ja Claude Code -infran päälle.

---

# 📑 Product Requirements Document (PRD) – AI Website Growth Report SaaS

## 1. Vision & Goal

Rakennetaan SaaS-palvelu, joka tuottaa automaattisia **SEO/CRO/UX-raportteja** verkkosivustoista.

* **Lyhyt aikaväli:** Yksittäisten raporttien myynti (Lite, Pro, Elite, Tasklist Pro).
* **Pitkä aikaväli:** Dashboard-tilausten myynti (99–299 €/kk).

## 2. Tech Stack

* **Frontend / App Framework:** Next.js (pohjana [nextjs/saas-starter](https://github.com/nextjs/saas-starter)).
* **Backend:** Node.js (API routes in Next.js).
* **Claude Code Infra:** Erillisellä palvelimella Claude Code SDK + MCP (DataForSEO, Firecrawl, Playwright, GA4 MCP).
* **DB & Auth:** Supabase (tai PostgreSQL, valmiiksi tuettu saas-starterissa).
* **Payments:** Stripe.
* **Storage:** Supabase Storage / S3 (raportti-PDF\:t).
* **UI Components:** Tailwind + shadcn/ui (valmiina starterissa).

---

## 3. High-Level Architecture

```mermaid
flowchart TD
  User[Client / SMB] -->|Requests Report| NextAPI[Next.js API Endpoint]
  NextAPI -->|Send Job| Queue[Job Queue (Redis/BullMQ)]
  Queue --> ClaudeWorker[Claude Code Worker Server]
  ClaudeWorker --> MCP[MCP Agents (DataForSEO, Firecrawl, Playwright, GA4)]
  MCP --> ClaudeWorker
  ClaudeWorker -->|Generated Report (PDF/JSON)| Storage[S3/Supabase Storage]
  Storage --> NextAPI
  NextAPI --> User[Download Link + Email Notification]
```

---

## 4. Key Features

### 4.1 Report Generation

* Input: käyttäjä syöttää **domain** (+ optional GA4 property ID).
* Backend tallentaa jobin queueen.
* Claude Code Worker:

  * Kutsuu MCP-työkaluja (crawl, SEO data, CRO screenshots, competitor data).
  * Claude sub-agentit (prompt engineering):

    * SEO Agent → keyword gap, metadata.
    * CRO Agent → Playwright screenshot analyysi.
    * Content Agent → blogi-ideat, meta descriptions.
    * Competitor Agent → kilpailija vs asiakas analyysi.
  * Generoi raportin (Markdown/JSON).
  * Renderöi PDF\:ssä → tallennus storageen.
* Next.js API palauttaa linkin, kun valmis.

### 4.2 Report Tiers

* **Lite:** snapshot (tekninen SEO, nopeus, keyword gap).
* **Pro:** full analysis (SEO, CRO, kilpailija, tehtävälista).
* **Elite:** Pro + GA4-integraatio + export-to-tasklist (CSV/Asana/Notion).
* **Tasklist Pro:** Elite + projektisuunnitelma.

### 4.3 GA4 Integration

* Käyttäjä syöttää mittauskokonaisuuden tunnuksen (Property ID).
* Ohje: miten lisätä meidän service account “read accessiksi”.
* MCP-agentti hakee GA4 datan ja Claude Code generoi selkokielisen yhteenvedon.

### 4.4 Dashboard (Premium Feature)

* Authenticated käyttäjä voi nähdä:

  * Keyword ranking trends (DataForSEO MCP).
  * Traffic overview (GA4 MCP).
  * Site performance (Playwright + Lighthouse MCP).
  * CRO metrics.
* Next.js SSR/ISR: Dashboard UI Metabase-tyyliin.
* Cron-job daily data refresh.

### 4.5 Notifications

* Kun raportti valmis → käyttäjälle sähköposti + linkki.
* (Future) WebSocket/Server-Sent Events live-status.

---

## 5. User Flows

**Flow A: Raportin osto ja generointi**

1. Käyttäjä kirjautuu / rekisteröityy (NextAuth + Supabase).
2. Valitsee raporttityypin (Lite, Pro, Elite, Tasklist Pro).
3. Maksu Stripe Checkoutin kautta.
4. Syöttää domainin (+ optional GA4 property ID).
5. Next.js tallentaa jobin jonoon.
6. Claude Code Worker generoi raportin MCP-työkaluilla.
7. PDF tallennetaan Supabase Storageen.
8. Käyttäjä saa emailin + download linkin.

**Flow B: Dashboard Subscription**

1. Käyttäjä ostaa dashboard-tilauksen (Stripe subscription).
2. Next.js aktivoi premium dashboardin.
3. Claude Code Worker hakee datan säännöllisesti.
4. Dashboard päivittyy UI\:ssa.

---

## 6. Non-Functional Requirements

* **Scalability:** Claude Code Workers voidaan skaalata horisontaalisesti.
* **Security:** GA4-tietojen käsittely vain read-accessilla. Data encrypted at rest (Supabase).
* **Performance:** Raportin luonti ≤ 5 min (status-check UI).
* **Reliability:** Job Queue retry-mechanism (BullMQ).

---

## 7. Future Extensions

* Competitor Radar (notifies when competitor publishes new content).
* One-Click Landing Page Generator (Claude + Firecrawl).
* Agency Portal (markkinointitoimistot voivat ostaa raportteja bulkissa).

---

## 8. Milestones

**Phase 1 (MVP):**

* Next.js SaaS Starter → Auth + Stripe + Basic UI.
* Lite Report (domain input → PDF output).
* Queue + Claude Worker + Firecrawl + DataForSEO integration.

**Phase 2:**

* Pro/Elite Reports.
* GA4 MCP integration.
* Tasklist export (CSV).

**Phase 3:**

* Dashboard subscription.
* Competitor Radar.
* Agency Partner mode.

---

Tässä rungossa on nyt **tekninen selkäranka + liiketoiminnan paketointi**.

👉 Haluatko, että teen sulle vielä **tarkan tietomallin (DB schema)** raportteja ja käyttäjiä varten, niin voidaan alkaa mallintaa miten Next.js ja Supabase tallentavat raportti-jobit ja raportin tilan?
