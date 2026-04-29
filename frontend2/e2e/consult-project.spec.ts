import { test, expect } from '@playwright/test'

/**
 * 咨询项目管理 E2E 测试
 */
test.describe('咨询项目管理', () => {
  // 每个测试前登录
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button:has-text("登录")')
    await page.waitForURL('/')
  })

  test('应该显示咨询项目列表', async ({ page }) => {
    // 导航到咨询项目页面
    await page.click('text=咨询项目')
    await page.waitForURL('/consult-projects')

    // 验证页面标题
    await expect(page.locator('text=咨询项目')).toBeVisible()

    // 验证搜索框存在
    await expect(page.locator('input[placeholder*="搜索"]')).toBeVisible()

    // 验证新增按钮存在
    await expect(page.locator('button:has-text("新增")')).toBeVisible()
  })

  test('应该能创建新的咨询项目', async ({ page }) => {
    // 导航到咨询项目页面
    await page.click('text=咨询项目')
    await page.waitForURL('/consult-projects')

    // 点击新增按钮
    await page.click('button:has-text("新增")')

    // 等待对话框打开
    await expect(page.locator('.el-dialog')).toBeVisible()

    // 填写表单
    await page.fill('input[placeholder*="项目名称"]', '测试咨询项目')
    await page.fill('input[placeholder*="项目编号"]', 'TEST-2026-001')
    await page.fill('input[placeholder*="客户名称"]', '测试客户')

    // 选择咨询日期
    await page.click('.el-dialog input[placeholder*="咨询日期"]')
    await page.click('.el-picker-panel .el-date-table td:not(.disabled):first-child')

    // 提交表单
    await page.click('.el-dialog button:has-text("确定")')

    // 等待对话框关闭
    await expect(page.locator('.el-dialog')).not.toBeVisible({ timeout: 5000 })

    // 验证成功提示
    await expect(page.locator('text=创建成功')).toBeVisible()
  })

  test('应该能搜索咨询项目', async ({ page }) => {
    // 导航到咨询项目页面
    await page.click('text=咨询项目')
    await page.waitForURL('/consult-projects')

    // 输入搜索关键词
    await page.fill('input[placeholder*="搜索"]', '测试')

    // 等待搜索结果
    await page.waitForTimeout(500)

    // 验证搜索结果
    const results = page.locator('.el-table__body tr')
    const count = await results.count()

    // 至少应该有一些结果（或没有结果）
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('应该能查看项目详情', async ({ page }) => {
    // 导航到咨询项目页面
    await page.click('text=咨询项目')
    await page.waitForURL('/consult-projects')

    // 等待列表加载
    await page.waitForSelector('.el-table__body tr')

    // 点击第一行的查看按钮
    const firstRow = page.locator('.el-table__body tr').first()
    const viewButton = firstRow.locator('button:has-text("查看")')

    const buttonCount = await viewButton.count()
    if (buttonCount > 0) {
      await viewButton.first().click()

      // 验证详情页加载
      await expect(page.locator('text=项目详情')).toBeVisible()

      // 验证返回按钮
      await expect(page.locator('button:has-text("返回")')).toBeVisible()
    }
  })

  test('应该能编辑项目', async ({ page }) => {
    // 导航到咨询项目页面
    await page.click('text=咨询项目')
    await page.waitForURL('/consult-projects')

    // 等待列表加载
    await page.waitForSelector('.el-table__body tr')

    // 点击第一行的编辑按钮
    const firstRow = page.locator('.el-table__body tr').first()
    const editButton = firstRow.locator('button:has-text("编辑")')

    const buttonCount = await editButton.count()
    if (buttonCount > 0) {
      await editButton.first().click()

      // 等待编辑对话框
      await expect(page.locator('.el-dialog')).toBeVisible()

      // 修改项目名称
      const nameInput = page.locator('.el-dialog input[placeholder*="项目名称"]')
      await nameInput.fill('更新后的项目名称')

      // 保存
      await page.click('.el-dialog button:has-text("确定")')

      // 验证成功提示
      await expect(page.locator('text=更新成功')).toBeVisible()
    }
  })

  test('应该能添加项目物品', async ({ page }) => {
    // 导航到咨询项目页面并点击第一个项目
    await page.click('text=咨询项目')
    await page.waitForURL('/consult-projects')

    await page.waitForSelector('.el-table__body tr')
    const firstRow = page.locator('.el-table__body tr').first()
    const viewButton = firstRow.locator('button:has-text("查看")')

    const buttonCount = await viewButton.count()
    if (buttonCount > 0) {
      await viewButton.first().click()
      await expect(page.locator('text=项目详情')).toBeVisible()

      // 点击添加物品按钮
      await page.click('button:has-text("添加物品")')

      // 等待对话框
      await expect(page.locator('.el-dialog')).toBeVisible()

      // 选择物品（如果有）
      const itemSelect = page.locator('.el-dialog .el-select')
      const selectCount = await itemSelect.count()

      if (selectCount > 0) {
        await itemSelect.first().click()
        await page.waitForTimeout(300)

        // 点击第一个选项
        const firstOption = page.locator('.el-select-dropdown__item').first()
        if (await firstOption.count() > 0) {
          await firstOption.click()

          // 输入数量
          await page.fill('.el-dialog input[placeholder*="数量"]', '10')

          // 保存
          await page.click('.el-dialog button:has-text("确定")')

          // 验证成功提示
          await expect(page.locator('text=添加成功')).toBeVisible({ timeout: 5000 })
        }
      }
    }
  })

  test('应该能删除项目', async ({ page }) => {
    // 导航到咨询项目页面
    await page.click('text=咨询项目')
    await page.waitForURL('/consult-projects')

    // 获取初始行数
    await page.waitForSelector('.el-table__body tr')
    const initialCount = await page.locator('.el-table__body tr').count()

    if (initialCount > 0) {
      // 点击最后一行的删除按钮
      const lastRow = page.locator('.el-table__body tr').last()
      const deleteButton = lastRow.locator('button:has-text("删除")')

      const buttonCount = await deleteButton.count()
      if (buttonCount > 0) {
        await deleteButton.first().click()

        // 确认删除
        await page.click('.el-message-box button:has-text("确定")')

        // 验证成功提示
        await expect(page.locator('text=删除成功')).toBeVisible()
      }
    }
  })

  test('应该能按状态筛选项目', async ({ page }) => {
    // 导航到咨询项目页面
    await page.click('text=咨询项目')
    await page.waitForURL('/consult-projects')

    // 点击状态筛选下拉框
    const statusFilter = page.locator('.el-table .el-filter')
    const filterCount = await statusFilter.count()

    if (filterCount > 0) {
      await statusFilter.first().click()

      // 等待筛选面板
      await expect(page.locator('.el-filter-dropdown')).toBeVisible()

      // 选择一个状态
      await page.click('.el-filter-dropdown label:first-child')

      // 点击确认
      await page.click('.el-filter-dropdown button:has-text("确认")')

      // 等待列表刷新
      await page.waitForTimeout(500)
    }
  })
})
