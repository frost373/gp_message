/**
 * 新版APP平台客户端
 * 负责HTTP登录/刷新Token，以及通过WebSocket接收群消息。
 */
const EventEmitter = require('events');
const axios = require('axios');
const WebSocket = require('ws');

class PlatformClient extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.accessToken = null;
        this.refreshTokenValue = null;
        this.accessTokenExpiresAt = 0;
        this.refreshTokenExpiresAt = 0;
        this.devId = config.devId || Math.floor(10000 + Math.random() * 90000);

        this.ws = null;
        this.connectPromise = null;
        this.connectResolve = null;
        this.connectReject = null;
        this.connectTimeout = null;
        this.heartbeatTimer = null;
        this.reconnectTimer = null;
        this.manuallyClosed = false;
        this.authenticated = false;

        this.client = axios.create({
            baseURL: config.baseUrl,
            timeout: 15000,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    /**
     * 登录新版APP平台。
     */
    async login() {
        const loginData = {
            terminal: this.config.terminal ?? 0,
            userName: this.config.userName || this.config.username,
            password: this.config.password,
        };

        console.log(`[Platform] 正在登录新版APP... (用户: ${loginData.userName})`);

        try {
            const resp = await this.client.post('/login', loginData);
            if (resp.data && resp.data.code === 200 && resp.data.data && resp.data.data.accessToken) {
                this.setTokenData(resp.data.data);
                console.log(`[Platform] 登录成功 (accessToken有效期: ${resp.data.data.accessTokenExpiresIn || 0}秒)`);
                return resp.data.data;
            }
            throw new Error(`登录返回异常: ${JSON.stringify(resp.data).substring(0, 300)}`);
        } catch (err) {
            if (err.response) {
                const errMsg = err.response.data ? JSON.stringify(err.response.data).substring(0, 300) : '';
                throw new Error(`登录失败 (HTTP ${err.response.status}): ${errMsg}`);
            }
            throw err;
        }
    }

    setTokenData(data) {
        this.accessToken = data.accessToken;
        this.refreshTokenValue = data.refreshToken;

        const now = Date.now();
        const accessExpiresIn = Number(data.accessTokenExpiresIn || 1800);
        const refreshExpiresIn = Number(data.refreshTokenExpiresIn || 604800);
        this.accessTokenExpiresAt = now + accessExpiresIn * 1000;
        this.refreshTokenExpiresAt = now + refreshExpiresIn * 1000;
    }

    /**
     * 确保accessToken可用。新版接口返回HTTP 200 + code=401时，也会走强制刷新。
     */
    async ensureAccessToken(forceRefresh = false) {
        const refreshBufferMs = Number(this.config.refreshBufferSeconds || 60) * 1000;

        if (!this.accessToken) {
            await this.login();
            return this.accessToken;
        }

        if (!forceRefresh && Date.now() < this.accessTokenExpiresAt - refreshBufferMs) {
            return this.accessToken;
        }

        if (this.refreshTokenValue && Date.now() < this.refreshTokenExpiresAt - refreshBufferMs) {
            try {
                await this.refreshTokens();
                return this.accessToken;
            } catch (err) {
                console.warn(`[Platform] 刷新Token失败，改为重新登录: ${err.message}`);
            }
        }

        await this.login();
        return this.accessToken;
    }

    /**
     * 使用refreshToken刷新认证信息。
     */
    async refreshTokens() {
        if (!this.accessToken || !this.refreshTokenValue) {
            throw new Error('缺少accessToken或refreshToken，无法刷新');
        }

        const resp = await this.client.put('/refreshToken', null, {
            headers: {
                accessToken: this.accessToken,
                refreshToken: this.refreshTokenValue,
            },
        });

        if (resp.data && resp.data.code === 200 && resp.data.data && resp.data.data.accessToken) {
            this.setTokenData(resp.data.data);
            console.log('[Platform] Token刷新成功');
            return resp.data.data;
        }

        throw new Error(`刷新Token返回异常: ${JSON.stringify(resp.data).substring(0, 300)}`);
    }

    getAuthHeaders() {
        if (!this.accessToken) throw new Error('未登录，请先调用 login()');
        return { accessToken: this.accessToken };
    }

    getWebSocketUrl() {
        const configured = this.config.wsUrl || this.config.websocketUrl;
        if (configured) return configured.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');

        const base = this.config.baseUrl || '';
        return base.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:').replace(/:\d+$/, ':8878') + '/im';
    }

    getWebSocketHeaders() {
        return {
            Origin: 'app://.',
            'User-Agent': this.config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) yipianhong/1.0.5 Chrome/100.0.4896.143 Electron/18.2.0 Safari/537.36',
            'Accept-Language': 'zh-CN',
        };
    }

    /**
     * 连接新版APP WebSocket，并完成cmd=0鉴权。
     */
    async connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.authenticated) {
            return;
        }
        if (this.connectPromise) {
            return this.connectPromise;
        }

        this.manuallyClosed = false;
        await this.ensureAccessToken();

        const wsUrl = this.getWebSocketUrl();
        console.log(`[Platform] 正在连接WebSocket: ${wsUrl}`);

        this.connectPromise = new Promise((resolve, reject) => {
            this.connectResolve = resolve;
            this.connectReject = reject;

            this.connectTimeout = setTimeout(() => {
                this.rejectConnect(new Error('平台WebSocket认证超时'));
                this.closeSocket();
            }, Number(this.config.connectTimeoutMs || 30000));

            this.ws = new WebSocket(wsUrl, { headers: this.getWebSocketHeaders() });

            this.ws.on('open', () => {
                console.log('[Platform] WebSocket已连接，正在发送鉴权...');
                this.sendAuth().catch((err) => this.rejectConnect(err));
            });

            this.ws.on('message', (data) => this.handleWebSocketMessage(data));

            this.ws.on('close', (code, reason) => {
                const wasAuthenticated = this.authenticated;
                console.log(`[Platform] WebSocket已断开: ${code} ${reason}`);
                this.cleanupConnection();
                this.connectPromise = null;

                if (!wasAuthenticated) {
                    this.rejectConnect(new Error(`平台WebSocket连接关闭: ${code}`));
                }

                if (!this.manuallyClosed) {
                    this.scheduleReconnect();
                }
            });

            this.ws.on('error', (err) => {
                console.error('[Platform] WebSocket错误:', err.message);
                if (!this.authenticated) {
                    this.rejectConnect(err);
                }
            });
        });

        return this.connectPromise;
    }

    async sendAuth() {
        await this.ensureAccessToken();
        this.sendWs({
            cmd: 0,
            data: {
                accessToken: this.accessToken,
                devId: this.devId,
            },
        });
    }

    handleWebSocketMessage(raw) {
        let payload;
        try {
            payload = JSON.parse(raw.toString());
        } catch (err) {
            console.warn(`[Platform] 收到无法解析的WebSocket消息: ${raw.toString().substring(0, 200)}`);
            return;
        }

        switch (payload.cmd) {
            case 0:
                this.handleAuthAck(payload);
                break;
            case 1:
                break;
            case 4:
                this.handleIncomingMessage(payload.data);
                break;
            default:
                if (this.config.logWsMessages) {
                    console.log(`[Platform] WebSocket消息: ${JSON.stringify(payload).substring(0, 300)}`);
                }
                break;
        }
    }

    handleAuthAck(payload) {
        if (payload.data === null || payload.data === undefined) {
            this.authenticated = true;
            console.log('[Platform] WebSocket鉴权成功');
            this.startHeartbeat();
            this.resolveConnect();
            this.emit('ready');
            return;
        }

        if (this.isTokenInvalid(payload.data)) {
            console.log('[Platform] WebSocket鉴权Token失效，正在刷新后重试...');
            this.ensureAccessToken(true)
                .then(() => this.sendAuth())
                .catch((err) => this.rejectConnect(err));
            return;
        }

        this.rejectConnect(new Error(`WebSocket鉴权失败: ${JSON.stringify(payload.data).substring(0, 300)}`));
    }

    handleIncomingMessage(message) {
        if (!message || typeof message !== 'object') return;

        const groupId = this.config.groupId || this.config.roomId;
        if (groupId && Number(message.groupId) !== Number(groupId)) {
            if (this.config.logIgnoredMessages) {
                console.log(`[Platform] 忽略非目标群消息: groupId=${message.groupId}`);
            }
            return;
        }

        this.emit('message', message);
    }

    isTokenInvalid(data) {
        if (!data || typeof data !== 'object') return false;
        const message = String(data.message || data.msg || '');
        return data.code === 401 || message.includes('token') || message.includes('Token');
    }

    startHeartbeat() {
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

        const interval = Number(this.config.heartbeatIntervalMs || 21000);
        const sendHeartbeat = () => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.sendWs({ cmd: 1, data: {} });
            }
        };

        sendHeartbeat();
        this.heartbeatTimer = setInterval(sendHeartbeat, interval);
    }

    sendWs(payload) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('平台WebSocket未连接');
        }
        this.ws.send(JSON.stringify(payload));
    }

    resolveConnect() {
        if (this.connectTimeout) {
            clearTimeout(this.connectTimeout);
            this.connectTimeout = null;
        }
        if (this.connectResolve) {
            this.connectResolve();
            this.connectResolve = null;
            this.connectReject = null;
        }
    }

    rejectConnect(err) {
        if (this.connectTimeout) {
            clearTimeout(this.connectTimeout);
            this.connectTimeout = null;
        }
        if (this.connectReject) {
            this.connectReject(err);
            this.connectResolve = null;
            this.connectReject = null;
        }
        this.connectPromise = null;
    }

    cleanupConnection() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        this.authenticated = false;
    }

    scheduleReconnect() {
        if (this.reconnectTimer) return;
        const delay = Number(this.config.reconnectDelayMs || 5000);
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect().catch((err) => {
                console.error(`[Platform] WebSocket重连失败: ${err.message}`);
                if (!this.manuallyClosed) this.scheduleReconnect();
            });
        }, delay);
    }

    closeSocket() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    disconnect() {
        this.manuallyClosed = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.cleanupConnection();
        this.closeSocket();
    }

    /**
     * 新版已读接口。服务端可能HTTP 200但body code=401，因此需要检查业务code。
     */
    async markGroupRead(groupId) {
        const targetGroupId = groupId || this.config.groupId || this.config.roomId;
        if (!targetGroupId) return false;

        const request = async () => {
            await this.ensureAccessToken();
            return this.client.put('/message/group/readed', null, {
                params: { groupId: targetGroupId },
                headers: this.getAuthHeaders(),
            });
        };

        let resp = await request();
        if (resp.data && resp.data.code === 401) {
            await this.ensureAccessToken(true);
            resp = await request();
        }

        if (resp.data && resp.data.code === 200) {
            return true;
        }

        console.warn(`[Platform] 标记已读返回异常: ${JSON.stringify(resp.data).substring(0, 300)}`);
        return false;
    }

    /**
     * 兼容旧调用。新版消息由WebSocket推送，不再通过HTTP拉取历史消息。
     */
    async fetchMessages() {
        console.warn('[Platform] 新版APP使用WebSocket推送消息，fetchMessages不再可用');
        return [];
    }

    async fetchMessageCount() {
        return 0;
    }
}

module.exports = PlatformClient;
