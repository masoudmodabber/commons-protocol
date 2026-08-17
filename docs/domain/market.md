# Market

> Working Draft

## Purpose

This document defines how voluntary exchanges occur within the Commons Protocol.

It describes how Participants express demand, compete to satisfy that demand, negotiate terms, form Agreements, complete Exchanges, and how local markets emerge through voluntary interaction.

It intentionally avoids implementation details such as databases, APIs, programming languages, authentication providers, and user interface design.

---

# Request

A Request represents something a Participant wants to receive from members of a Commons.

A Request may concern:

* Work.
* A service.
* A physical item.
* Access to a resource.
* Knowledge.
* Teaching.
* Transport.
* Assistance with a task.
* Another voluntarily exchangeable need.

A Request describes the desired outcome but does not determine what should be provided in return.

The terms emerge through Offers and negotiation.

A Request may contain:

* A title.
* A description.
* The Participant who created it.
* The Commons in which it was created.
* A category.
* A location or delivery method.
* A preferred time or deadline.
* Supporting images or files.
* Any relevant constraints.
* Its current status.

A Request does not need to advertise what the requester is willing to provide in return.

Participants responding to the Request decide what terms they wish to propose through their Offers.

A Request may receive no Offers, one Offer, or multiple competing Offers.

Creating a Request does not create an obligation for anyone to respond.

## Request Lifecycle

A Request begins as Open.

While a Request is Open:

* Other Participants in the same Commons may submit Offers.
* The Request creator may edit or cancel the Request according to the applicable Request rules.
* The Request creator may choose whether to accept any Active Offer.

When the Request creator accepts an Active Offer, the Request becomes Matched.

A Matched Request is no longer available for new Offers.

A Matched Request does not mean that the agreed Exchange has been completed.

Later protocol stages may introduce additional lifecycle behaviour related to completion, cancellation, dispute, or other outcomes.

The exact lifecycle beyond the currently defined states remains subject to further protocol design.

---

# Offer

An Offer is a voluntary proposal from one Participant to satisfy another Participant's Request.

An Offer may specify:

* What the Participant will provide.
* What the Participant asks for in return.
* When the work can be completed.
* Any conditions.
* A message or explanation.
* Whether parts of the Request are excluded.

What is requested in return may take different forms.

For example:

* Commons accounting units.
* A good.
* A service.
* Access to a resource.
* Another mutually accepted contribution.

Examples include:

> I can fix the plumbing for 30 Commons units.

or:

> I can fix the plumbing for 20 eggs.

or:

> I can fix the plumbing if you repair my laptop.

Multiple Participants may submit different Offers for the same Request.

Offers may compete through:

* Proposed terms.
* Speed.
* Quality.
* Experience.
* Convenience.
* Trust.
* Personal preference.
* Different proposed solutions.

The lowest numerical value does not automatically win, and an Offer does not need to use Commons accounting units at all.

The requester chooses which Offer best suits their needs.

An Offer begins as Active.

The Participant who created an Active Offer may withdraw it.

When the Request creator accepts one Active Offer:

* The selected Offer becomes Accepted.
* Other Active Offers on the same Request become Closed.
* Offers that were already Withdrawn remain Withdrawn.

Withdrawn and Closed Offers remain part of the historical record rather than being deleted.

Accepted, Closed, and Withdrawn Offers do not return to Active.

Future Offer revision, counteroffer, rejection, and negotiation behaviour remains to be designed.

Submitting an Offer does not change either Participant's Commons Balance.

---

# Negotiation

Negotiation is the voluntary process through which Participants may clarify or revise proposed exchange terms.

Negotiation may involve:

* What each Participant will provide.
* Commons accounting value when it is part of the exchange.
* Scope.
* Timing.
* Location.
* Materials.
* Delivery.
* Conditions.
* Expected outcome.

The protocol does not calculate or enforce a correct price or exchange value.

The application should not currently suggest exchange values based on historical Exchanges.

Whether historical Exchange information should ever be shown as negotiation context remains an open question.

The exact negotiation model remains to be designed.

In particular, future protocol design must distinguish between:

* Clarifying an Offer without changing its terms.
* Revising an Offer before acceptance.
* Counteroffers or replacement Offers.
* Renegotiating or amending terms after an Agreement has already been created.

These behaviours should not be treated as equivalent unless explicitly defined by a later protocol decision.

---

# Agreement

An Agreement is created when the creator of a Request accepts an Active Offer.

Submitting the Offer represents the Offer creator's proposal of those terms.

Accepting the Offer represents the Request creator's acceptance of the same terms.

At that point the proposal becomes a mutual Agreement between the two Participants.

An Agreement records the terms that were accepted at the time the Offer was accepted.

An Agreement should identify:

* The Participants.
* The originating Request.
* The accepted Offer.
* What each Participant has agreed to provide.
* Any Commons accounting value included in the Agreement.
* The agreed scope.
* Any relevant deadline.
* Any agreed conditions.
* The Commons in which the Agreement exists.

Terms copied into the Agreement must preserve the accepted terms rather than depend on later changes to related Participant data such as Capabilities.

An Agreement does not immediately update Commons Balances.

If the Agreement uses Commons accounting units, balances change only after the Exchange is recognised as completed or after a Dispute produces a final outcome.

If the Agreement is a direct exchange between the Participants, completion does not automatically create a Commons Balance change.

Creating an Agreement does not mean that the agreed work, goods, services, resources, or other contributions have already been delivered.

Agreement modification, renegotiation, cancellation, and termination rules remain unresolved and must be defined separately before implementation.

---

# Exchange

An Exchange is the real activity performed under an Agreement.

An Exchange may involve:

* Completing work.
* Delivering an item.
* Teaching a skill.
* Providing transport.
* Sharing access to a resource.
* Performing another agreed contribution.

The protocol supports both direct reciprocity and Commons reciprocity.

## Direct Reciprocity

Direct reciprocity occurs when the Participants agree to provide something directly to one another.

For example:

> Bob repairs Alice's plumbing and Alice provides Bob with 20 eggs.

The Participants agree on the exchange themselves.

No Commons Balance change is required simply because the Exchange occurred.

## Commons Reciprocity

Commons reciprocity occurs when a Participant contributes to another Participant in return for an agreed Commons accounting value.

For example:

> Bob repairs Alice's plumbing for 30 units.

When the Exchange is completed and recognised:

* Bob's Commons Balance increases.
* Alice's Commons Balance decreases.

Commons reciprocity allows exchange to continue when direct reciprocity does not align.

Alice does not need to possess the particular good, service, or resource Bob currently wants.

Bob can contribute to Alice and later receive something useful from another Participant in the Commons.

Neither form of reciprocity is mandatory or preferred by the protocol.

Participants choose the terms that suit them.

An Exchange is not complete merely because one Participant claims that it is complete.

Completion normally requires confirmation from both Participants.

Most Exchanges occur within a Participant's Home Commons.

Future versions of the protocol will also support Cross Commons Exchanges between Participants belonging to different Commons.

The first application should focus on Exchanges between two Participants within the same Commons.

More complex Exchanges involving groups, organisations, or multiple Commons can be added later.

---

# Completion

Completion occurs when the agreed contributions have been delivered and recognised.

The normal completion process is:

1. One Participant marks their agreed contribution as complete.
2. The other Participant confirms completion according to the Agreement.
3. The Completed Exchange becomes part of the factual participation history.
4. If the Agreement uses Commons accounting units, the Ledger records the corresponding reciprocal changes and Commons Balances are updated.

A direct Exchange does not automatically change Commons Balances.

If both Participants do not agree that the Exchange is complete, either Participant may raise a Dispute.

Completion should be explicit.

Silence should not automatically count as confirmation unless a future Commons rule clearly defines such behaviour.

---

# Category

A Category is an optional way of organising Requests and Offers.

Examples may include:

* Repairs.
* Transport.
* Teaching.
* Technology.
* Gardening.
* Cooking.
* Care.
* Construction.
* Creative work.
* Goods.
* Resource access.

Categories exist to improve browsing and discovery.

They do not determine exchange terms or value.

Each Commons may eventually define categories suited to its own needs.

---

# Value

When Commons accounting units are used in an Agreement, their value is voluntarily accepted by the Participants through negotiation.

The protocol records the agreed value.

It never determines it.

For the MVP, a Commons accounting value proposed in an Offer must be a positive whole number from 1 through 9,007,199,254,740,991 inclusive.

An Agreement preserves the Commons accounting value from the accepted Offer.

This numeric range is a Domain rule. It does not depend on the larger range supported by an implementation's database storage type.

The same work may have different values:

* At different times.
* In different locations.
* Between different Participants.
* In different Commons.
* Under different conditions.
* When supply or demand changes.

No Commons is expected to have identical prices.

Differences between Commons are a natural consequence of free markets.

The unit used to express Commons accounting value is an accounting unit within a Commons.

It is not intended to behave as transferable money.

The name and presentation of this accounting unit remain unresolved.

Direct Exchanges do not need to be reduced to an equivalent Commons accounting value.

---

# Local Market

Every Commons contains its own local market.

A local market emerges naturally from the voluntary interactions of its Participants.

It is shaped by:

* Requests.
* Offers.
* Negotiation.
* Competition.
* Available capabilities.
* Available goods and resources.
* Local demand.
* Local scarcity.
* Participant preferences.

No central authority manages the local market.

No Commons determines the terms or value of voluntary exchanges.

Exchange terms emerge through free negotiation between Participants.

Different Commons are expected to develop different local economies.

This diversity is considered a strength of the protocol rather than a problem to be solved.
