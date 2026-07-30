# Ledger

> Working Draft

## Purpose

This document defines how the Commons Protocol records reciprocal relationships.

It describes the Ledger, the events recorded within it, how completed exchanges become part of permanent history, and how factual participation history allows Participants to form trust without relying on reputation scores.

It intentionally avoids implementation details such as databases, APIs, programming languages, authentication providers, and user interface design.

---

# Ledger

The Ledger is the shared record of recognised reciprocal activity within a Commons.

The Ledger records relationships and contributions rather than stored wealth.

It provides a transparent history of the events that explain every Commons Balance.

The Ledger may record events such as:

* A Completed Exchange.
* A reversed Exchange.
* A Dispute outcome.
* A correction approved through a valid process.
* Recognition of a Cross Commons Exchange under a Reciprocity Agreement.

Every change to a Commons Balance should be traceable to one or more Ledger Entries.

A balance without an explainable Ledger history should not be trusted.

The Ledger is conceptually append only.

Past entries should never be silently changed or deleted.

When a correction is necessary, a new Ledger Entry records the correction while preserving the original history.

The exact level of public visibility remains unresolved because transparency must be balanced against personal privacy.

---

# Ledger Entry

A Ledger Entry is a recognised event that changes or explains one or more Commons Balances.

For a local Exchange:

> Alice receives help worth 20 units from Bob.

The Ledger records:

* Alice's balance decreases by 20.
* Bob's balance increases by 20.
* The combined change across the Commons is zero.

Cross Commons Exchanges follow a different recognition process through Reciprocity Agreements.

A Ledger Entry should identify:

* The Commons.
* The Participants affected.
* The value.
* The reason for the change.
* The Agreement or Dispute that produced it.
* When it was recognised.

A Ledger Entry is not a payment moving between stored accounts.

It is a change in recorded reciprocal relationships.

---

# Completed Exchange

A Completed Exchange is an Agreement that has been fulfilled and recognised.

It links together:

* The original Request.
* The accepted Offer.
* The final Agreement.
* The Participants.
* The agreed value.
* Completion confirmations.
* The resulting Ledger Entries.

A Completed Exchange becomes part of the factual participation history of both Participants.

It should not create stars, ratings, badges, or popularity scores.

---

# Profile

A Profile presents factual information about a Participant.

A Profile may show:

* The Participant's chosen name.
* A description.
* Relevant skills or interests.
* Home Commons.
* Completed Exchanges.
* Current Requests.
* Current Offers.
* Participation history.
* Dispute outcomes where appropriate.
* Verification information where appropriate.

A Profile should not contain:

* Star ratings.
* Likes.
* Popularity rankings.
* Leaderboards.
* Contribution badges.
* A single reputation score.
* Labels implying moral worth.

The system may present factual participation history without converting that history into a social score.

The visibility of Commons Balances and detailed Ledger history remains unresolved.

---

# Trust

Trust is not represented by one calculated score.

Participants form trust through factual information such as:

* Previous completed Exchanges.
* The type of work previously performed.
* Whether Agreements were completed.
* Whether Disputes occurred.
* How Disputes were resolved.
* How long the Participant has belonged to the Commons.
* Whether identity or skills have been verified.

The protocol should avoid pretending that trust can be accurately reduced to a single number.
