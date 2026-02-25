// 随机中文姓氏
const surnames = [
  '赵',
  '钱',
  '孙',
  '李',
  '周',
  '吴',
  '郑',
  '王',
  '冯',
  '陈',
  '褚',
  '卫',
  '蒋',
  '沈',
  '韩',
  '杨',
  '朱',
  '秦',
  '尤',
  '许',
  '何',
  '吕',
  '施',
  '张',
  '孔',
  '曹',
  '严',
  '华',
  '金',
  '魏',
  '陶',
  '姜',
  '戚',
  '谢',
  '邹',
  '喻',
  '柏',
  '水',
  '窦',
  '章',
  '云',
  '苏',
  '潘',
  '葛',
  '奚',
  '范',
  '彭',
  '郎',
  '鲁',
  '韦'
]

// 随机中文名字
const names = [
  '子轩',
  '浩然',
  '宇轩',
  '博文',
  '子涵',
  '雨泽',
  '皓轩',
  '梓轩',
  '俊杰',
  '子豪',
  '天翊',
  '明轩',
  '烨磊',
  '煜祺',
  '智宸',
  '正豪',
  '昊然',
  '明杰',
  '立诚',
  '立轩',
  '建辉',
  '晟睿',
  '天佑',
  '文昊',
  '修洁',
  '黎昕',
  '远航',
  '旭尧',
  '鸿涛',
  '伟祺',
  '荣轩',
  '越泽',
  '思涵',
  '欣怡',
  '梓涵',
  '诗涵',
  '雨萱',
  '可馨',
  '佳怡',
  '梦琪',
  '雅静',
  '雪丽',
  '韵寒',
  '莉姿',
  '梦璐',
  '沛玲',
  '欣妍',
  '曼玉'
]

// 生成随机中文名
export function generateRandomName() {
  const surname = surnames[Math.floor(Math.random() * surnames.length)]
  const name = names[Math.floor(Math.random() * names.length)]
  return surname + name
}

// 头像颜色方案（更丰富的渐变色）
export const avatarColors = [
  { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#fff' },
  { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', text: '#fff' },
  { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', text: '#fff' },
  { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', text: '#fff' },
  { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', text: '#fff' },
  { bg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', text: '#fff' },
  { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', text: '#333' },
  { bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', text: '#333' },
  { bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', text: '#333' },
  { bg: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)', text: '#fff' },
  { bg: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', text: '#fff' },
  { bg: 'linear-gradient(135deg, #f8b500 0%, #fceabb 100%)', text: '#333' }
]

// 获取随机头像颜色
export function getRandomAvatarColor() {
  return avatarColors[Math.floor(Math.random() * avatarColors.length)]
}

// 根据字符串生成固定的头像颜色（同一个用户每次都是同一个颜色）
export function getAvatarColorByString(str) {
  if (!str) return avatarColors[0]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % avatarColors.length
  return avatarColors[index]
}

// 获取名字首字
export function getNameInitial(name) {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}
