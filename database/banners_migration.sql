-- Create Banners Table
CREATE TABLE IF NOT EXISTS wombcare_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    target_url TEXT,
    position INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Initial Default Banners
INSERT INTO wombcare_banners (title, image_url, target_url, position, is_active)
VALUES
('Hormonal Balance Masterclass 🌸', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop', 'https://wombcare.in/classes/hormonal-wellness', 1, TRUE),
('Join PCOS Care Program ✨', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=600&auto=format&fit=crop', 'https://wombcare.in/pcos-care', 2, TRUE);
