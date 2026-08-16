# Technical Decisions

This document records the technical standards for the Commons Market implementation. It exists to ensure both humans and AI assistants make consistent technical decisions throughout the project.

## Guiding Principles

* Prefer simplicity over cleverness.
* The protocol is the product. The implementation exists to support it.
* The protocol, Domain, and backend API must remain independent of any particular client application.
* Android and iOS are the primary participant interfaces for Commons Market.
* The web application remains a fully supported participant interface.
* Participant facing behaviour should remain consistent across supported clients, while interaction and presentation may follow the conventions of each platform.
* Business rules must not be implemented differently for web, Android, and iOS.
* Build the backend as a modular monolith. Do not introduce distributed systems unless there is a demonstrated need.
* Favour readability and maintainability over premature optimisation.
* Minimise external dependencies.
* Prefer well established technologies over fashionable ones.
* Infrastructure should be reproducible.
* Every technical decision should be reversible where practical.

## Backend

* .NET 10
* ASP.NET Core
* MVC Controllers
* Entity Framework Core
* PostgreSQL
* ASP.NET Identity

## Frontend

## Client Applications

Commons Market has separate web and mobile client applications.

All clients consume the same backend API and operate on the same Domain behaviour.

A client must not contain authoritative business rules, ownership rules, Membership rules, Ledger rules, or security decisions.

### Web Client

The existing web client uses:

* React
* TypeScript
* Vite
* Tailwind CSS
* TanStack Query

The web client remains supported and should provide the complete participant facing Commons Market experience.

### Mobile Client

The mobile client uses:

* React Native
* Expo
* TypeScript
* TanStack Query

A single React Native and Expo codebase should target both Android and iOS.

Separate Android implementations in Kotlin or Java and separate iOS implementations in Swift or Objective C should not be introduced unless a platform capability later requires native code that cannot reasonably be provided through React Native or Expo.

The mobile client is a real native mobile application rather than the existing web application embedded inside a native shell.

The mobile client should use Expo development builds during development.

Web and mobile should share non user interface code where doing so provides a clear benefit, such as API contracts, request and response types, validation helpers, or API access code.

User interface components should not be forced into a shared abstraction merely to maximise code reuse. Web and native mobile interfaces use different interaction models and may be implemented separately where that produces a clearer result.

Android and iOS should provide the same participant capabilities, although platform specific interaction and presentation may differ.

## Authentication

The backend authentication system will use ASP.NET Identity.

Authentication must remain isolated behind clear abstractions so that another provider, such as Microsoft Entra External ID, can be introduced later without affecting the Domain.

The authenticated application account and the protocol Participant remain separate concepts.

Web and mobile clients may require different mechanisms for maintaining authenticated sessions, but they must resolve to the same trusted server side Participant identity and authorization rules.

The mobile client must not depend on assumptions that are specific to browser authentication.

Authentication credentials, tokens, or other sensitive authentication material must never be stored in ordinary unprotected mobile application storage.

If authentication material must be persisted on Android or iOS, platform secure storage should be used.

Authentication and authorization remain server responsibilities regardless of the client being used.

## Cloud and Distribution

The initial backend and web cloud platform is Azure.

Preferred Azure services include:

* Azure App Service for the web client.
* Azure Container Apps for backend APIs and background services.
* Azure Database for PostgreSQL.
* Azure Key Vault.
* Azure App Configuration.
* Azure Application Insights.

Mobile applications are distributed separately from the hosted web and backend services.

Expo Application Services may be used for building, signing, internally distributing, and submitting the Android and iOS applications.

Production Android releases should target Google Play.

Production iOS releases should target the Apple App Store.

Internal distribution and TestFlight may be used before production release.

Additional services should only be introduced when there is a clear need.

## Local Development

The backend, web client, database, and supporting server infrastructure must remain runnable locally using Docker.

Running a single Docker Compose command should provision the backend, web client, database, and required supporting services without requiring Azure resources.

The mobile client is not part of the Docker runtime.

Android and iOS development should use the Expo development environment and connect to the same locally running backend API used by the web client.

The backend API address used by the mobile application must be configurable so that development builds running on physical devices, Android emulators, or iOS simulators can connect to the appropriate environment.

The mobile client must not assume that the backend is available through localhost from the device.

The Docker environment should remain as close as practical to the production server environment.

## Testing

### Backend

* xUnit
* FluentAssertions

### Web Client

* Vitest
* React Testing Library

### Mobile Client

* Jest
* React Native Testing Library

### End to End

* Playwright for the web client.
* Mobile end to end testing should exercise the Android and iOS applications using tooling appropriate to the Expo and React Native environment.

Participant facing stories should be tested through the actual supported clients rather than only through the backend API.

Tests should focus on observable participant behaviour and Domain rules rather than unnecessarily coupling themselves to client implementation details.

## CI/CD

* GitHub Actions
* Docker for backend and web build and deployment workflows.
* Expo Application Services for Android and iOS build and distribution where appropriate.

Every pull request should automatically validate the parts of the system affected by the change.

Backend, web, and mobile automated tests should run in CI where applicable.

A complete signed Android or iOS production build does not need to run for every pull request if doing so provides little additional value or creates unnecessary build cost.

Mobile release workflows should be automated and reproducible.

Production mobile releases must not depend on manually modifying generated application files or undocumented local machine state.

## API

* REST
* OpenAPI documentation
* Versioning when necessary

The backend API is the common application interface used by the web, Android, and iOS clients.

Client specific business APIs should not be introduced merely because one client presents a workflow differently.

The same Domain rules, authorization rules, ownership rules, Membership rules, and state transitions apply regardless of which client initiated the request.

API contracts should remain suitable for multiple independent clients rather than being shaped around assumptions that only make sense in the web application.

## Architecture

The backend is intentionally a modular monolith.

Domain concepts should remain independent from infrastructure concerns and client applications.

Business rules belong in the Domain, not controllers, database models, web components, or mobile components.

Dependencies should point inward toward the Domain.

The web, Android, and iOS clients are interfaces to the Commons Market implementation.

They do not define the protocol.

They communicate with the backend through the application API and must not become alternative implementations of Domain behaviour.

Client applications may contain presentation logic, local interaction state, navigation, caching, and other client concerns.

Authoritative protocol and business behaviour must remain on the server and in the Domain.

## Client Code Sharing

Web and mobile applications should share code where the shared abstraction is natural and reduces duplication without obscuring platform behaviour.

Good candidates for shared code may include:

* API request and response contracts.
* Common TypeScript types.
* API client behaviour.
* Query keys.
* Data transformation that is independent of presentation.
* Shared validation rules that mirror non authoritative client validation.

User interface components do not need to be shared between React DOM and React Native.

The project should not introduce a complex shared user interface framework merely to maximise code reuse.

Server side validation and Domain rules remain authoritative even when similar validation exists in a client.

## Avoid Unless Clearly Justified

The following technologies and patterns should not be introduced without a documented reason.

* Microservices
* Redux
* CQRS
* MediatR
* Event buses
* Generic Repository pattern

## AI Development

AI assistants should not introduce new frameworks, architectural patterns or dependencies without explicit approval.

When unsure, ask rather than assume.

## Containers

Every deployable server application and hosted web application must include an appropriate Dockerfile.

Dockerfiles are the canonical definitions of how containerised applications are built and executed.

Local development, CI/CD pipelines, and production deployments should use the same server and web Dockerfiles wherever practical.

The repository root should contain a `docker-compose.yml` file that orchestrates the backend, web client, database, and other containerised supporting services required for local development.

Android and iOS applications are not containerised runtime applications and are excluded from the Dockerfile requirement.

The mobile application should use the React Native and Expo build and distribution process rather than being packaged as a Docker container.

Running Docker Compose should provide the server environment required by the mobile client, but it is not responsible for launching Android or iOS applications.

The goal is to minimise differences between development and production while respecting the deployment model of each platform.

## Domain Driven Design

The Domain project is the heart of the system.

If a piece of code represents a business rule, business invariant, or business decision, it belongs in the Domain.

Examples include:

- Ledger rules
- Trade rules
- Governance rules
- Reciprocity calculations
- Validation that enforces business invariants

The API, Infrastructure, and any future Application layer should coordinate the execution of the Domain rather than implement business rules themselves.

Infrastructure exists only to communicate with external systems such as databases, authentication providers, cloud services, email, or file storage.

Controllers should remain thin and primarily be responsible for HTTP concerns.

We intentionally avoid an anemic domain model. The Domain should encapsulate business behaviour, not merely data structures.

Additional layers should only be introduced when they provide a clear benefit. We prefer evolving the architecture as complexity grows rather than creating layers that have no responsibility.