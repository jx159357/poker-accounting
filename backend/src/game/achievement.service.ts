import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from '../entities/achievement.entity';
import { UserAchievement } from '../entities/user-achievement.entity';
import { GamePlayer } from '../entities/game-player.entity';

const ACHIEVEMENT_SEEDS = [
  { code: 'first_game', name: '初次牌局', description: '完成第1场游戏', icon: '🎮', condition: { type: 'total_games', value: 1 } },
  { code: 'first_win', name: '首次胜利', description: '赢得第1场游戏', icon: '🎉', condition: { type: 'total_wins', value: 1 } },
  { code: 'win_streak_3', name: '三连胜', description: '连续赢得3场游戏', icon: '🔥', condition: { type: 'win_streak', value: 3 } },
  { code: 'win_streak_5', name: '五连胜', description: '连续赢得5场游戏', icon: '⚡', condition: { type: 'win_streak', value: 5 } },
  { code: 'total_10', name: '十场老手', description: '累计完成10场游戏', icon: '🃏', condition: { type: 'total_games', value: 10 } },
  { code: 'total_50', name: '五十场元老', description: '累计完成50场游戏', icon: '👑', condition: { type: 'total_games', value: 50 } },
  { code: 'high_score_100', name: '大赢家', description: '单局积分超过100', icon: '💰', condition: { type: 'high_score', value: 100 } },
  { code: 'night_owl', name: '夜猫子', description: '凌晨0-5点完成游戏', icon: '🦉', condition: { type: 'night_game', value: true } },
  { code: 'social_butterfly', name: '社交达人', description: '与10个不同对手对战', icon: '🦋', condition: { type: 'unique_opponents', value: 10 } },
];

@Injectable()
export class AchievementService implements OnModuleInit {
  constructor(
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private userAchievementRepository: Repository<UserAchievement>,
    @InjectRepository(GamePlayer)
    private playerRepository: Repository<GamePlayer>,
  ) {}

  async onModuleInit() {
    for (const seed of ACHIEVEMENT_SEEDS) {
      const existing = await this.achievementRepository.findOne({
        where: { code: seed.code },
      });
      if (!existing) {
        await this.achievementRepository.save(
          this.achievementRepository.create(seed),
        );
      } else {
        Object.assign(existing, seed);
        await this.achievementRepository.save(existing);
      }
    }
  }

  async checkAndUnlockAchievements(userId: number): Promise<UserAchievement[]> {
    const allAchievements = await this.achievementRepository.find();
    const unlocked = await this.userAchievementRepository.find({
      where: { userId },
    });
    const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

    const players = await this.playerRepository.find({
      where: { userId },
      relations: ['game', 'game.players', 'game.players.user'],
    });
    const endedPlayers = players.filter((p) => p.game.status === 'ended');

    if (endedPlayers.length === 0) return [];

    const totalGames = endedPlayers.length;
    const totalWins = endedPlayers.filter((p) => Number(p.balance) > 0).length;
    const maxSingleScore = Math.max(...endedPlayers.map((p) => Number(p.balance)));

    // 最长连胜
    const sorted = [...endedPlayers].sort(
      (a, b) => new Date(a.game.createdAt).getTime() - new Date(b.game.createdAt).getTime(),
    );
    let bestStreak = 0;
    let tempStreak = 0;
    for (const p of sorted) {
      if (Number(p.balance) > 0) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // 夜间游戏
    const hasNightGame = endedPlayers.some((p) => {
      const hour = new Date(p.game.createdAt).getHours();
      return hour >= 0 && hour < 5;
    });

    // 独特对手
    const opponentSet = new Set<string>();
    for (const p of endedPlayers) {
      for (const other of p.game.players) {
        if (other.userId !== userId) {
          const id = other.userId ? `user_${other.userId}` : other.guestId;
          if (id) opponentSet.add(id);
        }
      }
    }

    const newlyUnlocked: UserAchievement[] = [];

    for (const achievement of allAchievements) {
      if (unlockedIds.has(achievement.id)) continue;

      const cond = achievement.condition;
      let met = false;

      switch (cond.type) {
        case 'total_games':
          met = totalGames >= cond.value;
          break;
        case 'total_wins':
          met = totalWins >= cond.value;
          break;
        case 'win_streak':
          met = bestStreak >= cond.value;
          break;
        case 'high_score':
          met = maxSingleScore > cond.value;
          break;
        case 'night_game':
          met = hasNightGame;
          break;
        case 'unique_opponents':
          met = opponentSet.size >= cond.value;
          break;
      }

      if (met) {
        const ua = this.userAchievementRepository.create({
          userId,
          achievementId: achievement.id,
        });
        try {
          const saved = await this.userAchievementRepository.save(ua);
          newlyUnlocked.push(saved);
        } catch {
          // Unique constraint = already unlocked
        }
      }
    }

    return newlyUnlocked;
  }

  async getUserAchievements(userId: number): Promise<any[]> {
    const allAchievements = await this.achievementRepository.find();
    const unlocked = await this.userAchievementRepository.find({
      where: { userId },
    });
    const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

    return allAchievements.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      description: a.description,
      icon: a.icon,
      unlocked: unlockedMap.has(a.id),
      unlockedAt: unlockedMap.get(a.id) || null,
    }));
  }
}
