/**
 * 测试脚本：连接新版APP WebSocket，打印目标群收到的消息格式。
 */
const config = require('./config');
const PlatformClient = require('./src/platform-client');
const Forwarder = require('./src/forwarder');

async function test() {
    const client = new PlatformClient(config.platform);
    const forwarder = new Forwarder(client, { sendMessage: async () => {} }, config);

    client.on('message', (msg) => {
        console.log('\n[收到目标群消息]');
        console.log(`ID: ${forwarder.extractMessageId(msg)}`);
        console.log('原始:', JSON.stringify(msg, null, 2));
        console.log('格式化:', forwarder.formatMessage(msg));
    });

    await client.login();
    await client.connect();

    console.log(`正在监听 groupId=${config.platform.groupId || config.platform.roomId} 的新版APP消息，按 Ctrl+C 退出...`);
}

test().catch(console.error);
