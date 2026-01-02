import * as ProfileService from '../../src/services/profile.service';
import { TEST_ADDRESSES } from '../mocks';

describe('ProfileService', () => {
  describe('getProfile', () => {
    it('should return user profile from supabase', async () => {
      const mockProfile = {
        address: TEST_ADDRESSES.user1,
        name: 'Test User',
        created_at: '2024-01-01T00:00:00.000Z',
      };

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

      const result = await ProfileService.getProfile(localMockSupabase as any, TEST_ADDRESSES.user1);

      expect(localMockSupabase.from).toHaveBeenCalledWith('users');
      expect(result).toEqual([mockProfile]);
    });

    it('should return empty array when profile not found', async () => {
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

      const result = await ProfileService.getProfile(localMockSupabase as any, TEST_ADDRESSES.user1);

      expect(result).toEqual([]);
    });

    it('should throw error when supabase returns error', async () => {
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      };

      await expect(
        ProfileService.getProfile(localMockSupabase as any, TEST_ADDRESSES.user1)
      ).rejects.toThrow('Error fetching profile: Database error');
    });
  });

  describe('insertProfile', () => {
    it('should insert a new user profile', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: mockInsert,
        }),
      };

      await ProfileService.insertProfile(
        localMockSupabase as any,
        TEST_ADDRESSES.user1,
        'New User'
      );

      expect(localMockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockInsert).toHaveBeenCalledWith({
        address: TEST_ADDRESSES.user1,
        name: 'New User',
      });
    });

    it('should throw error when insert fails', async () => {
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockResolvedValue({
            error: { message: 'Insert failed' },
          }),
        }),
      };

      await expect(
        ProfileService.insertProfile(localMockSupabase as any, TEST_ADDRESSES.user1, 'New User')
      ).rejects.toThrow('Error inserting profile: Insert failed');
    });
  });

  describe('updateProfile', () => {
    it('should update an existing user profile', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          update: mockUpdate,
        }),
      };

      await ProfileService.updateProfile(
        localMockSupabase as any,
        TEST_ADDRESSES.user1,
        'Updated Name'
      );

      expect(localMockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockUpdate).toHaveBeenCalledWith({ name: 'Updated Name' });
    });

    it('should throw error when update fails', async () => {
      const localMockSupabase = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: { message: 'Update failed' },
            }),
          }),
        }),
      };

      await expect(
        ProfileService.updateProfile(localMockSupabase as any, TEST_ADDRESSES.user1, 'Updated Name')
      ).rejects.toThrow('Error updating profile: Update failed');
    });
  });
});
