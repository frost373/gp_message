/**
 * 消息转发器配置
 */
module.exports = {
  // 课程平台配置
  platform: {
    baseUrl: process.env.PLATFORM_BASE_URL || 'http://82.156.223.207:18080',
    username: process.env.PLATFORM_USERNAME || '15018349890',
    password: process.env.PLATFORM_PASSWORD || 'wu1219883',
    roomId: parseInt(process.env.PLATFORM_ROOM_ID) || 75,
    // 登录类型: 1=账号登录, 2=手机号登录
    loginType: parseInt(process.env.PLATFORM_LOGIN_TYPE) || 2,
    userType: parseInt(process.env.PLATFORM_USER_TYPE) || 1,
  },

  // QQ机器人配置
  qqBot: {
    appId: process.env.QQ_APP_ID || '1903240935',
    appSecret: process.env.QQ_APP_SECRET || 'eCamlX7UebLtEMJ4',
    // QQ开放平台API地址
    apiBase: process.env.QQ_API_BASE || 'https://api.sgroup.qq.com',
    // 沙箱环境API地址（开发测试用）
    sandboxApiBase: process.env.QQ_SANDBOX_API_BASE || 'https://sandbox.api.sgroup.qq.com',
    // 是否使用沙箱环境
    useSandbox: process.env.QQ_USE_SANDBOX === 'true',
    // 鉴权地址
    authUrl: process.env.QQ_AUTH_URL || 'https://bots.qq.com/app/getAppAccessToken',
    // 发送目标配置 - 需要设置 group_openid 或 channel_id
    // 群聊: 设置 groupOpenId
    // 频道: 设置 channelId
    // 单聊: 设置 userOpenId
    groupOpenId: process.env.QQ_GROUP_OPENID || '',
    // *** 单聊相关配置 (如果启用单聊转发) ***
    // (可选) 用户的 openid, 通过监听消息获取
    userOpenId: process.env.USER_OPENID || '8C08CFD5BAA8AD3BA1587A7945B46D7D',
  },

  // 轮询配置
  polling: {
    // 轮询间隔（毫秒）
    interval: parseInt(process.env.POLLING_INTERVAL) || 10000,
    // 首次启动是否转发已有消息
    forwardExisting: process.env.FORWARD_EXISTING === 'true',
  },

  // 日志级别: 'debug' | 'info' | 'warn' | 'error'
  logLevel: process.env.LOG_LEVEL || 'info',
};
