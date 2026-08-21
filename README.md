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

## Mobile Development Foundation

The Android and iOS client is a separate Expo application under
`frontend/commons-mobile`. It is not launched by Docker Compose. Docker Compose
provides the backend on host port `8080`, and the mobile development build
connects to that backend using a device-reachable address.

Install the mobile dependencies with Node.js 24:

```bash
cd frontend/commons-mobile
npm ci
cp .env.example .env.local
```

Set `EXPO_PUBLIC_API_BASE_URL` in `.env.local` for the target device:

* Android emulator: `http://10.0.2.2:8080`
* Android physical device: `http://<development-machine-LAN-IP>:8080`
* iPhone physical device: `http://<development-machine-LAN-IP>:8080`

The physical device and development machine must be on the same local network,
and the host firewall must allow inbound TCP traffic on port `8080`.

Start the backend in the first terminal:

```bash
docker compose up --build
```

Create, install, and start the Android development build from a second terminal:

```bash
cd frontend/commons-mobile
npm run android
```

After the development build is installed, ordinary development sessions can
start Metro without rebuilding the native application:

```bash
cd frontend/commons-mobile
npm start
```

The first Android command requires Android Studio, an Android SDK, an emulator
or USB-debuggable device, and the Java version required by the installed Android
toolchain. Ordinary TypeScript changes use Metro and do not require rebuilding
the native development client. Rebuild it after changing native dependencies or
Expo native configuration.

Linux cannot run Xcode or the iOS Simulator. An iOS development build must
eventually be produced on a Mac or through EAS Build, then installed on a
physical iPhone that can reach Metro and the local backend. This repository is
not currently bound to an Expo account and contains no EAS project ID or signing
credentials.

Run the credential-free mobile validation locally with:

```bash
cd frontend/commons-mobile
APP_VARIANT=development EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080 npm run typecheck
APP_VARIANT=development EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080 npm test -- --runInBand
APP_VARIANT=development EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080 npm run doctor
APP_VARIANT=development EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080 npm run export:android
APP_VARIANT=development EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080 npm run export:ios
```

### Local Android acceptance test

The first mobile end to end acceptance test uses Maestro to exercise the real
Android development client, backend, Domain behaviour, and PostgreSQL database.
It creates unique Participants, a Request, competing Offers, and an Agreement
through the UI, so repeated runs do not require a database reset. The existing
development seed supplies the `Gold Coast Commons` selected by the flow.

Install Maestro locally using its official installation instructions. Maestro
requires Java 17 or later and is intentionally not an npm dependency in this
repository.

Start the backend and PostgreSQL in the first terminal:

```bash
docker compose up --build
```

Install and start the Android development client and Metro in a second terminal:

```bash
cd frontend/commons-mobile
APP_VARIANT=development EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080 npm run android
```

With an Android emulator running and Metro available on its default port 8081,
run the acceptance test in a third terminal:

```bash
cd frontend/commons-mobile
./.maestro/run-through-us-013.sh
```

The harness removes stale records from abandoned Maestro runs before starting,
generates the scenario's unique run identifier, and opens the development client
at Metro through the emulator host alias `10.0.2.2`. Its failure-safe teardown
removes that run's records from the local Compose `commons` database and clears
the Android development application's local state whether Maestro succeeds or
fails. The cleanup is restricted to the established Maestro test account naming
convention; it does not reset the database, remove the development seed, or
delete Maestro diagnostic artifacts.
