import Vue from 'vue'
import Vuex from 'vuex'

// 这是 vuex，尚未验证 vue3.0
import app from './modules/app.js'
import user from './modules/user.js'
// import location from './modules/location.js'
// import popup from './modules/popup.js'
import cart from './modules/cart.js'
import address from './modules/address.js'

Vue.use(Vuex)

export default new Vuex.Store({
  strict: false,
  modules: {
    app,
    user,
    cart,
    address,
    // location,
    // popup,
  },
})
