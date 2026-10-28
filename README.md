# CaseConnect 🏛️⚖️
### AICTE Integrated Complaint Monitoring & Inter-Bureau Coordination System

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![SIH](https://img.shields.io/badge/Smart_India_Hackathon-SIH_2024-orange?style=for-the-badge)](https://www.sih.gov.in/)

---

## 📌 Executive Summary

**CaseConnect** is a unified, enterprise-grade statutory case management and cross-bureau coordination platform engineered for the **All India Council for Technical Education (AICTE)**. 

In technical education governance, grievances and non-compliance issues often span multiple independent departments—most notably the **Public Grievance Redressal Cell (PGRC)** (handling student, faculty, and guardian grievances) and the **Regulation Bureau (RB)** (enforcing statutory approval norms, faculty-cadre ratios, and institutional standards).

Prior to CaseConnect, departmental silos led to:
- **Duplicate investigations** against the same institution for interrelated issues.
- **Conflicting directives or uncoordinated hearings** across bureaus.
- **Statutory 45-day SLA breaches** due to fragmented tracking.
- **Lack of unified executive visibility** for AICTE Senior Leadership.

CaseConnect bridges this gap by introducing an **Intelligent Overlap Detection Engine**, real-time inter-bureau coordination workflows, an immutable audit trail, automated SLA escalation tracking, and a dedicated compliance portal for educational institutions.

---

## 🚀 Key Platform Features

### 1. 🛡️ Senior Management Oversight (`/management`)
- **Centralized Case Monitoring**: Macro-level visibility across 1,400+ active complaints spanning all AICTE approved institutions across India.
- **Cross-Bureau Overlap Alerts**: Instant notifications when parallel cases arise across PGRC and Regulation Bureau for the same campus.
- **SLA Breach & Escalation Radar**: Automatic flagging of cases approaching or exceeding the 45-day statutory resolution threshold.
- **Interactive Visualizations**: Real-time charts powered by Recharts (regional case density, bureau workload splits, status donuts).
- **Executive Action Matrix**: Direct intervention capabilities (assign priority, flag for vigilance, append management directives).

### 2. 👥 Public Grievance Redressal Cell (PGRC) Portal (`/pgrc-dashboard`)
- **Docket Lifecycle Management**: Scrutiny, triage, and resolution workflows for complaints from students, faculty, and parents.
- **Overlap Triage Station**: Review similarity match scores (e.g., fee fraud vs. capitation fee violations) with the Regulation Bureau.
- **Inter-Bureau Coordination Channel**: Issue formal requests to the Regulation Bureau for joint hearings, inspection records, or historical audits.
- **Hearing & Inquiry Logs**: Schedule and record inquiry panel sessions and outcomes.

### 3. ⚖️ Regulation Bureau (RB) Portal (`/regulation-dashboard`)
- **Statutory Compliance & Standards Auditing**: Track cases concerning faculty cadre ratios, unapproved intake, infra deficit, and capitation fees.
- **Regulatory Notice Dispatcher**: Issue formal notices (*Show Cause*, *Clarification*, *Hearing Summons*, *Deficiency Warning*) directly to institutions with statutory response deadlines.
- **Institutional Scrutiny Ledger**: Evaluate submitted compliance documents and evidence packs before recommending punitive or corrective actions.

### 4. 🏫 Approved Institution Portal (`/institution-dashboard`)
- **Inward Regulatory Notice Hub**: View pending notices and hearing summons issued by AICTE bureaus.
- **Compliance Response Submission**: Formally submit replies, justification letters, and multi-file document evidence.
- **Grievance Resolution Tracker**: Transparent timeline tracking institutional grievance redressal performance.
- **Institutional Profile & Nodal Office**: Maintain verified institutional contacts, Principal details, and accreditation records.

### 5. 🔍 Intelligent Overlap Detection Engine
- Automated heuristic analysis evaluating:
  - **Entity Matching**: AICTE permanent institution code and campus name.
  - **Thematic Correlation**: Complaint taxonomy, subject line tokens, and case summaries.
  - **Temporal Proximity**: Date of occurrence and submission timelines.
- Generates **Similarity Confidence Scores (0–100%)** with explainable match reasons.
- Supports definitive triage states: *Awaiting Review*, *Confirmed Related*, *Confirmed Duplicate*, *Separate Matters*, and *Requires Further Investigation*.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components) |
| **Core UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict typing across domain models & DB schemas) |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/) with Turbopack, Custom Government Theme Palette |
| **Icons & Micro-interactions** | [Lucide React](https://lucide.dev/), [Framer Motion 14](https://www.framer.com/motion/) |
| **Data Visualizations** | [Recharts 3](https://recharts.org/) (Responsive Container, Bar, Donut, Area charts) |
| **Database & Auth Backend** | [Supabase PostgreSQL](https://supabase.com/) with Row Level Security (RLS) & Triggers |
| **Server-Side Data Layer** | `@supabase/supabase-js`, `server-only` isolation for database secrets |
| **Test & Validation Harness**| Automated end-to-end integration test suite (`tsx tests/migration.test.ts`) |

---

## 📂 Project Architecture

```
CaseConnect/
├── .env.example                     # Environment template for local & production setups
├── AGENTS.md                        # Framework & tooling behavioral guidelines
├── package.json                     # Dependency manifests and run scripts
├── scripts/
│   └── seed.ts                      # Deterministic Supabase database seeder
├── supabase/
│   └── migrations/
│       └── 0001_initial_schema.sql  # PostgreSQL schema, indices, and RLS policies
├── tests/
│   └── migration.test.ts            # Integration & health testing suite
└── src/
    ├── app/                         # Next.js 16 App Router
    │   ├── api/                     # REST API endpoints
    │   │   ├── case-history/        # Immutable audit trail ledger
    │   │   ├── complaints/          # Complaint CRUD & multi-criteria filtering
    │   │   ├── coordination/        # Inter-bureau coordination requests
    │   │   ├── health/              # System & DB connectivity health check
    │   │   ├── institution/         # Institution responses & profile updates
    │   │   ├── institutions/        # Directory & compliance aggregations
    │   │   ├── notices/             # Statutory regulatory notice generation
    │   │   └── overlaps/            # Overlap alerts & review state changes
    │   ├── institution-dashboard/   # Institution portal (Notices, Cases, Compliance)
    │   ├── management/              # Senior Management Executive Oversight
    │   ├── pgrc-dashboard/          # Public Grievance Redressal Cell operations
    │   ├── regulation-dashboard/    # Regulation Bureau statutory compliance
    │   ├── globals.css              # Global styles & Tailwind CSS v4 imports
    │   ├── layout.tsx               # Root application layout & metadata
    │   └── page.tsx                 # Interactive multi-role portal login & launchpad
    ├── components/
    │   ├── charts/                  # Recharts wrappers (Workload, Status, Region)
    │   ├── dashboard/               # Modals, attention tables, detail drawers, KPI cards
    │   └── layout/                  # Responsive navigation sidebars & header bars
    ├── data/
    │   └── mockData.ts              # Fallback deterministic seed records
    ├── lib/
    │   ├── db.ts                    # DB entity mappers and helpers
    │   ├── managementStore.ts       # Central management client state & filter logic
    │   ├── institution-context.tsx  # Scoped context provider for institution portal
    │   ├── utils.ts                 # Formatting & class merging utilities
    │   └── supabase/
    │       ├── server.ts            # Secure server-only Supabase client singleton
    │       └── types.ts             # Auto-generated & strict database types
    └── types/
        └── dashboard.ts             # Enterprise TypeScript domain definitions
```

---

## 🗄️ Database Schema & Data Models

The database runs on Supabase (PostgreSQL) with strict foreign keys, specialized indexes, and Row Level Security (RLS):

1. **`complaints`**: Core case repository tracking case numbers (`AICTE/PGRC/2026/...`), bureau assignments, complainant types, SLA countdowns, priority, and raw payload data.
2. **`overlap_alerts`**: Tracks cross-bureau overlapping pairs (`case1_id` ⟷ `case2_id`), similarity scores (e.g. 92%), matching reasons, rule triggers, and officer review state.
3. **`case_history`**: Chronological audit trail recording all state transitions, status updates, officer remarks, and timestamps.
4. **`coordination_requests`**: Inter-bureau communication tickets facilitating joint investigations between PGRC and RB.
5. **`regulatory_notices`**: Formal statutory notices issued to non-compliant institutions with fixed response windows.
6. **`institution_responses`**: Official filings submitted by institutions in response to grievances or regulatory notices.
7. **`institution_profiles`**: Comprehensive institutional directory covering approval codes, regions, nodal officers, and accreditations.

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: `v20.x` or later
- **npm** / **yarn** / **pnpm**
- A **Supabase** project (free-tier PostgreSQL instance or local Supabase CLI)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/CaseConnect.git
cd CaseConnect
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase connection parameters:
```env
# Supabase API URL
SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase Keys (Service Role Key recommended for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Fallback / Anon Key
SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run Database Migrations
Execute the SQL migration located at `supabase/migrations/0001_initial_schema.sql` inside your Supabase SQL Editor. This initializes all 7 tables, performance indexes, and RLS policies.

### 4. Seed the Database
Populate your database with deterministic test cases, institutions, and overlap alerts:
```bash
npm run seed
```

### 5. Launch the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🧪 Verification & Test Suite

CaseConnect includes an automated integration test suite that tests API routes, server database queries, CRUD lifecycles, and health endpoints:

```bash
npm run test
```

### Test Coverage Highlights:
- ✅ Supabase server client initialization & secret isolation
- ✅ Health probe check (`/api/health`)
- ✅ Case filtering, pagination, and retrieval (`/api/complaints`)
- ✅ Cross-bureau overlap detection status queries (`/api/overlaps`)
- ✅ Case creation, updates, and audit logging (`/api/case-history`)
- ✅ Inter-bureau coordination request dispatch (`/api/coordination`)
- ✅ Regulatory notice issuance & institutional compliance responses (`/api/notices`, `/api/institution/*`)

---

## 🔑 Demo Access Personas

The landing page (`/`) features one-click role credentials configured for evaluation:

| Role | Persona / Title | Demo Login Email | Primary Route |
| :--- | :--- | :--- | :--- |
| **Senior Management** | AICTE Director / Executive Officer | `director.pgrc@aicte-india.org` | `/management` |
| **PGRC Official** | Scrutiny Officer, Grievance Cell | `pgrc.scrutiny@aicte-india.org` | `/pgrc-dashboard` |
| **Regulation Official** | Officer, Regulation & Standards Bureau | `regulation.bureau@aicte-india.org` | `/regulation-dashboard` |
| **Approved Institution** | Principal / Nodal Officer, Apex Tech | `principal@apextech.edu.in` | `/institution-dashboard` |

> *Default demo password:* `demopass123` or `password123`

---

## 🌐 API Reference Overview

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Returns database connectivity status and case totals |
| `/api/complaints` | `GET`, `POST` | Query grievances with bureau/status filters or file new cases |
| `/api/complaints/[id]`| `GET`, `PATCH`, `DELETE` | Retrieve case by ID, mutate status/priority, or archive |
| `/api/overlaps` | `GET`, `PATCH` | Retrieve active cross-bureau overlap alerts and update review state |
| `/api/coordination` | `GET`, `POST`, `PATCH` | List and dispatch inter-bureau coordination tickets |
| `/api/notices` | `GET`, `POST` | Issue and inspect statutory regulatory notices |
| `/api/institution/responses` | `GET`, `POST` | Retrieve and submit institutional compliance filings |
| `/api/institutions` | `GET` | Query AICTE approved institution directory & metrics |
| `/api/case-history` | `GET`, `POST` | Fetch or append to the immutable chronological audit ledger |

---

## 🔮 Future Enhancements

- **NLP-Powered Auto-Triage**: Embedding-based similarity engine using domain-specific LLMs for automated categorization of raw grievance narratives.
- **DigiLocker Integration**: Verification of land ownership documents, AICTE approval letters, and fee receipts directly via DigiLocker APIs.
- **Multilingual Grievance Portal**: Voice-to-text and translation support across 22 scheduled Indian languages via Bhashini.
- **Automated Hearing Notice Dispatch**: Automated SMS/WhatsApp notifications and calendar integration for committee hearing sessions.

---

## 👥 Hackathon Team & Acknowledgments

Developed with ❤️ for the **Smart India Hackathon (SIH)** under the problem statement for the **All India Council for Technical Education (AICTE)**.
