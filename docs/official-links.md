# 官方链接

核对日期：2026-06-23。

## OpenAI Codex

Codex 配置参考：

https://developers.openai.com/codex/config-reference

相关配置项：

```text
model_provider
model_providers
base_url
env_key
wire_api
responses
```

Codex 高级配置：

https://developers.openai.com/codex/config-advanced

Codex 模型页：

https://developers.openai.com/codex/models

Codex 价格与额度说明：

https://developers.openai.com/codex/pricing

https://help.openai.com/en/articles/20001106-codex-rate-card

## 内置 provider 参考

MiniMax Codex 配置说明：

https://platform.minimax.io/docs/token-plan/codex

DeepSeek API 文档：

https://api-docs.deepseek.com/

智谱 Coding Plan / 其他工具配置：

https://docs.bigmodel.cn/cn/coding-plan/tool/others

小米 MiMo 首次 API 调用：

https://mimo.mi.com/docs/en-US/quick-start/summary/first-api-call

小米 MiMo OpenAI API 兼容说明：

https://mimo.mi.com/docs/en-US/api/chat/openai-api

火山方舟 OpenAI 兼容调用：

https://www.volcengine.com/docs/82379/1330626

火山方舟 Responses API：

https://www.volcengine.com/docs/82379/1523520

阿里百炼 DashScope OpenAI 兼容模式：

https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope

## 兼容性说明

OpenAI-compatible 并不必然等于可直接作为 Codex 自定义 provider 使用。

Codex 自定义 provider 需要兼容 Responses 协议。如果某个第三方平台或中转站只兼容 `chat/completions`，可能需要使用支持 Responses 的网关，或增加协议转换层。
