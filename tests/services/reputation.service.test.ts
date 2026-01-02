import * as ReputationService from '../../src/services/reputation.service';
import { createMockDedotClient, mockPoolData, mockUserReputation, TEST_ADDRESSES } from '../mocks';
import { Contract } from 'dedot/contracts';

// Mock the Contract class
jest.mock('dedot/contracts', () => ({
  Contract: jest.fn(),
}));

describe('ReputationService', () => {
  let mockDedotClient: ReturnType<typeof createMockDedotClient>;

  beforeEach(() => {
    mockDedotClient = createMockDedotClient();
    jest.clearAllMocks();
  });

  describe('getLenderExposure', () => {
    it('should return user reputation from contract', async () => {
      const mockStorage = {
        lazy: jest.fn().mockReturnValue({
          userReps: {
            get: jest.fn().mockResolvedValue(mockUserReputation),
          },
        }),
      };
      (Contract as jest.Mock).mockImplementation(() => ({ storage: mockStorage }));

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

      const result = await ReputationService.getLenderExposure(
        localMockSupabase as any,
        mockDedotClient as any,
        {},
        TEST_ADDRESSES.pool,
        TEST_ADDRESSES.user1
      );

      expect(result).toEqual(mockUserReputation);
    });

    it('should return undefined when user has no reputation', async () => {
      const mockStorage = {
        lazy: jest.fn().mockReturnValue({
          userReps: {
            get: jest.fn().mockResolvedValue(undefined),
          },
        }),
      };
      (Contract as jest.Mock).mockImplementation(() => ({ storage: mockStorage }));

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

      const result = await ReputationService.getLenderExposure(
        localMockSupabase as any,
        mockDedotClient as any,
        {},
        TEST_ADDRESSES.pool,
        TEST_ADDRESSES.user1
      );

      expect(result).toBeUndefined();
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
        ReputationService.getLenderExposure(
          localMockSupabase as any,
          mockDedotClient as any,
          {},
          TEST_ADDRESSES.pool,
          TEST_ADDRESSES.user1
        )
      ).rejects.toThrow('Error fetching pool: Pool not found');
    });

    it('should throw error when reputation contract not found', async () => {
      const poolWithoutReputation = { ...mockPoolData, contracts: {} };
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: poolWithoutReputation,
                error: null,
              }),
            }),
          }),
        }),
      };

      await expect(
        ReputationService.getLenderExposure(
          localMockSupabase as any,
          mockDedotClient as any,
          {},
          TEST_ADDRESSES.pool,
          TEST_ADDRESSES.user1
        )
      ).rejects.toThrow('Reputation contract address not found in pool contracts');
    });
  });

  describe('getBorrowerInfo', () => {
    it('should return combined borrower info', async () => {
      const reputationStorage = {
        lazy: jest.fn().mockReturnValue({
          userReps: {
            get: jest.fn().mockResolvedValue(mockUserReputation),
          },
        }),
      };

      const vouchStorage = {
        lazy: jest.fn().mockReturnValue({
          borrowerExposure: {
            get: jest.fn().mockResolvedValue(BigInt(1000000000000)),
          },
        }),
      };

      const configQuery = {
        getMinStarsToVouch: jest.fn().mockResolvedValue({ data: 3 }),
      };

      let contractCallCount = 0;
      (Contract as jest.Mock).mockImplementation(() => {
        contractCallCount++;
        if (contractCallCount === 1) return { storage: reputationStorage };
        if (contractCallCount === 2) return { storage: vouchStorage };
        return { query: configQuery };
      });

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

      const result = await ReputationService.getBorrowerInfo(
        localMockSupabase as any,
        mockDedotClient as any,
        { config: {}, reputation: {}, vouch: {} },
        TEST_ADDRESSES.pool,
        TEST_ADDRESSES.user1
      );

      expect(result).toEqual({
        stars: 5,
        starsAtStake: 2,
        canVouch: true,
        banned: false,
        creationTime: mockUserReputation.creationTime.toString(),
        loanHistoryCount: 0,
        vouchHistoryCount: 0,
        totalExposure: '1000000000000',
      });
    });

    it('should return undefined when user has no reputation', async () => {
      const reputationStorage = {
        lazy: jest.fn().mockReturnValue({
          userReps: {
            get: jest.fn().mockResolvedValue(undefined),
          },
        }),
      };

      const vouchStorage = {
        lazy: jest.fn().mockReturnValue({
          borrowerExposure: {
            get: jest.fn().mockResolvedValue(BigInt(0)),
          },
        }),
      };

      const configQuery = {
        getMinStarsToVouch: jest.fn().mockResolvedValue({ data: 3 }),
      };

      let contractCallCount = 0;
      (Contract as jest.Mock).mockImplementation(() => {
        contractCallCount++;
        if (contractCallCount === 1) return { storage: reputationStorage };
        if (contractCallCount === 2) return { storage: vouchStorage };
        return { query: configQuery };
      });

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

      const result = await ReputationService.getBorrowerInfo(
        localMockSupabase as any,
        mockDedotClient as any,
        { config: {}, reputation: {}, vouch: {} },
        TEST_ADDRESSES.pool,
        TEST_ADDRESSES.user1
      );

      expect(result).toBeUndefined();
    });

    it('should set canVouch to false when user is banned', async () => {
      const bannedUser = { ...mockUserReputation, banned: true };
      const reputationStorage = {
        lazy: jest.fn().mockReturnValue({
          userReps: {
            get: jest.fn().mockResolvedValue(bannedUser),
          },
        }),
      };

      const vouchStorage = {
        lazy: jest.fn().mockReturnValue({
          borrowerExposure: {
            get: jest.fn().mockResolvedValue(BigInt(0)),
          },
        }),
      };

      const configQuery = {
        getMinStarsToVouch: jest.fn().mockResolvedValue({ data: 3 }),
      };

      let contractCallCount = 0;
      (Contract as jest.Mock).mockImplementation(() => {
        contractCallCount++;
        if (contractCallCount === 1) return { storage: reputationStorage };
        if (contractCallCount === 2) return { storage: vouchStorage };
        return { query: configQuery };
      });

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

      const result = await ReputationService.getBorrowerInfo(
        localMockSupabase as any,
        mockDedotClient as any,
        { config: {}, reputation: {}, vouch: {} },
        TEST_ADDRESSES.pool,
        TEST_ADDRESSES.user1
      );

      expect(result?.canVouch).toBe(false);
      expect(result?.banned).toBe(true);
    });

    it('should set canVouch to false when user has insufficient stars', async () => {
      const lowStarsUser = { ...mockUserReputation, stars: 1 };
      const reputationStorage = {
        lazy: jest.fn().mockReturnValue({
          userReps: {
            get: jest.fn().mockResolvedValue(lowStarsUser),
          },
        }),
      };

      const vouchStorage = {
        lazy: jest.fn().mockReturnValue({
          borrowerExposure: {
            get: jest.fn().mockResolvedValue(BigInt(0)),
          },
        }),
      };

      const configQuery = {
        getMinStarsToVouch: jest.fn().mockResolvedValue({ data: 3 }),
      };

      let contractCallCount = 0;
      (Contract as jest.Mock).mockImplementation(() => {
        contractCallCount++;
        if (contractCallCount === 1) return { storage: reputationStorage };
        if (contractCallCount === 2) return { storage: vouchStorage };
        return { query: configQuery };
      });

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

      const result = await ReputationService.getBorrowerInfo(
        localMockSupabase as any,
        mockDedotClient as any,
        { config: {}, reputation: {}, vouch: {} },
        TEST_ADDRESSES.pool,
        TEST_ADDRESSES.user1
      );

      expect(result?.canVouch).toBe(false);
      expect(result?.stars).toBe(1);
    });
  });
});
