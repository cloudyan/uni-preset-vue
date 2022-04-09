// 内容较多的话，可以分多个js，条件引用require

let config = {
  appid: '',
  name: '',
  version: '',
  platform: '',
}

// #ifdef MP-WEIXIN
Object.assign(config, {
  appid: '',
  channel: 'wxapp',
  version: '1.0.0',
  platform: 'wxapp',
})
// #endif

// #ifdef MP-ALIPAY
Object.assign(config, {
  appid: '',
  channel: 'aliapp',
  version: '1.0.0',
  platform: 'aliapp',
})
// #endif

// #ifdef MP-BAIDU
Object.assign(config, {
  appid: '',
  channel: 'bdapp',
  version: '1.0.0',
  platform: 'bdapp',
})
// #endif

// #ifdef MP-TOUTIAO
Object.assign(config, {
  appid: '',
  channel: 'ttapp',
  version: '1.0.0',
  platform: 'ttapp',
})
// #endif

// #ifdef MP-TINGTALK
Object.assign(config, {
  appid: '',
  channel: 'ddapp',
  version: '1.0.0',
  platform: 'ddapp',
})
// #endif

export default config
