/**
 * Mock factories and utilities for testing
 */

export const mockPoolData = {
  id: 'pool-123',
  name: 'Test Pool',
  contracts: {
    config: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    lending_pool: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    vouch: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
    reputation: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
  },
  created_at: '2024-01-01T00:00:00.000Z',
};

export const mockUserReputation = {
  stars: 5,
  starsAtStake: 2,
  banned: false,
  creationTime: BigInt(1704067200),
  loanHistory: [],
  vouchHistory: [],
};

export const mockRelationship = {
  stakedStars: 3,
  stakedCapital: BigInt(1000000000000),
  createdAt: BigInt(1704067200),
  status: 'Active' as const,
};

export const mockLoan = {
  amount: '1000000000000',
  repaid: false,
};

/**
 * Creates a mock Supabase client
 */
export function createMockSupabaseClient(overrides: {
  selectData?: any;
  selectError?: any;
  insertError?: any;
  updateError?: any;
} = {}) {
  const mockSelect = jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: overrides.selectData ?? mockPoolData,
        error: overrides.selectError ?? null,
      }),
    }),
  });

  const mockSelectAll = jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({
      data: overrides.selectData ?? [mockPoolData],
      error: overrides.selectError ?? null,
    }),
  });

  const mockInsert = jest.fn().mockResolvedValue({
    error: overrides.insertError ?? null,
  });

  const mockUpdate = jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({
      error: overrides.updateError ?? null,
    }),
  });

  return {
    from: jest.fn((table: string) => ({
      select: table === 'pools' ? mockSelect : mockSelectAll,
      insert: mockInsert,
      update: mockUpdate,
    })),
    _mocks: {
      select: mockSelect,
      selectAll: mockSelectAll,
      insert: mockInsert,
      update: mockUpdate,
    },
  };
}

/**
 * Creates a mock Dedot client
 */
export function createMockDedotClient() {
  return {
    disconnect: jest.fn().mockResolvedValue(undefined),
    query: {},
  };
}

/**
 * Creates a mock contract with storage
 */
export function createMockContract(storageData: Record<string, any> = {}) {
  const mockStorage = {
    lazy: jest.fn().mockReturnValue({
      relationships: {
        get: jest.fn().mockImplementation(([voucher, borrower]: [string, string]) => {
          return Promise.resolve(storageData.relationships?.[`${voucher}-${borrower}`] ?? null);
        }),
      },
      borrowerVouchers: {
        get: jest.fn().mockImplementation((borrower: string) => {
          return Promise.resolve(storageData.borrowerVouchers?.[borrower] ?? []);
        }),
      },
      borrowerExposure: {
        get: jest.fn().mockImplementation((borrower: string) => {
          return Promise.resolve(storageData.borrowerExposure?.[borrower] ?? null);
        }),
      },
      userReps: {
        get: jest.fn().mockImplementation((address: string) => {
          return Promise.resolve(storageData.userReps?.[address] ?? null);
        }),
      },
    }),
  };

  const mockQuery = {
    getUserDeposit: jest.fn().mockResolvedValue({
      data: storageData.userDeposit ?? BigInt(0),
    }),
    getBaseInterestRate: jest.fn().mockResolvedValue({ data: BigInt(100) }),
    getOptimalUtilization: jest.fn().mockResolvedValue({ data: BigInt(80) }),
    getSlope1: jest.fn().mockResolvedValue({ data: BigInt(4) }),
    getSlope2: jest.fn().mockResolvedValue({ data: BigInt(75) }),
    getBoost: jest.fn().mockResolvedValue({ data: BigInt(10) }),
    getMinStarsToVouch: jest.fn().mockResolvedValue({ data: 3 }),
    getCooldownPeriod: jest.fn().mockResolvedValue({ data: BigInt(86400) }),
    getExposureCap: jest.fn().mockResolvedValue({ data: BigInt(1000000000000) }),
    getReserveFactor: jest.fn().mockResolvedValue({ data: 10 }),
    getMaxRate: jest.fn().mockResolvedValue({ data: BigInt(200) }),
  };

  return {
    storage: mockStorage,
    query: mockQuery,
  };
}

/**
 * Common test addresses
 */
export const TEST_ADDRESSES = {
  user1: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  user2: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
  user3: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
  pool: 'pool-123',
};
