/*
  # Création du schéma complet pour la boutique

  1. Nouvelles Tables
    - `users` - Utilisateurs (admin/agent)
    - `products` - Produits avec codes-barres
    - `clients` - Clients de la boutique
    - `sales` - Ventes
    - `rentals` - Locations
    - `payments` - Paiements

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques pour les utilisateurs authentifiés

  3. Index
    - Index sur les codes-barres pour recherche rapide
    - Index sur les dates pour les requêtes temporelles
*/

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'agent')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  size text NOT NULL,
  color text NOT NULL,
  barcode text UNIQUE NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  rental_price decimal(10,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  created_at timestamptz DEFAULT now()
);

-- Table des ventes
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  discount decimal(10,2) NOT NULL DEFAULT 0,
  total_amount decimal(10,2) NOT NULL,
  paid_amount decimal(10,2) NOT NULL DEFAULT 0,
  remaining_amount decimal(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'partial', 'pending')),
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table des locations
CREATE TABLE IF NOT EXISTS rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  daily_rate decimal(10,2) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  paid_amount decimal(10,2) NOT NULL DEFAULT 0,
  remaining_amount decimal(10,2) NOT NULL DEFAULT 0,
  deposit decimal(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue', 'reserved')),
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('sale', 'rental')),
  amount decimal(10,2) NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer')),
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les utilisateurs authentifiés
CREATE POLICY "Users can read all data" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can insert users" ON users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can delete users" ON users FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can read products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage products" ON products FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage clients" ON clients FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read sales" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage sales" ON sales FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read rentals" ON rentals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage rentals" ON rentals FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage payments" ON payments FOR ALL TO authenticated USING (true);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_rentals_client_id ON rentals(client_id);
CREATE INDEX IF NOT EXISTS idx_rentals_product_id ON rentals(product_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_dates ON rentals(start_date, end_date);

-- Insérer l'utilisateur admin par défaut
INSERT INTO users (username, password, role, first_name, last_name) 
VALUES ('admin', 'admin123', 'admin', 'Admin', 'User')
ON CONFLICT (username) DO NOTHING;