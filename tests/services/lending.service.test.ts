import * as LendingService from '../../src/services/lending.service';
import { createMockDedotClient, createMockContract, mockPoolData, TEST_ADDRESSES } from '../mocks';
import { Contract } from 'dedot/contracts';

// Mock the Contract class
jest.mock('dedot/contracts', () => ({
  Contract: jest.fn(),
}));

describe('LendingService', () => {
  let mockDedotClient: ReturnType<typeof createMockDedotClient>;

  beforeEach(() => {
    mockDedotClient = createMockDedotClient();
    jest.clearAllMocks();
  });

  describe('getUserDeposit', () => {
    it('should return user deposit amount', async () => {
      const mockContract = createMockContract({
        userDeposit: BigInt(5000000000000),
      });
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

      const result = await LendingService.getUserDeposit(
        localMockSupabase as any,
        mockDedotClient as any,
        {},
        TEST_ADDRESSES.pool,
        TEST_ADDRESSES.user1
      );

      expect(result).toBe('5000000000000');
    });

    it('should return undefined when user has no deposit', async () => {
      const mockContract = {
        query: {
          getUserDeposit: jest.fn().mockResolvedValue({ data: undefined }),
        },
      };
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

      const result = await LendingService.getUserDeposit(
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
        LendingService.getUserDeposit(
          localMockSupabase as any,
          mockDedotClient as any,
          {},
          TEST_ADDRESSES.pool,
          TEST_ADDRESSES.user1
        )
      ).rejects.toThrow('Error fetching pool: Pool not found');
    });

    it('should throw error when lending_pool contract not found', async () => {
      const poolWithoutLending = { ...mockPoolData, contracts: {} };
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: poolWithoutLending,
                error: null,
              }),
            }),
          }),
        }),
      };

      await expect(
        LendingService.getUserDeposit(
          localMockSupabase as any,
          mockDedotClient as any,
          {},
          TEST_ADDRESSES.pool,
          TEST_ADDRESSES.user1
        )
      ).rejects.toThrow('LendingPool contract address not found in pool contracts');
    });
  });
});
