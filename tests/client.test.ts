import { KleoClient } from '../src/client';
import { createDedotClient, ensureAccountMapped } from '../src/dedot.client';
import { createSupabaseClient } from '../src/supabase.client';
import { TEST_ADDRESSES, mockPoolData } from './mocks';

// Mock dependencies
jest.mock('../src/dedot.client');
jest.mock('../src/supabase.client');
jest.mock('dedot/contracts', () => ({
  Contract: jest.fn(),
}));

const mockDedotClient = {
  disconnect: jest.fn().mockResolvedValue(undefined),
};

const mockSupabaseClient = {
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockPoolData,
          error: null,
        }),
      }),
    }),
  }),
};

describe('KleoClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createDedotClient as jest.Mock).mockResolvedValue(mockDedotClient);
    (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    (ensureAccountMapped as jest.Mock).mockResolvedValue(true);
  });

  describe('constructor', () => {
    it('should create client with default config', () => {
      new KleoClient();

      expect(createSupabaseClient).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should create client with custom config', () => {
      new KleoClient({
        endpoint: 'wss://custom.endpoint',
        timeout: 60000,
        supabaseUrl: 'https://custom.supabase.co',
        supabaseAnonKey: 'custom-key',
      });

      expect(createSupabaseClient).toHaveBeenCalledWith(
        'https://custom.supabase.co',
        'custom-key'
      );
    });
  });

  describe('connect', () => {
    it('should connect to blockchain', async () => {
      const client = new KleoClient();
      const dedot = await client.connect();

      expect(createDedotClient).toHaveBeenCalled();
      expect(dedot).toBe(mockDedotClient);
    });

    it('should reuse existing connection after initial connect completes', async () => {
      const client = new KleoClient();
      // Wait for initial connection from constructor
      await client.connect();
      
      // Clear mock to count only subsequent calls
      (createDedotClient as jest.Mock).mockClear();
      
      // These should reuse the existing connection
      await client.connect();
      await client.connect();

      // No additional calls should be made
      expect(createDedotClient).toHaveBeenCalledTimes(0);
    });
  });

  describe('disconnect', () => {
    it('should disconnect from blockchain', async () => {
      const client = new KleoClient();
      await client.connect();
      await client.disconnect();

      expect(mockDedotClient.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect when not connected', async () => {
      const client = new KleoClient();
      // Force dedotClient to be null by not connecting
      await client.disconnect();
      // Should not throw
    });
  });

  describe('getDedotClient', () => {
    it('should return null before connecting', () => {
      const client = new KleoClient();
      // Note: connect is called in constructor, but it's async
      // So immediately after constructor, it might be null
      const dedot = client.getDedotClient();
      // Initially null until connect completes
      expect(dedot).toBeNull();
    });

    it('should return client after connecting', async () => {
      const client = new KleoClient();
      await client.connect();
      const dedot = client.getDedotClient();

      expect(dedot).toBe(mockDedotClient);
    });
  });

  describe('getSupabaseClient', () => {
    it('should return supabase client', () => {
      const client = new KleoClient();
      const supabase = client.getSupabaseClient();

      expect(supabase).toBe(mockSupabaseClient);
    });
  });

  describe('ensureAccountMapped', () => {
    it('should call dedot ensureAccountMapped', async () => {
      const client = new KleoClient();
      const mockCaller = { address: TEST_ADDRESSES.user1 };

      const result = await client.ensureAccountMapped(mockCaller as any);

      expect(ensureAccountMapped).toHaveBeenCalledWith(mockDedotClient, mockCaller);
      expect(result).toBe(true);
    });
  });

  describe('Pool Methods', () => {
    it('getPools should return pools', async () => {
      const mockPools = [mockPoolData];
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: mockPools,
            error: null,
          }),
        }),
      };
      (createSupabaseClient as jest.Mock).mockReturnValue(localMockSupabase);

      const client = new KleoClient();
      const pools = await client.getPools();

      expect(pools).toEqual(mockPools);
    });

    it('getPool should return specific pool', async () => {
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [mockPoolData],
              error: null,
            }),
          }),
        }),
      };
      (createSupabaseClient as jest.Mock).mockReturnValue(localMockSupabase);

      const client = new KleoClient();
      const pool = await client.getPool('pool-123');

      expect(pool).toEqual([mockPoolData]);
    });
  });

  describe('Profile Methods', () => {
    it('getProfile should return user profile', async () => {
      const mockProfile = { address: TEST_ADDRESSES.user1, name: 'Test User' };
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [mockProfile],
              error: null,
            }),
          }),
        }),
      };
      (createSupabaseClient as jest.Mock).mockReturnValue(localMockSupabase);

      const client = new KleoClient();
      const profile = await client.getProfile(TEST_ADDRESSES.user1);

      expect(profile).toEqual([mockProfile]);
    });

    it('insertProfile should insert new profile', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: mockInsert,
        }),
      };
      (createSupabaseClient as jest.Mock).mockReturnValue(localMockSupabase);

      const client = new KleoClient();
      await client.insertProfile(TEST_ADDRESSES.user1, 'New User');

      expect(mockInsert).toHaveBeenCalledWith({
        address: TEST_ADDRESSES.user1,
        name: 'New User',
      });
    });

    it('updateProfile should update existing profile', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          update: mockUpdate,
        }),
      };
      (createSupabaseClient as jest.Mock).mockReturnValue(localMockSupabase);

      const client = new KleoClient();
      await client.updateProfile(TEST_ADDRESSES.user1, 'Updated Name');

      expect(mockUpdate).toHaveBeenCalledWith({ name: 'Updated Name' });
    });
  });
});
