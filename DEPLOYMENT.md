# 投标管理系统 - 阿里云Windows服务器部署指南

## 部署前准备

### 服务器环境要求
- Windows Server 2016/2019/2022
- Node.js 18.x 或更高版本
- MySQL 8.0 或更高版本
- PM2（进程管理器）
- IIS 或 Nginx（可选，用于反向代理）

### 本地准备
```bash
# 确保本地项目可以正常运行
cd backend
npm install
npm run build
npm run start:prod  # 测试生产版本

cd ../frontend2
npm install
npm run build
npm run preview  # 测试构建结果
```

---

## 第一步：修改配置文件

### 1. 后端环境配置

创建生产环境配置文件 `backend/.env.production`：

```env
# 应用配置
NODE_ENV=production
PORT=3000

# 数据库配置（修改为服务器MySQL配置）
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=bid_management_user
DB_PASSWORD=your_secure_password_here
DB_DATABASE=bid_management

# JWT配置（修改为强密码）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

### 2. 前端API地址配置

修改 `frontend2/src/utils/request.ts`，添加环境判断：

```typescript
const BASE_URL = import.meta.env.PROD
  ? '/api'  // 生产环境使用相对路径，由Nginx/IIS代理
  : '/api'  // 开发环境

// 或根据环境变量
const BASE_URL = process.env.VITE_API_URL || '/api'
```

### 3. 前端生产环境构建配置

修改 `frontend2/vite.config.ts`：

```typescript
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // 生产环境移除console
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'element-plus': ['element-plus'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
```

---

## 第二步：服务器环境配置

### 1. 安装Node.js

```powershell
# 使用 Chocolatey 安装
choco install nodejs-lts

# 或从官网下载安装
# https://nodejs.org/
```

### 2. 安装MySQL

```powershell
# 使用 Chocolatey 安装
choco install mysql

# 或从官网下载安装
# https://dev.mysql.com/downloads/mysql/
```

### 3. 安装PM2

```powershell
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

### 4. 配置MySQL

```sql
-- 创建数据库
CREATE DATABASE bid_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'bid_management_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';

-- 授权
GRANT ALL PRIVILEGES ON bid_management.* TO 'bid_management_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 第三步：部署项目文件

### 1. 上传项目文件到服务器

将项目文件夹上传到服务器，例如：
```
C:\inetpub\wwwroot\bid-management-system
```

### 2. 安装依赖

```powershell
# 后端依赖
cd C:\inetpub\wwwroot\bid-management-system\backend
npm install --production

# 前端依赖（如果需要在服务器上构建）
cd ..\frontend2
npm install --production
```

### 3. 创建生产环境配置文件

```powershell
# 复制并修改环境配置
cd C:\inetpub\wwwroot\bid-management-system\backend
copy .env .env.production
notepad .env.production
# 修改数据库密码和JWT密钥
```

### 4. 构建前端

```powershell
cd C:\inetpub\wwwroot\bid-management-system\frontend2
npm run build
# 构建产物在 dist 目录
```

---

## 第四步：初始化数据库

### 1. 运行数据库迁移脚本

```powershell
cd C:\inetpub\wwwroot\bid-management-system\backend

# 创建数据库
node scripts/create-database.js

# 创建管理员账户
node scripts/create-admin.js
```

### 2. 或手动导入数据库结构

如果有SQL导出文件：

```powershell
mysql -u root -p bid_management < database_schema.sql
```

---

## 第五步：配置PM2进程管理

### 1. 创建PM2配置文件

创建 `backend/ecosystem.config.js`：

```javascript
module.exports = {
  apps: [
    {
      name: 'bid-management-backend',
      script: 'dist/main.js',
      cwd: 'C:\\inetpub\\wwwroot\\bid-management-system\\backend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
}
```

### 2. 启动后端服务

```powershell
cd C:\inetpub\wwwroot\bid-management-system\backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. PM2常用命令

```powershell
pm2 list              # 查看进程状态
pm2 logs bid-management-backend --lines 100  # 查看日志
pm2 restart bid-management-backend  # 重启服务
pm2 stop bid-management-backend     # 停止服务
pm2 delete bid-management-backend  # 删除进程
pm2 monit                   # 实时监控
```

---

## 第六步：配置前端静态文件服务

### 方案一：使用IIS托管静态文件

1. 打开IIS管理器
2. 添加网站
   - 网站名称: `bid-management-frontend`
   - 物理路径: `C:\inetpub\wwwroot\bid-management-system\frontend2\dist`
   - 绑定: `http:*:80`
3. 配置URL重写规则（web.config）

创建 `frontend2/dist/web.config`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Handle History Mode and custom 404/405" stopProcessing="true">
          <match url="(.*)" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="index.html" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
    </staticContent>
    <httpProtocol>
      <customHeaders>
        <add name="Cache-Control" value="no-cache, no-store, must-revalidate" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

### 方案二：使用Nginx托管静态文件

1. 安装Nginx for Windows
2. 配置 `nginx/conf/nginx.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 修改为你的域名或服务器IP

    root C:/inetpub/wwwroot/bid-management-system/frontend2/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

3. 启动Nginx：

```powershell
cd C:\nginx
nginx.exe
```

---

## 第七步：配置防火墙

### 1. Windows防火墙入站规则

允许以下端口：
- **80** (HTTP)
- **443** (HTTPS，如果使用SSL)
- **3000** (后端API，如果需要直接访问)

```powershell
# 添加防火墙规则
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
New-NetFirewallRule -DisplayName "Backend API" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### 2. 阿里云安全组配置

在阿里云控制台配置安全组规则，开放：
- TCP 80
- TCP 443
- TCP 3000（如果需要直接访问后端API）

---

## 第八步：SSL证书配置（可选但推荐）

### 使用 Let's Encrypt 免费证书

1. 安装 win-acme：

```powershell
choco install win-acme
```

2. 申请证书：

```powershell
# 配置验证邮箱
win-acme --server https://acme-v02.api.letsencrypt.org --email your-email@example.com

# 申请证书
win-acme --issue manual --domain your-domain.com
```

3. 在IIS中导入证书并绑定HTTPS

---

## 第九步：部署后验证

### 1. 检查服务状态

```powershell
# 检查后端服务
pm2 list

# 检查MySQL服务
sc query MySQL80

# 检查端口占用
netstat -ano | findstr :80
netstat -ano | findstr :3000
```

### 2. 测试访问

1. 前端页面: `http://your-server-ip` 或 `http://your-domain.com`
2. 后端API: `http://your-server-ip/api/health`（如果有健康检查端点）
3. 登录测试: 使用 `admin/admin123` 登录

### 3. 检查日志

```powershell
# PM2 日志
pm2 logs bid-management-backend

# IIS 日志
C:\inetpub\logs\LogFiles
```

---

## 第十步：设置开机自启动

### 1. PM2服务自启动

```powershell
pm2 startup
pm2 save
```

### 2. MySQL服务自启动

```powershell
sc config MySQL80 start=auto
```

### 3. IIS自启动

IIS默认已配置为自启动

---

## 常见问题排查

### 1. 后端服务无法启动

```powershell
# 查看详细日志
pm2 logs bid-management-backend --lines 100

# 检查环境变量
pm2 env bid-management-backend

# 重启服务
pm2 restart bid-management-backend
```

### 2. 前端页面空白

- 检查浏览器控制台错误
- 确认API地址配置正确
- 检查IIS/Nginx配置

### 3. 数据库连接失败

- 检查MySQL服务状态
- 验证数据库用户名密码
- 确认防火墙允许3306端口

### 4. 上传文件失败

- 检查uploads目录权限
- 确认MAX_FILE_SIZE配置
- 检查IIS请求大小限制（默认30MB）

---

## 更新部署

### 后端更新

```powershell
cd C:\inetpub\wwwroot\bid-management-system\backend
git pull  # 或上传新文件
npm install --production
npm run build
pm2 restart bid-management-backend
```

### 前端更新

```powershell
cd C:\inetpub\wwwroot\bid-management-system\frontend2
git pull  # 或上传新文件
npm install --production
npm run build
# dist目录会自动更新，IIS会自动使用新文件
```

### 数据库迁移

```powershell
cd C:\inetpub\wwwroot\bid-management-system\backend
# 运行新的迁移脚本
node scripts/migrate-xxx.js
```

---

## 备份策略

### 1. 数据库备份

```powershell
# 创建备份脚本
@echo off
set BACKUP_DIR=C:\backups\bid-management
set DATE=%date:~0,4%%date:~5,2%%date:~8,2%
mysqldump -u bid_management_user -p bid_management > %BACKUP_DIR%\backup_%DATE%.sql
```

### 2. 配置计划任务

使用Windows任务计划程序定期执行备份脚本

---

## 监控和维护

### 1. 性能监控

使用PM2监控：

```powershell
pm2 monit
```

### 2. 日志管理

定期清理日志文件，避免磁盘占满

### 3. 安全维护

- 定期更新Node.js和依赖包
- 定期更新MySQL
- 监控安全日志
- 定期备份数据
