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
model_catalog_json
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

## Profile 与默认 provider

官方高级配置说明里，`Profiles` 用于通过 CLI 的 `--profile` 切换配置层。

如果要让当前默认模型指向第三方 provider，需要在用户级 `~/.codex/config.toml` 中设置：

```toml
model_provider = "your-provider"
model = "your-model"
```

并定义对应的：

```toml
[model_providers.your-provider]
base_url = "https://example.com/v1"
env_key = "YOUR_API_KEY"
wire_api = "responses"
```

## 模型目录与桌面端下拉

`model_catalog_json` 是 Codex 启动时读取的模型目录路径。该文件不是普通的“模型名列表”，而是 Codex 需要的完整模型目录结构，至少要包含模型基础指令等字段。

本工具只在显式传入 `--write-model-catalog` 时写入 `model_catalog_json`，并且会从本机 Codex 已缓存的 `models_cache.json` 复制完整模型字段作为模板。不要手写简化 JSON，例如只写：

```json
{
  "models": [
    {
      "slug": "DeepSeekV4",
      "display_name": "DeepSeek"
    }
  ]
}
```

这种文件缺少 Codex 需要的字段，可能导致 Codex Desktop 无法加载 `config.toml`。

官方配置只定义一个当前 `model_provider`。因此，底部模型下拉更适合“同一个 provider 或统一中转站下的多个模型”；多个独立平台请使用不同配置档/Profile，或者统一接入一个中转站。
