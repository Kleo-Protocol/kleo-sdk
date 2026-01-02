import { DedotClient } from 'dedot';
import type { PolkadotApi } from '@dedot/chaintypes';
import { KleoConfig } from '../types/types';
import { createDedotClient, ensureAccountMapped } from './dedot.client';

/**
 * Main Kleo SDK Client
 */
export class KleoClient {
  private dedotClient: DedotClient<PolkadotApi> | null = null;
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
  getClient(): DedotClient<PolkadotApi> | null {
    return this.dedotClient;
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
}
