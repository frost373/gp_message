/**
 * 测试脚本：拉取最新5条消息并展示格式化后的结果
 */
const config = require('./config');
const PlatformClient = require('./src/platform-client');
const Forwarder = require('./src/forwarder');

async function test() {
    const client = new PlatformClient(config.platform);
    const forwarder = new Forwarder(client, null, config);

    await client.login();
    console.log('\n📬 正在拉取房间消息...\n');

    const messages = await client.fetchMessages();

    if (!messages || messages.length === 0) {
        console.log('❌ 未获取到任何消息');
        return;
    }

    console.log(`✅ 成功拉取到 ${messages.length} 条历史消息`);

    // 接口返回的数组头部是最新的，我们需要取前5条，然后反转（按时间从老到新发送）
    const latest = messages.slice(0, 5).reverse();

    console.log(`\n--- 最新 ${latest.length} 条消息将如此发送 ---\n`);

    latest.forEach((msg, i) => {
        console.log(`[消息 ${i + 1}] (ID: ${forwarder.extractMessageId(msg)})`);
        const formatted = forwarder.formatMessage(msg);
        console.log(formatted);
        console.log('\n' + '-'.repeat(40) + '\n');
    });
}

test().catch(console.error);
