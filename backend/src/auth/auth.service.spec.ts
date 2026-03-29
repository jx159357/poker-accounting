import { AuthService } from './auth.service';

const createRepositoryMock = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  create: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: ReturnType<typeof createRepositoryMock>;
  let gameRepository: ReturnType<typeof createRepositoryMock>;
  let gamePlayerRepository: ReturnType<typeof createRepositoryMock>;
  let gameRecordRepository: ReturnType<typeof createRepositoryMock>;

  beforeEach(() => {
    userRepository = createRepositoryMock();
    gameRepository = createRepositoryMock();
    gamePlayerRepository = createRepositoryMock();
    gameRecordRepository = createRepositoryMock();

    service = new AuthService(
      userRepository as any,
      gameRepository as any,
      gamePlayerRepository as any,
      gameRecordRepository as any,
      { sign: jest.fn() } as any,
    );
  });

  it('merges duplicate guest players and reassigns related records', async () => {
    const game = { id: 11 };
    const guestPlayer = { id: 101, guestId: 'guest_1', balance: 25, game };
    const existingPlayer = { id: 202, userId: 9, balance: 40 };
    const recordFrom = { id: 1, fromPlayer: { id: 101 }, toPlayer: { id: 303 } };
    const recordTo = { id: 2, fromPlayer: { id: 404 }, toPlayer: { id: 101 } };

    gamePlayerRepository.find.mockResolvedValue([guestPlayer]);
    gamePlayerRepository.findOne.mockResolvedValue(existingPlayer);
    gameRecordRepository.find.mockResolvedValue([recordFrom, recordTo]);
    gamePlayerRepository.save.mockImplementation(async (value) => value);
    gameRecordRepository.save.mockImplementation(async (value) => value);
    gameRepository.createQueryBuilder.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    });

    await service.mergeGuestData(9, 'guest_1');

    expect(existingPlayer.balance).toBe(65);
    expect(gamePlayerRepository.save).toHaveBeenCalledWith(existingPlayer);
    expect(recordFrom.fromPlayer).toBe(existingPlayer);
    expect(recordTo.toPlayer).toBe(existingPlayer);
    expect(gameRecordRepository.save).toHaveBeenCalledWith([recordFrom, recordTo]);
    expect(gamePlayerRepository.remove).toHaveBeenCalledWith(guestPlayer);
  });
});
