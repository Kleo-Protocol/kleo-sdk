import * as VouchService from '../../src/services/vouch.service';
import { createMockDedotClient, mockPoolData, mockRelationship, TEST_ADDRESSES } from '../mocks';
import { Contract } from 'dedot/contracts';

// Mock the Contract class
jest.mock('dedot/contracts', () => ({
  Contract: jest.fn(),
}));

describe('VouchService', () => {
  let mockDedotClient: ReturnType<typeof createMockDedotClient>;

  beforeEach(() => {
    mockDedotClient = createMockDedotClient();
    jest.clearAllMocks();
  });

  describe('getVouchRelationship', () => {
    it('should return vouch relationship between voucher and borrower', async () => {
      const mockStorage = {
        lazy: jest.fn().mockReturnValue({
          relationships: {
            get: jest.fn().mockResolvedValue(mockRelationship),
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

      const result = await VouchService.getVouchRelationship(
        localMockSupabase as any,
        mockDedotClient as any,
        {},
        TEST_ADDRESSES.pool,
        TEST_ADDRESSES.user1,
        TEST_ADDRESSES.user2
      );

      expect(result).toEqual({
        borrower: TEST_ADDRESSES.user2,
        stakedStars: mockRelationship.stakedStars,
        stakedCapital: mockRelationship.stakedCapital.toString(),
        createdAt: mockRelationship.createdAt.toString(),
        status: mockRelationship.status,
      });
    });

    it('should return undefined when relationship not found', async () => {
      const mockStorage = {
        lazy: jest.fn().mockReturnValue({
          relationships: {
            get: jest.fn().mockResolvedValue(null),
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

      const result = await VouchService.getVouchRelationship(
        localMockSupabase as any,
        mockDedotClient as any,
        {},
        TEST_ADDRESSES.pool,
        TEST_ADDRESSES.user1,
        TEST_ADDRESSES.user2
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
        VouchService.getVouchRelationship(
          localMockSupabase as any,
          mockDedotClient as any,
          {},
          TEST_ADDRESSES.pool,
          TEST_ADDRESSES.user1,
          TEST_ADDRESSES.user2
        )
      ).rejects.toThrow('Error fetching pool: Pool not found');
    });

    it('should throw error when vouch contract not found', async () => {
      const poolWithoutVouch = { ...mockPoolData, contracts: {} };
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: poolWithoutVouch,
                error: null,
              }),
            }),
          }),
        }),
      };

      await expect(
        VouchService.getVouchRelationship(
          localMockSupabase as any,
          mockDedotClient as any,
          {},
          TEST_ADDRESSES.pool,
          TEST_ADDRESSES.user1,
          TEST_ADDRESSES.user2
        )
      ).rejects.toThrow('Vouch contract address not found in pool contracts');
    });
  });

  describe('getBorrowerVouches', () => {
    it('should return all vouches for a borrower', async () => {
      const vouchers = [
        { toString: () => TEST_ADDRESSES.user1 },
        { toString: () => TEST_ADDRESSES.user3 },
      ];

      const mockStorage = {
        lazy: jest.fn().mockReturnValue({
          borrowerVouchers: {
            get: jest.fn().mockResolvedValue(vouchers),
          },
          relationships: {
            get: jest.fn().mockResolvedValue(mockRelationship),
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

      const result = await VouchService.getBorrowerVouches(
        localMockSupabase as any,
        mockDedotClient as any,
        {},
        TEST_ADDRESSES.pool,
        TEST_ADDRESSES.user2
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        voucher: TEST_ADDRESSES.user1,
        stakedStars: mockRelationship.stakedStars,
        stakedCapital: mockRelationship.stakedCapital.toString(),
        createdAt: mockRelationship.createdAt.toString(),
        status: mockRelationship.status,
      });
    });

    it('should return empty array when borrower has no vouches', async () => {
      const mockStorage = {
        lazy: jest.fn().mockReturnValue({
          borrowerVouchers: {
            get: jest.fn().mockResolvedValue([]),
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

      const result = await VouchService.getBorrowerVouches(
        localMockSupabase as any,
        mockDedotClient as any,
        {},
        TEST_ADDRESSES.pool,
        TEST_ADDRESSES.user2
      );

      expect(result).toEqual([]);
    });

    it('should filter out null relationships', async () => {
      const vouchers = [
        { toString: () => TEST_ADDRESSES.user1 },
        { toString: () => TEST_ADDRESSES.user3 },
      ];

      let callCount = 0;
      const mockStorage = {
        lazy: jest.fn().mockReturnValue({
          borrowerVouchers: {
            get: jest.fn().mockResolvedValue(vouchers),
          },
          relationships: {
            get: jest.fn().mockImplementation(() => {
              callCount++;
              // Return null for second voucher
              return callCount === 1 ? Promise.resolve(mockRelationship) : Promise.resolve(null);
            }),
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

      const result = await VouchService.getBorrowerVouches(
        localMockSupabase as any,
        mockDedotClient as any,
        {},
        TEST_ADDRESSES.pool,
        TEST_ADDRESSES.user2
      );

      expect(result).toHaveLength(1);
    });
  });
});
