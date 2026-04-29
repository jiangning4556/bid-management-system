/**
 * 图片懒加载指令
 * 使用 IntersectionObserver API 实现图片懒加载
 */

import type { Directive, DirectiveBinding } from 'vue'

interface LazyLoadHTMLElement extends HTMLElement {
  _lazyLoadObserver?: IntersectionObserver
}

const defaultImage = '' // 可以设置默认占位图
const errorImage = '' // 可以设置错误占位图

export const lazyLoad: Directive = {
  mounted(el: LazyLoadHTMLElement, binding: DirectiveBinding<string>) {
    const imageUrl = binding.value

    // 如果浏览器不支持 IntersectionObserver，直接加载图片
    if (!('IntersectionObserver' in window)) {
      loadImage(el, imageUrl)
      return
    }

    // 创建 IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 当元素进入视口时加载图片
          if (entry.isIntersecting) {
            loadImage(el, imageUrl)
            // 停止观察已加载的元素
            observer.unobserve(el)
          }
        })
      },
      {
        // 提前 100px 开始加载
        rootMargin: '100px',
        // 0 表示只要元素一进入视口就触发
        threshold: 0,
      }
    )

    // 保存 observer 引用以便后续清理
    el._lazyLoadObserver = observer
    // 开始观察元素
    observer.observe(el)
  },

  updated(el: LazyLoadHTMLElement, binding: DirectiveBinding<string>) {
    // 如果图片 URL 改变，重新加载
    if (binding.value !== binding.oldValue) {
      // 取消之前的观察
      if (el._lazyLoadObserver) {
        el._lazyLoadObserver.unobserve(el)
      }
      // 重新开始观察
      const imageUrl = binding.value
      if ('IntersectionObserver' in window) {
        const observer = el._lazyLoadObserver
        if (observer) {
          observer.observe(el)
        }
      } else {
        loadImage(el, imageUrl)
      }
    }
  },

  unmounted(el: LazyLoadHTMLElement) {
    // 清理 observer
    if (el._lazyLoadObserver) {
      el._lazyLoadObserver.disconnect()
      delete el._lazyLoadObserver
    }
  },
}

function loadImage(el: LazyLoadHTMLElement, imageUrl: string) {
  // 如果是 img 标签，设置 src
  if (el.tagName.toLowerCase() === 'img') {
    const imgElement = el as HTMLImageElement

    // 可以先设置一个默认占位图
    if (defaultImage && !imgElement.src) {
      imgElement.src = defaultImage
    }

    // 创建新图片对象预加载
    const newImage = new Image()

    newImage.onload = () => {
      imgElement.src = imageUrl
    }

    newImage.onerror = () => {
      if (errorImage) {
        imgElement.src = errorImage
      }
    }

    newImage.src = imageUrl
  } else {
    // 如果是其他元素（如 div），设置背景图
    if (defaultImage && !el.style.backgroundImage) {
      el.style.backgroundImage = `url(${defaultImage})`
    }

    const newImage = new Image()

    newImage.onload = () => {
      el.style.backgroundImage = `url(${imageUrl})`
    }

    newImage.onerror = () => {
      if (errorImage) {
        el.style.backgroundImage = `url(${errorImage})`
      }
    }

    newImage.src = imageUrl
  }
}

/**
 * Vue 插件形式注册
 */
export const lazyLoadPlugin = {
  install(app: any) {
    app.directive('lazy', lazyLoad)
  },
}

export default lazyLoad
