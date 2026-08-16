# Commons Protocol

> Working Draft

## Overview

Commons Protocol is an experimental protocol for organizing voluntary exchange within and between independent geographic communities called **Commons**.

The protocol preserves the strengths of free markets while exploring an alternative to conventional money based on reciprocal contribution rather than accumulated wealth.

It is designed as a protocol rather than an application.

The software exists to validate the protocol, not define it. The first software implementation is Commons Market.

Commons Market uses a shared backend and API with participant clients for Android, iOS, and the web.

Android and iOS are the primary participant interfaces, while the web application remains fully supported.

All clients implement the same Commons Protocol behaviour.

---

# Repository Structure

## Purpose

```
purpose.md
```

Introduces the Commons Protocol, its goals, scope, and intended audience.

Read this first if you are new to the project.

---

## Philosophy

```
philosophy.md
```

Explains the ideas and principles behind the protocol.

It answers questions such as:

* Why does the protocol exist?
* What problems is it trying to solve?
* What assumptions does it make?
* What kind of society is it attempting to enable?

---

## User Stories

The `user-stories` directory defines the functional requirements for the first implementation, organized by epic.

```
user-stories/README.md
```

Provides the user story guide and definition of done.

The epic files are:

* `user-stories/participant-management.md`
* `user-stories/requests.md`
* `user-stories/offers.md`
* `user-stories/agreements.md`
* `user-stories/exchanges.md`
* `user-stories/ledger.md`
* `user-stories/notifications.md`

---

## Domain

The `domain` directory defines the concepts that make up the protocol.

### Participants

```
domain/participants.md
```

Defines:

* Participants
* Commons
* Commons Evolution
* Membership
* Reciprocity Agreements
* Commons Balance

---

### Market

```
domain/market.md
```

Defines:

* Requests
* Offers
* Negotiation
* Agreements
* Exchanges
* Completion
* Categories
* Value
* Local Markets

---

### Ledger

```
domain/ledger.md
```

Defines:

* Ledgers
* Ledger Entries
* Completed Exchanges
* Profiles
* Trust

---

### Governance

```
domain/governance.md
```

Defines:

* Governance
* Disputes
* Juries
* Abuse
* Notifications

---

## Protocol

The `protocol` directory contains specifications describing how independent Commons cooperate.

### Reciprocity

```
protocol/reciprocity.md
```

Defines the protocol for cooperation between autonomous Commons, including Cross Commons Exchanges and interoperability.

---

### Security

```
protocol/security.md
```

Defines cross cutting protocol security principles including trusted Participant identity, resource ownership, Membership boundaries, server side authorization, IDOR protection, and Ledger integrity.

---

## Appendix

Supporting documents that are informative rather than normative.

### MVP

```
appendix/mvp.md
```

Defines the intended scope of the first implementation.

---

### Open Questions

```
appendix/open-questions.md
```

Tracks unresolved design questions and future research topics.

---

## Status

The Commons Protocol is an active working draft.

Concepts, terminology, and protocol rules may change as the project evolves and practical experimentation provides new insights.

---

## Local Development Data

Running the application with `ASPNETCORE_ENVIRONMENT=Development`, including
through `docker compose up`, automatically applies the idempotent development
seed at `backend/Commons.Infrastructure/Persistence/Seeding/seed-dev.sql` after
the database schema is created.

The seed provides a small set of existing Commons for testing the participant
join flow. It is not applied in production.

Start the local development stack with:

```bash
docker compose up --build
```

The backend runs with `dotnet watch`, and the frontend runs through the Vite
development server using Node.js 24. Source directories are bind-mounted into
their containers, so backend changes automatically restart the API and
frontend changes are applied through hot module replacement. Rebuild the
containers only after changing dependencies, Dockerfiles, or Compose settings.
