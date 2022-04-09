import api from '@/api'
import mini from '@/utils/mini'

const state = {
  list: [],
  total: {},
}

const mutations = {
  UPDATE_DATA: (state, { cartList = [], cartTotal = {} }) => {
    state.list = cartList
    state.total = cartTotal
  },
  DELETE_DATA: (state, payload) => {
    const index = state.list.findIndex(item => item.id = payload.id)
    if (index > -1 && index < state.list.length) {
      state.list.splice(index, 1)
    }
  },
}

const actions = {
  getData({ commit, dispatch }) {
    return new Promise((resolve, reject) => {
      api.getMyCart(
        {},
        res => {
          const { data } = res
          dispatch('updateData', data)
          resolve(res)
        },
        err => {
          reject(err)
        },
      )
    })
  },
  updateData({ commit }, payload = {}) {
    commit('UPDATE_DATA', payload)
  },
  addData({ commit, dispatch }, payload = {}) {
    return new Promise((resolve, reject) => {
      api.addCart(
        {
          ...payload,
        },
        res => {
          const { data } = res
          dispatch('updateData', data)
          resolve(res)
        },
        err => {
          reject(err)
        },
      )
    })
  },
  // 用于编辑
  toggleChecked({ commit, state }, payload = {}) {
    const { item, index } = payload
    state.list[index].checked = item.checked ? 0 : 1
  },
  delete({ commit }, payload = {}) {
    commit('DELETE_DATA', payload)
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
}
