ALTER TABLE "Offers"
    DROP CONSTRAINT IF EXISTS "CK_Offers_CommonsAccountingUnits_Positive";

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'CK_Offers_CommonsAccountingUnits_Range'
          AND conrelid = '"Offers"'::regclass
    ) THEN
        ALTER TABLE "Offers"
            ADD CONSTRAINT "CK_Offers_CommonsAccountingUnits_Range"
            CHECK (
                "CommonsAccountingUnits" IS NULL
                OR (
                    "CommonsAccountingUnits" > 0
                    AND "CommonsAccountingUnits" <= 9007199254740991
                )
            );
    END IF;
END
$$;

ALTER TABLE "Agreements"
    DROP CONSTRAINT IF EXISTS "CK_Agreements_CommonsAccountingUnits_Positive";

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'CK_Agreements_CommonsAccountingUnits_Range'
          AND conrelid = '"Agreements"'::regclass
    ) THEN
        ALTER TABLE "Agreements"
            ADD CONSTRAINT "CK_Agreements_CommonsAccountingUnits_Range"
            CHECK (
                "CommonsAccountingUnits" IS NULL
                OR (
                    "CommonsAccountingUnits" > 0
                    AND "CommonsAccountingUnits" <= 9007199254740991
                )
            );
    END IF;
END
$$;
