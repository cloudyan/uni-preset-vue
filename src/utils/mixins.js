/*!
 * @Author: cloudyan
 * @Created at: 2020-02-22 13:39:50
 * 功能说明:
 */

/* 通过Vue.mixin混入所有页面，此mixin方法仅用于页面，不向外暴露 */
import { qs } from 'url-parse'
import { allPages } from '@/utils/pages'
import conf from '@/conf'
import { decodeQuery } from '@/utils/index'

let pageUUID = 1
const messages = {}
let cachePages = {}

// const systemInfo = uni.getSystemInfoSync()
// 需要选择城市的页面
const needCityList = [
  'index',
  'profile',
  'product',
]

// 需要定位信息的页面
const needGeoList = [
  'index',
  'city',
]

// mixins 会混入所有组件，没必要都执行
const mixins = {
  onLoad(query = {}) {
    if (!this) return
    // console.log(JSON.stringify(query));

    // #ifdef MP-WEIXIN || MP-TOUTIAO
    // 微信、头条 需要手动 decode query，支付宝不需要
    query = decodeQuery(query)
    // #endif

    // 发现aliapp url 跳转时，出现了 query 中的 url 是 encode 的，需要手动 decode
    // #ifdef MP-ALIPAY
    query = decodeQuery(query)
    // #endif

    // console.log(JSON.stringify(query));
    query.title && this.$setTitle(query.title)
    this.onPageInit(query)
  },
  onShow() {
    if (!this) return
    const { pageName } = this
    if (!pageName) return
    // console.log('mixins onShow', pageName, this);
    // this.dwd_sensors.track('pageshow',{
    //   pagename: pageName,
    // });
    // 如果无选择城市，则去选择城市
    // const { selectCity = {} } = this.$store.state.location;
    // if (!selectCity.id && needCityList.includes(pageName)) {
    //   this.$forward('city');
    // }
  },
  onShareAppMessage() { // 默认分享信息
    const shareInfo = this.shareInfo || {}
    const {logged = false, userInfo = {}, shareCode = ''} = this.$store.state.user
    let share_code = shareCode
    // 用户登录 && 用户是合伙人
    if (logged && userInfo.member_level > 0) {
      share_code = userInfo.share_code
    }
    let params = ''
    if (share_code) {
      params = '?share_code=' + share_code
    }

    const branchInfo = this.$store.state.app.app_config || {}
    const newShareInfo = {
      path: `/pages/index/index${params}`,
      ...conf.defaultShareInfo,
      content: `${branchInfo.branch_name || ''}大额优惠等你来`,
      desc: `${branchInfo.branch_name || ''}大额优惠等你来`,
      imageUrl: branchInfo.logo,
      ...shareInfo,
    }
    if (branchInfo.branch_background && /^https/.test(branchInfo.branch_background)) {
      newShareInfo.bgImgUrl = branchInfo.branch_background
    }

    Object.assign(newShareInfo, shareInfo)
    console.log('____shareInfo_____', branchInfo, newShareInfo)
    // console.log('newShareInfo', newShareInfo);
    return newShareInfo
  },
  methods: {
    onPageInit(query = {}) { // 初始化页面信息
      this.setQuery(query)

      const pagesArr = getCurrentPages() || []
      cachePages = {}
      pagesArr.forEach((pageItem, index) => {
        const { pageName, pageId, route } = pageItem
        // 修改支持多个页面
        const msgKey = `${pageName}:${pageId}`
        if (!cachePages[pageName]) {
          cachePages[pageName] = [msgKey]
        } else {
          cachePages[pageName].push(msgKey)
        }
      })
    },
    setQuery(query = {}) { // 设置pageName、pageQuery等页面参数
      const currentPage = this.$getCurPage()
      const { route = '' } = currentPage

      const obj = {
        pageName: route || '',
        pageId: pageUUID++,
        pageQuery: query,
        pagePath: route,
      }
      // 给vue页面实例添加属性
      Object.assign(this, obj)
      // 直接操作页面实例，添加属性
      Object.assign(currentPage, obj)
      console.log('pageQuery', query, obj)
    },
    refresh() {
      // 空方法，避免报错
    },
    // 准备废弃
    postMessage(page, opts = {}) {
      if (!allPages[page] && !cachePages[page] || page === this.$getPageName() ) {
        console.error(`无法给 ${page} 页面发消息`)
        return
      }
      const msgKeys = cachePages[page] || []
      msgKeys.forEach((msgKey, index) => {
        if (!messages[msgKey]) messages[msgKey] = {}
        Object.assign(messages[msgKey], opts)
      })
    },
    onMessage() {
      const page = this.$getPageName()
      const msgKey = `${page}:${this.pageId}`
      let message
      if (allPages[page] || messages[msgKey]) {
        message = messages[msgKey] || {}
        delete messages[msgKey]
        if (message.needRefresh) {
          this.refresh()
        }
      }
      return message || {}
    },
    imageError(err) { // 图片加载失败
      console.log(err)
    },
    goService(query = {}) {
      // 怎么对外配置呢，还是需要一个路径映射 所有还是做个 service 页面
      // 但推荐直接调用 goService 方法, 而不是经过 service 页面再跳一次
      this.$api.getOpenIm(
        {},
        res => {
          // {
          //   nonce: 123
          //   signature: "xxx"
          //   timestamp: 1245
          //   web_token: "xxx"
          // }
          const { data } = res
          const { userInfo } = this.$store.state.user
          Object.assign(data, {
            c_name: userInfo.nickname || '',
            web_plugin_id: '59049',
            ...query,
          })
          // const udeskUrl = 'https://iqianggou.udesk.cn/im_client/?web_plugin_id=59049&' + stringify(data);
          const udeskUrl = 'https://iqianggou.udesk.cn/im_client/'
          this.$forward(udeskUrl, data)
        },
        err => {},
      )
    },
    // 你需要放在 this.$nextTick 回调中，或自己设定延迟
    // $elQuery('.el').then(res > {}).catch(err => {})
    $elQueryPromise(el) {
      return new Promise((resolve, reject) => {
        uni.createSelectorQuery().in(this).selectAll(el).boundingClientRect().exec((data) => {
          const temp = data[0]
          if (temp) {
            resolve(temp)
          } else {
            console.warn('未找到元素:', el)
            reject([])
          }
        })
      })
    },
    callPhone(phoneNumber) {
      if (!phoneNumber) return
      console.log('call', phoneNumber)
      uni.makePhoneCall({
        phoneNumber,
      })
    },
    copyData(str, callback) {
      if (!str) return
      uni.setClipboardData({
        data: str,
      })
      if (typeof callback == 'function') callback()
    },
  },
}

export default mixins
