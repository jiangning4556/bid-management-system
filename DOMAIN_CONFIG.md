# 域名配置指南

部署到服务器后，如何从 IP 地址切换到域名访问。

---

## 📋 需要修改的配置文件

### 重要说明

使用 Docker Compose 部署时，**大部分 localhost 配置不需要修改**，因为：
- `localhost:3000` 是容器内部通信（后端）
- `localhost:3306` 是容器内部通信（MySQL）
- 只有**外部访问**需要配置域名

---

## 🔧 需要修改的地方

### 1. Nginx 配置（最重要）

**文件**：`docker/nginx/conf.d/bid-management.conf`

**修改前**：
```nginx
server {
    listen 80;
    server_name _;  # 接受任何域名/IP
    ...
}
```

**修改后**：
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # 你的域名
    ...
}
```

---

### 2. 后端 CORS 配置

**文件**：`backend/src/main.ts`

**修改前**：
```typescript
app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
});
```

**修改后**：
```typescript
app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://your-domain.com',
    credentials: true,
});
```

---

### 3. 环境变量配置

**文件**：`.env`

**添加以下配置**：
```env
# 后端 CORS 允许的前端域名
FRONTEND_URL=http://your-domain.com

# 或者如果使用 HTTPS
FRONTEND_URL=https://your-domain.com
```

---

## 🚀 完整配置步骤

### 步骤 1：修改 Nginx 配置

```bash
# 编辑配置文件
nano docker/nginx/conf.d/bid-management.conf
```

修改 `server_name` 为你的域名：
```nginx
server_name your-domain.com www.your-domain.com;
```

### 步骤 2：修改后端 CORS 配置

```bash
# 编辑后端配置
nano backend/src/main.ts
```

修改默认域名为你的域名。

### 步骤 3：更新环境变量

```bash
# 编辑环境变量
nano .env
```

添加：
```env
FRONTEND_URL=http://your-domain.com
```

### 步骤 4：重新构建并部署

```bash
# 在服务器上执行
cd /opt/bid-management-system

# 重新构建镜像
docker compose build

# 重启服务
docker compose down
docker compose up -d
```

---

## 🌐 配置 HTTPS（推荐）

如果你有域名，强烈建议配置 HTTPS：

### 使用 Let's Encrypt 免费证书

```bash
# 1. 安装 certbot
sudo apt install -y certbot

# 2. 停止容器（释放 80 端口）
docker compose down

# 3. 获取证书
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 4. 复制证书到项目目录
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/nginx/ssl/key.pem

# 5. 修改 Nginx 配置启用 HTTPS
# 编辑 docker/nginx/conf.d/bid-management.conf
# 取消 HTTPS server 块的注释

# 6. 重启服务
docker compose up -d
```

---

## 📊 配置对比

| 配置项 | 开发环境 | 生产环境（Docker） |
|--------|----------|-------------------|
| 前端访问 | `http://localhost:5173` | `http://your-domain.com` |
| 后端 API | `http://localhost:3000` | 容器内部：`http://backend:3000` |
| 数据库 | `localhost:3306` | 容器内部：`mysql:3306` |
| Nginx | - | `http://your-domain.com` |

---

## 🔍 验证配置

### 1. 检查 Nginx 配置

```bash
docker compose exec nginx nginx -t
```

### 2. 检查服务状态

```bash
docker compose ps
```

### 3. 测试访问

```bash
# 测试前端
curl -I http://your-domain.com

# 测试后端
curl http://your-domain.com/api/health
```

---

## 🛠️ 常见问题

### Q1: 配置域名后还是无法访问？

**A**:
1. 检查 DNS 解析是否生效
2. 检查防火墙是否开放 80 端口
3. 检查 Nginx 配置是否正确

### Q2: API 跨域错误？

**A**:
检查后端 `FRONTEND_URL` 环境变量是否正确配置。

### Q3: 如何配置多个域名？

**A**:
在 Nginx 配置中添加：
```nginx
server_name your-domain.com www.your-domain.com api.your-domain.com;
```

---

## 📝 快速参考

### 不需要修改的配置（容器内部通信）

```yaml
# docker-compose.yml 中的这些不需要修改：
DB_HOST: mysql              # ✅ 正确（容器名）
DB_HOST: localhost          # ❌ 错误
DB_HOST: 127.0.0.1          # ❌ 错误
```

### 需要修改的配置（外部访问）

```nginx
# Nginx 配置
server_name your-domain.com;  # ✅ 修改为你的域名
```

```typescript
// 后端 CORS
origin: 'http://your-domain.com'  // ✅ 修改为你的域名
```

---

## 🎯 总结

1. **Docker 内部通信**：使用容器名（`mysql`, `backend`）- 不需要修改
2. **外部访问**：使用域名 - 需要修改 Nginx 配置
3. **CORS 配置**：需要添加允许的前端域名
4. **HTTPS**：生产环境强烈建议配置

**最重要的是修改 Nginx 的 `server_name` 配置！**
