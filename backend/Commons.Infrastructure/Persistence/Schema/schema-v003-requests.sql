CREATE TABLE IF NOT EXISTS "Requests" (
    "Id" uuid NOT NULL,
    "CreatorParticipantId" uuid NOT NULL,
    "HomeCommonsId" uuid NOT NULL,
    "Title" text NOT NULL,
    "Description" text NOT NULL,
    "Status" text NOT NULL,
    CONSTRAINT "PK_Requests" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Requests_Participants_CreatorParticipantId"
        FOREIGN KEY ("CreatorParticipantId") REFERENCES "Participants" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Requests_Commons_HomeCommonsId"
        FOREIGN KEY ("HomeCommonsId") REFERENCES "Commons" ("Id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "IX_Requests_CreatorParticipantId"
    ON "Requests" ("CreatorParticipantId");

CREATE INDEX IF NOT EXISTS "IX_Requests_HomeCommonsId"
    ON "Requests" ("HomeCommonsId");
