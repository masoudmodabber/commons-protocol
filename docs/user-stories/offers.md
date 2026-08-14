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

36. The complete flow must be usable through the React frontend.

37. The story is not complete if Offers can only be submitted through API calls, Postman, curl, or direct database access.

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

14. The complete flow must be usable through the React frontend.

15. The story is not complete if submitted Offers can only be viewed through API calls, Postman, curl, or direct database access.

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

14. The complete flow must be usable through the React frontend.

15. The story is not complete if Offers can only be withdrawn through API calls, Postman, curl, or direct database access.

---

## US 011 View and Compare Offers

As a participant

I want to view and compare the different Offers made on my Request

So that I can understand the proposed terms and choose the Offer that best suits me.

Offers may differ in Commons accounting units, requested Capability contributions, or combinations of both, and do not need to be directly comparable by a single numerical value.

---

## US 012 Accept an Offer

...