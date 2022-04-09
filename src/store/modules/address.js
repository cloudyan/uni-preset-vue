// import api from '@/api'
import storage from '@deepjs/uni-storage'
import mini from '@/utils/mini'
import { get as $get, post as $post, setCommonParams } from '@/api/fetch'

// import mockData from '@/mock/address-list'

const state = {
  current: {},
  list: [],
  default_id: '',
}

const mutations = {
  UPDATE_CURRENT: (state, payload) => {
    if (payload && payload.id) {
      payload.address = [
        payload.provinceName,
        payload.cityName,
        payload.countyName,
        payload.detailInfo,
      ].join('')
    }
    state.current = payload || {}
  },
  UPDATE_LIST: (state, payload = []) => {
    state.list = payload
  },
  SET_DEFAULT_ADDRESS: (state, payload) => {
    state.list = state.list.map(item => {
      return {
        ...item,
        isDefault: Number(item.address_id === payload),
      }
    })
    // 新增一个之前不存在的属性，不会响应式
    // state.list = state.list.sort(x => x.isDefault ? -1 : 1)
  },
  // DELETE_ADDRESS: (state, payload) => {
  //   const index = state.list.findIndex(item => item.id = payload.id)
  //   if (index > -1 && index < state.list.length) {
  //     state.list.splice(index, 1)
  //   }
  // },
}

const actions = {
  updateCurrent({ commit }, payload) {
    commit('UPDATE_CURRENT', payload)
  },
  updateList({ commit }) {
    return new Promise((resolve, reject) => {
      // mock
      // const res = mockData
      // const { data } = res
      // commit('UPDATE_LIST', data)
      // resolve(res)

      // 地址是不分页的
      $get(
        'address/lists',
        {},
        res => {
          const { data } = res
          commit('UPDATE_LIST', data.list)
          commit('SET_DEFAULT_ADDRESS', data.default_id)
          resolve(res)
        },
        err => {
          reject(err)
        },
      )
    })
  },
  setDefault({ commit }, { address_id }) {
    $post(
      'address/setDefault',
      {
        address_id,
      },
      res => {
        const { data } = res
        commit('SET_DEFAULT_ADDRESS', address_id)
      },
      err => {}
    )
  },
  delete({ commit, dispatch }, { address_id }) {
    uni.showModal({
      title: '确定删除该地址?',
      // message: '',
      success(res) {
        if (res.confirm) {
          $post(
            'address/delete',
            {
              address_id,
            },
            res => {
              dispatch('updateList')
              // commit('DELETE_ADDRESS', payload)
            },
            err => {},
          )
        }
      },
    })
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
}
