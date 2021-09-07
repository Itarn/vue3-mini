// 实现响应式
// 当 b 依赖 a 时，a 变化时，b 自动执行
// 条件：1. b 依赖 a => 这个是代码实现的前置条件
// 条件：2. a 变化 => 这个是代码实现的前置条件
// 预期：自动执行 b => 这个是后面代码要实现的目的

// import { reactive, watchEffect } from "./vue-demo"

// 用代码做说明

let a = {
  num: 0
}

const b = function () {
// 条件 1. b 依赖 a
  console.log('=== func b ===', a.num)
}

// // 条件 2. a 发生变化了
// a.num += 1

// 预期：自动出现 === func b === 1

// ========================
// 下面是 Vue api 调用方式，我们要仿照 vue 设计出相同的调用方式

// a = reactive({
//   num: 0
// })
// watchEffect(b)
// a.num += 1

// => 代码需要暴露两个方法
// 1. reactive：负责把原始对象包裹成响应式对象
// 2. watchEffect 这是个包裹函数，要做的第一件事执行原有函数，保持原有意义，第二件事，把当前的这个函数指向一个 activeEffect 全局变量, 已供收集

const targetMap = new WeakMap()
// 需要把下方 activeEffect 收集到上方的 targetMap
let activeEffect

function reactive (obj) {
  const proxy = new Proxy(obj, {
    get: function (target, key) {
      // 追踪
      track(target, key)
      return Reflect.get(target, key)
    },
    set: function (target, key, val) {
      const observed = Reflect.set(target, key, val)
      // 派发
      trigger(target, key)
      return observed
    }
  })
  return proxy
}

function track (target, key) {
  if (!activeEffect) {
    return
  }

  let desMap = new Map()
  let effects = new Set()

  // console.log(activeEffect, '333')
  effects.add(activeEffect)
  desMap.set(key, effects)
  targetMap.set(target, desMap)
}

function trigger (target, key) {
  const desMap = targetMap.get(target)
  const effects = desMap.get(key)

  effects.forEach(effect => {
    effect()
  })
}

function watchEffect (fn) {
  const wrapped = function () {
    try {
      activeEffect = fn
      return fn()
    }
    finally {
      activeEffect = undefined
    }
  }

  wrapped()

  return wrapped
}

// 下面是用户代码
a = reactive({
  num: 0
})
watchEffect(b)
a.num += 1