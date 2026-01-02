import { DedotClient } from 'dedot';
import { Contract } from 'dedot/contracts';
import type { PolkadotApi } from '@dedot/chaintypes';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigContractApi } from '../../types/config/index.js';
import { ReputationContractApi, ReputationUserReputation } from '../../types/reputation/index.js';
import { VouchContractApi } from '../../types/vouch/index.js';
import { BorrowerInfo, Loan } from '../interfaces';

/**
 * Get lender exposure (stars) from the Reputation contract
 */
export async function getLenderExposure(
  supabase: SupabaseClient,
  dedotClient: DedotClient<PolkadotApi>,
  reputationMetadata: any,
  poolId: string,
  userAddress: string
): Promise<ReputationUserReputation | undefined> {
  // 1. Fetch pool from Supabase
  const { data, error } = await supabase.from('pools').select().eq('id', poolId).single();

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
  if (!reputationMetadata) {
    throw new Error('Reputation metadata not provided. Pass it to the KleoClient constructor.');
  }

  const reputationContract = new Contract<ReputationContractApi>(
    dedotClient as any,
    reputationMetadata,
    reputationAddress
  );

  // 4. Read user reputation from storage using lazy mapping
  const storage = await reputationContract.storage.lazy();
  const userRep = await storage.userReps.get(userAddress);

  return userRep;
}

/**
 * Get borrower information combining reputation and vouch data
 */
export async function getBorrowerInfo(
  supabase: SupabaseClient,
  dedotClient: DedotClient<PolkadotApi>,
  metadata: {
    config: any;
    reputation: any;
    vouch: any;
  },
  poolId: string,
  userAddress: string
): Promise<BorrowerInfo | undefined> {
  // 1. Fetch pool from Supabase
  const { data, error } = await supabase.from('pools').select().eq('id', poolId).single();

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

  if (!metadata.reputation || !metadata.vouch || !metadata.config) {
    throw new Error('Required metadata not provided. Pass all metadata to the KleoClient constructor.');
  }

  // Initialize contracts
  const reputationContract = new Contract<ReputationContractApi>(
    dedotClient as any,
    metadata.reputation,
    contracts.reputation
  );

  const vouchContract = new Contract<VouchContractApi>(
    dedotClient as any,
    metadata.vouch,
    contracts.vouch
  );

  const configContract = new Contract<ConfigContractApi>(
    dedotClient as any,
    metadata.config,
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
 * Get user's loan history from the Reputation contract
 */
export async function getUserLoans(
  supabase: SupabaseClient,
  dedotClient: DedotClient<PolkadotApi>,
  reputationMetadata: any,
  poolId: string,
  userAddress: string
): Promise<Loan[]> {
  // 1. Fetch pool from Supabase
  const { data, error } = await supabase.from('pools').select().eq('id', poolId).single();

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

  if (!reputationMetadata) {
    throw new Error('Reputation metadata not provided. Pass it to the KleoClient constructor.');
  }

  const reputationContract = new Contract<ReputationContractApi>(
    dedotClient as any,
    reputationMetadata,
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
