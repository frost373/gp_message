/**
 * 消息转发器核心逻辑
 * 定时轮询课程平台消息 → 转发到QQ
 */

class Forwarder {
    constructor(platformClient, qqBot, config) {
        this.platformClient = platformClient;
        this.qqBot = qqBot;
        this.config = config;
        // 已转发的消息ID集合
        this.forwardedMessageIds = new Set();
        // 轮询定时器
        this.timer = null;
        // 是否首次拉取（用于控制是否转发已有消息）
        this.isFirstPoll = true;
        // 统计
        this.stats = {
            totalPolls: 0,
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
        console.log(`  房间ID: ${this.config.platform.roomId}`);
        console.log(`  轮询间隔: ${this.config.polling.interval}ms`);
        console.log('='.repeat(50));

        // 1. 登录课程平台
        await this.platformClient.login();

        // 2. 获取QQ机器人Token（验证凭证有效性）
        try {
            await this.qqBot.getAccessToken();
        } catch (err) {
            console.warn('[Forwarder] ⚠️ QQ机器人Token获取失败，消息将仅输出到控制台');
        }

        // 3. 首次拉取消息（建立基线）
        await this.poll();

        // 4. 启动定时轮询
        this.stats.startTime = new Date();
        this.timer = setInterval(() => this.poll(), this.config.polling.interval);

        console.log('[Forwarder] ✅ 转发器已启动，正在监听新消息...');
        console.log('[Forwarder] 按 Ctrl+C 停止');
    }

    /**
     * 停止转发器
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        console.log('[Forwarder] 转发器已停止');
        this.printStats();
    }

    /**
     * 执行一次轮询
     */
    async poll() {
        this.stats.totalPolls++;
        try {
            const messages = await this.platformClient.fetchMessages();

            if (!messages || !Array.isArray(messages)) {
                console.log(`[Forwarder] 返回的消息格式异常:`, typeof messages, messages ? JSON.stringify(messages).substring(0, 200) : 'null');
                // 如果是对象不是数组，尝试提取有用的字段
                if (messages && typeof messages === 'object' && !Array.isArray(messages)) {
                    // 尝试寻找可能的消息数组
                    const possibleKeys = ['list', 'records', 'rows', 'data', 'messages', 'content'];
                    for (const key of possibleKeys) {
                        if (messages[key] && Array.isArray(messages[key])) {
                            console.log(`[Forwarder] 在字段 '${key}' 中找到消息数组`);
                            return this.processMessages(messages[key]);
                        }
                    }
                    // 如果有chatMsgList之类的字段
                    for (const key of Object.keys(messages)) {
                        if (Array.isArray(messages[key])) {
                            console.log(`[Forwarder] 在字段 '${key}' 中找到数组 (${messages[key].length} 条)`);
                            return this.processMessages(messages[key]);
                        }
                    }
                }
                return;
            }

            await this.processMessages(messages);
        } catch (err) {
            this.stats.totalErrors++;
            console.error(`[Forwarder] ❌ 轮询失败: ${err.message}`);
        }
    }

    /**
     * 处理消息列表
     */
    async processMessages(messages) {
        if (this.isFirstPoll) {
            this.isFirstPoll = false;
            if (!this.config.polling.forwardExisting) {
                // 首次运行，记录所有已有消息ID，不转发
                for (const msg of messages) {
                    const msgId = this.extractMessageId(msg);
                    if (msgId) this.forwardedMessageIds.add(msgId);
                }
                console.log(`[Forwarder] 📋 已记录 ${this.forwardedMessageIds.size} 条已有消息，后续只转发新消息`);
                return;
            }
        }

        // 找出新消息
        const newMessages = [];
        for (const msg of messages) {
            const msgId = this.extractMessageId(msg);
            if (msgId && !this.forwardedMessageIds.has(msgId)) {
                newMessages.push(msg);
                this.forwardedMessageIds.add(msgId);
            }
        }

        if (newMessages.length === 0) return;

        console.log(`[Forwarder] 📬 发现 ${newMessages.length} 条新消息`);

        // API返回的消息数组头部是最新的，反转新消息数组，按时间从小到大（先发送老消息，再发送新消息）顺序转发
        newMessages.reverse();

        // 逐条转发
        for (const msg of newMessages) {
            const formatted = this.formatMessage(msg);
            if (formatted) {
                try {
                    if (typeof formatted === 'object') {
                        // 支持图文原生推送
                        await this.qqBot.sendMessage(formatted);
                    } else {
                        await this.qqBot.sendMessage(formatted);
                    }
                    this.stats.totalForwarded++;
                    console.log(`[Forwarder] ✅ 已转发: ${JSON.stringify(formatted).substring(0, 80)}...`);
                } catch (err) {
                    this.stats.totalErrors++;
                    console.error(`[Forwarder] ❌ 转发失败: ${err.message}`);
                }
                // 避免消息发送过快
                await this.sleep(1000);
            }
        }
    }

    /**
   * 提取消息的唯一ID
   */
    extractMessageId(msg) {
        // 真实的API返回字段是 messageId
        return msg.messageId || msg.id || msg.msgId || msg.chatId || msg.createTime || JSON.stringify(msg);
    }

    /**
     * 格式化消息为发送文本
     */
    formatMessage(msg) {
        let sender = msg.username || msg.nickName || msg.senderName || msg.sender || msg.fromUser || '未知用户';
        let content = msg.content || msg.message || msg.text || msg.msg || '';
        let time = msg.timestamp || msg.createTime || msg.sendTime || msg.time || '';

        // 如果是时间戳，尝试格式化
        if (time && time.length >= 10 && !isNaN(time)) {
            try {
                const date = new Date(time.length === 10 ? parseInt(time) * 1000 : parseInt(time));
                const zpad = (n) => n.toString().padStart(2, '0');
                time = `${zpad(date.getHours())}:${zpad(date.getMinutes())}:${zpad(date.getSeconds())}`;
            } catch (e) {
                // 忽略解析错误
            }
        }

        if (!content && typeof msg === 'string') {
            content = msg;
        }

        if (!content && !msg.imageUrl && msg.type !== 'image') {
            // 如果无法提取内容，打印原始消息帮助调试
            console.log(`[Forwarder] 🔍 无法提取消息内容:`, JSON.stringify(msg).substring(0, 200));
            return null;
        }

        // 构造转发消息文本部分
        let formatted = '';
        if (time) {
            formatted += `[${time}] `;
        }

        // 处理图片消息
        if (msg.type === 'image' || msg.imageUrl) {
            if (content && content !== '我发图片') {
                formatted += `${content}\n`;
            }
            return {
                content: formatted.trim(),
                imageUrl: msg.imageUrl
            };
        }

        formatted += `${content}`;
        return formatted.trim();
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
        console.log(`总轮询次数: ${this.stats.totalPolls}`);
        console.log(`总转发消息: ${this.stats.totalForwarded}`);
        console.log(`总错误次数: ${this.stats.totalErrors}`);
        console.log('-'.repeat(20));
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = Forwarder;
