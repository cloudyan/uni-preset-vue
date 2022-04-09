/*!
 * @Author: cloudyan
 * @Date: 2020-02-15 20:57:39
 * 功能说明: 获取所有的页面
 */

// 无法直接 import json  可以扩展支持 import json 也可以预编译为 js
// 先执行 npm run build
import pagesConfig from '@/pages.json'
// console.log('jsonPagesConfig', jsonPagesConfig)

// 使用全路径
function pagesMap(pageArr: any) {
  return pageArr.reduce((obj: object, item: string) => {
    obj[item] = item
    return obj
  }, {})
}

function pagesObj(allPages: [], tabPages: []) {
  return {
    allPages: pagesMap(allPages),
    tabPages: pagesMap(tabPages),
    defaultPage: allPages[0],
  }
}

function getPages() {
  const { pages = [], tabBar = {} } = pagesConfig
  const tabBarList = tabBar.list || []

  const allPages = pages.map((item: any) => `/${item.path}`)
  const tabPages = tabBarList.map((item: any) => `${item.pagePath}`)

  return pagesObj(allPages, tabPages)
}

// 为什么不直接运行获取，支付宝$global需加载页面时才能拿到
// 新方式不需要依赖 $global 了，所以可以直接使用
const pages = getPages()

console.log(pages)

// 这里需要安装依赖 `npm i babel-plugin-add-module-exports --save-dev`
// 并且修改以下配置文件：plugins 添加 add-module-exports 配置
// /Applications/HBuilderX-Alpha.app/Contents/HBuilderX/plugins/uniapp-cli/babel.config.js
// export default pages;

// export default getPages()

export const allPages = pages.allPages
export const tabPages = pages.tabPages
export const defaultPage = pages.defaultPage

/**


// #ifdef MP-WEIXIN
  const { pages = [], tabBar = {} } = __wxConfig;
  const tabBarList = tabBar.list || [];
  allPages = pages;
  tabPages = tabBarList.map(item => {
    return item.pagePath.replace('.html', '');
  });
  // #endif

  // #ifdef MP-ALIPAY
  // const { pagesConfig = {}, tabsConfig = {} } = $global;
  const { pages = [], tabBar = {} } = appConfig;
  const tabBarList = tabBar.list || [];
  const { pages = [], tabBar = {} } = appConfig;
  const tabBarList = tabBar.list || [];
  // 测试环境，IDE可以拿到，手机拿不到！发布编译代码没问题-_-!!!
  allPages = Object.keys(pages);
  tabPages = Object.keys(tabBarList);
  // #endif

  // #ifdef MP-BAIDU
  const { pages = [], tabBar = {} } = appConfig // JSON.parse(appConfig);
  const tabBarList = tabBar.list || [];
  allPages = pages;
  tabPages = tabBarList.map(item => => {
    return item.pagePath;
  });
  // #endif

  // #ifdef MP-TOUTIAO
  const { pages = [], tabBar = {} } = appConfig // __ttConfig;
  const tabBarList = tabBar.list || [];
  allPages = pages;
  tabPages = tabBarList.map(item => => {
    return item.pagePath;
  });
  // #endif

*/
