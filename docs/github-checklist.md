# GitHub 发布前清单

## 仓库名

推荐：

```text
codex-model-kit
```

中文解释：

```text
Codex 多模型配置工具包
```

这个名字比 `codex-multi-provider-setup` 短，也不会和 `deepseek-token-monitor` 桌面端应用混在一起。

## 上传前验证

```bash
npm test
npm run setup:dry-run
node scripts/setup-codex-models.js --help
node scripts/setup-codex-models.js --list
```

## 本地初始化

如果这是一个新目录：

```bash
git init -b main
git status --short
```

确认没有真实 Key 后再提交。

## README 要突出

```text
默认保留 GPT-5.5。
一键增加 MiniMax、DeepSeek、智谱 GLM、MiMo、火山方舟豆包、阿里百炼 Qwen。
Key 走本机隐藏输入或 macOS 弹窗。
Key 不发聊天、不进配置、不进 GitHub。
配置可用 Codex 智能体完成；第三方推理按各平台 API 额度计费。
```

## 不要提交

- `.env`
- 真实 API Key
- `~/.codex/auth.json`
- 带真实 Key 的截图
- 平台后台余额截图
- 本地日志、缓存、打包产物

## GitHub About

```text
中文 Codex 多模型配置工具包：默认保留 GPT-5.5，一键增加 MiniMax、DeepSeek、智谱 GLM、MiMo、豆包和百炼模型配置档。
```

## Topics

```text
codex
openai-codex
deepseek
minimax
zhipu
glm
mimo
doubao
qwen
dashscope
volcengine
ai-tools
byok
openai-compatible
responses-api
```

## 推荐 commit 信息

```text
Initial codex-model-kit
```

## 抖音置顶评论

```text
仓库：codex-model-kit

核心命令：
npm run setup:dry-run
npm run setup:gui
codex doctor -p minimax
codex -p minimax

注意：
Spark 是 Codex 使用额度，不是第三方模型免费额度；
第三方模型推理按各平台 API Key 额度计费；
真实 Key 不要发聊天，也不要提交 GitHub。
```
