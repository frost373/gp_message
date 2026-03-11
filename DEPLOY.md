# gp_message 消息转发器 - Docker 部署指南

## 前置条件

- VPS 已安装 Docker 和 Docker Compose
- 已将项目代码传到 VPS

## 部署步骤

### 1. 上传代码到 VPS

```bash
# 方式一: 通过 Git
git clone <你的仓库地址> gp_message
cd gp_message

# 方式二: 通过 scp 上传
scp -r ./gp_message user@your-vps-ip:/root/gp_message
ssh user@your-vps-ip
cd /root/gp_message
```

### 2. 创建配置文件

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置（填入你的实际值）
vi .env
```

### 3. 启动服务

```bash
# 构建并启动（后台运行）
docker compose up -d --build

# 查看日志
docker logs -f gp_message
```

### 4. 常用管理命令

```bash
# 查看容器状态
docker ps

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 更新代码后重新部署
git pull
docker compose up -d --build

# 查看实时日志
docker logs -f gp_message
```

## 注意事项

- `.env` 文件包含敏感信息，**不要提交到 Git**
- 首次启动如果未配置 `USER_OPENID`，需要在 QQ 上给机器人发消息以绑定
- 容器配置了 `restart: unless-stopped`，VPS 重启后会自动恢复运行
