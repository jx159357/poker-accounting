import request from '../utils/request';
import { useUserStore } from '../stores/user';

export const gameApi = {
  // 创建房间
  createRoom(data) {
    const userStore = useUserStore();
    return request.post('/game/create', {
      ...data,
      guestId: userStore.isGuest ? userStore.currentUserId : undefined,
    });
  },

  // 加入房间
  joinRoom(data) {
    const userStore = useUserStore();
    return request.post('/game/join', {
      ...data,
      guestId: userStore.isGuest ? userStore.currentUserId : undefined,
    });
  },

  // 获取房间详情
  getGameDetail(roomCode) {
    return request.get(`/game/${roomCode}`);
  },

  // 记账
  addScore(roomCode, data) {
    return request.post(`/game/${roomCode}/score`, data);
  },

  // 撤销记账
  undoRecord(roomCode, recordId) {
    return request.post(`/game/${roomCode}/undo`, { recordId });
  },

  // 结算
  settleRoom(roomCode, keepRecords = false) {
    return request.post(`/game/${roomCode}/settle`, { keepRecords });
  },

  // 获取用户房间列表
  getUserGames() {
    const userStore = useUserStore();
    const params = {};

    if (userStore.isGuest) {
      params.guestId = userStore.currentUserId;
    }

    return request.get('/game/user/list', { params });
  },
};
