# 打牌记账 Poker Accounting

扑克/麻将线下牌局记账工具，支持多人实时转分、统计分析、数据导出。

## 技术栈

- **前端**: Vue 3 + Vite + Vant 4 + Pinia + Tailwind CSS + ECharts
- **后端**: NestJS + TypeORM + SQLite + JWT
- **部署**: PM2 + ServeStatic (单进程部署)

## 功能特性

| 功能 | 游客 | 注册用户 |
|------|------|----------|
| 创建/加入房间 | 最多 3 个活跃 | 无限制 |
| 转分/撤销 | 正常 | 正常 |
| 游戏历史 | 最近 7 天 | 完整历史 |
| 统计数据 | 文字统计 | 文字 + ECharts 图表 |
| 编辑/删除牌局 | 不可 | 创建者可操作 |
| 数据导出 | 不可 | CSV 导出 |
| 跨设备同步 | 不可 | JWT 登录跨设备 |

## 本地开发

```bash
# 后端
cd backend
cp .env.example .env    # 根据需要修改配置
npm install
npm run start:dev       # 启动在 :3000

# 前端
cd frontend
npm install
npm run dev             # 启动在 :9527，自动代理 /api -> :3000
```

## 构建部署

### 一键构建

```bash
bash scripts/build.sh
```

### 部署到 serv00

1. 复制代码到服务器
2. 配置环境变量：
   ```bash
   cp backend/.env.production.example backend/.env
   # 编辑 .env 设置 JWT_SECRET、CORS_ORIGIN 等
   ```
3. 运行部署脚本：
   ```bash
   bash scripts/deploy.sh
   ```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| JWT_SECRET | JWT 签名密钥 | (必填) |
| JWT_EXPIRES_IN | Token 有效期 | 7d |
| PORT | 服务端口 | 3000 |
| HOST | 服务监听地址 | 0.0.0.0 |
| NODE_ENV | 环境 | development |
| DB_PATH | SQLite 文件路径 | ./data/poker-accounting.db |
| CORS_ORIGIN | 允许的跨域来源 | http://localhost:9527 |
| VITE_PUBLIC_APP_URL | 二维码/外部分享使用的公网 HTTPS 地址 | 当前访问域名 |

### Railway 部署提示

- 如果前后端由当前 Nest 服务统一对外提供，扫码链接建议使用 Railway 分配的公网 HTTPS 域名或你自己的自定义域名。
- 若希望二维码始终指向固定域名，可在前端构建时设置 `VITE_PUBLIC_APP_URL=https://你的域名`。
- 本项目使用 `vue-router` 的 history 路由，后端已通过 `ServeStaticModule` 对 `/api/*` 之外的路径回退到前端入口，适合扫码直接打开 `/room/:roomCode`。
- 如果继续使用 SQLite，建议在 Railway 给服务挂载 Volume 到 `/app/data`，并将 `DB_PATH=/app/data/poker-accounting.db`，否则数据库文件会随重部署或实例变化丢失。

## API 概览

所有接口均以 `/api` 为前缀。

### 认证 `/api/auth`
- `POST /register` - 注册
- `POST /login` - 登录
- `GET /profile` - 获取个人信息
- `PUT /profile` - 更新昵称
- `POST /guest-to-user` - 游客转注册用户
- `POST /merge-guest` - 合并游客数据

### 游戏 `/api/game`
- `POST /create` - 创建房间
- `POST /join/:roomCode` - 加入房间
- `GET /:roomCode` - 获取房间详情
- `GET /my-games/list` - 我的游戏列表
- `POST /:roomCode/score` - 转分
- `DELETE /:roomCode/score/:recordId` - 撤销转分
- `PATCH /:roomCode` - 编辑房间 (需登录)
- `POST /:roomCode/end` - 结束游戏
- `DELETE /:roomCode` - 删除游戏
- `GET /stats/data` - 统计数据

## 项目结构

```
poker-accounting/
├── backend/                 # NestJS 后端
│   ├── src/
│   │   ├── auth/           # 认证模块
│   │   ├── game/           # 游戏模块
│   │   └── entities/       # 数据库实体
│   └── data/               # SQLite 数据文件
├── frontend/               # Vue 3 前端
│   ├── src/
│   │   ├── api/            # API 调用
│   │   ├── components/     # 组件 (RegisterPrompt, charts/)
│   │   ├── stores/         # Pinia 状态管理
│   │   ├── views/          # 页面
│   │   └── utils/          # 工具函数
│   └── dist/               # 构建产物
├── scripts/                # 构建和部署脚本
└── ecosystem.config.js     # PM2 配置
```
