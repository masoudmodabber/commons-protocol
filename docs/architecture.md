# Technical Decisions

This document records the technical standards for the Commons Market implementation. It exists to ensure both humans and AI assistants make consistent technical decisions throughout the project.

## Guiding Principles

* Prefer simplicity over cleverness.
* The protocol is the product. The implementation exists to support it.
* Build a modular monolith. Do not introduce distributed systems unless there is a demonstrated need.
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

* React
* TypeScript
* Vite
* Tailwind CSS
* TanStack Query

## Authentication

The initial implementation will use ASP.NET Identity.

Authentication should remain isolated behind clear abstractions so that another provider (such as Microsoft Entra External ID) can be introduced later without affecting the domain.

## Cloud

The initial cloud platform is Azure.

Preferred services include:

* Azure App Service (frontend)
* Azure Container Apps (backend APIs and background services)
* Azure Database for PostgreSQL
* Azure Key Vault
* Azure App Configuration
* Azure Application Insights

Additional services should only be introduced when there is a clear need.

## Local Development

The project must be runnable locally using Docker.

Running a single command should provision all required local services, including databases and supporting infrastructure, so the application can be developed and tested without requiring cloud resources.

The Docker environment should remain as close as practical to the production environment.

## Testing

Backend

* xUnit
* FluentAssertions

Frontend

* Vitest
* React Testing Library

End to end

* Playwright

## CI/CD

* Docker
* GitHub Actions

Every pull request should be validated automatically.

## API

* REST
* OpenAPI documentation
* Versioning when necessary

## Architecture

The project is intentionally a modular monolith.

Domain concepts should remain independent from infrastructure concerns.

Business rules belong in the domain, not controllers or database models.

Dependencies should point inward toward the domain.

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

Every deployable application must include its own Dockerfile.

The Dockerfile is the canonical definition of how the application is built and executed.

Local development, CI/CD pipelines, and production deployments should all use the same Dockerfiles wherever practical.

The repository root should contain a `docker-compose.yml` file that orchestrates the complete local development environment using these Dockerfiles.

Running a single command should start the entire application stack, including all required supporting services such as PostgreSQL.

The goal is to minimise differences between local development and production environments.

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