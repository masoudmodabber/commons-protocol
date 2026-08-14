CREATE UNIQUE INDEX IF NOT EXISTS "IX_Offers_RequestId_Accepted"
    ON "Offers" ("RequestId")
    WHERE "Status" = 'Accepted';

CREATE TABLE IF NOT EXISTS "Agreements" (
    "Id" uuid NOT NULL,
    "RequestId" uuid NOT NULL,
    "AcceptedOfferId" uuid NOT NULL,
    "RequestCreatorParticipantId" uuid NOT NULL,
    "OfferCreatorParticipantId" uuid NOT NULL,
    "CommonsAccountingUnits" bigint NULL,
    CONSTRAINT "PK_Agreements" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Agreements_Requests_RequestId"
        FOREIGN KEY ("RequestId") REFERENCES "Requests" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Agreements_Offers_AcceptedOfferId"
        FOREIGN KEY ("AcceptedOfferId") REFERENCES "Offers" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Agreements_Participants_RequestCreatorParticipantId"
        FOREIGN KEY ("RequestCreatorParticipantId") REFERENCES "Participants" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Agreements_Participants_OfferCreatorParticipantId"
        FOREIGN KEY ("OfferCreatorParticipantId") REFERENCES "Participants" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "CK_Agreements_CommonsAccountingUnits_Positive"
        CHECK ("CommonsAccountingUnits" IS NULL OR "CommonsAccountingUnits" > 0),
    CONSTRAINT "AK_Agreements_RequestId" UNIQUE ("RequestId"),
    CONSTRAINT "AK_Agreements_AcceptedOfferId" UNIQUE ("AcceptedOfferId")
);

CREATE INDEX IF NOT EXISTS "IX_Agreements_RequestCreatorParticipantId"
    ON "Agreements" ("RequestCreatorParticipantId");

CREATE INDEX IF NOT EXISTS "IX_Agreements_OfferCreatorParticipantId"
    ON "Agreements" ("OfferCreatorParticipantId");

CREATE TABLE IF NOT EXISTS "AgreementRequestedContributions" (
    "Id" uuid NOT NULL,
    "AgreementId" uuid NOT NULL,
    "CapabilityId" uuid NOT NULL,
    "CapabilityTextSnapshot" text NOT NULL,
    "Description" text NOT NULL,
    CONSTRAINT "PK_AgreementRequestedContributions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AgreementRequestedContributions_Agreements_AgreementId"
        FOREIGN KEY ("AgreementId") REFERENCES "Agreements" ("Id") ON DELETE CASCADE,
    CONSTRAINT "AK_AgreementRequestedContributions_AgreementId_CapabilityId"
        UNIQUE ("AgreementId", "CapabilityId")
);
