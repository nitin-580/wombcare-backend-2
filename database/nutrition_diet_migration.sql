-- Create foods library table
CREATE TABLE IF NOT EXISTS wombcare_foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    calories INTEGER NOT NULL,
    protein NUMERIC DEFAULT 0,
    carbs NUMERIC DEFAULT 0,
    fats NUMERIC DEFAULT 0,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create diet plans table
CREATE TABLE IF NOT EXISTS wombcare_diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references early_access_users(id)
    name TEXT NOT NULL,
    description TEXT,
    patient_age TEXT,
    patient_height TEXT,
    patient_weight TEXT,
    patient_goal TEXT,
    patient_diet TEXT,
    diet_data JSONB NOT NULL, -- 7-day schedule
    foods_to_avoid JSONB DEFAULT '[]'::jsonb,
    daily_targets JSONB DEFAULT '[]'::jsonb,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_wombcare_diet_plans_user_id ON wombcare_diet_plans(user_id);

-- Create meal logs table for tracking daily meals
CREATE TABLE IF NOT EXISTS wombcare_meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    diet_plan_id UUID NOT NULL REFERENCES wombcare_diet_plans(id) ON DELETE CASCADE,
    date DATE NOT NULL, -- 'YYYY-MM-DD'
    day INTEGER NOT NULL, -- 1 to 7
    meal_index INTEGER NOT NULL, -- index of meal inside DayDietPlan
    meal_name TEXT NOT NULL,
    status TEXT NOT NULL, -- 'completed', 'delayed', 'skipped'
    completion_time TIMESTAMP WITH TIME ZONE,
    daily_completion_percentage NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, date, day, meal_index)
);

CREATE INDEX IF NOT EXISTS idx_wombcare_meal_logs_user_date ON wombcare_meal_logs(user_id, date);

-- Insert seed data into wombcare_foods
INSERT INTO wombcare_foods (name, calories, protein, carbs, fats, category) VALUES
('Oatmeal with Almond Milk', 250, 8, 45, 5, 'Breakfast'),
('Scrambled Eggs (2) with Spinach', 180, 14, 2, 12, 'Breakfast'),
('Greek Yogurt with Berries & Honey', 200, 15, 20, 4, 'Breakfast'),
('Chia Seed Pudding', 180, 5, 18, 9, 'Breakfast'),
('Grilled Chicken Salad', 420, 35, 10, 22, 'Lunch'),
('Quinoa Salad with Chickpeas', 380, 12, 55, 10, 'Lunch'),
('Brown Rice with Mixed Dal & Paneer Sabji', 450, 18, 65, 12, 'Lunch'),
('Salmon with Broccoli & Sweet Potato', 520, 40, 30, 24, 'Dinner'),
('Tofu Stir Fry with Jasmine Rice', 400, 15, 50, 14, 'Dinner'),
('Boiled Eggs (2)', 140, 12, 1, 10, 'Snack'),
('Almonds (1 handful)', 160, 6, 6, 14, 'Snack'),
('Apple with Peanut Butter', 220, 4, 25, 12, 'Snack'),
('Green Tea with Lemon', 0, 0, 0, 0, 'Snack')
ON CONFLICT (name) DO NOTHING;
