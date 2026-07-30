# Market

> Working Draft

## Purpose

This document defines how voluntary exchanges occur within the Commons Protocol.

It describes how Participants express demand, compete to satisfy that demand, negotiate value, form Agreements, complete Exchanges, and how local markets emerge through voluntary interaction.

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

A Request describes the desired outcome but does not determine its value.

The value emerges through Offers and negotiation.

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

A Request may receive no Offers, one Offer, or multiple competing Offers.

Creating a Request does not create an obligation for anyone to respond.

## Request Lifecycle

A Request may move through states such as:

* Open.
* Under negotiation.
* Agreed.
* Completed.
* Cancelled.
* Expired.
* Disputed.

The exact technical representation of these states belongs in the implementation design rather than this document.

---

# Offer

An Offer is a voluntary proposal from one Participant to satisfy another Participant's Request.

An Offer may specify:

* The proposed value.
* What the Participant will provide.
* When the work can be completed.
* Any conditions.
* A message or explanation.
* Whether parts of the Request are excluded.

Multiple Participants may submit different Offers for the same Request.

Offers may compete through:

* Value.
* Speed.
* Quality.
* Experience.
* Convenience.
* Trust.
* Personal preference.
* Different proposed solutions.

The lowest value does not automatically win.

The requester chooses which Offer best suits their needs.

An Offer may be accepted, rejected, withdrawn, replaced, or left unanswered.

Submitting an Offer does not change either Participant's Commons Balance.

---

# Negotiation

Negotiation is the voluntary process through which Participants determine the terms of an exchange.

Participants may negotiate:

* Value.
* Scope.
* Timing.
* Location.
* Materials.
* Delivery.
* Conditions.
* Expected outcome.

The protocol does not calculate or enforce a correct price.

Historical exchanges may provide useful context, but they never establish a mandatory price.

Negotiation ends when both Participants accept the same terms or decide not to proceed.

---

# Agreement

An Agreement is created when a requester accepts an Offer and both Participants accept the final terms.

An Agreement records the mutual commitment between the Participants.

An Agreement should identify:

* The Participants.
* The originating Request.
* The accepted Offer.
* The agreed value.
* The agreed scope.
* Any relevant deadline.
* Any agreed conditions.
* The Commons in which the Agreement exists.

An Agreement does not immediately update Commons Balances.

Balances change only after the exchange is recognised as completed or after a Dispute produces a final outcome.

An Agreement may be cancelled only according to terms accepted by both Participants or through a Dispute process.

The exact cancellation rules remain unresolved.

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

An Exchange is not complete merely because one Participant claims that it is complete.

Completion normally requires confirmation from both Participants.

Most Exchanges occur within a Participant's Home Commons.

Future versions of the protocol will also support Cross Commons Exchanges between Participants belonging to different Commons.

The first application should focus on Exchanges between two Participants within the same Commons.

More complex Exchanges involving groups, organisations, or multiple Commons can be added later.

---

# Completion

Completion occurs when the agreed contribution has been delivered and recognised.

The normal completion process is:

1. One Participant marks the work or delivery as complete.
2. The other Participant confirms completion.
3. The Ledger records the completed exchange.
4. Commons Balances are updated.

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

They do not determine value.

Each Commons may eventually define categories suited to its own needs.

---

# Value

Value is the quantity voluntarily accepted by Participants when forming an Agreement.

Value is discovered through negotiation rather than assigned by the protocol.

The protocol records value.

It never determines it.

The same work may have different values:

* At different times.
* In different locations.
* Between different Participants.
* In different Commons.
* Under different conditions.
* When supply or demand changes.

No Commons is expected to have identical prices.

Differences between Commons are a natural consequence of free markets.

The unit used to express value is an accounting unit within a Commons.

It is not intended to behave as transferable money.

The name and presentation of this accounting unit remain unresolved.

---

# Local Market

Every Commons contains its own local market.

A local market emerges naturally from the voluntary interactions of its Participants.

It is shaped by:

* Requests.
* Offers.
* Negotiation.
* Competition.
* Available skills.
* Available resources.
* Local demand.
* Local scarcity.
* Participant preferences.

No central authority manages the local market.

No Commons determines the value of voluntary exchanges.

Prices emerge through free negotiation between Participants.

Different Commons are expected to develop different local economies.

This diversity is considered a strength of the protocol rather than a problem to be solved.
