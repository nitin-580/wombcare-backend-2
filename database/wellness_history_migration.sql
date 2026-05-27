-- ==========================================
-- Migration: Add Sleep and Journal Columns to User Profiles and Daily History
-- Description: Ensures active user profiles and daily archives can natively
--              store and synchronize sleep hours and journal notes.
-- ==========================================

-- 1. Add columns to active profiles table
ALTER TABLE wombcare_user_profiles 
    ADD COLUMN IF NOT EXISTS journal TEXT,
    ADD COLUMN IF NOT EXISTS sleep NUMERIC DEFAULT 0 NOT NULL;

-- 2. Add columns to daily history table
ALTER TABLE wombcare_user_profile_history 
    ADD COLUMN IF NOT EXISTS journal TEXT;
