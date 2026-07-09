-- Migration: Create WombCare Health Assessments Table
CREATE TABLE IF NOT EXISTS wombcare_health_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  city TEXT,
  height INTEGER NOT NULL,
  weight INTEGER NOT NULL,
  occupation TEXT,
  work_schedule TEXT,
  pcos TEXT NOT NULL,
  cycle_pattern TEXT[] NOT NULL,
  medications TEXT,
  thyroid TEXT,
  diabetes TEXT,
  htn TEXT,
  fatty_liver TEXT,
  vitamins TEXT[],
  other_conditions TEXT,
  diet TEXT,
  allergies TEXT,
  food_prefs TEXT,
  wake_time TEXT,
  bed_time TEXT,
  sleep_hours NUMERIC,
  water_intake NUMERIC,
  activity_level TEXT,
  daily_steps INTEGER,
  exercise_routine TEXT,
  stress_level INTEGER,
  goals TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE wombcare_health_assessments ENABLE ROW LEVEL SECURITY;

-- Allow select/insert for all
CREATE POLICY "Allow public insert" ON wombcare_health_assessments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin select" ON wombcare_health_assessments FOR SELECT USING (true);
