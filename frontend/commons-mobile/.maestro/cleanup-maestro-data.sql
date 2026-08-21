\set ON_ERROR_STOP on

BEGIN;

CREATE TEMP TABLE maestro_target_users ON COMMIT DROP AS
SELECT "Id"
FROM "AspNetUsers"
WHERE "Email" ~ '^maestro-[abc]-[0-9]+@example[.]test$'
  AND (
      :'acceptance_run_id' = ''
      OR "Email" IN (
          'maestro-a-' || :'acceptance_run_id' || '@example.test',
          'maestro-b-' || :'acceptance_run_id' || '@example.test',
          'maestro-c-' || :'acceptance_run_id' || '@example.test'
      )
  );

CREATE TEMP TABLE maestro_target_participants ON COMMIT DROP AS
SELECT "Id"
FROM "Participants"
WHERE "AuthenticatedUserId" IN (SELECT "Id" FROM maestro_target_users);

CREATE TEMP TABLE maestro_target_requests ON COMMIT DROP AS
SELECT "Id"
FROM "Requests"
WHERE "CreatorParticipantId" IN (SELECT "Id" FROM maestro_target_participants);

CREATE TEMP TABLE maestro_target_offers ON COMMIT DROP AS
SELECT "Id"
FROM "Offers"
WHERE "CreatorParticipantId" IN (SELECT "Id" FROM maestro_target_participants)
   OR "RequestId" IN (SELECT "Id" FROM maestro_target_requests);

DELETE FROM "Agreements"
WHERE "RequestCreatorParticipantId" IN (SELECT "Id" FROM maestro_target_participants)
   OR "OfferCreatorParticipantId" IN (SELECT "Id" FROM maestro_target_participants)
   OR "RequestId" IN (SELECT "Id" FROM maestro_target_requests)
   OR "AcceptedOfferId" IN (SELECT "Id" FROM maestro_target_offers);

DELETE FROM "Offers"
WHERE "Id" IN (SELECT "Id" FROM maestro_target_offers);

DELETE FROM "Requests"
WHERE "Id" IN (SELECT "Id" FROM maestro_target_requests);

DELETE FROM "Capabilities"
WHERE "ParticipantId" IN (SELECT "Id" FROM maestro_target_participants);

DELETE FROM "Memberships"
WHERE "ParticipantId" IN (SELECT "Id" FROM maestro_target_participants);

DELETE FROM "Profiles"
WHERE "ParticipantId" IN (SELECT "Id" FROM maestro_target_participants);

DELETE FROM "Participants"
WHERE "Id" IN (SELECT "Id" FROM maestro_target_participants);

DELETE FROM "AspNetUserTokens"
WHERE "UserId" IN (SELECT "Id" FROM maestro_target_users);

DELETE FROM "AspNetUserRoles"
WHERE "UserId" IN (SELECT "Id" FROM maestro_target_users);

DELETE FROM "AspNetUserLogins"
WHERE "UserId" IN (SELECT "Id" FROM maestro_target_users);

DELETE FROM "AspNetUserClaims"
WHERE "UserId" IN (SELECT "Id" FROM maestro_target_users);

DELETE FROM "AspNetUsers"
WHERE "Id" IN (SELECT "Id" FROM maestro_target_users);

DO $cleanup$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "AspNetUsers"
        WHERE "Id" IN (SELECT "Id" FROM maestro_target_users)
    ) THEN
        RAISE EXCEPTION 'Maestro acceptance accounts remain after cleanup';
    END IF;
END
$cleanup$;

COMMIT;
