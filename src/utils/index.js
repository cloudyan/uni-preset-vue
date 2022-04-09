
export function noop() {}

// 格式化日期格式 (用于兼容ios Date对象)
export function formatDateStr(dateStr) {
  // 将xxxx-xx-xx的时间格式，转换为 xxxx/xx/xx的格式
  return dateStr.replace(/\-/g, '/')
}

export function fixSpecAttr(obj = {}) {
  const { spec_list = [], attr_list = [] } = obj

  const hasSpec = spec_list && spec_list.length
  const hasAttr = attr_list && attr_list.length
  if (!hasSpec && !hasAttr) {
    obj.is_has_attr_spec = 0
  } else {
    obj.is_has_attr_spec = 1
  }
}

export function urlfix(url = '', paramsStr = '') {
  const hasQuery = url.indexOf('?') > -1
  const fix = hasQuery ? '&' : '?'
  if (paramsStr) paramsStr = fix + paramsStr
  return url + paramsStr
}

export function stringify(params = {}) {
  const temp = params
  const arr = []
  for (const key in params) {
    if (typeof temp[key] === 'undefined') {
      delete temp[key]
    } else {
      arr.push(`${encodeURIComponent(key)}=${encodeURIComponent(temp[key])}`)
    }
  }
  return arr.join('&')
}

export function decodeQuery(query = {}) {
  const temp = {}
  for (const key in query) {
    if (![undefined, ''].includes(query[key])) {
      temp[decodeURIComponent(key)] = decodeURIComponent(query[key])
    }
  }
  return temp
}

export function compactObject(object = {}, invalid = ['', undefined, null]) {
  const result = {}
  for (const key in object) {
    if (!invalid.includes(object[key])) {
      result[key] = object[key]
    }
  }
  return result
}


// 防止快速点击
let lastClickTime = 0
export function isFastClick(){
  const time = new Date().getTime()
  if (time - lastClickTime < 100) {
    return true
  }
  lastClickTime = time
  return false
}


const regMobile = /^1[3-9]\d{9}$/ // 缓存正则变量，可以优化性能

export function isMobile(mobile) {  // 手机号正则检测
  return regMobile.test(mobile)
}

export function formatTime(time) {  // 时间戳转YYYY-MM-DD
  const date = new Date(+time * 1000)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

export function formatDateAndTime(time) {
  const date = new Date(+time * 1000)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
}

// 从html字符串中匹配<img>标签，再匹配src属性
export function regImgs(html = '', isGlobal) {
  // 匹配图片（g表示匹配所有结果i表示区分大小写）
  const imgReg = new RegExp('<img.*?(?:>|\/>)', (isGlobal ? 'ig' : 'i') )
  // 匹配src属性
  const srcReg = /src=[\'\"]?([^\'\"]*)[\'\"]?/i
  const arr = html.match(imgReg)
  const result = []
  for (let i = 0; i < arr.length; i++) {
    const src = arr[i].match(srcReg)
    // 获取图片地址
    if (src[1]) {
      result.push(src[1])
      // alert('已匹配的图片地址'+(i+1)+'：'+src[1]);
    }
  }

  return result
}

export const randomString =
  '_~getRandomVcryp0123456789bfhijklqsuvwxzABCDEFGHIJKLMNOPQSTUWXYZ'

export function random(size) {
  const result = []
  while (0 < size--) {
    result.push(Math.floor(Math.random() * 256))
  }
  return result
}

export function uuid(size = 21) {
  const url = randomString
  let id = ''
  let bytes = []
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    bytes = crypto.getRandomValues(new Uint8Array(size))
    // console.warn(':::uuid crypto:', bytes.join(','));
  } else {
    bytes = random(size)
    // console.warn(':::uuid random:', bytes.join(','));
  }
  while (0 < size--) {
    id += url[bytes[size] & 63]
  }
  return id
}

export function randomBy(under, over) {
  switch(arguments.length) {
    case 1: return parseInt(Math.random()*under+1)
    case 2: return parseInt(Math.random()*(over-under+1) + under)
    default: return 0
  }
}

export function formatLeftTime(timestamp, hasZero) {
  var d, h, m, s
  s = parseInt((timestamp / 1000) % 60, 10)
  m = parseInt((timestamp / 1000 / 60) % 60)
  h = parseInt((timestamp / 1000 / 60 / 60) % 24)
  d = parseInt((timestamp / 1000 / 60 / 60 / 24))
  if (hasZero) {
    return {
      day: (d < 10 && d > 0) ? '0' + d : d,
      hour: h < 10 ? '0' + h : h,
      minute: m < 10 ? '0' + m : m,
      second: s < 10 ? '0' + s : s,
    }
  }
  return {
    day: d,
    hour: h,
    minute: m,
    second: s,
  }
}

/**
 * 处理价格，默认是元，分第二个参数传100
 * dealPrice(5) => 5.00；dealPrice(500, 100) => 5.00；
 */
export function dealPrice(x, d = 100) {
  let f = parseFloat(x)
  if (isNaN(f)) {
    return
  }
  if (f == 0) {
    return f
  }
  d = d ? d * 100 : 100
  f = Math.round(f * 100) / d
  let s = f.toString()
  let rs = s.indexOf('.')
  if (rs < 0) {
    rs = s.length
    s += '.'
  }
  while (s.length <= rs + 2) {
    s += '0'
  }
  return s
}

/**
 * 数组去重
 *
 * @export
 * @param {*} tempArray
 * @param {*} key
 * @returns
 */
export function arrayToHeavy(arr = [], key) {
  if (key) {
    const cache = {}
    return arr.filter(item => {
      const val = item[key]
      if (cache[val]) return false
      return cache[val] = true
    })
  } else {
    return [...new Set(arr)]
  }
}

// 截流
export function throttle(func, wait, options) {
  /* eslint no-multi-assign: 0 */
  let context
  let args
  let result
  let timeout = null
  let previous = 0

  if (!options) options = {}
  const later = () => {
    previous = options.leading === false ? 0 : Date.now()
    timeout = null
    result = func.apply(context, args)
    if (!timeout) {
      context = args = null
    }
  }

  return (...rest) => {
    const now = Date.now()
    if (!previous && options.leading === false) previous = now
    const remaining = wait - (now - previous)
    context = this
    args = rest
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      result = func.apply(context, args)
      if (!timeout) {
        context = args = null
      }
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining)
    }
    return result
  }
}
// 防抖
export function debounce(func, wait, immediate) {
  let timeout
  let args
  let context
  let timestamp
  let result

  const later = () => {
    const last = Date.now() - timestamp

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last)
    } else {
      timeout = null
      if (!immediate) {
        result = func.apply(context, args)
        if (!timeout) context = args = null
      }
    }
  }

  return (...rest) => {
    context = this
    args = rest
    timestamp = Date.now()
    const callNow = immediate && !timeout
    if (!timeout) timeout = setTimeout(later, wait)
    if (callNow) {
      result = func.apply(context, args)
      context = args = null
    }

    return result
  }
}

export function promisify(fn, receiver) {
  return (...args) => {
    return new Promise((resolve, reject) => {
      fn.apply(receiver, [...args, (err, res) => {
        return err ? reject(err) : resolve(res)
      }])
    })
  }
}

// `sleep` 毫秒后执行resolve
export function sleep(delay) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay)
  })
}

export function deepCopy(obj = '') {
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch (err) {
    // console.error(err)
    return obj
  }
}

export default {
  noop,
  sleep,
  urlfix,
  promisify,
  isMobile,
  deepCopy,
  dealPrice,
  formatTime,
  formatLeftTime,
  formatDateAndTime,
  regImgs,
  randomBy,
}
