# 阿里云部署指南

## 目录

- [服务器要求](#服务器要求)
- [域名配置](#域名配置)
- [后端部署](#后端部署)
- [前端部署](#前端部署)
- [SSL 证书配置](#ssl-证书配置)
- [部署验证](#部署验证)
- [常见问题](#常见问题)

## 服务器要求

### 基础环境

- **操作系统**: Ubuntu 20.04+ / CentOS 7+
- **Node.js**: 18.x 或更高版本
- **MySQL**: 8.0+
- **Nginx**: 1.18+
- **PM2**: 全局安装（用于进程管理）

### 安装依赖

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# 安装 Nginx
sudo apt install -y nginx

# 安装 PM2
sudo npm install -g pm2

# 安装 Git
sudo apt install -y git
```

## 域名配置

### DNS 解析设置

在阿里云域名解析中添加以下记录：

| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| A | www | 您的服务器 IP |
| A | @ | 您的服务器 IP |
| A | api | 您的服务器 IP |

### 配置文件修改

部署前需要修改以下域名配置：

1. **backend/.env.production**
   ```env
   FRONTEND_URL=https://www.your-domain.com
   ```

2. **frontend2/.env.production**
   ```env
   VITE_API_URL=https://api.your-domain.com
   ```

3. **nginx-frontend.conf**
   ```nginx
   server_name www.your-domain.com your-domain.com;
   ```

4. **nginx-backend.conf**
   ```nginx
   server_name api.your-domain.com;
   ```

## 后端部署

### 1. 创建项目目录

```bash
sudo mkdir -p /var/www/bid-management
sudo chown -R $USER:$USER /var/www/bid-management
cd /var/www/bid-management
```

### 2. 上传代码

```bash
# 使用 Git 克隆（推荐）
git clone <your-repo-url> .

# 或使用 SCP 上传
scp -r ./bid-management-system/* user@your-server:/var/www/bid-management/
```

### 3. 配置环境变量

```bash
cd backend
cp .env.production .env
nano .env  # 修改数据库密码等配置
```

### 4. 安装依赖并构建

```bash
npm install
npm run build
```

### 5. 初始化数据库

```bash
# 创建数据库
node scripts/create-database.js

# 创建管理员账户
node scripts/create-admin.js
```

### 6. 配置 PM2

```bash
# 启动服务
pm2 start ecosystem.config.json

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

### 7. 配置 Nginx

```bash
# 复制配置文件
sudo cp nginx-backend.conf /etc/nginx/sites-available/bid-management-api

# 创建软链接
sudo ln -s /etc/nginx/sites-available/bid-management-api /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

## 前端部署

### 1. 配置环境变量

```bash
cd frontend2
nano .env.production  # 修改 API 域名
```

### 2. 安装依赖并构建

```bash
npm install
npm run build
```

### 3. 部署静态文件

```bash
# 创建前端目录
sudo mkdir -p /var/www/bid-management/frontend

# 复制构建文件
sudo cp -r dist/* /var/www/bid-management/frontend/

# 设置权限
sudo chown -R www-data:www-data /var/www/bid-management/frontend
```

### 4. 配置 Nginx

```bash
# 复制配置文件
sudo cp nginx-frontend.conf /etc/nginx/sites-available/bid-management-frontend

# 创建软链接
sudo ln -s /etc/nginx/sites-available/bid-management-frontend /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

## SSL 证书配置

### 使用 Let's Encrypt 免费证书

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书（前端）
sudo certbot --nginx -d www.your-domain.com -d your-domain.com

# 获取证书（后端）
sudo certbot --nginx -d api.your-domain.com

# 设置自动续期
sudo certbot renew --dry-run
```

## 部署验证

### 1. 检查后端服务

```bash
# PM2 状态
pm2 status

# 查看日志
pm2 logs bid-management-backend

# 测试 API
curl https://api.your-domain.com/api/health
```

### 2. 检查前端服务

```bash
# 访问前端
curl -I https://www.your-domain.com
```

### 3. 功能测试

1. 访问 https://www.your-domain.com
2. 使用默认账户登录：admin / admin123
3. **重要**：登录后立即修改管理员密码

## 常见问题

### 1. 端口被占用

```bash
sudo netstat -tulpn | grep :3000
sudo kill -9 <PID>
```

### 2. MySQL 连接失败

```bash
sudo systemctl status mysql
sudo mysql -u root -p
```

### 3. Nginx 502 错误

```bash
pm2 status
pm2 logs
sudo tail -f /var/log/nginx/error.log
```

### 4. 文件上传失败

```bash
sudo mkdir -p /var/www/bid-management/uploads
sudo chown -R www-data:www-data /var/www/bid-management/uploads
sudo chmod -R 755 /var/www/bid-management/uploads
```

## 维护命令

### 查看日志

```bash
# 后端日志
pm2 logs bid-management-backend

# Nginx 日志
sudo tail -f /var/log/nginx/bid-management-api-access.log
```

### 重启服务

```bash
# 重启后端
pm2 restart bid-management-backend

# 重启 Nginx
sudo systemctl restart nginx
```

### 更新部署

```bash
cd /var/www/bid-management
chmod +x deploy.sh

# 部署后端
./deploy.sh backend

# 部署前端
./deploy.sh frontend
```

### 数据库备份

```bash
# 备份
sudo mysqldump -u root -p bid_management > backup_$(date +%Y%m%d).sql

# 恢复
sudo mysql -u root -p bid_management < backup_20240101.sql
```
