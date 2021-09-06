// 原始数据对象 map
// 这里为什么用 WeakMap
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
const targetMap = new WeakMap()
// 当期激活的 effect
let activeEffect
const effectStack = []

// 收集依赖
function track (target, key) {
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  if (activeEffect !== void 0 && !dep.has(activeEffect)) {
    dep.add(activeEffect)
    // 当前激活的 effect 收集 dep 集合作为依赖
    // activeEffect.deps.push(dep)
  }
}

// 派发通知
function trigger (target, key, val) {
  const desMap = targetMap.get(target, key)
  console.log(desMap)
  if (!desMap) {
    return
  }
  const effects = new Set()
  const add = (activeEffects) => {
    activeEffects.forEach((activeEffect) => {
      effects.add(activeEffect)
    })
  }
  // 为什么要用 void 0 替代 undefined
  // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/void
  // https://github.com/lessfish/underscore-analysis/issues/1
  if (key !== void 0) {
    const activeEffects = desMap.get(key)
    console.log(target, key, val)
    if (activeEffects) add(activeEffects)
  }
  const run = (effect) => {
    effect()
  }
  console.log(effects)
  effects.forEach(run)
}

// 创建副函数
function createReactiveEffect (fn, options) {
  const effect = function reactiveEffect () {
    try {
      // 压栈
      // console.log(effect)
      effectStack.push(effect)
      activeEffect = effect
      // 执行原始函数
      return fn()
    }
    finally {
      // 出栈
      effectStack.pop()
      // 指向栈最后一个 effect
      activeEffect = effectStack[effectStack.length - 1]
    }
  }
  return effect
}

function reactive (obj) {
  const proxy = new Proxy(obj,{
    get (target, key, receiver) {
      track(target, key)
      // Reflect: https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect
      return Reflect.get(...arguments) // 某个 key 的 val
    },
    set (target, key, val, receiver) {
      const observed = Reflect.set(...arguments)
      trigger(target, key, val)
      return observed // boolean
    }
  })
  return proxy
}

function watchEffect (fn, options) {
  // const wrapped = function (...args) {
  //   activeEffect = fn
  //   fn(...args)
  // }

  const effect = createReactiveEffect(fn, options)

  effect()

  return effect
}

let count = reactive({
  num: 0,
  // num1: 0
})
const logCount = () =>  {
  // watchEffect(logCount2)
  console.log('=== get logcount ===', count.num)
}

// const logCount2 = () => {
//   console.log('=== get logcount2 ===', count.num)
// }

const addCount = () =>  {
  count.num += 1
  console.log('=== set addCount ===', count.num)
}

watchEffect(logCount)
// logCount()
addCount()
