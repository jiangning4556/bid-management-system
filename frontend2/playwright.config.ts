import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E 测试配置
 */
export default defineConfig({
  // 测试文件位置
  testDir: './e2e',

  // 测试文件匹配模式
  testMatch: '**/*.spec.ts',

  // 完全并行运行测试文件
  fullyParallel: true,

  // 在 CI 环境中失败时不重试
  forbidOnly: !!process.env.CI,

  // 在 CI 中重试失败的测试
  retries: process.env.CI ? 2 : 0,

  // 并行运行的 worker 数量
  workers: process.env.CI ? 1 : undefined,

  // 测试报告
  reporter: [
    ['html'],
    ['list'],
  ],

  // 全局设置
  use: {
    // 基础 URL
    baseURL: process.env.BASE_URL || 'http://localhost:5173',

    // 追踪测试（首次失败时）
    trace: 'on-first-retry',

    // 截图（仅失败时）
    screenshot: 'only-on-failure',

    // 视频录制（仅失败时）
    video: 'retain-on-failure',
  },

  // 测试项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // 移动设备测试
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 启动开发服务器（可选）
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
})
