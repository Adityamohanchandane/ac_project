/*
  # Create Complaints Table

  1. New Tables
    - `complaints`
      - `id` (uuid, primary key)
      - `complaint_id` (text, unique - auto-generated)
      - `user_id` (uuid, foreign key)
      - `title` (text)
      - `category` (text)
      - `incident_date` (date)
      - `location` (text)
      - `description` (text)
      - `evidence_file` (text, url)
      - `status` (text, default 'pending')
      - `police_remarks` (text)
      - `assigned_to` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `complaints` table
    - Users can only read own complaints
    - Police can read all complaints
*/

CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  category text NOT NULL,
  incident_date date NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  evidence_file text,
  status text DEFAULT 'pending',
  police_remarks text,
  assigned_to uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own complaints"
  ON complaints FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create complaints"
  ON complaints FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own complaints"
  ON complaints FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Police can read all complaints"
  ON complaints FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'police'
  ));

CREATE POLICY "Police can update complaints"
  ON complaints FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'police'
  ));

CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(category);