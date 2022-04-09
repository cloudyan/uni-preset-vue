import mini from '@/utils/mini'
import conf from '@/conf'


const API_ROOT = `${conf.siteroot}index.php?s=/api/`

function buildUrl(url) {
  if (/^https?/.test(url)) return url
  return API_ROOT + url
}

const apiCommonParams = {
  platform: conf.platform,
  wxapp_id: conf.uniacid,
}
export function setCommonParams(params) {
  Object.assign(apiCommonParams, params)
}

export function fetch(url, options, success, fail, complete) {
  const that = this
  const { hideNavbarLoading, method = 'GET', header = {}, ...rest } = options

  Object.assign(rest, apiCommonParams)
  // rest.wxapp_id = '10002'

  // 在当前页面显示导航条加载动画
  if (!hideNavbarLoading) {
    uni.showNavigationBarLoading()
  }

  const newOptions = {
    url: buildUrl(url),
    header: {
      'content-type': 'application/json', // 默认
    },
    method,
    success(res) {
      console.log('res:', res)
      const { data } = res
      if (res.statusCode !== 200 || typeof data !== 'object') {
        // that.showError('网络请求出错')
        return false
      }
      if (data.code === -1) {
        // 登录态失效, 重新登录
        console.log('需要登录')
        uni.hideNavigationBarLoading()

        mini.doLogin()
        return false
      } else if (data.code === 0) {
        // 这里 code 为 0 代表接口出错
        mini.showToast(data.msg)
        // that.showError(data.msg, function () {
        //   fail && fail(res)
        // })
        return false
      } else {
        success && success(data)
      }
    },
    fail(err) {
      // 小程序处理过的错误
      console.error(err)
      // that.showError(res.errMsg, () => {
      //   fail && fail(res)
      // })
      if (err.statusCode >= 400) {
        mini.showErrorPage('网络拥堵,稍候片刻!')
        return
      }
      if ([11, 12, 13, 14, 19, 20].indexOf(err.statusCode) > -1) {
        mini.showErrorPage(err.errorMessage || '网络拥堵,稍候片刻!')
        return
      }
    },
    complete(res) {
      uni.hideNavigationBarLoading()
      complete && complete(res)
    },
  }

  if (method === 'GET') {
    newOptions.data = rest
  } else if (method === 'POST') {
    newOptions.data = rest
  }

  Object.assign(newOptions.header, header)

  return uni.request(newOptions)
}

// TODO: 针对 get 请求添加一个缓存时间，LRU
export function get(url, options, success, fail, complete) {
  return fetch(
    url,
    {
      ...options,
      method: 'GET',
      header: {
        'content-type': 'application/json', // GET
      },
    },
    success,
    fail,
    complete,
  )
}

export function post(url, options, success, fail, complete) {
  return fetch(
    url,
    {
      ...options,
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded', // POST
      },
    },
    success,
    fail,
    complete,
  )
}

// 挂载到全局，记得只引入一次
const $fetch = {
  fetch,
  get,
  post,
}

uni.$fetch = $fetch

export default $fetch
