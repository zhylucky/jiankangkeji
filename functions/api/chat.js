// ═══════════════════════════════════════════════
// Pages Function: /api/chat 同域 AI 代理
// 作用：前端同域请求 /api/chat → 本函数转发到 SiliconFlow
//      彻底绕开 workers.dev 跨境不稳定的问题（与页面同一网络路径）
// 依赖：Pages 项目环境变量 SILICONFLOW_API_KEY（wrangler pages secret put）
// ═══════════════════════════════════════════════

const KNOWLEDGE_BASE = `
# 产品知识库

## 产品一：个人精英健康Pro+测评系统

### 产品概述
- 产品名称：个人精英健康Pro+测评系统
- 组成：APP（个人健康Pro+）、PC端（个人健康精英）、后台管理系统
- 后台地址：http://management.lifetide.cn/login
- App下载中心：https://jkkeji.netlify.app/html/qrcode.html

### 五大测评项目

#### 1. 睡眠测评
- 设备：血氧戒指（可选）
- 开始前：发射器需充满电，手机连接充电器
- 操作：点击"开始睡眠测评"按钮
- 时长：≥8小时自动结束，或手动提前结束
- 报告条件：有效数据≥1小时 + 必须填写"睡眠自评"
- 注意：主机与手机距离需在3米内，超过30分钟自动结束

#### 2. 情绪测评
- 设备：心电/呼吸传感器
- 环境：需在安静隔音环境，需联网
- 时长：10分钟自动结束
- 报告条件：必须完整执行10分钟
- 禁止手动结束，否则无报告

#### 3. 体能测评
- 设备：心电/呼吸传感器
- 方案设置：默认静息1分钟、运动3分钟（可自定义）
- 阶段：静息→运动→半程恢复→全程恢复
- 静息阶段：保持安静，禁说话、玩手机
- 运动阶段：按语音提示运动，不适立即停止

#### 4. 健康测评
- 设备：血压计、血糖仪、血氧戒指、体温计（均可选）
- 时长：10分钟自动结束
- 报告条件：必须完整执行10分钟
- 禁止手动结束，否则无报告

#### 5. 导航测评
- 设备：心电/呼吸传感器 + 耳机（推荐）
- 环境：安静环境，仰卧姿势
- 时长：30分钟
- 报告条件：必须填写"导航自评"问卷

### 设备管理

#### 设备充电
- 睡眠测评前：必须充满电
- 其他测评：电量不低于30%
- 充电指示：红色=充电中，绿色=已充满

#### 设备绑定（App端）
- 主设备：我的→添加设备→扫描设备二维码
- 配套设备：我的→添加配套设备→列表中点击绑定

#### 常见问题
- 没有生成报告：睡眠≥1小时+填写自评；情绪/健康需完整10分钟；导航需填问卷
- 设备连接不上：检查电量→确认蓝牙开启→取出确保Logo灯亮→放回再取出重启→忽略设备重新绑定
- 胸贴总是掉：酒精棉清洁→干燥后粘贴→男性剔除胸毛→确保两片电极紧密贴合

## 产品二：睡眠呼吸监测仪

### 产品概述
- 产品名称：睡眠呼吸监测仪（五人系统）
- 用途：多用户睡眠呼吸障碍筛查与评估
- 支持最多5名用户并行使用
- 架构：端-边-云协同架构

### 系统组成
- 传感发射器：集成心电、呼吸、体位传感器
- 移动终端App：设备连接、数据上传及查看报告
- PC端软件（BBS-LTSP）：医生/健康管理师专用工具
- 后台管理系统

### PC端功能
- 用户注册四步流程：手机验证→基本信息→身体状况→信息完善
- 实时监测：查看实时心电、呼吸、体位波形
- 历史查询：支持按姓名、手机号、设备号、日期检索
- 报告生成：基于自评问卷+AI自动分析生成"双百分睡眠报告"

### 使用流程
1. 初始设置：管理员创建机构→添加设备→创建管理师→用户下载App并绑定
2. 日常使用：用户选择测评→完成测评→查看报告→管理师查看数据
3. 数据管理：异常数据手动上传→管理师定期分析
`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

// ═══ 图片消息处理：识图理解 / OCR ═══
async function handleImage(env, body) {
  const { image, imageMode, messages } = body;
  const mode = imageMode === 'ocr' ? 'ocr' : 'understand';
  const apiKey = env.SILICONFLOW_API_KEY;
  const imageModel = env.IMAGE_MODEL || 'Qwen/Qwen3.5-4B';
  const ocrModel = env.OCR_MODEL || 'deepseek-ai/DeepSeek-OCR';

  const lastText = (messages && messages.length > 0) ? messages[messages.length - 1].content : '';
  const prompt = mode === 'ocr'
    ? (typeof lastText === 'string' && lastText ? lastText : 'OCR this image. 提取图片中的全部文字，用 Markdown 输出。')
    : (typeof lastText === 'string' && lastText ? lastText : '请描述这张图片的内容。');

  const imageRequestBody = {
    model: mode === 'ocr' ? ocrModel : imageModel,
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: image } },
        { type: 'text', text: prompt }
      ]
    }],
    stream: false,
    max_tokens: mode === 'ocr' ? 1200 : 2000,
    temperature: mode === 'ocr' ? 0.1 : 0.7,
    top_p: 0.8
  };

  // Qwen3.5 系列默认开启思考模式，思考耗尽 max_tokens 会让 content 为空
  // 识图必须关闭思考以保证直接输出结果
  if (imageRequestBody.model.includes('Qwen')) {
    imageRequestBody.enable_search = false;
    imageRequestBody.enable_thinking = false;
  }

  const resp = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(imageRequestBody)
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`识图请求失败：${resp.status} - ${errText.slice(0, 200)}`);
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;
  return {
    choices: [{ message: { content: content || '图片识别返回为空，请重试（可能是 SiliconFlow 免费档偶发问题，或图片过大/格式不支持）' } }],
    type: mode === 'ocr' ? 'ocr_response' : 'image_response'
  };
}

// ═══ 主处理 ═══
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { messages, model, image, imageMode, injectKnowledge, stream, temperature, max_tokens } = body;

    const apiKey = env.SILICONFLOW_API_KEY;
    if (!apiKey) return json({ error: 'API密钥未配置' }, 500);

    // ── 图片消息 ──
    if (image) {
      const result = await handleImage(env, body);
      return json(result);
    }

    // ── 文本对话 ──
    if (!messages || !Array.isArray(messages)) {
      return json({ error: 'messages 参数无效或缺失' }, 400);
    }

    // 知识库注入
    if (injectKnowledge === true && messages.length > 0) {
      const systemMsgIndex = messages.findIndex(m => m.role === 'system');
      if (systemMsgIndex !== -1) {
        messages[systemMsgIndex].content += `\n\n--- 产品知识库 ---\n${KNOWLEDGE_BASE}`;
      } else {
        messages.unshift({
          role: 'system',
          content: `你是"个人健康精英Pro+"的AI健康助手。\n\n--- 产品知识库 ---\n${KNOWLEDGE_BASE}`
        });
      }
    }

    const isStream = stream === true;
    const requestBody = {
      model: model || env.DEFAULT_MODEL || 'Qwen/Qwen3-8B',
      messages,
      stream: isStream,
      max_tokens: max_tokens || 800,
      temperature: (typeof temperature === 'number') ? temperature : 0.5,
      top_p: 0.8,
      presence_penalty: 0.2,
      frequency_penalty: 0.3
    };

    if (requestBody.model.includes('Qwen')) {
      requestBody.enable_search = false;
      // 思考模式由前端配置控制（thinkingMode）；未传时默认 false，兼容旧前端
      // 避免平台默认开启思考导致 content 为空（旧前端无法解析 reasoning_content）
      requestBody.enable_thinking = typeof body.enable_thinking === 'boolean' ? body.enable_thinking : false;
    }

    // ── 流式：透传 SSE ──
    if (isStream) {
      const resp = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      if (!resp.ok) {
        const errText = await resp.text();
        return json({ error: `SiliconFlow API 请求失败：${resp.status} - ${errText.slice(0, 200)}` }, resp.status);
      }
      return new Response(resp.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Accel-Buffering': 'no'
        }
      });
    }

    // ── 非流式 ──
    const maxRetries = 2;
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const resp = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });
        const responseText = await resp.text();
        if (!resp.ok) {
          if (resp.status === 504 || resp.status === 503) {
            throw new Error(`SiliconFlow API 暂时不可用：${resp.status}`);
          }
          throw new Error(`SiliconFlow API 请求失败：${resp.status} - ${responseText.slice(0, 200)}`);
        }
        return json(JSON.parse(responseText));
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        }
      }
    }
    return json({ error: 'AI 服务响应超时，请稍后重试', details: lastError?.message }, 504);
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
