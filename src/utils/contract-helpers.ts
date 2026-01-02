import { DedotClient } from 'dedot';
import { Contract } from 'dedot/contracts';
import type { PolkadotApi } from '@dedot/chaintypes';
import { ConfigContractApi } from '../../types/config/index.js';
import { LendingPoolContractApi } from '../../types/lending-pool/index.js';
import { ReputationContractApi } from '../../types/reputation/index.js';
import { VouchContractApi } from '../../types/vouch/index.js';

/**
 * Contract metadata types
 */
export interface ContractMetadata {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lendingPool?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reputation?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vouch?: any;
}

/**
 * Pool contracts addresses structure
 */
export interface PoolContracts {
  config?: string;
  lending_pool?: string;
  reputation?: string;
  vouch?: string;
}

/**
 * Create a Config contract instance
 */
export function createConfigContract(
  dedotClient: DedotClient<PolkadotApi>,
  metadata: any,
  address: string,
  defaultCaller?: string
): Contract<ConfigContractApi> {
  return new Contract<ConfigContractApi>(
    dedotClient as any,
    metadata,
    address,
    defaultCaller ? { defaultCaller } : undefined
  );
}

/**
 * Create a LendingPool contract instance
 */
export function createLendingPoolContract(
  dedotClient: DedotClient<PolkadotApi>,
  metadata: any,
  address: string
): Contract<LendingPoolContractApi> {
  return new Contract<LendingPoolContractApi>(dedotClient as any, metadata, address);
}

/**
 * Create a Reputation contract instance
 */
export function createReputationContract(
  dedotClient: DedotClient<PolkadotApi>,
  metadata: any,
  address: string
): Contract<ReputationContractApi> {
  return new Contract<ReputationContractApi>(dedotClient as any, metadata, address);
}

/**
 * Create a Vouch contract instance
 */
export function createVouchContract(
  dedotClient: DedotClient<PolkadotApi>,
  metadata: any,
  address: string
): Contract<VouchContractApi> {
  return new Contract<VouchContractApi>(dedotClient as any, metadata, address);
}
