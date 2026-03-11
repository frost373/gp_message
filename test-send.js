/**
 * 测试脚本：获取最新5条消息并通过QQ发给用户
 * 运行后需要在QQ上发任意消息给bot以获取openid
 */
const config = require('./config');
const PlatformClient = require('./src/platform-client');
const QQBot = require('./src/qq-bot');
const QQBotGateway = require('./src/qq-gateway');
const Forwarder = require('./src/forwarder');

async function testSend() {
    console.log('🚀 正在准备发送最新5条消息测试...');

    const platformClient = new PlatformClient(config.platform);
    const qqBot = new QQBot(config.qqBot);
    const gateway = new QQBotGateway(qqBot);
    const forwarder = new Forwarder(platformClient, qqBot, config);

    // 1. 登录
    await platformClient.login();
    await qqBot.getAccessToken();

    // 2. 拉取最新5条
    console.log('\n📬 正在拉取房间消息...');
    const messages = await platformClient.fetchMessages();
    if (!messages || messages.length === 0) {
        console.log('❌ 未获取到任何消息');
        return;
    }

    // 接口返回的数组头部是最新的，我们需要取前5条，然后反转以按时间戳顺序发送
    const latest = messages.slice(0, 5).reverse();
    console.log(`✅ 成功获取最新 ${latest.length} 条消息`);

    // 3. 获取发送目标(OpenID)
    let targetOpenId = config.qqBot.userOpenId;

    if (targetOpenId) {
        console.log(`\n🎯 使用已配置的 userOpenId: ${targetOpenId}`);
        await sendMessages(qqBot, forwarder, latest, targetOpenId);
        process.exit(0);
    } else {
        console.log('\n📱 未配置 userOpenId，请在QQ上给机器人发送任意消息以触发测试...');

        gateway.onUserOpenId(async (openId) => {
            console.log(`\n🎉 获取到用户 OpenId: ${openId}`);
            await sendMessages(qqBot, forwarder, latest, openId);

            console.log('\n✅ 测试发送完成！退出...');
            process.exit(0);
        });

        try {
            await gateway.connect();
        } catch (err) {
            console.error(`\n❌ WebSocket连接失败: ${err.message}`);
            process.exit(1);
        }
    }
}

async function sendMessages(qqBot, forwarder, messages, openId) {
    console.log(`\n🚀 开始发送 ${messages.length} 条消息...`);
    let count = 0;

    for (const msg of messages) {
        count++;
        const formatted = forwarder.formatMessage(msg);
        if (!formatted) continue;

        console.log(`\n[发送 ${count}/${messages.length}]...`);
        try {
            // 支持主动推送的原生图片消息
            if (typeof formatted === 'object') {
                await qqBot.sendUserImageMessage(openId, formatted.imageUrl, formatted.content);
            } else {
                await qqBot.sendUserMessage(openId, formatted);
            }
            console.log('  ✅ 发送成功');
        } catch (err) {
            console.error('  ❌ 发送失败:', err.response ? JSON.stringify(err.response.data) : err.message);
        }
        // 等待一秒避免发送过快
        await new Promise(r => setTimeout(r, 1000));
    }
}

testSend().catch(console.error);
