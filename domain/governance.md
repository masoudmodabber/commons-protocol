# Governance

> Working Draft

## Purpose

This document defines how Commons govern themselves and resolve disagreements.

It describes disputes, temporary juries, governance principles, abuse prevention, and participant notifications.

It intentionally avoids implementation details such as databases, APIs, programming languages, authentication providers, and user interface design.

---

# Dispute

A Dispute occurs when Participants cannot agree about an Agreement, Exchange, completion, cancellation, or Ledger outcome.

A Dispute may concern:

* Work not being completed.
* Work not matching the Agreement.
* A requester refusing valid completion.
* A provider claiming completion incorrectly.
* A cancellation.
* Damage or loss.
* Misrepresentation.
* The agreed value.
* Another claimed breach of the Agreement.

A Dispute should reference the original Request, Offer, Agreement, and available evidence.

A Dispute does not automatically imply wrongdoing.

Until resolved, the disputed Ledger change should not be treated as final.

---

# Jury

A Jury is a temporary group of Participants responsible for resolving a specific Dispute.

A Jury is not a permanent moderation body.

Its authority exists only for the Dispute it was selected to consider.

After the decision is complete, the Jury dissolves.

Jurors should be independent from the Participants involved in the Dispute.

Jury decisions may result in:

* Confirming the original Agreement.
* Confirming full completion.
* Confirming partial completion.
* Cancelling the Exchange.
* Adjusting the final value.
* Reversing a Ledger Entry.
* Another outcome permitted by the Commons rules.

The following questions remain unresolved:

* How jurors are selected.
* How many jurors are required.
* What level of participation history is required.
* How conflicts of interest are identified.
* Whether appeals are allowed.
* How jurors are compensated for their time.
* How dishonest jury behaviour is handled.

These questions do not need to be solved for the earliest version of the application if Disputes are excluded from the initial MVP.

---

# Governance

Governance concerns decisions affecting a Commons as a whole.

The broader Commons philosophy rejects permanent representatives and permanent concentrations of authority.

Responsibility should be:

* Temporary.
* Limited to a defined task.
* Transparent.
* Accountable to the Commons.
* Dissolved when the task is complete.

Governance may also determine:

* Membership rules.
* When a Commons should divide into smaller geographic Commons.
* Whether Reciprocity Agreements should be established, suspended, or terminated.

Detailed governance is outside the initial exchange application.

The first application should avoid embedding permanent administrative power into its core domain unless operationally unavoidable.

---

# Abuse

The protocol must account for Participants who attempt to exploit it.

Potential abuse includes:

* Fake Requests.
* Fake Offers.
* Fake Exchanges.
* Collusion.
* Duplicate identities.
* Spam.
* Artificial values.
* Dishonest completion claims.
* Dishonest Disputes.
* Harassment.
* Manipulation of governance processes.

The protocol should prefer:

* Transparency.
* Traceable history.
* Mutual confirmation.
* Temporary review processes.
* Community oversight.

It should avoid relying entirely on hidden central enforcement.

The exact abuse prevention mechanisms belong in later security and protocol documents.

---

# Notifications

A Notification informs a Participant about relevant activity.

Examples include:

* A new Offer.
* An Offer being accepted.
* A message about an Agreement.
* A completion request.
* A Dispute.
* A Jury selection request.

Notifications are an application feature rather than a foundational protocol concept.

They should not influence Commons Balances or domain outcomes.
