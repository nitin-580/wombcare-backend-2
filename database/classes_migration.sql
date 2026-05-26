-- 1. Classes Categories Table
CREATE TABLE IF NOT EXISTS wombcare_classes_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default categories
INSERT INTO wombcare_classes_categories (name, slug) VALUES 
('Yoga', 'yoga'),
('Meditation', 'meditation'),
('PCOS Care', 'pcos-care'),
('Hormonal Wellness', 'hormonal-wellness'),
('Pregnancy Care', 'pregnancy-care'),
('Nutrition', 'nutrition'),
('Mental Wellness', 'mental-wellness'),
('Sleep Care', 'sleep-care')
ON CONFLICT (name) DO NOTHING;

-- 2. Wellness Classes Table
CREATE TABLE IF NOT EXISTS wombcare_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('live', 'recorded')) NOT NULL,
    thumbnail_url TEXT NOT NULL,
    video_url TEXT NOT NULL,
    youtube_video_id VARCHAR(50) NOT NULL,
    google_meet_link TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    instructor_name VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    category_id UUID REFERENCES wombcare_classes_categories(id) ON DELETE RESTRICT,
    is_featured BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Video Placements Table
CREATE TABLE IF NOT EXISTS wombcare_video_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label VARCHAR(50) CHECK (label IN ('Link 1', 'Link 2', 'Link 3', 'Link 4')) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    class_id UUID REFERENCES wombcare_classes(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Video Placements
INSERT INTO wombcare_video_placements (label, description) VALUES
('Link 1', 'Appears in Live Classes section'),
('Link 2', 'Appears in Classes page'),
('Link 3', 'Appears on Home dashboard'),
('Link 4', 'Appears in Featured Wellness section')
ON CONFLICT (label) DO NOTHING;

-- 4. Class Attendance Table
CREATE TABLE IF NOT EXISTS wombcare_class_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    class_id UUID REFERENCES wombcare_classes(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    left_at TIMESTAMP WITH TIME ZONE,
    watch_duration INTEGER DEFAULT 0 NOT NULL, -- in seconds
    completion_percentage INTEGER DEFAULT 0 NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    interaction_joined BOOLEAN DEFAULT FALSE NOT NULL, -- Google Meet joined
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, class_id)
);
