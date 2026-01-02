import { DedotClient } from 'dedot';
import { Contract } from 'dedot/contracts';
import type { PolkadotApi } from '@dedot/chaintypes';
import { KleoConfig } from '../types/types';
import { createDedotClient, ensureAccountMapped } from './dedot.client';
import supabase from './supabase.client';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigContractApi } from '../types/config/index.js';
import { LendingPoolContractApi } from '../types/lending-pool/index.js';
import { ReputationContractApi, ReputationUserReputation } from '../types/reputation/index.js';
import { VouchContractApi } from '../types/vouch/index.js';

/**
 * Backed position representing a vouch relationship
 */
export interface BackedPosition {
  borrower: string;
  stakedStars: number;
  stakedCapital: string;
  createdAt: string;
  status: 'Active' | 'Fulfilled' | 'Defaulted';
}

/**
 * Vouch information for a borrower
 */
export interface VouchInfo {
  voucher: string;
  stakedStars: number;
  stakedCapital: string;
  createdAt: string;
  status: 'Active' | 'Fulfilled' | 'Defaulted';
}

/**
 * Borrower information combining reputation and vouch data
 */
export interface BorrowerInfo {
  stars: number;
  starsAtStake: number;
  canVouch: boolean;
  banned: boolean;
  creationTime: string;
  loanHistoryCount: number;
  vouchHistoryCount: number;
  totalExposure: string;
}

/**
 * Loan information from user's loan history
 */
export interface Loan {
  amount: string;
  repaid: boolean;
}

/**
 * Main Kleo SDK Client
 */
export class KleoClient {
  private dedotClient: DedotClient<PolkadotApi> | null = null;
  private supabaseClient: typeof supabase = supabase;
  private config: { endpoint: string; timeout: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private configMetadata: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private lendingPoolMetadata: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private reputationMetadata: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private vouchMetadata: any;

  /**
   * Initialize a new Kleo SDK client
   * @param config - Configuration options
   * @param metadata - Contract metadata objects
   */
  constructor(
    config: KleoConfig = {},
    metadata?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config?: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lendingPool?: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reputation?: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vouch?: any;
    }
  ) {
    this.config = {
      endpoint: config.endpoint || 'wss://polkadot-asset-hub-rpc.polkadot.io',
      timeout: config.timeout || 30000,
    };
    this.configMetadata = metadata?.config;
    this.lendingPoolMetadata = metadata?.lendingPool;
    this.reputationMetadata = metadata?.reputation;
    this.vouchMetadata = metadata?.vouch;
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

  /**
   * Get user deposit amount from the LendingPool contract
   * @param poolId - The pool ID to fetch from Supabase
   * @param userAddress - The user's address
   * @returns The user's deposit amount as a string, or undefined if not found
   */
  async getUserDeposit(poolId: string, userAddress: string): Promise<string | undefined> {
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

    // 2. Extract lending_pool contract address from contracts JSONB
    const contracts = data.contracts;
    if (!contracts || !contracts.lending_pool) {
      throw new Error(`LendingPool contract address not found in pool contracts`);
    }

    const lendingPoolAddress = contracts.lending_pool;

    // 3. Initialize lending pool contract
    if (!this.lendingPoolMetadata) {
      throw new Error('LendingPool metadata not provided. Pass it to the KleoClient constructor.');
    }

    const client = await this.connect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lendingPoolContract = new Contract<LendingPoolContractApi>(
      client as any,
      this.lendingPoolMetadata,
      lendingPoolAddress
    );

    // 4. Read user deposit from storage using lazy mapping
    const storage = await lendingPoolContract.storage.lazy();
    const deposit = await storage.userDeposits.get(userAddress);

    return deposit?.toString();
  }

  /**
   * Get lender exposure (stars) from the Reputation contract
   * @param poolId - The pool ID to fetch from Supabase
   * @param userAddress - The user's address
   * @returns The user's reputation data including stars
   */
  async getLenderExposure(poolId: string, userAddress: string): Promise<ReputationUserReputation | undefined> {
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

    // 2. Extract reputation contract address from contracts JSONB
    const contracts = data.contracts;
    if (!contracts || !contracts.reputation) {
      throw new Error(`Reputation contract address not found in pool contracts`);
    }

    const reputationAddress = contracts.reputation;

    // 3. Initialize reputation contract
    if (!this.reputationMetadata) {
      throw new Error('Reputation metadata not provided. Pass it to the KleoClient constructor.');
    }

    const client = await this.connect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reputationContract = new Contract<ReputationContractApi>(
      client as any,
      this.reputationMetadata,
      reputationAddress
    );

    // 4. Read user reputation from storage using lazy mapping
    const storage = await reputationContract.storage.lazy();
    const userRep = await storage.userReps.get(userAddress);

    return userRep;
  }

  /**
   * Get a specific vouch relationship between a voucher and borrower
   * @param poolId - The pool ID to fetch from Supabase
   * @param voucherAddress - The voucher's address (lender)
   * @param borrowerAddress - The borrower's address
   * @returns The vouch relationship details
   */
  async getVouchRelationship(
    poolId: string,
    voucherAddress: string,
    borrowerAddress: string
  ): Promise<BackedPosition | undefined> {
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

    // 2. Extract vouch contract address from contracts JSONB
    const contracts = data.contracts;
    if (!contracts || !contracts.vouch) {
      throw new Error(`Vouch contract address not found in pool contracts`);
    }

    const vouchAddress = contracts.vouch;

    // 3. Initialize vouch contract
    if (!this.vouchMetadata) {
      throw new Error('Vouch metadata not provided. Pass it to the KleoClient constructor.');
    }

    const client = await this.connect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vouchContract = new Contract<VouchContractApi>(
      client as any,
      this.vouchMetadata,
      vouchAddress
    );

    // 4. Read specific relationship from storage
    const storage = await vouchContract.storage.lazy();
    const relationship = await storage.relationships.get([voucherAddress, borrowerAddress]);

    if (!relationship) {
      return undefined;
    }

    return {
      borrower: borrowerAddress,
      stakedStars: relationship.stakedStars,
      stakedCapital: relationship.stakedCapital.toString(),
      createdAt: relationship.createdAt.toString(),
      status: relationship.status,
    };
  }

  /**
   * Get borrower information combining reputation and vouch data
   * @param poolId - The pool ID to fetch from Supabase
   * @param userAddress - The borrower's address
   * @returns Borrower info including stars, canVouch status, etc.
   */
  async getBorrowerInfo(poolId: string, userAddress: string): Promise<BorrowerInfo | undefined> {
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

    const contracts = data.contracts;
    if (!contracts || !contracts.reputation || !contracts.vouch || !contracts.config) {
      throw new Error(`Required contract addresses not found in pool contracts`);
    }

    if (!this.reputationMetadata || !this.vouchMetadata || !this.configMetadata) {
      throw new Error('Required metadata not provided. Pass all metadata to the KleoClient constructor.');
    }

    const client = await this.connect();

    // Initialize contracts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reputationContract = new Contract<ReputationContractApi>(
      client as any,
      this.reputationMetadata,
      contracts.reputation
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vouchContract = new Contract<VouchContractApi>(
      client as any,
      this.vouchMetadata,
      contracts.vouch
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const configContract = new Contract<ConfigContractApi>(
      client as any,
      this.configMetadata,
      contracts.config
    );

    // Fetch data in parallel
    const [reputationStorage, vouchStorage, minStarsResult] = await Promise.all([
      reputationContract.storage.lazy(),
      vouchContract.storage.lazy(),
      configContract.query.getMinStarsToVouch(),
    ]);

    const [userRep, borrowerExposure] = await Promise.all([
      reputationStorage.userReps.get(userAddress),
      vouchStorage.borrowerExposure.get(userAddress),
    ]);

    if (!userRep) {
      return undefined;
    }

    const minStarsToVouch = minStarsResult.data;
    const canVouch = userRep.stars >= minStarsToVouch && !userRep.banned;

    return {
      stars: userRep.stars,
      starsAtStake: userRep.starsAtStake,
      canVouch,
      banned: userRep.banned,
      creationTime: userRep.creationTime.toString(),
      loanHistoryCount: userRep.loanHistory.length,
      vouchHistoryCount: userRep.vouchHistory.length,
      totalExposure: (borrowerExposure || BigInt(0)).toString(),
    };
  }

  /**
   * Get all vouches for a borrower
   * @param poolId - The pool ID to fetch from Supabase
   * @param borrowerAddress - The borrower's address
   * @returns Array of vouch information from all vouchers
   */
  async getBorrowerVouches(poolId: string, borrowerAddress: string): Promise<VouchInfo[]> {
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

    const contracts = data.contracts;
    if (!contracts || !contracts.vouch) {
      throw new Error(`Vouch contract address not found in pool contracts`);
    }

    if (!this.vouchMetadata) {
      throw new Error('Vouch metadata not provided. Pass it to the KleoClient constructor.');
    }

    const client = await this.connect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vouchContract = new Contract<VouchContractApi>(
      client as any,
      this.vouchMetadata,
      contracts.vouch
    );

    const storage = await vouchContract.storage.lazy();

    // Get list of vouchers for this borrower
    const vouchers = await storage.borrowerVouchers.get(borrowerAddress);

    if (!vouchers || vouchers.length === 0) {
      return [];
    }

    // Fetch all relationships in parallel
    const relationshipPromises = vouchers.map(async (voucher) => {
      const voucherAddress = voucher.toString();
      const relationship = await storage.relationships.get([voucherAddress, borrowerAddress]);

      if (!relationship) {
        return null;
      }

      return {
        voucher: voucherAddress,
        stakedStars: relationship.stakedStars,
        stakedCapital: relationship.stakedCapital.toString(),
        createdAt: relationship.createdAt.toString(),
        status: relationship.status,
      } as VouchInfo;
    });

    const relationships = await Promise.all(relationshipPromises);

    // Filter out null values
    return relationships.filter((r): r is VouchInfo => r !== null);
  }

  /**
   * Get user's loan history from the Reputation contract
   * @param poolId - The pool ID to fetch from Supabase
   * @param userAddress - The user's address
   * @returns Array of loans from the user's loan history
   */
  async getUserLoans(poolId: string, userAddress: string): Promise<Loan[]> {
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

    const contracts = data.contracts;
    if (!contracts || !contracts.reputation) {
      throw new Error(`Reputation contract address not found in pool contracts`);
    }

    if (!this.reputationMetadata) {
      throw new Error('Reputation metadata not provided. Pass it to the KleoClient constructor.');
    }

    const client = await this.connect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reputationContract = new Contract<ReputationContractApi>(
      client as any,
      this.reputationMetadata,
      contracts.reputation
    );

    const storage = await reputationContract.storage.lazy();
    const userRep = await storage.userReps.get(userAddress);

    if (!userRep) {
      return [];
    }

    return userRep.loanHistory.map((loan) => ({
      amount: loan.amount.toString(),
      repaid: loan.repaid,
    }));
  }
}
