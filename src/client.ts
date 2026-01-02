import { DedotClient } from 'dedot';
import { Contract } from 'dedot/contracts';
import type { PolkadotApi } from '@dedot/chaintypes';
import { KleoConfig } from '../types/types';
import { createDedotClient, ensureAccountMapped } from './dedot.client';
import supabase from './supabase.client';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigContractApi } from '../types/config/index.js';

/**
 * Main Kleo SDK Client
 */
export class KleoClient {
  private dedotClient: DedotClient<PolkadotApi> | null = null;
  private supabaseClient: typeof supabase = supabase;
  private config: { endpoint: string; timeout: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private configMetadata: any;

  /**
   * Initialize a new Kleo SDK client
   * @param config - Configuration options
   * @param configMetadata - The config contract metadata JSON
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(config: KleoConfig = {}, configMetadata?: any) {
    this.config = {
      endpoint: config.endpoint || 'wss://polkadot-asset-hub-rpc.polkadot.io',
      timeout: config.timeout || 30000,
    };
    this.configMetadata = configMetadata;
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

  async getPoolState(poolId: string, defaultCaller?: string): Promise<{
    baseInterestRate: string;
    optimalUtilization: string;
    slope1: string;
    slope2: string;
    boost: string;
    minStarsToVouch: number;
    cooldownPeriod: string;
    exposureCap: string;
    reserveFactor: number;
    maxRate: string;
  }> {
    // 1. Fetch pool from Supabase
    const { data, error } = await supabase
      .from('pools')
      .select()
      .eq('id', poolId)
      .single();

    if (error) {
      throw new Error(`Error fetching pool: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Pool not found: ${poolId}`);
    }

    // 2. Extract config contract address from contracts JSONB
    const contracts = data.contracts;
    if (!contracts || !contracts.config) {
      throw new Error(`Config contract address not found in pool contracts`);
    }

    const configAddress = contracts.config;

    // 3. Initialize config contract
    if (!this.configMetadata) {
      throw new Error('Config metadata not provided. Pass it to the KleoClient constructor.');
    }

    const client = await this.connect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const configContract = new Contract<ConfigContractApi>(
      client as any,
      this.configMetadata,
      configAddress,
      defaultCaller ? { defaultCaller } : undefined
    );

    // 4. Call all getters and return combined result
    const [
      baseInterestRate,
      optimalUtilization,
      slope1,
      slope2,
      boost,
      minStarsToVouch,
      cooldownPeriod,
      exposureCap,
      reserveFactor,
      maxRate,
    ] = await Promise.all([
      configContract.query.getBaseInterestRate(),
      configContract.query.getOptimalUtilization(),
      configContract.query.getSlope1(),
      configContract.query.getSlope2(),
      configContract.query.getBoost(),
      configContract.query.getMinStarsToVouch(),
      configContract.query.getCooldownPeriod(),
      configContract.query.getExposureCap(),
      configContract.query.getReserveFactor(),
      configContract.query.getMaxRate(),
    ]);

    return {
      baseInterestRate: baseInterestRate.data.toString(),
      optimalUtilization: optimalUtilization.data.toString(),
      slope1: slope1.data.toString(),
      slope2: slope2.data.toString(),
      boost: boost.data.toString(),
      minStarsToVouch: minStarsToVouch.data,
      cooldownPeriod: cooldownPeriod.data.toString(),
      exposureCap: exposureCap.data.toString(),
      reserveFactor: reserveFactor.data,
      maxRate: maxRate.data.toString(),
    };
  }
}
