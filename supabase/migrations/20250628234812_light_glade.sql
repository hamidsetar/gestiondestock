/*
  # Ajout de la table des paiements

  1. Nouvelle Table
    - `payments` - Paiements pour compléter les dettes
      - `id` (uuid, primary key)
      - `transaction_id` (uuid) - ID de la vente ou location
      - `transaction_type` (text) - 'sale' ou 'rental'
      - `amount` (decimal) - Montant du paiement
      - `payment_method` (text) - Mode de paiement
      - `created_by` (text) - Utilisateur qui a enregistré le paiement
      - `created_at` (timestamp)

  2. Sécurité
    - Enable RLS sur la table payments
    - Politique pour permettre toutes les opérations

  3. Index
    - Index sur transaction_id pour les requêtes rapides
    - Index sur created_at pour les rapports
*/

-- La table payments existe déjà, on vérifie juste qu'elle a la bonne structure
-- Si elle n'existe pas, on la crée
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('sale', 'rental')),
  amount decimal(10,2) NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer')),
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS si pas déjà fait
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "Allow all operations on payments" ON payments;

-- Créer une nouvelle politique permissive
CREATE POLICY "Allow all operations on payments"
  ON payments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_type ON payments(transaction_type);