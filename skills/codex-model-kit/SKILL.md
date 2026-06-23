---
name: codex-model-kit
description: 用 codex-model-kit 仓库脚本为 Codex 配置 MiniMax、DeepSeek、智谱 GLM、MiMo、火山方舟豆包、阿里百炼等第三方 API 模型配置档。适合用户要求“帮我配置 Codex 多模型”“不要手动改 config.toml”“Key 用弹窗输入”“录屏演示”时使用。
---

# Codex Model Kit

当用户要求配置 Codex 第三方模型时，优先使用仓库里的脚本，而不是让用户手动改 `~/.codex/config.toml`。

## 流程

1. 先运行：

```bash
npm run setup:dry-run
```

2. 向用户说明将写入哪些文件。

3. 如果用户确认或当前任务要求直接配置，运行：

```bash
npm run setup:gui
```

4. 让用户在本机 macOS 弹窗里粘贴 API Key。

5. 不要要求用户把真实 Key 发到聊天里。

6. 配置完成后提醒用户完全退出并重新打开 Codex。

7. 重启后验证：

```bash
codex doctor -p minimax
```

## 重要边界

`GPT-5.3-Codex-Spark` 是 Codex 的官方使用额度，不是第三方 API 免费额度。

第三方模型真正推理时，消耗对应平台自己的 API Key 和额度。

Codex 自定义 provider 需要 Responses 兼容。如果 DeepSeek、MiMo、火山方舟或阿里百炼报 `/responses`、`404`、`unsupported endpoint`，优先解释为接口协议兼容问题。
