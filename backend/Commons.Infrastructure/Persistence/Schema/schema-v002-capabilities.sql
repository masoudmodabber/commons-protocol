CREATE TABLE IF NOT EXISTS "Capabilities" (
    "Id" uuid NOT NULL,
    "ParticipantId" uuid NOT NULL,
    "Text" text NOT NULL,
    "NormalizedText" text NOT NULL,
    CONSTRAINT "PK_Capabilities" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Capabilities_Participants_ParticipantId"
        FOREIGN KEY ("ParticipantId") REFERENCES "Participants" ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Capabilities_ParticipantId_NormalizedText"
    ON "Capabilities" ("ParticipantId", "NormalizedText");
