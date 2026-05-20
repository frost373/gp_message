/**
 * 测试脚本：收到一条新版APP目标群消息后，通过QQ发送给用户。
 */
const config = require('./config');
const PlatformClient = require('./src/platform-client');
const QQBot = require('./src/qq-bot');
const QQBotGateway = require('./src/qq-gateway');
const Forwarder = require('./src/forwarder');

async function testSend() {
    console.log('正在准备新版APP WebSocket消息转发测试...');

    const platformClient = new PlatformClient(config.platform);
    const qqBot = new QQBot(config.qqBot);
    const gateway = new QQBotGateway(qqBot);
    const forwarder = new Forwarder(platformClient, qqBot, config);

    await qqBot.getAccessToken();

    let targetOpenId = config.qqBot.userOpenId;
    if (!targetOpenId) {
        console.log('\n未配置 userOpenId，请在QQ上给机器人发送任意消息以触发测试...');
        targetOpenId = await waitForOpenId(gateway);
        qqBot.config.userOpenId = targetOpenId;
    }

    console.log(`使用 userOpenId: ${targetOpenId}`);
    console.log(`正在监听 groupId=${config.platform.groupId || config.platform.roomId}，收到下一条消息后发送到QQ...`);

    platformClient.once('message', async (msg) => {
        const formatted = forwarder.formatMessage(msg);
        if (!formatted) {
            console.log('收到的消息不是聊天内容，已跳过:', JSON.stringify(msg));
            process.exit(0);
        }

        try {
            await qqBot.sendMessage(formatted);
            await platformClient.markGroupRead(msg.groupId);
            console.log('测试发送成功');
            process.exit(0);
        } catch (err) {
            console.error('测试发送失败:', err.response ? JSON.stringify(err.response.data) : err.message);
            process.exit(1);
        }
    });

    await platformClient.login();
    await platformClient.connect();
}

function waitForOpenId(gateway) {
    return new Promise((resolve, reject) => {
        gateway.onUserOpenId((openId) => {
            gateway.disconnect();
            resolve(openId);
        });

        gateway.connect().catch(reject);
    });
}

testSend().catch(console.error);
