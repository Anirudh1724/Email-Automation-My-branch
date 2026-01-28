-- Make campaign_id nullable in leads table
ALTER TABLE "public"."leads" ALTER COLUMN "campaign_id" DROP NOT NULL;