import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Configuration Supabase:');
console.log('URL:', supabaseUrl);
console.log('Key présente:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  throw new Error('Variables d\'environnement Supabase manquantes');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

// Test de connexion au démarrage
console.log('🔄 Test de connexion Supabase...');
supabase.from('users').select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error('❌ Erreur de connexion Supabase:', error);
    } else {
      console.log('✅ Connexion Supabase réussie. Nombre d\'utilisateurs:', count);
    }
  })
  .catch(err => {
    console.error('❌ Erreur lors du test de connexion:', err);
  });

// Types pour TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          password: string;
          role: 'admin' | 'agent';
          first_name: string;
          last_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          password: string;
          role: 'admin' | 'agent';
          first_name: string;
          last_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          password?: string;
          role?: 'admin' | 'agent';
          first_name?: string;
          last_name?: string;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          category: string;
          size: string;
          color: string;
          barcode: string;
          price: number;
          rental_price: number;
          stock: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          size: string;
          color: string;
          barcode: string;
          price: number;
          rental_price: number;
          stock: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          size?: string;
          color?: string;
          barcode?: string;
          price?: number;
          rental_price?: number;
          stock?: number;
          created_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          phone: string;
          email: string | null;
          address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          phone: string;
          email?: string | null;
          address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          phone?: string;
          email?: string | null;
          address?: string | null;
          created_at?: string;
        };
      };
      sales: {
        Row: {
          id: string;
          client_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          discount: number;
          total_amount: number;
          paid_amount: number;
          remaining_amount: number;
          status: 'paid' | 'partial' | 'pending';
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          discount: number;
          total_amount: number;
          paid_amount: number;
          remaining_amount: number;
          status: 'paid' | 'partial' | 'pending';
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          discount?: number;
          total_amount?: number;
          paid_amount?: number;
          remaining_amount?: number;
          status?: 'paid' | 'partial' | 'pending';
          created_by?: string;
          created_at?: string;
        };
      };
      rentals: {
        Row: {
          id: string;
          client_id: string;
          product_id: string;
          quantity: number;
          daily_rate: number;
          start_date: string;
          end_date: string;
          total_amount: number;
          paid_amount: number;
          remaining_amount: number;
          deposit: number;
          status: 'active' | 'returned' | 'overdue' | 'reserved';
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          product_id: string;
          quantity: number;
          daily_rate: number;
          start_date: string;
          end_date: string;
          total_amount: number;
          paid_amount: number;
          remaining_amount: number;
          deposit: number;
          status: 'active' | 'returned' | 'overdue' | 'reserved';
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          product_id?: string;
          quantity?: number;
          daily_rate?: number;
          start_date?: string;
          end_date?: string;
          total_amount?: number;
          paid_amount?: number;
          remaining_amount?: number;
          deposit?: number;
          status?: 'active' | 'returned' | 'overdue' | 'reserved';
          created_by?: string;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          transaction_id: string;
          transaction_type: 'sale' | 'rental';
          amount: number;
          payment_method: 'cash' | 'card' | 'transfer';
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          transaction_type: 'sale' | 'rental';
          amount: number;
          payment_method: 'cash' | 'card' | 'transfer';
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          transaction_type?: 'sale' | 'rental';
          amount?: number;
          payment_method?: 'cash' | 'card' | 'transfer';
          created_by?: string;
          created_at?: string;
        };
      };
    };
  };
}