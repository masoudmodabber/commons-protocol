# Participants

> Working Draft

## Purpose

This document defines the participants and communities that make up the Commons Protocol.

It describes who participates in the protocol, how Commons are formed, how membership works, how reciprocal relationships are recorded, and how independent Commons cooperate.

It intentionally avoids implementation details such as databases, APIs, programming languages, authentication providers, and user interface design.

---

# Core Relationships

The protocol supports two kinds of voluntary exchange.

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

1. The exchange occurs under an active Reciprocity Agreement between the two Commons.
2. Each Commons independently recognises the completed exchange.
3. Each Commons updates the reciprocal relationship of its own Participant.
4. Any obligations between the Commons are managed according to their Reciprocity Agreement.

Both forms of exchange preserve voluntary participation while keeping every Commons autonomous.

---

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

---

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

Commons may voluntarily cooperate with other Commons through Reciprocity Agreements while remaining politically and economically autonomous.

Each Commons remains responsible only for its own Participants.

---

# Commons Evolution

A Commons is not a permanent administrative unit.

It is expected to evolve over time.

During the early adoption of the protocol, a Commons may cover a relatively large geographic area in order to create a viable local economy and overcome network effects.

As participation grows, larger Commons naturally divide into smaller autonomous geographic Commons.

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

Commons divide geographically rather than according to ideology, profession, or shared interests.

Migration into a newly established Commons should always be voluntary.

No central authority determines when a Commons must divide.

The exact protocol governing Commons subdivision remains a future area of design.

---

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

---

# Reciprocity Agreement

A Reciprocity Agreement is a voluntary agreement between two Commons that allows their Participants to exchange goods, services, and other voluntary contributions across Commons.

A Reciprocity Agreement does not merge the participating Commons.

Each Commons remains fully autonomous and responsible only for its own Participants.

A Reciprocity Agreement may define:

* Which Participants are covered.
* Recognition rules for Cross Commons Exchanges.
* Maximum outstanding obligations between the Commons.
* Dispute procedures.
* Settlement procedures.
* Conditions for suspension or termination.

Reciprocity Agreements are voluntary.

Any Commons may choose whether to establish, continue, suspend, or terminate an agreement with another Commons.

The detailed protocol remains a future area of design.

---

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
