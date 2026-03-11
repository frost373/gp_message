/**
 * 测试纯主动消息发送
 */
const config = require('./config');
const QQBot = require('./src/qq-bot');
const qqBot = new QQBot(config.qqBot);

async function test() {
    await qqBot.getAccessToken();
    const openid = "8C08CFD5BAA8AD3BA1587A7945B46D7D"; // 刚刚日志里获取到的

    const content = "这是一条来自测试脚本的纯主动消息。";
    const url = `${qqBot.getApiBase()}/v2/users/${openid}/messages`;

    console.log('POST', url);
    const body = { content, msg_type: 0 }; // 无 msg_id, 无 msg_seq

    try {
        const headers = await qqBot.getAuthHeaders();
        const axios = require('axios');
        const resp = await axios.post(url, body, { headers });
        console.log('✅ 纯主动发送成功!', resp.data);
    } catch (err) {
        console.log('❌ 纯主动发送失败:', err.response ? err.response.data : err.message);
    }
}

test().catch(console.error);
