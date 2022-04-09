// 修复平台 bug

/**
 * 需要添加的安全域名或白名单

- uni-app
  - 统计        : tongji.dcloud.io
  - 自有 api    : xxx.xxx
- uniCloud
  - request    : api.bspapp.com
  - uploadFile : bsppub.oss-cn-shanghai.aliyuncs.com
*/

// #ifdef MP-DINGTALK

// 1. [API 调用] httpRequest: headers["Content-Type"]为application/json时，data参数只支持json字符串，请检查data的值类型
// console.log($global.bridge);

// const bridge = $global.bridge

// const requestOld = bridge.request;
// bridge.request = function(...rest) {
//   // console.log('request:', rest)
//   requestOld(...rest);
// }

// eslint-disable-next-line
const httpRequestOld = bridge.httpRequest
// eslint-disable-next-line
bridge.httpRequest = function (options) {
  options.headers['content-type'] = 'application/x-www-form-urlencoded'
  // console.log('httpRequest:', options);
  httpRequestOld(options)
}

// 2. 真机预览，提示无权跨域调用
// 需要添加 request 安全域名


// 3. 弹窗问题
// https://ding-doc.dingtalk.com/doc#/dev/ui-feedback/dd.confirm
const showModelOld = uni.showModal
uni.showModal = function (opts = {}) {
  const { showCancel = true } = opts
  if (!showCancel) {
    bridge.alert({
      title: opts.title,
      content: opts.content,
      buttonText: opts.confirmText,
      success: () => {
        opts.success({confirm: true})
      },
    })
  } else {
    bridge.confirm({
      title: opts.title,
      content: opts.content,
      confirmButtonText: opts.confirmText,
      cancelButtonText: opts.cancelText,
    })
  }
}

// #endif
