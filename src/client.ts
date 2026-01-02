import { DedotClient } from 'dedot';
import type { PolkadotApi } from '@dedot/chaintypes';
import { SupabaseClient } from '@supabase/supabase-js';
import { KleoConfig } from '../types/types';
import { createDedotClient, ensureAccountMapped } from './dedot.client';
import supabase from './supabase.client';
import { ReputationUserReputation } from '../types/reputation/index.js';
import { ContractMetadata } from './utils/contract-helpers';
import { BackedPosition, VouchInfo, BorrowerInfo, Loan } from './interfaces';

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
  private supabaseClient: typeof supabase = supabase;
  private config: { endpoint: string; timeout: number };
  private metadata: ContractMetadata;

  /**
   * Initialize a new Kleo SDK client
   * @param config - Configuration options
   * @param metadata - Contract metadata objects
   */
  constructor(config: KleoConfig = {}, metadata?: ContractMetadata) {
    this.config = {
      endpoint: config.endpoint || 'wss://polkadot-asset-hub-rpc.polkadot.io',
      timeout: config.timeout || 30000,
    };
    this.metadata = {
      config: metadata?.config,
      lendingPool: metadata?.lendingPool,
      reputation: metadata?.reputation,
      vouch: metadata?.vouch,
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
    if (!this.metadata.config) {
      throw new Error('Config metadata not provided. Pass it to the KleoClient constructor.');
    }
    const client = await this.connect();
    return PoolService.getPoolState(
      this.supabaseClient,
      client,
      this.metadata.config,
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
    if (!this.metadata.lendingPool) {
      throw new Error('LendingPool metadata not provided. Pass it to the KleoClient constructor.');
    }
    const client = await this.connect();
    return LendingService.getUserDeposit(
      this.supabaseClient,
      client,
      this.metadata.lendingPool,
      poolId,
      userAddress
    );
  }

  // ============ Reputation Methods ============

  async getLenderExposure(
    poolId: string,
    userAddress: string
  ): Promise<ReputationUserReputation | undefined> {
    if (!this.metadata.reputation) {
      throw new Error('Reputation metadata not provided. Pass it to the KleoClient constructor.');
    }
    const client = await this.connect();
    return ReputationService.getLenderExposure(
      this.supabaseClient,
      client,
      this.metadata.reputation,
      poolId,
      userAddress
    );
  }

  async getBorrowerInfo(
    poolId: string,
    userAddress: string
  ): Promise<BorrowerInfo | undefined> {
    if (!this.metadata.reputation || !this.metadata.vouch || !this.metadata.config) {
      throw new Error('Required metadata not provided. Pass all metadata to the KleoClient constructor.');
    }
    const client = await this.connect();
    return ReputationService.getBorrowerInfo(
      this.supabaseClient,
      client,
      {
        config: this.metadata.config,
        reputation: this.metadata.reputation,
        vouch: this.metadata.vouch,
      },
      poolId,
      userAddress
    );
  }

  async getUserLoans(poolId: string, userAddress: string): Promise<Loan[]> {
    if (!this.metadata.reputation) {
      throw new Error('Reputation metadata not provided. Pass it to the KleoClient constructor.');
    }
    const client = await this.connect();
    return ReputationService.getUserLoans(
      this.supabaseClient,
      client,
      this.metadata.reputation,
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
    if (!this.metadata.vouch) {
      throw new Error('Vouch metadata not provided. Pass it to the KleoClient constructor.');
    }
    const client = await this.connect();
    return VouchService.getVouchRelationship(
      this.supabaseClient,
      client,
      this.metadata.vouch,
      poolId,
      voucherAddress,
      borrowerAddress
    );
  }

  async getBorrowerVouches(
    poolId: string,
    borrowerAddress: string
  ): Promise<VouchInfo[]> {
    if (!this.metadata.vouch) {
      throw new Error('Vouch metadata not provided. Pass it to the KleoClient constructor.');
    }
    const client = await this.connect();
    return VouchService.getBorrowerVouches(
      this.supabaseClient,
      client,
      this.metadata.vouch,
      poolId,
      borrowerAddress
    );
  }
}
