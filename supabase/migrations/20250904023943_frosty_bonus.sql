/*
  # Create orders table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `quote_id` (uuid, foreign key to quotes, nullable)
      - `client_id` (uuid, foreign key to clients)
      - `number` (text, unique)
      - `services` (jsonb, array of services)
      - `products` (jsonb, array of products)
      - `total` (decimal)
      - `status` (text, pending/in_progress/completed/cancelled)
      - `created_at` (timestamp)
      - `completed_at` (timestamp, nullable)
      - `is_from_quote` (boolean, default false)

  2. Security
    - Enable RLS on `orders` table
    - Add policies for authenticated users to read and manage orders
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  number text UNIQUE NOT NULL,
  services jsonb DEFAULT '[]',
  products jsonb DEFAULT '[]',
  total decimal(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  is_from_quote boolean DEFAULT false
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (true);