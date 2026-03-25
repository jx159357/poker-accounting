/**
 * 游戏类型配置
 * 集中管理所有游戏类型，供创建房间、编辑房间、历史筛选等场景使用
 */

const DEFAULT_GAME_TYPES = [
  { label: '跑得快', value: '跑得快', enabled: true },
  { label: '斗地主', value: '斗地主', enabled: true },
  { label: '麻将', value: '麻将', enabled: true },
  { label: '德州扑克', value: '德州扑克', enabled: true },
  { label: '其他', value: '其他', enabled: true }
]

/** History 筛选用: ['all', ...enabledTypes] */
export function getFilterTypes() {
  return ['all', ...DEFAULT_GAME_TYPES.filter(t => t.enabled).map(t => t.value)];
}

export function isBuiltInGameType(type) {
  return DEFAULT_GAME_TYPES.some(item => item.enabled && item.value === type);
}

/** 创建/编辑房间用: [...enabledTypes, '自定义'] */
export function getSelectableTypes() {
  return [...DEFAULT_GAME_TYPES.filter(t => t.enabled).map(t => t.label), '自定义'];
}

export { DEFAULT_GAME_TYPES };
