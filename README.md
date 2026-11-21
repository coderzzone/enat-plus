# Enat Plus (እናት ፕላስ) - Maternal Health Companion for Ethiopia

> **"Every Week Matters. Every Mother Matters."**  
> A mobile-first, consent-driven maternal health companion and clinic coordination platform designed for Ethiopia.

---

## 1. Overview & Architecture

Enat Plus is built as a single unified platform with two tailored interfaces powered by a single Supabase Postgres backend:

1. **Mother App (`/(mother)/app`)**: Mobile-first responsive web application (PWA-ready) designed for low-bandwidth environments. Mothers can track pregnancy gestational age and trimester milestones, read weekly educational guides, maintain self-recorded health measurements (blood pressure, weight, symptoms), set appointment/medication reminders, and explicitly control clinic data sharing.
2. **Clinic Dashboard (`/(clinic)/clinic`)**: Desktop-optimized clinical workstation for midwives, nurses, and obstetricians to enrol patients, book antenatal care checkups, triage follow-ups for missed appointments, and export cohort reports.
3. **Privacy & Row Level Security (RLS)**: Clinics can **never** see unconsented data. Data sharing is explicit, opt-in (default OFF), granular (three independent scopes: `pregnancy_summary`, `appointments`, `health_records`), and immediately revocable. Every clinic access event is written to an immutable `audit_log`.

---

## 2. Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS (Warm stone aesthetic, soothing `#0f766e` Ethiopian teal)
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security & Auth)
- **Icons**: Lucide React
- **Deploy Target**: Vercel

---

## 3. Demo Credentials

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Clinic Admin** | `admin@stpaulclinic.et` | `EnatDemo123!` | Dr. Abebech Gobena (St. Paul MCH Clinic) |
| **Clinic Staff / Nurse** | `nurse.tigist@stpaulclinic.et` | `EnatDemo123!` | Nurse Tigist Mengistu (St. Paul MCH Clinic) |
| **Consented Mother** | `mother.chaltu@example.com` | `EnatDemo123!` | Chaltu Desta (Enrolled, shares summary + appointments) |
| **Independent Mother** | `mother.leman@example.com` | `EnatDemo123!` | Leman Kedir (100% private, no clinic connection) |

---

## 4. Setup & Running Locally

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Provide your Supabase Project URL and Anon Public Key:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: Run Database Migrations & Seed
Execute the SQL files in your Supabase SQL Editor (or via Supabase CLI):
1. **Schema & Strict RLS Policies**: `supabase/migrations/001_initial_schema_and_rls.sql`
2. **Seed Data (Orgs, Staff, Content, Demo records)**: `supabase/seed.sql`
3. *(Optional)* **RLS Verification Checklist**: `supabase/tests/rls_verification_checklist.sql`

### Step 4: Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. 5-Step End-to-End Demo Script

Follow these 5 steps to verify the entire platform lifecycle:

### Step 1: Clinic Invites Mother
1. Log into the Clinic Portal at `/login` using `nurse.tigist@stpaulclinic.et` / `EnatDemo123!`.
2. Navigate to **Invite Patient** (`/clinic/invite`).
3. Enter patient name: `Bethlehem Tadesse`, phone: `+251944556677`.
4. Click **Generate Invitation & QR Code**. Copy the invitation code (e.g., `ENAT-DEMO-2026`).

### Step 2: Mother Joins via Invitation Link or Code
1. Open an Incognito window (or log out) and log in as `mother.leman@example.com` / `EnatDemo123!`.
2. Go to **Clinic & Privacy** (`/app/clinic`).
3. Notice: She is in **Independent Mode Active** (no clinic can see her records).
4. In the "Connect to Your Clinic" box, enter the invitation code: `ENAT-DEMO-2026` (or visit `/join/ENAT-DEMO-2026`) and click **Connect**.
5. Mother is now enrolled with *St. Paul Maternal & Child Health Clinic*.

### Step 3: Mother Toggles Sharing Scopes
1. On the Clinic & Privacy screen (`/app/clinic`), notice all three sharing scopes default to **OFF** (`pregnancy_summary`, `appointments`, `health_records`).
2. Toggle **ON** `Pregnancy Summary` and `Appointments Coordination`.
3. Keep `Health Records & Logs` toggled **OFF**.

### Step 4: Clinic Observes Only Consented Data
1. Switch back to the Clinic window as Nurse Tigist (`/clinic`).
2. The patient list now displays Bethlehem.
3. Open Bethlehem's chart (`/clinic/patient/[id]`).
4. **Verified**: The clinic sees her current week, trimester, and EDD (`pregnancy_summary`).
5. **Verified**: The health records section displays `Not sharing - Health records are hidden by patient privacy settings.`
6. An entry has been recorded in `audit_log` with action `view_patient_detail`.

### Step 5: Mother Revokes Access & Clinic Access Disappears Instantly
1. In the Mother's window (`/app/clinic`), toggle **OFF** `Pregnancy Summary`.
2. Instantly, `revoked_at` is set on the consent record in Postgres.
3. Switch to the Clinic window and refresh the patient chart.
4. **Verified**: The pregnancy overview instantly locks to `Not sharing`. Supabase RLS returns zero pregnancy rows to the clinic staff.

---

## 6. Safety & Non-Negotiable Medical Guardrails

1. **Safety Notice**: Displayed on first launch and in all footers:
   > *"Enat Plus provides general information and does not replace advice from your healthcare professional. If you feel unwell or have warning signs, contact your clinic or go to the nearest health facility."*
2. **Zero Diagnostic Claims**: No risk scoring, triage, clinical advice, or medication prescriptions anywhere in the codebase.
3. **Medication Reminder Safeguard**: Reminders explicitly clarify: *"Only take medicines already prescribed by your healthcare professional."*
4. **Draft Educational Content**: All 40 weeks of fetal development content carry a clear `Draft - pending clinical review` badge.

---

## 7. Scope & Simplification Log

### Out of Scope (Deliberately Excluded)
- Super-admin dashboard
- Subscriptions & mobile payments
- Telemedicine & video chat
- Diagnostic AI & automated risk scoring
- Hospital EMR HL7/FHIR integrations

### Stretch Features Implemented
- **Amharic UI Scaffold**: Core Amharic maternal translations in `src/lib/i18n.ts`.
- **PWA Manifest & App Icon**: Configured `manifest.json` and SVG maternal icon in `/public`.
- **Audit Logging**: Dedicated `audit_log` table tracking staff access and consent grants/revocations.

---

## 8. Deploying to Vercel

1. Push this repository to GitHub or GitLab.
2. Import the project into Vercel.
3. Add the two environment variables in Project Settings > Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy! The project builds cleanly with `next build`.
# enat-plus
