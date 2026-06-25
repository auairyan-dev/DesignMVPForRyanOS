# RyanOS Design System

**Document:** RYANOS_DESIGN_SYSTEM.md  
**Product:** RyanOS  
**Purpose:** This document defines the visual style, layout rules, components, interaction patterns, and UX rules for designing RyanOS in Figma.  
**Use with:** RYANOS_PRODUCT_SPEC.md  
**Audience:** Figma AI, UX designers, product builders, OpenClaw agents, frontend developers.

---

# 1. Design North Star

RyanOS is a premium AI operating system for trade businesses.

It should feel like a serious business tool, not a playful app.

It should look modern, calm, fast, and trustworthy.

The user should feel:

- “I can run my business from here.”
- “The AI is doing work for me.”
- “I know what happened today.”
- “I know what needs attention.”
- “I know what to do next.”

The design should be simple enough for a non-technical tradesperson, but premium enough that a business owner would pay $1,000/month for it.

RyanOS should feel like the control room for a trade business.

---

# 2. Visual References

Use these products as quality references, without copying them directly:

- Linear: clean dark interface, sharp hierarchy, premium spacing.
- Stripe: trustworthy business software, clear dashboards, polished cards.
- Apple: simplicity, calm, spacing, premium feel.
- Notion: modular blocks, readable information, low friction.
- Cursor: AI-native work interface, command/control feel.
- Raycast: fast command centre, clean AI assistant patterns.
- Vercel: developer-grade polish, clear technical status.
- OpenAI: calm, simple AI interaction patterns.

Do not design RyanOS like a generic admin dashboard template.

Do not use bright childish gradients, fake neon cyberpunk styling, overly colourful cards, or cluttered analytics panels.

---

# 3. Core Design Principles

## 3.1 One screen should answer one job

Every major screen must answer one clear user question.

Examples:

- Dashboard: “What is happening in my business right now?”
- Calls: “What calls came in and did the AI handle them properly?”
- Jobs: “What work is booked and what needs doing?”
- Customers: “Who are my customers and what is their history?”
- Quotes: “Which quotes need action?”
- Calendar: “Where do I need to be and when?”
- Settings: “How do I control the AI and business rules?”

## 3.2 Show next actions first

RyanOS should not just display data.

It should surface recommended actions:

- Call back this missed lead.
- Approve this quote.
- Confirm tomorrow’s bookings.
- Upload past invoices to improve pricing.
- Review an AI call with low confidence.
- Send a payment reminder.
- Fill missing business hours.

## 3.3 Calm over clever

The design should be calm. Avoid visual noise.

Use:

- Dark mode first.
- Spacious cards.
- Clear headings.
- Minimal icons.
- Short labels.
- Plain English.
- Obvious buttons.

## 3.4 Trade-business first

RyanOS is not for tech startups.

Use realistic data:

- Blocked drain.
- Hot water repair.
- Aircon service.
- Roof leak.
- Chimney sweep.
- Water tank clean.
- Gutter clean.
- Emergency callout.
- Quote follow-up.
- Invoice overdue.

Avoid generic SaaS labels like “Project Alpha”, “Campaign X”, “Enterprise Growth”, or “Q3 stakeholder review”.

## 3.5 AI is a worker, not a gimmick

The AI should appear as an active business assistant.

It should have:

- Status.
- Confidence.
- Actions completed.
- Pending approvals.
- Conversation history.
- Clear escalation points.

Avoid presenting AI as a decorative chatbot floating in the corner only.

The AI should be deeply embedded into calls, jobs, quotes, customers, calendar, and analytics.

---

# 4. Brand Personality

RyanOS should feel:

- Premium.
- Practical.
- Direct.
- Reliable.
- Calm.
- Intelligent.
- Business-focused.
- Slightly futuristic, but not gimmicky.

RyanOS should not feel:

- Cartoonish.
- Cheap.
- Overly technical.
- Crypto-like.
- Childish.
- Busy.
- Corporate-boring.
- Template-generated.

Tone of interface copy:

- Plain English.
- Short sentences.
- Action-focused.
- No jargon unless needed.
- No fake hype.

Good examples:

- “AI booked this job.”
- “Customer asked for an urgent repair.”
- “Quote needs approval.”
- “3 missed calls need follow-up.”
- “Tomorrow is fully booked.”
- “Low confidence — review transcript.”

Bad examples:

- “Leverage synergistic workflow automation.”
- “AI-powered omnichannel customer engagement suite.”
- “Maximize operational excellence via dynamic insights.”

---

# 5. Colour System

RyanOS is dark mode first.

The interface should feel like a premium operating system.

## 5.1 Base colours

Use these as the default palette.

```text
App background:        #0F1115
Surface 1 / cards:     #171A20
Surface 2 / raised:    #1E222A
Surface 3 / hover:     #252A33
Border subtle:         #2B303A
Border strong:         #3A414D
Text primary:          #F4F6FA
Text secondary:        #B8C0CC
Text muted:            #7F8998
Text disabled:         #555D6B
```

## 5.2 Brand colours

```text
Primary blue:          #4F7CFF
Primary blue hover:    #6B92FF
Primary blue pressed:  #3E63D8
Primary soft bg:       rgba(79, 124, 255, 0.12)
```

Use primary blue for:

- Main actions.
- Selected navigation item.
- Active AI state.
- Links.
- Primary chart accents.
- Important focus states.

Do not overuse it.

## 5.3 Status colours

```text
Success green:         #3CCF91
Success soft bg:       rgba(60, 207, 145, 0.12)
Warning amber:         #F5B942
Warning soft bg:       rgba(245, 185, 66, 0.13)
Danger red:            #FF5C5C
Danger soft bg:        rgba(255, 92, 92, 0.12)
Info cyan:             #5CC8FF
Info soft bg:          rgba(92, 200, 255, 0.12)
Purple AI:             #A78BFA
Purple soft bg:        rgba(167, 139, 250, 0.12)
```

Use status colours consistently:

- Green: booked, paid, completed, healthy, AI handled.
- Amber: needs review, pending, medium urgency.
- Red: missed, urgent, overdue, failed, low confidence.
- Blue/Cyan: information, scheduled, call in progress.
- Purple: AI assistant, automation, generated content.

## 5.4 Avoid

Avoid:

- Pure black background.
- Too many neon colours.
- Rainbow dashboards.
- Low contrast grey text.
- Big bright gradients.
- White cards on dark background unless intentionally used for documents/previews.

---

# 6. Typography

## 6.1 Font

Use **Inter** as the primary font.

Fallback:

```text
Inter, SF Pro Display, SF Pro Text, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

## 6.2 Type scale

```text
Display / hero:        40px / 48px, weight 700
Page title:            30px / 38px, weight 700
Section title:         22px / 30px, weight 650
Card title:            16px / 24px, weight 650
Body large:            16px / 26px, weight 400
Body:                  14px / 22px, weight 400
Body medium:           14px / 22px, weight 550
Small:                 13px / 20px, weight 400
Tiny / metadata:       12px / 18px, weight 450
Button:                14px / 20px, weight 600
Metric number:         28px / 34px, weight 700
```

## 6.3 Text rules

Use sentence case.

Good:

- Calls answered
- Jobs today
- Pending quotes
- AI confidence
- Customer timeline

Avoid title case everywhere.

Keep text short.

Avoid long paragraphs inside cards.

---

# 7. Spacing System

Use an 8px spacing grid.

```text
4px   micro spacing
8px   tight spacing
12px  small spacing
16px  default spacing
20px  medium spacing
24px  card padding
32px  section spacing
40px  large layout spacing
48px  page separation
64px  major blocks
```

## 7.1 Page padding

Desktop app page padding:

```text
Left sidebar width: 260px
Top bar height: 64px
Main page padding: 32px
Card padding: 20px to 24px
Card gap: 16px to 24px
```

## 7.2 Density

RyanOS should not feel cramped.

Tradespeople may use it quickly between jobs, so the interface must be easy to scan.

Use generous spacing on dashboards and detail pages.

Use denser rows only in tables like customers, jobs, and quotes.

---

# 8. Layout System

## 8.1 App shell

Desktop layout should use:

- Fixed left sidebar.
- Top header bar.
- Main content area.
- Optional right-side AI panel.

Default desktop shell:

```text
+--------------------------------------------------------------+
| Sidebar | Top bar                                            |
|         |----------------------------------------------------|
|         | Main page content                    | AI panel    |
|         |                                      | optional    |
+--------------------------------------------------------------+
```

## 8.2 Sidebar

Sidebar width: 248px to 264px.

Sidebar should include:

- RyanOS logo.
- Business name.
- Primary navigation.
- AI status indicator.
- Upgrade/billing small card if needed.
- Settings at bottom.

Primary nav:

- Dashboard
- Calls
- Jobs
- Customers
- Quotes
- Calendar
- Invoices
- Analytics
- AI Assistant
- Automation
- Settings

Use simple line icons.

Selected nav item:

- Soft blue background.
- Primary blue left indicator or icon.
- Text primary.

Unselected nav item:

- Text secondary.
- Hover surface 3.

## 8.3 Top bar

Top bar should include:

- Page title and short subtitle.
- Search / command bar.
- Notifications.
- AI status pill.
- User/business profile.

Search should feel like a command centre.

Placeholder examples:

- “Search customers, jobs, calls…”
- “Ask RyanOS or search…”
- “Press ⌘K to ask AI…”

## 8.4 Main content grid

Use 12-column desktop grid.

Common dashboard layout:

- Four metric cards across top.
- Main content left: activity, jobs, calls, charts.
- Right rail: AI recommendations, today’s schedule, alerts.

Recommended desktop breakpoints:

```text
Desktop large: 1440px+
Desktop:       1200px+
Tablet:        768px-1199px
Mobile:        360px-767px
```

## 8.5 Right-side AI panel

RyanOS should often include a right-side AI panel.

Panel width: 360px to 420px.

Panel can show:

- AI summary.
- Recommended actions.
- Current automation status.
- Chat input.
- Draft response.
- Call transcript summary.

The AI panel should not block the main workflow.

---

# 9. Component System

## 9.1 Cards

Cards are the main building block.

Default card:

```text
Background: Surface 1 (#171A20)
Border: 1px solid Border subtle (#2B303A)
Radius: 16px
Padding: 20px or 24px
Shadow: very subtle or none
```

Raised card:

```text
Background: Surface 2 (#1E222A)
Border: 1px solid Border strong (#3A414D)
Radius: 18px
```

Cards should have:

- Clear title.
- Optional subtitle.
- Main content.
- Optional action button or link.

Avoid putting too many things inside one card.

## 9.2 Metric cards

Metric cards show key business numbers.

Examples:

- Calls answered
- Jobs booked
- Revenue today
- Pending quotes
- Missed calls
- AI handled %
- Overdue invoices

Metric card layout:

```text
Title
Large number
Small trend text
Optional mini chart or icon
```

Example:

```text
Calls answered
23
+18% from last week
```

Status logic:

- Green trend when performance improved.
- Red trend when missed calls, overdue invoices, or cancellations increased.
- Amber when attention is needed.

## 9.3 Buttons

Primary button:

```text
Background: Primary blue
Text: white
Radius: 10px to 12px
Height: 40px or 44px
Padding horizontal: 16px to 20px
Font: 14px, weight 600
```

Secondary button:

```text
Background: Surface 2
Border: Border subtle
Text: Text primary
```

Ghost button:

```text
Transparent background
Text: Text secondary
Hover: Surface 3
```

Danger button:

```text
Background: Danger red or danger soft bg
Text: white or Danger red depending importance
```

Button labels should be action-first:

Good:

- Review call
- Approve quote
- Book job
- Send SMS
- Call customer
- Create invoice
- Upload invoices
- Save settings

Bad:

- Submit
- Click here
- Continue workflow operation

## 9.4 Inputs

Input style:

```text
Background: Surface 2
Border: 1px solid Border subtle
Radius: 10px to 12px
Height: 40px to 44px
Text: Text primary
Placeholder: Text muted
Focus: Primary blue border with soft glow
```

Use labels above fields.

Use helper text when the field impacts AI behaviour.

Example:

```text
Emergency callout price
This helps the AI give accurate price ranges after hours.
```

## 9.5 Select menus

Use clean dropdowns with clear options.

Trade examples:

- Job type
- Urgency
- Technician
- Service area
- Call outcome
- Quote status
- Payment status

## 9.6 Toggles

Toggles should be used for automation controls.

Examples:

- AI answers calls
- Send booking confirmation SMS
- Send review request after completed job
- Escalate urgent calls
- Ask for customer address
- Require owner approval before sending quotes

Toggles should show current state clearly.

## 9.7 Badges

Badges should communicate status quickly.

Badge style:

```text
Height: 22px to 26px
Radius: full pill
Padding: 6px to 10px
Font: 12px to 13px, weight 550
```

Status badges:

```text
Booked        Green
Completed     Green
Paid          Green
Pending       Amber
Needs review  Amber
Urgent        Red
Missed        Red
Overdue       Red
Draft         Grey
AI handled    Purple or green
Low confidence Red or amber
```

## 9.8 Tables

Tables are used for jobs, customers, calls, quotes, invoices.

Rules:

- Keep rows clean.
- Use strong first column.
- Use status badges.
- Use row hover state.
- Avoid too many columns.
- Include search and filters.
- Use plain language column names.

Example jobs table columns:

```text
Time | Customer | Job | Suburb | Status | Technician | Value | Action
```

Example calls table columns:

```text
Time | Caller | Reason | Outcome | AI confidence | Job created | Action
```

## 9.9 Empty states

Empty states must be useful.

Good empty state:

```text
No invoices uploaded yet
Upload previous invoices so RyanOS can learn your pricing and create better estimate ranges.
[Upload invoices]
```

Bad empty state:

```text
No data.
```

## 9.10 Loading states

Use subtle skeleton loaders.

Do not use loud spinners everywhere.

AI actions can use progress steps:

```text
Reading transcript...
Checking service area...
Finding available times...
Creating job...
Sending confirmation...
```

---

# 10. RyanOS-Specific Components

## 10.1 AI status pill

Shows whether AI is active.

States:

```text
AI online
AI answering calls
AI paused
Needs setup
Low confidence alerts
After-hours mode
```

Style:

- Small pill in top bar and sidebar.
- Green for online.
- Amber for setup or review needed.
- Red for offline.
- Purple for active AI work.

## 10.2 Call card

A call card should show the result of an inbound or outbound call.

Fields:

- Caller name or number.
- Time.
- Call duration.
- Call type: new lead, existing customer, emergency, quote follow-up, invoice question.
- AI outcome: booked, message taken, escalated, missed, needs review.
- Job created or not.
- Confidence score.
- Summary.
- Primary action.

Example:

```text
Sarah Mitchell
Today, 9:42 AM · 4m 12s
Hot water system leaking — Wodonga
AI booked job for tomorrow 8:30 AM
Confidence: 92%
[View transcript] [Open job]
```

## 10.3 AI confidence indicator

Confidence should be visual but not distracting.

Ranges:

```text
90-100% High confidence: green
70-89% Medium confidence: amber
0-69% Low confidence: red, needs review
```

Show confidence on:

- Calls.
- Quotes.
- AI-generated estimates.
- Customer summaries.
- Automations.

Use copy like:

- “High confidence”
- “Needs review”
- “Owner approval recommended”

## 10.4 Job card

Job card fields:

- Job type.
- Customer.
- Address/suburb.
- Date/time.
- Urgency.
- Status.
- Estimated value.
- Assigned technician.
- AI notes.
- Action button.

Example:

```text
Blocked drain
Tom Walker · North Albury
Today 2:00 PM
Urgent · $350-$550 estimate
AI note: Customer says water is backing up in laundry.
[Open job]
```

## 10.5 Customer timeline

A customer profile should include a vertical timeline.

Timeline events:

- Call received.
- AI summary created.
- Job booked.
- Quote sent.
- SMS sent.
- Invoice paid.
- Review requested.
- Customer replied.

Each event should have:

- Icon.
- Timestamp.
- Short human-readable title.
- Optional details.

## 10.6 Quote approval card

Used when AI creates a quote or estimate.

Fields:

- Customer.
- Job type.
- Price range or quote amount.
- Confidence.
- Inputs used.
- Missing info.
- Recommended action.

Example actions:

- Approve and send.
- Edit quote.
- Ask customer for photos.
- Assign inspection.
- Reject draft.

## 10.7 AI recommendation card

AI recommendation cards are central to RyanOS.

Structure:

```text
Recommendation title
Why this matters
Suggested action
Button
```

Examples:

```text
Call back missed lead
A new customer called twice after hours and did not leave a clear address.
[Call back]
```

```text
Approve roof leak quote
AI drafted a $780-$1,100 estimate from the call transcript. Confidence is 76%.
[Review quote]
```

```text
Upload past invoices
RyanOS needs examples to learn your pricing for emergency callouts.
[Upload invoices]
```

## 10.8 Automation rule card

Settings/automation cards should show:

- Rule name.
- Status toggle.
- What it does.
- Last triggered.
- Edit button.

Examples:

```text
After-hours call handling
AI answers calls outside business hours, takes details, and escalates urgent work by SMS.
Last triggered: Yesterday 8:42 PM
[Toggle] [Edit]
```

## 10.9 Invoice upload component

Because RyanOS learns pricing from past invoices, upload UX matters.

The upload component should include:

- Drag-and-drop area.
- Accepted files: PDF, CSV, XLSX, images.
- Explanation: “RyanOS reads past invoices to learn your pricing.”
- Privacy/trust note.
- Progress state.
- Extracted pricing review table.

## 10.10 Voice setup component

For Vapi/Twilio/phone setup.

Fields:

- Phone number status.
- Voice selected.
- Business hours.
- Escalation number.
- Call greeting.
- Test call button.
- AI behaviour controls.

States:

- Number pending.
- Ready to test.
- Live.
- Paused.
- Setup incomplete.

---

# 11. Page-Level Design Rules

## 11.1 Dashboard page

The dashboard must be the business command centre.

Top cards:

- Calls answered today.
- Jobs booked today.
- Revenue today or booked value.
- Items needing attention.

Main sections:

- Today’s schedule.
- Recent calls.
- AI recommendations.
- Pending quotes.
- Missed opportunities.
- Revenue trend.
- AI performance.

The first screen should immediately show whether the business is healthy today.

## 11.2 Calls page

The calls page is one of the most important RyanOS screens.

It should show:

- Live/recent calls.
- AI call outcomes.
- Missed calls.
- Transcripts.
- Call recordings.
- Confidence.
- Whether a job was created.
- Whether the owner needs to review.

Important filters:

- All calls.
- New leads.
- Booked.
- Missed.
- Needs review.
- Emergency.
- After hours.

Call detail page should show:

- Call summary.
- Transcript.
- Extracted customer details.
- Job details.
- Quote/estimate draft.
- Follow-up actions.

## 11.3 Jobs page

The jobs page should be practical and operational.

Views:

- List view.
- Calendar view.
- Board/status view.

Statuses:

- New.
- Booked.
- Confirmed.
- In progress.
- Completed.
- Invoiced.
- Paid.
- Cancelled.

Show job urgency clearly.

## 11.4 Customers page

The customer page should feel like a lightweight CRM.

List should show:

- Name.
- Suburb.
- Last contact.
- Total value.
- Open jobs.
- Last job.
- Status.

Customer detail should show:

- Contact details.
- Property details.
- Timeline.
- Jobs.
- Quotes.
- Invoices.
- Calls.
- Notes.
- AI summary.

## 11.5 Quotes page

The quotes page should focus on money and follow-up.

Statuses:

- Draft.
- Needs approval.
- Sent.
- Viewed.
- Accepted.
- Declined.
- Expired.

Key actions:

- Approve AI quote.
- Send quote.
- Follow up.
- Convert to job.
- Edit price.

Show:

- Quote amount.
- Customer.
- Job type.
- Confidence.
- Age of quote.
- Next action.

## 11.6 Calendar page

Calendar must be simple.

Views:

- Day.
- Week.
- Month.

Each event/job should show:

- Time.
- Customer.
- Job type.
- Suburb.
- Technician.
- Urgency.

Calendar should make it clear when there is space for more jobs.

AI suggestions:

- “You have room for one more job near Wodonga at 2 PM.”
- “This booking is 35 minutes away from the previous job.”
- “Tomorrow morning is overbooked.”

## 11.7 AI Assistant page/panel

RyanOS Assistant should feel useful, not decorative.

Suggested prompts:

- “What needs attention today?”
- “Show missed calls from this week.”
- “Book a job for Sarah tomorrow morning.”
- “Draft a quote from this call.”
- “Find unpaid invoices.”
- “Summarise yesterday.”
- “Which ads are generating bookings?”
- “What jobs are urgent?”

The chat interface should support:

- Text input.
- Action previews.
- Confirmation buttons.
- Links to created records.
- Undo or review actions.

## 11.8 Settings page

Settings should not be overwhelming.

Group settings into clear sections:

- Business profile.
- Services and pricing.
- Service areas.
- Phone and voice AI.
- Booking rules.
- Notifications.
- Quote rules.
- Invoice/payment settings.
- Integrations.
- Team.
- Billing.

Settings should include clear explanations.

Example:

```text
Require approval before sending quotes
When enabled, RyanOS will draft quotes but wait for you to approve them before sending to customers.
```

---

# 12. Chart and Data Visualisation Rules

RyanOS charts should be useful, not decorative.

Charts should answer business questions:

- Are calls increasing?
- Are missed calls costing money?
- Which lead sources convert?
- How much revenue is booked this week?
- What percentage of calls does AI handle?
- Which job types make the most money?
- Are quotes being accepted?

Use simple chart types:

- Line chart for trends.
- Bar chart for comparisons.
- Donut chart sparingly for split percentages.
- Small sparkline inside cards.

Avoid:

- 3D charts.
- Too many colours.
- Useless decorative graphs.
- Tiny unreadable labels.

Every chart card should have:

- Title.
- Short insight.
- Date range.
- Clear axis labels if needed.

Good example:

```text
Missed call value
$2,400 estimated lost this month
```

---

# 13. Icons

Use simple line icons.

Icon style:

- 1.5px to 2px stroke.
- Rounded caps.
- Minimal detail.
- Consistent size.

Recommended icon size:

```text
Sidebar icons: 18px to 20px
Card icons: 20px to 24px
Status icons: 14px to 16px
Large empty state icons: 40px to 56px
```

Icon meanings:

- Phone: calls.
- Calendar: bookings.
- User: customers.
- Briefcase/tool: jobs.
- Dollar/receipt: quotes/invoices.
- Spark/brain: AI.
- Alert triangle: needs attention.
- Check circle: completed/handled.
- Clock: pending/scheduled.
- Map pin: service location.

Avoid overusing icons in dense tables.

---

# 14. Motion and Interaction

Motion should be subtle and premium.

Use motion for:

- Sidebar hover.
- Card hover.
- AI thinking/progress.
- Panel open/close.
- Toast notifications.
- Row expansion.

Motion timing:

```text
Fast hover: 120ms
Panel slide: 180-240ms
Modal open: 160-220ms
AI progress: calm, not flashy
```

Avoid:

- Bouncy animations.
- Excessive spinning.
- Confetti.
- Distracting transitions.

---

# 15. Accessibility

RyanOS must be easy to read.

Rules:

- Maintain strong contrast.
- Do not rely on colour alone for status.
- Use labels with icons.
- Use readable font sizes.
- Keep touch targets at least 40px high.
- Use focus states.
- Make forms clear.
- Avoid tiny grey text for important information.

Important trade context:

Users may be tired, on a job site, using a laptop in poor lighting, or checking quickly between calls.

Clarity matters more than visual cleverness.

---

# 16. Responsive Rules

## 16.1 Desktop first

Primary MVP should be desktop-first.

Most business setup, dashboard review, and invoice upload will happen on desktop/laptop.

## 16.2 Tablet

On tablet:

- Collapse sidebar to icons or drawer.
- Use two-column cards.
- Keep AI panel collapsible.

## 16.3 Mobile

Mobile should focus on quick actions.

Mobile priority screens:

- Today’s jobs.
- Calls.
- Customer details.
- Job details.
- AI assistant.
- Calendar.
- Notifications.

Mobile should not try to show every dashboard chart.

Mobile bottom nav could include:

- Today
- Calls
- Jobs
- Customers
- AI

---

# 17. Forms and Setup UX

RyanOS onboarding must be simple.

Setup steps:

1. Business details.
2. Services offered.
3. Service area.
4. Business hours.
5. Phone/voice setup.
6. Upload past invoices.
7. Booking rules.
8. Quote approval rules.
9. Test AI call.
10. Go live.

Show progress clearly.

Use setup cards:

```text
Step 3 of 10
Set your service area
Tell RyanOS where you work so the AI does not book jobs too far away.
```

Avoid long forms on one page.

Use progressive disclosure.

---

# 18. Trust and Safety UX

Because RyanOS uses AI to answer customer calls, trust is critical.

Design must clearly show:

- What the AI did.
- Why it did it.
- Whether confidence was high or low.
- What the business owner can review.
- Which actions need approval.
- When the AI escalated to a human.

Important approval settings:

- Require approval before sending quotes.
- Require approval before confirming emergency work.
- Require approval above a price threshold.
- Pause AI answering.
- Review low-confidence calls.

Use clear audit trails.

Example:

```text
AI action log
9:42 AM — Answered call from Sarah Mitchell
9:44 AM — Detected urgent hot water leak
9:45 AM — Offered appointment tomorrow 8:30 AM
9:46 AM — Sent SMS confirmation
9:46 AM — Created job #1042
```

---

# 19. Microcopy Examples

Use these examples across the product.

## Dashboard

```text
Good morning, Ryan.
RyanOS handled 18 calls and booked 6 jobs while you were away.
```

```text
3 things need your attention
```

```text
AI found one quote that should be reviewed before sending.
```

## Calls

```text
AI booked this job.
```

```text
Low confidence — review transcript.
```

```text
Customer sounded urgent and requested same-day help.
```

## Jobs

```text
Today’s first job is 18 minutes away.
```

```text
Customer asked for a call before arrival.
```

## Quotes

```text
AI drafted this from the call transcript and your past invoices.
```

```text
Price range is based on 12 similar jobs.
```

## Settings

```text
RyanOS will ask for photos before creating roof leak estimates.
```

```text
Emergency jobs will be escalated to your phone immediately.
```

---

# 20. Sample Data for Figma Screens

Use realistic Australian trade-business sample data.

## Business

```text
Business name: Alpine Fresh Property Maintenance
Location: Albury-Wodonga
Services: Water tank cleaning, chimney sweep, roof treatment, gutter cleaning
Owner: Ryan Thomas
```

Alternative sample businesses:

```text
Border Plumbing Co.
Wodonga Air & Heat
North East Roofing
Albury Electrical Services
Murray River Maintenance
```

## Customers

```text
Sarah Mitchell — Wodonga
Tom Walker — North Albury
Jenny Harris — Lavington
Mark Evans — Thurgoona
Linda Roberts — Albury
Peter Collins — West Wodonga
```

## Jobs

```text
Hot water leak — urgent
Blocked drain — same day
Chimney sweep — standard
Water tank clean — 2 tanks
Roof moss treatment — quote requested
Gutter clean — booked
Aircon service — maintenance
```

## Prices

```text
Chimney sweep: $299-$499
Water tank clean: $399-$999
Emergency callout: $180-$280
Gutter clean: $250-$650
Roof treatment: $799-$1,799
Blocked drain: $350-$650
```

## AI outcomes

```text
Booked job
Needs review
Quote drafted
Customer asked for callback
Missed call recovered
SMS sent
Invoice reminder sent
Urgent escalation
```

---

# 21. Component Checklist for Figma

Create reusable components for:

- App sidebar.
- Top bar.
- Command/search bar.
- Metric card.
- Status badge.
- AI status pill.
- Call card.
- Job card.
- Customer row.
- Quote approval card.
- AI recommendation card.
- Timeline item.
- Table row.
- Filter tabs.
- Primary button.
- Secondary button.
- Input field.
- Select field.
- Toggle switch.
- Modal.
- Drawer panel.
- Toast notification.
- Empty state.
- File upload area.
- Setup progress stepper.
- AI chat message.
- AI action preview.

---

# 22. Must-Have MVP Screens

When using this design system with the product spec, Figma should produce these initial MVP desktop screens:

1. Dashboard
2. Calls / AI Receptionist
3. Call detail / transcript
4. Jobs list
5. Job detail
6. Customers list
7. Customer detail
8. Quotes list
9. Quote approval screen
10. Calendar
11. AI Assistant
12. Settings overview
13. Services and pricing settings
14. Phone/voice AI settings
15. Invoice upload onboarding
16. Go-live checklist

Do not build dozens of low-quality screens.

Build fewer screens with strong UX and reusable components.

---

# 23. Figma AI Instructions

When Figma AI uses this document, follow these rules:

1. Use RYANOS_PRODUCT_SPEC.md for product logic and workflows.
2. Use this document for visual style and components.
3. Design dark-mode desktop screens first.
4. Use realistic trade-business data.
5. Create reusable components.
6. Do not create a generic SaaS dashboard.
7. Prioritise calls, bookings, jobs, quotes, customers, and AI actions.
8. Make the UI simple enough for non-technical business owners.
9. Every page should show the next best action.
10. The final design should look premium enough for a $1,000/month business tool.

---

# 24. Design Quality Bar

A screen is acceptable only if:

- It is immediately clear what page the user is on.
- The primary action is obvious.
- The screen uses realistic trade-business data.
- AI actions are visible and understandable.
- The layout is not cluttered.
- Cards have consistent spacing and style.
- Status colours are used consistently.
- Text is readable.
- The design looks premium and trustworthy.
- It does not look like a generic template.

A screen is not acceptable if:

- It uses fake generic SaaS data.
- It has too many charts without meaning.
- It hides important AI actions.
- It overloads the user with settings.
- It uses poor contrast.
- It looks like a crypto dashboard.
- It uses childish gradients.
- It fails to show what needs attention.

---

# 25. Final Direction

RyanOS should look like a calm, premium, AI-powered business control room for trades.

The interface should make the owner feel that the business is being watched, answered, organised, and improved by AI.

Design around the core promise:

```text
RyanOS answers the phone, books the job, prepares the quote, follows up the customer, and shows the owner what needs attention.
```

Everything in the design system should support that promise.
