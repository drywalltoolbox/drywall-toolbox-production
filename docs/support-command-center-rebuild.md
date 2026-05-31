# DTB Support Command Center Rebuild — Parallel Implementation Update Plan

## 1. Objective

Rebuild the `dtb-support` MU-plugin from a functional WordPress admin ticket interface into a production-grade Support Command Center for Drywall Toolbox. The target operating model is that one trained operator can efficiently handle the entire support/contact workload with strong visibility, deterministic automation, fast triage, safe customer communication, and measurable service-level performance.

This document is an implementation instruction blueprint. It intentionally does not provide direct source code. It defines the architecture, workflow intelligence, module responsibilities, execution tracks, migration order, acceptance criteria, and operational safeguards required to rebuild the system cleanly.

The rebuild must preserve the current headless architecture: React storefront at the public domain root, WordPress/WooCommerce as backend, and DTB operational workflows inside MU-plugin modules. The support system must remain an MU-plugin subsystem under `drywalltoolbox/wp/wp-content/mu-plugins/dtb-support` and must interoperate with WooCommerce orders, customer data, repair-service workflows, notification infrastructure, and future automation/analytics modules.

## 2. Product outcome

The finished support experience should feel like a focused internal operations console, not a static WordPress table. The admin should immediately see what needs attention, why it matters, what context is relevant, and what action should happen next.

The default workflow must be:

1. Admin opens Support Command Center.
2. System surfaces the highest-priority queue first.
3. Ticket list is sorted by urgency, SLA risk, latest customer activity, and operational importance.
4. Admin opens a ticket in a split-pane or focused detail view.
5. Sidebar shows customer, order, product, repair, SLA, and automation context.
6. Composer provides macros, internal notes, public reply mode, send-and-transition actions, and recommended next actions.
7. System logs every action into an immutable event stream.
8. Notifications are queued reliably through an outbox rather than blocking the admin request.
9. Automation rules update priority, status, tags, assignment, follow-ups, and SLA state deterministically.
10. Observability panels expose backlog, SLA risk, email health, automation health, and operational bottlenecks.

The system should reduce cognitive load. The operator should not have to manually hunt for the next ticket, remember follow-ups, infer customer context from separate screens, or manually update routine status transitions after every reply.

## 3. Current-state assessment

The current `dtb-support` module already has useful primitives:

- Domain definitions for status, type, priority, and event concepts.
- Custom ticket and event database tables.
- Public contact submission endpoint.
- Admin REST endpoints for listing, viewing, updating, and replying to tickets.
- Basic admin dashboard with KPI cards, status tabs, filters, table, inline preview rows, and detail page.
- Ticket assignment primitives.
- Email notification templates and dispatcher.
- Basic rate limiting and honeypot validation.

The current system is not yet production-grade because core workflows contain mismatches and missing orchestration:

- Priority validation is referenced but not implemented.
- Event naming is inconsistent across domain, reply flow, status transition flow, and analytics expectations.
- First-response SLA measurement cannot be trusted until staff/customer event semantics are normalized.
- Assignment field names are inconsistent between schema and detail UI.
- Notification links point to a non-registered detail route instead of the dashboard detail route.
- Detail-page JavaScript signatures are brittle and can break status transitions.
- Reply composer internal-note handling is mismatched between markup and JavaScript.
- Public reply tokens are deterministic and do not expire.
- Public submit metadata is partially discarded.
- Ticket-number generation can race under simultaneous submissions.
- Email sending is synchronous and lacks an outbox, retries, delivery status, and failure observability.
- Admin CSS/JS is embedded inline, limiting maintainability, caching, testing, and future UI growth.
- The UX is table-first instead of queue-first, SLA-first, and action-first.

The rebuild must stabilize these defects before layering advanced workflow automation.

## 4. Target operating model

The desired support operating model is a single-operator service desk optimized around throughput, context, and reliability.

### 4.1 Primary queues

The command center must expose smart queues rather than only raw status tabs. Each queue should represent an operational decision boundary.

Recommended queues:

- Needs Reply: tickets where the customer is waiting on DTB.
- SLA at Risk: tickets approaching first-response or resolution deadline.
- SLA Breached: tickets past SLA target.
- Unassigned: tickets without an owner.
- Urgent: urgent-priority active tickets.
- In Progress: actively worked tickets.
- Waiting on Customer: tickets where DTB has replied and customer response is needed.
- Snoozed / Follow-up: tickets intentionally deferred until a specific time.
- Resolved Pending Close: resolved tickets still inside auto-close window.
- Email Failures: tickets with failed outbound notifications.
- Automation Exceptions: tickets that automation could not process safely.
- All Active: all non-terminal tickets.

The default landing queue should be Needs Reply, ordered by a computed priority score.

### 4.2 Ticket priority score

The system must compute a support priority score to rank work. This score should not replace the human-readable priority field; it should drive queue ordering and recommended next action.

Recommended scoring inputs:

- Current status, weighted highest when waiting on staff.
- Explicit priority: urgent, high, normal, low.
- First-response SLA proximity.
- Resolution SLA proximity.
- Age since last customer activity.
- Whether ticket is unassigned.
- Whether ticket has order, repair, return, refund, or shipping context.
- Customer has multiple active tickets.
- Customer has recent failed order, delayed shipment, or high-value order.
- Message contains escalation terms such as refund, damaged, missing, urgent, broken, cancellation, wrong item, warranty, charge, or no response.
- Ticket has failed notifications or automation errors.

The score should be deterministic and recalculable. Store the latest score on the ticket row for fast sorting and preserve scoring rationale in metadata or event payload for auditability.

### 4.3 Lifecycle semantics

Statuses must carry clear operational meaning:

| Status | Meaning | Main actor expected |
|---|---|---|
| Open | Newly created or reopened; needs triage | Staff |
| Pending Staff | Customer is waiting for a DTB response | Staff |
| In Progress | Staff is actively working the issue | Staff |
| Pending Customer | DTB replied and is waiting for the customer | Customer |
| Resolved | Issue appears solved; eligible for auto-close after delay | System or staff |
| Closed | Final terminal state | None |
| Spam | Suppressed terminal state | None |

Automation should transition common flows:

- New public submission starts as Open or Pending Staff depending on whether auto-triage is enabled.
- First agent open or assignment can move Open to In Progress.
- Staff public reply defaults to Pending Customer unless the operator chooses Send and Resolve.
- Customer public reply moves Resolved, Closed, or Pending Customer back to Pending Staff.
- Resolved tickets auto-close after a configurable silence window.
- Spam scoring can recommend Spam but should not auto-spam legitimate customer/order tickets without a conservative confidence threshold.

## 5. Target module architecture

Keep the current high-level module separation, but formalize responsibilities and add missing subsystems.

### 5.1 Domain layer

The Domain layer should be the canonical source for support vocabulary and invariants.

Responsibilities:

- Define status registry and allowed transitions.
- Define priority registry, validation, SLA targets, and priority weight.
- Define type registry and routing metadata.
- Define event type registry and public/private visibility semantics.
- Define macro category taxonomy.
- Define automation trigger/action vocabulary.
- Provide pure helpers with no direct database writes.

Required improvements:

- Add priority validation.
- Replace ad hoc event strings with canonical event names.
- Normalize reply event semantics so customer and staff events are unambiguous.
- Add SLA target helpers for first response, resolution, and follow-up.
- Add terminal-state helpers and reopening rules.

### 5.2 Infrastructure layer

The Infrastructure layer owns persistence, low-level queries, schema installation, email outbox, and low-level adapters.

Responsibilities:

- Install and migrate custom support tables.
- Own ticket repository operations.
- Own event repository operations.
- Own email outbox repository.
- Own automation rule repository.
- Own saved-view repository.
- Own macro repository.
- Own schema versioning and idempotent migrations.
- Provide fast read queries for queue views and KPI queries.

Required improvements:

- Expand ticket schema for SLA timestamps, activity timestamps, snooze/follow-up fields, metadata JSON, priority score, customer/order/product references, and notification health.
- Add indexes for queue lookup, SLA lookup, assignee lookup, customer lookup, and order lookup.
- Add email outbox table for asynchronous notifications.
- Add automation rules table.
- Add macro/canned-response table or option-backed registry for initial implementation.
- Add saved views if queue definitions need admin customization.
- Make ticket-number generation collision-safe.
- Store discarded contact metadata in metadata JSON or initial event payload.

### 5.3 Services layer

The Services layer owns business workflows that span repositories.

Responsibilities:

- Ticket query projection service.
- Workflow transition service.
- Auto-assignment service.
- SLA service.
- Priority scoring service.
- Automation rule evaluation service.
- Macro rendering service.
- Notification orchestration service.
- Duplicate detection service.
- Customer/order context aggregation service.

Required improvements:

- Query service should produce a complete admin view model with status label, priority label, queue reason, SLA countdown, assigned user, latest activity, customer summary, order summary, tags, and quick-action eligibility.
- Workflow service should be the only allowed status mutation path.
- Reply service should update last activity timestamps, first reply timestamp, SLA state, queue state, and status according to reply type.
- Assignment service should support assign-to-me, unassign, round-robin, type-based routing, priority-based routing, and workload-aware routing.
- SLA service should compute first-response due, resolution due, warning state, breach state, and time remaining.
- Automation service should evaluate deterministic rules and append automation events.
- Notification service should enqueue messages into the outbox and never block the user-facing request on SMTP unless explicitly configured for synchronous delivery.

### 5.4 Application layer

The Application layer orchestrates use cases.

Core use cases:

- Submit public contact request.
- Add customer reply.
- Add staff public reply.
- Add internal note.
- Transition ticket status.
- Assign or unassign ticket.
- Snooze ticket.
- Unsnooze ticket.
- Apply macro to draft response.
- Resolve ticket.
- Close ticket.
- Mark spam.
- Merge duplicate tickets.
- Bulk update tickets.
- Recalculate priority score.
- Process automation trigger.
- Process email outbox item.

Each use case should validate permissions, call services, persist events, and return a stable response shape. Mutating use cases must be idempotent where reasonable and must append immutable audit events.

### 5.5 REST layer

The REST layer must be a thin transport layer. It should validate request shape, enforce permissions, call application services, and return normalized responses.

Required endpoint groups:

- Public intake endpoints.
- Public customer reply endpoint with expiring signed token.
- Admin ticket read endpoints.
- Admin ticket mutation endpoints.
- Admin reply/note endpoints.
- Admin bulk-action endpoints.
- Admin queue endpoints.
- Admin KPI and report endpoints.
- Admin macro endpoints.
- Admin automation rule endpoints.
- Admin outbox/notification health endpoints.
- Admin observability endpoints.

Mutating admin endpoints should require support capabilities and WordPress REST nonce authentication. Public endpoints must use rate limiting, anti-spam checks, strict validation, and safe response messages.

### 5.6 Admin layer

The Admin layer should render the Support Command Center shell, enqueue versioned assets, and localize REST configuration and nonces.

Responsibilities:

- Register Support menu and submenus.
- Enqueue support CSS and JavaScript from asset files, not giant inline strings.
- Render command center shell.
- Render settings shell.
- Render initial no-JS fallback where practical.
- Localize REST root, nonce, current user capabilities, default queue, and settings.

Admin pages should not contain business logic beyond initial shell rendering and permission checks. All operational actions should go through REST/application services.

## 6. Target admin UX architecture

### 6.1 Command Center layout

The recommended layout is a three-zone operations console:

| Zone | Purpose |
|---|---|
| Left queue rail | Smart queues, counts, SLA warnings, saved views |
| Center work area | Ticket list, conversation, reply composer, timeline, bulk operations |
| Right context panel | Customer, order, repair, product, SLA, automation, email status |

For screen sizes where a three-pane layout is not viable, collapse into:

- Queue selector at top.
- Ticket list as primary view.
- Ticket detail as full-page or slide-over panel.
- Context panel as accordion sections.

### 6.2 Dashboard header

The header should show:

- Current queue name.
- Active ticket count.
- SLA breached count.
- SLA at risk count.
- Email failure count.
- Automation failure count.
- Last refresh timestamp.
- Manual refresh action.
- Settings shortcut.

### 6.3 Ticket list

The ticket list should prioritize scanning speed.

Each row/card should include:

- Ticket number.
- Subject.
- Customer name and email.
- Type.
- Priority.
- Status.
- SLA countdown or breach badge.
- Assigned agent.
- Last customer activity.
- Tags.
- Queue reason.
- Quick actions: assign to me, reply, snooze, resolve, mark spam.

The list must support:

- Search.
- Type filter.
- Priority filter.
- Status filter.
- Assigned filter.
- SLA filter.
- Date range filter.
- Tag filter.
- Order-linked filter.
- Saved views.
- Bulk selection.

### 6.4 Detail panel

The detail view should be action-centric.

Required sections:

- Ticket header: subject, status, priority, SLA, assignment.
- Conversation thread: customer messages, staff replies, internal notes, system events.
- Reply composer: public reply mode, internal note mode, macros, send actions.
- Activity timeline: all state changes and automation events.
- Right context: customer, order, product, repair, automation, email health.

### 6.5 Composer actions

The composer should provide one-click outcome actions:

- Send reply.
- Send and wait for customer.
- Send and resolve.
- Send and snooze.
- Add internal note.
- Save draft.
- Insert macro.
- Insert order summary.
- Insert tracking details.
- Insert repair status.

Internal notes must never be sent to the customer. The UI must make internal/public mode visually distinct.

### 6.6 Macros and templates

Implement deterministic macros first. Initial macro categories:

- Shipping delay.
- Tracking update.
- Missing item.
- Damaged product.
- Return request.
- Refund request.
- Order cancellation.
- Repair service status.
- Product compatibility.
- Warranty question.
- General follow-up.

Macros should support variables sourced from ticket, customer, order, product, and repair context.

### 6.7 Keyboard shortcuts

Add optional keyboard shortcuts for high-throughput operation:

| Shortcut | Action |
|---|---|
| Slash | Focus search |
| J / K | Move next/previous ticket |
| R | Focus reply composer |
| N | Add internal note |
| A | Assign to me |
| P | Change priority |
| S | Change status |
| M | Open macro picker |
| E | Resolve ticket |
| Z | Snooze ticket |
| G then N | Go to Needs Reply |
| G then U | Go to Unassigned |
| G then S | Go to SLA at Risk |

Shortcuts should be disabled while typing in inputs/textareas unless explicitly overridden.

## 7. Automation and intelligence layer

### 7.1 Rule engine

Build a deterministic rule engine before any AI-assisted tooling. The rule engine should evaluate configured conditions and apply configured actions when trigger events occur.

Trigger categories:

- Ticket created.
- Customer replied.
- Staff replied.
- Status changed.
- Priority changed.
- Assignment changed.
- SLA warning reached.
- SLA breached.
- Ticket resolved timeout reached.
- Email delivery failed.

Condition categories:

- Ticket type equals value.
- Priority equals value.
- Status equals value.
- Subject/message contains keywords.
- Customer email domain matches.
- Order ID exists.
- Order status matches.
- Customer has multiple open tickets.
- Ticket is unassigned.
- SLA state equals warning or breach.
- Ticket age exceeds threshold.
- Tag exists or does not exist.

Action categories:

- Set priority.
- Set status.
- Assign to user.
- Assign to team or round-robin group.
- Add tag.
- Remove tag.
- Add internal note.
- Send notification.
- Snooze until relative time.
- Mark as needs manual review.
- Recalculate priority score.

Rules must be ordered, enabled/disabled, auditable, and safe. Every automation action must append an event explaining what happened and why.

### 7.2 Auto-triage

Initial deterministic auto-triage should:

- Map billing/order/refund/return/shipping keywords to support type and priority.
- Promote urgent language to high or urgent priority when appropriate.
- Link tickets to orders when order ID is present.
- Detect duplicate recent submissions from same email and similar subject/message.
- Tag common issue categories.
- Assign based on type map or round-robin.
- Set first response and resolution due timestamps.
- Compute priority score.

Auto-triage should recommend rather than destructively act when confidence is low.

### 7.3 SLA automation

The SLA engine should run in background and update tickets as time passes.

Required behaviors:

- Compute first-response due time at ticket creation.
- Compute resolution due time based on priority and type.
- Mark tickets at risk before breach threshold.
- Mark breach when due time passes.
- Send or surface internal notifications for breach.
- Track first staff public reply.
- Track resolution time.
- Preserve SLA state history through events.

### 7.4 Follow-up and snooze automation

Snooze is critical for a one-person operator.

Required behavior:

- Snooze removes the ticket from active queues until a defined time.
- Snoozed tickets appear in a dedicated queue.
- When snooze expires, ticket returns to Needs Reply or Follow-up due.
- Snooze action requires an optional reason.
- Snooze and unsnooze events must be logged.

### 7.5 AI-assisted drafting boundary

AI-assisted drafting may be added later, but should not be part of the critical rebuild path. When introduced:

- AI must draft only; never auto-send.
- Admin must explicitly review and send.
- AI prompts must include strict customer-data minimization.
- Drafts must identify source context used.
- Generated text should be treated as untrusted until confirmed by operator.
- Every AI-draft generation should be logged as an internal event or observability entry.

## 8. Observability and reporting

### 8.1 Operational KPIs

Support Command Center should expose:

- Total active tickets.
- New today.
- Needs reply.
- Unassigned.
- SLA at risk.
- SLA breached.
- Urgent active.
- Resolved today.
- Reopened today.
- Average first response.
- Median first response.
- Average resolution time.
- Oldest active ticket.
- Email failures.
- Automation failures.

### 8.2 Reports

Add reporting views:

- Ticket volume by day.
- Ticket volume by type.
- Ticket volume by priority.
- SLA compliance percentage.
- Average first response trend.
- Average resolution trend.
- Backlog aging buckets.
- Top tags/topics.
- Customer repeat-contact count.
- Email outbox health.
- Automation action count.

### 8.3 Health panel

The support system must have a health/observability panel with:

- Database schema version.
- Last automation run.
- Last SLA scan.
- Outbox pending count.
- Outbox failed count.
- Oldest unsent email.
- REST route health check.
- WP-Cron or Action Scheduler health.
- Current support settings.
- Failed automation logs.

## 9. Security and reliability requirements

### 9.1 Public intake hardening

Public support submission should enforce:

- Required fields.
- Maximum field lengths.
- Email validation.
- Honeypot.
- Per-IP rate limiting.
- Per-email rate limiting.
- Duplicate submission detection.
- Optional Cloudflare Turnstile or equivalent challenge.
- Proxy-aware IP extraction when trusted proxies are configured.
- Safe generic error responses for spam blocks.
- Full internal event/log for rejected submissions.

### 9.2 Public customer reply security

Customer reply links must use expiring signed tokens.

Token requirements:

- Include ticket identifier.
- Include email hash or customer identity binding.
- Include expiration timestamp.
- Include nonce or unique token ID when revocation is needed.
- Be validated with constant-time comparison.
- Fail with generic error messages.
- Be regenerated when customer email changes.

### 9.3 Admin permissions

Use dedicated capabilities rather than only broad administrator permissions.

Recommended capabilities:

- Read support tickets.
- Reply to support tickets.
- Add internal notes.
- Assign tickets.
- Change status.
- Change priority.
- Manage support macros.
- Manage automation rules.
- View support reports.
- Manage support settings.
- Export support data.

Administrators should receive all capabilities automatically. Future support-agent and support-manager roles can receive narrowed capability sets.

### 9.4 Auditability

Every meaningful mutation must append an event:

- Ticket created.
- Reply added.
- Internal note added.
- Status changed.
- Priority changed.
- Assignment changed.
- Snoozed/unsnoozed.
- Macro inserted or sent.
- Email queued/sent/failed.
- Automation applied/skipped/failed.
- Ticket merged.
- Ticket marked spam.
- Ticket resolved/closed/reopened.

Events should preserve actor type, actor ID, source, visibility, payload, and timestamp.

### 9.5 Notification reliability

Replace synchronous email dispatch with an outbox workflow.

Required behavior:

- User action creates an outbox item.
- Background worker sends pending items.
- Failed sends are retried with backoff.
- Permanent failures are surfaced in dashboard health and ticket context.
- Ticket stores latest notification status.
- Email events are appended for queued, sent, and failed states.
- Admin can manually retry failed notification items.

## 10. Parallel implementation tracks

This rebuild should be executed in parallel by independent tracks with explicit interfaces. Tracks must coordinate through stable domain definitions, database migrations, REST contracts, and acceptance criteria.

### Track A — Stabilization and correctness

Owner focus: fix existing breakpoints before expanding scope.

Scope:

- Normalize event names.
- Add missing priority validation.
- Fix `order_by` and `orderby` mismatch.
- Fix assignment field mismatch.
- Fix notification admin URLs.
- Fix reply form internal/public note handling.
- Fix detail-page action JavaScript signatures.
- Remove duplicate submit handlers.
- Remove BOM characters from PHP files.
- Persist intake metadata.
- Add collision-safe ticket-number behavior.

Deliverable:

- Current dashboard and detail page work reliably.
- Existing support flows do not fatal-error.
- Existing REST endpoints return stable response shapes.
- Current emails link to the correct admin ticket view.

Acceptance criteria:

- New public contact creates a ticket and event.
- Admin can change status.
- Admin can change priority.
- Admin can assign and unassign.
- Admin can send customer reply.
- Admin can add internal note without sending email.
- Customer reply reopens or moves ticket to staff queue.
- Notification links open the correct ticket.
- Events use canonical names.

### Track B — Schema v2 and repositories

Owner focus: data model, migrations, indexes, repositories.

Scope:

- Implement schema version upgrade.
- Add support ticket v2 operational fields.
- Add metadata JSON.
- Add activity timestamps.
- Add SLA due timestamps.
- Add snooze/follow-up fields.
- Add priority score.
- Add notification status fields.
- Add email outbox table.
- Add automation rules table.
- Add macro storage.
- Add queue-optimized indexes.

Deliverable:

- Schema upgrades run idempotently.
- Existing tickets remain readable.
- New fields are populated by services.
- Repository methods expose queue, outbox, automation, macro, and reporting queries.

Acceptance criteria:

- Schema can install fresh and migrate existing database.
- No destructive migration occurs without explicit backup/export strategy.
- Queue queries are index-friendly.
- Ticket projection includes new v2 fields with safe defaults.

### Track C — Workflow and automation services

Owner focus: deterministic business logic and automation.

Scope:

- Build SLA service.
- Build priority scoring service.
- Build automation rule evaluator.
- Build follow-up/snooze service.
- Expand assignment service.
- Expand reply workflow.
- Expand status transition workflow.
- Add duplicate detection.
- Add macro rendering service.

Deliverable:

- Tickets automatically receive SLA due times, priority score, tags, assignment, and queue state.
- Replies update state and timestamps correctly.
- Automation rules can be evaluated and audited.

Acceptance criteria:

- Staff reply updates last staff reply and first reply where applicable.
- Customer reply updates last customer reply and queue status.
- Priority score changes when relevant ticket state changes.
- SLA breach state is computed and visible.
- Automation actions append events.
- Snoozed tickets disappear from active queues until due.

### Track D — REST API v2

Owner focus: clean, stable API contracts for admin UI and future integrations.

Scope:

- Queue endpoints.
- Ticket list endpoint with queue filters and priority sorting.
- Ticket detail endpoint with context model.
- Reply/note endpoints.
- Status/priority/assignment endpoints.
- Snooze endpoints.
- Bulk action endpoints.
- Macro endpoints.
- Automation rule endpoints.
- KPI/report endpoints.
- Outbox/health endpoints.

Deliverable:

- Admin UI can operate entirely through REST.
- APIs are permissioned, nonce-protected, and predictable.

Acceptance criteria:

- All mutating endpoints enforce support capabilities.
- All mutating endpoints produce events.
- Public endpoints are rate-limited.
- Response envelopes are consistent.
- Error responses include safe machine-readable codes.

### Track E — Admin Command Center UI

Owner focus: operator UX.

Scope:

- Move CSS/JS to versioned asset files.
- Build command center shell.
- Build queue rail.
- Build ticket list with quick actions.
- Build split-pane ticket detail or focused detail view.
- Build composer with macros and send actions.
- Build context sidebar.
- Build bulk actions.
- Build keyboard shortcuts.
- Build settings UI for queues, macros, automation, SLA, and notifications.

Deliverable:

- One operator can manage queue, reply, resolve, assign, snooze, and monitor health from one UI.

Acceptance criteria:

- Default queue loads quickly.
- Ticket list can be filtered and searched.
- Operator can open, reply, note, resolve, snooze, and move to next ticket without page reload where feasible.
- Internal notes are visually distinct and never emailed.
- Macros can be inserted into replies.
- Keyboard shortcuts do not interfere with text input.

### Track F — Notification outbox and email reliability

Owner focus: asynchronous messaging.

Scope:

- Create outbox model.
- Convert ticket-opened, staff-reply, customer-reply, resolved, reopened notifications to outbox.
- Add background processor.
- Add retry/backoff policy.
- Add email status on ticket.
- Add outbox health UI.
- Add manual retry.

Deliverable:

- Emails are reliable, observable, and retryable.

Acceptance criteria:

- User-facing request does not fail just because SMTP is temporarily unavailable.
- Failed emails are visible in ticket and health panel.
- Retried email attempts are logged.
- Sent emails append ticket events.

### Track G — Reporting and observability

Owner focus: operational visibility.

Scope:

- KPI model.
- SLA reports.
- Backlog aging reports.
- Ticket volume charts.
- Type/priority reports.
- Email health reports.
- Automation health reports.
- Export functionality.

Deliverable:

- Admin can understand workload, quality, and system health without reading logs.

Acceptance criteria:

- KPIs match ticket data.
- SLA breach counts are explainable.
- Reports perform acceptably on expected ticket volume.
- Health panel clearly surfaces operational issues.

## 11. Recommended execution order

Even though implementation can run in parallel, merge order should be controlled to avoid compounding defects.

1. Track A stabilization.
2. Track B schema v2 baseline.
3. Track C service layer using schema v2.
4. Track D REST contracts for new services.
5. Track F notification outbox foundation.
6. Track E admin command center against stable APIs.
7. Track G observability and reports.
8. Final hardening, QA, and deployment.

Parallelization rule:

- UI work may begin once REST response contracts are drafted, but it should use mock fixtures until Track D is stable.
- Automation work may begin once event names and status semantics are locked.
- Reporting work may begin once schema v2 fields and event semantics are locked.
- Notification outbox work may begin independently after schema v2 table conventions are established.

## 12. Backward compatibility and migration

The migration must preserve existing support tickets and events.

Required migration behavior:

- Existing tickets remain visible.
- Missing new fields receive safe defaults.
- Existing event names are mapped to canonical equivalents during projection or migration.
- Existing statuses and priorities remain valid.
- Existing notification settings are preserved.
- Existing admin URL continues to route to dashboard detail view.
- Public submit endpoint remains compatible with current frontend contact form.

Migration should be idempotent and safe to rerun. It should not delete ticket/event data. Destructive cleanup, if any, must be a separate explicit admin maintenance action.

## 13. Settings architecture

Settings should be grouped into operational sections:

### General

- Support display name.
- Default admin notification email.
- Default queue.
- Polling or live-refresh interval.

### Email

- From name.
- From address.
- Reply-to behavior.
- Email templates.
- Outbox retry settings.
- Failure notification recipient.

### SLA

- First-response SLA per priority.
- Resolution SLA per priority.
- Warning threshold percentage.
- Auto-close resolved window.

### Assignment

- Eligible agents.
- Assign-to-me behavior.
- Round-robin enabled.
- Type-based routing.
- Workload-aware assignment.

### Macros

- Macro library.
- Variables available.
- Categories.
- Default macro by type/status.

### Automation

- Rule list.
- Rule enabled state.
- Rule priority/order.
- Trigger, conditions, and actions.
- Test rule against sample ticket.

### Security

- Rate limits.
- Honeypot enabled.
- CAPTCHA/Turnstile enabled.
- Public reply token lifetime.
- Attachment constraints when attachments are introduced.

### Observability

- Health check interval.
- Outbox alert thresholds.
- SLA alert thresholds.
- Report retention.

## 14. Testing strategy

Testing should cover workflows rather than isolated functions only.

### Workflow tests

- Public contact submission creates ticket, events, assignment, SLA, priority score, and outbox items.
- Staff public reply updates state, timestamps, events, and outbox.
- Staff internal note does not send customer email.
- Customer reply reopens or moves ticket to Pending Staff.
- Status transition validates allowed transitions.
- Priority change recalculates score and appends event.
- Assignment appends event and updates projections.
- Snooze removes ticket from active queue and returns it when due.
- Resolved ticket auto-closes after configured window.

### Security tests

- Public submit rate limit blocks excessive submissions.
- Honeypot blocks bot-like submission.
- Public reply token expires.
- Admin REST mutations fail without nonce/capability.
- Internal notes are not visible to public/customer endpoints.

### Data tests

- Fresh schema install succeeds.
- Schema migration succeeds on older version.
- Existing tickets project safely with missing v2 fields.
- Event projection handles legacy event names.
- Queue queries sort correctly.

### UI tests

- Queue switching works.
- Search and filters work.
- Ticket detail loads context.
- Reply composer sends expected action.
- Internal-note mode is visibly distinct.
- Bulk actions require confirmation where appropriate.
- Keyboard shortcuts are ignored while typing.

### Observability tests

- Failed email appears in health panel.
- Failed automation appears in health panel.
- KPI counts match backing data.
- SLA breach count matches due timestamps.

## 15. Deployment and rollout plan

### Stage 1 — Stabilization patch

Deploy minimal correctness fixes to prevent current admin breakage. This should be safe and low-risk.

### Stage 2 — Schema v2 deployment

Deploy schema migrations and repository updates while keeping current UI compatible. Validate in wp-admin and database before enabling advanced features.

### Stage 3 — Service and REST v2 deployment

Deploy workflow services and API endpoints. Keep old endpoints available until UI migration is complete.

### Stage 4 — Command Center UI rollout

Deploy new UI behind a feature flag or admin setting. Allow fallback to legacy dashboard until verified.

### Stage 5 — Automation enablement

Enable automation rules in observe-only mode first. Observe recommended actions without applying them. Then enable low-risk actions such as tagging and assignment. Enable status-changing rules only after validation.

### Stage 6 — Outbox enforcement

Switch support emails fully to outbox after processor health is verified.

### Stage 7 — Cleanup

Remove deprecated inline UI logic, legacy event aliases where safe, and obsolete admin route assumptions.

## 16. Non-negotiable quality bars

The rebuild is not complete unless the following are true:

- No fatal errors in normal support workflows.
- All event names are canonical.
- All ticket mutations are auditable.
- Internal notes cannot be emailed accidentally.
- Public reply tokens expire.
- Email failures are visible and retryable.
- SLA state is explainable from stored timestamps.
- The operator can process tickets without opening multiple unrelated WP screens for basic context.
- The default queue always answers what to work on next.
- Automation is deterministic, observable, and reversible where appropriate.
- Admin JS/CSS is versioned and maintainable.
- Existing tickets survive migration.
- Public support form remains compatible with the storefront.

## 17. Definition of done

The support/contact management system is production-ready when:

1. A new customer inquiry can enter through the public endpoint, be validated, triaged, scored, assigned, acknowledged, and surfaced in the correct queue.
2. A single admin can reply, add notes, use macros, snooze, resolve, assign, change priority, change status, and move to the next ticket efficiently from one interface.
3. Every workflow appends an auditable event.
4. Notifications are queued, sent, retried, and monitored.
5. SLA performance is measured accurately.
6. Automation can safely reduce repetitive work without hiding what it did.
7. The dashboard exposes operational health, workload, and bottlenecks.
8. The module remains secure, testable, and maintainable as an MU-plugin subsystem.

## 18. Agent implementation instruction

When implementing this rebuild, proceed with production discipline. Do not add superficial UI features before stabilizing the workflow model. Do not create automation that mutates ticket state without event logging. Do not allow browser/admin UI behavior to become the source of truth. The source of truth must remain the service layer and repository/event model.

Work in parallel by track, but keep domain semantics, schema contracts, and REST response shapes synchronized. Prefer small, reviewable commits per subsystem. Preserve backward compatibility until the new command center has been verified against live-like ticket data. Treat the system as an operational control plane for customer support, not merely as a form submission inbox.
