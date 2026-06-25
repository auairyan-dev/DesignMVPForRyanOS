# RyanOS MVP — Implementation Plan

## Context

RyanOS is an AI operating system for Australian trade businesses — combining AI phone receptionist, job booking, quoting, CRM, calendar, and analytics into a single premium dark-mode dashboard. The owner (e.g. Ryan Thomas, Alpine Fresh Property Maintenance, Albury-Wodonga) is non-technical and should feel in control within 30 seconds. Three uploaded source-of-truth documents define the product, visual design, and screen-to-screen workflows.

This plan produces a fully interactive, navigable React MVP in `src/app/App.tsx` with:
- All 16+ desktop screens connected by sidebar navigation
- 4 mobile owner screens (responsive, bottom nav)
- Real Australian trade-business sample data throughout
- Every screen answering: What happened? What needs attention? What do I do next?

---

## Step 1 — Update design tokens (`src/styles/theme.css`)

Replace the current light/dark tokens with RyanOS-specific dark-mode-first palette. Preserve the `@theme inline` block and all token names so Tailwind classes continue to compile.

Key overrides for `:root` (dark mode default):
```
--background:  #0F1115
--card:        #171A20       (Surface 1)
--secondary:   #1E222A       (Surface 2)
--accent:      #252A33       (Surface 3 / hover)
--border:      #2B303A       (Border subtle)
--foreground:  #F4F6FA       (Text primary)
--muted-foreground: #B8C0CC  (Text secondary)
--muted:       #7F8998       (Text muted)
--primary:     #4F7CFF       (Brand blue)
--primary-foreground: #ffffff
--destructive: #FF5C5C
--ring:        #4F7CFF
```

Add custom CSS vars for status colours (not in token contract, used directly):
```
--color-success: #3CCF91
--color-warning: #F5B942
--color-danger:  #FF5C5C
--color-info:    #5CC8FF
--color-ai:      #A78BFA
```

Increase `--radius` to `0.75rem` (12px) for premium card feel.

---

## Step 2 — Load Inter font (`src/styles/fonts.css`)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;550;600;700&display=swap');
```

Apply via `font-family: 'Inter', system-ui, -apple-system, sans-serif` on body.

---

## Step 3 — Architecture of `src/app/App.tsx`

Single file, ~2500–3500 lines. Structure:

```
1. Sample data constants (customers, jobs, calls, quotes)
2. Type definitions (minimal, inline)
3. Utility helpers (badge colour fn, confidence colour fn, formatCurrency, formatDate)
4. Shared micro-components (Badge, StatusPill, MetricCard, AIConfidence, Button, Avatar)
5. Layout: AppShell (sidebar + topbar + main area)
6. Screen components (one per section, ~16 desktop + 4 mobile)
7. App() root — useState for active screen, renders AppShell or MobileShell
```

Navigation state: `const [screen, setScreen] = useState<Screen>('dashboard')` where `Screen` is a union type of all screen names. Sub-views (e.g. call detail from calls list) use a second `useState` for selected record ID.

**No React Router needed** — pure state switching.

---

## Step 4 — Sample data

Realistic Australian constants at top of file:

**Business:** Alpine Fresh Property Maintenance · Ryan Thomas · Albury-Wodonga

**Customers (6):**  
Sarah Thompson (Albury), Mick Harris (Wodonga), Darren Cole (Lavington), Anne McKenzie (Thurgoona), Paul Nguyen (Wangaratta), Emma Roberts (Beechworth)

**Jobs (8):**  
Leaking hot water system · Split system not cooling · Blocked gutter · Chimney sweep · Water tank clean (2 tanks) · Roof leak inspection · Emergency plumbing call-out · Downpipe replacement

**Calls (10):** Mix of booked, needs review, missed, emergency, spam — with duration, transcript snippet, AI confidence, outcome

**Quotes (5):** Draft, needs approval, sent, viewed, follow-up due

**Metrics:** 34 calls this week · 27 AI answered · 8 jobs booked · $4,850 revenue · 3 missed recovered · 2 low-confidence reviews pending

---

## Step 5 — Desktop screens (16 screens)

### 1. Dashboard
- Top KPI row: 4 metric cards (Calls answered · Jobs booked · Pending quotes · Revenue today)
- Today's schedule strip (time-ordered job cards)
- "Needs attention" column (missed calls, low-confidence calls, quote approvals due)
- Live activity feed (AI answered · job booked · SMS sent events)
- AI recommendations panel (3–4 actionable cards with "Call back" / "Approve" / "Review" buttons)
- Revenue sparkline (mini bar chart using recharts)

### 2. Calls list
- Filter tabs: All · Booked · Needs Review · Missed · Emergency · After Hours
- Table rows: Time · Caller · Reason · Outcome badge · AI confidence · Job created · Action
- Each row opens Call Detail

### 3. Call Detail
- Back breadcrumb
- AI summary card (purple tint)
- Audio player mockup with waveform
- Full transcript panel (alternating AI/Customer bubbles)
- Extracted fields panel: Name · Phone · Address · Job type · Urgency · Estimate range · Confidence
- Linked job card + Linked customer card
- Owner action buttons: Approve booking · Edit job · Send SMS · Call customer · Create quote · Mark resolved

### 4. Jobs list
- View toggle: List / Board (kanban columns by status)
- List columns: Time · Customer · Job type · Suburb · Status · Value · Technician · Action
- Board: columns New · Booked · Confirmed · In Progress · Completed · Invoiced
- Filter by: Status · Date · Technician · Urgency

### 5. Job Detail
- Header: job title + status pill + primary action button (contextual)
- Customer card (name, phone, address, SMS/call buttons)
- Schedule card (date/time, technician assigned)
- AI summary card
- Job notes
- Quote/invoice mini-cards
- Timeline of events
- Internal notes input

### 6. Customers list
- Search + filter by type
- Table: Name · Suburb · Last contact · Lifetime value · Open jobs · Status

### 7. Customer Detail
- Contact header (name, phone, email, suburb, tags, AI summary pill)
- Property section
- Vertical timeline (calls, quotes, jobs, invoices, SMS)
- Tabs: Jobs · Quotes · Invoices · Calls · Notes
- Owner actions: Call · SMS · Create job · Create quote

### 8. Quotes list
- Status tabs: All · Needs Approval · Sent · Viewed · Follow-up Due · Accepted · Declined
- Table: Quote # · Customer · Job type · Amount · Status · Sent · Next action
- Amber highlight on follow-up due items

### 9. Quote Detail / Approval
- Quote summary header
- Customer + job info
- AI estimate reasoning section ("Based on 8 similar chimney sweep jobs…")
- Line items table (editable)
- Confidence badge + "Owner approval recommended" note
- Actions: Approve & Send · Edit · Call customer · Mark lost

### 10. Calendar (week view)
- Week grid with time slots
- Colour-coded events: green=confirmed, amber=tentative/AI reserved, red=urgent
- Unscheduled jobs sidebar strip
- AI suggestion banner: "You have room for one more job near Wodonga at 2 PM"
- Day / Week / Month toggle

### 11. AI Assistant
- Left: suggested prompt chips
- Center: chat history (AI messages in purple-tinted bubbles, owner in blue)
- Action preview cards inside chat (e.g. "Create quote — $299–$499 — Approve?")
- Confirmation modal pattern for destructive/customer-facing actions
- Bottom input bar with send button

### 12. Invoice Upload Onboarding
- Step 3 of 10 stepper
- Drag-and-drop zone (PDF, CSV, XLSX, images)
- Explanation copy: "RyanOS reads past invoices to learn your pricing"
- Uploaded files list with processing state
- Extracted pricing preview table (job type · price range · suburb · count)
- "Approve pricing rules" checklist

### 13. Services & Pricing Settings
- Service categories toggle list (Water tank clean · Chimney sweep · Gutter clean · Roof treatment · Emergency callout)
- Pricing rule cards per service (min · max · callout fee · after-hours surcharge)
- "No-go jobs" list
- Out-of-area rule

### 14. Phone / Voice AI Setup
- Phone number status pill (Live / Pending / Setup)
- Voice selector (3 options with preview play buttons)
- Greeting text editor
- After-hours behaviour toggle
- Escalation phone number input
- AI behaviour toggles: Can book jobs · Can give price ranges · Require approval · Escalate urgent immediately
- Test call button

### 15. Settings overview
- Grouped sidebar nav: Business Profile · Services · Phone & AI · Booking Rules · Notifications · Integrations · Team · Billing
- Right panel shows selected section
- Default: Business Profile (ABN, logo, address, trading hours)

### 16. Go-Live Checklist
- Progress bar (e.g. 9/12 complete)
- Checklist items with Complete / Needs Setup / Warning / Optional states
- "Go Live" button (enabled when all required items complete)
- Under button: "RyanOS is ready to answer calls for your business."

---

## Step 6 — Mobile screens (4 screens)

Rendered when screen width < 768px (Tailwind `md:` breakpoint detection via `window.innerWidth` on mount + resize listener).

Mobile uses a bottom nav bar (Home · Calls · Jobs · Quotes · AI) instead of sidebar.

### 17. Mobile Home
- Greeting: "Morning, Ryan."
- 2×2 metric cards (calls · jobs · quotes · revenue)
- "Needs attention" stack (missed calls, urgent jobs)
- Today's jobs list

### 18. Mobile Job Detail
- Full-screen job card
- Large tap targets: Call customer · Navigate · SMS
- Status badge + mark complete button
- AI summary (collapsed by default)

### 19. Mobile Call Detail
- Caller info + AI outcome badge
- AI summary (2–3 lines)
- Transcript (scrollable)
- Actions: Approve job · Call back · Send SMS · Mark resolved

### 20. Mobile Quote Approval
- Quote summary card
- Estimated range + confidence
- Approve & Send / Edit buttons (large, full-width)
- "AI drafted from your last 8 similar jobs" note

---

## Step 7 — Shared component patterns

**Badge(status)** → maps status string to colour class + label  
**MetricCard(title, value, trend, trendDir, action)** → consistent KPI card  
**AIConfidenceBar(score)** → coloured pill (green/amber/red) + percentage  
**ActivityFeedItem(type, text, time)** → icon + text + timestamp  
**TimelineItem(event)** → vertical dot-line timeline entry  
**SectionHeader(title, subtitle, actions)** → page/section heading pattern  

---

## Verification

After build:
1. Every sidebar nav item switches to the correct screen without error.
2. Clicking a call row opens Call Detail with transcript.
3. Clicking a job row opens Job Detail.
4. Mobile layout (resize to <768px) shows bottom nav instead of sidebar.
5. AI Assistant chat input appends messages to the history.
6. Calendar displays colour-coded week events.
7. Go-Live Checklist shows progress bar and conditionally enables Go Live button.
8. All data is realistic Australian trade-business data — no generic placeholders.
