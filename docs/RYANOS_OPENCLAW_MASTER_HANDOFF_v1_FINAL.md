---

# FILE: RYANOS_OPENCLAW_BUILD_PROMPT_v1_FINAL.md

# Paste Into OpenClaw — RyanOS v1 Final Build Prompt

You are OpenClaw building RyanOS v1.

Use the attached RyanOS handoff docs plus RYANOS_V1_FINAL_ADDENDUM.md as source of truth. The addendum overrides older UX wording where needed.

RyanOS is an AI office manager for Australian trade businesses. It answers calls, sorts messages, tracks where every customer is up to, and gives the owner one daily action queue to clear.

Do not invent a new product. Do not turn it into a generic CRM. Do not overbuild.

## Build first

- Database schema
- State machine
- Seed data matching Figma
- Dashboard Action Queue
- Inbox conversations and journey tracker
- Message preview before send
- Quote builder and quote accepted → job booked flow
- Jobs and calendar
- Mobile job notes
- Lightweight payment status

## Critical rule

Every button that changes state must update linked records.

Example: Book job must update Inbox stage, Job status, Calendar event, Customer timeline, Dashboard action item, and customer confirmation preview.

No customer-facing message may send without owner confirmation.

## MVP exclusions

Do not build full invoicing/accounting, bank reconciliation, inventory, route optimisation, advanced analytics, marketing campaigns, complex permissions, or a full customer portal.

## Success demo

New enquiry → AI captures call/message → Inbox stage updates → Quote created/sent → Customer replies/accepts → Convert to job → Booking time selected → Calendar updated → Mobile job notes added on site → Job complete → Ready to invoice → Invoice sent → Paid or Overdue.


---

# FILE: RYANOS_V1_FINAL_ADDENDUM.md

# RYANOS_V1_FINAL_ADDENDUM.md

## Use this addendum with the OpenClaw handoff pack

Figma is now paused enough to hand to OpenClaw. Treat the previous handoff docs as the base system spec, with these final UX updates overriding older wording where there is conflict.

## Final Figma UX decisions

- Dashboard is a Daily Action Queue, not an analytics dashboard.
- Dashboard action cards are simplified: priority label, customer name, plain-English summary, one large primary action, maximum two secondary actions.
- Remove distracting details from dashboard cards: no phone number header, no “why it matters” paragraph, no visible linked-record pill unless opened in details.
- Calls live inside Inbox as a filter, not as a sidebar page.
- Inbox is now a two-column layout: conversation list on the left, natural scroll-down work area on the right.
- Inbox right area has: sticky customer header, journey tracker, next-action banner, message thread, “Where this is up to”, linked records, payment actions, AI context, suggested actions, sticky reply bar.
- Any customer-facing message must open a message preview modal before sending.
- Emergency calls need guardrails: AI can collect details and suggest safe basic steps, but cannot diagnose or give repair advice.
- Payment stays lightweight: Ready to invoice, Invoice sent, Unpaid, Paid, Overdue.
- Mobile must prioritise: Action Queue, Today’s Jobs, Inbox, quote approvals, and job completion notes.
- Job notes while on site are now part of MVP: work performed, materials used, extra charges, internal notes, invoice notes, and photos.

## Partner validation

The Figma MVP was shown to a user’s partner who previously worked in admin for a waste company. She understood the product immediately, liked the Dashboard “what to do next” Action Queue, liked the Inbox and invoice/payment workflow, and said the main missing practical feature was mobile job notes at the customer house to add more details for the invoice.

## New MVP requirement: Mobile Job Notes

When the owner is at a customer’s house, they should be able to open the job on mobile and capture:

- Work performed
- Internal notes
- Invoice/customer-facing notes
- Materials used
- Extra work found
- Extra charge amount
- Photos
- Voice note transcript later if supported
- Mark note as “include on invoice”

Flow:

Today’s Jobs → Open Job → Call / Navigate / Mark on way / Arrived → Add Notes → Add Materials/Photos → Mark Complete → Ready to invoice

Job notes should be available later when creating the invoice draft.

## OpenClaw build priority after addendum

1. Database + state machine
2. Dashboard Action Queue
3. Inbox conversations + journey tracker
4. Quote builder + quote acceptance flow
5. Jobs + calendar booking
6. Mobile job notes
7. Lightweight payment status
8. Vapi/Twilio webhook stubs
9. Tests

## Do not build yet

- Full accounting
- Full invoicing system
- Inventory management
- Route optimisation
- Advanced analytics
- Marketing campaigns
- Complex permissions
- Full customer portal


---

# FILE: RYANOS_OPENCLAW_HANDOFF_README.md

# RyanOS OpenClaw Handoff Pack

## Purpose

This pack turns the Figma RyanOS MVP into a buildable OpenClaw specification.

Figma has defined the visible product:
- Dashboard Action Queue
- Inbox / Communications Hub
- Customer Journey Tracker
- Quote Builder
- Jobs
- Calendar
- Customers
- Settings
- Services & Pricing
- Availability Rules
- Message Preview Modal
- Emergency Guardrails
- Lightweight Payment Status

OpenClaw now needs to build the real system underneath:
- Database
- Backend API
- State transitions
- Voice/SMS/email intake
- Quote/job/calendar sync
- AI review logic
- Tests
- Deployment

## Product Positioning

RyanOS is an AI office manager for Australian trade businesses.

It answers calls, sorts messages, tracks where every customer is up to, and gives the owner one daily action queue to clear.

RyanOS must not become a generic CRM or bloated field-service platform.

## Core MVP Loop

Customer contacts business
→ AI answers or summarises
→ Inbox records conversation
→ Journey stage updates
→ Dashboard creates action card
→ Owner approves/replies/books/marks done
→ Quote/job/calendar/payment status updates
→ Customer receives confirmed message
→ Action clears

## Build Priority

1. State Machine
2. Database Schema
3. Backend API
4. Voice/SMS/Email Flow
5. Frontend Handoff
6. Test Plan

## MVP Scope

Build:
- AI call/message intake
- Inbox conversations
- Customer journey stages
- Dashboard action queue
- Quote creation and acceptance workflow
- Job booking
- Calendar availability rules
- Lightweight payment status
- Human review queue
- Emergency guardrails

Do not build yet:
- Full invoicing/accounting
- Bank reconciliation
- Inventory
- Route optimisation
- Advanced analytics
- Marketing campaigns
- Complex team permissions
- Full customer portal


---

# FILE: RYANOS_STATE_MACHINE.md

# RyanOS State Machine

## Purpose

RyanOS must behave as one connected system. Dashboard, Inbox, Quotes, Jobs, Calendar, Customers, and Payment Status must not disagree.

Core rule:

Every customer interaction creates or updates a stage.
Every stage has one next best action.
Every owner action updates linked records.
The Dashboard only shows items that need a decision.

## Primary Entities

- Customer
- Conversation
- Lead / Job Request
- Quote
- Job
- Calendar Event
- Payment Status
- Action Item

## Journey Stages

Use only the relevant path for each customer. Do not display every stage at once.

Allowed stages:
- new_enquiry
- needs_info
- needs_review
- qualified
- quote_needed
- quote_draft
- quote_sent
- quote_replied
- accepted
- needs_booking
- booked
- job_complete
- ready_to_invoice
- invoice_sent
- deposit_due
- deposit_paid
- unpaid
- paid
- overdue
- closed_lost

Plain-English labels:
- New enquiry
- Needs info
- Needs review
- Qualified
- Quote needed
- Quote draft
- Quote sent
- Quote replied
- Accepted
- Needs booking
- Booked
- Job complete
- Ready to invoice
- Invoice sent
- Deposit due
- Deposit paid
- Unpaid
- Paid
- Overdue
- Closed / lost

## Core Transitions

### New Customer Call

incoming_call_started creates:
- Conversation
- Customer if unknown
- Lead / Job Request

Initial stage:
new_enquiry

Transitions:
- needs_info if details missing
- needs_review if low confidence, emergency, unclear scope, out-of-area, angry customer, or safety risk
- qualified if enough details captured
- quote_needed if customer wants price/quote
- needs_booking if customer requests booking and AI can book/reserve

### Quote Flow

quote_needed → quote_draft  
quote_draft → quote_sent  
quote_sent → quote_replied  
quote_sent → accepted  
quote_sent → closed_lost  
quote_replied → quote_draft if owner revises  
quote_replied → accepted if customer accepts  
accepted → needs_booking  

Rules:
- Quote cannot be sent without owner confirmation in MVP.
- AI can prepare quote draft and suggested reply.
- Owner must approve before send.
- Customer-facing quote messages must show MessagePreviewModal.

### Job Booking Flow

needs_booking → booked  
qualified → booked if no quote required and booking is allowed  
accepted → needs_booking → booked  

Rules:
- Calendar availability must be checked before booked.
- If AI booking mode is reserve_for_approval, booking creates reserved slot and Action Item.
- If outside service area, stage becomes needs_review.
- If emergency, stage becomes needs_review and urgent Action Item.

### Job Completion / Payment Flow

booked → job_complete  
job_complete → ready_to_invoice  
ready_to_invoice → invoice_sent  
invoice_sent → unpaid  
invoice_sent → paid  
unpaid → overdue  
overdue → paid  

Rules:
- MVP does not build full invoice system.
- Create invoice draft, Mark invoice sent, Mark paid, and Send reminder are lightweight actions.
- Payment status must appear on Dashboard Action Queue when relevant.

## Action Items

Generated when owner attention is needed.

Types:
- urgent
- needs_review
- quote_reply
- accepted_quote
- missed_call
- booking_issue
- ready_invoice
- unpaid
- overdue
- duplicate_warning

Statuses:
- open
- completed
- snoozed
- dismissed

Sort order:
1. urgent
2. needs_review
3. accepted_quote
4. quote_reply
5. booking_issue
6. missed_call
7. ready_invoice
8. unpaid
9. overdue
10. duplicate_warning

## Button Behaviour Rules

### Call Now
- Adds owner_call_started event.
- Updates customer last_contacted_at.
- Does not complete the job or book automatically.

### Book Job
Requires customer, job type, location, and available calendar slot.

Updates:
- job.status = booked
- calendar_event created
- conversation.current_stage = booked
- action_item.status = completed
- conversation timeline adds booking event

Customer confirmation must preview before sending.

### Use AI Reply
Opens MessagePreviewModal. Does not send silently.

### Approve & Send Quote
Opens Quote Preview / MessagePreviewModal.
After send:
- quote.status = sent
- conversation.current_stage = quote_sent
- timeline adds quote_sent

### Convert Quote to Job
Requires quote.status = accepted and booking time selected.

Creates:
- Job
- Calendar Event
- conversation stage update
- action item completion

### Mark Complete
Updates:
- job.status = complete
- stage = job_complete
- creates ready_invoice action item

### Mark Paid
Updates:
- payment_status = paid
- stage = paid
- closes unpaid/overdue action items

## Human Review Triggers

Create needs_review action when:
- AI confidence low
- job type unclear
- quote scope unclear
- emergency detected
- out of service area
- customer asks for human
- customer angry or abusive
- safety risk detected
- possible legal/regulatory issue
- duplicate customer suspected
- quote outside approved range
- booking outside availability rules

## Emergency Guardrails

Emergency examples:
- burst pipe
- gas smell/leak
- electrical risk
- roof leak in storm
- injury risk
- asbestos/safety concern

Rules:
- Mark urgent.
- Put at top of Action Queue.
- Alert owner immediately.
- AI may give basic safe guidance only, such as turn off water if safe.
- AI must not diagnose, repair-guide, or make unsafe technical claims.
- Owner review required before final booking decision if safety risk exists.

## Integrity Rule

A state change must update all linked views:
- Dashboard Action Queue
- Inbox journey tracker
- Customer timeline
- Quote status
- Job status
- Calendar status
- Payment status

There must be one source of truth for current stage and next action.


---

# FILE: RYANOS_DATABASE_SCHEMA.md

# RyanOS Database Schema

## Purpose

Practical MVP PostgreSQL schema for RyanOS.

Recommended:
- PostgreSQL
- UUID primary keys
- created_at and updated_at on all tables
- JSONB for simple flexible metadata
- Do not overbuild accounting/inventory/route planning

## businesses

- id uuid primary key
- name text not null
- trading_name text
- owner_name text
- phone text
- email text
- timezone text default 'Australia/Sydney'
- service_area_label text
- base_suburb text
- created_at timestamp
- updated_at timestamp

## customers

- id uuid primary key
- business_id uuid references businesses(id)
- first_name text
- last_name text
- display_name text not null
- phone text
- email text
- address_line text
- suburb text
- state text
- postcode text
- lead_source text
- lifetime_value_cents integer default 0
- tags jsonb default '[]'
- notes text
- possible_duplicate_of uuid references customers(id)
- duplicate_status text default 'none'
- created_at timestamp
- updated_at timestamp

Indexes:
- business_id
- phone
- email
- suburb

## conversations

- id uuid primary key
- business_id uuid references businesses(id)
- customer_id uuid references customers(id)
- title text
- channel text not null
  - call
  - sms
  - email
  - web_form
  - ai_escalation
  - mixed
- current_stage text not null
- next_best_action text
- blocker text
- urgency text default 'normal'
- ai_summary text
- ai_confidence_level text
- needs_human_review boolean default false
- unread_count integer default 0
- last_message_at timestamp
- created_at timestamp
- updated_at timestamp

Indexes:
- business_id
- customer_id
- current_stage
- urgency
- needs_human_review
- last_message_at

## conversation_messages

- id uuid primary key
- conversation_id uuid references conversations(id)
- sender_type text not null
  - customer
  - owner
  - ai
  - system
- channel text not null
  - call
  - sms
  - email
  - web_form
  - internal
- body text not null
- direction text
  - inbound
  - outbound
  - internal
- sent_to_customer boolean default false
- preview_confirmed_by_owner boolean default false
- external_message_id text
- created_at timestamp

Indexes:
- conversation_id
- created_at

## call_records

- id uuid primary key
- business_id uuid references businesses(id)
- conversation_id uuid references conversations(id)
- customer_id uuid references customers(id)
- phone_number text
- direction text
- status text
  - answered_by_ai
  - missed
  - abandoned
  - owner_answered
  - voicemail
- started_at timestamp
- ended_at timestamp
- duration_seconds integer
- recording_url text
- transcript text
- ai_summary text
- emergency_detected boolean default false
- human_review_required boolean default false
- created_at timestamp
- updated_at timestamp

## jobs

- id uuid primary key
- business_id uuid references businesses(id)
- customer_id uuid references customers(id)
- conversation_id uuid references conversations(id)
- quote_id uuid references quotes(id)
- title text not null
- service_type text
- description text
- status text not null
  - new
  - needs_review
  - booked
  - confirmed
  - on_the_way
  - in_progress
  - complete
  - ready_to_invoice
  - cancelled
  - no_show
- urgency text
- address_line text
- suburb text
- state text
- postcode text
- estimated_value_min_cents integer
- estimated_value_max_cents integer
- scheduled_start timestamp
- scheduled_end timestamp
- completed_at timestamp
- internal_notes text
- created_at timestamp
- updated_at timestamp

Indexes:
- business_id
- customer_id
- status
- scheduled_start

## quotes

- id uuid primary key
- business_id uuid references businesses(id)
- customer_id uuid references customers(id)
- conversation_id uuid references conversations(id)
- job_id uuid references jobs(id)
- quote_number text not null
- title text not null
- status text not null
  - draft
  - sent
  - viewed
  - replied
  - accepted
  - declined
  - expired
  - converted
- ai_suggested_min_cents integer
- ai_suggested_max_cents integer
- owner_final_price_cents integer
- subtotal_cents integer
- discount_cents integer default 0
- gst_cents integer default 0
- total_cents integer
- deposit_required boolean default false
- deposit_amount_cents integer
- terms text
- internal_notes text
- ai_reasoning text
- ai_confidence_level text
- sent_at timestamp
- accepted_at timestamp
- declined_at timestamp
- created_at timestamp
- updated_at timestamp

## quote_line_items

- id uuid primary key
- quote_id uuid references quotes(id)
- category text
  - labour
  - materials
  - travel
  - extras
  - discount
- description text not null
- quantity numeric default 1
- unit_price_cents integer not null
- total_cents integer not null
- sort_order integer default 0
- created_at timestamp
- updated_at timestamp

## calendar_events

- id uuid primary key
- business_id uuid references businesses(id)
- customer_id uuid references customers(id)
- job_id uuid references jobs(id)
- title text not null
- status text
  - reserved
  - booked
  - confirmed
  - completed
  - cancelled
- start_time timestamp not null
- end_time timestamp not null
- location text
- external_calendar_id text
- external_event_id text
- created_at timestamp
- updated_at timestamp

## payments

Lightweight MVP payment tracking only.

- id uuid primary key
- business_id uuid references businesses(id)
- customer_id uuid references customers(id)
- job_id uuid references jobs(id)
- quote_id uuid references quotes(id)
- status text not null
  - not_applicable
  - ready_to_invoice
  - invoice_draft
  - invoice_sent
  - deposit_due
  - deposit_paid
  - unpaid
  - paid
  - overdue
- amount_cents integer
- due_date date
- paid_at timestamp
- invoice_reference text
- notes text
- created_at timestamp
- updated_at timestamp

## action_items

Dashboard Action Queue.

- id uuid primary key
- business_id uuid references businesses(id)
- customer_id uuid references customers(id)
- conversation_id uuid references conversations(id)
- quote_id uuid references quotes(id)
- job_id uuid references jobs(id)
- calendar_event_id uuid references calendar_events(id)
- payment_id uuid references payments(id)
- type text not null
  - urgent
  - needs_review
  - quote_reply
  - accepted_quote
  - missed_call
  - booking_issue
  - ready_invoice
  - unpaid
  - overdue
  - duplicate_warning
- priority integer not null
- title text not null
- summary text not null
- next_best_action text not null
- primary_action text not null
- secondary_actions jsonb default '[]'
- status text not null default 'open'
- completed_label text
- snoozed_until timestamp
- created_at timestamp
- updated_at timestamp

## service_pricing_rules

- id uuid primary key
- business_id uuid references businesses(id)
- service_name text not null
- description text
- enabled boolean default true
- ai_can_quote boolean default false
- lowest_price_cents integer
- highest_price_cents integer
- callout_fee_cents integer default 0
- emergency_surcharge_cents integer default 0
- after_hours_surcharge_cents integer default 0
- requires_owner_review boolean default false
- no_go boolean default false
- customer_facing_price_sentence text
- created_at timestamp
- updated_at timestamp

## availability_rules

- id uuid primary key
- business_id uuid references businesses(id)
- working_days jsonb default '["mon","tue","wed","thu","fri"]'
- start_time text default '07:00'
- end_time text default '17:00'
- buffer_minutes integer default 30
- max_jobs_per_day integer default 4
- travel_radius_km integer default 50
- booking_mode text default 'reserve_for_approval'
  - auto_book
  - reserve_for_approval
  - details_only
- emergency_slots_enabled boolean default true
- created_at timestamp
- updated_at timestamp

## ai_events

- id uuid primary key
- business_id uuid references businesses(id)
- conversation_id uuid references conversations(id)
- customer_id uuid references customers(id)
- event_type text
- input_summary text
- output_summary text
- confidence_level text
- required_human_review boolean default false
- safety_flag boolean default false
- created_at timestamp

## Integrity Rules

1. Every Action Item must link to at least one object.
2. Customer-facing messages require preview_confirmed_by_owner=true.
3. Every conversation has current_stage and next_best_action.
4. Payment tracking is lightweight only.
5. Calendar bookings must create or link a job.
6. Emergency detected creates urgent action item.
7. Low-confidence AI creates needs_review action item.


---

# FILE: RYANOS_API_SPEC.md

# RyanOS Backend API Spec

Base path: /api/v1

API style:
- REST MVP
- JSON
- UUID ids
- Auth required
- Every state-changing endpoint returns updated linked state where useful

## Business

### GET /business/me
Returns business profile, AI status, unread count, open action count.

## Dashboard Action Queue

### GET /action-items
Query:
- status=open|completed|snoozed|all
- type=urgent|needs_review|quote_reply|accepted_quote|ready_invoice|overdue
- limit
- include_completed_today=true

### POST /action-items/{id}/complete
Body:
```json
{"completed_label": "Called"}
```

### POST /action-items/{id}/snooze
Body:
```json
{"snoozed_until": "2026-06-26T15:00:00+10:00"}
```

### POST /action-items/{id}/undo

## Inbox / Conversations

### GET /conversations
Query:
- filter=all|urgent|needs_review|quotes|missed_calls|calls|unread
- stage
- customer_id
- search
- limit
- cursor

Returns list with customer summary, stage pill, last message, linked records, payment status, unread count, next best action.

### GET /conversations/{id}
Returns full conversation:
- messages
- journey path
- current stage
- next action
- blocker
- linked records
- AI context
- payment status

### POST /conversations/{id}/messages/preview
Creates preview before sending.

Body:
```json
{
  "channel": "sms",
  "body": "Thanks Sarah, price is still $899...",
  "recipient_customer_id": "uuid"
}
```

### POST /conversations/{id}/messages/send
Body:
```json
{
  "channel": "sms",
  "body": "Thanks Sarah...",
  "preview_confirmed": true
}
```

Rules:
- Reject if preview_confirmed is false for customer-facing messages.
- Add message to thread.
- Update last_contacted_at.
- May update Action Item.

### POST /conversations/{id}/stage
Manual stage update.

## Calls

Calls are accessed through Inbox.

### GET /calls
Query:
- status=answered_by_ai|missed|abandoned|all
- needs_review=true
- customer_id

### GET /calls/{id}
Returns call metadata, transcript, AI summary, extracted fields, emergency flags.

### POST /calls/webhook
Vapi/Twilio webhook endpoint.

## Customers

### GET /customers
Query:
- search
- tag
- duplicate_status
- limit

### GET /customers/{id}

### POST /customers

### PATCH /customers/{id}

### POST /customers/{id}/merge

### POST /customers/{id}/keep-separate

## Quotes

### GET /quotes
Query:
- status=draft|sent|replied|accepted|declined|converted
- customer_id
- needs_action=true

### GET /quotes/{id}

### POST /quotes
Create draft quote.

### PATCH /quotes/{id}
Update fields and line items.

### POST /quotes/{id}/ai-pricing
Returns suggested price range and line item breakdown.

### POST /quotes/{id}/preview
Returns customer-facing quote preview.

### POST /quotes/{id}/send
Requires preview_confirmed=true.

### POST /quotes/{id}/mark-accepted
Marks quote accepted and creates needs_booking action.

### POST /quotes/{id}/convert-to-job
Creates job and calendar event.

## Jobs

### GET /jobs

### GET /jobs/{id}

### POST /jobs

### PATCH /jobs/{id}

### POST /jobs/{id}/book

### POST /jobs/{id}/mark-on-way

### POST /jobs/{id}/mark-complete
Creates ready_invoice action.

### POST /jobs/{id}/cancel

## Calendar

### GET /calendar/events

### POST /calendar/check-availability
Checks rules:
- working days
- hours
- buffer
- max jobs/day
- simple travel radius

### POST /calendar/events

### PATCH /calendar/events/{id}

## Payments / Lightweight Invoice Status

### GET /payments
Query:
- status=ready_to_invoice|unpaid|overdue|paid
- customer_id
- job_id

### POST /jobs/{id}/invoice-draft

### POST /payments/{id}/mark-invoice-sent

### POST /payments/{id}/mark-paid

### POST /payments/{id}/send-reminder/preview

### POST /payments/{id}/send-reminder

## Settings

### GET /settings/services-pricing
### POST /settings/services-pricing
### PATCH /settings/services-pricing/{id}

### GET /settings/availability
### PATCH /settings/availability

### GET /settings/go-live-checklist

## AI Assistant

### POST /ai/command
Returns:
- text answer
- linked records
- suggested action

Customer-facing actions still require preview confirmation.

## Webhooks

### POST /webhooks/vapi
### POST /webhooks/twilio/sms
### POST /webhooks/email
### POST /webhooks/calendar

## API Safety Rules

1. No customer-facing send without preview_confirmed=true.
2. Emergency calls create urgent action item.
3. Low-confidence AI creates needs_review action item.
4. Quote conversion creates job and calendar event together.
5. Job completion creates ready_to_invoice action.
6. Mark paid clears unpaid/overdue action items.
7. All state changes append timeline/system event to conversation.


---

# FILE: RYANOS_FRONTEND_HANDOFF.md

# RyanOS Frontend Handoff

## Purpose

Tell OpenClaw how to connect the Figma RyanOS MVP to real backend state.

The Figma app currently uses local/mock data. Preserve the UX.

## Core UX Principle

RyanOS should feel like an AI office manager, not a CRM.

Every main screen must answer:
1. What happened?
2. What needs attention?
3. What should I do next?

## Navigation

Final sidebar:
- Dashboard
- Inbox
- Jobs
- Customers
- Quotes
- Calendar
- AI Assistant
- Settings

Calls remain inside Inbox as a filter.

## Dashboard

Purpose: daily action centre.

Layout:
1. Today’s Action Queue
2. Today’s Jobs
3. Small metric strip
4. AI status / recent activity secondary

Action cards:
- priority label
- customer name
- plain-English AI summary
- one primary action
- up to two secondary actions
- completion state
- undo if recently completed

API:
GET /api/v1/action-items?status=open

## Inbox

Layout:
Left:
- conversation list
- filters
- stage/status pills
- unread/urgent/review badges

Right:
- sticky customer header
- sticky journey tracker
- sticky next-action banner
- message thread
- where this is up to
- linked records
- payment actions
- AI context
- suggested actions
- sticky reply bar

Filters:
- All
- Urgent
- Needs review
- Quotes
- Missed calls
- Calls
- Unread

APIs:
GET /api/v1/conversations  
GET /api/v1/conversations/{id}

Message safety:
Any send action opens MessagePreviewModal.

## Customer Journey Tracker

Rules:
- show only relevant stages
- completed stages show check
- current stage highlighted
- future stages muted
- avoid long full pipeline

Example:
New enquiry → Qualified → Quote sent → Quote replied

## Quotes

Quote list:
- use clean cards, not dense tables

Quote Builder:
- customer selector
- job type
- address/suburb
- line items
- labour/materials/travel/extras
- discount
- GST
- total
- deposit toggle
- terms
- internal notes
- AI pricing panel
- preview
- send by SMS/email

## Jobs

Job cards/detail show:
- status
- customer
- suburb
- time
- urgency
- payment state
- linked quote/conversation
- quick actions

Actions:
- call
- message
- reschedule
- mark on way
- mark complete
- ready to invoice

## Calendar

Shows:
- booked jobs
- reserved slots
- urgency/status colours
- job detail links

Settings controls:
- working days
- start/end hours
- buffer
- max jobs per day
- travel radius
- booking mode

## Customers

Customer Detail shows:
- profile
- timeline
- conversations
- jobs
- quotes
- payment statuses
- duplicate warning if relevant

## Settings

Services & Pricing:
- enabled
- description
- lowest price
- highest price
- callout fee
- emergency surcharge
- AI can quote?
- customer-facing price sentence

Calendar & Availability:
- working days
- hours
- buffer
- max jobs per day
- travel radius
- booking mode:
  - AI books automatically
  - AI reserves a slot, I approve first
  - AI takes details only, I book manually

## Mobile

Mobile priority:
1. Action Queue
2. Today’s Jobs
3. Inbox
4. Quote approvals
5. AI Assistant

Use large tap targets:
- Call
- Reply
- Book
- Navigate
- Done
- Mark paid

## Frontend Safety Rules

1. Never send customer-facing message without MessagePreviewModal.
2. Primary action must be obvious.
3. AI confidence only shown when relevant.
4. Technical labels hidden behind details.
5. Emergency state must be visually distinct.
6. Completed dashboard actions should be undoable briefly.
7. Linked records navigate to correct object.


---

# FILE: RYANOS_VOICE_CALL_FLOW.md

# RyanOS Voice, SMS, and Email Flow

## Purpose

Defines how customer communication enters RyanOS.

MVP can use:
- Vapi for voice
- Twilio for SMS
- Email simulated first or integrated later

All channels resolve into Inbox.

## Channels

- Inbound call
- Missed call
- SMS reply
- Email enquiry
- Website form lead
- Quote reply
- AI escalation
- Owner outbound SMS/email

## Inbound Call Flow

1. Customer calls business number.
2. Voice provider sends call started webhook.
3. RyanOS finds or creates customer by phone.
4. RyanOS creates conversation if no active thread exists.
5. AI answers using business rules.
6. AI collects:
   - name
   - phone
   - suburb/address
   - job type
   - urgency
   - preferred time
   - quote or booking intent
7. AI checks:
   - service allowed
   - service area
   - availability rules
   - pricing rules
   - emergency/safety flags
8. AI either:
   - creates job draft
   - creates quote request
   - creates booking/reserved slot
   - asks for more info
   - escalates for human review
9. Call ends.
10. Transcript and AI summary are saved.
11. Dashboard Action Item is created if owner action needed.

## AI Voice Behaviour

AI should:
- collect details
- stay calm
- confirm information
- avoid overpromising
- avoid unsafe technical advice
- explain owner will confirm where needed

AI should not:
- diagnose complex issues
- give risky repair advice
- guarantee price unless rule allows
- book outside availability rules without approval
- argue with angry customers
- pretend to be human if business policy says disclose AI

## Standard Greeting

"Thanks for calling [Business Name], this is RyanOS, the booking assistant. How can I help today?"

## Emergency Call Script

If emergency detected:
- burst pipe
- gas smell
- electrical risk
- roof leak with active flooding
- injury
- safety concern

AI says:
"I’ll mark this as urgent and get the owner to review it as soon as possible."

Safe basic guidance only:
"If it is safe to do so, you may want to turn off the water at the main. Do not attempt repairs yourself."

AI must add internal note:
"No diagnosis or repair advice was given. Owner must assess on site."

Creates:
- urgent conversation
- urgent action item
- owner alert

## Quote Request Flow

If customer asks price:
- Check service/pricing rules.
- If allowed, provide approved range only.
- Say final price depends on job.
- Create quote draft or quote_needed stage.
- If not allowed, create needs_review.

Example:
"For chimney sweeps, this business usually charges $299 to $499 depending on the fireplace and flue. I’ll collect the details so Ryan can confirm."

## Booking Modes

### auto_book
AI can book directly if:
- service allowed
- within service area
- within work hours
- available slot exists
- no emergency/safety guardrail
- no low-confidence issue

### reserve_for_approval
AI offers/reserves a slot, but owner must approve before confirmation.

### details_only
AI only takes details and creates action item.

## Missed Call Flow

1. Missed call detected.
2. Customer matched by phone if possible.
3. Conversation created/updated.
4. SMS follow-up sent if setting allows.
5. If customer replies, Inbox stage updates and action item is created if needed.

## SMS Inbound Flow

1. Twilio webhook receives SMS.
2. Match customer by phone.
3. Add message to active conversation or create new conversation.
4. AI summarises intent.
5. Update journey stage.
6. Create action item if owner decision needed.

## Customer-Facing Message Safety

All outbound customer messages require preview in MVP.

Applies to:
- AI suggested reply
- quote send message
- booking confirmation
- decline politely
- payment reminder
- on-my-way SMS
- quote follow-up

Flow:
1. Owner clicks action.
2. MessagePreviewModal opens.
3. Owner edits if needed.
4. Owner clicks Send.
5. Message is sent.
6. Conversation timeline updates.


---

# FILE: RYANOS_TEST_PLAN.md

# RyanOS MVP Test Plan

## Purpose

Verify RyanOS works as one connected system.

Goal is not just screen rendering. Customer interactions must move correctly through Inbox, Action Queue, Quotes, Jobs, Calendar, and Payment Status.

## Critical Journey 1: Urgent Call

Scenario:
Peter Sanderson calls at 5:42am about a burst pipe.

Expected:
1. Call appears in Inbox.
2. Conversation stage is Needs owner action.
3. Emergency guardrail appears.
4. Dashboard Action Queue shows urgent red card at top.
5. AI summary says no diagnosis or repair advice was given.
6. Owner can Call now.
7. Owner can Book emergency job.
8. Booking creates Job and Calendar Event.
9. Action card updates to Booked or Completed.
10. Customer confirmation message opens preview before send.

Pass if:
- No silent send.
- Emergency remains visually obvious.
- Linked records update consistently.

## Critical Journey 2: Quote Reply Negotiation

Scenario:
Sarah replies to quote asking for cheaper price.

Expected:
1. SMS appears in Inbox.
2. Stage shows Quote replied.
3. Linked quote Q-1079 visible.
4. Dashboard Action Queue shows quote reply.
5. AI suggests reply in plain English.
6. Owner clicks Use AI reply.
7. MessagePreviewModal opens.
8. Owner can edit.
9. Send adds message to conversation.
10. Action completes or moves to follow-up.

## Critical Journey 3: Accepted Quote to Booked Job

Scenario:
Anne accepts roof treatment quote.

Expected:
1. Quote status = accepted.
2. Conversation stage = Needs booking.
3. Dashboard shows Accepted quote action.
4. Owner clicks Book job.
5. Booking time selector appears.
6. Calendar availability checked.
7. Job created.
8. Calendar event created.
9. Quote status becomes converted.
10. Confirmation message preview appears.
11. Dashboard action completes.

Pass if Quote, Job, Calendar, Inbox all agree.

## Critical Journey 4: Completed Job to Paid

Scenario:
Darren's water tank clean is complete.

Expected:
1. Job marked complete.
2. Stage becomes Job complete.
3. Payment status becomes Ready to invoice.
4. Dashboard shows Ready to invoice action.
5. Owner clicks Create invoice draft.
6. Owner can Mark invoice sent.
7. Payment status becomes Unpaid.
8. If due date passes, status becomes Overdue.
9. Owner sends reminder with preview.
10. Owner marks paid.
11. Action clears.

Pass if:
- Paid/Unpaid/Overdue labels are correct.
- No Payed spelling appears.
- No full accounting system is exposed.

## Critical Journey 5: New Business Setup

Expected:
1. Owner adds services.
2. Owner sets price ranges.
3. Owner sees customer-facing price sentence.
4. Owner sets service area/travel radius.
5. Owner sets working hours.
6. Owner selects booking mode.
7. Go-live checklist updates.
8. Test call is required before live.

## Critical Journey 6: Duplicate Customer

Expected:
1. Customer detail shows duplicate warning.
2. Warning explains why.
3. Actions: Merge records, Keep separate.
4. Dismiss works.

## Critical Journey 7: Mobile On The Road

Expected:
1. Mobile home shows Action Queue first.
2. Today’s Jobs visible.
3. Buttons are large: Call, Navigate, Done, Reply, Book.
4. Inbox is easy to access.
5. No desktop CRM clutter.

## Regression Checks

Navigation:
- Sidebar has no Calls page.
- Calls filter exists inside Inbox.
- Dashboard links open correct records.

Message Safety:
All these actions open preview:
- Use AI reply
- Send SMS
- Decline politely
- Payment reminder
- Booking confirmation
- Quote send

State Consistency:
- Quote accepted creates needs booking.
- Job booked creates calendar event.
- Job complete creates ready invoice action.
- Paid clears unpaid/overdue action.

Emergency:
- urgent
- safe guidance only
- owner review recommended

Payment Labels:
Allowed:
- Paid
- Unpaid
- Overdue
- Deposit due
- Deposit paid
- Ready to invoice
- Invoice sent

Disallowed:
- Payed

## End-to-End Demo Script

1. Open Dashboard.
2. Show Action Queue.
3. Open Peter urgent call.
4. Explain emergency guardrail.
5. Book emergency job.
6. Open Sarah quote reply.
7. Send AI reply after preview.
8. Open Anne accepted quote.
9. Convert to job and book time.
10. Open Darren ready to invoice.
11. Create invoice draft / mark sent.
12. Open mobile view and show Action Queue first.

Demo message:
RyanOS has answered the calls, sorted the admin, and reduced the owner’s morning to six clear decisions.
