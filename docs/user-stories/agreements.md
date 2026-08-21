# Epic: Agreements

> Working Draft

## US 013: View My Agreements

**As a** Participant  
**I want to** view the Agreements I am part of  
**So that** I can see the mutual commitments created from accepted Offers.

### Acceptance Criteria

1. A Participant can view a list of Agreements in which they are one of the two Participants.

2. Agreements that do not involve the authenticated Participant are not shown.

3. Each Agreement in the list shows:
   - the originating Request title
   - the other Participant
   - the accepted return terms

4. A Participant can open an Agreement from the list.

5. The Agreement shows:
   - the originating Request
   - both Participants
   - the accepted Offer terms
   - the accepted Commons accounting units, when applicable
   - the accepted direct contributions, when applicable

6. Direct contributions are shown using the snapshots stored when the Agreement was created. Changes to the original Capabilities do not change the Agreement.

7. Both Participants can view the Agreement and see the same agreed terms.

8. A Participant cannot view an Agreement they are not part of, including by directly supplying another Agreement's identifier.

9. Agreement access is authorized server-side using the authenticated account and its resolved Participant. Client-supplied Agreement or Participant identifiers are not sufficient to establish access.

10. Viewing an Agreement does not modify the Agreement, Request, Offer, Commons Balance, or Ledger.

11. This story does not introduce Agreement editing, status, fulfilment, completion, cancellation, renegotiation, messaging, disputes, or any new Agreement lifecycle behaviour.
