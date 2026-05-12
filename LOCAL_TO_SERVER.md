# 从本地部署到服务器 - 完整流程

本文档详细说明如何将本地代码部署到远程服务器。

---

## 📋 部署流程图

```
本地电脑                        服务器
────────                       ──────
                              ┌─────────────┐
你的代码  ──上传──>           │  /opt/bid-  │
(d:/MyProject/)                │  management- │
                              │  system/     │
                              └──────┬──────┘
                                     │
                              ┌──────▼──────┐
                              │   Claude    │
                              │   Code      │
                              │   部署      │
                              └──────┬──────┘
                                     │
                              ┌──────▼──────┐
                              │   Docker    │
                              │   容器运行  │
                              └─────────────┘
```

---

## 🚀 最简单的方式（三步走）

### 第一步：推送代码到 Git 仓库

在你的**本地电脑**执行：

```bash
# 进入项目目录
cd d:\MyProject\bid-management-system

# 初始化 Git（如果还没有）
git init
git add .
git commit -m "Add Docker files"

# 推送到 GitHub/GitLab
git remote add origin https://github.com/你的用户名/bid-management-system.git
git push -u origin main
```

### 第二步：在服务器上克隆代码

SSH 连接到服务器后执行：

```bash
# 克隆项目
cd /opt
sudo git clone https://github.com/你的用户名/bid-management-system.git
cd bid-management-system

# 给脚本执行权限
chmod +x deploy.sh
```

### 第三步：在服务器上运行部署

```bash
# 运行自动部署脚本
./deploy.sh

# 或者启动 Claude Code 手动部署
claude
```

---

## 📝 CLAUDE_DEPLOY.md 的作用

`CLAUDE_DEPLOY.md` **不是用来把代码上传到服务器的**，它的作用是：

- 假设代码**已经在服务器上了**
- 提供给 Claude Code 的**指令模板**
- 让 Claude Code 帮你**配置和启动 Docker 容器**

简单来说：
1. **上传代码**：用 Git 或 SCP（需要你自己做）
2. **部署容器**：用 Claude Code + CLAUDE_DEPLOY.md（在服务器上做）

---

## 🔄 完整工作流程

### 场景：你在本地修改了代码，要部署到服务器

#### 方法 A：使用 Git（推荐）

```bash
# ===== 本地电脑 =====
# 1. 修改代码后提交
cd d:\MyProject\bid-management-system
git add .
git commit -m "Update feature"
git push

# ===== 服务器 =====
# 2. SSH 连接到服务器
ssh user@your-server-ip

# 3. 拉取最新代码
cd /opt/bid-management-system
git pull

# 4. 重新构建并启动
docker compose build
docker compose up -d
```

#### 方法 B：使用一键部署脚本

```bash
# ===== 本地电脑 =====
# 修改 deploy-to-server.sh 中的配置
# SERVER_USER="your-username"
# SERVER_HOST="your-server-ip"

# 运行部署脚本
./deploy-to-server.sh
```

---

## 🎯 不同场景的部署方式

### 场景 1：首次部署

| 步骤 | 操作 | 位置 |
|------|------|------|
| 1 | 推送代码到 Git | 本地 |
| 2 | 在服务器克隆代码 | 服务器 |
| 3 | 运行 `./deploy.sh` 或使用 Claude Code | 服务器 |

### 场景 2：日常更新代码

| 步骤 | 操作 | 位置 |
|------|------|------|
| 1 | 修改代码并推送 | 本地 |
| 2 | 在服务器拉取代码 | 服务器 |
| 3 | 重启 Docker 容器 | 服务器 |

### 场景 3：只想修改配置

| 步骤 | 操作 | 位置 |
|------|------|------|
| 1 | SSH 连接到服务器 | 本地 |
| 2 | 启动 Claude Code | 服务器 |
| 3 | 使用 CLAUDE_DEPLOY.md 中的指令 | 服务器 |

---

## 💡 常见问题

### Q1: 我没有 Git 仓库怎么办？

**A:** 使用 SCP 直接上传：

```bash
# 在本地打包（排除不需要的文件）
tar --exclude=node_modules -czf project.tar.gz .

# 上传到服务器
scp project.tar.gz user@server:/tmp/

# 在服务器解压
ssh user@server
cd /opt
mkdir -p bid-management-system
tar -xzf /tmp/project.tar.gz -C bid-management-system
```

### Q2: CLAUDE_DEPLOY.md 什么时候用？

**A:** 当你**已经在服务器上**，需要：
- 配置环境变量
- 构建 Docker 镜像
- 启动服务
- 排查问题

### Q3: 可以完全自动化吗？

**A:** 可以！使用 `deploy-to-server.sh` 脚本：

```bash
# 1. 修改脚本中的服务器信息
nano deploy-to-server.sh

# 2. 运行脚本
./deploy-to-server.sh
```

---

## 🔧 快速参考

### Git 部署命令速查

```bash
# 本地：首次推送
git init && git add . && git commit -m "Initial"
git remote add origin <repo-url>
git push -u origin main

# 本地：更新推送
git add . && git commit -m "Update" && git push

# 服务器：克隆
git clone <repo-url>

# 服务器：更新
git pull
```

### Docker 部署命令速查

```bash
# 首次部署
./deploy.sh

# 更新部署
git pull && docker compose build && docker compose up -d

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart
```

---

## 📞 需要帮助？

如果遇到问题，按顺序检查：

1. ✅ 代码是否已上传到服务器
2. ✅ Docker 是否已安装
3. ✅ 端口是否被占用
4. ✅ 防火墙是否正确配置
5. ✅ 查看容器日志：`docker compose logs`
