CREATE TABLE IF NOT EXISTS "Offers" (
    "Id" uuid NOT NULL,
    "RequestId" uuid NOT NULL,
    "CreatorParticipantId" uuid NOT NULL,
    "CommonsAccountingUnits" bigint NULL,
    CONSTRAINT "PK_Offers" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Offers_Requests_RequestId"
        FOREIGN KEY ("RequestId") REFERENCES "Requests" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Offers_Participants_CreatorParticipantId"
        FOREIGN KEY ("CreatorParticipantId") REFERENCES "Participants" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "CK_Offers_CommonsAccountingUnits_Positive"
        CHECK ("CommonsAccountingUnits" IS NULL OR "CommonsAccountingUnits" > 0)
);

CREATE INDEX IF NOT EXISTS "IX_Offers_RequestId"
    ON "Offers" ("RequestId");

CREATE INDEX IF NOT EXISTS "IX_Offers_CreatorParticipantId"
    ON "Offers" ("CreatorParticipantId");

CREATE TABLE IF NOT EXISTS "OfferRequestedContributions" (
    "Id" uuid NOT NULL,
    "OfferId" uuid NOT NULL,
    "CapabilityId" uuid NOT NULL,
    "CapabilityTextSnapshot" text NOT NULL,
    "Description" text NOT NULL,
    CONSTRAINT "PK_OfferRequestedContributions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_OfferRequestedContributions_Offers_OfferId"
        FOREIGN KEY ("OfferId") REFERENCES "Offers" ("Id") ON DELETE CASCADE,
    CONSTRAINT "AK_OfferRequestedContributions_OfferId_CapabilityId"
        UNIQUE ("OfferId", "CapabilityId")
);
