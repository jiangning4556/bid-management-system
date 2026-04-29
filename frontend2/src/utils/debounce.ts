/**
 * 防抖工具函数
 * 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时
 */

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, delay)
  }
}

/**
 * 节流函数
 * 在规定时间内只执行一次函数
 * @param fn 要执行的函数
 * @param interval 时间间隔（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number = 300
): (...args: Parameters<T>) => void {
  let lastTime = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    const remaining = interval - (now - lastTime)

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastTime = now
      fn.apply(this, args)
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now()
        timeoutId = null
        fn.apply(this, args)
      }, remaining)
    }
  }
}

/**
 * Vue 3 防抖 Hook
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns [debouncedFn, cancel]
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): [(...args: Parameters<T>) => void, () => void] {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const debouncedFn = function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, delay)
  }

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return [debouncedFn, cancel]
}

/**
 * Vue 3 节流 Hook
 * @param fn 要执行的函数
 * @param interval 时间间隔（毫秒）
 * @returns [throttledFn, cancel]
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number = 300
): [(...args: Parameters<T>) => void, () => void] {
  let lastTime = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const throttledFn = function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    const remaining = interval - (now - lastTime)

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastTime = now
      fn.apply(this, args)
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now()
        timeoutId = null
        fn.apply(this, args)
      }, remaining)
    }
  }

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return [throttledFn, cancel]
}
