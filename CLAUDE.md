# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**投标管理系统** - 一个用于管理咨询项目、投标、供应商、物料和财务跟踪的企业级应用。

**技术栈：**
- **后端**: NestJS 11.x + TypeORM + MySQL + JWT 认证
- **前端**: Vue 3 + TypeScript + Vite 6.x + Element Plus
- **端口**: 后端 3000，前端 5173（可能自动切换到 5176 等）
- **API 前缀**: `/api`

## 快速启动

### 启动服务
```bash
# 后端（在 backend 目录）
npm run start:dev

# 前端（在 frontend2 目录）
npm run dev
```

### 默认账户
- 用户名: `admin`
- 密码: `admin123`

## 常用命令

### 后端
```bash
cd backend
npm run start:dev    # 开发模式（热重载）
npm run start:debug  # 调试模式
npm run build        # 构建生产版本
npm run start:prod   # 运行生产版本
npm run lint         # ESLint 检查和自动修复
npm run format       # Prettier 格式化
npm run test         # 运行单元测试
npm run test:watch   # 监视模式运行测试
npm run test:cov     # 测试覆盖率
npm run test:e2e     # 运行 e2e 测试
```

### 前端
```bash
cd frontend2
npm run dev              # 开发模式
npm run build            # 构建生产版本
npm run preview          # 预览构建结果
npm run test             # 运行单元测试 (vitest)
npm run test:ui          # Vitest UI 模式
npm run test:coverage    # 测试覆盖率
npm run test:e2e         # 运行 e2e 测试 (playwright)
npm run test:e2e:ui      # Playwright UI 模式
npm run test:e2e:headed  # Playwright 有头模式
```

### 数据库工具
```bash
cd backend
node scripts/create-database.js            # 创建 MySQL 数据库
node scripts/create-admin.js               # 创建默认管理员账户
node scripts/migrate-bid-status.js         # 初始化咨询项目的中标状态字段
node scripts/migrate-supplier-price.js     # 添加供应商 price 字段
node scripts/migrate-supplier-display-id.js # 添加供应商 displayId 字段
```

**默认账户**: admin / admin123

## 架构说明

### 后端模块结构

```
backend/src/
├── modules/           # 功能模块（auth、user、supplier、category、item 等）
│   ├── [module-name]/
│   │   ├── dto/           # 请求/响应 DTO
│   │   ├── entities/      # TypeORM 实体
│   │   ├── [module].controller.ts
│   │   ├── [module].service.ts
│   │   └── [module].module.ts
├── common/            # 公共工具
│   ├── decorators/    # @User、@Roles、@Public 装饰器
│   ├── dto/           # PaginationDto、SearchDto、ExportDto
│   ├── export/        # Excel/PDF 导出服务
│   ├── filters/       # 全局异常过滤器
│   ├── guards/        # JWT 认证守卫、角色守卫
│   ├── interceptors/  # TransformInterceptor（统一 API 响应格式）
│   └── strategies/    # JWT 策略
└── config/            # 配置文件
```

**核心模式：**
- 所有模块导出 `Service` 供其他模块使用
- 控制器默认使用 `@UseGuards(JwtAuthGuard)`（app.module.ts 中已设为全局）
- 使用 `@Public()` 装饰器标记公开端点
- 使用 `@User()` 装饰器注入当前登录用户
- 响应拦截器统一包装：`{ success: true, data: ..., timestamp: ... }`

**认证流程**：
1. 用户登录 → `AuthService.login()` 返回 JWT token
2. 前端存储 token → localStorage.setItem('token', token)
3. 后续请求 → axios 自动在 header 添加 `Authorization: Bearer {token}`
4. JwtStrategy 验证 → 从 token 提取用户信息，调用 `UserService.findById()` 验证用户存在且激活
5. 请求处理器 → 通过 `@User()` 装饰器获取当前用户信息（id, username, role）

**JWT配置**（jwt.strategy.ts）：
- 从 `Authorization: Bearer {token}` header 提取 token
- 密钥：`JWT_SECRET` 环境变量（默认：'your-secret-key'）
- 过期时间：`JWT_EXPIRES_IN` 环境变量（默认：'7d'）
- 验证失败抛出 `UnauthorizedException`

### 前端结构

```
frontend2/src/
├── api/               # API 服务层（每个领域一个文件）
├── components/        # 可复用组件
├── composables/       # Vue 组合式函数（useNotification 等）
├── layouts/           # 页面布局（MainLayout）
├── router/            # Vue Router 配置
├── stores/            # Pinia 状态管理（user 等）
├── types/             # TypeScript 类型定义
├── utils/             # 工具函数（request.ts、format.ts、validation.ts）
└── views/             # 页面组件
```

**核心模式：**
- API 调用使用 `request.ts` - 配置好的 axios 实例，带拦截器
- 响应拦截器自动解包 `{ success: true, data: ... }` 格式
- 响应拦截器自动转换 DECIMAL 字符串为数字
- 路由守卫强制认证（除 /login、/register 外）
- Element Plus 图标在 main.ts 中全局注册

## 重要实现说明

### 供应商 displayId

供应商实体使用两种 ID：
- `id`: UUID 主键（内部使用）
- `displayId`: 自增显示 ID（从 1 开始，用户界面显示）

**实现细节**：
- `displayId` 字段设置为 `unique` 约束
- 创建供应商时自动查询 `MAX(displayId)` 并递增
- 只过滤未删除记录：`WHERE deletedAt IS NULL`
- 默认排序按 `displayId ASC`（自然排序）
- 支持按 `displayId` 排序（`findAll`、`advancedSearch`、`search` 方法）

**迁移脚本**：`migrate-supplier-display-id.js` - 为现有供应商生成 `displayId`

### 数据类型处理

**后端 DECIMAL 字段**在 TypeORM/MySQL 中返回为字符串。前端响应拦截器（`request.ts`）会自动将这些字段转换为数字：
- 金额字段：`totalAmount`、`amount`、`contractAmount`
- 价格字段：`price`、`avgPrice`、`minPrice`、`maxPrice`
- 评分字段：`rating`、`deliveryRating`
- 统计字段：`totalPayable`、`totalPaid`、`totalUnpaid` 等

**响应拦截器转换逻辑**：
- 跳过 `responseType: 'blob'` 的响应（文件下载）
- 解包标准 API 响应格式：`{ success: true, data: ... }`
- 递归转换 DECIMAL 字符串字段为数字
- 对于 `null`、`undefined` 或已经是数字的值保持不变

### 循环引用处理

**问题**：TypeORM 实体的双向关系（如 `BidProject.projectItems` 和 `BidProjectItem.project`）在 JSON 序列化时会产生循环引用错误。

**解决方案**：
1. 在实体上使用 `@Exclude({ toPlainOnly: true })` 装饰器标记**反向关系**
2. `TransformInterceptor` 使用 `class-transformer` 的 `instanceToPlain()` 进行序列化

**规则**：
- **保留**前端需要的父级集合（如 `BidProject.projectItems`、`BidProjectItem.suppliers`）
- **排除**会导致循环引用的反向关系（如 `BidProjectItem.project`、`BidSupplier.projectItem`）

**示例**：
```typescript
// BidProject 实体
@OneToMany(() => BidProjectItem, item => item.project)
projectItems: BidProjectItem[];  // 保留 - 前端需要

// BidProjectItem 实体
@ManyToOne(() => BidProject, project => project.projectItems)
@JoinColumn({ name: 'projectId' })
@Exclude({ toPlainOnly: true })  // 排除 - 防止循环引用
project: BidProject;
```

**涉及的实体**：
- BidProject, BidProjectItem, BidSupplier
- ConsultProject, ConsultProjectItem, SupplierQuote
- Supplier (排除 bidSuppliers, quotes, payments)

### 文件下载

对于文件下载（Excel 导出等），在 axios 配置中使用 `responseType: 'blob'` 来跳过响应处理。

**Excel 导出**：
- 供应商管理页面支持导出所有供应商数据为 Excel
- **权限限制**：仅管理员（`role === 'admin'`）可见导出按钮
- 导出查询限制设置为 10000 以获取所有数据
- 响应拦截器已处理 blob 类型响应的自动下载

### 咨询项目转中标项目

**关键流程**: ConsultProject → BidProject 转换
1. 用户在咨询项目详情页选择供应商报价
2. POST `/api/bid-projects/from-consult/:consultId` 创建中标项目
3. 复制项目信息、物品和选中的报价到中标供应商
4. 自动计算 `totalAmount`（来自选中报价）
5. 前端重定向到新建的中标项目详情页

**中标状态管理**：咨询项目的 `hasBidProject` 和 `bidProjectId` 字段在后端自动维护：
- 创建中标项目时：自动将咨询项目标记为已中标
- 删除中标项目时：自动清除咨询项目的中标标记
- 前端根据这些字段显示"已中标/未中标"标签和相应按钮

### 咨询项目总金额计算

**计算公式**：总金额 = 物品的最低报价（单价×数量）之和

**计算逻辑**：
1. 对每个物品，遍历所有供应商报价
2. 找出该物品的最低报价（price × quantity）
3. 将所有物品的最低报价累加得到项目总金额

**实现位置**：
- `backend/src/modules/consult-project/consult-project.service.ts` 的 `create()` 和 `findOne()` 方法
- 前端列表页和详情页在总金额旁有 ℹ️ 图标显示计算规则说明

### 中标项目总金额计算

**计算公式**：项目总金额 = 所有选中供应商的总金额之和

**计算逻辑**：
- 遍历所有物品的所有供应商
- 累加 `isSelected=true` 的供应商的 `amount` 值
- 金额自动更新时机：添加/删除供应商、修改选中状态、更新价格/数量

**实现位置**：
- `backend/src/modules/bid-project/bid-project.service.ts` 的 `recalculateProjectAmount()` 方法
- 在供应商的增删改操作后自动调用

### 中标供应商定价模型

**字段说明**：
- `price`: 单价（DECIMAL）
- `amount`: 总金额 = price × 物品数量

**自动计算规则**：
- 添加/编辑供应商时，系统自动计算 `amount = price × item.quantity`
- 修改物品数量时，自动更新该物品所有供应商的 `amount`

### 实体关系

```
ConsultProject ──拥有多个──> ConsultProjectItem ──拥有多个──> SupplierQuote
        │                                       │
        └── consultProjectId ───────────────────┘
        │
        └──> BidProject (通过 consultProjectId，可选)
                │
                └──> BidProjectItem ──拥有多个──> BidSupplier

BidProject ──拥有多个──> PaymentRecord (供应商付款，CASCADE)
BidProject ──拥有多个──> ReceiptRecord (客户收款，CASCADE)
Supplier ──> SupplierQuote (一对多)
Supplier ──> BidSupplier (一对多)
```

**删除级联**：
- 删除 BidProject 时，关联的 PaymentRecord 和 ReceiptRecord 会被数据库自动删除（`onDelete: 'CASCADE'`）
- 删除 BidProjectItem 时，关联的 BidSupplier 会被数据库自动删除（`onDelete: 'CASCADE'`）
- 删除 ConsultProjectItem 时，关联的 SupplierQuote 会被数据库自动删除（`onDelete: 'CASCADE'`）

**软删除级联规则**：
- `BidProject`：支持软删除（`@DeleteDateColumn()`）
- `BidProjectItem`：硬删除（`onDelete: 'CASCADE'`）
- `BidSupplier`：硬删除（`onDelete: 'CASCADE'`）
- `PaymentRecord`：硬删除（`onDelete: 'CASCADE'`）
- `ReceiptRecord`：硬删除（`onDelete: 'CASCADE'`）
- `ConsultProject`：支持软删除
- `ConsultProjectItem`：硬删除（`onDelete: 'CASCADE'`）
- `SupplierQuote`：硬删除（`onDelete: 'CASCADE'`）

**重要**：删除 BidProject 时，关联的 BidProjectItem、BidSupplier、PaymentRecord 和 ReceiptRecord 会自动被数据库级联删除，无需手动处理。

**删除逻辑验证**（2026-04-29）：
- ✅ 咨询项目使用软删除，关联的项目项和报价通过数据库 `CASCADE` 自动硬删除
- ✅ 中标项目使用软删除，删除前会先清除关联咨询项目的 `hasBidProject` 和 `bidProjectId` 标记
- ✅ 所有 `findOne` 和列表查询都正确过滤 `deletedAt IS NULL`
- ✅ 前端删除功能正常：确认对话框 → API 调用 → 刷新列表

### 模块依赖

跨模块注入 Repository 时：
1. 在模块的 TypeOrmModule.forFeature() 中导入实体
2. 实体必须在 app.module.ts 的 TypeOrmModule entities 数组中注册
3. 如果其他模块需要使用，导出 Service

**示例**：如果 ConsultProjectService 需要 BidProjectRepository：
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([ConsultProject, BidProject])],
  providers: [ConsultProjectService],
  exports: [ConsultProjectService],
})
```

### 已知问题

**后端热重载问题**：NestJS 的 `npm run start:dev` watch 模式有时不会正确检测文件更改并重新编译。如果代码修改后 API 没有生效：
1. 检查控制台是否有编译错误
2. 完全重启后端进程（`taskkill //F //IM node.exe` 后重新运行）
3. 确认端口 3000 没有被旧进程占用（`netstat -an | grep :3000`）

**TypeORM DECIMAL 聚合问题**：在某些聚合查询（SUM、GROUP BY）中，TypeORM/mysql2 可能返回格式异常的字符串（如 `"011700.009900.00"`）而非正确的数值。

**解决方案**：
1. 对于简单聚合：在 JavaScript 中使用 `parseFloat()` 手动处理
2. 对于复杂聚合：使用 `dataSource.query()` 执行原生 SQL，在内存中使用 Map 进行聚合计算
3. 前端响应拦截器会自动转换 DECIMAL 字符串为数字，但对格式异常的数据可能需要额外处理

**示例**（statistics.service.ts 的 getSupplierStatistics）：
```typescript
// 使用 Map 在内存中聚合，避免 TypeORM 返回异常格式
const supplierMap = new Map<string, { totalAmount: number; amounts: number[] }>();
for (const row of rawData) {
  const amount = parseFloat(row.amount) || 0;
  // 手动累加...
}
```

### 重要注意事项

1. **供应商编辑**：编辑供应商信息时，前端只发送非空字段，避免空字符串覆盖数据库值
2. **项目金额更新**：中标项目的总金额是动态计算的，任何供应商变更都会触发重新计算
3. **咨询项目转中标**：转换后，咨询项目的 `hasBidProject` 和 `bidProjectId` 会自动更新

4. **用户数据隔离（多租户）**：
   - 这是一个**多租户系统**，非管理员用户只能访问自己创建的数据
   - TypeORM QueryBuilder 会自动处理用户过滤（通过 `@User()` 装饰器注入的用户信息）
   - **原生 SQL 查询必须手动添加用户过滤**，否则会返回所有用户的数据
   - 检查清单：任何使用 `repository.query()` 或 `dataSource.query()` 的地方，都要确保添加了 `AND userId = ?` 或类似过滤条件
   - 示例（payment.service.ts）：
     ```typescript
     // ✅ 正确：添加用户过滤
     let rawQuery = `SELECT SUM(bs.amount) as total FROM ... WHERE ...`;
     if (currentUser.role !== UserRole.ADMIN) {
       rawQuery += ` AND bp.userId = '${currentUser.id}'`;
     }

     // ❌ 错误：缺少用户过滤，非管理员会看到所有用户的数据
     let rawQuery = `SELECT SUM(bs.amount) as total FROM ... WHERE ...`;
     ```

5. **软删除注意事项**：
   - `BidProject` 支持软删除（有 `@DeleteDateColumn()`）
   - `BidProjectItem` 和 `BidSupplier` **不支持**软删除（使用 `onDelete: 'CASCADE'` 硬删除）
   - 统计查询时必须显式过滤 `deletedAt IS NULL`，否则会包含已删除项目的数据
   - 示例：`LEFT JOIN bid_projects bp ON bp.id = bpi.projectId WHERE bp.deletedAt IS NULL`

5. **付款管理金额计算**：
   - **应付金额**：所有选中供应商（`isSelected=true`）的金额总和，需过滤已删除项目
   - **应收金额**：优先使用合同金额（`contractAmount`），如果为空则使用项目金额（`totalAmount`）
   - SQL 示例：`SUM(COALESCE(project.contractAmount, project.totalAmount, 0))`

6. **Dashboard 统计数据获取**：
   - 后端 `/api/statistics/overview` 不返回 `supplierCount` 和 `itemCount`
   - 前端需分别调用 `supplierApi.getList()` 和 `itemApi.getList()` 获取数量
   - **重要**：使用 `response.total` 获取总数，而非 `response.data.length`（分页限制）

**付款管理API**（`/api/payments`）：
| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/payments/statistics/overview` | 获取应收应付概览（统计分析页面使用） |
| GET | `/payments/statistics/payments` | 获取付款统计 |
| GET | `/payments/statistics/receipts` | 获取收款统计 |
| GET | `/payments/payments` | 获取所有付款记录 |
| GET | `/payments/payments/project/:projectId` | 获取项目的付款记录 |
| POST | `/payments/payments` | 创建付款记录 |
| DELETE | `/payments/payments/:id` | 删除付款记录 |
| GET | `/payments/receipts` | 获取所有收款记录 |
| GET | `/payments/receipts/project/:projectId` | 获取项目的收款记录 |
| POST | `/payments/receipts` | 创建收款记录 |
| PATCH | `/payments/receipts/:id` | 更新收款记录 |
| DELETE | `/payments/receipts/:id` | 删除收款记录 |

### 分页

所有列表端点支持：
- `page` - 页码（默认：1）
- `limit` - 每页条数（默认：10，可选：10/20/50/100）
- `sortBy` - 排序字段
- `sortOrder` - 排序方向（'ASC' 或 'DESC'）

响应格式：`{ data: [...], pagination: { page, limit, total } }`

### 测试

- 后端：Jest（单元测试在 `*.spec.ts` 文件中）
- 前端：Vitest 单元测试，Playwright e2e 测试
- 测试文件与源文件同目录

### WebSocket（通知）

- 端点：`/notifications`
- 库：Socket.IO
- 登录时自动连接（MainLayout.vue）
- 使用 `useNotification()` composable 管理 WebSocket 连接

### 定时任务提醒

**提醒模块**：`ReminderModule` 使用 `@nestjs/schedule` 实现定时任务

**收款提醒功能**：
- 每天早上9点自动检查即将到期的收款记录
- 多阶段提醒：提前7天、3天、1天
- 通过 `ReceiptRecord.reminderLog` 字段跟踪提醒状态，避免重复提醒
- 提醒格式：`{ "7days": "2024-03-08", "3days": "2024-03-12", "1day": "2024-03-14" }`

**通知类型**：
- `PROJECT` - 咨询项目、中标项目相关
- `PAYMENT` - 供应商付款
- `RECEIPT` - 客户收款（包括到期提醒）
- `SUPPLIER` - 供应商管理
- `SYSTEM` - 系统通知

**通知触发位置**：
- ConsultProjectService: 咨询项目创建
- BidProjectService: 咨询项目转中标
- PaymentService: 付款/收款记录创建
- SupplierService: 供应商创建
- ReminderService: 收款到期提醒（定时任务）

## 环境配置

**后端** （`backend/.env`）：
```env
NODE_ENV=development
PORT=3000
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=jn456521
DB_DATABASE=bid_management
JWT_SECRET=bid-management-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

**前端** （vite.config.ts）：
- 开发服务器：`http://localhost:5173`（可能自动切换到 5176 等端口）
- 代理：`/api` → `http://localhost:3000`

### 前端工具函数

**formatAmount 函数**（用于 Dashboard 和统计页面）：
- 处理 `undefined`、`null`、空字符串，返回 `'0'`
- 自动转换字符串格式的数字为数字类型
- 对 `NaN` 值返回 `'0'`
- 大于等于 10000 的金额显示为"万"单位
- 示例：
  ```typescript
  function formatAmount(amount: number | string | undefined | null): string {
    if (amount === undefined || amount === null || amount === '') return '0'
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numAmount)) return '0'
    if (numAmount >= 10000) return (numAmount / 10000).toFixed(1) + '万'
    return numAmount.toLocaleString()
  }
  ```

### 新增组件 (2026-04-28)

**PriceHistoryPanel** - 嵌入式历史价格面板组件
- 在报价/供应商管理对话框右侧显示历史价格参考
- 支持折叠/展开，避免占用过多空间

### 调试脚本

后端 `scripts/` 目录下的实用脚本：
- `check-amounts.js` - 检查数据库中的金额计算是否正确
- `create-database.js` - 创建 MySQL 数据库
- `create-admin.js` - 创建默认管理员账户
- `migrate-*.js` - 数据库迁移脚本

### 价格查询功能

**价格查询模块**提供历史价格参考和多维度查询能力。

#### 嵌入式历史价格面板

**组件**: [PriceHistoryPanel.vue](d:\MyProject\bid-management-system\frontend2\src\components\PriceHistoryPanel.vue)

在报价/供应商添加流程中嵌入历史价格参考，用户无需切换页面即可查看历史价格。

**集成位置**：
- 咨询项目：[QuoteManagementDialog.vue](d:\MyProject\bid-management-system\frontend2\src\components\consult-project\QuoteManagementDialog.vue) - 报价管理对话框右侧
- 中标项目：[BidProjectDetail.vue](d:\MyProject\bid-management-system\frontend2\src\views\BidProjectDetail.vue) - 供应商管理对话框右侧

**面板功能**：
- 价格统计：报价次数、最低价、平均价、最高价
- 最近报价列表（最近5条）
- 供应商排名（按平均价排序）
- 折叠/展开控制

**Props**：
```typescript
interface Props {
  itemId: string           // 物品ID
  projectId?: string       // 当前项目ID（可选）
  mode: 'consult' | 'bid'  // 咨询/中标模式
}
```

#### 独立价格查询页面

**页面**: [PriceQuery.vue](d:\MyProject\bid-management-system\frontend2\src\views\PriceQuery.vue)

**三种查询模式**：

**按物品查询**:
- 物品选择器 + 日期范围筛选
- 价格统计卡片 + 价格趋势指示
- 供应商报价排名表
- 历史报价明细（分页）

**按供应商查询**:
- 供应商选择器
- 统计信息（报价总数、涉及物品、平均价格、合作项目）
- 报价明细表

**按项目查询**:
- 项目类型选择（咨询/中标）
- 项目选择器
- 项目物品价格汇总

#### 价格查询API

**后端模块**: `backend/src/modules/price-query/`

**API端点**：
| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/price-query/search?q={query}` | 按物品名称搜索 |
| GET | `/api/price-query/supplier/{supplierId}` | 按供应商查询 |
| GET | `/api/price-query/trends/{itemId}` | 获取物品价格趋势 |

**API响应格式**：
```typescript
// 按物品搜索
{
  item: { id, name, code, model, spec, unit, category },
  consultQuotes: [
    { supplier, price, quantity, totalAmount, brand, contact, phone, project }
  ],
  bidSuppliers: [
    { supplier, price, quantity, amount, progress, paymentStatus }
  ]
}

// 价格趋势
{
  itemId,
  trends: [
    { date, supplier, price, totalAmount }
  ]
}
```

### 统计分析功能

**统计分析模块**提供财务和业务数据分析能力。

**页面**: [Statistics.vue](d:\MyProject\bid-management-system\frontend2\src\views\Statistics.vue)

**KPI卡片布局（三行）**：
- 第一行：应收总额、已收金额、未收金额、收款率
- 第二行：应付总额、已付金额、未付金额、付款率
- 第三行：毛利润、已实现利润、利润率

**时间范围筛选**：全部/本月/本季度/本年度

**数据源**：
- **应收/应付数据**：使用 `paymentApi.getOverviewStatistics()` （与付款管理页面相同数据源）
- **供应商排行**：使用 `statisticsApi.getSupplierStats()` （基于中标项目的供应商数据）

**后端模块**：
- `backend/src/modules/statistics/` - 统计分析模块
- `backend/src/modules/payment/` - 付款管理模块（提供应收/应付统计数据）

**API端点**：
| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/payments/statistics/overview` | 获取应收应付概览（主数据源） |
| GET | `/api/statistics/suppliers` | 获取供应商排行 |
| GET | `/api/statistics/monthly?year={year}` | 获取月度趋势数据 |

**金额格式化**：
- 统计页面使用精确数值显示（非"万"单位）
- `formatAmount()` 函数：`toLocaleString('zh-CN', { minimumFractionDigits: 2 })`

### 工作台 (Dashboard)

**页面**: [Dashboard.vue](d:\MyProject\bid-management-system\frontend2\src\views\Dashboard.vue)

**统计卡片**：
- 咨询项目数量
- 中标项目数量
- 供应商数量（需通过 `supplierApi.getList()` 单独获取）
- 物品数量（需通过 `itemApi.getList()` 单独获取）

**最近项目列表**：
- 显示最近 5 条咨询/中标项目记录
- 通过 `/api/statistics/recent-projects?limit=5` 获取

**重要说明**：
- 后端 `/api/statistics/overview` 不返回 `supplierCount`，需要前端单独调用 `supplierApi.getList()` 获取
- `formatAmount()` 函数已处理 `undefined`、`null`、空字符串和字符串格式的数字
- **分页响应处理**：API 返回分页数据时，使用 `response.total` 获取总数而非 `response.data.length`
  ```typescript
  // 正确做法
  const response = await supplierApi.getList()
  const count = response.total || 0  // 使用 total 字段

  // 错误做法
  const count = response.data.length  // 仅获取当前页数量
  ```
