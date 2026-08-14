
# Security

> Working Draft

## Purpose

This document defines security principles that apply across the Commons Protocol.

The goal is to ensure that Participants can only act within the authority granted by their identity, Membership, ownership, Agreements, and other valid domain relationships.

Implementation technologies may vary, but these rules should remain true.

---

# Untrusted Client Input

All data supplied by a client must be treated as untrusted.

This includes:

* Participant identifiers.
* Commons identifiers.
* Request identifiers.
* Offer identifiers.
* Agreement identifiers.
* Exchange identifiers.
* Ownership information.
* Membership information.
* Status values.
* Commons Balance related values.
* Authorization related flags or claims.

A client supplying a valid identifier does not prove that the Participant is authorized to access or modify the identified resource.

Authorization must be determined from trusted server side state and protocol rules.

---

# Participant Identity

The authenticated application account and the protocol Participant are separate concepts.

The application must resolve the authenticated account to the corresponding Participant using trusted server side state.

A client must not be allowed to choose or impersonate the Participant identity under which an action is performed.

Participant identity should never be trusted merely because a Participant identifier was supplied by the client.

---

# Resource Ownership

Where a protocol resource belongs to or was created by a specific Participant, actions restricted to that Participant must enforce that relationship.

For example:

> Only the Participant who created a Request may edit that Request.

Possession of the Request identifier does not grant authority to modify it.

Changing an identifier in a request must never allow one Participant to act on another Participant's resources.

These rules apply even when the user interface does not expose the unauthorized action.

---

# Membership and Commons Boundaries

Actions that depend on Commons Membership must derive that Membership from trusted protocol state.

A Participant must not be able to gain access to another Commons by supplying a different Commons identifier.

Where an action is restricted to a Participant's Home Commons, the Home Commons should be derived from the Participant's active Membership rather than accepted from the client as authoritative.

---

# Domain Authorization

Security rules that express protocol relationships should be enforced as domain or application rules rather than relying only on user interface behaviour.

Examples include:

* Only a Request creator may edit their Request.
* Only Participants belonging to an appropriate Commons may perform Commons restricted actions.
* Only Participants involved in an Agreement may perform actions on that Agreement.
* Balance changes may occur only through recognised protocol events.

Authentication establishes who is making a request.

Protocol rules determine what that Participant is allowed to do.

---

# User Interface Is Not a Security Boundary

The application interface may hide or disable actions that a Participant cannot perform.

This improves usability but does not provide security.

Every protected read or write operation must enforce authorization independently on the server.

---

# Insecure Direct Object References

Any operation that accepts a resource identifier must assume that a malicious Participant may supply the identifier of another Participant's resource.

Implementations should explicitly test that:

* A Participant can access resources they are authorized to access.
* Another Participant cannot gain access by supplying a valid identifier.
* Changing identifiers in URLs, request bodies, or other client input does not bypass authorization.
* Unauthenticated callers cannot perform protected actions.

The protocol must not rely on identifiers being secret or difficult to guess.

---

# Balance and Ledger Integrity

Commons Balances must never be directly set or modified by a Participant.

Balance changes must result only from recognised Ledger events defined by the protocol.

Clients must not be trusted to supply authoritative:

* Balance values.
* Ledger outcomes.
* Completion effects.
* Ownership of reciprocal obligations.

Every Commons Balance must remain explainable through its Ledger history.