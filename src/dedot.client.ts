import { DedotClient, WsProvider } from 'dedot';
import type { PolkadotApi } from '@dedot/chaintypes';

export async function createDedotClient(endpoint: string = 'wss://rpc.polkadot.io') {
  const provider = new WsProvider(endpoint);
  const client = await DedotClient.new<PolkadotApi>(provider);
  return client;
}

