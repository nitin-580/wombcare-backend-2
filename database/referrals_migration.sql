-- ==========================================
-- Migration: Add Referrals Table and referred_id to Patients
-- Description: Creates referrals table and alters patients table.
-- ==========================================

-- 1. Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    problem TEXT,
    doctor_id UUID NOT NULL,
    doctor_referral_code VARCHAR(100),
    referral_status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- pending, contacted, converted, rejected, inactive
    converted_patient_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add referred_id to patients table referencing referrals
ALTER TABLE patients 
    ADD COLUMN IF NOT EXISTS referred_id UUID REFERENCES referrals(id) ON DELETE SET NULL;
