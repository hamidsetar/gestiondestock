/*
  # Ajout du prix d'achat aux produits

  1. Modifications
    - Ajouter la colonne `purchase_price` à la table `products`
    - Définir une valeur par défaut de 0
    - Rendre le champ obligatoire (NOT NULL)

  2. Sécurité
    - Aucune modification des politiques RLS existantes
    - La colonne hérite des mêmes permissions que la table
*/

-- Ajouter la colonne purchase_price à la table products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS purchase_price numeric(10,2) DEFAULT 0 NOT NULL;

-- Mettre à jour les produits existants avec une valeur par défaut
UPDATE products 
SET purchase_price = 0 
WHERE purchase_price IS NULL;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN products.purchase_price IS 'Prix d''achat du produit en DA';