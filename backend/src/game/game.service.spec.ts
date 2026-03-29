import { GameService } from './game.service';

const createRepositoryMock = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('GameService', () => {
  let service: GameService;
  let gameRepository: ReturnType<typeof createRepositoryMock>;
  let playerRepository: ReturnType<typeof createRepositoryMock>;
  let recordRepository: ReturnType<typeof createRepositoryMock>;
  let userRepository: ReturnType<typeof createRepositoryMock>;

  beforeEach(() => {
    gameRepository = createRepositoryMock();
    playerRepository = createRepositoryMock();
    recordRepository = createRepositoryMock();
    userRepository = createRepositoryMock();

    service = new GameService(
      gameRepository as any,
      playerRepository as any,
      recordRepository as any,
      userRepository as any,
      {
        checkAndUnlockAchievements: jest.fn(),
      } as any,
    );
  });

  describe('getOpponentStats', () => {
    it('aggregates direct head-to-head score instead of duplicating whole-game balance', async () => {
      userRepository.findOne.mockResolvedValue({ id: 1, username: 'me' });

      const me = { id: 1, userId: 1, user: { username: 'me' }, name: 'Me', balance: 120 };
      const alice = {
        id: 2,
        userId: 2,
        user: { username: 'alice', nickname: 'Alice' },
        name: 'Alice Table',
        balance: -50,
      };
      const bob = {
        id: 3,
        guestId: 'guest_bob',
        name: 'Bob',
        balance: -70,
      };

      playerRepository.find.mockResolvedValue([
        {
          ...me,
          game: {
            status: 'ended',
            createdAt: new Date('2026-03-20T12:00:00Z'),
            players: [me, alice, bob],
            gameRecords: [
              { amount: 50, fromPlayer: me, toPlayer: alice },
              { amount: 10, fromPlayer: alice, toPlayer: me },
              { amount: 30, fromPlayer: bob, toPlayer: me },
            ],
          },
        },
      ]);

      const stats = await service.getOpponentStats('user_me', 'user');

      expect(stats).toEqual([
        expect.objectContaining({
          opponentId: 'guest_bob',
          opponentName: 'Bob',
          opponentType: 'guest',
          gamesPlayed: 1,
          myWins: 1,
          myLosses: 0,
          myDraws: 0,
          myNetScore: 30,
          avgNetScore: 30,
        }),
        expect.objectContaining({
          opponentId: 'user_alice',
          opponentName: 'Alice',
          opponentType: 'user',
          gamesPlayed: 1,
          myWins: 0,
          myLosses: 1,
          myDraws: 0,
          myNetScore: -40,
          avgNetScore: -40,
        }),
      ]);
    });

    it('keeps same-name opponents separate and counts no-direct-transfer games as draws', async () => {
      userRepository.findOne.mockResolvedValue({ id: 1, username: 'me' });

      const gameOneMe = { id: 11, userId: 1, user: { username: 'me' }, name: 'Me', balance: 20 };
      const registeredAlex = {
        id: 12,
        userId: 2,
        user: { username: 'alex', nickname: 'Alex' },
        name: 'Alex',
        balance: -20,
      };

      const gameTwoMe = { id: 21, userId: 1, user: { username: 'me' }, name: 'Me', balance: 0 };
      const guestAlex = {
        id: 22,
        guestId: 'guest_alex',
        name: 'Alex',
        balance: 0,
      };

      playerRepository.find.mockResolvedValue([
        {
          ...gameOneMe,
          game: {
            status: 'ended',
            createdAt: new Date('2026-03-18T12:00:00Z'),
            players: [gameOneMe, registeredAlex],
            gameRecords: [{ amount: 20, fromPlayer: registeredAlex, toPlayer: gameOneMe }],
          },
        },
        {
          ...gameTwoMe,
          game: {
            status: 'ended',
            createdAt: new Date('2026-03-21T12:00:00Z'),
            players: [gameTwoMe, guestAlex],
            gameRecords: [],
          },
        },
      ]);

      const stats = await service.getOpponentStats('user_me', 'user');

      expect(stats).toHaveLength(2);
      expect(stats).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            opponentId: 'user_alex',
            opponentName: 'Alex',
            gamesPlayed: 1,
            myWins: 1,
            myLosses: 0,
            myDraws: 0,
            myNetScore: 20,
          }),
          expect.objectContaining({
            opponentId: 'guest_alex',
            opponentName: 'Alex',
            gamesPlayed: 1,
            myWins: 0,
            myLosses: 0,
            myDraws: 1,
            myNetScore: 0,
          }),
        ]),
      );
    });
  });

  describe('getMyGames', () => {
    it('keeps active rooms and only recent ended rooms by default for registered users', async () => {
      userRepository.findOne.mockResolvedValue({ id: 1, username: 'me' });

      playerRepository.find.mockResolvedValue([
        {
          balance: 50,
          game: {
            id: 1,
            name: 'Active Room',
            roomCode: 'ACTIVE1',
            gameType: 'Holdem',
            status: 'active',
            createdAt: new Date(),
            players: [{}, {}],
          },
        },
        {
          balance: -10,
          game: {
            id: 2,
            name: 'Recent Ended',
            roomCode: 'ENDED30',
            gameType: 'Holdem',
            status: 'ended',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            players: [{}, {}, {}],
          },
        },
        {
          balance: 99,
          game: {
            id: 3,
            name: 'Very Old',
            roomCode: 'OLD999',
            gameType: 'Mahjong',
            status: 'ended',
            createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
            players: [{}],
          },
        },
      ]);

      const result = await service.getMyGames('user_me', 'user', undefined, {
        userId: 1,
        username: 'me',
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          roomCode: 'ACTIVE1',
          status: 'active',
        }),
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          roomCode: 'ENDED30',
          status: 'ended',
        }),
      );
    });
  });

  describe('addScore', () => {
    it('rejects unauthenticated spoofing of registered user operations', async () => {
      gameRepository.findOne.mockResolvedValue({
        roomCode: 'ROOM1',
        status: 'active',
        players: [{ id: 1 }, { id: 2 }],
      });

      playerRepository.findOne
        .mockResolvedValueOnce({ id: 1, userId: 10, guestId: null })
        .mockResolvedValueOnce({ id: 2, guestId: 'guest_2', userId: null });

      await expect(
        service.addScore('ROOM1', 1, 2, 10, 'test', 'user_fake'),
      ).rejects.toThrow();
    });
  });

  describe('cleanupEmptyRooms', () => {
    it('deletes only inactive short-handed rooms based on latest activity', async () => {
      const now = Date.now();
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            roomCode: 'STALE1',
            status: 'active',
            createdAt: new Date(now - 6 * 60 * 60 * 1000),
            updatedAt: new Date(now - 5 * 60 * 60 * 1000),
            players: [{ joinedAt: new Date(now - 5 * 60 * 60 * 1000) }],
            gameRecords: [],
          },
          {
            roomCode: 'RECENTJOIN',
            status: 'active',
            createdAt: new Date(now - 8 * 60 * 60 * 1000),
            updatedAt: new Date(now - 8 * 60 * 60 * 1000),
            players: [{ joinedAt: new Date(now - 30 * 60 * 1000) }],
            gameRecords: [],
          },
          {
            roomCode: 'TWOPLAYER',
            status: 'active',
            createdAt: new Date(now - 8 * 60 * 60 * 1000),
            updatedAt: new Date(now - 8 * 60 * 60 * 1000),
            players: [
              { joinedAt: new Date(now - 8 * 60 * 60 * 1000) },
              { joinedAt: new Date(now - 10 * 60 * 1000) },
            ],
            gameRecords: [],
          },
        ]),
      };

      gameRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.cleanupEmptyRooms();

      expect(gameRepository.remove).toHaveBeenCalledWith([
        expect.objectContaining({ roomCode: 'STALE1' }),
      ]);
    });
  });
});
