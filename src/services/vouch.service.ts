import { DedotClient } from 'dedot';
import { Contract } from 'dedot/contracts';
import type { PolkadotApi } from '@dedot/chaintypes';
import { SupabaseClient } from '@supabase/supabase-js';
import { VouchContractApi } from '../../types/vouch/index.js';
import { BackedPosition, VouchInfo } from '../interfaces';

/**
 * Get a specific vouch relationship between a voucher and borrower
 */
export async function getVouchRelationship(
  supabase: SupabaseClient,
  dedotClient: DedotClient<PolkadotApi>,
  vouchMetadata: any,
  poolId: string,
  voucherAddress: string,
  borrowerAddress: string
): Promise<BackedPosition | undefined> {
  // 1. Fetch pool from Supabase
  const { data, error } = await supabase.from('pools').select().eq('id', poolId).single();

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
  if (!vouchMetadata) {
    throw new Error('Vouch metadata not provided. Pass it to the KleoClient constructor.');
  }

  const vouchContract = new Contract<VouchContractApi>(
    dedotClient as any,
    vouchMetadata,
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
 * Get all vouches for a borrower
 */
export async function getBorrowerVouches(
  supabase: SupabaseClient,
  dedotClient: DedotClient<PolkadotApi>,
  vouchMetadata: any,
  poolId: string,
  borrowerAddress: string
): Promise<VouchInfo[]> {
  // 1. Fetch pool from Supabase
  const { data, error } = await supabase.from('pools').select().eq('id', poolId).single();

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

  if (!vouchMetadata) {
    throw new Error('Vouch metadata not provided. Pass it to the KleoClient constructor.');
  }

  const vouchContract = new Contract<VouchContractApi>(
    dedotClient as any,
    vouchMetadata,
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
    const voucherAddr = voucher.toString();
    const relationship = await storage.relationships.get([voucherAddr, borrowerAddress]);

    if (!relationship) {
      return null;
    }

    return {
      voucher: voucherAddr,
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
