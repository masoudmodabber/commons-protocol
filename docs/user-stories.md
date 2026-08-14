# User Stories

> Working Draft

## Purpose

This document defines the functional requirements for the first implementation of the Commons Protocol.

Each user story describes a capability the application should provide from a participant's perspective.

The stories are organized into epics that can be independently implemented and tested.

## Definition of Done

A user story is complete only when all parts required by that story are implemented and usable.

Where applicable, this includes:

* Domain behaviour and invariants.
* Persistence.
* Backend API behaviour.
* React frontend behaviour.
* Automated tests.
* End to end usability through the application.

A browser facing user story is not complete if it can only be exercised through API calls, Postman, curl, or direct database access.

Codex should not mark a story complete while any acceptance criterion remains unmet.

---

# Epic: Participant Management

## US 001 Join a Commons and create my participant profile

As a person

I want to join an existing local Commons and create my participant profile

So that I can participate in the Commons Market.

### Acceptance Criteria

1. The person must be authenticated before joining a Commons.

2. The person selects one Commons from the available Commons.

3. Joining the Commons creates their Participant, Profile, and Membership.

4. A Participant cannot exist without a Home Commons.

5. A Participant requires a display name.

6. A Participant may include an optional short bio.

7. One authenticated user can have only one Participant identity.

8. A Participant must always have exactly one active Home Commons.

9. Creating a new Commons is not part of this story.

10. Capabilities are not part of this story.

11. After joining, the Participant can view their profile and Home Commons.

### Current MVP Constraint

A Participant cannot leave their Home Commons without joining another Commons.

Moving between Commons is not part of the MVP and will be designed later.

---

## US 002 Manage what I can provide

As a participant

I want to describe the goods, services, skills, resources, or assistance I may be able to provide

So that other participants can discover what is available within the Commons.

Listing something I can provide does not create a standing Offer, price, statement of current availability, or obligation to trade.

---

# Epic: Requests

## US 003 Create a Request

As a participant

I want to create a Request describing what I need

So that others can offer to help.

A Request does not need to state what I will provide in return.

Participants responding to the Request propose their own terms through Offers.

---

## US 004 Edit a Request

...

---

## US 005 Cancel a Request

...

---

## US 006 Browse Requests

...

---

## US 007 Search Requests

...

---

# Epic: Offers

## US 008 Submit an Offer

As a participant

I want to submit an Offer in response to a Request

So that I can propose what I will provide and what I want in return.

An Offer may ask for Commons accounting units or a direct contribution such as goods, services, resources, or other mutually accepted assistance.

The application does not determine or suggest the correct value.

---

## US 009 Withdraw an Offer

...

---

## US 010 Compare Offers

As a participant

I want to compare the different Offers made on my Request

So that I can choose the terms that best suit me.

Offers may differ in what is requested in return and do not need to be directly comparable by a single numerical value.

---

## US 011 Accept an Offer

...

---

# Epic: Agreements

## US 012 View active Agreements

...

---

## US 013 Negotiate an Agreement

As a participant

I want to negotiate the terms of an Agreement

So that both participants can voluntarily agree on what each will provide.

Negotiation may include Commons accounting units, direct exchange terms, scope, timing, materials, delivery, and other conditions.

---

# Epic: Exchanges

## US 014 Mark work complete

...

---

## US 015 Confirm completion

As a participant

I want to confirm that the agreed Exchange has been completed

So that the completed activity becomes part of our participation history and any required Commons Balance changes can be recorded.

A direct Exchange does not automatically change Commons Balances.

---

# Epic: Ledger

## US 016 View Commons Balance

...

---

## US 017 View Ledger history

...

---

## US 018 View completed Exchanges

As a participant

I want to view my completed Exchanges

So that I can see my factual participation history, including Exchanges that did not change my Commons Balance.

---

# Epic: Notifications

## US 019 Receive Offer notifications

...

---

## US 020 Receive Agreement notifications

...

---

## US 021 Receive completion notifications

...
