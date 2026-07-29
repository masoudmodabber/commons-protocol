# Commons Protocol Domain Model

> Working Draft

## Purpose

This document defines the concepts that make up the Commons Protocol.

It intentionally avoids technical implementation details such as databases, APIs, programming languages, authentication providers, and user interface design.

If `philosophy.md` explains why the protocol exists, this document explains what exists within it.

The software should implement this domain model. The domain model should not be shaped around the limitations of the first application.

# Core Relationships

The basic flow of the protocol is:

1. A Participant belongs to a Commons.
2. A Participant creates a Request.
3. Other Participants submit Offers.
4. The requester accepts one Offer.
5. The accepted Offer becomes an Agreement.
6. The participants perform the agreed work or exchange.
7. Both participants confirm completion.
8. The Agreement becomes a Completed Exchange.
9. The Ledger records the exchange.
10. The participants' Commons Balances are updated.

# Participant

A Participant is an individual who takes part in one or more Commons.

A Participant may:

* Join or create a Commons.
* Create Requests.
* Submit Offers.
* Accept or refuse exchanges.
* Negotiate value.
* Complete exchanges.
* Confirm completion.
* Raise a Dispute.
* View relevant participation history.

A Participant is never required to accept a Request, submit an Offer, or complete work without first entering a voluntary Agreement.

A Participant may belong to more than one Commons.

A Participant has a separate relationship and Commons Balance with each Commons.

# Commons

A Commons is an autonomous community whose participants exchange work, services, goods, knowledge, or other forms of help through a shared reciprocal Ledger.

A Commons decides its own:

* Membership rules.
* Culture.
* Governance practices.
* Priorities.
* Local expectations.

A Commons does not control prices or assign work.

Participants within the Commons remain free to negotiate value and refuse any exchange.

Each Commons maintains its own Ledger and its own Commons Balances.

Commons may eventually cooperate with other Commons through the shared Commons Protocol.

# Membership

Membership represents the relationship between a Participant and a Commons.

Membership allows a Participant to take part in the Commons economy and governance processes.

A Membership may contain factual information such as:

* When the Participant joined.
* Whether the Membership is active.
* The Participant's Commons Balance.
* The Participant's completed exchanges within that Commons.
* The Participant's unresolved Agreements or Disputes.

Membership does not grant additional political power based on balance, popularity, wealth, or contribution history.

The exact rules for joining, leaving, suspending, or removing members are determined by each Commons.

The first application may initially support simple open or invitation based membership while leaving more complex membership governance for later development.

# Commons Balance

A Commons Balance represents the current reciprocal relationship between a Participant and a specific Commons.

It is not money, currency, wealth, a credit score, or a reputation score.

A positive Commons Balance means the Participant has contributed more to the Commons than they have received from it.

A negative Commons Balance means the Participant has received more from the Commons than they have contributed back.

A defining interpretation is:

> The Commons collectively owes Alice roughly 100 units of future help.

A positive balance does not entitle Alice to any specific person's labour.

Other Participants remain free to accept or refuse her Requests.

They may choose to help because completing the exchange improves their own relationship with the Commons.

## Balance Changes

When Bob completes work for Alice for an agreed value of 20 units:

* Bob's Commons Balance increases by 20.
* Alice's Commons Balance decreases by 20.

The Commons does not hold the 20 units.

No central account receives or transfers them.

The change records that Bob has contributed more to the Commons and Alice has received more from it.

## Balance Properties

A Commons Balance:

* Belongs to the relationship between one Participant and one Commons.
* Changes only through recognised Ledger entries.
* Cannot earn interest.
* Cannot produce passive income.
* Cannot grant political authority.
* Cannot grant additional voting rights.
* Cannot be converted directly into conventional money.
* Cannot be invested to generate more balance.
* Does not represent ownership of the Commons.
* Does not represent ownership of another person's labour.

Whether balances can expire, decay, or have practical limits remains unresolved.

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

# Exchange

An Exchange is the real activity performed under an Agreement.

An Exchange may involve:

* Completing work.
* Delivering an item.
* Teaching a skill.
* Providing transport.
* Sharing access to a resource.
* Performing another agreed contribution.

The Exchange is not complete merely because one Participant claims that it is complete.

Completion normally requires confirmation from both Participants.

The first application should focus on exchanges between two Participants within the same Commons.

More complex exchanges involving groups, organisations, or multiple Commons can be added later.

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

# Ledger

The Ledger is the shared record of recognised reciprocal activity within a Commons.

The Ledger records relationships and contributions rather than stored wealth.

It should provide a transparent history of events that affect Commons Balances.

The Ledger may record events such as:

* A completed Exchange.
* A reversed Exchange.
* A Dispute outcome.
* A correction approved through a valid process.
* A future Cross Commons Exchange.

The Ledger should preserve enough history to explain how every Commons Balance was produced.

A balance without a traceable Ledger history should not be trusted.

The Ledger is conceptually append only.

Past entries should not be silently changed or deleted.

When a correction is necessary, the correction should be represented by a new Ledger entry that refers to the earlier entry.

The exact level of public visibility remains unresolved because transparency must be balanced against personal privacy.

# Ledger Entry

A Ledger Entry is a recognised event that changes or explains one or more Commons Balances.

A completed Exchange normally creates corresponding changes for both Participants.

For example:

> Alice receives help worth 20 units from Bob.

The Ledger records:

* Alice's balance decreases by 20.
* Bob's balance increases by 20.
* The combined change across the Commons is zero.

A Ledger Entry should identify:

* The Commons.
* The Participants affected.
* The value.
* The reason for the change.
* The Agreement or Dispute that produced it.
* When it was recognised.

A Ledger Entry is not a payment moving between stored accounts.

It is a change in recorded reciprocal relationships.

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

# Profile

A Profile presents factual information about a Participant.

A Profile may show:

* The Participant's chosen name.
* A description.
* Relevant skills or interests.
* Commons Memberships.
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

The system may show factual history without converting that history into a social score.

The visibility of balances and detailed exchange history remains unresolved.

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

# Value

Value is the quantity voluntarily accepted by Participants when forming an Agreement.

Value is discovered through negotiation rather than assigned by the protocol.

The same work may have different values:

* At different times.
* In different locations.
* Between different Participants.
* In different Commons.
* Under different conditions.
* When supply or demand changes.

The protocol should not enforce uniform pricing.

The unit used to express value is an accounting unit within a Commons.

It is not intended to behave as transferable money.

The name and presentation of this unit remain unresolved.

# Local Market

Each Commons contains its own local market.

A local market emerges from:

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

A Commons may establish behavioural rules, but it should not determine the value of voluntary exchanges.

# Cross Commons Exchange

A Cross Commons Exchange is an exchange involving Participants or resources from different Commons.

Each Commons maintains its own Ledger and Commons Balances.

A Cross Commons Exchange must eventually be recognised by both Commons without requiring a central bank or central Ledger.

The two Commons should independently confirm the same Exchange.

The earlier philosophical model proposes dual confirmation through temporary rotating delegates, but the detailed protocol is not yet defined.

Cross Commons Exchange is outside the first application MVP.

# Commons Interoperability

Commons Interoperability means independent Commons can cooperate through shared protocol rules while retaining local autonomy.

Interoperability should not require:

* A central marketplace.
* A central bank.
* A central administrator.
* A single global Ledger.
* Uniform local governance.
* Uniform local prices.

The Commons Protocol should define the minimum shared rules required for Commons to recognise one another and exchange information safely.

Those rules remain a future area of design.

# Governance

Governance concerns decisions affecting a Commons as a whole.

The broader Commons philosophy rejects permanent representatives and permanent concentrations of authority.

Responsibility should be:

* Temporary.
* Limited to a defined task.
* Transparent.
* Accountable to the Commons.
* Dissolved when the task is complete.

Detailed governance is outside the initial exchange application.

The first application should avoid embedding permanent administrative power into its core domain unless operationally unavoidable.

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

# MVP Domain Scope

The first version should test the narrowest useful form of the Commons Protocol.

The MVP should include:

* Participants.
* Commons.
* Memberships.
* Commons Balances.
* Requests.
* Offers.
* Negotiation.
* Agreements.
* Completion confirmation.
* Completed Exchanges.
* Ledger Entries.
* Basic Profiles.

The MVP may initially exclude:

* Disputes.
* Juries.
* Cross Commons Exchange.
* Complex governance.
* Infrastructure funding.
* Research funding.
* Group Exchanges.
* Organisations.
* Balance decay.
* Advanced identity verification.
* Fully decentralised hosting.

Excluding these concepts from the MVP does not mean they are rejected.

It means they are not required to test the first core hypothesis:

> Can a community coordinate everyday voluntary exchange through a reciprocal Ledger instead of conventional money?

# Open Domain Questions

The following questions remain unresolved and should be tracked separately in `docs/open-questions.md`:

* Can Commons Balances accumulate without recreating concentrated power?
* Should balances decay over time?
* Should balances have practical or protocol limits?
* How should long term innovation be rewarded?
* How can capital intensive projects operate without central funding or accumulated investment power?
* How visible should a Participant's balance be?
* How much Ledger history should be public?
* How should Participants join or leave a Commons?
* How should duplicate identities be limited?
* How should Disputes and Juries work?
* Can an Agreement be cancelled unilaterally?
* How should group Exchanges work?
* How should Cross Commons values be reconciled?
* What shared rules are necessary for Commons Interoperability?
* What should the accounting unit be called?

# Domain Principles

The domain model should preserve the following principles:

* Every exchange is voluntary.
* Prices emerge through negotiation.
* Participants may refuse any exchange.
* The protocol records value but does not set it.
* A Commons Balance records a relationship, not stored wealth.
* No balance grants political authority.
* No balance grants ownership of another person's labour.
* Trust comes from factual participation rather than social scoring.
* Ledger changes must be explainable through traceable events.
* Commons remain locally autonomous.
* Cross Commons cooperation should not require central control.
* Temporary responsibility is preferred over permanent authority.
* The first application should remain simpler than the full protocol.
