import { DedotClient } from 'dedot';
import type { PolkadotApi } from '@dedot/chaintypes';
import { SupabaseClient } from '@supabase/supabase-js';
import { KleoConfig } from '../types/types';
import { createDedotClient, ensureAccountMapped } from './dedot.client';
import { createSupabaseClient } from './supabase.client';
import { ReputationUserReputation } from '../types/reputation/index.js';
import { BackedPosition, VouchInfo, BorrowerInfo, Loan } from './interfaces';
import { metadata } from './metadata';

// Re-export interfaces
export { BackedPosition, VouchInfo, BorrowerInfo, Loan } from './interfaces';

// Import services
import * as PoolService from './services/pool.service';
import * as ProfileService from './services/profile.service';
import * as LendingService from './services/lending.service';
import * as VouchService from './services/vouch.service';
import * as ReputationService from './services/reputation.service';

// Re-export service types
export { PoolState } from './services/pool.service';

/**
 * Main Kleo SDK Client
 */
export class KleoClient {
  private dedotClient: DedotClient<PolkadotApi> | null = null;
  private supabaseClient: SupabaseClient;
  private config: { endpoint: string; timeout: number };

  /**
   * Initialize a new Kleo SDK client
   * @param config - Configuration options (credentials default to environment variables)
   */
  constructor(config: KleoConfig = {}) {
    this.config = {
      endpoint: config.endpoint || 'wss://asset-hub-paseo.dotters.network',
      timeout: config.timeout || 30000,
    };
    this.supabaseClient = createSupabaseClient(
      config.supabaseUrl,
      config.supabaseAnonKey
    );
    this.connect();
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

  // ============ Pool Methods ============

  async getPools(): Promise<any[]> {
    return PoolService.getPools(this.supabaseClient);
  }

  async getPool(poolId: string): Promise<any[]> {
    return PoolService.getPool(this.supabaseClient, poolId);
  }

  async getPoolState(
    poolId: string,
    defaultCaller?: string
  ): Promise<PoolService.PoolState> {
    const client = await this.connect();
    return PoolService.getPoolState(
      this.supabaseClient,
      client,
      metadata.config,
      poolId,
      defaultCaller
    );
  }

  // ============ Profile Methods ============

  async getProfile(userAddress: string): Promise<any[]> {
    return ProfileService.getProfile(this.supabaseClient, userAddress);
  }

  async insertProfile(userAddress: string, name: string): Promise<void> {
    return ProfileService.insertProfile(this.supabaseClient, userAddress, name);
  }

  async updateProfile(userAddress: string, name: string): Promise<void> {
    return ProfileService.updateProfile(this.supabaseClient, userAddress, name);
  }

  // ============ Lending Methods ============

  async getUserDeposit(poolId: string, userAddress: string): Promise<string | undefined> {
    const client = await this.connect();
    return LendingService.getUserDeposit(
      this.supabaseClient,
      client,
      metadata.lendingPool,
      poolId,
      userAddress
    );
  }

  // ============ Reputation Methods ============

  async getLenderExposure(
    poolId: string,
    userAddress: string
  ): Promise<ReputationUserReputation | undefined> {
    const client = await this.connect();
    return ReputationService.getLenderExposure(
      this.supabaseClient,
      client,
      metadata.reputation,
      poolId,
      userAddress
    );
  }

  async getBorrowerInfo(
    poolId: string,
    userAddress: string
  ): Promise<BorrowerInfo | undefined> {
    const client = await this.connect();
    return ReputationService.getBorrowerInfo(
      this.supabaseClient,
      client,
      {
        config: metadata.config,
        reputation: metadata.reputation,
        vouch: metadata.vouch,
      },
      poolId,
      userAddress
    );
  }

  async getUserLoans(poolId: string, userAddress: string): Promise<Loan[]> {
    const client = await this.connect();
    return ReputationService.getUserLoans(
      this.supabaseClient,
      client,
      metadata.reputation,
      poolId,
      userAddress
    );
  }

  // ============ Vouch Methods ============

  async getVouchRelationship(
    poolId: string,
    voucherAddress: string,
    borrowerAddress: string
  ): Promise<BackedPosition | undefined> {
    const client = await this.connect();
    return VouchService.getVouchRelationship(
      this.supabaseClient,
      client,
      metadata.vouch,
      poolId,
      voucherAddress,
      borrowerAddress
    );
  }

  async getBorrowerVouches(
    poolId: string,
    borrowerAddress: string
  ): Promise<VouchInfo[]> {
    const client = await this.connect();
    return VouchService.getBorrowerVouches(
      this.supabaseClient,
      client,
      metadata.vouch,
      poolId,
      borrowerAddress
    );
  }
}
