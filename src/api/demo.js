import { request } from '@/utils/request'

export function getConfig(params = {}) {
  return request('/common/initconfig', {
    method: 'GET',
    params,
  })
}
