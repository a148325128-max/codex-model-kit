---
name: codex-model-kit
description: 用 codex-model-kit 仓库脚本为 Codex 配置内置或自定义第三方 API 模型配置档。适合用户要求“配置 Codex 多模型”“配置 OpenAI-compatible 中转站”“不要手动改 config.toml”“Key 用 macOS 或 Windows 本地弹窗输入”时使用。
---

# Codex Model Kit

当用户要求配置 Codex 第三方模型或 OpenAI-compatible 中转站时，优先使用仓库里的脚本，而不是让用户手动改 `~/.codex/config.toml`。

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

4. 让用户在本机 macOS 或 Windows 弹窗里粘贴 API Key。

5. 不要要求用户把真实 Key 发到聊天里。

6. 配置完成后提醒用户完全退出并重新打开 Codex。

7. 重启后验证：

```bash
codex exec -p minimax "用一句话说明当前模型提供方"
```

## 重要边界

如果账户有 `GPT-5.3-Codex-Spark` 可用额度，可以用它完成仓库拉取、脚本运行、配置修改和问题排查。

第三方模型真正推理时，消耗对应平台自己的 API Key 和额度。

Codex 自定义 provider 需要 Responses 兼容。如果 provider 报 `/responses`、`404`、`unsupported endpoint`，优先解释为接口协议兼容问题。

如果用户明确要求 Codex Desktop 底部模型下拉显示第三方模型，只在单个 provider 或统一中转站场景下使用：

```bash
node scripts/setup-codex-models.js --models relay --set-default relay --write-model-catalog --set-keys-gui
```

不要把多个不同平台 provider 强行写进同一个模型目录。官方配置只有一个当前 `model_provider`；下拉切模型不等于同时切换 `base_url` 和 `env_key`。
