# Epic: Participant Management

> Working Draft

## US 001 Join a Commons and create my participant profile

As a person

I want to join an existing local Commons and create my participant profile

So that I can participate in the Commons Market.

### Acceptance Criteria

1. The person must be authenticated before joining a Commons.

2. The person selects one Commons from the available Commons.

3. Joining the Commons creates their Participant, Profile, and Membership.

4. A Participant cannot exist without a Home Commons.

5. A Participant requires a display name.

6. A Participant may include an optional short bio.

7. One authenticated user can have only one Participant identity.

8. A Participant must always have exactly one active Home Commons.

9. Creating a new Commons is not part of this story.

10. Capabilities are not part of this story.

11. After joining, the Participant can view their profile and Home Commons.

### Current MVP Constraint

A Participant cannot leave their Home Commons without joining another Commons.

Moving between Commons is not part of the MVP and will be designed later.

---

## US 002 Manage what I can provide

As a participant

I want to add, view, and remove descriptions of the goods, services, skills, resources, or assistance I may be able to provide

So that other participants can understand what I may be able to contribute to the Commons.

### Acceptance Criteria

1. A Participant can add multiple Capabilities to their profile.

2. Each Capability is entered as free text.

3. Capability text is trimmed before being saved.

4. Empty or whitespace only Capabilities are rejected.

5. A Participant cannot add the same Capability more than once using differences in letter casing or surrounding whitespace.

6. The original user entered Capability text is preserved for display.

7. A Participant can view all Capabilities currently listed on their profile.

8. A Participant can remove a Capability from their profile.

9. Listing a Capability does not create a standing Offer.

10. Listing a Capability does not indicate current availability.

11. Listing a Capability does not establish a price, quantity, or exchange value.

12. Listing a Capability does not create an obligation to respond to a Request or enter an Exchange.

13. Predefined Capability categories or a controlled taxonomy are not part of this story.

14. Autocomplete, recommendations, semantic matching, and intelligent Capability suggestions are not part of this story.