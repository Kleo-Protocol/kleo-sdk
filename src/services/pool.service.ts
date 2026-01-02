import { DedotClient } from 'dedot';
import { Contract } from 'dedot/contracts';
import type { PolkadotApi } from '@dedot/chaintypes';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigContractApi } from '../../types/config/index.js';

export interface PoolState {
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
}

/**
 * Get all pools from Supabase
 */
export async function getPools(supabase: SupabaseClient): Promise<any[]> {
  const { data, error } = await supabase.from('pools').select();

  if (error) {
    throw new Error(`Error fetching pools: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a specific pool by ID from Supabase
 */
export async function getPool(supabase: SupabaseClient, poolId: string): Promise<any[]> {
  const { data, error } = await supabase.from('pools').select().eq('id', poolId);

  if (error) {
    throw new Error(`Error fetching pools: ${error.message}`);
  }

  return data || [];
}

/**
 * Get pool state from the Config contract
 */
export async function getPoolState(
  supabase: SupabaseClient,
  dedotClient: DedotClient<PolkadotApi>,
  configMetadata: any,
  poolId: string,
  defaultCaller?: string
): Promise<PoolState> {
  // 1. Fetch pool from Supabase
  const { data, error } = await supabase.from('pools').select().eq('id', poolId).single();

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
  if (!configMetadata) {
    throw new Error('Config metadata not provided. Pass it to the KleoClient constructor.');
  }

  const configContract = new Contract<ConfigContractApi>(
    dedotClient as any,
    configMetadata,
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
