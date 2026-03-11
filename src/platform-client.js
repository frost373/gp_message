/**
 * 课程平台客户端
 * 负责登录和拉取聊天室消息
 */
const axios = require('axios');

class PlatformClient {
    constructor(config) {
        this.config = config;
        this.token = null;
        this.client = axios.create({
            baseURL: config.baseUrl,
            timeout: 15000,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    /**
     * 登录课程平台
     */
    async login() {
        const loginData = {
            username: this.config.username,
            password: this.config.password,
            type: this.config.loginType || 2,
            userType: this.config.userType || 1,
        };

        console.log(`[Platform] 正在登录课程平台... (用户: ${this.config.username})`);

        try {
            const resp = await this.client.post('/login', loginData);
            if (resp.data && (resp.data.code === 200 || resp.data.token)) {
                this.token = resp.data.token;
                console.log(`[Platform] ✅ 登录成功`);
                return this.token;
            }
            throw new Error(`登录返回异常: ${JSON.stringify(resp.data).substring(0, 200)}`);
        } catch (err) {
            if (err.response) {
                const errMsg = err.response.data ? JSON.stringify(err.response.data).substring(0, 200) : '';
                throw new Error(`登录失败 (HTTP ${err.response.status}): ${errMsg}`);
            }
            throw err;
        }
    }

    /**
     * 获取认证头
     */
    getAuthHeaders() {
        if (!this.token) throw new Error('未登录，请先调用 login()');
        return { Authorization: `Bearer ${this.token}` };
    }

    /**
     * 拉取房间消息列表
     */
    async fetchMessages(roomId) {
        roomId = roomId || this.config.roomId;
        try {
            const resp = await this.client.get(`/system/room/list/msg`, {
                params: { roomId },
                headers: this.getAuthHeaders(),
            });

            if (resp.data && resp.data.code === 200) {
                // 根据测试脚本的输出结构，可能在data或data的子属性中
                let messages = resp.data.data;
                if (!Array.isArray(messages) && messages && typeof messages === 'object') {
                    messages = messages.records || messages.list || messages.rows || [];
                }
                // 如果发现消息需要反转以确保按时间顺序，可以在这里处理，但根据之前的脚本暂且直接返回
                return messages || [];
            }

            // 如果token过期，尝试重新登录
            if (resp.data && resp.data.code === 401) {
                console.log('[Platform] Token已过期，正在重新登录...');
                await this.login();
                return this.fetchMessages(roomId);
            }

            console.warn(`[Platform] 拉取消息返回异常: ${JSON.stringify(resp.data).substring(0, 300)}`);
            return [];
        } catch (err) {
            if (err.response && err.response.status === 401) {
                console.log('[Platform] Token已过期，正在重新登录...');
                await this.login();
                return this.fetchMessages(roomId);
            }
            throw err;
        }
    }

    /**
     * 获取消息数量（待办计数）
     */
    async fetchMessageCount(roomId) {
        roomId = roomId || this.config.roomId;
        try {
            const resp = await this.client.get(`/system/room/todo/count/user/${roomId}`, {
                headers: this.getAuthHeaders(),
            });
            if (resp.data && resp.data.code === 200) {
                return resp.data.data || 0;
            }
            return 0;
        } catch (err) {
            console.error('[Platform] 获取消息数量失败:', err.message);
            return 0;
        }
    }
}

module.exports = PlatformClient;
