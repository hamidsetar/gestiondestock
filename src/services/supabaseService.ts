import { supabase } from '../lib/supabase';
import { User, Product, Client, Sale, Rental, Payment } from '../types';

export class SupabaseService {
  // Test de connexion
  static async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('❌ Test de connexion échoué:', error);
        return false;
      }
      
      console.log('✅ Test de connexion réussi');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors du test de connexion:', error);
      return false;
    }
  }

  // Users
  static async getUsers(): Promise<User[]> {
    try {
      console.log('🔄 Récupération des utilisateurs...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
        throw error;
      }
      
      console.log('✅ Utilisateurs récupérés:', data?.length || 0);
      
      if (!data) return [];
      
      return data.map(user => ({
        id: user.id,
        username: user.username,
        password: user.password,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at
      }));
    } catch (error) {
      console.error('❌ Erreur SupabaseService.getUsers:', error);
      throw error;
    }
  }

  static async saveUser(user: User): Promise<void> {
    try {
      const userData = {
        id: user.id,
        username: user.username,
        password: user.password,
        role: user.role,
        first_name: user.firstName,
        last_name: user.lastName,
        created_at: user.createdAt
      };

      const { error } = await supabase
        .from('users')
        .upsert(userData);
      
      if (error) {
        console.error('❌ Erreur lors de la sauvegarde de l\'utilisateur:', error);
        throw error;
      }
      
      console.log('✅ Utilisateur sauvegardé:', user.username);
    } catch (error) {
      console.error('❌ Erreur SupabaseService.saveUser:', error);
      throw error;
    }
  }

  static async deleteUser(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Erreur lors de la suppression de l\'utilisateur:', error);
        throw error;
      }
      
      console.log('✅ Utilisateur supprimé:', id);
    } catch (error) {
      console.error('❌ Erreur SupabaseService.deleteUser:', error);
      throw error;
    }
  }

  static async authenticateUser(username: string, password: string): Promise<User | null> {
    try {
      console.log('🔄 Tentative d\'authentification pour:', username);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();
      
      if (error || !data) {
        console.log('❌ Authentification échouée pour:', username, error?.message);
        return null;
      }
      
      console.log('✅ Authentification réussie pour:', username);
      return {
        id: data.id,
        username: data.username,
        password: data.password,
        role: data.role,
        firstName: data.first_name,
        lastName: data.last_name,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('❌ Erreur SupabaseService.authenticateUser:', error);
      return null;
    }
  }

  // Products
  static async getProducts(): Promise<Product[]> {
    try {
      console.log('🔄 Récupération des produits...');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erreur lors de la récupération des produits:', error);
        throw error;
      }
      
      console.log('✅ Produits récupérés:', data?.length || 0);
      
      if (!data) return [];
      
      return data.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        size: product.size,
        color: product.color,
        barcode: product.barcode,
        price: Number(product.price),
        rentalPrice: Number(product.rental_price),
        stock: product.stock,
        createdAt: product.created_at
      }));
    } catch (error) {
      console.error('❌ Erreur SupabaseService.getProducts:', error);
      throw error;
    }
  }

  static async saveProduct(product: Product): Promise<void> {
    try {
      const productData = {
        id: product.id,
        name: product.name,
        category: product.category,
        size: product.size,
        color: product.color,
        barcode: product.barcode,
        price: product.price,
        rental_price: product.rentalPrice,
        stock: product.stock,
        created_at: product.createdAt
      };

      const { error } = await supabase
        .from('products')
        .upsert(productData);
      
      if (error) {
        console.error('❌ Erreur lors de la sauvegarde du produit:', error);
        throw error;
      }
      
      console.log('✅ Produit sauvegardé:', product.name);
    } catch (error) {
      console.error('❌ Erreur SupabaseService.saveProduct:', error);
      throw error;
    }
  }

  static async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Erreur lors de la suppression du produit:', error);
        throw error;
      }
      
      console.log('✅ Produit supprimé:', id);
    } catch (error) {
      console.error('❌ Erreur SupabaseService.deleteProduct:', error);
      throw error;
    }
  }

  // Clients
  static async getClients(): Promise<Client[]> {
    try {
      console.log('🔄 Récupération des clients...');
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erreur lors de la récupération des clients:', error);
        throw error;
      }
      
      console.log('✅ Clients récupérés:', data?.length || 0);
      
      if (!data) return [];
      
      return data.map(client => ({
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        phone: client.phone,
        email: client.email,
        address: client.address,
        createdAt: client.created_at
      }));
    } catch (error) {
      console.error('❌ Erreur SupabaseService.getClients:', error);
      throw error;
    }
  }

  static async saveClient(client: Client): Promise<void> {
    try {
      const clientData = {
        id: client.id,
        first_name: client.firstName,
        last_name: client.lastName,
        phone: client.phone,
        email: client.email,
        address: client.address,
        created_at: client.createdAt
      };

      const { error } = await supabase
        .from('clients')
        .upsert(clientData);
      
      if (error) {
        console.error('❌ Erreur lors de la sauvegarde du client:', error);
        throw error;
      }
      
      console.log('✅ Client sauvegardé:', client.firstName, client.lastName);
    } catch (error) {
      console.error('❌ Erreur SupabaseService.saveClient:', error);
      throw error;
    }
  }

  // Sales
  static async getSales(): Promise<Sale[]> {
    try {
      console.log('🔄 Récupération des ventes...');
      
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erreur lors de la récupération des ventes:', error);
        throw error;
      }
      
      console.log('✅ Ventes récupérées:', data?.length || 0);
      
      if (!data) return [];
      
      return data.map(sale => ({
        id: sale.id,
        clientId: sale.client_id,
        productId: sale.product_id,
        quantity: sale.quantity,
        unitPrice: Number(sale.unit_price),
        discount: Number(sale.discount),
        totalAmount: Number(sale.total_amount),
        paidAmount: Number(sale.paid_amount),
        remainingAmount: Number(sale.remaining_amount),
        status: sale.status,
        createdBy: sale.created_by,
        createdAt: sale.created_at
      }));
    } catch (error) {
      console.error('❌ Erreur SupabaseService.getSales:', error);
      throw error;
    }
  }

  static async saveSale(sale: Sale): Promise<void> {
    try {
      const saleData = {
        id: sale.id,
        client_id: sale.clientId,
        product_id: sale.productId,
        quantity: sale.quantity,
        unit_price: sale.unitPrice,
        discount: sale.discount,
        total_amount: sale.totalAmount,
        paid_amount: sale.paidAmount,
        remaining_amount: sale.remainingAmount,
        status: sale.status,
        created_by: sale.createdBy,
        created_at: sale.createdAt
      };

      const { error } = await supabase
        .from('sales')
        .upsert(saleData);
      
      if (error) {
        console.error('❌ Erreur lors de la sauvegarde de la vente:', error);
        throw error;
      }
      
      console.log('✅ Vente sauvegardée:', sale.id);
    } catch (error) {
      console.error('❌ Erreur SupabaseService.saveSale:', error);
      throw error;
    }
  }

  // Rentals
  static async getRentals(): Promise<Rental[]> {
    try {
      console.log('🔄 Récupération des locations...');
      
      const { data, error } = await supabase
        .from('rentals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erreur lors de la récupération des locations:', error);
        throw error;
      }
      
      console.log('✅ Locations récupérées:', data?.length || 0);
      
      if (!data) return [];
      
      return data.map(rental => ({
        id: rental.id,
        clientId: rental.client_id,
        productId: rental.product_id,
        quantity: rental.quantity,
        dailyRate: Number(rental.daily_rate),
        startDate: rental.start_date,
        endDate: rental.end_date,
        totalAmount: Number(rental.total_amount),
        paidAmount: Number(rental.paid_amount),
        remainingAmount: Number(rental.remaining_amount),
        deposit: Number(rental.deposit),
        status: rental.status,
        createdBy: rental.created_by,
        createdAt: rental.created_at
      }));
    } catch (error) {
      console.error('❌ Erreur SupabaseService.getRentals:', error);
      throw error;
    }
  }

  static async saveRental(rental: Rental): Promise<void> {
    try {
      const rentalData = {
        id: rental.id,
        client_id: rental.clientId,
        product_id: rental.productId,
        quantity: rental.quantity,
        daily_rate: rental.dailyRate,
        start_date: rental.startDate,
        end_date: rental.endDate,
        total_amount: rental.totalAmount,
        paid_amount: rental.paidAmount,
        remaining_amount: rental.remainingAmount,
        deposit: rental.deposit,
        status: rental.status,
        created_by: rental.createdBy,
        created_at: rental.createdAt
      };

      const { error } = await supabase
        .from('rentals')
        .upsert(rentalData);
      
      if (error) {
        console.error('❌ Erreur lors de la sauvegarde de la location:', error);
        throw error;
      }
      
      console.log('✅ Location sauvegardée:', rental.id);
    } catch (error) {
      console.error('❌ Erreur SupabaseService.saveRental:', error);
      throw error;
    }
  }

  // Payments
  static async getPayments(): Promise<Payment[]> {
    try {
      console.log('🔄 Récupération des paiements...');
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erreur lors de la récupération des paiements:', error);
        throw error;
      }
      
      console.log('✅ Paiements récupérés:', data?.length || 0);
      
      if (!data) return [];
      
      return data.map(payment => ({
        id: payment.id,
        transactionId: payment.transaction_id,
        transactionType: payment.transaction_type,
        amount: Number(payment.amount),
        paymentMethod: payment.payment_method,
        createdBy: payment.created_by,
        createdAt: payment.created_at
      }));
    } catch (error) {
      console.error('❌ Erreur SupabaseService.getPayments:', error);
      throw error;
    }
  }

  static async savePayment(payment: Payment): Promise<void> {
    try {
      const paymentData = {
        id: payment.id,
        transaction_id: payment.transactionId,
        transaction_type: payment.transactionType,
        amount: payment.amount,
        payment_method: payment.paymentMethod,
        created_by: payment.createdBy,
        created_at: payment.createdAt
      };

      const { error } = await supabase
        .from('payments')
        .insert(paymentData);
      
      if (error) {
        console.error('❌ Erreur lors de la sauvegarde du paiement:', error);
        throw error;
      }
      
      console.log('✅ Paiement sauvegardé:', payment.id);
    } catch (error) {
      console.error('❌ Erreur SupabaseService.savePayment:', error);
      throw error;
    }
  }
}