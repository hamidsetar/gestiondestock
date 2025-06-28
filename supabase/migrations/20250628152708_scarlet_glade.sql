/*
  # Alimenter la base de données avec des données de test

  1. Données ajoutées
    - 2 utilisateurs agents supplémentaires
    - 10 produits de vêtements avec codes-barres
    - 8 clients avec informations complètes
    - 3 ventes d'exemple (payée, partielle, avec réduction)
    - 4 locations d'exemple (réservée, active, retournée, en retard)

  2. Fonctionnalités testables
    - Recherche par code-barres
    - Gestion des stocks
    - Calculs automatiques
    - Différents statuts de transactions
*/

-- Insérer des utilisateurs de test
INSERT INTO users (id, username, password, role, first_name, last_name, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'agent1', 'agent123', 'agent', 'Marie', 'Dupont', now()),
('550e8400-e29b-41d4-a716-446655440002', 'agent2', 'agent123', 'agent', 'Ahmed', 'Benali', now());

-- Insérer des produits de test
INSERT INTO products (id, name, category, size, color, barcode, price, rental_price, stock, created_at) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Robe de Soirée Élégante', 'Robes', 'M', 'Noir', '1234567890123', 1200.00, 150.00, 5, now()),
('650e8400-e29b-41d4-a716-446655440002', 'Costume Homme Classique', 'Costumes', 'L', 'Bleu Marine', '1234567890124', 2500.00, 200.00, 3, now()),
('650e8400-e29b-41d4-a716-446655440003', 'Robe de Mariée Princesse', 'Robes de Mariée', 'S', 'Blanc', '1234567890125', 5000.00, 500.00, 2, now()),
('650e8400-e29b-41d4-a716-446655440004', 'Smoking Homme', 'Costumes', 'XL', 'Noir', '1234567890126', 3000.00, 250.00, 4, now()),
('650e8400-e29b-41d4-a716-446655440005', 'Robe Cocktail Rouge', 'Robes', 'M', 'Rouge', '1234567890127', 800.00, 100.00, 6, now()),
('650e8400-e29b-41d4-a716-446655440006', 'Costume Cérémonie Enfant', 'Enfants', '10 ans', 'Gris', '1234567890128', 600.00, 80.00, 8, now()),
('650e8400-e29b-41d4-a716-446655440007', 'Robe de Soirée Paillettes', 'Robes', 'L', 'Doré', '1234567890129', 1500.00, 180.00, 3, now()),
('650e8400-e29b-41d4-a716-446655440008', 'Costume Trois Pièces', 'Costumes', 'M', 'Charbon', '1234567890130', 2800.00, 220.00, 2, now()),
('650e8400-e29b-41d4-a716-446655440009', 'Robe Demoiselle d''Honneur', 'Robes', 'S', 'Rose Poudré', '1234567890131', 700.00, 90.00, 7, now()),
('650e8400-e29b-41d4-a716-446655440010', 'Accessoires Mariage Complet', 'Accessoires', 'Unique', 'Blanc', '1234567890132', 400.00, 50.00, 10, now());

-- Insérer des clients de test
INSERT INTO clients (id, first_name, last_name, phone, email, address, created_at) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'Fatima', 'El Amrani', '+212 6 12 34 56 78', 'fatima.elamrani@email.com', '123 Rue Hassan II, Casablanca', now()),
('750e8400-e29b-41d4-a716-446655440002', 'Youssef', 'Benjelloun', '+212 6 23 45 67 89', 'youssef.benjelloun@email.com', '456 Avenue Mohammed V, Rabat', now()),
('750e8400-e29b-41d4-a716-446655440003', 'Aicha', 'Tazi', '+212 6 34 56 78 90', 'aicha.tazi@email.com', '789 Boulevard Zerktouni, Casablanca', now()),
('750e8400-e29b-41d4-a716-446655440004', 'Omar', 'Alaoui', '+212 6 45 67 89 01', 'omar.alaoui@email.com', '321 Rue de la Liberté, Marrakech', now()),
('750e8400-e29b-41d4-a716-446655440005', 'Khadija', 'Benkirane', '+212 6 56 78 90 12', 'khadija.benkirane@email.com', '654 Avenue des FAR, Fès', now()),
('750e8400-e29b-41d4-a716-446655440006', 'Rachid', 'Chraibi', '+212 6 67 89 01 23', 'rachid.chraibi@email.com', '987 Rue Allal Ben Abdellah, Salé', now()),
('750e8400-e29b-41d4-a716-446655440007', 'Nadia', 'Fassi', '+212 6 78 90 12 34', 'nadia.fassi@email.com', '147 Boulevard Moulay Youssef, Casablanca', now()),
('750e8400-e29b-41d4-a716-446655440008', 'Karim', 'Idrissi', '+212 6 89 01 23 45', 'karim.idrissi@email.com', '258 Avenue Lalla Yacout, Casablanca', now());

-- Insérer des ventes de test
INSERT INTO sales (id, client_id, product_id, quantity, unit_price, discount, total_amount, paid_amount, remaining_amount, status, created_by, created_at) VALUES
('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 1, 1200.00, 100.00, 1100.00, 1100.00, 0.00, 'paid', 'Marie Dupont', now() - interval '2 days'),
('850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 1, 2500.00, 0.00, 2500.00, 1000.00, 1500.00, 'partial', 'Ahmed Benali', now() - interval '1 day'),
('850e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440005', 2, 800.00, 50.00, 1550.00, 1550.00, 0.00, 'paid', 'Admin User', now());

-- Insérer des locations de test
INSERT INTO rentals (id, client_id, product_id, quantity, daily_rate, start_date, end_date, total_amount, paid_amount, remaining_amount, deposit, status, created_by, created_at) VALUES
('950e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440003', 1, 500.00, current_date + interval '7 days', current_date + interval '10 days', 1500.00, 1500.00, 0.00, 1000.00, 'reserved', 'Marie Dupont', now()),
('950e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440004', 1, 250.00, current_date - interval '5 days', current_date - interval '2 days', 750.00, 500.00, 250.00, 500.00, 'returned', 'Ahmed Benali', now() - interval '5 days'),
('950e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440007', 1, 180.00, current_date - interval '3 days', current_date + interval '2 days', 900.00, 600.00, 300.00, 300.00, 'active', 'Admin User', now() - interval '3 days'),
('950e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440009', 2, 90.00, current_date - interval '10 days', current_date - interval '5 days', 900.00, 400.00, 500.00, 200.00, 'active', 'Marie Dupont', now() - interval '10 days');

-- Mettre à jour les stocks des produits vendus/loués
UPDATE products SET stock = stock - 1 WHERE id = '650e8400-e29b-41d4-a716-446655440001'; -- Robe vendue
UPDATE products SET stock = stock - 1 WHERE id = '650e8400-e29b-41d4-a716-446655440002'; -- Costume vendu (partiel)
UPDATE products SET stock = stock - 2 WHERE id = '650e8400-e29b-41d4-a716-446655440005'; -- 2 robes vendues
UPDATE products SET stock = stock - 1 WHERE id = '650e8400-e29b-41d4-a716-446655440003'; -- Robe de mariée réservée
UPDATE products SET stock = stock - 1 WHERE id = '650e8400-e29b-41d4-a716-446655440007'; -- Robe en location active
UPDATE products SET stock = stock - 2 WHERE id = '650e8400-e29b-41d4-a716-446655440009'; -- 2 robes en location (en retard)