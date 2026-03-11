FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存层
COPY package*.json ./

# 安装生产依赖
RUN npm ci --omit=dev

# 复制项目文件
COPY . .

# 启动服务
CMD ["node", "index.js"]
