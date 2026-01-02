import { DedotClient, WsProvider } from 'dedot';
import { toEvmAddress } from 'dedot/contracts';
import type { PolkadotApi } from '@dedot/chaintypes';

export async function createDedotClient(endpoint: string = 'wss://asset-hub-paseo.dotters.network') {
  const provider = new WsProvider(endpoint);
  const client = await DedotClient.new<PolkadotApi>(provider);
  console.log("Connected to Dedot client at", endpoint);
  return client;
}

/**
 * AddressOrPair compatible type for signers
 * Can be a string address or a KeyringPair-like object
 */
export type SignerAccount = string | {
  address: string;
  addressRaw: Uint8Array;
  publicKey: Uint8Array;
  sign: (data: Uint8Array) => Uint8Array;
};

/**
 * Check if an account is mapped and map it if not
 * @param client - The Dedot client instance
 * @param caller - The signer account (address string or KeyringPair)
 * @returns true if already mapped, false if newly mapped
 */
export async function ensureAccountMapped(
  client: DedotClient<PolkadotApi>,
  caller: SignerAccount
): Promise<boolean> {
  const callerAddress = typeof caller === 'string' ? caller : caller.address;
  
  // Check if the account is mapped yet
  const mappedAccount = await client.query.revive.originalAccount(toEvmAddress(callerAddress));
  
  if (mappedAccount) {
    console.log('Address has already been mapped!');
    return true;
  } else {
    console.log('Address not mapped yet, map it now!');
    
    await client.tx.revive
      .mapAccount()
      .signAndSend(caller, ({ status }: { status: { type: string } }) => console.log(status.type))
      .untilFinalized();
    
    return false;
  }
}

