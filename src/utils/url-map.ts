/*!
 * @Author: cloudyan
 * @Date: 2020-02-15 09:31:45
 * 功能说明: url规则映射 url链接类型判断 url解析 url参数合并
 */

import urlParseThird from 'url-parse'
import conf from '@/conf'
import store from '@/store/index'
import { urlfix, stringify, deepCopy, compactObject } from './index'
import { allPages, defaultPage } from './pages'

const { qs } = urlParseThird

// urlParseThird 输出
// {
//   slashes: false,
//   protocol: '',    // √ https: miniapp:
//   hostname: '',    // √ m.xxx.com 第一个斜线之前的部分
//   pathname: '',    // √ /detail /detail/ /index.html pages/index/index
//   query: '',       // √ ?id=123
//   hash: '',        // √ #hash hash应在 query 后
//   auth: '',
//   host: '',        // hostname + port
//   port: '',        // 8080
//   password: '',    // x
//   username: '',    // x
//   origin: 'null',  // protocol + '//' + hostname + port
//   href: 'pages/index/index', // https://m.xxx.com:8080/detail?id=123#hash
// }

// url 映射规则（如果链接路径或参数格式不一致，需要映射处理，否则默认跳转同名格式）
// 如果小程序内没有此页面，默认转H5 页面

// url 映射规则（默认只针对 h5my 与 mini 进行映射处理）
const h5mytoMiniRules = {
  // 示例
  // 'detail': {
  //   target: 'detail',
  //   params: {
  //     sku_id: 'id',
  //   },
  // },
  'web-view': {
    target: 'webview',
  },
}

// 逆向转换映射规则
function reverseRules(rule) {
  const targetRules = {}
  const { hasOwnProperty } = Object.prototype
  for (const key in rule) {
    if (hasOwnProperty.call(rule, key)) {
      const item = rule[key]
      targetRules[item.target] = {
        target: key,
      }
      if (item.params) {
        targetRules[item.target].params = {}
        for (const key2 in item.params) {
          if (hasOwnProperty.call(item.params, key2)) {
            const param = item.params[key2]
            targetRules[item.target].params[param] = key2
          }
        }
      }
    }
  }
  return targetRules
}

const miniToH5myRules = reverseRules(h5mytoMiniRules)

const urlRules = {
  h5mytoMiniRules,
  miniToH5myRules,
}

export function camelCase(str) {
  return str.replace(/-(\w)/g, function (_, c) {
    return c ? c.toUpperCase() : ''
  })
}

// test
// var aa = /^([A-Za-z0-9])+(-([a-z0-9]+))?$/i
// console.log(aa.test('ind-ex'))
// console.log(aa.test('index2'))
// console.log(aa.test('product-detail'))
// console.log(aa.test('a-b2-c'))
// console.log(aa.test('a-b2-c-4'))


// 链接类型判断规则
const types = {
  miniapp: /^miniapp:\/\//i, // 外部小程序跳转
  mini: /^\/pages\//i, // 支持小程序全路径 url
  mini2: /^\/([A-Za-z0-9])+([-|_]([a-z0-9]+)){0,3}$/i, // 小程序 pageName
  h5my: /(\.dev|\.beta)?\.xxx\.com/i,
  h5my2: conf.baseUrl,
  h5auth: /(topic(\.dev|\.beta)?\.xxx2\.com)/i,
  h5: /^(https|http):\/\//i,
  tel: /^tel:/i, // 手机号，h5用a标签写，不走事件，小程序走事件
  script: /^javascript\:([\w|\d]*)\(\'(.*?)\'\)/, // 自定义脚本 领优惠券
}

// 链接类型判断
export function getUrlType(url = '') {
  if (types['miniapp'].test(url)) return 'miniapp'
  if (types['mini'].test(url)) return 'mini' // 小程序全路径链接格式
  if (types['mini'].test(url.split('?')[0])) return 'mini'
  if (types['h5my'].test(url)) return 'h5my' // h5my 会做映射处理
  if (url.indexOf(types['h5my2']) === 0) return 'h5my'
  if (types['h5auth'].test(url)) return 'h5auth' // auth h5 会做授权逻辑处理，
  if (types['h5'].test(url)) return 'h5'  // 其他 H5 不做处理，直接 webview打开 url
  if (types['tel'].test(url)) return 'tel'
  if (types['script'].test(url)) return 'script'
  return 'other'
}

// query 参数映射
function queryMap(params = {}, target) {
  if (!target) return params
  const temp = {}
  for (let key in params) {
    if (target[key]) {
      temp[target[key]] = params[key]
      delete params[key]
    }
  }
  return temp
}

// 主要用于标准 schema 格式链接
export function urlMergeQuery(url = '', params = {}) {
  const urlObj = urlParse(url, params)
  const {
    pageType,
    hostname,
    pathname,
    query,
    hash,
    origin,
  } = urlObj

  const pageFullUrl = urlfix(origin + pathname, stringify(query))

  return {
    pageType,
    pageName: pathname, // 用于页面标识
    pageQuery: query,
    pageMiniPath: allPages[pathname],
    pageFullUrl, // 完整 url
  }
}

// url 解析 && 合并参数
export function urlParse(url = '', params = {}) {
  const appendQuery = deepCopy(params)

  // 不使用 protocol 改为自定义判断
  const pageType = getUrlType(url) // h5 开头的

  // 先修正多?号的异常 url
  // url = url.replace(/\?/g, '&').replace('&', '?')
  // const urlArr = url ? url.split('?') : [];
  // const localUrl = urlArr[0] || '';

  const urlObj = urlParseThird(url)
  console.log('url-parse', urlObj)
  let {
    // protocol = '', // 如 https: minispp: 有可能为空
    hostname = '', // 第一个斜线之前的部分
    pathname = '', // 有可能前后都有斜线 '/' 需要处理
    query: queryStr = '',
    hash = '',
    origin = '', // protocol + '//' + hostname + port
  } = urlObj

  // protocol = protocol.replace(':', '')

  queryStr = queryStr.replace('?', '')

  // 只替换开头的一个（有些 pathname 的最后一个 / 不能省，所有保持原样）
  // 如 https://iqianggou.udesk.cn/im_client/?web_plugin_id=xxx&nonce=xxx&timestamp=xxx&web_token=xxx&signature=xxx&c_name=xxx
  // pathname = pathname.replace(/^\//, '')

  // 如果 hash 在部分 query 之前，则hash 中也包含 query
  let hashQueryStr = ''
  if (hash.indexOf('?') > -1) {
    const tempHash = hash.split('?')
    hash = tempHash[0].replace('#', '')
    hashQueryStr = tempHash[1] || ''
  }

  // query 合并，三部分，过滤无效值
  const query = compactObject({
    ...qs.parse(queryStr),
    ...qs.parse(hashQueryStr),
    ...appendQuery,
  })

  if (origin == 'null') origin = ''

  return {
    pageType,
    hostname,
    pathname,
    query,
    hash,
    origin,
  }
}

function getTargetUrl(url = '', params = {}) {
  // 解析时还不能生成最终 fullUrl, 因为后面还有转化
  // 可以保留 fullUrl = origin + pathname + queryStr
  const {
    pageType,
    hostname,
    pathname,
    query,
    hash,
    origin,
  } = urlParse(url, params)

  let targetPage = pathname
  let pageMiniPath
  let mapRule
  let targetQuery = query
  let queryStr = stringify(query)
  let pageFullUrl = '' // 针对标准 schema 格式链接
  let distFullUrl = '' // 目标完整地址
  queryStr = queryStr ? '?' + queryStr : ''

  // const ruleName = `${current}to${target}Rules`;
  // mapRule = h5toMiniRules[targetPage];

  switch (pageType) {
    // mini 或 h5my, 如有映射规则，则使用映射规则
    case 'mini':
    case 'h5my': {
      targetPage = pathname || defaultPage
      // 当前是 mini 格式时，需要先取得 pageMiniPath 再应用 mapRule 规则
      if (pageType == 'mini') pageMiniPath = allPages[targetPage]
      mapRule = pageType == 'mini' ? urlRules['miniToH5myRules'] : urlRules['h5mytoMiniRules']
      const mapPage = mapRule[targetPage]
      if (mapPage) {
        targetPage = mapPage.target
        targetQuery = queryMap(query, mapPage.params) // 暂时参数格式一致
        queryStr = stringify(targetQuery)
        queryStr = queryStr ? '?' + queryStr : ''
      }
      // 适配 profile2 如果是profile 并且带 id，需转为 profile2
      // 且 Id 不能为自己的 id
      // if (targetPage == 'profile' && query.id) {
      //   const userId = store.state.user.userInfo.id;
      //   if (userId && userId != query.id || !userId) {
      //     targetPage = 'profile2';
      //     pageMiniPath = allPages[targetPage];
      //   }
      // }

      // 如不存在对应的小程序页面，则webview 打开对应环境的 H5 页面
      if (!pageMiniPath) {
        console.warn('对应的小程序页面不存在', targetPage, pageMiniPath)
        if (conf.autoJumpH5) {
          // 转为 H5 url （是否需要配置白名单, 需要，这样安全可控）
          // const whiteList = []
          // if (!whiteList.includes(targetPage)) return;
          const h5Url = conf.baseUrl + targetPage + queryStr
          // console.log(h5Url);

          targetPage = h5Url
          pageFullUrl = h5Url
        }
      } else {
        distFullUrl = urlfix(pageMiniPath, stringify(targetQuery))
      }
      break
    }
    // 此处没附加参数
    case 'h5auth':
    case 'h5':
      targetPage = url
      pageFullUrl = origin + pathname + queryStr
      break
    case 'miniapp':
      // TODO: 完善后应该可用 pageFullUrl
      targetPage = url
      break
    default:
      targetPage = pathname || ''
  }

  const result = {
    pageType,
    pageName: targetPage, // 用于页面标识
    pageQuery: targetQuery,
    pageMiniPath,
    pageFullUrl, // 完整 url
    distFullUrl, // 目标页面全拼
  }
  console.log('urlMap:', result)
  return result
}

export default getTargetUrl
