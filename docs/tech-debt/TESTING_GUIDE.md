# 投标管理系统 - 测试指南

> 版本: v1.0.0 | 更新日期: 2026-04-20

---

## 目录

- [测试策略](#测试策略)
- [后端测试](#后端测试)
- [前端测试](#前端测试)
- [E2E 测试](#e2e-测试)
- [测试覆盖率目标](#测试覆盖率目标)

---

## 测试策略

### 测试金字塔

```
        /\
       /  \      E2E 测试 (10%)
      /    \     - 关键用户流程
     /------\    - 集成验证
    /        \
   /          \  集成测试 (20%)
  /            \ - API 测试
 /              \ - 模块集成
/----------------\
单元测试 (70%)    - 函数/类测试
- 业务逻辑
- 工具函数
- 组件单元
```

### 测试原则

1. **快速反馈**: 单元测试应该快速运行
2. **隔离性**: 测试之间相互独立
3. **可重复**: 测试结果应该稳定可重复
4. **可读性**: 测试代码应该清晰易懂

---

## 后端测试

### 单元测试

#### 测试框架配置

```bash
# 安装依赖
npm install --save-dev @nestjs/testing
npm install --save-dev jest @types/jest
npm install --save-dev supertest @types/supertest
```

#### Service 层测试

```typescript
// consult-project.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ConsultProjectService } from './consult-project.service'
import { ConsultProject } from './entities/consult-project.entity'
import { BusinessException } from '@/common/exceptions/business.exception'

describe('ConsultProjectService', () => {
  let service: ConsultProjectService
  let repository: Repository<ConsultProject>

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAndCount: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultProjectService,
        {
          provide: getRepositoryToken(ConsultProject),
          useValue: mockRepository,
        },
      ],
    }).compile()

    service = module.get<ConsultProjectService>(ConsultProjectService)
    repository = module.get<Repository<ConsultProject>>(
      getRepositoryToken(ConsultProject),
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('should return an array of projects', async () => {
      const expectedProjects = [
        { id: 1, name: '项目1' },
        { id: 2, name: '项目2' },
      ]
      mockRepository.findAndCount.mockResolvedValue([expectedProjects, 2])

      const result = await service.findAll({ page: 1, limit: 10 })

      expect(result.data).toEqual(expectedProjects)
      expect(result.total).toBe(2)
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        relations: expect.any(Array),
      })
    })
  })

  describe('calculateTotalAmount', () => {
    it('should calculate total amount correctly', () => {
      const items = [
        { price: 100, quantity: 2 },
        { price: 50, quantity: 3 },
      ]

      const total = service.calculateTotalAmount(items)

      expect(total).toBe(350) // 100*2 + 50*3
    })

    it('should throw BusinessException when items list is empty', () => {
      expect(() => service.calculateTotalAmount([])).toThrow(
        BusinessException,
      )
    })

    it('should handle decimal precision correctly', () => {
      const items = [
        { price: 10.33, quantity: 3 },
      ]

      const total = service.calculateTotalAmount(items)

      expect(total).toBe(30.99)
    })
  })

  describe('create', () => {
    it('should create a new project successfully', async () => {
      const createDto = {
        name: '新项目',
        customer: '客户A',
      }
      const savedProject = { id: 1, ...createDto }

      mockRepository.save.mockResolvedValue(savedProject)

      const result = await service.create(createDto)

      expect(result).toEqual(savedProject)
      expect(mockRepository.create).toHaveBeenCalledWith(createDto)
      expect(mockRepository.save).toHaveBeenCalled()
    })

    it('should throw error when creation fails', async () => {
      const createDto = { name: '新项目' }
      mockRepository.save.mockRejectedValue(new Error('Database error'))

      await expect(service.create(createDto)).rejects.toThrow('Database error')
    })
  })

  describe('update', () => {
    it('should update project when it exists', async () => {
      const existingProject = { id: 1, name: '旧名称' }
      const updateDto = { name: '新名称' }
      const updatedProject = { ...existingProject, ...updateDto }

      mockRepository.findOne.mockResolvedValue(existingProject)
      mockRepository.save.mockResolvedValue(updatedProject)

      const result = await service.update(1, updateDto)

      expect(result.name).toBe('新名称')
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDto),
      )
    })

    it('should throw NotFoundException when project does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null)

      await expect(service.update(999, { name: '新名称' })).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
```

#### Controller 层测试

```typescript
// consult-project.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { ConsultProjectController } from './consult-project.controller'
import { ConsultProjectService } from './consult-project.service'

describe('ConsultProjectController', () => {
  let controller: ConsultProjectController
  let service: ConsultProjectService

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsultProjectController],
      providers: [
        {
          provide: ConsultProjectService,
          useValue: mockService,
        },
      ],
    }).compile()

    controller = module.get<ConsultProjectController>(ConsultProjectController)
    service = module.get<ConsultProjectService>(ConsultProjectService)
  })

  describe('findAll', () => {
    it('should return an array of projects', async () => {
      const expectedResult = {
        data: [{ id: 1, name: '项目1' }],
        total: 1,
      }
      mockService.findAll.mockResolvedValue(expectedResult)

      const result = await controller.findAll({ page: 1, limit: 10 })

      expect(result).toEqual(expectedResult)
      expect(mockService.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 })
    })
  })

  describe('create', () => {
    it('should create a new project', async () => {
      const createDto = { name: '新项目' }
      const createdProject = { id: 1, ...createDto }

      mockService.create.mockResolvedValue(createdProject)

      const result = await controller.create(createDto)

      expect(result).toEqual(createdProject)
      expect(mockService.create).toHaveBeenCalledWith(createDto)
    })
  })
})
```

### 集成测试

```typescript
// consult-project.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '@/app.module'

describe('ConsultProjectController (e2e)', () => {
  let app: INestApplication
  let authToken: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())
    await app.init()

    // 登录获取 token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' })

    authToken = loginResponse.body.access_token
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/consult-projects (GET)', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/consult-projects')
        .expect(401)
    })

    it('should return array of projects with auth token', () => {
      return request(app.getHttpServer())
        .get('/consult-projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true)
        })
    })
  })

  describe('/consult-projects (POST)', () => {
    it('should create a new project', () => {
      const createDto = {
        name: 'E2E 测试项目',
        customer: '测试客户',
      }

      return request(app.getHttpServer())
        .post('/consult-projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe(createDto.name)
          expect(res.body.customer).toBe(createDto.customer)
        })
    })

    it('should return 400 for invalid input', () => {
      return request(app.getHttpServer())
        .post('/consult-projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' }) // 空名称
        .expect(400)
    })
  })
})
```

---

## 前端测试

### 单元测试

#### 配置

```bash
# 安装依赖
npm install --save-dev vitest @vue/test-utils
npm install --save-dev @vitest/ui
npm install --save-dev jsdom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
})
```

#### 工具函数测试

```typescript
// utils/format.spec.ts
import { describe, it, expect } from 'vitest'
import { formatAmount, formatPercent, formatDate } from '@/utils/format'

describe('formatAmount', () => {
  it('should format amount with locale string', () => {
    expect(formatAmount(1000)).toBe('1,000')
    expect(formatAmount(1234567.89)).toBe('1,234,567.89')
  })

  it('should handle zero', () => {
    expect(formatAmount(0)).toBe('0')
  })

  it('should handle negative numbers', () => {
    expect(formatAmount(-100)).toBe('-100')
  })
})

describe('formatPercent', () => {
  it('should format decimal to percentage', () => {
    expect(formatPercent(0.5)).toBe('50.0%')
    expect(formatPercent(0.75)).toBe('75.0%')
    expect(formatPercent(1)).toBe('100.0%')
  })

  it('should handle zero', () => {
    expect(formatPercent(0)).toBe('0.0%')
  })
})

describe('formatDate', () => {
  it('should format ISO date to YYYY-MM-DD', () => {
    expect(formatDate('2026-04-20T00:00:00Z')).toBe('2026-04-20')
    expect(formatDate('2026-12-31T23:59:59Z')).toBe('2026-12-31')
  })

  it('should handle invalid date', () => {
    expect(formatDate('invalid')).toBe('Invalid Date')
  })
})
```

#### Composable 测试

```typescript
// composables/useListPage.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useListPage } from '@/composables/useListPage'

describe('useListPage', () => {
  const mockApiCall = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { loading, data, pagination } = useListPage(mockApiCall, {
      pageSize: 10,
    })

    expect(loading.value).toBe(false)
    expect(data.value).toEqual([])
    expect(pagination.value).toEqual({ page: 1, limit: 10, total: 0 })
  })

  it('should load data successfully', async () => {
    const mockData = [{ id: 1 }, { id: 2 }]
    mockApiCall.mockResolvedValue({ data: mockData, total: 2 })

    const { loading, data, pagination, loadData } = useListPage(mockApiCall, {
      pageSize: 10,
    })

    await loadData()

    expect(loading.value).toBe(false)
    expect(data.value).toEqual(mockData)
    expect(pagination.value.total).toBe(2)
  })

  it('should handle loading state', async () => {
    let resolveApiCall: (value: any) => void
    mockApiCall.mockReturnValue(
      new Promise((resolve) => {
        resolveApiCall = resolve
      }),
    )

    const { loading, loadData } = useListPage(mockApiCall)

    const loadPromise = loadData()
    expect(loading.value).toBe(true)

    resolveApiCall!({ data: [], total: 0 })
    await loadPromise
    expect(loading.value).toBe(false)
  })
})
```

#### 组件测试

```typescript
// components/common/StatusTag.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusTag from '@/components/common/StatusTag.vue'

describe('StatusTag', () => {
  it('should render correct label for project status', () => {
    const wrapper = mount(StatusTag, {
      props: {
        type: 'project',
        status: 'in_progress',
      },
    })

    expect(wrapper.text()).toBe('进行中')
  })

  it('should render correct tag type', () => {
    const wrapper = mount(StatusTag, {
      props: {
        type: 'project',
        status: 'completed',
      },
    })

    expect(wrapper.find('.el-tag').classes()).toContain('el-tag--success')
  })

  it('should handle unknown status', () => {
    const wrapper = mount(StatusTag, {
      props: {
        type: 'project',
        status: 'unknown',
      },
    })

    expect(wrapper.text()).toBe('unknown')
  })
})
```

---

## E2E 测试

### 配置

```bash
# 安装依赖
npm install --save-dev @playwright/test
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
})
```

### E2E 测试示例

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/')
    await expect(page.locator('text=欢迎, admin')).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="username"]', 'invalid')
    await page.fill('input[name="password"]', 'wrong')
    await page.click('button[type="submit"]')

    await expect(page.locator('.el-message--error')).toBeVisible()
  })

  test('should redirect to login when accessing protected route', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })
})
```

```typescript
// e2e/consult-project.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Consult Project Management', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login')
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should create a new consult project', async ({ page }) => {
    await page.goto('/consult-projects')
    await page.click('text=新建项目')

    // 填写表单
    await page.fill('input[name="name"]', 'E2E 测试项目')
    await page.fill('input[name="code"]', 'E2E001')
    await page.fill('input[name="customer"]', 'E2E 客户')
    await page.click('button:has-text("确定")')

    // 验证创建成功
    await expect(page.locator('text=E2E 测试项目')).toBeVisible()
    await expect(page.locator('.el-message--success')).toBeVisible()
  })

  test('should add items to project', async ({ page }) => {
    // 进入项目详情
    await page.goto('/consult-projects')
    await page.click('text=E2E 测试项目')

    // 添加物品
    await page.click('text=添加物品')
    await page.click('.el-select')
    await page.click('.el-select-dropdown__item:has-text("测试物品")')
    await page.fill('input[name="quantity"]', '10')
    await page.click('button:has-text("确定")')

    // 验证添加成功
    await expect(page.locator('text=测试物品')).toBeVisible()
    await expect(page.locator('text=10')).toBeVisible()
  })

  test('should add quotes to item', async ({ page }) => {
    await page.goto('/consult-projects')
    await page.click('text=E2E 测试项目')

    // 展开物品
    await page.click('.el-table__expand-icon')

    // 添加报价
    await page.click('text=添加报价')
    await page.click('.el-select')
    await page.click('.el-select-dropdown__item:has-text("供应商A")')
    await page.fill('input[name="price"]', '100')
    await page.fill('input[name="quantity"]', '10')
    await page.click('button:has-text("确定")')

    // 验证添加成功
    await expect(page.locator('text=供应商A')).toBeVisible()
    await expect(page.locator('text=¥100')).toBeVisible()
  })

  test('should convert to bid project', async ({ page }) => {
    await page.goto('/consult-projects')
    await page.click('text=E2E 测试项目')

    // 选中报价
    await page.click('.el-table__expand-icon')
    await page.click('input[type="checkbox"]')

    // 转换项目
    await page.click('text=转为中标项目')
    await page.click('button:has-text("确定")')

    // 验证转换成功
    await expect(page).toHaveURL(/\/bid-projects\/\d+/)
    await expect(page.locator('.el-message--success')).toBeVisible()
  })
})
```

---

## 测试覆盖率目标

### 后端测试覆盖率

| 模块 | 目标覆盖率 | 说明 |
|------|-----------|------|
| Service 层 | 80%+ | 核心业务逻辑必须覆盖 |
| Controller 层 | 60%+ | 主要端点必须覆盖 |
| Utils | 90%+ | 工具函数必须覆盖 |
| DTO 验证 | 70%+ | 主要验证规则覆盖 |

### 前端测试覆盖率

| 类型 | 目标覆盖率 | 说明 |
|------|-----------|------|
| Utils | 90%+ | 工具函数必须覆盖 |
| Composables | 80%+ | 核心逻辑必须覆盖 |
| Components | 60%+ | 主要组件覆盖 |
| Stores | 70%+ | 状态管理覆盖 |

### E2E 测试覆盖

| 流程 | 要求 |
|------|------|
| 登录/登出 | ✅ 必须 |
| 咨询项目 CRUD | ✅ 必须 |
| 中标项目 CRUD | ✅ 必须 |
| 供应商管理 | ⚪ 可选 |
| 报价管理 | ⚪ 可选 |

---

## 测试命令

```bash
# 后端测试
cd backend
npm run test              # 运行所有测试
npm run test:watch        # 监听模式
npm run test:cov          # 生成覆盖率报告
npm run test:e2e          # E2E 测试

# 前端测试
cd frontend2
npm run test              # 运行所有测试
npm run test:watch        # 监听模式
npm run test:ui           # UI 界面
npm run test:coverage     # 生成覆盖率报告
npm run test:e2e          # E2E 测试
```
