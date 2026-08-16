# User Stories

> Working Draft

## Purpose

This directory defines the functional requirements for the first implementation of the Commons Protocol.

Each user story describes a capability Commons Market should provide from a Participant's perspective.

User stories describe participant behaviour rather than tying that behaviour to a particular client technology.

The stories are organized into epics that can be independently implemented and tested.

Client delivery requirements are defined centrally by the Definition of Done.

## Definition of Done

A user story is complete only when all parts required by that story are implemented and usable.

Where applicable, this includes:

* Domain behaviour and invariants.
* Persistence.
* Backend API behaviour.
* Web client behaviour.
* Android client behaviour.
* iOS client behaviour.
* Automated tests.
* Authorization and security tests.
* End to end usability through the supported participant clients.

A participant facing story is not complete if it can only be exercised through API calls, Postman, curl, direct database access, or only one supported participant client.

The web, Android, and iOS implementations do not need identical user interfaces.

They must provide the same participant capability and produce the same authoritative Domain outcome.

Platform specific behaviour may differ where required by the operating system or where the user story explicitly defines a platform specific requirement.

No client is a security boundary.

Authentication, authorization, ownership, Membership, and Domain rules must be enforced by trusted server side behaviour.

Codex should not mark a story complete while any acceptance criterion or applicable part of this Definition of Done remains unmet.

## Mobile Client Transition

US 001 through US 012 were originally implemented before Android and iOS were part of the Commons Market Definition of Done.

Their existing Domain, persistence, API, automated test, and web implementations remain valid.

Before implementation continues with US 013, the Android and iOS mobile client must be introduced and US 001 through US 012 must be revisited in story order to add the mobile participant experience required by the current Definition of Done.

This is an extension of the existing stories rather than a redesign of their Domain behaviour.

Codex should not rewrite completed backend or web behaviour merely because mobile support is being added.

Backend or API changes should be made only when the existing interface genuinely prevents a supported mobile flow or exposes an architectural problem.

Once mobile coverage for US 001 through US 012 is complete, new participant facing stories should be implemented across web, Android, and iOS as part of the normal story workflow.

The existing US 013 numbering remains unchanged.

## Epics

* Participant Management
* Requests
* Offers
* Agreements
* Exchanges
* Ledger
* Notifications

## Deferred Work

Functionality intentionally postponed from current stories is tracked in `backlog.md`.

When the current implementation scope is reviewed, this backlog should be checked before defining additional stories.