# Epic: Requests

> Working Draft

## US 003 Create a Request

As a participant

I want to create a Request describing what I need

So that other participants in my Home Commons can offer to help.

### Acceptance Criteria

1. Only a Participant can create a Request.

2. A Request is created within the Participant's Home Commons.

3. The Participant does not choose a Commons when creating the Request.

4. A Request requires a title.

5. A Request requires a description.

6. Title and description are trimmed before being saved.

7. Empty or whitespace only titles are rejected.

8. Empty or whitespace only descriptions are rejected.

9. A newly created Request has an Open status.

10. The Request identifies the Participant who created it.

11. The Request does not require the requester to state what they will provide in return.

12. Creating a Request does not create an Offer, Agreement, Exchange, Ledger Entry, or Commons Balance change.

13. Creating a Request does not create an obligation for another Participant to respond.

14. After creation, the Participant can view the Request they created.

15. Browsing or discovering Requests created by other Participants is not part of this story.

16. The complete flow must be usable through the React frontend.

17. The story is not complete if Requests can only be created through API calls, Postman, curl, or direct database access.

---

## US 004 Edit a Request

As a participant

I want to edit a Request I created

So that I can correct or clarify what I need while the Request is still Open.

### Acceptance Criteria

1. Only the Participant who created a Request can edit it.

2. Only an Open Request can be edited.

3. The Participant can edit the Request title.

4. The Participant can edit the Request description.

5. Title and description are trimmed before being saved.

6. Empty or whitespace only titles are rejected.

7. Empty or whitespace only descriptions are rejected.

8. Editing a Request does not change its Home Commons.

9. Editing a Request does not change the Participant who created it.

10. Editing a Request does not change its status.

11. Editing a Request does not create an Offer, Agreement, Exchange, Ledger Entry, or Commons Balance change.

12. A Participant cannot edit a Request created by another Participant.

13. Editing Requests that are no longer Open is rejected.

14. After saving changes, the Participant can view the updated Request.

15. The complete flow must be usable through the React frontend.

16. The story is not complete if Requests can only be edited through API calls, Postman, curl, or direct database access.

---

## US 005 Cancel a Request

As a participant

I want to cancel a Request I created

So that other participants know I no longer need help with it.

### Acceptance Criteria

1. Only the Participant who created a Request can cancel it.

2. Only an Open Request can be cancelled.

3. Cancelling a Request changes its status from Open to Cancelled.

4. Cancelling a Request does not delete the Request.

5. The Request remains viewable by its creator after cancellation.

6. The Request title, description, creator, and Home Commons are not changed by cancellation.

7. Cancelling a Request does not create an Offer, Agreement, Exchange, Ledger Entry, or Commons Balance change.

8. A Participant cannot cancel a Request created by another Participant.

9. Attempting to cancel a Request that is no longer Open is rejected.

10. After cancellation, the Participant can view the Request with its Cancelled status.

11. Editing a Cancelled Request is not allowed.

12. The complete flow must be usable through the React frontend.

13. The story is not complete if Requests can only be cancelled through API calls, Postman, curl, or direct database access.

---

## US 006 Browse Requests

...

---

## US 007 Search Requests

...
