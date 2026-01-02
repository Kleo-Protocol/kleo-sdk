import { DedotClient } from 'dedot';
import type { PolkadotApi } from '@dedot/chaintypes';
import { KleoConfig } from '../types/types';
import { createDedotClient, ensureAccountMapped } from './dedot.client';
import supabase from './supabase.client';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Main Kleo SDK Client
 */
export class KleoClient {
  private dedotClient: DedotClient<PolkadotApi> | null = null;
  private supabaseClient: typeof supabase = supabase;
  private config: { endpoint: string; timeout: number };

  /**
   * Initialize a new Kleo SDK client
   * @param config - Configuration options
   */
  constructor(config: KleoConfig = {}) {
    this.config = {
      endpoint: config.endpoint || 'wss://polkadot-asset-hub-rpc.polkadot.io',
      timeout: config.timeout || 30000,
    };
    this.connect();
    this.supabaseClient = supabase;
  }

  /**
   * Connect to the blockchain
   */
  async connect(): Promise<DedotClient<PolkadotApi>> {
    if (!this.dedotClient) {
      this.dedotClient = await createDedotClient(this.config.endpoint);
    }
    return this.dedotClient;
  }

  /**
   * Get the underlying Dedot client
   */
  getDedotClient(): DedotClient<PolkadotApi> | null {
    return this.dedotClient;
  }

  /**
   * Get the underlying Supabase client
   */
  getSupabaseClient(): SupabaseClient | null {
    return this.supabaseClient;
  }

  /**
   * Ensure account is mapped (wrapper for dedot function)
   */
  async ensureAccountMapped(caller: Parameters<typeof ensureAccountMapped>[1]): Promise<boolean> {
    const client = await this.connect();
    return ensureAccountMapped(client, caller);
  }

  /**
   * Disconnect from the blockchain
   */
  async disconnect(): Promise<void> {
    if (this.dedotClient) {
      await this.dedotClient.disconnect();
      this.dedotClient = null;
    }
  }

  async getPools(): Promise<any[]> {
    const { data, error } = await supabase
      .from('pools')
      .select();

    if (error) {
      throw new Error(`Error fetching pools: ${error.message}`);
    }

    return data || [];
  }

  async getPool(poolId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('pools')
      .select()
      .eq('id', poolId);

    if (error) {
      throw new Error(`Error fetching pools: ${error.message}`);
    }

    return data || [];
  }

  async getProfile(userAddress: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('id', userAddress);

    if (error) {
      throw new Error(`Error fetching profile: ${error.message}`);
    }

    return data || [];
  }

  async insertProfile(userAddress: string, name: string): Promise<void> {
    const { error } = await supabase
    .from('users')
    .insert({ address: userAddress, name: name })

    if (error) {
      throw new Error(`Error fetching profile: ${error.message}`);
    }
  }

  async updateProfile(userAddress: string, name: string): Promise<void> {
    const { error } = await supabase
    .from('users')
    .update({ name: name })
    .eq('address', userAddress)

    if (error) {
      throw new Error(`Error fetching profile: ${error.message}`);
    }
  }
}
