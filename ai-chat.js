/**
 * AI聊天功能实现
 * 包含界面控制、消息管理和API调用逻辑
 */

class AIChatWidget {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        
        // 等待配置加载后初始化
        this.waitForConfigAndInit();
    }
    
    async waitForConfigAndInit() {
        // 等待配置文件加载
        let attempts = 0;
        while (!window.AI_CHAT_CONFIG && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.AI_CHAT_CONFIG) {
            this.config = window.AI_CHAT_CONFIG;
            this.functionUrl = this.config.functionUrl || '/.netlify/functions/chat';
            this.model = this.config.model;
            this.systemPrompt = this.config.systemPrompt;
            this.maxMessages = this.config.maxMessages || 6;
            this.isRequestPending = false; // 添加请求防重标记
            
            // 初始化搜索配置
            this.searchConfig = this.config.searchSettings || {};
            this.searchEnabled = this.searchConfig.enabled || false;
        } else {
            // 使用默认配置
            this.functionUrl = '/.netlify/functions/chat';
            this.model = 'Qwen/Qwen3-8B';
            this.systemPrompt = '你是一个专业的健康管理AI助手。';
            this.maxMessages = 10;
            this.searchEnabled = false;
        }
        
        this.init();
    }
    
    init() {
        this.createHTML();
        this.bindEvents();
        this.showWelcomeMessage();
    }
    
    createHTML() {
        // 创建悬浮按钮
        const floatBtn = document.createElement('button');
        floatBtn.className = 'ai-chat-float-btn';
        floatBtn.innerHTML = ''; // 使用背景图片显示头像
        floatBtn.title = 'AI健康助手';
        
        // 创建聊天窗口
        const chatContainer = document.createElement('div');
        chatContainer.className = 'ai-chat-container';
        const headerTitle = this.config?.ui?.title || 'AI健康助手';
        const inputPlaceholder = this.config?.ui?.placeholder || '请输入您的问题...';
                    
        chatContainer.innerHTML = `
            <div class="ai-chat-header">
                <h3>${headerTitle}</h3>
                <button class="ai-chat-close" title="关闭">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="ai-chat-messages" id="chatMessages">
                <!-- 消息将在这里显示 -->
            </div>
            <div class="ai-chat-input">
                <textarea 
                    class="chat-input-field" 
                    id="chatInput" 
                    placeholder="${inputPlaceholder}" 
                    rows="1"
                ></textarea>
                <button class="chat-send-btn" id="chatSendBtn" title="发送">
                    <i class="fas fa-arrow-up"></i>
                </button>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(floatBtn);
        
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'ai-chat-overlay';
        document.body.appendChild(overlay);
        
        document.body.appendChild(chatContainer);
        
        // 保存引用
        this.floatBtn = floatBtn;
        this.overlay = overlay;
        this.chatContainer = chatContainer;
        this.messagesContainer = document.getElementById('chatMessages');
        this.inputField = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('chatSendBtn');
        this.closeBtn = chatContainer.querySelector('.ai-chat-close');
    }
    
    bindEvents() {
        // 悬浮按钮点击事件
        this.floatBtn.addEventListener('click', () => {
            this.toggleChat();
        });
        
        // 关闭按钮点击事件
        this.closeBtn.addEventListener('click', () => {
            this.closeChat();
        });
        
        // 发送按钮点击事件
        this.sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // 输入框回车发送
        this.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // 输入框自动调整高度
        this.inputField.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
        
        // 点击外部关闭聊天窗口
        this.overlay.addEventListener('click', () => {
            this.closeChat();
        });
        
        document.addEventListener('click', (e) => {
            if (this.isOpen && 
                !this.chatContainer.contains(e.target) && 
                !this.floatBtn.contains(e.target)) {
                this.closeChat();
            }
        });
    }
    
    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }
    
    openChat() {
        this.isOpen = true;
        
        // 禁止页面滚动
        document.body.style.overflow = 'hidden';
        
        // 先显示遮罩层
        this.overlay.classList.add('show');
        
        // 稍微延迟显示聊天窗口，确保动画流畅
        requestAnimationFrame(() => {
            this.chatContainer.classList.add('show');
        });
        
        this.floatBtn.classList.remove('pulse');
        
        // 等待动画完成后聚焦输入框
        setTimeout(() => {
            this.inputField.focus();
            this.scrollToBottom();
        }, 300);
    }
    
    closeChat() {
        this.isOpen = false;
        
        // 隐藏聊天窗口
        this.chatContainer.classList.remove('show');
        
        // 等待窗口动画完成后隐藏遮罩层
        setTimeout(() => {
            this.overlay.classList.remove('show');
            // 恢复页面滚动
            document.body.style.overflow = '';
        }, 300);
    }
    
    showWelcomeMessage() {
        const welcomeText = this.config?.ui?.welcomeMessage || 
            '您好！我是AI健康助手，我可以帮助您解答关于健康管理、产品功能、技术支持等各种问题。请随时向我提问！';
        
        const welcomeMsg = {
            role: 'assistant', // 修正为assistant
            content: welcomeText
        };
        
        this.addMessage(welcomeMsg);
    }
    
    async sendMessage() {
        const message = this.inputField.value.trim();
        if (!message) return;
        if (this.isRequestPending) {
            this.showError('请等待上一个问题回答完成...');
            return;
        }
        this.isRequestPending = true;

        const userMsg = { role: 'user', content: message };
        this.addMessage(userMsg);
        this.messages.push(userMsg);
        this.inputField.value = '';
        this.autoResizeTextarea();

        // 按钮视觉反馈
        const originalSendHtml = this.sendBtn.innerHTML;
        this.sendBtn.disabled = true;
        this.sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; // 发送中

        // 显示打字指示器
        this.showTypingIndicator();

        try {
            this.validateAndCleanMessages();

            // 演示模式：本地模拟流式输出，不调用后端
            const demoMode = this.performanceSettings?.demoMode === true || (this.config?.performanceSettings?.demoMode === true);
            const sseDemo = this.performanceSettings?.enableSSEDemo === true || (this.config?.performanceSettings?.enableSSEDemo === true);

            if (demoMode) {
                await this.runLocalDemoSSE(message, sseDemo);
            } else {
                // 正常路径：可选搜索
                let searchResults = '';
                if (this.searchEnabled && this.shouldSearch(message)) {
                    try {
                        this.showSearchingIndicator();
                        searchResults = await this.performWebSearch(message);
                        this.hideSearchingIndicator();
                    } catch (searchError) {
                        console.warn('搜索失败:', searchError);
                        this.hideSearchingIndicator();
                    }
                }
                // 线上真实流式模式
                const enableSSEOnline = this.performanceSettings?.enableSSEOnline === true || (this.config?.performanceSettings?.enableSSEOnline === true);
                if (enableSSEOnline) {
                    await this.runOnlineSSEStream(message, searchResults);
                } else {
                    const response = await this.callAIAPI(message, searchResults);
                    const aiMsg = { role: 'assistant', content: this.formatContent(response) };
                    this.addMessage(aiMsg);
                    this.messages.push(aiMsg);
                }
            }

            this.hideTypingIndicator();
        } catch (error) {
            console.error('AI API调用失败:', error);
            this.hideTypingIndicator();
            let errorMsg;
            if (error.message.includes('网络') || error.message.includes('Network')) {
                errorMsg = this.config?.ui?.errorMessages?.networkError || '网络连接失败，请检查网络后重试';
            } else if (error.message.includes('API')) {
                errorMsg = this.config?.ui?.errorMessages?.apiError || 'AI服务暂时无法响应，请稍后再试';
            } else {
                errorMsg = this.config?.ui?.errorMessages?.unknownError || '出现了未知错误，请重新尝试';
            }
            this.showError(errorMsg);
        } finally {
            // 恢复按钮状态
            this.sendBtn.disabled = false;
            this.sendBtn.innerHTML = originalSendHtml;
            this.isRequestPending = false;
        }
    }

    // 本地演示：模拟SSE流式输出/重试视觉
    async runLocalDemoSSE(userMessage, enableStream = true) {
        // 模拟重试视觉：第一次“失败”，触发重试中状态
        const showRetry = userMessage.includes('重试') || userMessage.toLowerCase().includes('retry');
        if (showRetry) {
            this.sendBtn.innerHTML = '<i class="fas fa-rotate"></i>'; // 重试中图标
            await new Promise(r => setTimeout(r, 600));
            this.sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; // 再次发送
        }

        const demoText = `这是本地演示回复：\n- 发送按钮会在发送/重试时展示不同图标\n- ${enableStream ? '当前以流式方式逐字输出' : '当前以整段方式输出'}\n- 真正的线上环境会由后端携带API Key调用AI`;

        if (!enableStream) {
            const aiMsg = { role: 'assistant', content: this.formatContent(demoText) };
            this.addMessage(aiMsg);
            this.messages.push(aiMsg);
            return;
        }

        // 流式逐字输出
        const container = document.createElement('div');
        container.className = 'chat-message ai';
        const avatar = document.createElement('div');
        avatar.className = 'chat-avatar ai';
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble ai';
        container.appendChild(avatar);
        container.appendChild(bubble);
        this.messagesContainer.appendChild(container);
        this.scrollToBottom();

        const tokens = demoText.split('');
        let acc = '';
        for (let i = 0; i < tokens.length; i++) {
            acc += tokens[i];
            bubble.textContent = acc;
            this.scrollToBottom();
            await new Promise(r => setTimeout(r, 15));
        }

        // 保存消息
        this.messages.push({ role: 'assistant', content: acc });
    }
    
    // 调用 AI 的函数 - 安全版本（性能优化版）
    async callAIAPI(userMessage, searchResults = '') {
        // 网络离线直接给出友好提示
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            throw new Error('当前网络不可用，请检查网络连接后重试');
        }

        // 组合系统提示
        let enhancedSystemPrompt = this.systemPrompt;
        const currentTime = this.getCurrentTime();
        if (searchResults) {
            enhancedSystemPrompt += `\n\n最新网络信息：\n${searchResults}\n\n请基于上述最新信息和你的知识库综合回答用户问题。\n\n重要提醒：${currentTime}，请确保时间信息的准确性。`;
        } else {
            enhancedSystemPrompt += `\n\n重要提醒：${currentTime}，请确保时间信息的准确性。`;
        }

        // 构建消息历史（裁剪到最近N条）
        const messageHistory = [
            { role: 'system', content: enhancedSystemPrompt },
            ...this.messages.slice(-this.maxMessages).map(msg => ({
                role: msg.role === 'ai' ? 'assistant' : msg.role,
                content: msg.content
            })),
            { role: 'user', content: userMessage }
        ];

        // 超时与重试设置
        const timeoutMs = 15000; // 15s 超时
        const maxRetries = 2;    // 最多重试 2 次
        const baseDelay = 600;   // 初始退避 600ms

        const doRequest = async (attempt) => {
            // 超时控制
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const response = await fetch(this.functionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        messages: messageHistory,
                        model: this.model
                    }),
                    signal: controller.signal,
                    // 避免某些浏览器缓存 POST
                    cache: 'no-store'
                });

                clearTimeout(timer);

                if (!response.ok) {
                    const errorText = await response.text().catch(() => '');
                    throw new Error(`AI服务请求失败: ${response.status} ${response.statusText}${errorText ? `\n详细信息: ${errorText}` : ''}`);
                }

                // 尝试解析 JSON
                const data = await response.json();

                // 结构校验
                if (data && Array.isArray(data.choices) && data.choices[0] && data.choices[0].message) {
                    return data.choices[0].message.content;
                }

                // 兼容部分返回结构
                if (data && data.message && typeof data.message.content === 'string') {
                    return data.message.content;
                }

                throw new Error('AI响应格式不正确');
            } catch (err) {
                clearTimeout(timer);

                const isAbort = err?.name === 'AbortError';
                const isTimeout = /超时|timeout|AbortError/i.test(err?.message || '');
                const isNetwork = /Failed to fetch|NetworkError|网络|fetch/i.test(err?.message || '');

                // 可重试的错误
                if ((isAbort || isTimeout || isNetwork) && attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt); // 指数退避
                    await new Promise(r => setTimeout(r, delay));
                    return doRequest(attempt + 1);
                }

                // 其他错误或超过重试次数
                throw new Error(`调用AI失败: ${err.message}`);
            }
        };

        return doRequest(0);
    }
    
    // 优化内容格式，去除多余的空格和换行
    formatContent(content) {
        return content
            .replace(/\n{3,}/g, '\n\n') // 将多个连续换行替换为最多两个
            .replace(/[ \t]{2,}/g, ' ') // 将多个连续空格替换为一个
            .replace(/^\s+|\s+$/g, '') // 去除开头和结尾的空白字符
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // 简单的加粗处理
            .replace(/\n/g, '<br>'); // 换行处理
    }
    
    addMessage(message) {
        const messageDiv = document.createElement('div');
        // 将role为'assistant'的消息显示为'ai'样式
        const displayRole = message.role === 'assistant' ? 'ai' : message.role;
        messageDiv.className = `chat-message ${displayRole}`;
        
        const avatar = document.createElement('div');
        avatar.className = `chat-avatar ${displayRole}`;
        avatar.innerHTML = displayRole === 'user' ? 
            '<i class="fas fa-user"></i>' : 
            ''; // AI头像使用背景图片，不需要图标
        
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${displayRole}`;
        
        // 如果内容包含HTML标签，使用innerHTML，否则使用textContent
        if (message.content.includes('<br>') || message.content.includes('<strong>')) {
            bubble.innerHTML = message.content;
        } else {
            bubble.textContent = message.content;
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message ai';
        typingDiv.innerHTML = `
            <div class="chat-avatar ai">
            </div>
            <div class="typing-indicator show">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        this.messagesContainer.appendChild(typingDiv);
        this.typingIndicator = typingDiv;
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.remove();
            this.typingIndicator = null;
        }
    }
    
    showError(errorMessage) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = errorMessage;
        
        this.messagesContainer.appendChild(errorDiv);
        this.scrollToBottom();
        
        // 3秒后自动移除错误消息
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
    
    autoResizeTextarea() {
        const textarea = this.inputField;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 80) + 'px';
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }
    
    // 添加脉冲效果到悬浮按钮
    addPulseEffect() {
        this.floatBtn.classList.add('pulse');
    }
    
    // 移除脉冲效果
    removePulseEffect() {
        this.floatBtn.classList.remove('pulse');
    }
    
    // 清空聊天记录
    clearMessages() {
        this.messages = [];
        this.messagesContainer.innerHTML = '';
        this.showWelcomeMessage();
    }
    
    // 初始化时清理历史消息，确保格式正确
    validateAndCleanMessages() {
        this.messages = this.messages.filter(msg => {
            return msg.role && ['user', 'assistant', 'system'].includes(msg.role) && msg.content;
        }).map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: msg.content
        }));
    }
    
    // 判断是否需要进行网络搜索
    shouldSearch(message) {
        if (!this.searchConfig || !this.searchConfig.autoSearch) {
            return false;
        }
        
        const searchKeywords = this.searchConfig.searchKeywords || ['最新', '今天', '现在', '当前', '新闻', '近期', '实时'];
        return searchKeywords.some(keyword => message.includes(keyword));
    }
    
    // 执行网络搜索（仅支持百度搜索）
    async performWebSearch(query) {
        const maxResults = this.searchConfig.maxResults || 5;
        
        try {
            return await this.searchWithBaidu(query, maxResults);
        } catch (error) {
            console.warn('百度搜索失败:', error);
            throw new Error(`搜索服务暂时不可用: ${error.message}`);
        }
    }
    
    // 格式化搜索结果
    formatSearchResults(results, provider) {
        if (!results || results.length === 0) {
            return '未找到相关的最新信息。';
        }
        
        let formattedResults = '最新网络搜索结果：\n\n';
        
        results.slice(0, this.searchConfig.maxResults || 5).forEach((result, index) => {
            let title, snippet, link;
            
            if (provider === 'serper') {
                title = result.title || '无标题';
                snippet = result.snippet || '无描述';
                link = result.link || '';
            } else if (provider === 'bing') {
                title = result.name || '无标题';
                snippet = result.snippet || '无描述';
                link = result.url || '';
            } else {
                // 通用格式处理（适用于百度、360、搜狗等）
                title = result.title || '无标题';
                snippet = result.snippet || '无描述';
                link = result.link || '';
            }
            
            formattedResults += `${index + 1}. ${title}
${snippet}
来源: ${link}

`;
        });
        
        return formattedResults;
    }
    
    // 使用百度搜索
    async searchWithBaidu(query, maxResults) {
        try {
            // 使用百度搜索的公开API（无需密钥）
            const searchUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(query)}&rn=${maxResults}`;
            
            // 由于跨域限制，这里使用模拟搜索结果
            // 实际部署时可以通过后端代理实现
            const mockResults = [
                {
                    title: `关于"${query}"的最新信息`,
                    snippet: `正在为您搜索"${query}"的最新内容和相关信息。百度为您提供最全面、最及时的搜索结果。`,
                    link: searchUrl
                },
                {
                    title: `${query} - 相关资讯`,
                    snippet: `包含"${query}"的最新新闻、资讯和热点话题，帮助您了解最新动态。`,
                    link: `https://www.baidu.com/s?wd=${encodeURIComponent(query + ' 最新')}`
                }
            ];
            
            return this.formatSearchResults(mockResults, 'baidu');
        } catch (error) {
            throw new Error(`百度搜索失败: ${error.message}`);
        }
    }
    
    // 获取当前本地时间（优化版本）
    getCurrentTime() {
        // 直接使用本地时间，避免网络请求
        const now = new Date();
        return `当前时间是${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 显示搜索指示器
    showSearchingIndicator() {
        const searchDiv = document.createElement('div');
        searchDiv.className = 'chat-message ai searching';
        searchDiv.innerHTML = `
            <div class="chat-avatar ai"></div>
            <div class="chat-bubble ai">
                <i class="fas fa-search"></i> 正在搜索最新信息...
            </div>
        `;
        
        this.messagesContainer.appendChild(searchDiv);
        this.searchingIndicator = searchDiv;
        this.scrollToBottom();
    }
    
    // 隐藏搜索指示器
    hideSearchingIndicator() {
        if (this.searchingIndicator) {
            this.searchingIndicator.remove();
            this.searchingIndicator = null;
        }
    }

    // 线上真实流式：通过 Netlify Function (?stream=1) 读取并逐步渲染
    async runOnlineSSEStream(userMessage, searchResults = '') {
        // 构建系统提示，与 callAIAPI 一致
        let enhancedSystemPrompt = this.systemPrompt;
        const currentTime = this.getCurrentTime();
        if (searchResults) {
            enhancedSystemPrompt += `\n\n最新网络信息：\n${searchResults}\n\n请基于上述最新信息和你的知识库综合回答用户问题。\n\n重要提醒：${currentTime}，请确保时间信息的准确性。`;
        } else {
            enhancedSystemPrompt += `\n\n重要提醒：${currentTime}，请确保时间信息的准确性。`;
        }

        const messageHistory = [
            { role: 'system', content: enhancedSystemPrompt },
            ...this.messages.slice(-this.maxMessages).map(msg => ({
                role: msg.role === 'ai' ? 'assistant' : msg.role,
                content: msg.content
            })),
            { role: 'user', content: userMessage }
        ];

        // 准备 UI 容器（与本地流式保持一致的显示）
        const container = document.createElement('div');
        container.className = 'chat-message ai';
        const avatar = document.createElement('div');
        avatar.className = 'chat-avatar ai';
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble ai';
        container.appendChild(avatar);
        container.appendChild(bubble);
        this.messagesContainer.appendChild(container);
        this.scrollToBottom();

        let accumulated = '';
        const appendText = (text) => {
            if (!text) return;
            accumulated += text;
            bubble.textContent = accumulated;
            this.scrollToBottom();
        };

        // 发起流式请求
        const resp = await fetch(`${this.functionUrl}?stream=1`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: messageHistory, model: this.model }),
            cache: 'no-store'
        });

        if (!resp.ok) {
            const errText = await resp.text().catch(() => '');
            throw new Error(`AI服务请求失败: ${resp.status} ${resp.statusText}${errText ? `\n详细信息: ${errText}` : ''}`);
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                // 按 SSE 帧分割：以 \n\n 为帧结束
                const frames = buffer.split('\n\n');
                buffer = frames.pop() || '';
                for (const frame of frames) {
                    const lines = frame.split('\n');
                    for (const lineRaw of lines) {
                        const line = lineRaw.trim();
                        if (!line.startsWith('data:')) continue;
                        const payload = line.replace(/^data:\s*/, '');
                        if (!payload || payload === '[DONE]') continue;
                        try {
                            const json = JSON.parse(payload);
                            const delta = json.choices?.[0]?.delta?.content
                                ?? json.choices?.[0]?.message?.content
                                ?? json.delta?.content
                                ?? '';
                            appendText(delta);
                        } catch (e) {
                            // 不是 JSON 的数据行，忽略
                        }
                    }
                }
            }
        } finally {
            try { reader.releaseLock(); } catch {}
        }

        // 将最终内容保存到消息记录
        if (accumulated) {
            this.messages.push({ role: 'assistant', content: accumulated });
        } else {
            // 如果没有任何内容（异常情况），提示错误
            throw new Error('AI流式响应为空');
        }
    }
}

// 初始化AI聊天组件
let aiChatWidget = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保所有样式和配置都已加载
    setTimeout(() => {
        aiChatWidget = new AIChatWidget();
        
        // 可选：添加脉冲效果提醒用户
        setTimeout(() => {
            if (aiChatWidget) {
                aiChatWidget.addPulseEffect();
            }
        }, 2000);
        
        console.log('AI聊天组件已初始化');
    }, 500);
});

// 导出全局函数供其他脚本使用
window.AIChatWidget = AIChatWidget;
window.getAIChatWidget = function() {
    return aiChatWidget;
};