# 投标管理系统 - API 设计规范

> 版本: v1.0.0 | 更新日期: 2026-04-20

---

## 目录

- [通用规范](#通用规范)
- [RESTful API 设计](#restful-api-设计)
- [响应格式规范](#响应格式规范)
- [错误处理规范](#错误处理规范)
- [API 文档规范](#api-文档规范)
- [安全规范](#安全规范)

---

## 通用规范

### 基础 URL

```
开发环境: http://localhost:3000/api
生产环境: https://api.example.com/api
```

### API 版本控制

```
当前版本: v1 (隐式，无版本前缀)

未来版本计划:
/api/v1/...  (当前版本)
/api/v2/...  (未来版本)
```

### 编码规范

- **字符编码**: UTF-8
- **HTTP 方法**: 大写 (GET, POST, PUT, DELETE, PATCH)
- **URL 路径**: 小写，单词用连字符分隔 (kebab-case)
- **Query 参数**: 小驼峰 (camelCase)

---

## RESTful API 设计

### 资源命名规范

```
✅ 正确:
GET    /api/users          # 获取用户列表
GET    /api/users/:id      # 获取用户详情
POST   /api/users          # 创建用户
PATCH  /api/users/:id      # 更新用户
DELETE /api/users/:id      # 删除用户

❌ 错误:
GET    /api/getUsers       # 不要在 URL 中使用动词
GET    /api/user           # 使用复数形式
POST   /api/User           # 不要使用大写
```

### HTTP 方法语义

| 方法 | 用途 | 幂等性 | 示例 |
|------|------|--------|------|
| GET | 查询资源 | ✅ | GET /api/users |
| POST | 创建资源 | ❌ | POST /api/users |
| PUT | 完整更新资源 | ✅ | PUT /api/users/:id |
| PATCH | 部分更新资源 | ❌ | PATCH /api/users/:id |
| DELETE | 删除资源 | ✅ | DELETE /api/users/:id |

### URL 设计示例

```typescript
// 简单资源
GET    /api/suppliers                    # 获取供应商列表
POST   /api/suppliers                    # 创建供应商
GET    /api/suppliers/:id                # 获取供应商详情
PATCH  /api/suppliers/:id                # 更新供应商
DELETE /api/suppliers/:id                # 删除供应商

// 嵌套资源
GET    /api/consult-projects/:id/items   # 获取项目的物品列表
POST   /api/consult-projects/:id/items   # 为项目添加物品
GET    /api/consult-projects/items/:itemId  # 获取物品详情
PATCH  /api/consult-projects/items/:itemId  # 更新物品
DELETE /api/consult-projects/items/:itemId  # 删除物品

// 动作类型（当 RESTful 不足以表达时）
POST   /api/consult-projects/quotes/:quoteId/toggle   # 切换选中状态
POST   /api/bid-projects/from-consult/:consultId      # 从咨询项目创建
POST   /api/payments/receipts/:id/pause               # 暂停订阅
POST   /api/notifications/mark-all-read                # 批量操作

// 搜索和过滤
GET    /api/suppliers?search=关键词&page=1&limit=10
GET    /api/consult-projects?status=in_progress&sort_by=created_at&order=desc

// 统计和分析
GET    /api/statistics/overview        # 统计概览
GET    /api/bid-projects/:id/statistics # 项目统计
```

### 分页规范

```typescript
// 请求
GET /api/users?page=1&limit=10

// 响应
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 排序规范

```typescript
// 单字段排序
GET /api/users?sort_by=created_at&order=desc

// 多字段排序（用逗号分隔）
GET /api/users?sort_by=created_at,name&order=desc,asc
```

### 过滤规范

```typescript
// 简单过滤
GET /api/users?status=active

// 范围过滤
GET /api/payments?amount_gte=100&amount_lte=1000

// 日期范围
GET /api/projects?created_from=2026-01-01&created_to=2026-12-31

// 多选过滤
GET /api/projects?status=in_progress,completed

// 搜索
GET /api/suppliers?search=科技
```

---

## 响应格式规范

### 统一响应结构

```typescript
// 成功响应
interface ApiResponse<T> {
  success: true
  data: T
  timestamp: string
}

// 列表响应
interface ListResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
  }
  timestamp: string
}

// 错误响应
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}
```

### 成功响应示例

```json
// 单个资源
{
  "success": true,
  "data": {
    "id": 1,
    "name": "供应商A",
    "contact": "张三",
    "phone": "13800138000"
  },
  "timestamp": "2026-04-20T10:30:00.000Z"
}

// 资源列表
{
  "success": true,
  "data": [
    { "id": 1, "name": "项目A" },
    { "id": 2, "name": "项目B" }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100
  },
  "timestamp": "2026-04-20T10:30:00.000Z"
}

// 创建成功 (201 Created)
{
  "success": true,
  "data": {
    "id": 123,
    "name": "新创建的项目"
  },
  "timestamp": "2026-04-20T10:30:00.000Z"
}

// 无内容 (204 No Content)
// 响应体为空
```

---

## 错误处理规范

### HTTP 状态码

| 状态码 | 说明 | 使用场景 |
|--------|------|----------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 204 | No Content | 删除成功，无返回内容 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证或认证失败 |
| 403 | Forbidden | 无权限访问 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如唯一约束） |
| 422 | Unprocessable Entity | 验证失败 |
| 500 | Internal Server Error | 服务器内部错误 |

### 错误码规范

```typescript
// 错误码格式: {模块}_{错误类型}_{具体错误}
// 例如: USER_NOT_FOUND, PROJECT_ALREADY_DELETED

enum ErrorCode {
  // 通用错误 (10xxx)
  UNKNOWN_ERROR = '10000',
  VALIDATION_ERROR = '10001',
  UNAUTHORIZED = '10002',
  FORBIDDEN = '10003',
  NOT_FOUND = '10004',
  CONFLICT = '10005',

  // 用户错误 (11xxx)
  USER_NOT_FOUND = '11001',
  USER_ALREADY_EXISTS = '11002',
  INVALID_CREDENTIALS = '11003',

  // 项目错误 (12xxx)
  PROJECT_NOT_FOUND = '12001',
  PROJECT_ALREADY_DELETED = '12002',
  PROJECT_HAS_ITEMS = '12003',
  INVALID_PROJECT_STATUS = '12004',

  // 数据库错误 (20xxx)
  DATABASE_ERROR = '20001',
  CONSTRAINT_VIOLATION = '20002',
  CONNECTION_FAILED = '20003',
}
```

### 错误响应示例

```json
// 400 Bad Request - 参数验证失败
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": {
      "name": ["名称不能为空"],
      "email": ["邮箱格式不正确"]
    }
  },
  "timestamp": "2026-04-20T10:30:00.000Z"
}

// 401 Unauthorized
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "登录已过期，请重新登录"
  },
  "timestamp": "2026-04-20T10:30:00.000Z"
}

// 404 Not Found
{
  "success": false,
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "项目不存在"
  },
  "timestamp": "2026-04-20T10:30:00.000Z"
}

// 409 Conflict
{
  "success": false,
  "error": {
    "code": "USER_ALREADY_EXISTS",
    "message": "用户已存在",
    "details": {
      "field": "email",
      "value": "test@example.com"
    }
  },
  "timestamp": "2026-04-20T10:30:00.000Z"
}

// 500 Internal Server Error
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "服务暂时不可用，请稍后重试"
  },
  "timestamp": "2026-04-20T10:30:00.000Z"
}
```

---

## API 文档规范

### Swagger/OpenAPI 配置

```typescript
// main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const config = new DocumentBuilder()
    .setTitle('投标管理系统 API')
    .setDescription('提供项目、供应商、物料、付款等管理功能')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api-docs', app, document)

  await app.listen(3000)
}
```

### Controller 文档注解

```typescript
@ApiTags('咨询项目')
@Controller('consult-projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConsultProjectController {
  @Get()
  @ApiOperation({ summary: '获取咨询项目列表', description: '支持分页、搜索、排序' })
  @ApiResponse({ status: 200, type: [ConsultProject] })
  @ApiResponse({ status: 401, description: '未认证' })
  findAll(@Query() query: QueryDto) {
    return this.service.findAll(query)
  }

  @Post()
  @ApiOperation({ summary: '创建咨询项目' })
  @ApiResponse({ status: 201, type: ConsultProject })
  @ApiResponse({ status: 400, description: '参数验证失败' })
  create(@Body() dto: CreateDto) {
    return this.service.create(dto)
  }
}
```

### DTO 文档注解

```typescript
export class CreateConsultProjectDto {
  @ApiProperty({
    description: '项目名称',
    example: 'XX公司办公楼改造项目',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string

  @ApiProperty({
    description: '项目编号',
    example: 'PRJ20260420001',
    uniqueItems: true,
  })
  @IsString()
  @IsNotEmpty()
  code: string

  @ApiProperty({
    description: '客户名称',
    example: 'XX科技有限公司',
    required: false,
  })
  @IsString()
  @IsOptional()
  customer?: string

  @ApiProperty({
    description: '项目状态',
    enum: ProjectStatus,
    default: ProjectStatus.CONSULTING,
    required: false,
  })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus
}
```

---

## 安全规范

### 认证机制

```typescript
// JWT Bearer Token 认证
Authorization: Bearer <token>

// Token 结构
{
  "sub": "user_id",
  "username": "admin",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234567890 + 7*24*60*60
}

// Token 有效期: 7天
```

### 权限控制

```typescript
// 基于角色的访问控制 (RBAC)
enum Role {
  ADMIN = 'admin',        // 管理员 - 全部权限
  USER = 'user',          // 普通用户 - 基本权限
  GUEST = 'guest',        // 访客 - 只读权限
}

// 使用守卫保护端点
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UserController {
  // 只有管理员可以访问
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id)
  }
}
```

### 输入验证

```typescript
// 使用 class-validator 进行验证
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string

  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @Matches(/^1[3-9]\d{9}$/)
  phone: string

  @IsNumber()
  @Min(0)
  @Max(1000000)
  amount: number
}
```

### SQL 注入防护

```typescript
// ✅ 使用参数化查询 (TypeORM 自动处理)
const users = await this.userRepository.find({
  where: { name: Like(`%${keyword}%`) }
})

// ❌ 避免 SQL 拼接
const query = `SELECT * FROM users WHERE name = '${name}'`
```

### XSS 防护

```typescript
// 后端输出转义
@Transform(({ value }) => value?.trim())
@IsString()
name: string

// 前端输出转义
// Vue 默认转义 HTML，使用 v-html 时需要谨慎
```

### 速率限制

```typescript
// 使用 @nestjs/throttler 限制请求频率
@Throttle({
  default: {
    limit: 10,    // 10 次
    ttl: 60000,   // 60 秒
  },
})
@Controller('auth')
export class AuthController {
  @Post('login')
  login() {
    // 每分钟最多 10 次登录尝试
  }
}
```

---

## API 版本演进

### 向后兼容原则

1. **只添加，不删除**: 新增字段不影响旧客户端
2. **可选字段**: 新增字段应该是可选的
3. **默认值**: 新增字段应该有合理的默认值
4. **弃用通知**: 废弃的端点应该返回警告

### 版本迁移策略

```typescript
// v1 API (当前)
GET /api/users
{
  "data": {
    "id": 1,
    "name": "张三",
    "phone": "13800138000"
  }
}

// v2 API (未来)
GET /api/v2/users
{
  "data": {
    "id": 1,
    "fullName": "张三",
    "contact": {
      "phone": "13800138000",
      "email": "zhangsan@example.com"
    }
  }
}

// 过渡期：v1 同时兼容新旧格式
GET /api/users?include_new_fields=true
```

---

## API 设计最佳实践

### DO ✅

```typescript
// 1. 使用名词表示资源
GET /api/users
POST /api/users

// 2. 使用复数形式
GET /api/suppliers
GET /api/items

// 3. 使用标准 HTTP 方法
GET    /api/users/:id      # 查询
POST   /api/users          # 创建
PATCH  /api/users/:id      # 更新
DELETE /api/users/:id      # 删除

// 4. 使用查询参数进行过滤
GET /api/users?status=active&role=admin

// 5. 分页使用 page/limit
GET /api/users?page=1&limit=10

// 6. 返回合适的 HTTP 状态码
201 Created    # 创建成功
204 No Content # 删除成功
400 Bad Request # 参数错误
```

### DON'T ❌

```typescript
// 1. 不要在 URL 中使用动词
GET /api/getUsers              ❌
GET /api/users                 ✅

// 2. 不要使用大写
GET /api/Users                 ❌
GET /api/users                 ✅

// 3. 不要返回嵌套过深的结构
{
  "data": {
    "user": {
      "profile": {
        "contact": {
          "phone": "..."
        }
      }
    }
  }
}                              ❌

// 4. 不要在 URL 中传递复杂参数
GET /api/users?filter={"name":"张三"}  ❌
GET /api/users?name=张三               ✅

// 5. 不要忽略错误处理
DELETE /api/users/:id
// 返回 200，但用户已被删除          ❌
// 应返回 404                        ✅

// 6. 不要硬编码返回格式
{
  "code": 200,
  "msg": "success",
  "result": {...}
}                                   ❌
```
