/**
 * 消息转发器入口
 *
 * 功能: 从新版APP群聊WebSocket接收消息 → 通过QQ机器人单聊转发给你
 *
 * 使用方式:
 *   node index.js
 *
 * 首次使用时：
 *   1. 启动后机器人会通过WebSocket连接QQ开放平台
 *   2. 你需要在QQ上给机器人发一条消息（任意内容）
 *   3. 机器人获取到你的openid后开始转发
 *   4. 之后课程聊天室的新消息会自动转发到你的QQ单聊
 */

const config = require('./config');
const PlatformClient = require('./src/platform-client');
const QQBot = require('./src/qq-bot');
const QQBotGateway = require('./src/qq-gateway');
const Forwarder = require('./src/forwarder');

async function main() {
    console.log('🚀 消息转发器 v2.0 (新版APP WebSocket + QQ单聊模式)');
    console.log(`📅 ${new Date().toLocaleString()}\n`);

    // 创建课程平台客户端
    const platformClient = new PlatformClient(config.platform);

    // 创建QQ机器人客户端
    const qqBot = new QQBot(config.qqBot);

    // 创建转发器
    const forwarder = new Forwarder(platformClient, qqBot, config);

    // 创建WebSocket网关
    const gateway = new QQBotGateway(qqBot);

    // 优雅退出
    const shutdown = () => {
        console.log('\n\n收到终止信号...');
        forwarder.stop();
        gateway.disconnect();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (err) => {
        console.error('[Fatal] 未捕获的异常:', err);
        forwarder.stop();
        gateway.disconnect();
        process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
        console.error('[Fatal] 未处理的Promise拒绝:', reason);
    });

    // 1. 获取QQ机器人Token
    await qqBot.getAccessToken();

    // 2. 检查是否已配置userOpenId
    if (config.qqBot.userOpenId) {
        console.log(`[Main] 已配置 userOpenId: ${config.qqBot.userOpenId}`);
        console.log('[Main] 直接启动转发...\n');
        await forwarder.start();
        return;
    }

    // 3. 没有配置openid，通过QQ开放平台WebSocket获取
    console.log('\n📱 未配置 userOpenId，将通过WebSocket获取...');
    console.log('⏳ 请在QQ上给机器人发送任意消息以绑定...\n');

    // 当获取到用户openid时启动转发
    gateway.onUserOpenId((openId) => {
        console.log(`\n🎉 获取到用户 OpenId: ${openId}`);
        console.log('[Main] 已自动配置，开始转发消息...\n');

        // 设置发送目标
        qqBot.config.userOpenId = openId;

        // 启动转发器
        forwarder.start().catch(err => {
            console.error('[Main] 转发器启动失败:', err.message);
        });
    });

    // 连接WebSocket网关
    try {
        await gateway.connect();
    } catch (err) {
        console.error(`\n❌ WebSocket连接失败: ${err.message}`);
        console.error('请检查QQ机器人的appid和appsecret是否正确');
        process.exit(1);
    }
}

main();
