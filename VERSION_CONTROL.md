# 代码版本管理指南

## 1. Git 工作流程

### 基本操作

```bash
# 查看当前状态
git status

# 查看修改内容
git diff

# 查看提交历史
git log --oneline --graph --all

# 添加文件到暂存区
git add <file>
git add .  # 添加所有修改

# 提交更改
git commit -m "描述性提交信息"

# 推送到远程仓库
git push origin <branch-name>

# 拉取远程更新
git pull origin <branch-name>
```

### 查看分支

```bash
# 查看所有分支
git branch -a

# 创建新分支
git branch <branch-name>

# 切换分支
git checkout <branch-name>

# 创建并切换到新分支
git checkout -b <branch-name>

# 删除分支
git branch -d <branch-name>
```

## 2. 提交信息规范

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型 (type)

- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 重构（既不是新功能也不是修复 Bug）
- `perf`: 性能优化
- `test`: 添加测试
- `chore`: 构建过程或辅助工具的变动

### 示例

```bash
# 新功能
git commit -m "feat(supplier): 添加供应商 displayId 字段

- 添加自增显示ID（从1开始）
- 更新数据库迁移脚本
- 修改前端列表页显示ID"

# 修复 Bug
git commit -m "fix(dashboard): 修复供应商数量统计问题

使用 response.total 获取总数而非 data.length"

# 文档更新
git commit -m "docs: 更新 CLAUDE.md 版本管理说明"
```

## 3. 分支策略

### 主分支

- `master` / `main`: 生产环境代码
- `develop`: 开发环境代码

### 功能分支

```
feature/<功能名>
例如: feature/supplier-display-id
```

### 修复分支

```
fix/<问题描述>
例如: fix/dashboard-supplier-count
```

### 发布分支

```
release/<版本号>
例如: release/v2.2.0
```

## 4. 开发工作流程

### 开始新功能开发

```bash
# 1. 从 develop 创建功能分支
git checkout develop
git checkout -b feature/your-feature-name

# 2. 开发并提交
git add .
git commit -m "feat: 描述你的功能"

# 3. 推送到远程
git push origin feature/your-feature-name
```

### 完成功能开发

```bash
# 1. 切换到 develop
git checkout develop

# 2. 合并功能分支
git merge feature/your-feature-name

# 3. 推送更新
git push origin develop

# 4. 删除功能分支（可选）
git branch -d feature/your-feature-name
```

## 5. 版本标签

### 创建标签

```bash
# 轻量标签
git tag v2.1.0

# 附注标签（推荐）
git tag -a v2.1.0 -m "v2.1.0 版本发布

- 完成统计分析页面全面升级
- 添加供应商 displayId 功能
- 修复 Dashboard 统计数据问题"

# 推送标签到远程
git push origin v2.1.0
git push origin --tags
```

### 查看标签

```bash
# 列出所有标签
git tag

# 查看标签信息
git show v2.1.0
```

## 6. 常用场景

### 撤销修改

```bash
# 撤销工作区修改
git checkout -- <file>

# 撤销暂存区修改
git reset HEAD <file>

# 撤销最后一次提交（保留修改）
git reset --soft HEAD~1

# 撤销最后一次提交（丢弃修改）
git reset --hard HEAD~1
```

### 临时保存工作

```bash
# 保存当前工作状态
git stash

# 保存并添加描述
git stash save "描述信息"

# 查看保存列表
git stash list

# 恢复保存的工作
git stash pop

# 删除保存的工作
git stash drop
```

### 查看差异

```bash
# 查看工作区与暂存区差异
git diff

# 查看暂存区与上次提交差异
git diff --cached

# 查看两个分支差异
git diff master develop
```

## 7. 项目特定工作流

### 添加新功能

1. 创建功能分支
2. 后端开发（实体、DTO、服务、控制器）
3. 前端开发（API、组件、页面）
4. 测试功能
5. 更新文档（CLAUDE.md）
6. 提交代码
7. 合并到 develop

### 修复 Bug

1. 创建修复分支
2. 定位问题
3. 修复代码
4. 验证修复
5. 更新相关文档
6. 提交代码
7. 合并到 develop

### 数据库迁移

1. 创建迁移脚本 `backend/scripts/migrate-*.js`
2. 测试迁移脚本
3. 更新实体定义
4. 更新 CLAUDE.md
5. 提交代码
6. 创建版本标签

## 8. 版本号规范

遵循语义化版本 (Semantic Versioning): `主版本.次版本.修订版本`

- **主版本**: 不兼容的 API 变更
- **次版本**: 向下兼容的功能新增
- **修订版本**: 向下兼容的 Bug 修复

示例:
- `v2.1.0` → `v2.2.0`: 新增功能模块
- `v2.1.0` → `v2.1.1`: Bug 修复
- `v2.1.0` → `v3.0.0`: 重大架构变更

## 9. 当前项目状态

### 当前版本: v2.1.0

### 最近更新
- 供应商 displayId 功能
- Dashboard 统计数据修复
- 价格查询功能
- 统计分析页面升级

### 下一步计划
- 创建远程仓库
- 设置 develop 分支
- 配置 CI/CD
