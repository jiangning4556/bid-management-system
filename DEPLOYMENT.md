# 投标管理系统 Docker 部署指南

本文档提供完整的 Docker Compose 部署步骤，配合服务器上的 Claude Code 使用。

## 目录

- [前置要求](#前置要求)
- [部署方式](#部署方式)
- [方式一：使用部署脚本（推荐）](#方式一使用部署脚本推荐)
- [方式二：使用 Claude Code 分步部署](#方式二使用-claude-code-分步部署)
- [部署后配置](#部署后配置)
- [日常运维](#日常运维)
- [故障排查](#故障排查)

---

## 前置要求

### 服务器配置建议

| 配置项 | 最低要求 | 推荐配置 |
|--------|----------|----------|
| CPU | 2 核 | 4 核+ |
| 内存 | 4GB | 8GB+ |
| 磁盘 | 40GB | 100GB+ |
| 系统 | Ubuntu 20.04+ | Ubuntu 22.04 LTS |

### 需要安装的软件

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git netstat-tools

# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo apt install -y docker-compose

# 重新登录以使 docker 组生效
```

---

## 部署方式

---

## 方式一：使用部署脚本（推荐）

这是最简单快速的部署方式。

### 步骤 1：克隆项目

```bash
# SSH 连接到服务器
ssh user@your-server-ip

# 克隆项目
cd /opt
sudo git clone <your-repo-url> bid-management-system
cd bid-management-system
```

### 步骤 2：运行部署脚本

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 运行部署
./deploy.sh
```

脚本会自动完成以下任务：
1. ✅ 检查系统环境
2. ✅ 生成安全密钥
3. ✅ 创建必要目录
4. ✅ 配置防火墙
5. ✅ 构建 Docker 镜像
6. ✅ 启动所有服务
7. ✅ 初始化数据库
8. ✅ 创建管理员账户

### 步骤 3：验证部署

```bash
# 检查服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 测试访问
curl http://localhost/api/health
```

---

## 方式二：使用 Claude Code 分步部署

这种方式可以让你更好地理解部署过程，并在遇到问题时及时调整。

### 步骤 1：在服务器上启动 Claude Code

```bash
cd /opt/bid-management-system
claude
```

### 步骤 2：让 Claude Code 执行部署

在 Claude Code 中依次输入以下指令：

#### 2.1 检查环境

```
请检查服务器环境是否满足 Docker 部署要求：
1. 检查 Docker 是否安装
2. 检查 Docker Compose 是否可用
3. 检查端口 80、3000、3306 是否被占用
4. 检查磁盘空间是否足够（至少 10GB）
```

#### 2.2 配置环境变量

```
请帮我配置环境变量：
1. 复制 .env.example 到 .env
2. 生成强随机 MYSQL_ROOT_PASSWORD（32位）
3. 生成强随机 MYSQL_PASSWORD（32位）
4. 生成强随机 JWT_SECRET（64位）
5. 更新 .env 文件中的密码
6. 将密钥保存到 .env.secrets 文件，权限设为 600
```

#### 2.3 创建必要目录

```
请创建以下目录结构：
- docker/mysql/conf.d
- docker/mysql/init
- docker/nginx/conf.d
- docker/nginx/ssl
- backend/logs
- backups
```

#### 2.4 构建镜像

```
请帮我构建 Docker 镜像：
1. 先拉取最新基础镜像
2. 构建后端镜像（backend/Dockerfile）
3. 构建前端镜像（frontend2/Dockerfile）
4. 显示构建进度和结果
```

#### 2.5 启动服务

```
请启动 Docker 服务：
1. 先启动 MySQL 容器
2. 等待 MySQL 健康检查通过（约 30 秒）
3. 启动后端容器
4. 启动前端容器
5. 显示所有容器状态
```

#### 2.6 初始化数据库

```
请初始化数据库：
1. 等待后端服务完全启动
2. 运行数据库同步（TypeORM 会自动创建表）
3. 执行 scripts/create-admin.js 创建管理员账户
4. 验证账户创建成功
```

#### 2.7 验证部署

```
请验证部署是否成功：
1. 检查所有容器状态（docker compose ps）
2. 测试后端健康检查接口
3. 测试前端访问
4. 显示默认登录信息
```

#### 2.8 配置防火墙

```
请配置防火墙规则：
1. 如果是 ufw，开放 22、80、443 端口
2. 如果是 firewall-cmd，开放相应服务
3. 显示防火墙状态
```

#### 2.9 设置自动启动

```
请设置容器自动启动：
1. 确保所有容器的 restart 策略为 unless-stopped
2. 测试重启后容器是否自动启动
```

---

## 部署后配置

### 修改默认密码

```bash
# 登录到后端容器
docker compose exec backend sh

# 修改管理员密码
node scripts/change-password.js
```

### 配置域名（可选）

如果你有域名，可以配置反向代理：

1. 编辑 `docker/nginx/conf.d/bid-management.conf`
2. 修改 `server_name` 为你的域名
3. 重启 Nginx 容器

```bash
docker compose restart nginx
```

### 配置 HTTPS（推荐）

使用 Let's Encrypt 获取免费 SSL 证书：

```bash
# 安装 certbot
sudo apt install -y certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 证书路径
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem

# 复制证书到项目目录
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/nginx/ssl/key.pem

# 更新 Nginx 配置，启用 HTTPS
# 然后重启容器
docker compose restart nginx
```

---

## 日常运维

### 查看日志

```bash
# 查看所有服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql

# 查看最近 100 行日志
docker compose logs --tail=100 backend
```

### 服务管理

```bash
# 停止服务
docker compose stop

# 启动服务
docker compose start

# 重启服务
docker compose restart

# 停止并删除容器
docker compose down

# 停止并删除容器和数据卷
docker compose down -v
```

### 数据备份

```bash
# 运行备份脚本
./backup.sh

# 或手动备份
docker compose exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} bid_management > backup_$(date +%Y%m%d).sql
```

### 数据恢复

```bash
# 恢复数据库
cat backup_20240512.sql | docker compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} bid_management
```

### 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建镜像
docker compose build

# 重启服务
docker compose up -d
```

---

## 故障排查

### 容器无法启动

```bash
# 查看容器日志
docker compose logs <service-name>

# 检查容器状态
docker compose ps -a

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

### 数据库连接失败

```bash
# 检查 MySQL 容器状态
docker compose ps mysql

# 查看 MySQL 日志
docker compose logs mysql

# 测试数据库连接
docker compose exec mysql mysql -u biduser -p bid_management
```

### 前端无法访问

```bash
# 检查 Nginx 配置
docker compose exec nginx nginx -t

# 查看 Nginx 日志
docker compose logs nginx

# 检查前端容器
docker compose ps frontend
```

### 端口冲突

```bash
# 查看端口占用
netstat -tuln | grep -E ':(80|3000|3306) '

# 修改 .env 文件中的端口配置
# 然后重启服务
docker compose down && docker compose up -d
```

---

## 密钥丢失处理

如果丢失了数据库密码，可以重置：

```bash
# 1. 停止服务
docker compose down

# 2. 修改 .env 文件中的密码

# 3. 删除 MySQL 数据卷
docker volume rm bid-management-system_mysql_data

# 4. 重新启动（会创建新的数据库）
docker compose up -d

# 5. 重新初始化数据库
docker compose exec backend node scripts/create-admin.js
```

---

## 安全建议

1. **定期更新**：保持 Docker 和系统更新
2. **强密码**：使用强随机密码，定期更换
3. **备份**：每天自动备份数据库
4. **防火墙**：只开放必要端口
5. **HTTPS**：生产环境务必使用 HTTPS
6. **监控**：设置容器监控和告警
7. **日志**：定期检查和清理日志文件

---

## 支持

如有问题，请检查：
1. Docker 日志：`docker compose logs`
2. 容器状态：`docker compose ps`
3. 系统资源：`top`, `df -h`, `free -h`

或联系技术支持。
