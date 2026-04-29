import { test, expect } from '@playwright/test'

/**
 * 登录功能 E2E 测试
 */
test.describe('用户登录', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到登录页面
    await page.goto('/login')
  })

  test('应该显示登录表单', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/投标管理系统/)

    // 验证登录表单元素存在
    await expect(page.locator('input[type="text"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button:has-text("登录")')).toBeVisible()
  })

  test('应该成功登录并跳转到首页', async ({ page }) => {
    // 输入用户名和密码
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin123')

    // 点击登录按钮
    await page.click('button:has-text("登录")')

    // 等待导航到首页
    await page.waitForURL('/', { timeout: 5000 })

    // 验证 URL 变化
    expect(page.url()).toContain('/')

    // 验证首页元素
    await expect(page.locator('text=仪表盘')).toBeVisible()
  })

  test('应该显示用户名错误提示', async ({ page }) => {
    // 输入错误的用户名
    await page.fill('input[type="text"]', 'wronguser')
    await page.fill('input[type="password"]', 'admin123')

    // 点击登录按钮
    await page.click('button:has-text("登录")')

    // 等待错误提示
    await expect(page.locator('text=用户名或密码错误')).toBeVisible({ timeout: 3000 })
  })

  test('应该显示密码错误提示', async ({ page }) => {
    // 输入错误的密码
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'wrongpassword')

    // 点击登录按钮
    await page.click('button:has-text("登录")')

    // 等待错误提示
    await expect(page.locator('text=用户名或密码错误')).toBeVisible({ timeout: 3000 })
  })

  test('应该显示空字段验证', async ({ page }) => {
    // 不输入任何信息，直接点击登录
    await page.click('button:has-text("登录")')

    // 验证表单验证提示
    await expect(page.locator('text=请输入用户名')).toBeVisible()
  })

  test('应该记住登录状态', async ({ browser }) => {
    const context = await browser.newContext()

    const page = await context.newPage()
    await page.goto('/login')

    // 输入凭据并登录
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button:has-text("登录")')

    // 等待登录成功
    await page.waitForURL('/')

    // 关闭页面
    await page.close()

    // 重新打开页面，验证保持登录状态
    const newPage = await context.newPage()
    await newPage.goto('/')

    // 应该直接显示首页，不需要重新登录
    await expect(newPage.locator('text=仪表盘')).toBeVisible()

    await context.close()
  })

  test('应该支持退出登录', async ({ page }) => {
    // 先登录
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button:has-text("登录")')
    await page.waitForURL('/')

    // 点击用户菜单
    await page.click('[class*="user"]')

    // 点击退出登录
    await page.click('text=退出登录')

    // 验证跳转到登录页
    await page.waitForURL('/login')
    expect(page.url()).toContain('/login')
  })
})
