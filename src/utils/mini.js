/*!
 * @Author: cloudyan
 * @Created at: 2020-02-15 20:07:13
 * 功能说明:
 */

import conf from '@/conf'
import storage from '@deepjs/uni-storage'
import { allPages, tabPages } from './pages'
import urlMap from './url-map'
import { urlfix, stringify, deepCopy, isFastClick } from './index'

const channelConfig = {
  spm: conf.channel,
  channel: conf.channel,
}

const channelUpdate = {
  spm: conf.channel,
  channel: conf.channel,
}

const systemInfo = uni.getSystemInfoSync()
// statusBarHeight 状态栏高度
// titleBarHeight 支付宝小程序
// navigationBarHeight 百度小程序
Object.assign(systemInfo, {
  navBarHeight: systemInfo.titleBarHeight || 44,
})
console.log('systemInfo', systemInfo)

// 将这些变量挂载到全局上去
const mini = {
  env: conf,
  storage,
  systemInfo, // 页面内使用，不推荐组件内使用，尽量保持组件独立
  setTitle(title = '') {
    uni.setNavigationBarTitle({
      title,
    })
  },
  showToast(opt) { // 改写showToast
    if (!opt) return
    const opts = {
      icon: 'none',
      // duration: 2500, // aliapp不支持 duration
    }
    if (typeof opt === 'string') {
      opts.title = opt
    } else {
      Object.assign(opts, opt)
    }
    uni.showToast(opts)
  },
  hideToast() {
    uni.hideToast()
  },
  showLoading(opt) {
    const opts = {
      title: '加载中...',
    }
    if (typeof opt === 'string') {
      opts.title = opt
    } else {
      Object.assign(opts, opt)
    }
    uni.showLoading(opts)
  },
  hideLoading() {
    uni.hideLoading()
  },
  showModal(opt) {
    uni.showModal(opt)
  },
  showActionSheet(opt) {
    uni.showActionSheet(opt)
  },
  getCurPage() { // 当前页面实例
    const pages = getCurrentPages()
    return pages[pages.length - 1] || {}
  },
  getPageInfo() {
    const curtPage = mini.getCurPage()
    const { route = '', pageQuery = {} } = curtPage
    return {
      pageQuery: { ...pageQuery },
      pagePath: route,
      pageName: route.split('/').reverse()[0] || '',
      referer: '',
    }
  },
  getPageName() {
    const { pageName: page = '' } = this || {}
    if (page) return page
    const { pageName } = mini.getPageInfo()
    return pageName
  },
  getChannel() { // 获取当前渠道信息
    // 推荐使用标准 utm 参数
    const { pageQuery = {} } = mini.getCurPage()
    const current = {}
    if (pageQuery.spm) current.spm = pageQuery.spm
    if (pageQuery.channel_id) current.channel = pageQuery.channel_id
    return {...channelConfig, ...channelUpdate, ...current }
  },
  updateChannel(opts = {}) { // 将渠道信息更新到channelUpdate上
    // console.log('channel', opts);
    if (opts.spm) channelUpdate.spm = opts.spm
    if (opts.channel_id) channelUpdate.channel = opts.channel_id
  },
  doLogin(type = 'page') {
    if (type == 'page') {
      this.forward('/pages/login/index', { from: this.getPageName() })
    } else {
      // 弹框
    }
  },
  showErrorPage(message = '', replace = true) {
    // 应该弹出遮罩层，并支持刷新当前页面
    const pageName = mini.getPageName()
    if (pageName !== 'error') {
      // mini.goPage('error', {
      //   message,
      //   replace,
      // });
    }
  },
  onUrlPage(e) {
    let {
      url,
      index = '',
      id = '',
    } = e.currentTarget.dataset

    url = ('' + url).trim()
    if (!url || url == 'undefined' || url == 'null') return

    // url = 'miniapp://pages/topic/topic?appid=2017112000051610&url=https%3A%2F%2Ftopic.doweidu.com%2F%3Fid%3D27ba8f0a3abb699540c02688295717f6';

    mini.forward(url)
  },
  // 万能方法，内部按配别
  forward(url = '', query = {}) {
    if (!url) return
    if (isFastClick()) return

    // test url
    // url = 'https://topic.doweidu.com/?id=dd643eaa3ee74871b6ebfb14f8032c72&origin=msf';
    // url = 'https://m.mishifeng.com/about_us'
    // query = {};

    const {
      pageType,
      pageName,
      pageQuery,
      pageMiniPath,
      pageFullUrl,
      // pageMiniUrl,
    } = urlMap(url, query)

    const forwardType = {
      replace: pageQuery.replace || '',
      back: pageQuery.back || '',
    }

    console.log('$forward switch')
    // 路由分流
    switch (pageType) {
      // 小程序链接类型，最频繁，直接配置 pageName
      case 'mini':
      case 'h5my': {
        // 如果存在对应的小程序页面，则跳小程序页面，否则跳webview H5(白名单限制？)
        // 这里的还没处理好，如果是 h5my 没经过 urlMap 转化
        if (pageMiniPath) {
          mini.goMiniPage(pageName, pageQuery)
        } else {
          mini.goWebviewPage(pageFullUrl, forwardType)
        }
        break
      }
      case 'h5auth':
      case 'h5': {
        // 直接 webview 打开 H5
        mini.goWebviewPage(pageFullUrl, forwardType)
        break
      }
      // 小程序跳转，需要完整路径及参数
      case 'miniapp': {
        mini.goMiniApp(pageName, pageQuery)
        break
      }
      default:
        // do nothing...
    }
  },
  goWebviewPage(url, forwardType = {}) {
    mini.goMiniPage('webview', {
      ...forwardType,
      url: encodeURIComponent(url),
    })
  },
  // 跳转到小程序原生页面
  goMiniPage(pageName, query = {}) {
    // 确认是跳转小程序页面，并且参数已经合并为标准参数
    // 需要判断 replace switch 等
    query = deepCopy(query)
    const { replace, back } = query
    let type = replace ? 'replace' : (back ? 'back' : '')
    delete query.replace
    delete query.back

    const pathPath = allPages[pageName] || ''
    if (!pathPath) return

    const pageFullUrl = urlfix(pathPath, stringify(query))

    // 要以 / 开头，不然变成相对路径了
    let page = { url: `${pageFullUrl}` }
    if (tabPages[pageName]) {
      type = 'switch' // switch 切换不能带 query
      page = { url: `${pathPath}` }
    }

    switch (type) {
      case 'replace':
        // 上传formid事件没办法触发，需要一点时间延迟
        setTimeout(() => {
          uni.redirectTo(page)
        }, 0)
        break
      case 'back':
        uni.navigateBack(page)
        break
      case 'switch':
        // uni.switchTab: url 不支持 queryString
        setTimeout(() => {
          uni.switchTab(page)
        }, 0)
        break
      default:
        // TIP: 默认为 10 ，但支付宝好像是 5，可以申请开通 10
        /* eslint no-undef: 0 */
        if (getCurrentPages().length > 9) {
          setTimeout(() => {
            uni.redirectTo(page)
          }, 0)
        } else {
          // navigateTo, redirectTo 只能打开非 tabBar 页面。
          // switchTab 只能打开 tabBar 页面。
          setTimeout(() => {
            uni.navigateTo(page)
          }, 0)
        }
        break
        // do nothing...
    }
  },
  goMiniApp(pagePath = '', query = {}, extraData = query) {
    const tempQuery = deepCopy(query)
    const { appid: appId } = tempQuery
    delete tempQuery.appid

    const miniUrl = {
      appId, // 跳转到的小程序appId
      // path, // 打开的页面路径，如果为空则打开首页
      extraData, // 需要传递给目标小程序的数据
      success: res => {
        console.log('navigateToMiniProgram res:', res)
      },
      fail: err => {
        console.log('navigateToMiniProgram err:', err)
      },
      complete: val => {
        console.log('navigateToMiniProgram complete', val)
      },
    }

    const tempPath = pagePath.split('?')[0] || ''
    pagePath = tempPath.replace('miniapp://', '')
    // TODO: 这里应该做参数合并
    const pageMiniUrl = urlfix(pagePath, stringify(tempQuery))
    if(pageMiniUrl) {
      miniUrl.path = pageMiniUrl
    }
    console.log('miniUrl', miniUrl)
    uni.navigateToMiniProgram(miniUrl)
  },
  // goAlipayPage() {
  //   console.log('alipays://platformapi/startapp?appId=20000691&url=%2Fwww%2Fsrc%2Fxmada.html%3Fscene%3Dapp_xxx%26extra%3D' + params);

  //   my.ap.navigateToAlipayPage({
  //     path: `alipays://platformapi/startapp?appId=20000691&url=%2Fwww%2Fsrc%2Fxmada.html%3Fscene%3Dapp_xxx%26extra%3D${params}`,
  //     success: res => {
  //       console.log(res);
  //     },
  //     fail: err => {
  //       console.log(err);
  //     }
  //   })
  // },
  back(num = 1) {
    // 来此页面之前记录上一个页面，点击则返回
    if (getCurrentPages().length > 1) {
      uni.navigateBack()
    } else {
      // 回到个人中心或首页
    }
    // uni.navigateBack({
    //   delta: num,
    // })
  },
}

export default mini
