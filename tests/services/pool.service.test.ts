import * as PoolService from '../../src/services/pool.service';
import { createMockSupabaseClient, createMockDedotClient, createMockContract, mockPoolData } from '../mocks';
import { Contract } from 'dedot/contracts';

// Mock the Contract class
jest.mock('dedot/contracts', () => ({
  Contract: jest.fn(),
}));

describe('PoolService', () => {
  let mockDedotClient: ReturnType<typeof createMockDedotClient>;

  beforeEach(() => {
    mockDedotClient = createMockDedotClient();
    jest.clearAllMocks();
  });

  describe('getPools', () => {
    it('should return all pools from supabase', async () => {
      const mockPools = [mockPoolData, { ...mockPoolData, id: 'pool-456' }];
      const localMockSupabase = createMockSupabaseClient({ selectData: mockPools });
      
      // Override the from mock for this test
      localMockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockPools,
          error: null,
        }),
      });

      const result = await PoolService.getPools(localMockSupabase as any);

      expect(localMockSupabase.from).toHaveBeenCalledWith('pools');
      expect(result).toEqual(mockPools);
    });

    it('should return empty array when no pools exist', async () => {
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      };

      const result = await PoolService.getPools(localMockSupabase as any);

      expect(result).toEqual([]);
    });

    it('should throw error when supabase returns error', async () => {
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      };

      await expect(PoolService.getPools(localMockSupabase as any)).rejects.toThrow(
        'Error fetching pools: Database error'
      );
    });
  });

  describe('getPool', () => {
    it('should return a specific pool by id', async () => {
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

      const result = await PoolService.getPool(localMockSupabase as any, 'pool-123');

      expect(localMockSupabase.from).toHaveBeenCalledWith('pools');
      expect(result).toEqual([mockPoolData]);
    });

    it('should return empty array when pool not found', async () => {
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      };

      const result = await PoolService.getPool(localMockSupabase as any, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should throw error when supabase returns error', async () => {
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      };

      await expect(PoolService.getPool(localMockSupabase as any, 'pool-123')).rejects.toThrow(
        'Error fetching pools: Not found'
      );
    });
  });

  describe('getPoolState', () => {
    it('should return pool state from config contract', async () => {
      const mockContract = createMockContract();
      (Contract as jest.Mock).mockImplementation(() => mockContract);

      const localMockSupabase = {
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

      const result = await PoolService.getPoolState(
        localMockSupabase as any,
        mockDedotClient as any,
        {},
        'pool-123'
      );

      expect(result).toEqual({
        baseInterestRate: '100',
        optimalUtilization: '80',
        slope1: '4',
        slope2: '75',
        boost: '10',
        minStarsToVouch: 3,
        cooldownPeriod: '86400',
        exposureCap: '1000000000000',
        reserveFactor: 10,
        maxRate: '200',
      });
    });

    it('should throw error when pool not found', async () => {
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Pool not found' },
              }),
            }),
          }),
        }),
      };

      await expect(
        PoolService.getPoolState(localMockSupabase as any, mockDedotClient as any, {}, 'pool-123')
      ).rejects.toThrow('Error fetching pool: Pool not found');
    });

    it('should throw error when config contract address not found', async () => {
      const poolWithoutConfig = { ...mockPoolData, contracts: {} };
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: poolWithoutConfig,
                error: null,
              }),
            }),
          }),
        }),
      };

      await expect(
        PoolService.getPoolState(localMockSupabase as any, mockDedotClient as any, {}, 'pool-123')
      ).rejects.toThrow('Config contract address not found in pool contracts');
    });
  });
});
