import storage from '@deepjs/uni-storage'
import {
  get as $get,
  post as $post,
  setCommonParams,
} from '@/api/fetch'
// import mini from '@/utils/mini'

// 取登录信息/个人信息(如果登录信息和个人中心结构不同，不要合并)
const storeAuthInfo = storage.get('authInfo') || {}
const storeUserInfo = storage.get('userInfo') || {}
let oldUserInfo = storeUserInfo

console.log('cache userInfo:', storeUserInfo)

function setApiParams(config) {
  setCommonParams(config)
  // setHeaders(config);
}

setApiParams(storeAuthInfo)

function isLogin(data = {}) {
  return !!data.token
}

const state = {
  userInfo: storeUserInfo,
  logged: isLogin(storeAuthInfo),
  showPopupLogin: false,
  userCenter: {},
}

const mutations = {
  // 全量更新
  SET_AUTH: (state, data = {}) => {
    data = { token: data.token, user_id: data.user_id }
    const oldLogged = state.logged
    oldUserInfo = state.userInfo

    const logged = isLogin(data)
    state.logged = logged

    setApiParams({
      token: data.token || '',
      user_id: data.user_id || '',
    })
    storage.set('authInfo', data, 86400 * 30)

    // 登录态发生变化或 token 变更时触发(注意条件判断不严谨，容易异常)
    if (oldLogged !== logged || (logged && oldUserInfo.token != data.token)) {
      // console.error('emit logged:changed', logged);
      // 发生变化触发更新，
      console.log('logged:changed', logged)
      uni.$emit('logged-changed', logged)
    }
  },
  SET_USERINFO: (state, payload) => {
    state.userInfo = payload
    storage.set('userInfo', payload, 86400 * 30)
  },
  SET_USERCENTER: (state, payload = {}) => {
    state.userCenter = payload
  },
}

const actions = {
  getAuthorize({ dispatch, state }, payload = {}) {
    return new Promise((resolve, reject) => {

      // #ifdef MP-ALIPAY
      // 此处一次授权
      uni.getOpenUserInfo({
        fail(res) {
          const message = '获取授权信息失败,请重试~'
          uni.showToast({
            title: message,
          })
          reject({
            errmsg: message,
          })
        },
        success(res) {
          // 以下方的报文格式解析两层 response
          const openUserInfo = JSON.parse(res.response).response
          console.log('auth userInfo', openUserInfo)

          // https://opendocs.alipay.com/mini/api/qcn29g
          // 这里 getAuthCode 使用 auth_user 会触发二次授权 auth_base 会静默授权
          dispatch('getAuthCode')
            .then(authCode => {
              dispatch('apiLogin', {
                auth_code: authCode,
                user_info: openUserInfo,
                // invite_code: state.shearCode
              }).then(res => {
                resolve(res)
              })
            })
        },
      })
      // #endif

      // #ifdef MP-WEIXIN
      // console.log(JSON.stringify(payload));
      const { authCode, openUserInfo } = payload
      dispatch('apiLogin', {
        // login_type: 8,
        auth_code: authCode,
        encrypted_data: openUserInfo.encryptedData,
        iv: openUserInfo.iv,
        // invite_code: state.shearCode
      }).then(
        res => {
          resolve(res)
        },
      )
      // #endif
    })
  },
  getAuthCode({ commit, dispatch }, scopes = 'auth_base') {
    return new Promise((resolve, reject) => {
      uni.getAuthCode({
        scopes, // auth_base auth_user
        success({ authCode }) {
          console.log(authCode)
          resolve(authCode)
        },
        fail(err) {
          // reject(err);
        },
      })
    })
  },
  getAuth({ commit, dispatch, state }, scopes = 'auth_base') {
    return new Promise((resolve, reject) => {
      dispatch('getAuthCode', scopes)
        .then(authCode => {
          dispatch('apiLogin', {
            auth_code: authCode,
            // user_info: userInfo,
            // invite_code: state.shearCode
          }).then(
            res => {
              resolve(res)
            },
          )
        })
    })
  },
  apiLogin({ commit, dispatch, state }, loginForm = {}) {
    return new Promise((resolve, reject) => {
      const { user_info } = loginForm
      const gender = { un: 0, m: 1, f: 2 }
      const userInfo = {
        nickName: user_info.nickName,
        avatarUrl: user_info.avatar,
        gender: gender[user_info.gender],
        country: user_info.countryCode,
        province: user_info.province,
        city: user_info.city,
      }

      // {"nickName":"晓寒","gender":1,"language":"zh_CN","city":"普陀","province":"上海","country":"中国","avatarUrl":"https://wx.qlogo.cn/mmopen/vi_32/DYAIOgq83erGvc8gA38oia9v4taAHicDKJKy70uIIVmLSrib7NjXtbw6n6TE4vA4SA0gE4PqudpiaktQeoganXJ1IA/132"}"

      $post(
        'user/login',
        {
          code: loginForm.auth_code,
          user_info: JSON.stringify(userInfo),
        },
        res => {
          const { data } = res
          // 记录token user_id
          commit('SET_AUTH', data)

          // 获取用户信息
          // dispatch('getUserInfo')
          resolve(res)
        },
        err => {
          reject(err)
        },
        () => {
          uni.hideLoading()
        },
      )
    })
  },

  // auth_base
  login({ commit, dispatch, state }, { scope = 'auth_base' }) {
    if (scope == 'auth_base') {
      uni.getAuthCode({
        scopes: 'auth_base', // auth_base auth_user
        success: ({ authCode }) => {
          // 仅仅 code 能获取到 alipay_user_id 么
        },
      })
    }
    dispatch('popupLogin', true)
  },
  // TODO: 获取用户信息(此信息结构和登录信息结构不一致，不复用)
  getUserInfo({ commit, dispatch, state }, payload = {}) {
    return new Promise((resolve, reject) => {
      $get(
        'user.index/detail',
        {
          hideLoading: true,
        },
        res => {
          const { data } = res
          // dispatch('popupLogin', false);

          commit('SET_USERINFO', data.userInfo || {})
          commit('SET_USERCENTER', data)

          resolve(res)
        },
        err => {
          reject(err)
          commit('SET_AUTH', {})
          // 这里统一鉴权提示报错
          return true
        }
      )
      // if (typeof api.getProfile == 'function') {
      //   api.getProfile(
      //     Object.assign({
      //       hideLoading: true,
      //     }, payload),
      //     res => {

      //     },
      //     err => {

      //     }
      //   )
      // } else {
      //   const data = {}
      //   commit('SET_USERINFO', data)
      //   resolve({ data })
      // }
    })
  },
  // 用户登录 usage
  // this.$store.dispatch('login', loginForm)
  //   .then(res => {})
  //   .catch(err => {})
  getMember({ commit }, payload) {
    // api.getMember(
    //   {},
    //   res => {
    //     commit('UPDATE_MEMBER', res.data)
    //   },
    //   err => {
    //     commit('UPDATE_MEMBER', {})
    //   },
    // )
  },

  // 登出
  logout({ commit, state }) {
    return new Promise((resolve, reject) => {
      // api.logout(
      //   {},
      //   res => {
      //     commit('SET_AUTH', {})
      //     commit('SET_USERINFO', {})
      //     // removeToken();
      //     // uni.showToast({
      //     //   title: '退出登录成功',
      //     // })
      //     resolve()
      //   },
      //   err => {
      //     reject(err)
      //   }
      // )
    })
  },

  // 前端 登出
  fedLogout({ commit }) {
    return new Promise(resolve => {
      commit('SET_AUTH', {})
      commit('SET_USERINFO', {})
      resolve()
    })
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
}
