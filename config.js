/**
 * 消息转发器配置
 */
module.exports = {
  // 课程平台配置
  platform: {
    // 新版APP HTTP接口地址
    baseUrl: process.env.PLATFORM_BASE_URL || 'http://8.136.131.169:8890',
    // 新版APP WebSocket地址
    wsUrl: process.env.PLATFORM_WS_URL || 'ws://8.136.131.169:8878/im',
    username: process.env.PLATFORM_USERNAME || '15018349890',
    password: process.env.PLATFORM_PASSWORD || 'wu1219883',
    // 新版登录字段 terminal，new-doc里PC端为0
    terminal: parseInt(process.env.PLATFORM_TERMINAL) || 0,
    // WebSocket鉴权字段 devId；未配置时会自动生成一个随机值
    devId: process.env.PLATFORM_DEV_ID ? parseInt(process.env.PLATFORM_DEV_ID) : undefined,
    // 只转发这个groupId的消息。兼容旧变量 PLATFORM_ROOM_ID。
    groupId: parseInt(process.env.PLATFORM_GROUP_ID || process.env.PLATFORM_ROOM_ID) || 9,
    roomId: parseInt(process.env.PLATFORM_GROUP_ID || process.env.PLATFORM_ROOM_ID) || 9,
    heartbeatIntervalMs: parseInt(process.env.PLATFORM_HEARTBEAT_INTERVAL_MS) || 21000,
    reconnectDelayMs: parseInt(process.env.PLATFORM_RECONNECT_DELAY_MS) || 5000,
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

  // 日志级别: 'debug' | 'info' | 'warn' | 'error'
  logLevel: process.env.LOG_LEVEL || 'info',
};
