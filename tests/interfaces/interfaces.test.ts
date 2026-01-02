import { BackedPosition, VouchInfo, BorrowerInfo, Loan } from '../../src/interfaces';

describe('Interfaces', () => {
  describe('BackedPosition', () => {
    it('should correctly type a backed position object', () => {
      const backedPosition: BackedPosition = {
        borrower: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        stakedStars: 5,
        stakedCapital: '1000000000000',
        createdAt: '1704067200',
        status: 'Active',
      };

      expect(backedPosition.borrower).toBeDefined();
      expect(backedPosition.stakedStars).toBe(5);
      expect(backedPosition.stakedCapital).toBe('1000000000000');
      expect(backedPosition.status).toBe('Active');
    });

    it('should accept all valid status values', () => {
      const statuses: BackedPosition['status'][] = ['Active', 'Fulfilled', 'Defaulted'];

      statuses.forEach((status) => {
        const position: BackedPosition = {
          borrower: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          stakedStars: 3,
          stakedCapital: '500000000000',
          createdAt: '1704067200',
          status,
        };
        expect(position.status).toBe(status);
      });
    });
  });

  describe('VouchInfo', () => {
    it('should correctly type a vouch info object', () => {
      const vouchInfo: VouchInfo = {
        voucher: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        stakedStars: 3,
        stakedCapital: '500000000000',
        createdAt: '1704067200',
        status: 'Active',
      };

      expect(vouchInfo.voucher).toBeDefined();
      expect(vouchInfo.stakedStars).toBe(3);
      expect(vouchInfo.stakedCapital).toBe('500000000000');
      expect(vouchInfo.status).toBe('Active');
    });
  });

  describe('BorrowerInfo', () => {
    it('should correctly type a borrower info object', () => {
      const borrowerInfo: BorrowerInfo = {
        stars: 5,
        starsAtStake: 2,
        canVouch: true,
        banned: false,
        creationTime: '1704067200',
        loanHistoryCount: 3,
        vouchHistoryCount: 2,
        totalExposure: '5000000000000',
      };

      expect(borrowerInfo.stars).toBe(5);
      expect(borrowerInfo.starsAtStake).toBe(2);
      expect(borrowerInfo.canVouch).toBe(true);
      expect(borrowerInfo.banned).toBe(false);
      expect(borrowerInfo.loanHistoryCount).toBe(3);
      expect(borrowerInfo.vouchHistoryCount).toBe(2);
      expect(borrowerInfo.totalExposure).toBe('5000000000000');
    });

    it('should handle banned user', () => {
      const borrowerInfo: BorrowerInfo = {
        stars: 5,
        starsAtStake: 0,
        canVouch: false,
        banned: true,
        creationTime: '1704067200',
        loanHistoryCount: 0,
        vouchHistoryCount: 0,
        totalExposure: '0',
      };

      expect(borrowerInfo.canVouch).toBe(false);
      expect(borrowerInfo.banned).toBe(true);
    });
  });

  describe('Loan', () => {
    it('should correctly type a loan object', () => {
      const loan: Loan = {
        amount: '1000000000000',
        repaid: false,
      };

      expect(loan.amount).toBe('1000000000000');
      expect(loan.repaid).toBe(false);
    });

    it('should handle repaid loan', () => {
      const loan: Loan = {
        amount: '2000000000000',
        repaid: true,
      };

      expect(loan.amount).toBe('2000000000000');
      expect(loan.repaid).toBe(true);
    });
  });
});
