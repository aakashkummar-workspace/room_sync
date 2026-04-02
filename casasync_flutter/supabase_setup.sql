-- =============================================
-- CasaSync Database Schema for Supabase
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member',
  room_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Rooms
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for profiles.room_id
ALTER TABLE profiles ADD CONSTRAINT fk_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL;

-- 3. Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT DEFAULT 'General',
  paid_by UUID REFERENCES profiles(id),
  paid_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Expense Splits
CREATE TABLE IF NOT EXISTS expense_splits (
  id SERIAL PRIMARY KEY,
  expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  user_name TEXT,
  amount DECIMAL(10,2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE
);

-- 5. Chores
CREATE TABLE IF NOT EXISTS chores (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assigned_to UUID REFERENCES profiles(id),
  assigned_to_name TEXT,
  created_by UUID REFERENCES profiles(id),
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  min_quantity INTEGER DEFAULT 3,
  category TEXT DEFAULT 'General',
  added_by UUID REFERENCES profiles(id),
  added_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Notes (sticky notes)
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  color TEXT DEFAULT 'yellow',
  created_by UUID REFERENCES profiles(id),
  author_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Messages
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  sender_name TEXT,
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. House Rules
CREATE TABLE IF NOT EXISTS house_rules (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  rule_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Notices (announcements)
CREATE TABLE IF NOT EXISTS notices (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  author TEXT,
  important BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Polls
CREATE TABLE IF NOT EXISTS polls (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  author TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Poll Options
CREATE TABLE IF NOT EXISTS poll_options (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes UUID[] DEFAULT '{}'
);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles in their room, update own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view room members" ON profiles FOR SELECT USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Rooms: members can read their room
CREATE POLICY "Members can view their room" ON rooms FOR SELECT USING (id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Anyone can create a room" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update room" ON rooms FOR UPDATE USING (created_by = auth.uid());

-- For all room-scoped tables, allow access if user is in the room
CREATE POLICY "Room members can view expenses" ON expenses FOR SELECT USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can insert expenses" ON expenses FOR INSERT WITH CHECK (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can delete expenses" ON expenses FOR DELETE USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Room members can view splits" ON expense_splits FOR SELECT USING (expense_id IN (SELECT id FROM expenses WHERE room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Room members can insert splits" ON expense_splits FOR INSERT WITH CHECK (true);
CREATE POLICY "Room members can update splits" ON expense_splits FOR UPDATE USING (true);

CREATE POLICY "Room members can view chores" ON chores FOR SELECT USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can insert chores" ON chores FOR INSERT WITH CHECK (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can update chores" ON chores FOR UPDATE USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can delete chores" ON chores FOR DELETE USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Room members can view inventory" ON inventory FOR SELECT USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can insert inventory" ON inventory FOR INSERT WITH CHECK (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can update inventory" ON inventory FOR UPDATE USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can delete inventory" ON inventory FOR DELETE USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Room members can view notes" ON notes FOR SELECT USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can insert notes" ON notes FOR INSERT WITH CHECK (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can update notes" ON notes FOR UPDATE USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can delete notes" ON notes FOR DELETE USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Room members can view messages" ON messages FOR SELECT USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can insert messages" ON messages FOR INSERT WITH CHECK (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can delete messages" ON messages FOR DELETE USING (sender_id = auth.uid());

CREATE POLICY "Room members can view rules" ON house_rules FOR SELECT USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can insert rules" ON house_rules FOR INSERT WITH CHECK (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can update rules" ON house_rules FOR UPDATE USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can delete rules" ON house_rules FOR DELETE USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Anyone can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Room members can view notices" ON notices FOR SELECT USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can insert notices" ON notices FOR INSERT WITH CHECK (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can delete notices" ON notices FOR DELETE USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Room members can view polls" ON polls FOR SELECT USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can insert polls" ON polls FOR INSERT WITH CHECK (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can update polls" ON polls FOR UPDATE USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Room members can delete polls" ON polls FOR DELETE USING (room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Room members can view poll options" ON poll_options FOR SELECT USING (poll_id IN (SELECT id FROM polls WHERE room_id IN (SELECT room_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Room members can insert poll options" ON poll_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Room members can update poll options" ON poll_options FOR UPDATE USING (true);

-- =============================================
-- Auto-create profile on signup trigger
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), NEW.email, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Storage bucket for avatars and message files
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('messages', 'messages', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload message files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'messages');
CREATE POLICY "Anyone can view message files" ON storage.objects FOR SELECT USING (bucket_id = 'messages');

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
