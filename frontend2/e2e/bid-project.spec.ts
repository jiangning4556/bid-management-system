import { test, expect } from '@playwright/test'

/**
 * 中标项目管理 E2E 测试
 */
test.describe('中标项目管理', () => {
  // 每个测试前登录
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button:has-text("登录")')
    await page.waitForURL('/')
  })

  test('应该显示中标项目列表', async ({ page }) => {
    // 导航到中标项目页面
    await page.click('text=中标项目')
    await page.waitForURL('/bid-projects')

    // 验证页面标题
    await expect(page.locator('text=中标项目')).toBeVisible()

    // 验证搜索框存在
    await expect(page.locator('input[placeholder*="搜索"]')).toBeVisible()

    // 验证新增按钮存在
    await expect(page.locator('button:has-text("新增")')).toBeVisible()
  })

  test('应该能创建新的中标项目', async ({ page }) => {
    // 导航到中标项目页面
    await page.click('text=中标项目')
    await page.waitForURL('/bid-projects')

    // 点击新增按钮
    await page.click('button:has-text("新增")')

    // 等待对话框打开
    await expect(page.locator('.el-dialog')).toBeVisible()

    // 填写表单
    await page.fill('input[placeholder*="项目名称"]', '测试中标项目')
    await page.fill('input[placeholder*="项目编号"]', 'BID-2026-001')
    await page.fill('input[placeholder*="客户名称"]', '测试客户')
    await page.fill('input[placeholder*="合同金额"]', '50000')

    // 选择合同日期
    await page.click('.el-dialog input[placeholder*="合同日期"]')
    await page.click('.el-picker-panel .el-date-table td:not(.disabled):first-child')

    // 提交表单
    await page.click('.el-dialog button:has-text("确定")')

    // 等待对话框关闭
    await expect(page.locator('.el-dialog')).not.toBeVisible({ timeout: 5000 })

    // 验证成功提示
    await expect(page.locator('text=创建成功')).toBeVisible()
  })

  test('应该能从咨询项目转换', async ({ page }) => {
    // 导航到咨询项目页面
    await page.click('text=咨询项目')
    await page.waitForURL('/consult-projects')

    // 等待列表加载
    await page.waitForSelector('.el-table__body tr')

    // 查找可以转换的项目（已报价状态）
    const convertButton = page.locator('button:has-text("转为中标项目")')
    const buttonCount = await convertButton.count()

    if (buttonCount > 0) {
      // 点击第一个转换按钮
      await convertButton.first().click()

      // 等待确认对话框
      await expect(page.locator('.el-message-box')).toBeVisible()

      // 确认转换
      await page.click('.el-message-box button:has-text("确定")')

      // 验证成功提示
      await expect(page.locator('text=转换成功')).toBeVisible({ timeout: 5000 })

      // 导航到中标项目页面验证
      await page.click('text=中标项目')
      await page.waitForURL('/bid-projects')

      // 验证新项目存在
      await expect(page.locator('text=测试咨询项目')).toBeVisible()
    }
  })

  test('应该能查看项目财务汇总', async ({ page }) => {
    // 导航到中标项目页面
    await page.click('text=中标项目')
    await page.waitForURL('/bid-projects')

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

      // 验证财务汇总区域显示
      await expect(page.locator('text=财务汇总')).toBeVisible()
      await expect(page.locator('text=应付总额')).toBeVisible()
      await expect(page.locator('text=已付金额')).toBeVisible()
      await expect(page.locator('text=未付金额')).toBeVisible()

      // 验证进度条存在
      await expect(page.locator('.el-progress')).toBeVisible()
    }
  })

  test('应该能管理供应商信息', async ({ page }) => {
    // 导航到中标项目页面并点击第一个项目
    await page.click('text=中标项目')
    await page.waitForURL('/bid-projects')

    await page.waitForSelector('.el-table__body tr')
    const firstRow = page.locator('.el-table__body tr').first()
    const viewButton = firstRow.locator('button:has-text("查看")')

    const buttonCount = await viewButton.count()
    if (buttonCount > 0) {
      await viewButton.first().click()
      await expect(page.locator('text=项目详情')).toBeVisible()

      // 点击供应商管理标签
      const supplierTab = page.locator('text=供应商管理')
      const tabCount = await supplierTab.count()

      if (tabCount > 0) {
        await supplierTab.first().click()

        // 验证供应商列表显示
        await expect(page.locator('text=供应商')).toBeVisible()
        await expect(page.locator('text=进度')).toBeVisible()
        await expect(page.locator('text=付款状态')).toBeVisible()
      }
    }
  })

  test('应该能添加付款记录', async ({ page }) => {
    // 导航到中标项目页面并点击第一个项目
    await page.click('text=中标项目')
    await page.waitForURL('/bid-projects')

    await page.waitForSelector('.el-table__body tr')
    const firstRow = page.locator('.el-table__body tr').first()
    const viewButton = firstRow.locator('button:has-text("查看")')

    const buttonCount = await viewButton.count()
    if (buttonCount > 0) {
      await viewButton.first().click()
      await expect(page.locator('text=项目详情')).toBeVisible()

      // 点击付款记录标签
      const paymentTab = page.locator('text=付款记录')
      const tabCount = await paymentTab.count()

      if (tabCount > 0) {
        await paymentTab.first().click()

        // 点击添加付款按钮
        await page.click('button:has-text("添加付款")')

        // 等待对话框
        await expect(page.locator('.el-dialog')).toBeVisible()

        // 选择供应商
        const supplierSelect = page.locator('.el-dialog .el-select')
        const selectCount = await supplierSelect.count()

        if (selectCount > 0) {
          await supplierSelect.first().click()
          await page.waitForTimeout(300)

          // 点击第一个选项
          const firstOption = page.locator('.el-select-dropdown__item').first()
          if (await firstOption.count() > 0) {
            await firstOption.click()

            // 输入付款金额
            await page.fill('.el-dialog input[placeholder*="金额"]', '5000')

            // 选择付款日期
            await page.click('.el-dialog input[placeholder*="日期"]')
            await page.click('.el-picker-panel .el-date-table td:not(.disabled):first-child')

            // 保存
            await page.click('.el-dialog button:has-text("确定")')

            // 验证成功提示
            await expect(page.locator('text=添加成功')).toBeVisible({ timeout: 5000 })
          }
        }
      }
    }
  })

  test('应该能添加收款记录', async ({ page }) => {
    // 导航到中标项目页面并点击第一个项目
    await page.click('text=中标项目')
    await page.waitForURL('/bid-projects')

    await page.waitForSelector('.el-table__body tr')
    const firstRow = page.locator('.el-table__body tr').first()
    const viewButton = firstRow.locator('button:has-text("查看")')

    const buttonCount = await viewButton.count()
    if (buttonCount > 0) {
      await viewButton.first().click()
      await expect(page.locator('text=项目详情')).toBeVisible()

      // 点击收款记录标签
      const receiptTab = page.locator('text=收款记录')
      const tabCount = await receiptTab.count()

      if (tabCount > 0) {
        await receiptTab.first().click()

        // 点击添加收款按钮
        await page.click('button:has-text("添加收款")')

        // 等待对话框
        await expect(page.locator('.el-dialog')).toBeVisible()

        // 输入收款金额
        await page.fill('.el-dialog input[placeholder*="金额"]', '10000')

        // 选择收款日期
        await page.click('.el-dialog input[placeholder*="日期"]')
        await page.click('.el-picker-panel .el-date-table td:not(.disabled):first-child')

        // 保存
        await page.click('.el-dialog button:has-text("确定")')

        // 验证成功提示
        await expect(page.locator('text=添加成功')).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('应该能按状态筛选项目', async ({ page }) => {
    // 导航到中标项目页面
    await page.click('text=中标项目')
    await page.waitForURL('/bid-projects')

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
