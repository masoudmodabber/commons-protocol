-- Development-only sample Commons for exercising the participant join flow.
-- Deterministic identifiers keep this seed safe to run on every startup.
INSERT INTO "Commons" ("Id", "Name")
VALUES
    ('9b32f250-5c6c-4d4d-bc7f-308bc871a7dd', 'Brisbane Commons'),
    ('0549db3c-a740-4d0f-b3bb-9d4f7efed14d', 'Gold Coast Commons'),
    ('fb228325-a78d-4215-9b67-4618b1fb8160', 'Sunshine Coast Commons')
ON CONFLICT ("Id") DO NOTHING;
