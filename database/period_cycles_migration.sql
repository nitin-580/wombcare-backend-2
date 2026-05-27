-- ==========================================
-- Migration: Create WombCare Period History Table
-- Description: Stores structured entries for period cycles,
--              including start date, end date, custom symptoms,
--              and personal logs/notes.
-- ==========================================

CREATE TABLE IF NOT EXISTS wombcare_period_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    start_date VARCHAR(50) NOT NULL, -- Format: YYYY-MM-DD
    end_date VARCHAR(50) NOT NULL,   -- Format: YYYY-MM-DD
    symptoms JSONB DEFAULT '[]'::jsonb NOT NULL, -- Custom list of symptoms (e.g. Cramps, bloating)
    notes TEXT, -- Personal journal/well-being notes for this period cycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for efficient user retrieval
CREATE INDEX IF NOT EXISTS wombcare_period_history_user_idx 
    ON wombcare_period_history (user_id);

-- Index for date range query optimizations
CREATE INDEX IF NOT EXISTS wombcare_period_history_dates_idx 
    ON wombcare_period_history (start_date, end_date);
