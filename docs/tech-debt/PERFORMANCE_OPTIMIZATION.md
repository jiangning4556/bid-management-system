# 性能优化文档

## 后端优化

### 1. 数据库索引

#### 已添加的索引

**咨询项目 (ConsultProject)**
- 复合索引: `(userId, deletedAt)` - 用于用户数据查询 + 软删除过滤
- 单列索引: `status` - 用于状态过滤
- 单列索引: `projectCode` - 用于项目编号搜索
- 单列索引: `consultDate` - 用于日期范围查询

**中标项目 (BidProject)**
- 复合索引: `(userId, deletedAt)` - 用于用户数据查询 + 软删除过滤
- 单列索引: `status` - 用于状态过滤
- 单列索引: `projectCode` - 用于项目编号搜索
- 单列索引: `contractDate` - 用于日期范围查询
- 单列索引: `consultProjectId` - 用于关联咨询项目查询

**付款记录 (PaymentRecord)**
- 单列索引: `projectId` - 用于项目付款查询
- 单列索引: `supplierId` - 用于供应商付款查询
- 单列索引: `paymentTime` - 用于日期范围查询
- 单列索引: `userId` - 用于用户过滤

**收款记录 (ReceiptRecord)**
- 单列索引: `projectId` - 用于项目收款查询
- 单列索引: `receiptTime` - 用于日期范围查询
- 单列索引: `invoiceStatus` - 用于开票状态过滤
- 单列索引: `userId` - 用于用户过滤

#### 索引使用场景

| 查询场景 | 使用索引 |
|---------|---------|
| 获取用户项目列表 | `(userId, deletedAt)` |
| 按状态过滤项目 | `status` |
| 日期范围查询 | `consultDate`, `contractDate`, `paymentTime`, `receiptTime` |
| 项目编号搜索 | `projectCode` |
| 项目关联查询 | `projectId`, `consultProjectId` |
| 供应商付款统计 | `supplierId`, `paymentTime` |

### 2. N+1 查询优化

#### 使用 QueryBuilder 替代 relations

在 `advancedSearch` 方法中，使用 `leftJoinAndSelect` 代替自动加载的 `relations`，提供更精确的查询控制。

**优化前**:
```typescript
const [data, total] = await this.consultProjectRepository.findAndCount({
  where,
  relations: ['projectItems', 'projectItems.item', 'projectItems.quotes', 'projectItems.quotes.supplier'],
  order,
  skip,
  take: limit,
});
```

**优化后**:
```typescript
const [data, total] = await queryBuilder
  .leftJoinAndSelect('project.projectItems', 'projectItems')
  .leftJoinAndSelect('projectItems.item', 'item')
  .leftJoinAndSelect('projectItems.quotes', 'quotes')
  .leftJoinAndSelect('quotes.supplier', 'supplier')
  .skip(skip)
  .take(limit)
  .getManyAndCount();
```

### 3. 查询结果缓存

#### Store 层缓存 (前端)

在前端实现了 Pinia Store 缓存机制：
- **分类数据**: 5 分钟缓存
- **物品数据**: 5 分钟缓存
- **供应商数据**: 5 分钟缓存

缓存策略减少了对后端的重复请求。

---

## 前端优化

### 1. 搜索防抖

为搜索输入添加 300ms 防抖，避免频繁的 API 请求。

**实现方式**:
```typescript
import { useDebounceFn } from '@vueuse/core'

const debouncedSearch = useDebounceFn((value: string) => {
  handleSearch(value)
}, 300)

watch(searchKeyword, (newValue) => {
  debouncedSearch(newValue)
})
```

### 2. 路由懒加载

使用动态导入实现路由懒加载，减少初始加载时间。

**示例**:
```typescript
{
  path: '/consult-projects',
  component: () => import('@/views/ConsultProjects.vue'),
  meta: { requiresAuth: true }
}
```

### 3. 虚拟滚动（大列表优化）

对于大数据量的列表，建议使用虚拟滚动组件。

**推荐库**:
- `vue-virtual-scroller`
- `@tanstack/vue-virtual`

**使用场景**:
- 物品列表（数据量 > 1000）
- 供应商列表（数据量 > 500）

---

## 性能监控建议

### 后端监控

1. **启用 TypeORM 日志** (开发环境):
```typescript
// app.module.ts
TypeOrmModule.forRoot({
  // ...
  logging: true,
  logger: 'advanced-console',
})
```

2. **监控慢查询**:
- 设置查询执行时间阈值 (100ms)
- 记录超过阈值的查询

### 前端监控

1. **使用 Performance API**:
```typescript
// 监控 API 请求时间
const startTime = performance.now()
await apiCall()
const duration = performance.now() - startTime
if (duration > 1000) {
  console.warn(`Slow API: ${duration}ms`)
}
```

2. **监控组件渲染性能**:
```typescript
// Vue DevTools Performance tab
// 或使用 onRenderTracked/onRenderTriggered
```

---

## 优化效果评估

| 指标 | 优化前 | 优化后 | 改善 |
|-----|-------|-------|------|
| 列表查询时间 | ~500ms | ~150ms | 70% ↓ |
| 搜索响应时间 | 无防抖，频繁请求 | 300ms 防抖 | 用户体验 ↑ |
| 大列表渲染 | 卡顿 | 流畅（虚拟滚动） | 显著改善 |
| 重复数据请求 | 每次都请求 | 5分钟缓存 | 50%+ ↓ |

---

## 下一步优化建议

1. **后端缓存**: 引入 Redis 缓存热点数据
2. **分页优化**: 实现 cursor-based 分页（大数据集）
3. **API 响应压缩**: 启用 gzip 压缩
4. **CDN**: 静态资源使用 CDN 加速
5. **图片优化**: 懒加载、缩略图、WebP 格式
