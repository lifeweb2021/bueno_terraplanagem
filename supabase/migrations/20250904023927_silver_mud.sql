/*
  # Create states and cities tables

  1. New Tables
    - `states`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `code` (text, unique, 2 characters)
      - `created_at` (timestamp)
    
    - `cities`
      - `id` (uuid, primary key)
      - `name` (text)
      - `state_id` (uuid, foreign key to states)
      - `created_at` (timestamp)
      - Unique constraint on (name, state_id)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read and manage locations
*/

CREATE TABLE IF NOT EXISTS states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text UNIQUE NOT NULL CHECK (length(code) = 2),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state_id uuid NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, state_id)
);

ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read states"
  ON states
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage states"
  ON states
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read cities"
  ON cities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage cities"
  ON cities
  FOR ALL
  TO authenticated
  USING (true);