/**
 * 消息转发器核心逻辑
 * 监听新版APP WebSocket消息 → 转发到QQ
 */

class Forwarder {
    constructor(platformClient, qqBot, config) {
        this.platformClient = platformClient;
        this.qqBot = qqBot;
        this.config = config;
        // 已转发的消息ID集合
        this.forwardedMessageIds = new Set();
        // 消息队列，避免并发发送导致顺序错乱
        this.queue = [];
        this.processingQueue = false;
        this.messageHandler = null;
        // 统计
        this.stats = {
            totalForwarded: 0,
            totalErrors: 0,
            startTime: null,
        };
    }

    /**
     * 启动转发器
     */
    async start() {
        console.log('='.repeat(50));
        console.log('  消息转发器启动');
        console.log(`  目标群ID: ${this.config.platform.groupId || this.config.platform.roomId}`);
        console.log(`  消息来源: 新版APP WebSocket`);
        console.log('='.repeat(50));

        // 1. 登录课程平台
        await this.platformClient.login();

        // 2. 获取QQ机器人Token（验证凭证有效性）
        try {
            await this.qqBot.getAccessToken();
        } catch (err) {
            console.warn('[Forwarder] ⚠️ QQ机器人Token获取失败，消息将仅输出到控制台');
        }

        // 3. 订阅平台WebSocket消息
        if (this.messageHandler) {
            this.platformClient.off('message', this.messageHandler);
        }
        this.messageHandler = (msg) => this.enqueueMessage(msg);
        this.platformClient.on('message', this.messageHandler);

        // 4. 连接平台WebSocket
        await this.platformClient.connect();

        this.stats.startTime = new Date();

        console.log('[Forwarder] ✅ 转发器已启动，正在监听新消息...');
        console.log('[Forwarder] 按 Ctrl+C 停止');
    }

    /**
     * 停止转发器
     */
    stop() {
        if (this.messageHandler) {
            this.platformClient.off('message', this.messageHandler);
            this.messageHandler = null;
        }
        if (this.platformClient && typeof this.platformClient.disconnect === 'function') {
            this.platformClient.disconnect();
        }
        console.log('[Forwarder] 转发器已停止');
        this.printStats();
    }

    /**
     * 将收到的WebSocket消息加入队列。
     */
    enqueueMessage(message) {
        this.queue.push(message);
        this.processQueue().catch((err) => {
            this.stats.totalErrors++;
            console.error(`[Forwarder] ❌ 处理消息队列失败: ${err.message}`);
        });
    }

    /**
     * 串行处理消息队列。
     */
    async processQueue() {
        if (this.processingQueue) return;
        this.processingQueue = true;

        try {
            while (this.queue.length > 0) {
                const msg = this.queue.shift();
                await this.processMessage(msg);
            }
        } finally {
            this.processingQueue = false;
        }
    }

    /**
     * 处理单条新版APP消息。
     */
    async processMessage(msg) {
        if (Number(msg.type) === 12) return;

        const msgId = this.extractMessageId(msg);
        if (msgId && this.forwardedMessageIds.has(msgId)) return;
        if (msgId) this.forwardedMessageIds.add(msgId);

        const formatted = this.formatMessage(msg);
        if (!formatted) {
            await this.markRead(msg);
            return;
        }

        console.log(`[Forwarder] 📬 收到新消息: ${JSON.stringify(formatted).substring(0, 100)}...`);

        try {
            await this.qqBot.sendMessage(formatted);
            this.stats.totalForwarded++;
            console.log(`[Forwarder] ✅ 已转发: ${JSON.stringify(formatted).substring(0, 80)}...`);
            await this.markRead(msg);
        } catch (err) {
            this.stats.totalErrors++;
            console.error(`[Forwarder] ❌ 转发失败: ${err.message}`);
        }

        // 避免消息发送过快
        await this.sleep(1000);
    }

    async markRead(msg) {
        if (this.platformClient && typeof this.platformClient.markGroupRead === 'function') {
            try {
                await this.platformClient.markGroupRead(msg.groupId);
            } catch (err) {
                console.warn(`[Forwarder] 标记已读失败: ${err.message}`);
            }
        }
    }

    /**
   * 提取消息的唯一ID
   */
    extractMessageId(msg) {
        // 真实的API返回字段是 messageId
        return msg.messageId || msg.id || msg.tmpId || msg.msgId || msg.chatId || msg.createTime || msg.sendTime || JSON.stringify(msg);
    }

    /**
     * 格式化消息为发送文本
     */
    formatMessage(msg) {
        // 新版APP type=12 是回执/已读状态，不是聊天内容。
        if (Number(msg.type) === 12) {
            return null;
        }

        let sender = msg.sendNickName || msg.username || msg.nickName || msg.senderName || msg.sender || msg.fromUser || '未知用户';
        let content = msg.content || msg.message || msg.text || msg.msg || '';
        let time = this.formatTime(msg.timestamp || msg.createTime || msg.sendTime || msg.time || '');

        if (!content && typeof msg === 'string') {
            content = msg;
        }

        const imageUrl = this.extractImageUrl(msg);

        if (!content && !imageUrl && msg.type !== 'image') {
            // 如果无法提取内容，打印原始消息帮助调试
            console.log(`[Forwarder] 🔍 无法提取消息内容:`, JSON.stringify(msg).substring(0, 200));
            return null;
        }

        // 构造转发消息文本部分
        let formatted = '';
        if (time) {
            formatted += `[${time}] `;
        }
        if (sender) {
            formatted += `${sender}: `;
        }

        // 处理图片消息
        if (Number(msg.type) === 1 || msg.type === 'image' || imageUrl) {
            content = this.normalizeImageText(content);
            if (content && content !== '我发图片') {
                formatted += `${content}\n`;
            } else {
                formatted += '[图片]';
            }
            return {
                content: formatted.trim(),
                imageUrl
            };
        }

        formatted += `${content}`;
        return formatted.trim();
    }

    extractImageUrl(msg) {
        if (msg.imageUrl) return msg.imageUrl;
        if (Number(msg.type) !== 1 || !msg.content) return null;

        try {
            const parsed = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
            return parsed.originUrl || parsed.thumbUrl || parsed.url || null;
        } catch (err) {
            return null;
        }
    }

    normalizeImageText(content) {
        if (!content) return '';
        if (typeof content !== 'string') return '';

        try {
            const parsed = JSON.parse(content);
            if (parsed && typeof parsed === 'object' && (parsed.originUrl || parsed.thumbUrl || parsed.url)) {
                return '';
            }
        } catch (err) {
            // 普通文本不是JSON时保持原样
        }

        return content;
    }

    formatTime(value) {
        if (!value) return '';
        const raw = String(value);

        if (/^\d{10,13}$/.test(raw)) {
            try {
                const timestamp = raw.length === 10 ? Number(raw) * 1000 : Number(raw);
                const date = new Date(timestamp);
                const zpad = (n) => n.toString().padStart(2, '0');
                return `${zpad(date.getHours())}:${zpad(date.getMinutes())}:${zpad(date.getSeconds())}`;
            } catch (err) {
                return raw;
            }
        }

        return raw;
    }

    /**
     * 打印统计信息
     */
    printStats() {
        const runtime = this.stats.startTime
            ? Math.round((Date.now() - this.stats.startTime.getTime()) / 1000)
            : 0;
        console.log('\n--- 转发器统计 ---');
        console.log(`运行时长: ${runtime}秒`);
        console.log(`总转发消息: ${this.stats.totalForwarded}`);
        console.log(`总错误次数: ${this.stats.totalErrors}`);
        console.log('-'.repeat(20));
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = Forwarder;
