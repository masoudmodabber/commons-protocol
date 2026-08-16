# Epic: Offers

> Working Draft

## US 008 Submit an Offer

As a participant

I want to submit an Offer in response to an Available Request

So that I can propose what I will provide and what I want in return.

### Acceptance Criteria

1. Only an authenticated Participant can submit an Offer.

2. An Offer can be submitted only for an Open Request that is visible to the Participant through Available Requests.

3. A Participant cannot submit an Offer on their own Request.

4. The Offer identifies the Request it belongs to and the Participant who created the Offer.

5. The Participant may request Commons accounting units as part of the Offer.

6. Commons accounting units are optional.

7. If Commons accounting units are included, the value must be a positive whole number.

8. Decimal Commons accounting values are not allowed.

9. Negative Commons accounting values are not allowed.

10. If Commons accounting units are not included, the Offer may still be valid when it contains at least one requested non unit contribution.

11. The Participant may request zero or more non unit contributions as part of the Offer.

12. An Offer may combine Commons accounting units and multiple non unit contributions.

13. At least one form of return must be requested. An Offer with no Commons accounting units and no requested contributions is rejected.

14. Each non unit requested contribution must reference one of the current Capabilities listed by the Participant who created the Request.

15. The Offer creator cannot add an arbitrary non unit contribution that is not based on one of the Request creator's Capabilities.

16. The same Capability may appear at most once in a single Offer.

17. For every selected Capability, the Offer stores the Capability identifier.

18. For every selected Capability, the Offer also stores a snapshot of the Capability text as it appeared when the Offer was submitted.

19. Changing or removing the original Capability later does not change the Capability text stored in an existing Offer.

20. Every selected Capability requires a description explaining what is being requested.

21. The description is entered as free text.

22. The description is trimmed before being saved.

23. Empty or whitespace only contribution descriptions are rejected.

24. The description may express details appropriate to the Capability.

For example:

* Capability: Eggs  
  Description: `20 eggs`

* Capability: Transport  
  Description: `Drive me from Southport to Brisbane Airport on Saturday morning`

* Capability: Gardening  
  Description: `About two hours helping me clear weeds`

25. Commons accounting units may be used without any non unit contribution.

26. Non unit contributions may be used without Commons accounting units.

27. Commons accounting units and non unit contributions may be combined in the same Offer.

28. Submitting an Offer does not immediately change either Participant's Commons Balance.

29. Submitting an Offer does not create an Agreement, Exchange, Ledger Entry, or Completed Exchange.

30. Submitting an Offer does not create an obligation for the Request creator to accept it.

31. The Request creator's current Capabilities used when constructing the Offer must be obtained from trusted server side state rather than accepted from the client as authoritative.

32. A Participant must not be able to reference another Participant's Capability when submitting an Offer for a Request.

33. A Participant must not be able to submit an Offer for a Request in another Commons by changing a Request identifier or other client supplied value.

34. After submission, the Participant can view the Offer they submitted and the terms they proposed.

35. Accepting, rejecting, withdrawing, comparing, or negotiating Offers is not part of this story.

---

## US 009 View my Offers

As a participant

I want to view the Offers I have submitted

So that I can keep track of the proposals I have made.

### Acceptance Criteria

1. Only an authenticated Participant can view their submitted Offers.

2. The Participant can view a list of Offers they have created.

3. The list contains only Offers created by the authenticated Participant.

4. Offers created by other Participants are not included.

5. Each listed Offer shows enough information to identify the Request it belongs to.

6. Each listed Offer shows the Commons accounting units requested, when included.

7. Each listed Offer shows the requested Capability contributions, when included.

8. Each requested Capability contribution shows the stored Capability text snapshot and description.

9. The Participant can open an Offer from the list and view its existing Offer detail.

10. A Participant cannot view another Participant's Offer by changing an Offer identifier or other client supplied value.

11. The Offer creator identity must be resolved from trusted server side state.

12. Viewing submitted Offers does not modify the Offer.

13. Viewing submitted Offers does not create an Agreement, Exchange, Ledger Entry, Completed Exchange, or Commons Balance change.

---

## US 010 Withdraw an Offer

As a participant

I want to withdraw an Offer I submitted

So that I can indicate that I no longer want to proceed with that proposal.

### Acceptance Criteria

1. Only the Participant who created an Offer can withdraw it.

2. An Offer can be withdrawn only while its status is Active.

3. Withdrawing an Offer changes its status from Active to Withdrawn.

4. Withdrawing an Offer does not delete it.

5. A withdrawn Offer remains visible to its creator in My Offers.

6. The stored Commons accounting units, requested Capability contributions, Capability snapshots, descriptions, Request reference, and creator are not changed by withdrawal.

7. A withdrawn Offer cannot return to Active.

8. A withdrawn Offer must not be treated as an active Offer on the Request.

9. A Participant cannot withdraw an Offer created by another Participant.

10. Attempting to withdraw an Offer that is already Withdrawn is rejected.

11. Attempting to withdraw any Offer whose status is not Active is rejected.

12. Withdrawing an Offer does not create an Agreement, Exchange, Ledger Entry, Completed Exchange, or Commons Balance change.

13. After withdrawal, the Participant can view the Offer with its Withdrawn status.

---

## US 011 View and Compare Offers

As a participant

I want to view and compare the different Offers made on my Request

So that I can understand the proposed terms and choose the Offer that best suits me.

Offers may differ in Commons accounting units, requested Capability contributions, or combinations of both, and do not need to be directly comparable by a single numerical value.

### Acceptance Criteria

1. Only an authenticated Participant can view Offers submitted on their own Requests.

2. A Participant can view Offers only for Requests they created.

3. A Participant cannot view Offers submitted on another Participant's Request by changing a Request identifier or other client supplied value.

4. The Request creator can open one of their Requests and view the Active Offers submitted for it.

5. Withdrawn Offers are not included in the active Offer comparison list.

6. Each Offer identifies the Participant who submitted it.

7. Each Offer shows the Commons accounting units requested, when included.

8. Each Offer shows every requested Capability contribution, when included.

9. Each requested Capability contribution shows the stored Capability text snapshot and stored description.

10. Historical Offer terms must be displayed from the stored Offer data and Capability snapshot rather than from the current live Capability.

11. Offers may contain Commons accounting units only.

12. Offers may contain requested Capability contributions only.

13. Offers may contain both Commons accounting units and requested Capability contributions.

14. The application must not calculate or display a single score, ranking, recommended Offer, recommended price, or preferred Offer.

15. The application must not assume that Offers are numerically comparable.

16. The Request creator may inspect the terms of each Active Offer.

17. Viewing or comparing Offers does not modify the Request or any Offer.

18. Viewing or comparing Offers does not create an Agreement, Exchange, Ledger Entry, Completed Exchange, or Commons Balance change.

19. Accepting or rejecting an Offer is not part of this story.

20. Negotiating an Offer is not part of this story.

21. The authenticated Participant identity and ownership of the Request must be resolved from trusted server side state.

22. Request ownership must not be accepted from the client as authoritative.

---

## US 012 Accept an Offer

As a participant

I want to accept one of the Active Offers made on my Request

So that the selected proposal becomes a mutual Agreement between me and the Offer creator.

### Acceptance Criteria

1. Only an authenticated Participant can accept an Offer.

2. Only the Participant who created the Request associated with the Offer can accept that Offer.

3. Only an Active Offer can be accepted.

4. A Withdrawn Offer cannot be accepted.

5. A Closed Offer cannot be accepted.

6. A Participant cannot accept an Offer belonging to another Participant's Request by changing an Offer identifier, Request identifier, or other client supplied value.

7. Accepting an Offer changes the selected Offer status from Active to Accepted.

8. Accepting an Offer changes every other Active Offer on the same Request to Closed.

9. Offers that are already Withdrawn remain Withdrawn.

10. Closed Offers remain stored and are not deleted.

11. The Request is no longer available for new Offers after an Offer has been accepted.

12. The Request status changes from Open to Matched when an Offer is accepted.

13. Only one Offer may be Accepted for a Request.

14. Once a Request has an Accepted Offer, another Offer for that Request cannot also be accepted.

15. Accepting an Offer creates an Agreement between:
    * the Participant who created the Request
    * the Participant who created the accepted Offer

16. The Agreement identifies:
    * the Request
    * the accepted Offer
    * the Request creator
    * the Offer creator

17. The Agreement records the terms that were accepted.

18. The Agreement includes the accepted Commons accounting units when the Offer contains them.

19. The Agreement includes every accepted non unit contribution when the Offer contains them.

20. Each accepted non unit contribution preserves the Capability text snapshot and description stored in the accepted Offer.

21. The Agreement must not derive historical terms from the current live Capability.

22. Accepting an Offer does not immediately change either Participant's Commons Balance.

23. Accepting an Offer does not create a Ledger Entry.

24. Accepting an Offer does not create a Completed Exchange.

25. Accepting an Offer does not mean that the agreed work, goods, services, or other contributions have already been delivered.

26. The Request creator can view the resulting Agreement after acceptance.

27. The Offer creator can view the resulting Agreement after acceptance.

28. A Participant who is not part of the Agreement cannot view it by changing an Agreement identifier or other client supplied value.

29. Request ownership, Offer ownership, Offer status, and Participant identity must be obtained from trusted server side state.

30. The client must not be able to choose the accepted Offer status, Request status, Agreement participants, or authoritative Agreement terms.

31. Accepting an Offer must be performed as one consistent operation. The system must not leave the Request Matched while the Offer remains Active, or create an Agreement while the corresponding status transitions fail.

32. Negotiating or modifying Agreement terms after acceptance is not part of this story.

33. Completing the Exchange is not part of this story.

34. Cancelling or terminating an Agreement is not part of this story.

35. Dispute handling is not part of this story.