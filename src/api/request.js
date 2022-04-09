import conf from '@/conf'
import store from '@/store'
import LRU from 'lru-cache'
import { promisify } from '@/utils/index'

// TODO: 取消掉对 mini 的依赖
import mini from '@/utils/mini'

// 缓存在内存中
// TODO: 目前缓存在 ajax 未返回之前，发出 N 次，则都会执行（缓存还未建立），应该使用节流控制，保留第一次 or 最后一次
const cache = new LRU({
  max: 1000, // 缓存队列长度
  maxAge: 60000, // 缓存有效期
})

function noop() {
  console.log('默认流程')
}

const defaultOptions = {
  method: 'GET',   // 使用的HTTP动词，GET, POST, PUT, DELETE, HEAD
  url: '',         // 请求地址，URL of the request
  header: {
    // Accept: 'application/json',
    // 'content-type': 'application/json' // 默认值
    // 'Content-Type': 'application/x-www-form-urlencoded',
    'content-type': 'application/x-www-form-urlencoded',
  },
  dataType: 'json',
  mode: 'cors',           // 请求的模式，主要用于跨域设置，cors, no-cors, same-origin
  timeout: 30000,
  credentials: 'include', // 是否发送Cookie omit, same-origin
  // redirect // 收到重定向请求之后的操作，follow, error, manual
  // integrity // 完整性校验
  // cache: 'default', // 缓存模式(default, reload, no-cache)
}

const reject = noop

function formatData(data) {
  if (typeof data.status === 'number') {
    data.errno = data.status
  } else {
    data.errno = data.status && data.status.code || ''
    data.errmsg = data.status && data.status.message
  }
  return data
}


export default function request(url, options = {}, success = noop, fail = noop) {
  const { hideLoading, cacheTime, ...opts } = options
  const newOptions = Object.assign({}, defaultOptions, opts)
  const method = (newOptions.method || 'GET').toUpperCase()
  newOptions.method = method

  console.log('请求参数：'+ JSON.stringify(newOptions))
  !hideLoading && mini.showLoading()
  console.time(url)

  const newData = {}
  for (let key in newOptions.data) {
    if (![undefined, ''].includes(newOptions.data[key])) {
      newData[key] = newOptions.data[key]
    }
  }
  newOptions.data = newData
  const cacheKey = url + JSON.stringify(newData)

  if (method === 'GET') {
    if (cacheTime) {
      // 如有缓存，直接返回
      const data = cache.get(cacheKey)
      // console.warn('response cache', data)
      if (data) {
        return promisify(resolve)(data)
      }
    }
    // newOptions.headers = {
    //   'Content-Type': 'application/json; charset=utf-8',
    // };
    // newOptions.data = JSON.stringify(newOptions.data);
  } else if (method === 'POST') {
    // 不支持 cache
    // newOptions.headers = {
    //   // 我们的 post 请求，使用的这个，不是 application/json
    //   'Content-Type': 'application/x-www-form-urlencoded',
    // };
    // newOptions.data = JSON.stringify(newOptions.data);
    // newOptions.data = `${stringify(newOptions.data)}`;
  }

  function resolve(res) {
    mini.hideLoading()
    if (typeof success === 'function') {
      success(res)
    }
  }
  function reject(err = {}) {
    mini.hideLoading()
    if (typeof fail === 'function' && fail(err)) {
      return
    }
    const {
      errmsg = '网络异常，请稍后重试',
      errno = 'err',
    } = err
    if (errno === conf.authCode) {
      console.log('auth 401')
      // store.dispatch('user/fedLogout')
      // store.dispatch('user/popupLogin', true);

      mini.showLoading()
      // store.dispatch('user/getAuth').then(
      //   res => {
      //     mini.hideLoading()
      //   }
      // )
      // if (mini.getPageName() == 'webview') {
      //   mini.forward('login');
      // } else {
      // }
    } else {
      const message = `${errmsg}`

      // TIP: 前面调用 hideLoading, 导致 showToast 被迅速隐藏，以至于看不到显示
      // 真机没这个问题
      setTimeout(() => {
        mini.showToast(message)
      }, 50)
      console.log('errmsg:', message)
    }
  }

  return uni.request(
    Object.assign({}, newOptions, {
      url, // 目标服务器 url
      success: (res = {}) => {
        console.log('api res:', res)
        let { statusCode, data = {} } = res
        if (statusCode >= 200 && statusCode < 300) {
          res.ok = true
          data = formatData(data)

          if (data.errno === 10000) {
            if (cacheTime && method == 'GET') {
              // LRU 存缓存
              cache.set(cacheKey, data, cacheTime*1000)
            }
            resolve(data)
          } else {
            console.log('err:', data)
            reject(data)
          }
        } else if (statusCode >= 400) {
          mini.showErrorPage('网络拥堵,稍候片刻!')
          return
        } else {
          // 小程序未处理过的错误
          let err = formatData(data)
          console.log('fetch 异常:', res)
          reject(err)
        }
      },
      fail: (err = {}) => {
        console.timeEnd(url)
        // 小程序处理过的错误
        console.log('fail:', err)
        // err: {
        //   error: 12,
        //   errorMessage: '',
        // }
        // uni.alert({
        //   title: 'err: ' + JSON.stringify(err),
        // });
        if (err.statusCode >= 400) {
          mini.showErrorPage('网络拥堵,稍候片刻!')
          return
        }
        if ([11, 12, 13, 14, 19, 20].indexOf(err.statusCode) > -1) {
          mini.showErrorPage(err.errorMessage || '网络拥堵,稍候片刻!')
          return
        }

        // reject({
        //   errno: err.error,
        //   errmsg: err.errorMessage,
        // });
      },
      complete: () => {

      },
    })
  )
}
