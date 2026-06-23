# codex-model-kit

中文 Codex 多模型配置工具包。

它的目标很简单：默认保留 OpenAI / GPT-5.5，同时给 Codex 增加 MiniMax、DeepSeek、智谱 GLM、小米 MiMo、火山方舟豆包、阿里百炼 Qwen 这些可切换的模型配置档。

> 智谱是 **GLM**，不是 GML。

## 这个仓库解决什么

小白用户不需要手动改 `~/.codex/config.toml`。

录屏时可以这样演示：

```text
智能体拉取这个仓库
智能体运行 setup:gui
用户在 macOS 弹窗里粘贴 API Key
脚本写入 Codex 配置和系统环境变量
重启 Codex
用 doctor 验证
```

真实 API Key 不写进聊天、不写进配置文件、不提交到 GitHub。

## 快速开始

```bash
npm install
npm run setup:dry-run
npm run setup:gui
```

`setup:dry-run` 只预览，不修改任何文件。

`setup:gui` 会写入配置，并用 macOS 弹窗逐个输入 Key。

如果你只想配置部分模型：

```bash
node scripts/setup-codex-models.js --models minimax,deepseek,zhipu
```

如果你只想看内置预设：

```bash
node scripts/setup-codex-models.js --list
```

## 支持的模型配置档

| 配置档 | 平台 | 默认模型 | 环境变量 |
| --- | --- | --- | --- |
| `minimax` | MiniMax | `MiniMax-M3` | `MINIMAX_API_KEY` |
| `deepseek` | DeepSeek | `deepseek-v4-flash` | `DEEPSEEK_API_KEY` |
| `zhipu` | 智谱 GLM | `glm-5.2` | `ZHIPU_API_KEY` |
| `mimo` | 小米 MiMo | `mimo-v2.5-pro` | `MIMO_API_KEY` |
| `ark` | 火山方舟豆包 | `doubao-seed-1-6-250615` | `ARK_API_KEY` |
| `bailian` | 阿里百炼 Qwen | `qwen-plus` | `DASHSCOPE_API_KEY` |

脚本会生成：

```text
~/.codex/minimax.config.toml
~/.codex/deepseek.config.toml
~/.codex/zhipu.config.toml
~/.codex/mimo.config.toml
~/.codex/ark.config.toml
~/.codex/bailian.config.toml
```

以后切换模型：

```bash
codex -p minimax
codex -p deepseek
codex -p zhipu
codex -p ark
codex -p bailian
```

验证配置：

```bash
codex doctor -p minimax
codex doctor -p deepseek
codex doctor -p zhipu
codex doctor -p ark
codex doctor -p bailian
```

## Key 怎么输入

推荐小白录屏用：

```bash
npm run setup:gui
```

它会弹出 macOS 系统输入框：

- 输入内容隐藏
- 可以跳过某个平台
- Key 写入 macOS `launchctl` 环境变量
- Key 不会写进 `config.toml`
- Key 不会保存进这个仓库

终端隐藏输入：

```bash
npm run setup:keys
```

手动设置：

```bash
launchctl setenv MINIMAX_API_KEY "你的 MiniMax Key"
launchctl setenv DEEPSEEK_API_KEY "你的 DeepSeek Key"
launchctl setenv ZHIPU_API_KEY "你的智谱 Key"
launchctl setenv MIMO_API_KEY "你的 MiMo Key"
launchctl setenv ARK_API_KEY "你的火山方舟 Key"
launchctl setenv DASHSCOPE_API_KEY "你的阿里百炼 Key"
```

设置完后，完全退出 Codex App，再重新打开。

## 是不是只要输入 Key 就可以

大多数情况下，Key 是你需要准备的第一件事，但不是唯一条件。

还要确认：

- 平台账号已经开通对应模型服务。
- Key 有调用权限和余额。
- 模型名在你的控制台里可用。
- 平台接口兼容 Codex 需要的 Responses 协议。

MiniMax 最适合先录屏演示，因为 MiniMax 官方有 Codex 配置说明。

DeepSeek、MiMo、火山方舟、阿里百炼虽然有 OpenAI-compatible 接口，但很多平台主要兼容的是 `chat/completions`。如果 `codex doctor` 或 `codex exec` 报 `/responses`、`404`、`unsupported endpoint`，通常不是脚本写错，而是需要官方支持 Responses API，或者增加一个 Responses 到 Chat Completions 的中转层。

火山方舟和阿里百炼的模型名也可能跟地域、接入点、开通服务有关。如果平台提示模型不存在，请打开对应的：

```text
~/.codex/ark.config.toml
~/.codex/bailian.config.toml
```

把 `model = "..."`
换成控制台实际给你的模型名或接入点 ID。

## 能不能智能自动拉取

可以做成半自动，但不建议默认实时爬官方文档自动改配置。

原因是：

- 模型名会随地域、账号权限、接入点变化。
- 有些模型需要先在控制台开通。
- 有些 OpenAI-compatible 接口只兼容 `chat/completions`。
- Key、余额、权限这些信息不能靠公开文档判断。

所以当前版本采用更稳的方式：

```text
内置常用平台预设
用户输入自己的 Key
按控制台实际情况调整模型名
用 codex doctor 验证
```

后续可以升级成：

```text
providers.json 远程预设清单
--update-presets 更新预设
--check 自动跑 doctor
--undo 从备份恢复
```

## Spark 额度怎么讲

如果你的 Codex 界面里显示 `GPT-5.3-Codex-Spark 使用限额`，可以这样讲：

```text
这是 Codex 里的官方使用限额，不是第三方 API 免费额度。
我可以用这部分 Codex 使用额度，让智能体帮我改仓库、跑脚本、做配置。
但真正运行 MiniMax、DeepSeek、智谱、MiMo、豆包、百炼时，消耗的是对应平台自己的 API Key 和额度。
```

不要说：

```text
用 Codex 免费额度免费跑第三方模型
```

建议说：

```text
用 Codex 使用额度完成配置；第三方模型推理按各平台 API 额度计费。
```

## 脚本还是 Skill

这个仓库首先是一个脚本工具包。

优点是：用户、Codex、Claude 都能运行。

仓库里也附带了一个 Skill 模板：

```text
skills/codex-model-kit/SKILL.md
```

后面你想做成“安装到 Codex 后自动触发”的版本，可以把这个目录复制到你的 Codex skills 目录里。对外宣传时建议先说：

```text
Codex 多模型配置脚本
```

比一上来讲 Skill 更适合小白。

## 官方链接

详见 [docs/official-links.md](docs/official-links.md)。

录屏脚本见 [docs/recording-script.md](docs/recording-script.md)。

智能体演示提示词见 [docs/agent-demo.md](docs/agent-demo.md)。

GitHub 发布前清单见 [docs/github-checklist.md](docs/github-checklist.md)。

## 开发验证

```bash
npm test
npm run setup:dry-run
node scripts/setup-codex-models.js --help
```

## 安全提醒

不要提交：

- `.env`
- 真实 API Key
- `~/.codex/auth.json`
- 带 Key 的终端截图
- 平台后台余额截图
- 本地日志和缓存
