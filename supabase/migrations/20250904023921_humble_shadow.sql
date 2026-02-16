/*
  # Create company settings table

  1. New Tables
    - `company_settings`
      - `id` (uuid, primary key)
      - `company_name` (text)
      - `cnpj` (text, unique)
      - `address` (text)
      - `neighborhood` (text)
      - `city` (text)
      - `state` (text)
      - `zip_code` (text)
      - `phone` (text)
      - `whatsapp` (text)
      - `email` (text, unique)
      - `logo` (text, base64 or URL)
      - `email_settings` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `company_settings` table
    - Add policy for authenticated users to read and manage settings
*/

CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  cnpj text UNIQUE NOT NULL,
  address text DEFAULT '',
  neighborhood text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  zip_code text DEFAULT '',
  phone text NOT NULL,
  whatsapp text DEFAULT '',
  email text UNIQUE NOT NULL,
  logo text DEFAULT '',
  email_settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read company settings"
  ON company_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage company settings"
  ON company_settings
  FOR ALL
  TO authenticated
  USING (true);