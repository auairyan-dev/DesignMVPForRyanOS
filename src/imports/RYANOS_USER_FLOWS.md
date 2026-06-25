# RYANOS_USER_FLOWS.md

## Purpose

This document defines the core user flows for RyanOS.

Use this together with:

1. RYANOS_PRODUCT_SPEC.md
2. RYANOS_DESIGN_SYSTEM.md

The Product Spec explains what RyanOS is.
The Design System explains how RyanOS should look.
This User Flows document explains how RyanOS should work from screen to screen.

Figma AI should use this document to connect the product into realistic trade-business workflows instead of creating disconnected dashboard screens.

---

# Product Summary

RyanOS is an AI phone receptionist, job intake, booking, quoting, CRM, and business dashboard system for trade businesses.

It is designed for:

- Plumbers
- HVAC businesses
- Electricians
- Roofers
- Gutter cleaners
- Chimney sweeps
- Water tank cleaners
- Builders
- Landscapers
- General home-service businesses

RyanOS helps a small trade business answer calls, qualify customers, estimate jobs, book appointments, follow up quotes, organise jobs, and reduce office admin.

The product should feel like an operating system for a trade business.

---

# Primary User

The main user is a trade business owner.

They are often:

- Busy
- Driving between jobs
- Not highly technical
- Using paper, SMS, phone calls, Facebook messages, or basic invoice software
- Losing jobs because they miss calls
- Slow to follow up quotes
- Unsure which leads are worth chasing
- Trying to grow without hiring office staff

The UI should make them feel in control within 30 seconds.

---

# Core UX Principle

Every workflow must answer three questions:

1. What happened?
2. What needs attention?
3. What should I do next?

RyanOS should not feel like accounting software.
RyanOS should feel like a smart assistant running the office.

---

# Global Navigation

RyanOS should have a persistent left sidebar on desktop.

Recommended navigation:

- Dashboard
- Calls
- Jobs
- Customers
- Quotes
- Calendar
- AI Assistant
- Analytics
- Knowledge Base
- Settings

Optional later modules:

- Invoices
- Payments
- Marketing
- Team
- Integrations
- Billing

The MVP should focus on Calls, Jobs, Customers, Quotes, Calendar, AI Assistant, and Settings.

---

# Flow 1: Incoming Customer Call → Job Booked

## Goal

A customer calls the trade business.
RyanOS AI answers the call, collects job details, qualifies the lead, books a job, sends confirmations, and alerts the owner.

## Steps

1. Customer calls the business phone number.
2. AI Receptionist answers.
3. AI asks what the customer needs.
4. AI identifies job category.
5. AI collects customer name.
6. AI collects phone number if not already detected.
7. AI collects address or suburb.
8. AI asks urgency.
9. AI asks relevant job questions.
10. AI checks service area.
11. AI estimates job value or price range if available.
12. AI checks available calendar slots.
13. Customer chooses a booking time.
14. AI creates customer record.
15. AI creates job record.
16. AI attaches call transcript.
17. AI sends SMS confirmation.
18. AI sends owner notification.
19. Dashboard updates with new booking.

## Required Screens

- Calls / AI Receptionist
- Call Detail
- Customer Detail
- Job Detail
- Calendar
- Dashboard Activity Feed

## Important UI Components

- Incoming call card
- AI status indicator
- Call transcript
- Customer summary
- Job intake answers
- Booking confirmation
- AI confidence score
- Owner action buttons

## Owner Actions

The owner should be able to:

- Confirm job
- Reschedule job
- Call customer back
- Send SMS
- Convert to quote
- Mark as urgent
- Assign technician
- Add internal note

## Success State

The job appears on the dashboard and calendar with:

- Customer name
- Job type
- Address
- Time
- Urgency
- Estimated value
- AI summary
- Transcript attached

---

# Flow 2: Missed Call → AI Follow-Up → Recovered Lead

## Goal

A customer calls outside hours or hangs up.
RyanOS follows up automatically and tries to recover the lead.

## Steps

1. Customer calls.
2. Call is missed, abandoned, or after-hours.
3. RyanOS detects the missed opportunity.
4. RyanOS sends SMS follow-up.
5. Customer replies.
6. AI collects job details by SMS.
7. AI creates lead.
8. AI asks for booking preference.
9. AI creates job or quote request.
10. Owner is notified if human review is needed.

## Required Screens

- Calls
- Missed Call Detail
- AI Assistant
- Customer Detail
- Dashboard

## Important UI Components

- Missed call recovery card
- SMS conversation preview
- “Recovered lead” badge
- Response timer
- Suggested next action

## Owner Actions

- Call back now
- Send follow-up SMS
- Mark as not suitable
- Convert to job
- Convert to quote
- Block spam number

## Success State

Dashboard shows:

- Missed call recovered
- Customer replied
- Booking created or lead moved to follow-up

---

# Flow 3: Quote Request → Estimate Range → Owner Review → Quote Sent

## Goal

RyanOS helps the business generate a realistic quote or estimate range from call answers, uploaded invoice history, and pricing rules.

## Steps

1. Customer requests price or quote.
2. AI collects required job information.
3. AI checks service/pricing rules.
4. AI checks previous similar invoices if uploaded.
5. AI generates estimated price range.
6. AI marks confidence level.
7. Quote is saved as draft.
8. Owner reviews.
9. Owner edits price if needed.
10. Owner sends quote by SMS/email.
11. RyanOS tracks quote status.
12. AI follows up if quote is not accepted.

## Required Screens

- Quotes
- Quote Detail
- Customer Detail
- Job Detail
- Services and Pricing
- AI Assistant

## Important UI Components

- Quote draft card
- Estimate range
- Confidence indicator
- Similar previous jobs
- Price rule explanation
- Approval buttons
- Follow-up timeline

## Owner Actions

- Approve quote
- Edit quote
- Send quote
- Call customer
- Convert to job
- Mark lost
- Add discount
- Add deposit requirement

## Success State

Quote status updates to:

- Draft
- Sent
- Viewed
- Accepted
- Declined
- Expired
- Follow-up due

---

# Flow 4: Invoice Upload → Pricing Intelligence

## Goal

During onboarding, the business uploads old invoices so RyanOS can learn typical job pricing.

## Steps

1. Owner enters onboarding.
2. Owner uploads PDF invoices, photos, CSVs, or exports.
3. RyanOS extracts job type, price, suburb, date, and notes.
4. RyanOS groups similar jobs.
5. RyanOS suggests pricing rules.
6. Owner reviews and approves pricing ranges.
7. Pricing becomes available to AI Receptionist and Quotes.

## Required Screens

- Invoice Upload Onboarding
- Services and Pricing
- AI Assistant
- Settings

## Important UI Components

- Upload drop zone
- Processing state
- Extracted invoice table
- Suggested price range cards
- Confidence score
- Approval checklist

## Owner Actions

- Upload files
- Confirm extracted data
- Edit pricing
- Approve service categories
- Add minimum call-out fee
- Add surcharge rules
- Add no-go jobs

## Success State

RyanOS creates pricing rules such as:

- Standard service call: $180-$250
- Water tank clean: $399-$999
- Chimney sweep: $299-$499
- Emergency call-out: +$150
- Outside service area: manual review

---

# Flow 5: Job Created → Technician/Owner Completes Job → Follow-Up

## Goal

RyanOS manages a job from booking to completion.

## Steps

1. Job appears on calendar.
2. Owner reviews job details.
3. Owner confirms or edits job.
4. Job day arrives.
5. RyanOS sends customer reminder.
6. Owner or technician marks job in progress.
7. Photos/notes are added.
8. Job is marked complete.
9. Invoice or payment request is sent.
10. Review request is sent.
11. Customer timeline updates.

## Required Screens

- Jobs
- Job Detail
- Calendar
- Customer Detail
- Dashboard

## Important UI Components

- Job status badge
- Job checklist
- Address/map section
- Customer contact buttons
- AI summary
- Photos
- Internal notes
- Invoice/payment action
- Review request action

## Job Statuses

- New
- Needs review
- Booked
- Confirmed
- On the way
- In progress
- Complete
- Invoiced
- Paid
- Cancelled
- No show

## Owner Actions

- Confirm
- Reschedule
- Assign
- Call
- SMS
- Add note
- Upload photo
- Complete job
- Send invoice
- Request review

---

# Flow 6: Dashboard Daily Command Centre

## Goal

The dashboard gives the owner a clear daily snapshot.

## Questions Dashboard Must Answer

1. How many calls came in?
2. How many were answered by AI?
3. How many bookings were created?
4. What jobs are today?
5. What quotes need follow-up?
6. What missed calls need attention?
7. How much revenue is booked or completed?
8. What does AI recommend I do next?

## Required Dashboard Sections

### Top KPI Row

- Calls answered
- Jobs booked
- Missed calls
- Pending quotes
- Revenue today
- AI handled percentage

### Today’s Schedule

Show upcoming jobs with:

- Time
- Customer
- Job type
- Suburb
- Status
- Estimated value

### Needs Attention

Cards for:

- Missed calls
- Low confidence AI calls
- Quotes waiting approval
- Jobs missing address
- Customer requested human callback
- Payment overdue

### Live Activity Feed

Events such as:

- AI answered call
- Customer booked job
- Quote sent
- Job completed
- Invoice paid
- Missed call recovered

### AI Recommendations

Examples:

- “Call Sarah back. She asked about an urgent leak.”
- “Approve quote draft for Mark Wilson.”
- “You have 3 old quotes due for follow-up.”
- “Tomorrow morning has a 2-hour gap near Wodonga.”

---

# Flow 7: AI Assistant Command Flow

## Goal

The owner can ask RyanOS questions and command the business through chat.

## Example Questions

- What jobs do I have today?
- Show missed calls from this week.
- Who needs a quote follow-up?
- How much revenue did we book this week?
- Find the customer from Wodonga who called about a leaking roof.
- What jobs are near Albury tomorrow?
- Summarise yesterday.
- Draft a quote for the chimney sweep job.
- Call back the missed lead.
- Reschedule Sarah to Friday afternoon.

## Required Screens

- AI Assistant
- Dashboard
- Jobs
- Customers
- Quotes

## Important UI Components

- Chat interface
- Suggested commands
- Result cards
- Confirmation modals
- Safe action review before sending messages or changing bookings

## AI Safety Rule

The AI can suggest actions quickly, but destructive or customer-facing actions should usually require owner approval.

Examples requiring confirmation:

- Send quote
- Cancel job
- Reschedule booking
- Send SMS/email
- Change price
- Delete customer
- Mark invoice paid

---

# Flow 8: Customer Detail Timeline

## Goal

Every customer should have a complete history in one place.

## Customer Detail Should Include

- Name
- Phone
- Email
- Address
- Tags
- Lead source
- Lifetime value
- Previous jobs
- Quotes
- Invoices
- Calls
- SMS
- Emails
- Notes
- Photos
- AI summary

## Timeline Events

- First call
- AI intake complete
- Quote requested
- Quote sent
- Quote accepted
- Job booked
- Reminder sent
- Job completed
- Invoice sent
- Payment received
- Review requested

## Owner Actions

- Call
- SMS
- Email
- Create job
- Create quote
- Add note
- Add property details
- View transcript
- Merge duplicate customer

---

# Flow 9: Settings → Voice AI Setup

## Goal

The business owner configures how the AI phone receptionist behaves.

## Setup Steps

1. Business name
2. Service categories
3. Service area
4. Opening hours
5. Emergency handling
6. Pricing rules
7. Booking availability
8. Owner notification preferences
9. Voice selection
10. Test call
11. Go-live checklist

## Required Screens

- Settings
- Phone / Voice AI Setup
- Services and Pricing
- Go-Live Checklist

## Important UI Components

- Setup progress
- Voice preview
- Test call button
- Call handling rules
- Emergency script
- Out-of-area rules
- Human handoff rules

## AI Voice Rules

The owner should be able to control:

- Greeting
- Tone
- Business hours
- After-hours message
- Whether AI can book jobs
- Whether AI can give price ranges
- Whether AI can take deposits
- Whether urgent jobs notify owner immediately
- When to escalate to human

---

# Flow 10: Go-Live Checklist

## Goal

Before the AI receptionist goes live, the owner needs a simple readiness screen.

## Checklist Items

- Business profile complete
- Services added
- Pricing rules approved
- Service area added
- Calendar connected
- Phone number connected
- SMS connected
- Email connected
- Test call completed
- Emergency rules approved
- Owner notification method set
- AI fallback rules approved

## UI Style

Use a clear checklist with progress percentage.

Each item should show:

- Complete
- Needs setup
- Warning
- Optional

## Success State

A large button appears:

“Go Live”

Under it:

“RyanOS is ready to answer calls for your business.”

---

# Flow 11: Human Review Needed

## Goal

When AI confidence is low, RyanOS should not pretend it knows.

## Trigger Examples

- Customer asks unusual question
- Job type is unknown
- Price confidence is low
- Address is outside service area
- Customer is angry
- Emergency risk
- AI detects legal/safety risk
- Customer requests human

## Required UI

Human review cards should appear in:

- Dashboard Needs Attention
- Calls
- Jobs
- AI Assistant

## Card Should Include

- Customer name
- Issue type
- AI confidence
- Summary
- Recommended action
- Transcript link
- Approve / edit / reject actions

---

# Flow 12: Mobile Owner View

## Goal

The owner can quickly check the business while on the road.

## Mobile Priority

Mobile should not copy the full desktop dashboard.

Mobile should focus on:

- Today’s jobs
- New calls
- Missed calls
- Urgent issues
- Quote approvals
- Customer contact buttons
- AI Assistant

## Mobile Bottom Navigation

Recommended:

- Home
- Calls
- Jobs
- Quotes
- AI

## Mobile Actions

Large tap targets:

- Call customer
- Send SMS
- Navigate
- Approve quote
- Reschedule
- Mark complete

---

# MVP Screen List

Figma AI should generate these screens for the first MVP:

1. Dashboard
2. Calls
3. Call Detail / Transcript
4. Jobs
5. Job Detail
6. Customers
7. Customer Detail
8. Quotes
9. Quote Detail / Approval
10. Calendar
11. AI Assistant
12. Invoice Upload Onboarding
13. Services and Pricing
14. Phone / Voice AI Setup
15. Settings
16. Go-Live Checklist
17. Mobile Home
18. Mobile Job Detail
19. Mobile Call Detail
20. Mobile Quote Approval

---

# Realistic Australian Sample Data

Use Australian trade-business examples.

## Example Customers

- Sarah Thompson, Albury NSW
- Mick Harris, Wodonga VIC
- Darren Cole, Lavington NSW
- Anne McKenzie, Thurgoona NSW
- Paul Nguyen, Wangaratta VIC
- Emma Roberts, Beechworth VIC

## Example Jobs

- Leaking hot water system
- Split system not cooling
- Blocked gutter
- Chimney sweep
- Water tank clean
- Roof leak inspection
- Emergency plumbing call-out
- Downpipe replacement

## Example Suburbs

- Albury
- Wodonga
- Lavington
- Thurgoona
- West Wodonga
- Baranduda
- Beechworth
- Wangaratta
- Corowa
- Tallangatta

## Example Metrics

- 34 calls this week
- 27 answered by AI
- 8 jobs booked
- 5 quotes pending
- $4,850 booked revenue
- 3 missed calls recovered
- 82% AI handled
- 2 low-confidence calls need review

---

# Final Figma Instruction

When creating screens, Figma AI should:

- Use the Product Spec for product scope.
- Use the Design System for visual styling.
- Use this User Flows document for screen logic.
- Create connected workflows, not isolated mockups.
- Use realistic trade-business data.
- Prioritise the MVP.
- Keep the product simple enough for a non-technical tradesperson.
- Design for desktop first, then mobile owner views.
- Every screen should show a clear next action.
