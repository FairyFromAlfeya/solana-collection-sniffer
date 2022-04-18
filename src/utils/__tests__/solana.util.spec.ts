import { getNftData } from '../solana.util';

describe('SolanaUtil', () => {
  describe('getData()', () => {
    it('should return data', () =>
      expect(
        getNftData('5Xy3WN4Kvch51VfL96wVdtrFd4c5KCidwnbLQw7WkNiP').then(
          (res) => {
            console.log(res.parsedData);
            return res;
          },
        ),
      ).resolves.toStrictEqual({ data: '' }));
  });
});
