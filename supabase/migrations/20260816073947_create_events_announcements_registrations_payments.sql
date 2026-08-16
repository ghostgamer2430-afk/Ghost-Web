-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  location text NOT NULL DEFAULT '',
  capacity int NOT NULL DEFAULT 50,
  category text NOT NULL DEFAULT 'general',
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Event RSVPs table
CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  user_email text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'going',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_email)
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info',
  is_pinned boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Registration requests table
CREATE TABLE IF NOT EXISTS registration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  discord text,
  age int,
  character_name text,
  character_background text,
  experience text,
  why_join text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Payment history table
CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  user_email text NOT NULL DEFAULT '',
  item_name text NOT NULL DEFAULT '',
  item_type text NOT NULL DEFAULT 'membership',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  method text NOT NULL DEFAULT 'license_key',
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Events: anyone can read, authenticated can create/update/delete
CREATE POLICY "events_select_all" ON events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "events_insert_auth" ON events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "events_update_auth" ON events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "events_delete_auth" ON events FOR DELETE TO authenticated USING (true);

-- RSVPs: anyone can read, authenticated can manage their own
CREATE POLICY "rsvp_select_all" ON event_rsvps FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "rsvp_insert_own" ON event_rsvps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "rsvp_update_own" ON event_rsvps FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rsvp_delete_own" ON event_rsvps FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Announcements: anyone can read, authenticated can create/update/delete
CREATE POLICY "ann_select_all" ON announcements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ann_insert_auth" ON announcements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ann_update_auth" ON announcements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ann_delete_auth" ON announcements FOR DELETE TO authenticated USING (true);

-- Registration requests: anyone can create, authenticated can read/update
CREATE POLICY "reg_select_auth" ON registration_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "reg_insert_all" ON registration_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "reg_update_auth" ON registration_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "reg_delete_auth" ON registration_requests FOR DELETE TO authenticated USING (true);

-- Payment history: authenticated can read their own, admins can read all
CREATE POLICY "pay_select_own" ON payment_history FOR SELECT TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "pay_insert_auth" ON payment_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "pay_update_auth" ON payment_history FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pay_delete_auth" ON payment_history FOR DELETE TO authenticated USING (true);
