# LabReady Pro — Business Plan

**Clinical Laboratory Training. Competency. Compliance.**
*Built by laboratory professionals, for laboratory professionals.*

The course is the entry product. The competency system is the recurring product. The lab and hospital licence is where the money is. The AI supervisor assistant becomes the moat. Start with Chemistry.

---

## Build status

| Piece | Where | State |
|---|---|---|
| Landing page with pilot form | `labready/index.html` | Live on branch; form needs `supabase-schema.sql` run |
| QC Troubleshooting Assistant (demo) | `labready/qc-assistant/` | Working in-browser; drafts saved locally, prints a signed record |
| QC Failure Investigation Checklist (lead magnet) | `labready/resources/qc-failure-checklist.html` | Ready to print / share |
| Six-element competency record | `labready/forms/competency-record.html` | Ready; fill on screen or print blank |
| Module viewer | `labready/modules/` | Renders modules as web pages; toggle hides the **[CHECK]** review notes |
| Modules 1–10 (full Chemistry Competency System curriculum) | `labready/content/module-*.md` | Draft v0.1, needs Elie's review of **[CHECK]** items |
| Multi-user app: dashboard, staff, test systems, scheduling, six-method records, sign-off, CSV/JSON export | `labready/app/` | Live on Supabase project "LabReady Pro" (wshmcrkutgglomdadtoj). Schema applied and security-tested on the live database |
| Record integrity: server-stamped signatures, lock on sign-off, no deleting signed records, tamper-proof history | `labready/supabase-app-schema.sql`, `labready/app/` | Built and tested on a local Postgres; mirrored in demo mode |
| Weekly email reminders (overdue + due in 30 days) to admins/supervisors | `labready/supabase/functions/competency-reminders/`, `labready/supabase/reminders-cron.sql` | Code written, email logic unit-tested; needs Supabase project, Resend account and deploy |
| Module quizzes: 80 multiple-choice questions (8 per module), shuffled answers, pass mark 80% | `labready/content/quizzes.js`, `labready/assets/quiz.js` | On every module page for self-study; in the app, "Run a module quiz" fills competency method 6. Draft v0.1, review with the modules |
| Reports: competency matrix and inspection packet (cover + one page per signed-off record with methods, signatures and history) | `labready/app/` (Reports tab) | Built; prints one record per Letter page |
| Spreadsheet import for staff and test systems (paste from Excel/Sheets or CSV, preview, duplicate and date checks) | `labready/app/` (Staff and Test systems pages) | Built; up to 500 rows per import |
| Quiz links: a supervisor sends a single-use link, the tech takes the quiz on their own device (no account), the database marks it and the score can go into method 6 | `labready/quiz/`, `labready/app/`, `labready/supabase-quiz-keys.sql` | Live on the LabReady Pro database. Links expire after 14 days and can be cancelled; every step is in the record history. After editing a quiz, run `node labready/tools/build-quiz-keys.mjs` and apply the SQL it writes |
| Study worksheets: lot-to-lot, method comparison (Deming and least squares, bias at decision levels, scatter and difference plots) and AMR / calibration verification, judged against limits the lab enters, printable with sign-off lines | `labready/worksheets/` | Built; calculations unit-tested (`node --test labready/worksheets/stats.test.mjs`). Standalone drafts stay in the browser |
| Studies in the app: worksheets saved to the lab, Studies tab with result and review status, director/supervisor sign-off stamped by the database and locking the study | `labready/app/` (Studies tab), `labready/worksheets/?study=…` | Live on the LabReady Pro database. Signed-off studies print in the inspection packet (Reports tab), one page each, with results recalculated from the saved data |
| QC investigations in the app: the QC Troubleshooting Assistant saves to the lab (`?record=…`), QC tab lists open and closed events, supervisor sign-off stamped by the database, signed investigations print in the inspection packet | `labready/qc-assistant/`, `labready/app/` (QC tab), `labready/assets/records.js` | Live on the LabReady Pro database (stored in `studies` with kind `qc`). The standalone assistant still saves to the browser |

---

## 1. Positioning

| | |
|---|---|
| **Buyer** | Laboratory managers, supervisors, directors, quality managers, hospital lab leadership, reference labs, lab networks |
| **User** | Bench technologists (MLS/MLT), new hires, preceptors |
| **Core promise** | Train your laboratory staff. Document competency. Standardise QC. Stay inspection-ready. |
| **Why they pay** | Cuts supervisor and preceptor hours, makes competency documentation complete and on time, standardises QC investigation, reduces inspection anxiety |
| **Unfair advantage** | ~40 years of bench experience: QC failures, PT, lot-to-lot, correlations, instrument implementation, Roche Cobas Pure and Abbott ARCHITECT, blood-bank problem solving |

**Market signals to cite (verify each before using in sales material):**
- ASCP (June 2026): AMA adopted policy calling for stronger lab training and recruitment in response to the workforce shortage.
- ASCP's Basic Medical Laboratory Skills package exists because new hires arrive with uneven preparation and consume preceptor/director time.
- CAP describes six competency-assessment elements; nonwaived testing is generally assessed semiannually in the first year, annually after.
- CAP sells an annual Competency Assessment Hub, so labs already budget for this category.

**Legal guardrail.** Never reproduce CAP (or TJC/COLA) checklist text. Build original tools that help labs organise evidence around the requirements that apply to them, and point customers to their accreditor's official materials. Keep the disclaimer on every page and document. Get a one-hour review from a healthcare attorney before the first paid contract (terms of service, liability limits, data handling).

---

## 2. Product architecture

```
LabReady Pro
├── Organisation (lab / hospital / network)
│   ├── Sections (Chemistry, Blood Bank, …)
│   ├── Test systems / instruments (Cobas Pure 1, ARCHITECT c4000 …)
│   └── Users (tech, preceptor, supervisor, director, admin)
├── Content library
│   ├── Modules → lessons → question bank → cases
│   └── Instrument packs
├── Competency engine
│   ├── Competency package = test system × 6 elements × schedule
│   ├── Evidence (observations, record reviews, blind samples, quiz scores)
│   └── Sign-off chain (assessor → supervisor → director)
├── Workflows
│   ├── QC Troubleshooting Assistant (guided investigation → corrective-action record)
│   ├── Lot-to-lot, correlation, AMR worksheets
│   └── Corrective-action tracking
├── Supervisor dashboard + reminders (30/14/7 days before due)
├── Document generator (PDF export of every record)
└── (Phase 3) AI Supervisor Assistant
```

**Six-element mapping** used everywhere in the product:
1. Direct observation of routine test performance (incl. patient ID and specimen handling)
2. Monitoring recording and reporting of results (incl. critical values)
3. Review of intermediate results, QC records, PT results and maintenance records
4. Direct observation of instrument maintenance and function checks
5. Assessment using previously analysed specimens, blind samples or PT samples
6. Assessment of problem-solving skills

**Suggested stack (lean, solo-founder friendly):** Supabase (auth, Postgres with row-level security per organisation, storage for PDFs) + a Next.js or Lovable-built front end on Vercel + Stripe for invoicing. Labs mostly pay by invoice/PO, so Stripe Invoicing matters more than checkout. No PHI is ever needed: staff names and training records only. State this plainly in the security one-pager because IT and compliance will ask.

---

## 3. MVP — "LabReady Chemistry Competency System"

**Goal:** a lab can run its entire annual chemistry competency cycle inside LabReady Pro and hand an inspector a clean, signed record for each person.

**In scope (V1):**
- Organisation, users, roles (tech / supervisor / director)
- 10 chemistry modules (below), each with lesson, 15–25 question bank, 1+ case, observation form
- Competency packages per test system with the six elements and new-hire / 6-month / annual schedules
- Electronic sign-off with name, date, role
- Supervisor dashboard: complete / due in 30 days / overdue; per-person and per-instrument views
- Email reminders
- QC Troubleshooting Assistant (guided checklist → saved investigation → corrective-action PDF)
- Worksheets: lot-to-lot, correlation, AMR/calibration verification
- PDF export of every competency record and worksheet

**Out of scope for V1:** LIS integration, SSO, automatic QC data import, AI assistant, other departments, mobile app. Say "on the roadmap" and log who asks.

**Concierge first.** Before writing software, deliver the first 2–3 pilots with well-designed PDFs/Google Forms + a shared spreadsheet dashboard maintained by hand. This proves labs will use and pay for the content while the software is built.

---

## 4. The first 10 competency modules

| # | Module | Key content | Case | Maps to elements |
|---|---|---|---|---|
| 1 | QC Fundamentals & Westgard Rules | LJ charts, mean/SD/CV, 1-2s/1-3s/2-2s/R-4s/4-1s/10x, rule selection, accept/reject | Level 2 potassium trending 7 points above mean | 3, 6 |
| 2 | QC Failure Investigation | Random vs systematic error, investigation order, patient look-back, when to recalibrate vs replace | Level 3 glucose +2.4 SD, Level 1 OK, ER waiting | 3, 6 |
| 3 | Calibration & Calibration Verification | When calibration is required, reading a failed cal, cal-verification frequency and criteria | Creatinine cal fails after reagent pack change | 4, 6 |
| 4 | AMR, Reportable Range & Dilutions | Linearity studies, auto vs manual dilution, max dilution, reporting > range | Lipase above AMR, auto-dilution flagged | 2, 5 |
| 5 | Reagent Management & Lot-to-Lot | Receipt, storage, on-board stability, new-lot acceptance with patient samples and QC | New glucose lot shows +4% bias | 3, 6 |
| 6 | Instrument Correlation & Method Comparison | Slope, intercept, R², bias at decision points, what R² does *not* tell you | Slope 0.93, R² 0.998 — accept or investigate? | 3, 6 |
| 7 | Proficiency Testing | Treat PT like patients, no inter-lab communication, result review, investigating an unacceptable result | Unacceptable PT calcium | 3, 5 |
| 8 | Critical Values, Delta Checks & Result Review | Notification, read-back, documentation, delta-check follow-up | Potassium 6.9 with haemolysis index high | 1, 2 |
| 9 | Pre-Analytical & Specimen Integrity | HIL indices, wrong tube, IV contamination, mislabels, rejection criteria | Glucose 900 with low chloride pattern — drip arm | 1, 6 |
| 10 | Maintenance, Troubleshooting & Downtime | Daily→annual maintenance, common error codes by category, backup/downtime procedures | Probe clot alarms mid-run | 4, 6 |

Each module ships with: lesson (15–20 min), question bank, case, direct-observation checklist, record-review checklist, completion certificate. Blind-sample (element 5) is a template the lab fills with its own previously analysed specimens.

**Instrument packs (next):**
- Roche Cobas Pure c303/e402 Competency Pack
- Abbott ARCHITECT Chemistry/Immunoassay Competency Pack

Write these from your own experience and describe procedures in your own words. Don't copy manufacturer manuals or screenshots; reference "per the operator's manual" where exact steps matter.

---

## 5. AI features (Phase 3 — after paid validation)

**AI Laboratory Supervisor Assistant.** Training, documentation, workflow and decision support only.

| Feature | Example prompt |
|---|---|
| QC investigation coach | "MultiQual Level 3 is out 2 SD for glucose on Cobas Pure 1. Level 1 is acceptable. What should I investigate?" |
| Competency generator | "Generate an annual competency for Cobas Pure c303 covering electrolytes and chemistry." |
| Worksheet builder | "Create a lot-to-lot comparison worksheet for a new glucose reagent lot." |
| Study interpreter | "Correlation slope 0.93, R² 0.998. What should I investigate before accepting?" |
| Question-bank author | Generates draft questions from a module for supervisor approval |
| SOP-aware answers | Answers grounded in the lab's own uploaded procedures |

**Guardrails:** grounded in LabReady content + the lab's own SOPs; always cites its source; never releases or holds patient results; every output is a draft for a qualified human; no PHI accepted (block and warn); log every interaction for the lab's review. Build on the Claude API with retrieval over the content library.

This is the moat: 40 years of troubleshooting judgement encoded into content + an assistant that uses it.

---

## 6. Pricing

Launch prices, to be validated with the first customers.

| Product | Price |
|---|---|
| Individual technologist membership | $19–$29/month (list $24) |
| Small lab, up to 10 users | $1,500/year |
| Lab department, up to 25 users | $2,500–$3,500/year (list $3,000) |
| Large laboratory, up to 50 users | $4,500–$6,000/year (list $5,000) |
| Hospital / multi-site | $10,000+/year |
| Custom competency implementation | $2,500–$7,500 |
| Custom instrument training package | $1,500–$5,000 |
| Inspection-readiness engagement | Premium, quoted |

**Founding-lab offer:** 60-day free pilot → 30% off year one and launch price locked while subscribed, in exchange for feedback calls, a testimonial if they're happy, and permission to name them as a customer.

**The maths:** 100 labs × $3,000 = $300k ARR. 500 labs × $3,000 = $1.5M ARR, before services and enterprise.

**Budget reality:** many labs spend from an education or quality budget set annually. Ask in every discovery call: "Who signs off on a $3,000 annual tool, and when is your budget set?"

---

## 7. Customer acquisition

**Ideal first customer:** community hospital or mid-size reference lab chemistry department, 8–30 techs, running Roche or Abbott, recently hired new grads or travellers, inspection in the next 12 months.

**Channels, in order:**
1. **Your network.** Every manager, supervisor, director, vendor rep and former colleague from your career. Warm intros convert far better than anything else. Target 50 names in week one.
2. **LinkedIn.** Post 3×/week as yourself: QC cases, "what I'd check first" posts, competency tips. Connect with lab managers and quality managers directly.
3. **Cold email** to lab managers (templates in `sales/labready-outreach.md`), 20/day, personalised.
4. **Free lead magnet:** "QC Failure Investigation Checklist" + "Annual Chemistry Competency Planner" PDFs, gated by email on the site.
5. **Communities:** ASCP, ADLM (formerly AACC), state CLMA/ASCLS chapters, Reddit r/medlabprofessionals (helpful, not salesy). Offer to speak at local chapter meetings on QC troubleshooting.
6. **Vendor-adjacent partners (later):** consultants, lab staffing agencies, travel-tech agencies who need to onboard fast.
7. **Existing course:** Antibody Panel Resolution for Blood Bank Techs buyers are warm leads for the individual membership and for LabReady Blood Bank.

**Sales motion:** email/LinkedIn → 20-min discovery call → 30-min demo on their instrument → 60-day pilot → proposal/quote → PO. Expect 30–90-day cycles; hospitals can take longer. Prepare a one-page security/privacy summary and a W-9 in advance.

---

## 8. Website structure

Live now: the site root `/` (LabReady Pro landing page with pilot request form; CazoTask moved to `/cazotask/`).

Planned pages:
- `/labready/` — Home: promise, problem, system, sample dashboard, founder story, modules, pricing, pilot form, FAQ
- `/labready/chemistry` — Chemistry Competency System detail and module syllabus
- `/labready/instrument-packs` — Cobas Pure and ARCHITECT packs
- `/labready/pricing` — full pricing, add-ons, founding-lab offer, invoice/PO note
- `/labready/about` — your story and credentials
- `/labready/resources` — free checklists (lead magnets), LinkedIn case posts republished as articles
- `/labready/security` — no-PHI statement, data handling, hosting
- `/labready/demo` — book a call (Calendly or Google Calendar booking link)
- Legal: terms, privacy, disclaimer

---

## 9. 90-day plan to the first paying lab

**Days 1–15 — Validate and prepare**
- Confirm company name, domain (labreadypro.com or alternative) and trademark search for "LabReady Pro"
- Form LLC, business bank account, basic liability/E&O insurance quote
- Run `labready/supabase-schema.sql`; set the real inbox in `labready/index.html`
- List 50 warm contacts; send personal messages to 20
- Book 10 discovery calls. Ask about current competency process, pain, budget owner, inspection date
- Write Modules 1 and 2 in full (lesson, questions, case, observation forms)

**Days 16–45 — Concierge pilot**
- Finish Modules 3–6
- Package competency records as fillable PDFs; dashboard as a shared spreadsheet
- Start 2–3 free founding-lab pilots
- Weekly check-in with each pilot; log every request
- LinkedIn: 3 posts/week; publish the QC Failure Investigation Checklist lead magnet
- Begin cold email: 20/day to chemistry managers

**Days 46–75 — Convert and build**
- Finish Modules 7–10
- Build the software MVP (auth, orgs, competency packages, sign-off, dashboard, PDF export) on Supabase + Vercel
- Move pilots from spreadsheets into the app
- Send proposals to pilots at day 45 of their pilot, with founding-lab pricing

**Days 76–90 — First revenue**
- Close first paid lab (target: 1–3 contracts, ~$2,000–$3,000 each at founding price)
- Collect testimonial and before/after numbers (supervisor hours saved, % competencies on time)
- Start the Cobas Pure c303/e402 pack
- Decide the next 90 days based on what pilots actually asked for

**Metrics to track weekly:** conversations started, discovery calls, demos, active pilots, proposals sent, contracts signed, ARR, modules finished.

---

## 10. Product family roadmap

| When | Product |
|---|---|
| Now | LabReady Chemistry (Competency System V1) |
| +3–6 months | Instrument packs: Cobas Pure c303/e402, ARCHITECT |
| +6–9 months | LabReady Blood Bank (built on the Antibody Panel Resolution course) |
| +9–12 months | LabReady Inspection (readiness centre), LabReady AI (supervisor assistant) |
| Year 2 | LabReady Hematology, Coagulation, Microbiology, Supervisor |

---

## 11. Risks and how to handle them

| Risk | Mitigation |
|---|---|
| Long hospital sales cycles | Start with smaller labs and reference labs; individual membership for cash flow |
| Accreditor content/IP | Original content only; disclaimer; refer to official checklists |
| Manufacturer IP | Own words, no manual copying or screenshots; nominative use of product names |
| Liability for lab decisions | Clear terms: educational/documentation support; lab SOPs and director approval govern |
| Solo-founder bandwidth | Concierge first; don't build software until 2–3 labs are using the content |
| Competitors (CAP Competency Hub, MediaLab, LMS vendors) | Win on bench-level depth, instrument specificity, troubleshooting cases, and price for small/mid labs |
