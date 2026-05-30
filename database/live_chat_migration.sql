-- Create live chat messages table for live classes
CREATE TABLE IF NOT EXISTS wombcare_live_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES wombcare_classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_role VARCHAR(50) CHECK (sender_role IN ('user', 'doctor', 'admin')) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Supabase Realtime for this table to broadcast inserts
ALTER PUBLICATION supabase_realtime ADD TABLE wombcare_live_chats;
