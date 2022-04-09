

import env from './env'

type EnvEnum = 'local' | 'dev' | 'sit' | 'prod'
type ENVConfig = {
  [key in EnvEnum]: {
    host?: string
    baseUrl?: string
    apiBaseUrl?: string
    apiPrefix?: string
  }
}

const apiEnv: EnvEnum = 'local' // local dev beta prod
const baseEnv = {
  ...env,
  baseUrl: '',
  apiBaseUrl: '',
  apiPrefix: '',
}

const ENV: ENVConfig = {
  prod: {
    host: 'm.xxx.com',
    baseUrl: 'https://m.xxx.com',
    apiBaseUrl: 'https://m.api.xxx.com',
  },
  local: {
    apiPrefix: '/api',
    baseUrl: 'http://localhost:8085',
    apiBaseUrl: 'https://m.dev.xxx.net',
  },
  dev: {
    baseUrl: 'https://m.dev.xxx.com',
    apiBaseUrl: 'https://m.dev.xxx.com',
  },
  sit: {
    baseUrl: 'https://m.sit.xxx.com',
    apiBaseUrl: 'https://m.sit.xxx.com',
  },
}


if (apiEnv === 'local') {
  // #ifndef H5
  if (process.env.TARO_ENV !== 'h5') {
    ENV.local.apiPrefix = ''
    ENV.local.apiBaseUrl = ''
  }
  // #endif
}

function createEnv(current: EnvEnum = 'prod') {
  return Object.assign({}, baseEnv, ENV[current], {stage: current})
}

const envResult = createEnv(apiEnv)

export default envResult
