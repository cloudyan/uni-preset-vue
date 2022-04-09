import conf from '@/conf'
import _request from './request'
// import { stringify } from '@/utils/index';
import mini from '@/utils/mini'

const regHttp = /^https?/i

function request(url, options, success, fail) {
  const originUrl = regHttp.test(url) ? url : `${conf.apiBaseUrl}${url}`
  return _request(originUrl, options, success, fail)
}

/**
 * API 命名规则
 * - 使用 camelCase 命名格式（小驼峰命名）
 * - 命名尽量对应 RESTful 风格，`${动作}${资源}`
 * - 假数据增加 fake 前缀
 * - 便捷易用大于规则，程序是给人看的
 *
 * - 主站流程使用默认, 不带标识, 子业务可以带标识 如 point couple
 */

const modelApis = {
  // submitFormId: 'POST /open/common/formid', // 上传formid
  // 初始化配置
  // getConfig: '5 GET /open/common/appconfig',
  // login: '/open/common/login',

}

let appIdRes = {}
// #ifdef MP-ALIPAY
// eslint-disable-next-line
appIdRes = my.getAppIdSync()
// console.log(appIdRes.appId);
// #endif

// console.log('getExtConfigSync', my.getExtConfigSync())

const commonParams = {
  token: '',
  // uid: '',
  uuid: '',       // 用户唯一标志
  udid: '',       // 设备唯一标志
  // timestamp: '',  // 时间
  channel: conf.terminal, // 渠道
  spm: conf.terminal,
  version: conf.version,  // 系统版本，用于获取最新版数据
  terminal: 'tpl_aliapp',
  platform: conf.terminal, // 平台
  device: '',     // 设备
  swidth: '',     // 屏幕宽度
  sheight: '',    // 屏幕高度
  net: '',        // 网络
  // location: '',   // 地理位置
  // zone_id: 21,  // 当前收货省份
  // lng: 121.463, // 经度
  // lat: 31.234,  // 纬度
  mini_appid: appIdRes.appId,
  // scene_type: 1,
}

// console.log(Object.keys(modelApis))

const models = Object.keys(modelApis).reduce((api, key) => {
  const val = modelApis[key]
  const [url, method = 'GET', cacheTime = 0] = val.split(/\s+/).reverse()
  api[key] = (params, success, fail) => {
    const { hideLoading } = params
    delete params.hideLoading
    return request(url, {
      cacheTime,
      method,
      hideLoading,
      data: Object.assign({}, getCommonParams(), mini.getChannel(), params),
    }, success, fail)
  }
  return api
}, {})

export function setCommonParams(params) {
  return Object.assign(commonParams, params)
}

export function getCommonParams() {
  return { ...commonParams }
}

models.getCommonParams = getCommonParams
models.setCommonParams = setCommonParams

export default models
