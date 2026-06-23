# codex-model-kit

Codex 多模型配置工具包，用于在保留默认 OpenAI 模型的同时，为 Codex 增加第三方 API 模型配置档。

该项目面向 Codex Desktop / Codex CLI 的本地配置场景，支持内置模型预设，也支持自定义 OpenAI-compatible API、中转站和私有网关。

本工具生成的 Codex TOML 配置遵循 OpenAI Codex 官方配置项：顶层 `model_provider`、`model`，以及 `[model_providers.<name>]` 下的 `name`、`base_url`、`env_key`、`wire_api`。仓库里的 `providers.local.json` 是本工具自己的输入文件，不会被 Codex 直接读取。

## 功能

- 保留现有 OpenAI 默认配置。
- 写入 Codex `model_providers` 配置。
- 为每个提供方生成独立的 `~/.codex/<name>.config.toml`。
- 支持 macOS / Windows 弹窗输入 API Key。
- 支持终端隐藏输入 API Key。
- 支持通过 `providers.local.json` 增加自定义第三方 API 或中转站。
- 写入前自动备份已有 `~/.codex/config.toml`。
- API Key 只写入本机环境变量，不写入仓库文件。

## 快速开始

```bash
git clone https://github.com/a148325128-max/codex-model-kit.git
cd codex-model-kit
npm install
npm run setup:dry-run
npm run setup:gui
```

`setup:dry-run` 只预览将要写入的文件，不修改配置。

`setup:gui` 会写入配置，并用系统弹窗输入 API Key：

- macOS：使用系统对话框，并写入 `launchctl` 环境变量。
- Windows：使用 Windows 弹窗，并写入当前用户环境变量。

如果希望让 Codex Desktop 当前模型直接指向某个第三方 provider：

```bash
npm run setup:default -- minimax
```

该命令会按官方配置方式，把主 `~/.codex/config.toml` 的 `model_provider` 和 `model` 指向指定配置档。它不会默认写 `model_catalog_json`。

如果要尝试让 Codex Desktop 底部模型下拉显示自定义模型，需要显式使用：

```bash
node scripts/setup-codex-models.js --set-default relay --models relay --write-model-catalog
```

`model_catalog_json` 会从本机 Codex 已缓存的 `models_cache.json` 复制完整模型字段结构后生成，避免写入缺少 `base_instructions` 的无效 JSON。建议只用于一个统一中转站 provider；多个不同平台分别有不同 `base_url` 和 API Key 时，请使用配置档/Profile 切换，或把这些模型统一接入同一个中转站。

如果只安装部分配置档：

```bash
node scripts/setup-codex-models.js --models minimax,deepseek,zhipu
```

查看当前可用配置档：

```bash
node scripts/setup-codex-models.js --list
```

## 内置配置档

| 配置档 | 提供方 | 默认模型 | 环境变量 |
| --- | --- | --- | --- |
| `minimax` | MiniMax | `MiniMax-M3` | `MINIMAX_API_KEY` |
| `deepseek` | DeepSeek | `DeepSeekV4` | `DEEPSEEK_API_KEY` |
| `zhipu` | 智谱 GLM | `GLM-V5.2` | `ZHIPU_API_KEY` |
| `mimo` | 小米 MiMo | `MiMo-V2.5` | `MIMO_API_KEY` |
| `ark` | 火山方舟豆包 | `Doubgo-Seed-2.1-pro` | `ARK_API_KEY` |
| `bailian` | 阿里百炼 Qwen | `qwen-plus` | `DASHSCOPE_API_KEY` |

这些是内置预设。模型名必须以各平台控制台实际可调用的模型 ID 为准；如果平台显示的名称不同，请用 `providers.local.json` 覆盖。

## 自定义第三方 API 或中转站

复制示例文件：

```bash
cp providers.example.json providers.local.json
```

编辑 `providers.local.json`：

```json
{
  "providers": {
    "relay": {
      "label": "OpenAI-compatible Relay",
      "baseUrl": "https://your-relay.example.com/v1",
      "envKey": "RELAY_API_KEY",
      "model": "DeepSeekV4",
      "models": [
        "DeepSeekV4",
        "MiMo-V2.5",
        "GLM-V5.2",
        "MiniMax-M3",
        "Doubgo-Seed-2.1-pro"
      ],
      "contextWindow": 128000
    }
  }
}
```

运行：

```bash
node scripts/setup-codex-models.js --models relay --set-keys-gui
```

`providers.local.json` 已加入 `.gitignore`，适合保存本机私有中转站地址、模型名和环境变量名。

说明：`model` 是写入 Codex 官方 TOML 的当前模型名；`models` 是本工具用于生成 `model_catalog_json` 的元数据，适合统一中转站下的多个模型。真实 API Key 仍只写入本机环境变量。

更多说明见 [docs/custom-providers.md](docs/custom-providers.md)。

## API Key

推荐方式：

```bash
npm run setup:gui
```

这是跨平台图形化模式。macOS 和 Windows 都可以直接运行。

也可以使用终端隐藏输入：

```bash
npm run setup:keys
```

手动设置环境变量时，macOS 使用：

```bash
launchctl setenv MINIMAX_API_KEY "YOUR_MINIMAX_KEY"
launchctl setenv DEEPSEEK_API_KEY "YOUR_DEEPSEEK_KEY"
launchctl setenv ZHIPU_API_KEY "YOUR_ZHIPU_KEY"
launchctl setenv MIMO_API_KEY "YOUR_MIMO_KEY"
launchctl setenv ARK_API_KEY "YOUR_ARK_KEY"
launchctl setenv DASHSCOPE_API_KEY "YOUR_DASHSCOPE_KEY"
```

Windows 使用 PowerShell 或 CMD：

```powershell
setx MINIMAX_API_KEY "YOUR_MINIMAX_KEY"
setx DEEPSEEK_API_KEY "YOUR_DEEPSEEK_KEY"
setx ZHIPU_API_KEY "YOUR_ZHIPU_KEY"
setx MIMO_API_KEY "YOUR_MIMO_KEY"
setx ARK_API_KEY "YOUR_ARK_KEY"
setx DASHSCOPE_API_KEY "YOUR_DASHSCOPE_KEY"
```

设置完成后，完全退出并重新打开 Codex Desktop 或终端。

## 使用配置档

设为当前默认模型：

```bash
npm run setup:default -- minimax
```

启动指定配置档：

```bash
codex -p minimax
```

一次性执行：

```bash
codex exec -p minimax "用一句话说明当前模型提供方"
```

说明：官方文档里 `Profiles` 是 CLI 切换方式；如果希望桌面端当前模型跟随第三方 provider，需要把主配置里的 `model_provider` 和 `model` 指向该 provider。`setup:default` 做的就是这一步。

如果要让底部模型下拉承担“多个第三方模型切换”，推荐使用一个统一中转站 provider：

```json
{
  "providers": {
    "relay": {
      "label": "Relay",
      "baseUrl": "https://your-relay.example.com/v1",
      "envKey": "RELAY_API_KEY",
      "model": "DeepSeekV4",
      "models": ["DeepSeekV4", "MiMo-V2.5", "GLM-V5.2", "MiniMax-M3", "Doubgo-Seed-2.1-pro"],
      "contextWindow": 128000
    }
  }
}
```

然后运行：

```bash
node scripts/setup-codex-models.js --models relay --set-default relay --write-model-catalog --set-keys-gui
```

多个独立平台分别有不同 API Key 时，下拉只切 `model`，不等价于同时切换 `model_provider`、`base_url` 和 `env_key`。这种场景请使用 `codex -p minimax`、`codex -p deepseek` 等配置档方式，或者先接入统一中转站。

## 前置条件与兼容性

配置前请确认：

- 已安装并登录 Codex Desktop 或 Codex CLI。
- 第三方平台账号已开通对应模型服务。
- API Key 有调用权限和可用额度。
- 模型名在当前账号和地域下可用。
- 提供方接口兼容 Codex 当前使用的 Responses 协议。

很多平台标注的 OpenAI-compatible 主要指 `chat/completions`。如果 `codex exec` 报 `/responses`、`404`、`unsupported endpoint`，通常表示该平台还需要 Responses API 兼容层，或需要使用支持 Responses 的网关。

## Codex Spark 使用说明

如果首次安装或打开 Codex 后，界面显示 `GPT-5.3-Codex-Spark` 可用额度，包括首次使用时提供的免费额度，可以直接用 Codex 拉取本仓库、运行脚本、修改配置和排查问题。

这部分额度只用于 Codex 配置过程。第三方模型实际推理仍消耗对应平台的 API Key 和额度。

## 文档

- [智能体执行流程](docs/agent-workflow.md)
- [自定义 provider 与中转站](docs/custom-providers.md)
- [命令参考](docs/usage.md)
- [官方链接](docs/official-links.md)

## 开发验证

```bash
npm test
npm run setup:dry-run
node scripts/setup-codex-models.js --help
node scripts/setup-codex-models.js --list
```
