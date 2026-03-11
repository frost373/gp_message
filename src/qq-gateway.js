/**
 * QQ机器人 WebSocket 网关
 * 连接QQ开放平台WebSocket，监听事件（获取用户openid等）
 */
const WebSocket = require('ws');
const axios = require('axios');

// WebSocket Opcode
const OP = {
    DISPATCH: 0,        // 服务端推送事件
    HEARTBEAT: 1,       // 心跳
    IDENTIFY: 2,        // 鉴权
    RESUME: 6,          // 恢复连接
    RECONNECT: 7,       // 服务端要求重连
    INVALID_SESSION: 9, // 无效session
    HELLO: 10,          // 连接成功
    HEARTBEAT_ACK: 11,  // 心跳确认
};

class QQBotGateway {
    constructor(qqBot) {
        this.qqBot = qqBot;
        this.config = qqBot.config;
        this.ws = null;
        this.heartbeatTimer = null;
        this.lastSeq = null;
        this.sessionId = null;
        this.userOpenId = null;  // 存储获取到的用户openid
        this.isReady = false;

        // 事件监听
        this._onUserOpenId = null;
        this._onReady = null;
    }

    /**
     * 获取WebSocket网关地址
     */
    async getGatewayUrl() {
        const token = await this.qqBot.getAccessToken();
        const apiBase = this.qqBot.getApiBase();
        try {
            const resp = await axios.get(`${apiBase}/gateway`, {
                headers: {
                    'Authorization': `QQBot ${token}`,
                },
                timeout: 10000,
            });
            return resp.data.url;
        } catch (err) {
            console.error('[Gateway] 获取网关地址失败:', err.response ? JSON.stringify(err.response.data) : err.message);
            throw err;
        }
    }

    /**
     * 连接WebSocket
     */
    async connect() {
        const gatewayUrl = await this.getGatewayUrl();
        console.log(`[Gateway] 正在连接 WebSocket...`);

        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(gatewayUrl);

            this.ws.on('open', () => {
                console.log('[Gateway] WebSocket 已连接');
            });

            this.ws.on('message', (data) => {
                this.handleMessage(JSON.parse(data.toString()), resolve);
            });

            this.ws.on('close', (code, reason) => {
                console.log(`[Gateway] WebSocket 已断开: ${code} ${reason}`);
                this.cleanup();
                // 自动重连
                setTimeout(() => {
                    console.log('[Gateway] 尝试重连...');
                    this.connect().catch(console.error);
                }, 5000);
            });

            this.ws.on('error', (err) => {
                console.error('[Gateway] WebSocket 错误:', err.message);
                reject(err);
            });

            // 30秒超时
            setTimeout(() => {
                if (!this.isReady) {
                    reject(new Error('WebSocket 连接超时'));
                }
            }, 30000);
        });
    }

    /**
     * 处理收到的WebSocket消息
     */
    handleMessage(payload, onReady) {
        const { op, d, s, t } = payload;

        // 更新序列号
        if (s) this.lastSeq = s;

        switch (op) {
            case OP.HELLO:
                // 收到Hello，开始鉴权 + 心跳
                this.startHeartbeat(d.heartbeat_interval);
                this.identify();
                break;

            case OP.HEARTBEAT_ACK:
                // 心跳确认
                break;

            case OP.DISPATCH:
                // 事件分发
                this.handleDispatch(t, d);
                if (t === 'READY') {
                    this.sessionId = d.session_id;
                    this.isReady = true;
                    console.log(`[Gateway] ✅ Bot已就绪 (session: ${this.sessionId})`);
                    if (onReady) onReady();
                    if (this._onReady) this._onReady();
                }
                break;

            case OP.RECONNECT:
                console.log('[Gateway] 收到重连请求');
                this.ws.close();
                break;

            case OP.INVALID_SESSION:
                console.log('[Gateway] Session无效，重新鉴权');
                this.identify();
                break;
        }
    }

    /**
     * 鉴权
     */
    async identify() {
        const token = await this.qqBot.getAccessToken();
        const identifyPayload = {
            op: OP.IDENTIFY,
            d: {
                token: `QQBot ${token}`,
                intents: (1 << 25),  // C2C_MESSAGE_CREATE = 1 << 25
                shard: [0, 1],
            },
        };
        this.ws.send(JSON.stringify(identifyPayload));
        console.log('[Gateway] 已发送鉴权 (intents: C2C_MESSAGE_CREATE)');
    }

    /**
     * 处理事件分发
     */
    handleDispatch(eventType, data) {
        switch (eventType) {
            case 'C2C_MESSAGE_CREATE':
                // 用户给机器人发了私信
                console.log(`[Gateway] 📩 收到单聊消息:`);
                console.log(`  用户OpenId: ${data.author.user_openid}`);
                console.log(`  消息内容: ${data.content || '(空)'}`);
                console.log(`  消息ID: ${data.id}`);

                this.userOpenId = data.author.user_openid;
                this.lastMsgId = data.id;

                // 回复确认消息
                this.qqBot.sendUserMessage(
                    this.userOpenId,
                    '✅ 已绑定！课程聊天室的新消息将转发到这里。',
                    data.id
                ).catch(err => console.error('[Gateway] 回复确认消息失败:', err.message));

                // 触发回调
                if (this._onUserOpenId) {
                    this._onUserOpenId(this.userOpenId);
                }
                break;

            case 'READY':
                // 已在上面处理
                break;

            default:
                console.log(`[Gateway] 收到事件: ${eventType}`);
                break;
        }
    }

    /**
     * 开始心跳
     */
    startHeartbeat(interval) {
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    op: OP.HEARTBEAT,
                    d: this.lastSeq,
                }));
            }
        }, interval);
    }

    /**
     * 清理资源
     */
    cleanup() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        this.isReady = false;
    }

    /**
     * 设置获取到openid的回调
     */
    onUserOpenId(callback) {
        this._onUserOpenId = callback;
    }

    /**
     * 设置就绪回调
     */
    onReady(callback) {
        this._onReady = callback;
    }

    /**
     * 断开连接
     */
    disconnect() {
        this.cleanup();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

module.exports = QQBotGateway;
