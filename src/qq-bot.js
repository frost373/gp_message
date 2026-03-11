/**
 * QQ机器人客户端
 * 使用QQ开放平台官方API发送消息
 */
const axios = require('axios');

class QQBot {
    constructor(config) {
        this.config = config;
        this.accessToken = null;
        this.tokenExpiresAt = 0;
    }

    /**
     * 获取 Access Token
     */
    async getAccessToken() {
        // 如果token还有效（提前60秒刷新）
        if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
            return this.accessToken;
        }

        console.log('[QQBot] 正在获取 Access Token...');

        try {
            const resp = await axios.post(this.config.authUrl, {
                appId: this.config.appId,
                clientSecret: this.config.appSecret,
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000,
            });

            if (resp.data && resp.data.access_token) {
                this.accessToken = resp.data.access_token;
                const expiresIn = resp.data.expires_in || 7200;
                this.tokenExpiresAt = Date.now() + expiresIn * 1000;
                console.log(`[QQBot] ✅ Access Token 获取成功 (有效期: ${expiresIn}秒)`);
                return this.accessToken;
            }

            throw new Error(`获取Token失败: ${JSON.stringify(resp.data)}`);
        } catch (err) {
            console.error('[QQBot] ❌ 获取 Access Token 失败:', err.message);
            throw err;
        }
    }

    /**
     * 获取API基础URL
     */
    getApiBase() {
        return this.config.useSandbox ? this.config.sandboxApiBase : this.config.apiBase;
    }

    /**
     * 获取认证头
     */
    async getAuthHeaders() {
        const token = await this.getAccessToken();
        return {
            'Authorization': `QQBot ${token}`,
            'Content-Type': 'application/json',
        };
    }

    /**
     * 生成消息序列号 (递增)
     */
    getMsgSeq() {
        // _seqCounter is initialized in constructor, but this check ensures robustness
        if (!this._seqCounter) this._seqCounter = 1;
        return this._seqCounter++;
    }

    /**
     * 发送群消息
     * @param {string} groupOpenId - 群的openid
     * @param {string} content - 消息内容
     * @param {string} [msgId] - 被动消息时的消息ID
     */
    async sendGroupMessage(groupOpenId, content, msgId) {
        const headers = await this.getAuthHeaders();
        const url = `${this.getApiBase()}/v2/groups/${groupOpenId}/messages`;

        const body = {
            content: content,
            msg_type: 0, // 0=文本消息
        };

        // 如果有msgId则作为被动消息回复，并生成递增的msg_seq
        if (msgId) {
            body.msg_id = msgId;
            body.msg_seq = this.getMsgSeq();
        }

        try {
            const resp = await axios.post(url, body, { headers, timeout: 10000 });
            console.log(`[QQBot] ✅ 群消息发送成功`);
            return resp.data;
        } catch (err) {
            const errData = err.response ? err.response.data : err.message;
            console.error(`[QQBot] ❌ 群消息发送失败:`, JSON.stringify(errData));
            throw err;
        }
    }

    /**
     * 发送单聊消息
     * @param {string} userOpenId - 用户openid
     * @param {string} content - 消息内容
     * @param {string} [msgId] - 被动消息时的消息ID
     */
    async sendUserMessage(userOpenId, content, msgId) {
        const headers = await this.getAuthHeaders();
        const url = `${this.getApiBase()}/v2/users/${userOpenId}/messages`;

        const body = {
            content: content,
            msg_type: 0,
        };

        // 如果有msgId则作为被动消息回复，并生成递增的msg_seq
        if (msgId) {
            body.msg_id = msgId;
            body.msg_seq = this.getMsgSeq();
        }

        try {
            const resp = await axios.post(url, body, { headers, timeout: 10000 });
            console.log(`[QQBot] ✅ 单聊消息发送成功`);
            return resp.data;
        } catch (err) {
            const errData = err.response ? err.response.data : err.message;
            console.error(`[QQBot] ❌ 单聊消息发送失败:`, JSON.stringify(errData));
            throw err;
        }
    }

    /**
     * 上传富媒体文件(图片)
     * @param {string} userOpenId - 用户openid
     * @param {string} imageUrl - 网络图片URL
     * @returns {Promise<string>} file_info
     */
    async uploadUserMedia(userOpenId, imageUrl) {
        const headers = await this.getAuthHeaders();
        const url = `${this.getApiBase()}/v2/users/${userOpenId}/files`;

        const body = {
            file_type: 1, // 1=图片
            url: imageUrl,
            srv_send_msg: false
        };

        try {
            const resp = await axios.post(url, body, { headers, timeout: 20000 });
            return resp.data.file_info;
        } catch (err) {
            const errData = err.response ? err.response.data : err.message;
            console.error(`[QQBot] ❌ 上传图片媒体失败:`, JSON.stringify(errData));
            throw err;
        }
    }

    /**
     * 发送单聊图片消息
     * @param {string} userOpenId - 用户openid
     * @param {string} imageUrl - 图片链接
     * @param {string} [content] - 伴随的文本内容
     * @param {string} [msgId] - 被动消息时的消息ID
     */
    async sendUserImageMessage(userOpenId, imageUrl, content, msgId) {
        try {
            // 1. 先上传图片获取 file_info
            const fileInfo = await this.uploadUserMedia(userOpenId, imageUrl);

            // 2. 发送富媒体消息
            const headers = await this.getAuthHeaders();
            const url = `${this.getApiBase()}/v2/users/${userOpenId}/messages`;

            const body = {
                msg_type: 7, // 富媒体消息
                media: { file_info: fileInfo }
            };

            if (content) {
                body.content = content;
            }

            if (msgId) {
                body.msg_id = msgId;
                body.msg_seq = this.getMsgSeq();
            }

            const resp = await axios.post(url, body, { headers, timeout: 10000 });
            console.log(`[QQBot] ✅ 单聊图片发送成功`);
            return resp.data;
        } catch (err) {
            const errData = err.response ? err.response.data : err.message;
            console.error(`[QQBot] ❌ 单聊图片发送失败:`, JSON.stringify(errData));
            throw err;
        }
    }

    /**
     * 发送频道消息
     * @param {string} channelId - 子频道ID
     * @param {string} content - 消息内容
     * @param {string} [msgId] - 被动消息时的消息ID
     */
    async sendChannelMessage(channelId, content, msgId) {
        const headers = await this.getAuthHeaders();
        const url = `${this.getApiBase()}/channels/${channelId}/messages`;

        const body = {
            content: content,
        };

        // 如果有msgId则作为被动消息回复，并生成递增的msg_seq
        if (msgId) {
            body.msg_id = msgId;
            body.msg_seq = this.getMsgSeq();
        }

        try {
            const resp = await axios.post(url, body, { headers, timeout: 10000 });
            console.log(`[QQBot] ✅ 频道消息发送成功`);
            return resp.data;
        } catch (err) {
            const errData = err.response ? err.response.data : err.message;
            console.error(`[QQBot] ❌ 频道消息发送失败:`, JSON.stringify(errData));
            throw err;
        }
    }

    /**
     * 智能发送消息（根据配置自动选择发送目标）
     * @param {Object|string} messageData - 如果是字符串则为普通文本；如果是对象 { content, imageUrl } 则是图文
     */
    async sendMessage(messageData) {
        let content = messageData;
        let imageUrl = null;

        if (typeof messageData === 'object') {
            content = messageData.content;
            imageUrl = messageData.imageUrl;
        }

        if (this.config.userOpenId) {
            if (imageUrl) {
                return this.sendUserImageMessage(this.config.userOpenId, imageUrl, content);
            }
            return this.sendUserMessage(this.config.userOpenId, content);
        }
        if (this.config.groupOpenId) {
            // 目前群图片未实现，回退图文拼接
            const text = imageUrl ? (content ? `${content}\n[图片]: ${imageUrl}` : `[图片]: ${imageUrl}`) : content;
            return this.sendGroupMessage(this.config.groupOpenId, text);
        }
        if (this.config.channelId) {
            const text = imageUrl ? (content ? `${content}\n[图片]: ${imageUrl}` : `[图片]: ${imageUrl}`) : content;
            return this.sendChannelMessage(this.config.channelId, text);
        }
        console.warn('[QQBot] ⚠️ 未配置发送目标（groupOpenId/channelId/userOpenId）');
        console.log(`[QQBot] 📝 消息内容: ${content}`);
    }
}

module.exports = QQBot;
