// 原始数据对象 map
const targetMap = new WeakMap()
// 当期激活的 effect
let activeEffect
const effectStack = []

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

function createReactiveEffect (fn, options) {
  const effect = function reactiveEffect () {
    try {
      // 开启全局 shouldTrack，允许依赖收集
      // enableTracking()
      // 压栈
      effectStack.push(effect)
      activeEffect = effect
      // 执行原始函数
      return fn()
    }
    finally {
      // 出栈
      effectStack.pop()
      // 恢复 shouldTrack 开启之前的状态
      // resetTracking()
      // 指向栈最后一个 effect
      activeEffect = effectStack[effectStack.length - 1]
    }
  }
  return effect
}

export function reactive (obj) {
  const proxy = new Proxy(obj,{
    get (target, key, receiver) {
      track(target, key)
      return Reflect.get(...arguments)
    },
    set (target, key, val, receiver) {
      const observed = Reflect.set(...arguments)
      trigger(target, key, val)
      return observed
    }
  })
  return proxy
}

export function watchEffect (fn, options) {
  // const wrapped = function (...args) {
  //   activeEffect = fn
  //   fn(...args)
  // }

  const effect = createReactiveEffect(fn, options)

  effect()

  return effect
}
