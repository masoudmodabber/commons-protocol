# MVP Scope

> Working Draft

## Purpose

This document defines the intended scope of the first implementation of the Commons Protocol.

The goal of the MVP is not to implement the complete protocol, but to validate its core hypothesis using the smallest useful feature set.

---

# MVP Domain Scope

The first version should test the narrowest useful form of the Commons Protocol.

The MVP should include:

* Participants.
* Commons.
* Memberships.
* Participant Capabilities describing what a Participant can provide.
* Commons Balances.
* Requests.
* Offers.
* Direct exchange Offers.
* Commons Balance Offers.
* Negotiation.
* Agreements.
* Completion confirmation.
* Completed Exchanges.
* Ledger Entries for recognised Commons Balance changes.
* Basic Profiles.

The MVP should allow a Participant to list goods, services, skills, resources, or other contributions they may be able to provide.

These Capabilities are discoverable information only.

They are not standing Offers, prices, statements of current availability, or obligations to trade.

When responding to a Request, a Participant may propose what they want in return.

For example, an Offer may request Commons accounting units or a direct contribution such as goods or services.

The requester remains free to accept, reject, or negotiate any Offer.

The application should not currently suggest exchange values based on historical exchanges.

The MVP may initially exclude:

* Historical value suggestions or pricing guidance.
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

> Can a community coordinate everyday voluntary exchange through direct reciprocity and a shared reciprocal Ledger instead of relying entirely on conventional money?

# MVP Client Scope

The first Commons Market implementation supports three participant client platforms:

* Android.
* iOS.
* Web.

Android and iOS are the primary participant interfaces.

The web client remains a fully supported interface.

Android and iOS are implemented from a shared React Native and Expo mobile codebase.

The web client remains the existing React application.

All participant facing MVP capabilities should be usable through Android, iOS, and web unless a user story explicitly documents a justified platform exception.

Functional consistency does not require identical user interfaces.

Each client may use interaction patterns appropriate to its platform while producing the same protocol outcomes and enforcing the same Domain rules.

All clients communicate with the same backend API.

The client used by a Participant must not change:

* Participant identity.
* Home Commons rules.
* Request behaviour.
* Offer behaviour.
* Agreement behaviour.
* Exchange behaviour.
* Commons Balance behaviour.
* Ledger behaviour.
* Authorization rules.

The initial mobile implementation does not automatically require:

* Offline operation.
* Background synchronisation.
* Device location access.
* Camera access.
* Contact access.
* Biometric authentication.
* Platform specific widgets.
* Platform specific features that are not required by an existing user story.

These capabilities may be introduced later when they provide a clear benefit or are required by a user story.

Notification delivery will be designed as part of the Notifications epic rather than being assumed as part of the initial mobile client foundation.

Production Android distribution should target Google Play.

Production iOS distribution should target the Apple App Store.

Development and prerelease distribution may use appropriate internal Android distribution and Apple TestFlight.