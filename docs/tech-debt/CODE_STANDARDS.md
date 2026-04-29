# 投标管理系统 - 代码规范文档

> 版本: v1.0.0 | 更新日期: 2026-04-20

---

## 目录

- [通用规范](#通用规范)
- [后端代码规范](#后端代码规范)
- [前端代码规范](#前端代码规范)
- [命名规范](#命名规范)
- [注释规范](#注释规范)
- [错误处理规范](#错误处理规范)

---

## 通用规范

### 文件组织

```
src/
├── common/          # 公共模块（跨模块共享）
│   ├── constants/   # 常量定义
│   ├── decorators/  # 装饰器
│   ├── dto/         # 数据传输对象
│   ├── entities/    # 实体基类
│   ├── exceptions/  # 自定义异常
│   ├── filters/     # 异常过滤器
│   ├── guards/      # 守卫
│   ├── interceptors/# 拦截器
│   ├── interfaces/  # 接口定义
│   ├── pipes/       # 管道
│   └── utils/       # 工具函数
└── modules/         # 业务模块
    └── {module-name}/
        ├── dto/
        ├── entities/
        ├── {module-name}.controller.ts
        ├── {module-name}.service.ts
        └── {module-name}.module.ts
```

### Git 提交规范

使用语义化提交信息：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)**:
- `feat`: 新功能
- `fix`: 修复 bug
- `refactor`: 重构
- `style`: 代码格式调整
- `docs`: 文档更新
- `test`: 测试相关
- `chore`: 构建/工具链相关

**示例**:
```bash
feat(auth): 添加 JWT 刷新令牌功能

- 实现令牌刷新端点
- 添加令牌黑名单机制
- 更新认证守卫逻辑

Closes #123
```

---

## 后端代码规范

### NestJS 模块结构

每个业务模块应遵循以下结构：

```typescript
// {module}.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Entity])],
  controllers: [Controller],
  providers: [Service],
  exports: [Service],
})
export class Module {}
```

### Service 层规范

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // 1. 使用明确的返回类型
  async findAll(): Promise<User[]> {}

  // 2. 使用 DTO 作为参数
  async create(dto: CreateUserDto): Promise<User> {}

  // 3. 事务处理使用 QueryRunner
  async createWithTransaction(dto: CreateUserDto): Promise<User> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ... 业务逻辑
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

### Controller 层规范

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 1. 使用装饰器定义路由
  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResponse({ status: 200, type: [User] })
  findAll(@Query() query: UserQueryDto): Promise<User[]> {
    return this.userService.findAll(query);
  }

  // 2. 参数验证使用 DTO
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto): Promise<User> {
    return this.userService.create(dto);
  }

  // 3. 使用自定义异常
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }
}
```

### Entity 规范

```typescript
@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  @Index()
  name: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
```

### DTO 规范

```typescript
// 创建 DTO
export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: '张三' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: '邮箱', example: 'test@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '金额', example: 100.50 })
  @IsNumber()
  @Min(0)
  amount: number;
}

// 查询 DTO
export class UserQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;
}
```

---

## 前端代码规范

### Vue 3 组件规范

```vue
<script setup lang="ts">
// 1. 导入顺序: Vue > 第三方库 > 本地模块
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { userApi } from '@/api/user'

// 2. 接口定义
interface User {
  id: number
  name: string
  email: string
}

// 3. Props 定义
interface Props {
  userId: number
  readonly?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

// 4. Emits 定义
interface Emits {
  (e: 'update', user: User): void
  (e: 'delete', id: number): void
}
const emit = defineEmits<Emits>()

// 5. 响应式状态
const loading = ref(false)
const formData = ref<Partial<User>>({})

// 6. 计算属性
const canEdit = computed(() => !props.readonly)

// 7. 方法
async function handleSubmit() {
  // ...
}

// 8. 生命周期
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="user-form">
    <!-- 模板内容 -->
  </div>
</template>

<style scoped lang="scss">
.user-form {
  // 样式
}
</style>
```

### Composable 规范

```typescript
// composables/useListPage.ts
import { ref, computed } from 'vue'

export interface UseListPageOptions<T> {
  apiCall: (params: any) => Promise<{ data: T[]; total: number }>
  pageSize?: number
  filterFn?: (data: T[], filters: any) => T[]
}

export function useListPage<T>(options: UseListPageOptions<T>) {
  const loading = ref(false)
  const data = ref<T[]>([])
  const pagination = ref({
    page: 1,
    limit: options.pageSize || 10,
    total: 0,
  })

  const loadData = async (filters?: any) => {
    loading.value = true
    try {
      const result = await options.apiCall({
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...filters,
      })
      data.value = options.filterFn
        ? options.filterFn(result.data, filters)
        : result.data
      pagination.value.total = result.total
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    data,
    pagination,
    loadData,
  }
}
```

### Store 规范 (Pinia)

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref<User | null>(null)
  const token = ref<string>('')

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => currentUser.value?.name ?? '')

  // Actions
  async function login(credentials: LoginDto) {
    // ...
  }

  function logout() {
    currentUser.value = null
    token.value = ''
  }

  return {
    currentUser,
    token,
    isLoggedIn,
    userName,
    login,
    logout,
  }
})
```

### API 调用规范

```typescript
// api/user.ts
import request from '@/utils/request'
import type { User, CreateUserDto, UpdateUserDto } from '@/types/user'

export const userApi = {
  // 列表
  getList: (params?: any) =>
    request.get<{ data: User[]; total: number }>('/users', { params }),

  // 详情
  getDetail: (id: number) =>
    request.get<User>(`/users/${id}`),

  // 创建
  create: (dto: CreateUserDto) =>
    request.post<User>('/users', dto),

  // 更新
  update: (id: number, dto: UpdateUserDto) =>
    request.patch<User>(`/users/${id}`, dto),

  // 删除
  delete: (id: number) =>
    request.delete(`/users/${id}`),
}
```

---

## 命名规范

### 文件命名

- **组件**: PascalCase - `UserList.vue`, `UserDetail.vue`
- **Composable**: camelCase with 'use' prefix - `useUserList.ts`, `useAuth.ts`
- **Store**: camelCase - `user.ts`, `notification.ts`
- **工具函数**: camelCase - `formatDate.ts`, `validation.ts`
- **常量**: UPPER_SNAKE_CASE - `API_BASE_URL`, `MAX_RETRY_COUNT`

### 变量命名

```typescript
// 布尔值: is/has/can 前缀
const isLoading = ref(false)
const hasPermission = computed(() => !!user.value)
const canEdit = ref(true)

// 数组: 复数形式
const users = ref<User[]>([])
const projectItems = ref<Item[]>([])

// 回调函数: on/handle 前缀
function onSubmit() {}
function handlePageChange() {}
function onDialogClose() {}

// 异步函数: 动词开头
async function loadData() {}
async function createUser() {}
async function fetchProjects() {}
```

---

## 注释规范

### JSDoc 注释

```typescript
/**
 * 计算项目的总金额
 * @param items - 项目物品列表
 * @param includeTax - 是否包含税金
 * @returns 计算后的总金额
 * @throws {BusinessException} 当物品列表为空时
 */
export function calculateTotalAmount(
  items: ProjectItem[],
  includeTax = false,
): number {
  if (!items.length) {
    throw new BusinessException('物品列表不能为空')
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return includeTax ? total * 1.13 : total
}
```

### 复杂逻辑注释

```typescript
// 不是显而易见的逻辑需要注释
// 如果用户已登录且角色是管理员，则跳过权限检查
if (user.role === 'admin' && user.isLoggedIn) {
  return true
}

// TODO: 这里的性能有问题，需要优化
// FIXME: 修复金额计算精度问题
// HACK: 临时解决方案，等待后端接口更新
```

---

## 错误处理规范

### 后端错误处理

```typescript
// 1. 使用自定义异常
throw new BusinessException('业务错误描述')
throw new NotFoundException('资源不存在')
throw new BadRequestException('请求参数错误')

// 2. Service 层异常处理
async function deleteUser(id: number) {
  try {
    await this.userRepository.delete(id)
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED') {
      throw new ConflictException('该用户有关联数据，无法删除')
    }
    throw error
  }
}

// 3. 全局异常过滤器统一处理
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // 统一错误响应格式
  }
}
```

### 前端错误处理

```typescript
// 1. API 调用错误处理
async function loadData() {
  loading.value = true
  try {
    data.value = await api.getList()
  } catch (error) {
    // 错误已被拦截器处理，这里只做特定处理
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 2. 表单验证错误处理
function handleSubmit(formEl: FormInstance | undefined) {
  if (!formEl) return

  formEl.validate((valid) => {
    if (!valid) {
      ElMessage.warning('请检查表单填写')
      return
    }
    // 提交表单
  })
}

// 3. 用户友好的错误提示
ElMessage.error('操作失败，请稍后重试')
ElMessage.warning('表单填写不完整')
```

---

## 代码审查清单

### 提交代码前检查

- [ ] 代码符合 ESLint 规范
- [ ] TypeScript 类型检查无错误
- [ ] 组件/函数有适当的注释
- [ ] 错误被正确处理
- [ ] 没有调试用的 console.log
- [ ] 没有注释掉的代码
- [ ] 变量和函数命名清晰
- [ ] 没有重复代码
- [ ] 提交信息符合规范

### 代码审查要点

1. **可读性**: 代码是否易于理解
2. **可维护性**: 修改是否容易
3. **性能**: 是否有性能问题
4. **安全性**: 是否有安全漏洞
5. **测试**: 是否有足够测试覆盖
