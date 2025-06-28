import { supabase } from '../lib/supabase';
import { User, Product, Client, Sale, Rental, Payment } from '../types';

export class SupabaseService {
  // Test de connexion
  static async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      return !error;
    } catch (error) {
      console.error('Erreur de connexion Supabase:', error);
      return false;
    }
  }

  // Users
  static async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

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
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  static async saveUser(user: User): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          username: user.username,
          password: user.password,
          role: user.role,
          first_name: user.firstName,
          last_name: user.lastName,
          created_at: user.createdAt
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  static async deleteUser(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async authenticateUser(username: string, password: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) return null;

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
      console.error('Error authenticating user:', error);
      return null;
    }
  }

  // Products
  static async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        size: product.size,
        color: product.color,
        barcode: product.barcode,
        price: parseFloat(product.price),
        rentalPrice: parseFloat(product.rental_price),
        stock: product.stock,
        createdAt: product.created_at
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  static async saveProduct(product: Product): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .upsert({
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
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving product:', error);
      throw error;
    }
  }

  static async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Clients
  static async getClients(): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

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
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  static async saveClient(client: Client): Promise<void> {
    try {
      const { error } = await supabase
        .from('clients')
        .upsert({
          id: client.id,
          first_name: client.firstName,
          last_name: client.lastName,
          phone: client.phone,
          email: client.email,
          address: client.address,
          created_at: client.createdAt
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving client:', error);
      throw error;
    }
  }

  // Sales
  static async getSales(): Promise<Sale[]> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(sale => ({
        id: sale.id,
        clientId: sale.client_id,
        productId: sale.product_id,
        quantity: sale.quantity,
        unitPrice: parseFloat(sale.unit_price),
        discount: parseFloat(sale.discount),
        totalAmount: parseFloat(sale.total_amount),
        paidAmount: parseFloat(sale.paid_amount),
        remainingAmount: parseFloat(sale.remaining_amount),
        status: sale.status,
        createdBy: sale.created_by,
        createdAt: sale.created_at
      }));
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  }

  static async saveSale(sale: Sale): Promise<void> {
    try {
      const { error } = await supabase
        .from('sales')
        .upsert({
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
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving sale:', error);
      throw error;
    }
  }

  // Rentals
  static async getRentals(): Promise<Rental[]> {
    try {
      const { data, error } = await supabase
        .from('rentals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(rental => ({
        id: rental.id,
        clientId: rental.client_id,
        productId: rental.product_id,
        quantity: rental.quantity,
        dailyRate: parseFloat(rental.daily_rate),
        startDate: rental.start_date,
        endDate: rental.end_date,
        totalAmount: parseFloat(rental.total_amount),
        paidAmount: parseFloat(rental.paid_amount),
        remainingAmount: parseFloat(rental.remaining_amount),
        deposit: parseFloat(rental.deposit),
        status: rental.status,
        createdBy: rental.created_by,
        createdAt: rental.created_at
      }));
    } catch (error) {
      console.error('Error fetching rentals:', error);
      throw error;
    }
  }

  static async saveRental(rental: Rental): Promise<void> {
    try {
      const { error } = await supabase
        .from('rentals')
        .upsert({
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
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving rental:', error);
      throw error;
    }
  }

  // Payments
  static async getPayments(): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(payment => ({
        id: payment.id,
        transactionId: payment.transaction_id,
        transactionType: payment.transaction_type,
        amount: parseFloat(payment.amount),
        paymentMethod: payment.payment_method,
        createdBy: payment.created_by,
        createdAt: payment.created_at
      }));
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  static async savePayment(payment: Payment): Promise<void> {
    try {
      const { error } = await supabase
        .from('payments')
        .upsert({
          id: payment.id,
          transaction_id: payment.transactionId,
          transaction_type: payment.transactionType,
          amount: payment.amount,
          payment_method: payment.paymentMethod,
          created_by: payment.createdBy,
          created_at: payment.createdAt
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving payment:', error);
      throw error;
    }
  }
}