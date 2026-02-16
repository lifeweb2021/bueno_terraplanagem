/*
  # Create quotes table

  1. New Tables
    - `quotes`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `number` (text, unique)
      - `services` (jsonb, array of services)
      - `products` (jsonb, array of products)
      - `subtotal` (decimal)
      - `discount` (decimal, default 0)
      - `total` (decimal)
      - `status` (text, draft/sent/approved/rejected)
      - `valid_until` (date)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `quotes` table
    - Add policies for authenticated users to read and manage quotes
*/

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  number text UNIQUE NOT NULL,
  services jsonb DEFAULT '[]',
  products jsonb DEFAULT '[]',
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  discount decimal(10,2) DEFAULT 0,
  total decimal(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected')),
  valid_until date NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read quotes"
  ON quotes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage quotes"
  ON quotes
  FOR ALL
  TO authenticated
  USING (true);