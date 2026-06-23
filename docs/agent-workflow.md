# Agent-assisted workflow

本页用于 Codex、Claude Code 或其他本地代码智能体执行配置。目标是让智能体拉取仓库、读取模型版本、运行脚本，并把 API Key 写入本机环境变量。

## 推荐提示词

```text
请帮我从 GitHub 拉取并运行 codex-model-kit，按照官方 Codex 配置方式为 Codex 配置第三方模型。

仓库地址：
https://github.com/a148325128-max/codex-model-kit

要求：
1. 不要把 API Key 写入仓库文件、README、截图或 Git 提交。
2. 只把 Key 写入本机用户环境变量。
3. 生成或更新 providers.local.json 时只写平台名称、baseUrl、envKey、model、models、contextWindow。
4. Codex TOML 里只使用官方配置字段：model_provider、model、[model_providers.<name>]、name、base_url、env_key、wire_api。
5. 如果要尝试 Codex Desktop 底部模型下拉，只能用于一个统一中转站 provider；多个独立平台请使用 profile/config 配置档切换。
6. 配置完成后运行测试或 dry-run，并提示我重启 Codex Desktop。

我会提供模型版本和 API Key。请按模型版本写入对应 provider 的 model 字段。
```

## 模型版本示例

```text
DeepSeek: DeepSeekV4
MiMo: MiMo-V2.5
智谱 GLM: GLM-V5.2
MiniMax: MiniMax-M3
火山方舟豆包: Doubgo-Seed-2.1-pro
```

模型名必须以平台控制台实际可调用的 ID 为准。如果平台控制台给出的 ID 与示例不同，请以控制台为准。

## Key 输入方式

推荐方式仍是系统弹窗：

```bash
npm run setup:gui
```

如果录屏演示需要直接把 Key 发给本地智能体，请只使用临时 Key，并在演示结束后立即删除或轮换。智能体应当只把 Key 写入本机环境变量，不得写入仓库文件。
