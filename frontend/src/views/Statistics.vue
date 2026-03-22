<template>
  <div class="h-full flex flex-col bg-gray-50 overflow-hidden">
    <van-nav-bar title="数据统计" left-arrow @click-left="router.back()" />

    <van-loading v-if="loading" class="flex-1 flex items-center justify-center" />

    <div v-else-if="stats" class="flex-1 flex flex-col overflow-hidden min-h-0">
      <!-- Zone A: 固定统计条 -->
      <div class="flex-shrink-0 px-4 pt-4">
        <div class="stats-bar">
          <div class="stats-bar-item">
            <div class="stats-bar-value stats-bar-blue">{{ stats.totalGames }}</div>
            <div class="stats-bar-label">总场次</div>
          </div>
          <div class="stats-bar-item">
            <div class="stats-bar-value stats-bar-green">{{ stats.winRate }}%</div>
            <div class="stats-bar-label">胜率</div>
          </div>
          <div class="stats-bar-item">
            <div class="stats-bar-value stats-bar-purple">{{ stats.totalWins }}</div>
            <div class="stats-bar-label">胜场</div>
          </div>
          <div class="stats-bar-item">
            <div
              class="stats-bar-value"
              :class="stats.totalScore >= 0 ? 'stats-bar-green' : 'stats-bar-red'"
            >
              {{ stats.totalScore >= 0 ? '+' : '' }}{{ stats.totalScore }}
            </div>
            <div class="stats-bar-label">总积分</div>
          </div>
        </div>
      </div>

      <!-- Zone B: 可滚动详细区域 -->
      <div class="flex-1 overflow-y-auto min-h-0 p-4 pt-0">
        <div class="stats-content">

        <!-- 注册用户专属模块 -->
        <template v-if="!userStore.isGuest">
          <!-- 个人记录 (注册用户专属) -->
          <div v-if="stats.maxScore !== undefined" class="section-card">
            <div class="section-header" @click="toggleSection('personalRecords')">
              <h3 class="section-title">个人记录</h3>
              <van-icon :name="expanded.personalRecords ? 'arrow-up' : 'arrow-down'" size="16" color="#9CA3AF" />
            </div>
            <div v-if="expanded.personalRecords" class="section-body">
              <div class="type-list">
                <div class="type-item">
                  <div class="type-info">
                    <div class="type-name">最高单局积分</div>
                  </div>
                  <span class="record-value record-value-green">{{ stats.maxScore }}</span>
                </div>
                <div class="type-item">
                  <div class="type-info">
                    <div class="type-name">最低单局积分</div>
                  </div>
                  <span class="record-value record-value-red">{{ stats.minScore }}</span>
                </div>
                <div class="type-item">
                  <div class="type-info">
                    <div class="type-name">场均积分</div>
                  </div>
                  <span class="record-value">{{ stats.avgScore }}</span>
                </div>
                <div class="type-item">
                  <div class="type-info">
                    <div class="type-name">活跃天数</div>
                  </div>
                  <span class="record-value">{{ stats.activeDays }} 天</span>
                </div>
                <div class="type-item">
                  <div class="type-info">
                    <div class="type-name">首次游戏</div>
                  </div>
                  <span class="record-value">{{ stats.firstGameDate ? formatDate(stats.firstGameDate) : '-' }}</span>
                </div>
                <div class="type-item">
                  <div class="type-info">
                    <div class="type-name">当前状态</div>
                  </div>
                  <span class="record-value" :class="stats.currentStreak?.type === 'win' ? 'record-value-green' : stats.currentStreak?.type === 'loss' ? 'record-value-red' : ''">
                    {{ stats.currentStreak?.type === 'win' ? `${stats.currentStreak.count} 连胜` : stats.currentStreak?.type === 'loss' ? `${stats.currentStreak.count} 连败` : '无' }}
                  </span>
                </div>
                <div class="type-item">
                  <div class="type-info">
                    <div class="type-name">最长连胜</div>
                  </div>
                  <span class="record-value record-value-green">{{ stats.bestStreak }} 场</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Phase 2-E: 对手分析 -->
          <!-- 对手分析 (注册用户专属) -->
          <div v-if="opponents.length > 0" class="section-card">
            <div class="section-header" @click="toggleSection('opponents')">
              <h3 class="section-title">对手分析</h3>
              <van-icon :name="expanded.opponents ? 'arrow-up' : 'arrow-down'" size="16" color="#9CA3AF" />
            </div>
            <div v-if="expanded.opponents" class="section-body">
              <div class="type-list">
                <div v-for="opp in opponents.slice(0, 10)" :key="opp.opponentName" class="type-item">
                  <div class="type-info">
                    <div class="type-name">{{ opp.opponentName }}</div>
                    <div class="type-meta">
                      {{ opp.gamesPlayed }} 场 · 胜 {{ opp.myWins }} · 负 {{ opp.myLosses }}
                    </div>
                  </div>
                  <span :class="['score-badge-sm', opp.myNetScore >= 0 ? 'score-badge-positive' : 'score-badge-negative']">
                    {{ opp.myNetScore >= 0 ? '+' : '' }}{{ opp.myNetScore }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Phase 2-E: 排行榜 -->
          <!-- 排行榜 (注册用户专属) -->
          <div v-if="leaderboard.length > 0" class="section-card">
            <div class="section-header" @click="toggleSection('leaderboard')">
              <h3 class="section-title">排行榜</h3>
              <van-icon :name="expanded.leaderboard ? 'arrow-up' : 'arrow-down'" size="16" color="#9CA3AF" />
            </div>
            <div v-if="expanded.leaderboard" class="section-body">
              <div class="leaderboard-list">
                <div
                  v-for="(item, index) in leaderboard.slice(0, 10)"
                  :key="item.userId"
                  class="leaderboard-item"
                  :class="{ 'leaderboard-item-self': item.username === userStore.username }"
                >
                  <div class="leaderboard-rank" :class="index < 3 ? `rank-${index + 1}` : ''">
                    {{ index + 1 }}
                  </div>
                  <div class="leaderboard-info">
                    <div class="leaderboard-name">{{ item.nickname }}</div>
                    <div class="leaderboard-meta">{{ item.totalGames }} 场 · 胜率 {{ item.winRate }}%</div>
                  </div>
                  <span :class="['score-badge-sm', Number(item.totalScore) >= 0 ? 'score-badge-positive' : 'score-badge-negative']">
                    {{ Number(item.totalScore) >= 0 ? '+' : '' }}{{ item.totalScore }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 成就进度 (注册用户专属) -->
          <div v-if="achievements.length > 0" class="section-card">
            <div class="section-header" @click="toggleSection('achievementProgress')">
              <h3 class="section-title">成就进度</h3>
              <van-icon :name="expanded.achievementProgress ? 'arrow-up' : 'arrow-down'" size="16" color="#9CA3AF" />
            </div>
            <div v-if="expanded.achievementProgress" class="section-body">
              <div class="achievement-progress">
                <div class="achievement-summary">
                  已解锁 {{ achievements.filter(a => a.unlocked).length }} / {{ achievements.length }}
                </div>
                <van-progress
                  :percentage="Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100)"
                  color="#16A34A"
                  :show-pivot="false"
                  stroke-width="8"
                  class="mb-3"
                />
                <div class="achievement-list">
                  <div
                    v-for="ach in achievements"
                    :key="ach.code"
                    class="achievement-row"
                    :class="{ 'achievement-row-locked': !ach.unlocked }"
                  >
                    <span class="achievement-row-icon">{{ ach.icon }}</span>
                    <div class="achievement-row-info">
                      <div class="achievement-row-name">{{ ach.name }}</div>
                      <div class="achievement-row-desc">{{ ach.description }}</div>
                    </div>
                    <van-icon v-if="ach.unlocked" name="checked" color="#16A34A" size="18" />
                    <van-icon v-else name="lock" color="#D1D5DB" size="18" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 按游戏类型统计 -->
        <div v-if="stats.gameTypeStats && stats.gameTypeStats.length > 0" class="section-card">
          <div class="section-header" @click="toggleSection('gameType')">
            <h3 class="section-title">游戏类型统计</h3>
            <van-icon :name="expanded.gameType ? 'arrow-up' : 'arrow-down'" size="16" color="#9CA3AF" />
          </div>
          <div v-if="expanded.gameType" class="section-body">
            <div class="type-list">
              <div
                v-for="stat in stats.gameTypeStats"
                :key="stat.gameType"
                class="type-item"
              >
                <div class="type-info">
                  <div class="type-name">{{ stat.gameType }}</div>
                  <div class="type-meta">
                    {{ stat.count }} 场 · 胜率 {{ stat.winRate }}%
                  </div>
                </div>
                <span
                  :class="['score-badge-sm', stat.totalScore >= 0 ? 'score-badge-positive' : 'score-badge-negative']"
                >
                  {{ stat.totalScore >= 0 ? '+' : '' }}{{ stat.totalScore }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近游戏 -->
        <div v-if="stats.recentGames && stats.recentGames.length > 0" class="section-card">
          <div class="section-header" @click="toggleSection('recentGames')">
            <h3 class="section-title">最近游戏</h3>
            <van-icon :name="expanded.recentGames ? 'arrow-up' : 'arrow-down'" size="16" color="#9CA3AF" />
          </div>
          <div v-if="expanded.recentGames" class="section-body">
            <div class="recent-list">
              <div
                v-for="game in stats.recentGames"
                :key="game.id"
                class="recent-item"
                @click="goToRoom(game.roomCode)"
              >
                <div class="flex-1 min-w-0">
                  <div class="recent-name">{{ game.name }}</div>
                  <div class="recent-meta">
                    {{ game.gameType }} · {{ formatDate(game.createdAt) }}
                  </div>
                </div>
                <span
                  :class="['score-badge-sm', game.score >= 0 ? 'score-badge-positive' : 'score-badge-negative']"
                >
                  {{ game.score >= 0 ? '+' : '' }}{{ game.score }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 导出按钮 (注册用户专属) -->
        <van-button
          v-if="!userStore.isGuest"
          block
          round
          plain
          type="primary"
          class="export-btn"
          @click="exportCSV"
        >
          导出数据 (CSV)
        </van-button>

        <!-- 游客注册引导 -->
        <RegisterPrompt v-if="userStore.isGuest" v-model:visible="showRegisterPrompt" source="statistics" />
        <div v-if="userStore.isGuest" class="guest-register-card" @click="showRegisterPrompt = true">
          <van-icon name="chart-trending-o" size="24" color="#16A34A" />
          <div class="guest-register-text">
            <div class="guest-register-title">解锁高级统计</div>
            <div class="guest-register-desc">注册后可查看个人记录、对手分析、排行榜等</div>
          </div>
          <van-icon name="arrow" size="16" color="#9CA3AF" />
        </div>
        </div>
      </div>
    </div>

    <van-empty v-else description="暂无数据" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/game';
import { useUserStore } from '../stores/user';
import { authApi } from '../api/auth';
import { showToast } from 'vant';
import RegisterPrompt from '../components/RegisterPrompt.vue';

const router = useRouter();
const gameStore = useGameStore();
const userStore = useUserStore();

const loading = ref(false);
const stats = ref(null);
const opponents = ref([]);
const leaderboard = ref([]);
const achievements = ref([]);
const showRegisterPrompt = ref(false);

const expanded = ref({
  personalRecords: false,
  opponents: false,
  leaderboard: false,
  gameType: false,
  recentGames: false,
  achievementProgress: false,
});

const toggleSection = (key) => {
  expanded.value[key] = !expanded.value[key];
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
};

const goToRoom = (roomCode) => {
  router.push(`/room/${roomCode}`);
};

const exportCSV = () => {
  if (!stats.value?.recentGames?.length) {
    showToast('暂无数据可导出');
    return;
  }

  const header = '日期,游戏名称,游戏类型,积分,结果\n';
  const rows = stats.value.recentGames.map(g => {
    const date = new Date(g.createdAt).toLocaleDateString('zh-CN');
    const result = g.score > 0 ? '胜' : g.score < 0 ? '负' : '平';
    return `${date},${g.name},${g.gameType},${g.score},${result}`;
  }).join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `poker-stats-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('导出成功');
};

const loadStats = async () => {
  loading.value = true;
  try {
    stats.value = await gameStore.getStats(true);

    if (!userStore.isGuest) {
      const [oppData, lbData, achData] = await Promise.allSettled([
        gameStore.getOpponentStats(true),
        gameStore.getLeaderboard(true),
        authApi.getAchievements(),
      ]);
      if (oppData.status === 'fulfilled') opponents.value = oppData.value || [];
      if (lbData.status === 'fulfilled') leaderboard.value = lbData.value || [];
      if (achData.status === 'fulfilled') achievements.value = achData.value || [];
    }
  } catch (error) {
    showToast(error.message || '加载失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.stats-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 16px;
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  background: var(--color-bg-white, #fff);
  border-radius: var(--radius-md, 12px);
  box-shadow: var(--shadow-sm);
  padding: 10px 0;
}

.stats-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-bar-value {
  font-size: 16px;
  font-weight: 700;
}

.stats-bar-blue { color: #3B82F6; }
.stats-bar-green { color: var(--color-success, #16A34A); }
.stats-bar-purple { color: #8B5CF6; }
.stats-bar-red { color: var(--color-danger, #EF4444); }

.stats-bar-label {
  font-size: var(--font-size-xs, 12px);
  color: var(--color-text-placeholder, #9CA3AF);
  margin-top: 2px;
}

.section-card {
  background: var(--color-bg-white, #fff);
  border-radius: var(--radius-md, 12px);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  cursor: pointer;
  user-select: none;
}

.section-header:active {
  background: var(--color-bg-secondary, #F9FAFB);
}

.section-title {
  font-size: var(--font-size-lg, 16px);
  font-weight: 700;
  color: var(--color-text-primary, #1A1A1A);
  margin: 0;
}

.section-body {
  padding: 0 18px 18px;
  max-height: 280px;
  overflow-y: auto;
}

/* 个人记录 */
.record-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-tertiary, #374151);
  flex-shrink: 0;
}

.record-value-green {
  color: var(--color-success, #16A34A);
}

.record-value-red {
  color: var(--color-danger, #EF4444);
}

/* 排行榜 */
.leaderboard-list {
  display: flex;
  flex-direction: column;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-bg-hover, #F3F4F6);
}

.leaderboard-item:last-child {
  border-bottom: none;
}

.leaderboard-item-self {
  background: rgba(22, 163, 74, 0.04);
  border-radius: 8px;
  padding: 10px 8px;
  margin: 0 -8px;
}

.leaderboard-rank {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm, 13px);
  font-weight: 700;
  color: var(--color-text-placeholder, #9CA3AF);
  background: var(--color-bg-hover, #F3F4F6);
  margin-right: 12px;
  flex-shrink: 0;
}

.rank-1 { background: #FEF3C7; color: #D97706; }
.rank-2 { background: #F3F4F6; color: #6B7280; }
.rank-3 { background: #FED7AA; color: #EA580C; }

.leaderboard-info {
  flex: 1;
  min-width: 0;
}

.leaderboard-name {
  font-size: var(--font-size-md, 14px);
  font-weight: 600;
  color: var(--color-text-tertiary, #374151);
}

.leaderboard-meta {
  font-size: var(--font-size-xs, 12px);
  color: var(--color-text-placeholder, #9CA3AF);
  margin-top: 2px;
}

/* 成就进度 */
.achievement-progress {
  display: flex;
  flex-direction: column;
}

.achievement-summary {
  font-size: var(--font-size-md, 14px);
  font-weight: 600;
  color: var(--color-text-tertiary, #374151);
  margin-bottom: 8px;
}

.achievement-list {
  display: flex;
  flex-direction: column;
  margin-top: 12px;
}

.achievement-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-bg-hover, #F3F4F6);
}

.achievement-row:last-child {
  border-bottom: none;
}

.achievement-row-locked {
  opacity: 0.45;
}

.achievement-row-icon {
  font-size: 20px;
  margin-right: 10px;
  flex-shrink: 0;
}

.achievement-row-info {
  flex: 1;
  min-width: 0;
}

.achievement-row-name {
  font-size: var(--font-size-md, 14px);
  font-weight: 600;
  color: var(--color-text-tertiary, #374151);
}

.achievement-row-desc {
  font-size: var(--font-size-xs, 12px);
  color: var(--color-text-placeholder, #9CA3AF);
  margin-top: 1px;
}

/* 类型统计 */
.type-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.type-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--color-bg-secondary, #F9FAFB);
  border-radius: 10px;
}

.type-info { flex: 1; min-width: 0; }
.type-name { font-size: 15px; font-weight: 600; color: var(--color-text-tertiary, #374151); }
.type-meta { font-size: var(--font-size-sm, 13px); color: var(--color-text-placeholder, #9CA3AF); margin-top: 3px; }

/* 最近游戏 */
.recent-list {
  display: flex;
  flex-direction: column;
}

.recent-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-bg-hover, #F3F4F6);
  cursor: pointer;
}

.recent-item:last-child { border-bottom: none; }
.recent-item:active { opacity: 0.7; }

.recent-name {
  font-size: var(--font-size-md, 14px);
  font-weight: 600;
  color: var(--color-text-tertiary, #374151);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-meta {
  font-size: var(--font-size-xs, 12px);
  color: var(--color-text-placeholder, #9CA3AF);
  margin-top: 3px;
}

.export-btn {
  margin-top: 4px;
}

.guest-register-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--color-bg-white, #fff);
  border-radius: var(--radius-md, 12px);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.guest-register-card:active {
  transform: scale(0.98);
}

.guest-register-text {
  flex: 1;
}

.guest-register-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary, #1A1A1A);
}

.guest-register-desc {
  font-size: var(--font-size-sm, 13px);
  color: var(--color-text-placeholder, #9CA3AF);
  margin-top: 2px;
}
</style>
