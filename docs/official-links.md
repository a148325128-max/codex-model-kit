# 官方链接与准确说法

核对日期：2026-06-23。

## OpenAI Codex

Codex 配置参考：

https://developers.openai.com/codex/config-reference

重点展示这些关键词：

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

准确说法：

```text
Codex 官方配置支持自定义 model provider。
这个项目把第三方 API 地址、环境变量名和模型配置档写进 Codex 本地配置。
```

## MiniMax

MiniMax Codex 配置说明：

https://platform.minimax.io/docs/token-plan/codex

录屏建议：

```text
MiniMax 最适合先演示，因为它有官方 Codex 配置说明。
```

## DeepSeek

DeepSeek API 文档：

https://api-docs.deepseek.com/

DeepSeek base URL：

```text
https://api.deepseek.com
```

注意：

```text
DeepSeek OpenAI-compatible 接口通常先看 chat/completions。
Codex 自定义 provider 是否能直接跑，要用 doctor/exec 实测 Responses。
```

## 智谱 GLM

智谱 Coding Plan / 其他工具配置：

https://docs.bigmodel.cn/cn/coding-plan/tool/others

准确拼写：

```text
GLM，不是 GML。
```

当前脚本默认：

```text
base_url = "https://open.bigmodel.cn/api/coding/paas/v4"
model = "glm-5.2"
```

## 小米 MiMo

MiMo 首次 API 调用：

https://mimo.mi.com/docs/en-US/quick-start/summary/first-api-call

MiMo OpenAI API 兼容说明：

https://mimo.mi.com/docs/en-US/api/chat/openai-api

注意：

```text
MiMo 官方文档主要展示 chat/completions。
Codex 需要 Responses 兼容，所以要实测。
```

## 火山方舟豆包

火山方舟 OpenAI 兼容调用：

https://www.volcengine.com/docs/82379/1330626

火山方舟 Responses API：

https://www.volcengine.com/docs/82379/1523520

当前脚本默认：

```text
base_url = "https://ark.cn-beijing.volces.com/api/v3"
model = "doubao-seed-1-6-250615"
```

注意：

```text
火山方舟模型名可能跟地域、接入点、开通服务有关。
如果报模型不存在，请把 ~/.codex/ark.config.toml 里的 model 改成控制台实际值。
```

## 阿里百炼

百炼 DashScope OpenAI 兼容模式：

https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope

当前脚本默认：

```text
base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"
model = "qwen-plus"
```

注意：

```text
百炼 OpenAI 兼容模式主要是 chat/completions。
Codex 自定义 provider 直接运行时，仍然要验证 Responses 兼容性。
```
