# RyanOS Product Specification

**Document:** RYANOS_PRODUCT_SPEC.md  
**Version:** 1.0  
**Purpose:** Source-of-truth product brief for Figma AI, OpenClaw, product design, and development.  
**Product:** RyanOS — AI operating system for trade businesses.  
**Primary market:** Australian trade and home-service businesses.  
**Initial vertical:** HVAC / home services, expandable to plumbers, electricians, roofers, cleaners, landscapers, chimney sweeps, tank cleaners, asbestos/remediation, and general property maintenance.

---

## 1. Product Vision

RyanOS is an AI operating system for trade businesses.

It replaces or supports the work normally done by a receptionist, admin assistant, dispatcher, estimator, scheduler, follow-up person, customer support person, and basic sales assistant.

The core promise:

> A solo tradie or small trade business should be able to run like a professional 10-person office without hiring office staff.

RyanOS should help the business:

- Answer every call.
- Capture every lead.
- Qualify the customer.
- Estimate the job range.
- Book the job.
- Send confirmations.
- Remind customers.
- Prepare quote documents.
- Follow up unpaid quotes.
- Chase invoices.
- Surface missed opportunities.
- Show business performance clearly.

RyanOS should feel like a premium command centre for a trade business, not a generic SaaS template.

The user experience should feel simple enough for a 55-year-old plumber who hates software, but powerful enough for a growing trade company with multiple staff.

---

## 2. Product Positioning

RyanOS is not just a CRM.

RyanOS is not just a chatbot.

RyanOS is not just a phone answering service.

RyanOS is the trade business control panel.

It combines:

- AI phone receptionist.
- AI SMS/email assistant.
- Job booking.
- Customer CRM.
- Estimate and quoting assistant.
- Invoice/payment follow-up.
- Call transcript storage.
- Business analytics.
- Automation rules.
- Owner dashboard.
- AI business assistant.

The product should feel like the owner has hired a smart digital office manager.

---

## 3. Ideal Customer Profile

### 3.1 Primary Customer

The primary customer is a small trade business owner.

Examples:

- HVAC technician.
- Plumber.
- Electrician.
- Roofer.
- Chimney sweep.
- Water tank cleaner.
- Carpet cleaner.
- Pest controller.
- Landscaper.
- Handyman.
- Property maintenance operator.
- Appliance repair business.

Typical business size:

- Solo operator to 10 staff.
- Usually 1 to 5 vehicles.
- Often owner-operated.
- May have no full-time admin staff.
- Owner answers calls while driving or working.
- Uses paper notes, SMS, Gmail, spreadsheets, phone calendar, Xero, MYOB, ServiceM8, Tradify, or nothing structured.

### 3.2 Customer Pain Points

The owner often struggles with:

- Missing calls while on the tools.
- Losing leads because they respond too slowly.
- Forgetting to follow up quotes.
- Wasting time answering basic price questions.
- Customers asking the same questions repeatedly.
- Quoting inconsistently.
- Not knowing which ads actually generate jobs.
- Booking jobs manually.
- Repeating customer details across systems.
- Being buried in admin after work.
- Not having clear numbers on revenue, conversion, job pipeline, and missed opportunities.

### 3.3 Emotional Buying Trigger

The owner wants:

- Less stress.
- Fewer missed jobs.
- More bookings.
- More professional customer experience.
- Less admin at night.
- Better follow-up without hiring staff.
- Confidence that the business is not leaking money.

The product should speak to that feeling.

---

## 4. Core Product Promise

RyanOS should answer these questions for the business owner every day:

1. What happened today?
2. What jobs are booked?
3. What leads need attention?
4. What quotes need follow-up?
5. What calls did AI handle?
6. What money is coming in?
7. What is slipping through the cracks?
8. What should I do next?

The dashboard should never feel like random charts. Every metric must connect to money, time, or customer response.

---

## 5. Product Personality

RyanOS should feel:

- Calm.
- Sharp.
- Premium.
- Practical.
- Reliable.
- Confident.
- Trade-aware.
- Not corporate fluff.
- Not childish.
- Not overly technical.

The tone should be direct and useful.

Example copy style:

- Good: “3 quotes need follow-up today.”
- Bad: “Unlock your pipeline potential with engagement optimisation.”

- Good: “AI booked this job with 92% confidence.”
- Bad: “Autonomous conversational workflow executed successfully.”

---

## 6. Product Scope

### 6.1 MVP Scope

The first version of RyanOS should support:

- Business setup.
- AI receptionist setup.
- Phone call intake.
- SMS/email intake.
- Customer creation.
- Job creation.
- Estimate range generation.
- Booking calendar.
- Call transcript display.
- Job dashboard.
- Owner notifications.
- Basic analytics.
- AI assistant chat.
- Settings page.
- Prior invoice upload for price learning.

### 6.2 Later Scope

Later versions can include:

- Technician mobile app.
- Route optimisation.
- Automated quoting documents.
- Payment links.
- Xero/MYOB/QuickBooks integration.
- Google Ads ROI tracking.
- Customer portal.
- Review request automation.
- Supplier invoice parsing.
- Inventory/material tracking.
- Multi-location operations.
- Franchise controls.
- Advanced team permissions.

---

## 7. User Roles

### 7.1 Owner / Admin

The business owner is the main user.

They need to:

- See business performance.
- Review calls.
- Approve quotes.
- Manage bookings.
- Edit pricing rules.
- Upload invoices.
- Set AI behaviour.
- View revenue and pipeline.
- Control integrations.
- See what needs attention.

### 7.2 Office Admin

Some businesses may have an admin person.

They need to:

- Manage calls and messages.
- Book and reschedule jobs.
- Edit customer records.
- Send quotes.
- Chase unpaid invoices.
- Review AI summaries.

### 7.3 Technician

A technician needs a simplified view.

They need to:

- See today’s jobs.
- View customer details.
- Open map directions.
- Read job notes.
- Upload photos.
- Mark job complete.
- Add materials used.
- Add private notes.
- Trigger invoice/quote actions.

### 7.4 Customer

The customer does not need a full app at MVP.

They interact through:

- Phone call.
- SMS.
- Email.
- Booking confirmation link.
- Quote link.
- Payment link.

### 7.5 AI Agent

The AI agent is treated like a team member.

It can:

- Answer calls.
- Ask qualifying questions.
- Summarise conversations.
- Create customers.
- Create jobs.
- Suggest estimate ranges.
- Reserve booking slots.
- Send confirmation messages.
- Flag uncertainty.
- Ask the owner for approval when needed.

The AI should not pretend to be human. It can sound natural, but the product should be honest that AI is assisting the business.

---

## 8. Main Navigation Structure

The app should use a clean left sidebar with the main sections.

Recommended navigation:

1. Dashboard
2. Inbox
3. Calls
4. Jobs
5. Calendar
6. Customers
7. Quotes
8. Invoices
9. Analytics
10. AI Assistant
11. Automations
12. Knowledge Base
13. Settings

Optional lower sidebar:

- Help
- Billing
- Team
- Account

The left sidebar should be compact, readable, and not overloaded with icons.

---

## 9. Dashboard

### 9.1 Dashboard Goal

The dashboard is the business owner’s morning command centre.

It should answer:

- What happened while I was working or sleeping?
- What needs my attention today?
- How much money is in the pipeline?
- What did the AI handle?
- What should I do next?

### 9.2 Dashboard Layout

Top bar:

- Business name/logo.
- Search.
- AI status indicator.
- Notification bell.
- Profile menu.

Main dashboard cards:

- Today’s booked jobs.
- Calls answered by AI.
- Missed calls recovered.
- New leads.
- Pending quotes.
- Revenue this week.
- Estimated pipeline value.
- AI confidence score.

Primary action area:

- “Review urgent items.”
- “Approve pending quote.”
- “Call back high-value lead.”
- “Check today’s schedule.”

Main sections:

1. Today’s schedule.
2. Live activity feed.
3. AI recommendations.
4. Recent calls.
5. Quote pipeline.
6. Revenue snapshot.

### 9.3 Dashboard Example Cards

Card: Calls Answered

- Title: Calls answered
- Value: 14
- Subtext: 11 handled by AI, 3 need review
- Action: View calls

Card: Jobs Booked

- Title: Jobs booked today
- Value: 6
- Subtext: Estimated value $3,840
- Action: Open calendar

Card: Quotes Waiting

- Title: Quotes waiting
- Value: 4
- Subtext: Total value $8,200
- Action: Review quotes

Card: Missed Opportunities

- Title: Missed opportunities
- Value: 2
- Subtext: AI recommends calling back within 30 minutes
- Action: Review now

### 9.4 AI Recommendation Panel

The dashboard should include a prominent panel called “AI Recommendations”.

Examples:

- “Follow up Daniel from Wodonga. He asked about ducted heating and sounded ready to book.”
- “Increase minimum callout quote for after-hours jobs. Current pricing appears low compared with recent jobs.”
- “You have 3 unpaid invoices older than 14 days.”
- “Tomorrow morning has a 2-hour gap near Lavington. Consider moving the North Albury job earlier.”

---

## 10. Inbox

### 10.1 Purpose

The Inbox is where all customer communication lands.

It combines:

- SMS.
- Email.
- Web chat.
- Contact form submissions.
- Missed call messages.
- AI handoff requests.

### 10.2 Inbox Views

Filters:

- All.
- Needs reply.
- AI handled.
- Waiting on customer.
- Quote follow-up.
- Booking request.
- Urgent.

Each conversation card should show:

- Customer name.
- Channel.
- Last message.
- Job type.
- Status.
- AI confidence.
- Time since last contact.
- Suggested next action.

### 10.3 Conversation Detail

The conversation detail should show:

- Message timeline.
- Customer profile summary.
- Linked job or quote.
- AI summary.
- Suggested reply.
- Buttons: Reply, Call, Book, Create quote, Mark resolved.

---

## 11. Calls

### 11.1 Purpose

The Calls page is the audit trail for the AI receptionist.

The owner should be able to quickly see:

- Who called.
- Why they called.
- What AI said.
- What details were collected.
- Whether a job was booked.
- Whether the call needs human review.

### 11.2 Call List

Each call row/card should include:

- Caller name if known.
- Phone number.
- Time and date.
- Duration.
- Call outcome.
- Job type.
- Urgency.
- AI confidence.
- Booking status.
- Review flag.

Call outcomes:

- Booked.
- Quote requested.
- Needs owner review.
- Spam.
- Missed.
- Follow-up required.
- Existing customer update.
- Emergency.

### 11.3 Call Detail Page

Sections:

1. AI summary.
2. Call recording player.
3. Transcript.
4. Extracted customer details.
5. Extracted job details.
6. Booking decision.
7. Estimate range.
8. AI confidence and warnings.
9. Linked customer.
10. Linked job.
11. Owner actions.

Owner actions:

- Approve booking.
- Edit job.
- Send SMS.
- Call customer.
- Create quote.
- Mark as resolved.
- Train AI from this call.

### 11.4 Call Detail Example

AI Summary:

“Sarah from Wodonga called about a split system not heating. Unit is 7 years old. No error code visible. She is available tomorrow afternoon. AI suggested a diagnostic callout and reserved 2:00 pm pending owner approval.”

Extracted fields:

- Name: Sarah Miller
- Phone: 04XX XXX XXX
- Address: Wodonga VIC
- Job type: HVAC repair
- Urgency: Medium
- Preferred time: Tomorrow afternoon
- Estimate range: $180-$350 diagnostic/repair visit
- AI confidence: 88%

---

## 12. Jobs

### 12.1 Purpose

Jobs are the operational core of RyanOS.

Every booked service, quote visit, repair, install, inspection, or follow-up becomes a job.

### 12.2 Job Statuses

Recommended statuses:

- New lead.
- Needs review.
- Estimate sent.
- Quote requested.
- Booked.
- Confirmed.
- In progress.
- Waiting on parts.
- Completed.
- Invoiced.
- Paid.
- Cancelled.
- Lost.

### 12.3 Job List

Job list should support:

- Table view.
- Kanban pipeline view.
- Calendar view.
- Map view later.

Job row/card fields:

- Job title.
- Customer.
- Address/suburb.
- Date/time.
- Status.
- Job type.
- Estimated value.
- Assigned technician.
- Urgency.
- Source.
- AI confidence.

### 12.4 Job Detail Page

Sections:

1. Header summary.
2. Customer details.
3. Address and map.
4. Job notes.
5. AI summary.
6. Call transcript links.
7. Photos.
8. Quote.
9. Invoice.
10. Checklist.
11. Materials.
12. Timeline.
13. Internal notes.

### 12.5 Job Header

The job header should show:

- Job title.
- Status pill.
- Customer name.
- Address.
- Scheduled time.
- Estimated value.
- Primary action button.

Primary action examples:

- Confirm booking.
- Send quote.
- Start job.
- Mark complete.
- Send invoice.

---

## 13. Calendar

### 13.1 Purpose

The calendar shows job bookings, technician availability, blocked time, and AI-reserved slots.

### 13.2 Calendar Views

- Day.
- Week.
- Month.
- Technician view.
- Unscheduled jobs list.

### 13.3 Booking States

Bookings should visually distinguish:

- Confirmed job.
- Tentative AI reservation.
- Needs owner approval.
- Customer requested time.
- Travel buffer.
- Blocked/unavailable.

### 13.4 Booking Detail

Clicking a calendar event should show:

- Customer.
- Job type.
- Address.
- Phone.
- Notes.
- Estimate.
- AI call summary.
- Actions: confirm, reschedule, cancel, send SMS, open job.

---

## 14. Customers

### 14.1 Purpose

Customers store the full relationship history.

The owner should quickly know:

- Who the customer is.
- What jobs they have had.
- What was quoted.
- What was paid.
- What was said.
- What should happen next.

### 14.2 Customer List

Customer row/card fields:

- Name.
- Phone.
- Email.
- Suburb.
- Customer type.
- Last contact.
- Lifetime value.
- Open jobs.
- Outstanding invoices.

Customer types:

- New lead.
- Active customer.
- Repeat customer.
- VIP.
- Problem customer.
- Commercial.
- Real estate/property manager.

### 14.3 Customer Profile

Sections:

1. Contact details.
2. Property details.
3. Timeline.
4. Jobs.
5. Quotes.
6. Invoices.
7. Call recordings.
8. SMS/email history.
9. AI summary.
10. Notes.
11. Tags.

### 14.4 Customer AI Summary

Example:

“Repeat customer. Has used the business twice for duct cleaning and one split system service. Prefers SMS. Usually available after 3 pm. Last invoice was paid same day. Good customer.”

---

## 15. Quotes

### 15.1 Purpose

Quotes help the owner turn leads into booked work.

RyanOS should help with:

- Estimate ranges during calls.
- Draft quote generation.
- Quote approval.
- Quote sending.
- Quote follow-up.
- Quote conversion tracking.

### 15.2 Quote Pipeline

Statuses:

- Draft.
- Needs owner approval.
- Sent.
- Viewed.
- Follow-up due.
- Accepted.
- Declined.
- Expired.

### 15.3 Quote List Fields

- Customer.
- Job type.
- Amount/range.
- Status.
- Created date.
- Sent date.
- Follow-up date.
- Probability.
- Source.

### 15.4 Quote Detail

Sections:

1. Quote summary.
2. Customer details.
3. Job details.
4. Price line items.
5. AI reasoning.
6. Comparable previous jobs.
7. Margin/risk notes.
8. Terms.
9. Send/approve actions.

### 15.5 AI Estimate Rules

AI can suggest a range, not guarantee a final price unless the owner has configured fixed pricing.

The UI must make this clear.

Example language:

- “Suggested estimate range: $450-$700.”
- “Based on 12 similar jobs and your uploaded invoices.”
- “Owner approval recommended before sending final quote.”

### 15.6 Prior Invoice Learning

RyanOS should allow the owner to upload previous invoices so AI can learn:

- Typical job types.
- Price ranges.
- Labour patterns.
- Materials.
- Minimum callout fees.
- Suburb/travel effects.
- Seasonal work types.

The upload screen should explain:

“Upload old invoices so RyanOS can learn how your business prices real jobs. This helps the AI give better estimate ranges and draft quotes.”

---

## 16. Invoices

### 16.1 Purpose

Invoices track money owed and help reduce late payment.

MVP can show invoice records and statuses even before full accounting integration.

### 16.2 Invoice Statuses

- Draft.
- Sent.
- Viewed.
- Due soon.
- Overdue.
- Paid.
- Part-paid.
- Written off.

### 16.3 Invoice List Fields

- Invoice number.
- Customer.
- Job.
- Amount.
- Due date.
- Status.
- Days overdue.
- Payment link.

### 16.4 AI Invoice Follow-up

AI can suggest or send reminders.

Examples:

- “Invoice #1042 is 7 days overdue. Send polite SMS reminder?”
- “3 invoices are due this week, total $4,870.”

---

## 17. Analytics

### 17.1 Purpose

Analytics should be simple and money-focused.

The user should not feel like they are looking at enterprise reporting software.

### 17.2 Core Metrics

Revenue:

- Revenue today.
- Revenue this week.
- Revenue this month.
- Average job value.
- Pipeline value.

Lead performance:

- New leads.
- Calls answered.
- Missed calls.
- Missed calls recovered.
- Lead-to-booking conversion.
- Quote conversion.
- Average response time.

Operations:

- Jobs completed.
- Jobs cancelled.
- Technician utilisation.
- Travel gaps.
- Unscheduled jobs.

AI performance:

- Calls handled by AI.
- Bookings created by AI.
- AI confidence average.
- Human review rate.
- Escalations.
- Failed calls.

Marketing:

- Lead source.
- Google Ads leads.
- Facebook leads.
- Website leads.
- Cost per lead.
- Cost per booked job.

### 17.3 Analytics Design Rule

Every chart should answer a clear question.

Examples:

- “Are calls turning into bookings?”
- “Where are our best leads coming from?”
- “Are we following up quotes fast enough?”
- “Is AI saving admin time?”

Avoid useless vanity charts.

---

## 18. AI Assistant

### 18.1 Purpose

The AI Assistant is the command line for the business owner.

It should feel like the owner can ask the business anything.

### 18.2 Assistant Capabilities

The owner can ask:

- “What jobs are booked today?”
- “Show unpaid invoices.”
- “Which quotes need follow-up?”
- “Summarise yesterday.”
- “Who called while I was working?”
- “Book Sarah for tomorrow afternoon.”
- “Create a quote for the Wodonga split system job.”
- “Find jobs over $1,000 this month.”
- “Which Google Ads leads became jobs?”
- “What should I focus on today?”
- “Draft an SMS to Daniel about his quote.”

### 18.3 Assistant UI

The assistant should include:

- Chat input.
- Suggested prompts.
- Business context cards.
- Action confirmations.
- Source links.
- Safe approval flow before sending messages or changing bookings.

### 18.4 Assistant Safety Rule

The AI should ask for confirmation before:

- Sending a quote.
- Cancelling a job.
- Sending a customer message with price.
- Changing calendar bookings.
- Deleting records.
- Marking invoices paid.

---

## 19. Automations

### 19.1 Purpose

Automations let the owner configure simple rules.

Example:

“When a customer misses a call, send SMS within 1 minute.”

### 19.2 MVP Automation Rules

Recommended automation cards:

1. Missed call reply.
2. Booking confirmation SMS.
3. Job reminder SMS.
4. Quote follow-up after 2 days.
5. Invoice reminder after due date.
6. Review request after completed job.
7. Owner alert for urgent jobs.
8. AI handoff when confidence is low.

### 19.3 Automation Card Layout

Each automation should show:

- Name.
- Trigger.
- Action.
- Status on/off.
- Last run.
- Edit button.

Example:

Name: Quote follow-up  
Trigger: Quote sent and not accepted after 48 hours  
Action: Send polite SMS asking if customer has questions  
Status: On

---

## 20. Knowledge Base

### 20.1 Purpose

The Knowledge Base teaches the AI how the business operates.

This is critical because RyanOS must answer calls correctly.

### 20.2 Knowledge Base Sections

- Services offered.
- Areas serviced.
- Opening hours.
- Emergency rules.
- Pricing rules.
- Callout fees.
- Warranty policy.
- Booking rules.
- Team members.
- Common questions.
- Scripts.
- Uploaded invoices.
- Uploaded documents.

### 20.3 Pricing Rules

The owner should be able to configure:

- Minimum callout.
- After-hours fee.
- Emergency fee.
- Travel fee by distance/suburb.
- Fixed-price services.
- Estimate-only services.
- Services not offered.

Example:

“Do not quote final price for ducted system replacement without site inspection.”

---

## 21. Settings

### 21.1 Settings Sections

Recommended settings structure:

1. Business profile.
2. Services.
3. Service areas.
4. Phone and AI voice.
5. AI behaviour.
6. Pricing rules.
7. Calendar availability.
8. SMS/email templates.
9. Integrations.
10. Team.
11. Billing.
12. Security.

### 21.2 Business Profile

Fields:

- Business name.
- ABN.
- Logo.
- Phone.
- Email.
- Website.
- Address.
- Trading hours.
- Emergency availability.

### 21.3 AI Voice Settings

Fields:

- Voice selection.
- Speaking speed.
- Greeting.
- Filler words setting.
- Escalation phone number.
- After-hours behaviour.
- Call recording on/off.
- Disclosure message.

Example greeting:

“Thanks for calling Alpine Fresh, this is the AI assistant. I can help book a job or take a message. How can I help today?”

### 21.4 AI Behaviour Settings

Configurable behaviours:

- How direct the AI should be.
- Whether AI can book automatically.
- Whether owner approval is required.
- What jobs count as urgent.
- Which services AI can estimate.
- Which services require human review.
- How to handle angry customers.
- How to handle emergency jobs.

---

## 22. Onboarding Flow

### 22.1 Onboarding Goal

Onboarding must get the owner from zero to “AI can answer calls safely” as fast as possible.

The owner should not face a giant form.

Use guided steps.

### 22.2 Onboarding Steps

1. Business basics.
2. Services offered.
3. Service areas.
4. Opening hours.
5. Emergency rules.
6. Pricing basics.
7. Upload old invoices.
8. Connect phone number.
9. Choose AI voice.
10. Test call.
11. Review AI settings.
12. Go live.

### 22.3 Onboarding Progress UI

A progress bar should show:

- Setup 20% complete.
- Setup 50% complete.
- Ready for test call.
- Ready to go live.

### 22.4 Test Call Screen

The owner should be able to test the AI before going live.

Screen elements:

- Test phone call button.
- Example customer scenarios.
- Live transcript.
- AI extracted fields.
- Pass/fail result.
- Fix settings button.

Example scenarios:

- New customer wants quote.
- Existing customer reschedules.
- Emergency job.
- Price shopper.
- Complaint.

---

## 23. Core AI Receptionist Workflow

### 23.1 Inbound Call Flow

1. Customer calls business number.
2. AI answers with configured greeting.
3. AI asks what the customer needs.
4. AI identifies job type.
5. AI collects name.
6. AI collects phone number if not available.
7. AI collects address/suburb.
8. AI asks urgency.
9. AI asks relevant job questions.
10. AI checks service area.
11. AI checks pricing/estimate rules.
12. AI checks calendar availability.
13. AI suggests or reserves time.
14. AI summarises back to customer.
15. AI confirms next step.
16. RyanOS creates/updates customer record.
17. RyanOS creates job record.
18. RyanOS sends SMS/email confirmation.
19. RyanOS notifies owner.
20. RyanOS stores recording and transcript.

### 23.2 AI Confidence Handling

AI should assign confidence after each call.

Confidence levels:

- High: AI handled successfully.
- Medium: AI handled but owner review suggested.
- Low: Owner must review before action.

Low-confidence triggers:

- Customer angry.
- Pricing unclear.
- Emergency risk.
- Legal/safety issue.
- Service not recognised.
- Customer asks for guarantee.
- AI cannot understand address.
- Customer disputes previous work.

### 23.3 Emergency Handling

For urgent/emergency work, AI should:

- Stay calm.
- Collect location and issue.
- Avoid overpromising.
- Escalate to owner.
- Tell customer the business will call back soon if owner approval is needed.

Example:

“Because this sounds urgent, I’m going to send this straight to the owner now. I’ll make sure they have your name, number, address and what’s happened.”

---

## 24. Trade-Specific Intake Examples

### 24.1 HVAC Repair

Questions:

- Is it heating, cooling, or both?
- What type of system is it?
- Is there an error code?
- How old is the system?
- Is the unit still running?
- Is it leaking water?
- Is this urgent today?

### 24.2 Plumbing

Questions:

- Is there active leaking?
- Can you turn the water off?
- Is it blocked drain, tap, toilet, hot water, or burst pipe?
- Is it inside or outside?
- Is the property accessible?
- Is this an emergency?

### 24.3 Electrical

Questions:

- Is there sparking, smoke, burning smell, or exposed wire?
- Has power tripped?
- Is the issue affecting the whole house or one area?
- Is anyone in danger?
- Is this urgent?

### 24.4 Roof / Gutter

Questions:

- Is there water entering the house?
- Is it roof leak, gutter clean, repair, or inspection?
- Is the roof tile, metal, or other?
- Is it single-storey or double-storey?
- Are there photos available?

### 24.5 Chimney Sweep

Questions:

- Is it a wood heater or open fireplace?
- When was it last cleaned?
- Is there smoke backing into the house?
- Is the flue accessible?
- Single-storey or double-storey?

### 24.6 Water Tank Cleaning

Questions:

- How many tanks?
- Approximate tank size?
- Are the tanks at least three-quarters full?
- Is access clear?
- Is it drinking water, garden water, or other?
- Is there visible sludge, smell, or contamination?

---

## 25. Data Model Concepts

This is not a database schema, but the UI should reflect these concepts.

### 25.1 Customer

Fields:

- Name.
- Phone.
- Email.
- Address.
- Suburb.
- Tags.
- Notes.
- Communication preference.
- Lifetime value.
- Created date.

### 25.2 Job

Fields:

- Job title.
- Job type.
- Status.
- Customer.
- Address.
- Scheduled time.
- Assigned technician.
- Source.
- Urgency.
- Estimate range.
- Quote link.
- Invoice link.
- AI confidence.
- Notes.

### 25.3 Call

Fields:

- Caller number.
- Customer.
- Time.
- Duration.
- Recording.
- Transcript.
- Summary.
- Outcome.
- Extracted fields.
- Confidence.
- Linked job.

### 25.4 Quote

Fields:

- Quote number.
- Customer.
- Job.
- Status.
- Amount/range.
- Line items.
- Sent date.
- Viewed date.
- Follow-up date.
- Accepted/declined date.

### 25.5 Invoice

Fields:

- Invoice number.
- Customer.
- Job.
- Amount.
- Due date.
- Status.
- Payment link.

---

## 26. Notifications

### 26.1 Owner Notifications

Notify owner when:

- AI books a job.
- AI needs review.
- Customer sounds angry.
- Emergency call received.
- Quote accepted.
- Quote needs follow-up.
- Invoice overdue.
- Customer cancels.
- Test call fails.

### 26.2 Notification Design

Notifications should include:

- Clear title.
- Short summary.
- Urgency level.
- Direct action.

Example:

Title: Urgent plumbing call  
Summary: Customer has active leak in Wodonga. AI collected address and phone number.  
Action: Call customer now

---

## 27. Search

Global search should find:

- Customers.
- Jobs.
- Calls.
- Quotes.
- Invoices.
- Phone numbers.
- Addresses.
- Suburbs.
- Transcript keywords.

Search should be accessible from the top bar.

---

## 28. Mobile Behaviour

RyanOS should be desktop-first for the owner dashboard, but mobile-friendly for tradespeople.

Mobile priority:

- Today’s jobs.
- Call customer.
- Open maps.
- Read job notes.
- Upload photos.
- Mark complete.
- Send customer SMS.
- View urgent alerts.

Mobile should not try to show complex analytics first.

---

## 29. Design Requirements for Figma

### 29.1 Visual Style

- Dark mode first.
- Premium SaaS look.
- Clean spacing.
- Rounded cards.
- Clear hierarchy.
- Strong contrast.
- Minimal clutter.
- Professional typography.
- Modern sidebar.
- Calm but powerful.

### 29.2 Reference Quality

The design quality should feel inspired by:

- Linear.
- Stripe.
- Notion.
- Vercel.
- Raycast.
- Cursor.
- OpenAI dashboard.
- Slack admin UI.

Do not copy these directly. Use them as quality benchmarks.

### 29.3 Avoid

Avoid:

- Generic admin templates.
- Cartoon icons.
- Too many colours.
- Fake crypto-style dashboard look.
- Overcrowded charts.
- Enterprise bloat.
- Tiny unreadable text.
- Confusing tables.
- Too much blue everywhere.

---

## 30. MVP Screens to Design First

Figma should initially create these screens:

1. Landing dashboard.
2. Calls list.
3. Call detail with transcript.
4. Jobs list.
5. Job detail.
6. Calendar week view.
7. Customer profile.
8. Quotes pipeline.
9. AI Assistant chat.
10. Onboarding flow.
11. Settings: AI voice.
12. Knowledge Base: pricing rules.

These 12 screens are enough to demonstrate the core product.

---

## 31. Screen-Level Detail for Figma AI

### 31.1 Dashboard Screen

Create a dark-mode SaaS dashboard for RyanOS.

Include:

- Left sidebar navigation.
- Top search bar.
- AI status indicator.
- Today summary cards.
- Today’s schedule.
- Recent AI calls.
- AI recommendations.
- Quote pipeline.
- Revenue snapshot.

### 31.2 Calls Screen

Create a calls management page.

Include:

- Filters for All, Booked, Needs Review, Missed, Urgent.
- Table or card list of calls.
- AI confidence badges.
- Call outcome badges.
- Button to review transcript.
- Search by phone number/customer.

### 31.3 Call Detail Screen

Create a call detail page.

Include:

- AI summary card.
- Audio player.
- Transcript panel.
- Extracted fields panel.
- Linked job panel.
- Confidence score.
- Owner action buttons.

### 31.4 Jobs Screen

Create a jobs pipeline screen.

Include:

- Status tabs.
- Job cards/table.
- Filters by date, technician, status, source.
- Estimated value.
- Urgency.
- AI-created badge.

### 31.5 Job Detail Screen

Create a job detail page.

Include:

- Header with job status and main action.
- Customer card.
- Address card.
- Schedule card.
- Notes.
- AI summary.
- Quote/invoice panels.
- Timeline.

### 31.6 AI Assistant Screen

Create an AI command centre chat.

Include:

- Chat area.
- Suggested prompts.
- Context cards.
- Action confirmation cards.
- Sources/linked records.

### 31.7 Onboarding Screen

Create guided onboarding.

Include:

- Stepper.
- Business details.
- Service selection.
- Service area.
- Invoice upload.
- AI voice setup.
- Test call.
- Go live checklist.

---

## 32. Business Rules

### 32.1 Booking Rules

AI can book automatically only when:

- Service is recognised.
- Customer is in service area.
- Price rules are clear.
- Calendar slot is available.
- Urgency is not unsafe.
- AI confidence is above threshold.

Otherwise AI should reserve or request owner approval.

### 32.2 Pricing Rules

AI can provide:

- Fixed price if configured.
- Estimate range if enough data exists.
- “Needs inspection” if price is uncertain.

AI should not guarantee final price unless owner allows it.

### 32.3 Escalation Rules

AI escalates when:

- Customer is angry.
- Customer threatens legal action.
- Safety risk exists.
- Emergency exists.
- AI does not understand.
- Customer asks for exact price outside rules.
- Job is outside service area but high value.

---

## 33. Integrations

### 33.1 MVP Integrations

Potential MVP integrations:

- Phone/voice provider such as Vapi or Twilio.
- SMS provider.
- Email provider.
- Google Calendar.
- Stripe or payment link provider later.
- File upload for invoices.

### 33.2 Later Integrations

- Xero.
- MYOB.
- QuickBooks.
- ServiceM8.
- Tradify.
- Google Ads.
- Meta Ads.
- Zapier/Make.
- Google Business Profile.

---

## 34. Empty States

Empty states should help the user take action.

Examples:

Calls empty state:

“No calls yet. Connect your phone number or run a test call to see RyanOS capture customer details.”

Jobs empty state:

“No jobs booked yet. When AI captures a booking, it will appear here.”

Quotes empty state:

“No quotes created yet. Upload old invoices so RyanOS can learn your pricing.”

---

## 35. Error and Review States

RyanOS must be honest when AI is unsure.

Example UI states:

- Needs review.
- Low confidence.
- Missing address.
- Price unclear.
- Outside service area.
- Customer requested human call.
- Emergency escalation.

The UI should not hide uncertainty.

---

## 36. Security and Trust

Because RyanOS handles customer data and recordings, the UI should show trust clearly.

Trust elements:

- Call recording indicator.
- Data privacy controls.
- Role permissions.
- Activity log.
- AI action history.
- Confirmation before customer-facing actions.

The product should feel safe enough to trust with real customers.

---

## 37. Key Differentiators

RyanOS should stand apart from generic field-service software by focusing on AI-first operations.

Differentiators:

- AI answers the phone.
- AI creates jobs from calls.
- AI gives estimate ranges from prior invoices.
- AI surfaces missed money.
- AI recommends next actions.
- AI works through phone, SMS, email, dashboard and chat.
- Built for non-technical trade owners.

---

## 38. Success Metrics

RyanOS is successful if it improves:

- Calls answered.
- Jobs booked.
- Quote follow-up rate.
- Lead response time.
- Admin hours saved.
- Revenue captured.
- Customer response speed.
- Owner stress reduction.

### 38.1 MVP Business Success

For the RyanOS business itself:

- First paying client.
- Three paying clients.
- $1,000 MRR.
- $3,000 MRR.
- Positive customer retention after 60 days.
- Clear evidence AI recovered missed jobs.

---

## 39. Non-Goals for MVP

Do not overbuild MVP with:

- Full accounting system.
- Complex payroll.
- Enterprise permissions.
- Franchise management.
- Deep inventory management.
- Native mobile app.
- Marketplace.
- Full website builder.
- Overly complex reporting.

The MVP should prove:

1. AI can answer and qualify calls.
2. AI can create jobs.
3. Owner can review and control the system.
4. Dashboard makes business clearer.
5. The product saves time and captures more work.

---

## 40. Figma AI Master Prompt

Use this prompt after uploading or pasting this document into Figma AI:

```text
You are designing RyanOS, an AI operating system for trade businesses.

Create a premium dark-mode SaaS dashboard and product UI for a trade business owner.

RyanOS combines AI phone receptionist, call transcripts, job booking, customer CRM, quote pipeline, invoice follow-up, AI assistant chat, business analytics, automations, onboarding, and settings.

The target user is a non-technical trade business owner such as an HVAC technician, plumber, electrician, roofer, chimney sweep, tank cleaner, landscaper or property maintenance operator.

The UI should feel like Linear, Stripe, Notion, Vercel, Raycast, Cursor and OpenAI quality, but designed specifically for trades.

Design dark mode first with a clean left sidebar, strong typography, rounded cards, clear hierarchy, useful metrics, and simple workflows.

Create these initial screens:
1. Dashboard command centre
2. Calls list
3. Call detail with transcript and AI summary
4. Jobs list / pipeline
5. Job detail
6. Calendar week view
7. Customer profile
8. Quotes pipeline
9. AI Assistant chat
10. Guided onboarding
11. AI voice settings
12. Knowledge Base pricing rules

Every screen must answer what happened, what needs attention, and what action the owner should take next.

Avoid generic admin templates. Avoid clutter. Avoid fake meaningless charts. Make it practical, premium, and trade-aware.
```

---

## 41. Design Acceptance Criteria

A good RyanOS design should pass these checks:

- Can a trade owner understand the dashboard in 10 seconds?
- Is it obvious what needs attention?
- Can the owner review an AI-handled call quickly?
- Can the owner see whether a job was booked?
- Can the owner find customer history easily?
- Can the owner approve or edit AI-created quotes?
- Does the product feel premium enough to charge $1,000/month?
- Does the design look specific to trade businesses, not generic SaaS?
- Does the AI feel useful but controlled?
- Are actions safe and reviewable?

---

## 42. Final Product Direction

RyanOS should feel like the business owner has opened a control room for their company.

The UI should make it obvious that:

- AI is answering calls.
- Jobs are being captured.
- Quotes are being followed up.
- Money is being tracked.
- The owner is still in control.

The highest priority is not visual flash.

The highest priority is clarity, trust, and action.

RyanOS should help a trade business stop leaking leads, stop missing calls, stop forgetting admin, and start operating like a much bigger company.
