/*
  # Create clients table

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `type` (text, fisica or juridica)
      - `name` (text)
      - `document` (text, unique - CPF or CNPJ)
      - `email` (text, unique)
      - `phone` (text)
      - `address` (text)
      - `number` (text)
      - `neighborhood` (text)
      - `city` (text)
      - `state` (text)
      - `zip_code` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `clients` table
    - Add policies for authenticated users to read and manage clients
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('fisica', 'juridica')),
  name text NOT NULL,
  document text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  address text DEFAULT '',
  number text DEFAULT '',
  neighborhood text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  zip_code text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (true);