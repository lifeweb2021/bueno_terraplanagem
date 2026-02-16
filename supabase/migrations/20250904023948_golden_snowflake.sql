/*
  # Create counters table

  1. New Tables
    - `counters`
      - `id` (uuid, primary key)
      - `quote_counter` (integer, default 1)
      - `order_counter` (integer, default 1)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `counters` table
    - Add policies for authenticated users to read and manage counters
*/

CREATE TABLE IF NOT EXISTS counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_counter integer DEFAULT 1,
  order_counter integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read counters"
  ON counters
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage counters"
  ON counters
  FOR ALL
  TO authenticated
  USING (true);

-- Insert default counter record
INSERT INTO counters (quote_counter, order_counter) 
VALUES (1, 1)
ON CONFLICT DO NOTHING;