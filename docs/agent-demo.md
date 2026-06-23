# 小白化智能体演示

目标：让观众看到“不是我手动改配置，而是 Codex 智能体帮我完成”。

## 推荐演示话术

```text
我不把 Key 发给 AI。
我只让智能体运行本地脚本。
到了输入 Key 的时候，系统会弹出隐藏输入框。
我在本机弹窗里粘贴，Key 不进聊天，也不进 GitHub。
```

## 给 Codex 的提示词

把下面这段发给 Codex：

```text
请你在当前仓库里帮我配置 Codex 多模型工具包。

要求：
1. 先运行 npm run setup:dry-run，告诉我会写哪些文件。
2. 确认没有问题后，运行 npm run setup:gui。
3. 不要让我手动改 ~/.codex/config.toml。
4. 不要让我把真实 API Key 发到聊天里。
5. Key 输入必须走本地 macOS 弹窗。
6. 配置完成后提醒我完全重启 Codex。
7. 重启后帮我运行 codex doctor -p minimax 验证。
8. 如果 DeepSeek、MiMo、火山方舟或阿里百炼报 /responses、404、unsupported endpoint，请解释这是 Responses API 兼容性问题，不要说是脚本写错了。
```

## 智能体实际会做什么

```bash
npm run setup:dry-run
npm run setup:gui
codex doctor -p minimax
```

`setup:gui` 会：

- 写入 Codex provider 配置
- 生成六个模型配置档
- 弹出 macOS 对话框输入 Key
- 用 `launchctl setenv` 写入环境变量
- 不把 Key 写入仓库

## 最适合录屏的顺序

1. 展示 Codex Spark 使用限额截图。
2. 说清楚 Spark 是 Codex 使用额度，不是第三方模型免费额度。
3. 打开 GitHub 仓库。
4. 把提示词发给 Codex。
5. Codex 跑 dry-run。
6. Codex 跑 `setup:gui`。
7. 弹窗输入 Key，这段可以剪掉真实输入。
8. 重启 Codex。
9. 跑 `codex doctor -p minimax`。
10. 展示 `codex -p minimax`。

## 如果观众问这是不是免费额度

```text
配置过程可以用 Codex 的官方使用额度完成。
第三方模型真正推理，走对应平台自己的 API Key 和额度。
```
