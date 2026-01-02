import { DedotClient } from 'dedot';
import { Contract } from 'dedot/contracts';
import type { PolkadotApi } from '@dedot/chaintypes';
import { SupabaseClient } from '@supabase/supabase-js';
import { LendingPoolContractApi } from '../../types/lending-pool/index.js';

/**
 * Get user deposit amount from the LendingPool contract
 * @param supabase - Supabase client
 * @param dedotClient - Dedot client
 * @param lendingPoolMetadata - LendingPool contract metadata
 * @param poolId - The pool ID to fetch from Supabase
 * @param userAddress - The user's address
 * @returns The user's deposit amount as a string, or undefined if not found
 */
export async function getUserDeposit(
  supabase: SupabaseClient,
  dedotClient: DedotClient<PolkadotApi>,
  lendingPoolMetadata: any,
  poolId: string,
  userAddress: string
): Promise<string | undefined> {
  // 1. Fetch pool from Supabase
  const { data, error } = await supabase.from('pools').select().eq('id', poolId).single();

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
  if (!lendingPoolMetadata) {
    throw new Error('LendingPool metadata not provided. Pass it to the KleoClient constructor.');
  }

  const lendingPoolContract = new Contract<LendingPoolContractApi>(
    dedotClient as any,
    lendingPoolMetadata,
    lendingPoolAddress
  );

  // 4. Read user deposit from storage using lazy mapping
  const storage = await lendingPoolContract.storage.lazy();
  const deposit = await storage.userDeposits.get(userAddress);

  return deposit?.toString();
}
