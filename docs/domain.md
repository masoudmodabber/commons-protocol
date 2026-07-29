# Commons Protocol Domain Model

> Working Draft

## Purpose

This document defines the concepts that make up the Commons Protocol.

It intentionally avoids technical implementation details such as databases, APIs, programming languages, authentication providers, and user interface design.

If `philosophy.md` explains why the protocol exists, this document explains what exists within it.

The software should implement this domain model. The domain model should not be shaped around the limitations of the first application.

# Core Relationships

The basic flow of the protocol is:

## Local Exchange

1. A Participant belongs to a Home Commons.
2. A Participant creates a Request.
3. Other Participants submit Offers.
4. The requester accepts one Offer.
5. The accepted Offer becomes an Agreement.
6. The Participants perform the agreed exchange.
7. Both Participants confirm completion.
8. The Agreement becomes a Completed Exchange.
9. The Commons Ledger records the exchange.
10. The Participants' Commons Balances are updated.

## Cross Commons Exchange

Future versions of the protocol extend this flow.

When Participants belong to different Home Commons:

1. The exchange is performed under an active Reciprocity Agreement between the two Commons.
2. Each Commons independently recognises the completed exchange according to the Reciprocity Agreement.
3. Each Commons updates the reciprocal relationship of its own Participant.
4. Any obligations between the two Commons are managed through the Reciprocity Agreement rather than through a global Ledger.

Both local and Cross Commons Exchanges follow the same principles of voluntary exchange while preserving the independence of every Commons.

# Participant

A Participant is an individual who belongs to one Home Commons.

A Participant may:

* Join a Home Commons.
* Help establish a new Commons when one is created.
* Create Requests.
* Submit Offers.
* Accept or refuse exchanges.
* Negotiate value.
* Complete exchanges.
* Confirm completion.
* Raise a Dispute.
* View relevant participation history.

A Participant is never required to accept a Request, submit an Offer, or complete work without first entering a voluntary Agreement.

A Participant has one Commons Balance representing their current reciprocal relationship with their Home Commons.

Participants remain free to exchange with Participants from other Commons through Cross Commons Exchanges.

Belonging to one Home Commons does not restrict participation in the wider market.

# Commons

A Commons is an autonomous geographic community whose Participants exchange work, services, goods, knowledge, and other forms of voluntary assistance through a shared reciprocal Ledger.

A Commons is defined by geography rather than shared interests.

Its purpose is to allow people living within the same local area to cooperate, govern themselves, and build reciprocal relationships.

Each Commons decides its own:

* Membership rules.
* Culture.
* Governance practices.
* Priorities.
* Local expectations.

A Commons does not:

* Assign work.
* Set prices.
* Guarantee Requests will be fulfilled.
* Require Participants to trade.

Participants remain free to negotiate value, compete with one another, and refuse any exchange.

Each Commons maintains its own:

* Membership.
* Commons Ledger.
* Commons Balances.
* Governance.

Commons cooperate with other Commons through the Commons Protocol while remaining politically and economically autonomous.

# Commons Evolution

A Commons is not a permanent administrative unit.

It is expected to evolve over time.

During the early adoption of the protocol, a Commons may cover a relatively large geographic area in order to create a viable local economy and overcome network effects.

As participation grows, larger Commons naturally divide into smaller autonomous Commons.

For example:

Australia

↓

Brisbane Commons

↓

South Brisbane Commons

West Brisbane Commons

North Brisbane Commons

↓

West End Commons

Toowong Commons

Indooroopilly Commons

The long term direction of the protocol is progressively smaller geographic Commons that remain economically viable.

Subdivision should occur only when both the local community and the local economy are capable of operating independently.

Migration into a newly established Commons should always be voluntary.

No central authority determines when a Commons must divide.

The exact protocol governing Commons subdivision remains a future area of design.

# Membership

Membership represents the relationship between a Participant and their Home Commons.

Every Participant has exactly one active Membership at a time.

Membership allows a Participant to participate in the Commons economy and governance.

A Membership may contain factual information such as:

* When the Participant joined.
* Whether the Membership is active.
* The Participant's Commons Balance.
* Completed Exchanges.
* Active Agreements.
* Active Disputes.

Membership does not grant additional political authority based upon wealth, contribution history, popularity, or Commons Balance.

Each Commons determines its own rules for:

* Joining.
* Leaving.
* Suspension.
* Removal.

Future versions of the protocol may support voluntary migration between Commons as new geographic Commons are established.

# Commons Balance

A Commons Balance represents the current reciprocal relationship between a Participant and their Home Commons.

It is not:

* Money.
* Currency.
* Wealth.
* A credit score.
* A reputation score.

A positive Commons Balance means the Participant has contributed more to their Home Commons than they have received from it.

A negative Commons Balance means the Participant has received more from their Home Commons than they have contributed back.

A defining interpretation is:

> The Commons collectively owes Alice roughly 100 units of future help.

A positive balance does not entitle Alice to any specific person's labour.

Other Participants remain free to accept or refuse her Requests.

They may choose to help because completing the exchange strengthens their own relationship with the Commons.

A Commons Balance is a measure of reciprocal contribution, not stored value.

## Balance Changes

When Bob completes work for Alice for an agreed value of 20 units:

* Bob's Commons Balance increases by 20.
* Alice's Commons Balance decreases by 20.

The Commons does not hold the 20 units.

No central account receives or transfers them.

The change records that Bob has contributed more to the Commons and Alice has received more from it.

## Balance Properties

A Commons Balance:

* Represents the relationship between one Participant and one Home Commons.
* Changes only through recognised Ledger entries.
* Cannot earn interest.
* Cannot produce passive income.
* Cannot grant political authority.
* Cannot grant additional voting rights.
* Cannot be converted directly into conventional money.
* Cannot be invested to generate more balance.
* Does not represent ownership of the Commons.
* Does not represent ownership of another person's labour.
* Cannot be transferred independently of the Participant.

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

An Exchange is not complete merely because one Participant claims that it is complete.

Completion normally requires confirmation from both Participants.

Most Exchanges occur within a Participant's Home Commons.

Future versions of the protocol will also support Cross Commons Exchanges between Participants belonging to different Commons.

The first application should focus on Exchanges between two Participants within the same Commons.

More complex Exchanges involving groups, organisations, or multiple Commons can be added later.

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

It provides a transparent history of the events that explain every Commons Balance.

The Ledger may record events such as:

* A Completed Exchange.
* A reversed Exchange.
* A Dispute outcome.
* A correction approved through a valid process.
* A future Cross Commons Exchange.

Every change to a Commons Balance should be traceable to one or more Ledger Entries.

A balance without an explainable Ledger history should not be trusted.

The Ledger is conceptually append only.

Past entries should never be silently changed or deleted.

When a correction is necessary, a new Ledger Entry records the correction while preserving the original history.

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

# Cross Commons Exchange

A Cross Commons Exchange is a voluntary exchange between Participants belonging to different Home Commons.

Cross Commons Exchanges require an active Reciprocity Agreement between the participating Commons.

Each Commons remains responsible only for its own Participants.

Neither Commons shares its Ledger or transfers ownership of its Commons Balances.

Instead, each Commons independently recognises the exchange according to the terms of the Reciprocity Agreement.

A Reciprocity Agreement may define:

* Which Participants may be guaranteed.
* Maximum outstanding obligations.
* Dispute procedures.
* Recognition rules.
* Temporary suspension of guarantees.
* Settlement of outstanding obligations between the Commons.

Cross Commons Exchanges do not require:

* A global Ledger.
* A central bank.
* A universal balance.
* A central authority.

Future protocol versions will define the detailed mechanics of Reciprocity Agreements.

Cross Commons Exchange remains outside the first application MVP.

# Commons Interoperability

Commons Interoperability allows independent Commons to cooperate while remaining politically and economically autonomous.

Interoperability is based on shared protocol rules rather than shared authority.

Commons remain free to decide:

* Whether to establish Reciprocity Agreements.
* Which Commons to cooperate with.
* Their own governance.
* Their own membership rules.
* Their own local economy.

Interoperability should not require:

* A central marketplace.
* A central bank.
* A central administrator.
* A global Ledger.
* Uniform governance.
* Uniform prices.

The protocol should define the minimum shared rules necessary for Commons to:

* Recognise one another.
* Establish Reciprocity Agreements.
* Verify exchanges.
* Resolve inter Commons disputes.
* Maintain secure communication.

Everything else remains under local control.

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
* Whether Reciprocity Agreements should be established, suspended, or terminated with other Commons.

Detailed governance remains outside the initial exchange application.

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
* Reciprocity Agreements.
* Cross Commons Exchanges.
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
* How should Reciprocity Agreements be negotiated?
* How should outstanding obligations between Commons be managed?
* How should guarantee limits be determined?
* Under what conditions should a Commons suspend or terminate a Reciprocity Agreement?
* What minimum protocol rules are required for Commons Interoperability?
* What should the accounting unit be called?

# Domain Principles

The domain model should preserve the following principles:

* Every exchange is voluntary.
* Prices emerge through negotiation.
* Participants may refuse any exchange.
* The protocol records value but does not set it.
* A Commons Balance records a relationship, not stored wealth.
* Every Participant belongs to one Home Commons.
* Each Commons is responsible only for its own Participants.
* Cross Commons cooperation occurs through voluntary Reciprocity Agreements.
* No global Ledger or central authority is required.
* No balance grants political authority.
* No balance grants ownership of another person's labour.
* Trust comes from factual participation rather than social scoring.
* Ledger changes must be explainable through traceable events.
* Commons remain locally autonomous.
* Temporary responsibility is preferred over permanent authority.
* The first application should remain simpler than the full protocol.
