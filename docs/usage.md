# 命令参考

## 预览

```bash
npm run setup:dry-run
```

只显示将要写入的 Codex 配置文件，不修改本机配置。

## 安装内置配置档

```bash
npm run setup
```

默认安装所有内置配置档。

只安装指定配置档：

```bash
node scripts/setup-codex-models.js --models minimax,deepseek,zhipu
```

## 设为当前默认模型

```bash
npm run setup:default -- minimax
```

等价于：

```bash
node scripts/setup-codex-models.js --set-default minimax
```

该命令会更新主 `~/.codex/config.toml`：

```toml
model_provider = "minimax"
model = "MiniMax-M3"
```

它不会默认生成 `model_catalog_json`。重启 Codex Desktop 后，当前模型会按这个默认配置加载。

## Codex Desktop 底部模型下拉

官方配置里，`model_provider` 是当前 provider，`model` 是当前模型。底部模型下拉适合在同一个 provider 内切换模型名，不适合作为多个不同平台、不同 `base_url`、不同 API Key 的总开关。

如果你使用统一中转站，可以在 `providers.local.json` 里给单个 provider 增加 `models` 元数据：

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

`--write-model-catalog` 会读取本机 Codex 的 `models_cache.json` 作为完整模板，再生成 `codex-model-kit-models.json`。这样可以避免缺少 `base_instructions` 等必填字段导致 Codex 无法加载配置。

`--write-model-catalog` 必须和 `--set-default` 一起使用，因为模型目录需要绑定到当前 `model_provider`。

如果你使用 MiniMax、DeepSeek、智谱、MiMo、火山方舟这类多个独立平台，请使用：

```bash
codex -p minimax
codex -p deepseek
codex -p zhipu
codex -p mimo
codex -p ark
```

或者运行 `npm run setup:default -- <配置档>` 把某一个 provider 设为当前默认。

## 图形化输入 API Key

```bash
npm run setup:gui
```

该命令会弹出隐藏输入框，并写入本机用户环境变量。

平台行为：

| 平台 | 弹窗方式 | 环境变量写入 |
| --- | --- | --- |
| macOS | 系统对话框 | `launchctl setenv` |
| Windows | Windows 桌面弹窗 | 当前用户环境变量 |

设置完成后需要完全退出并重新打开 Codex Desktop 或终端。

## 终端隐藏输入 API Key

```bash
npm run setup:keys
```

适合在交互式终端中使用。输入内容不会显示在屏幕上。

该命令同样支持 macOS 和 Windows。

## 自定义配置源

```bash
node scripts/setup-codex-models.js --provider-file providers.local.json --models relay
```

当前目录存在 `providers.local.json` 时，脚本会自动读取。

## 重启 Codex Desktop

```bash
node scripts/setup-codex-models.js --restart-codex
```

该参数当前仅支持 macOS，会尝试关闭并重新打开 Codex App。Windows 请手动重启 Codex Desktop。

## 验证

```bash
codex exec -p minimax "用一句话说明当前模型提供方"
```

`codex doctor` 当前不读取 `-p/--profile` 配置档。验证第三方 provider 时，请使用 `codex exec -p <配置档>`。

官方文档里 `Profiles` 是 CLI 切换方式。如果希望 Codex Desktop 当前模型直接跟随第三方 provider，请使用 `npm run setup:default -- <配置档>`。

## 首次使用 Codex

如果 Codex Desktop 界面显示 `GPT-5.3-Codex-Spark` 可用额度，包括首次使用时提供的免费额度，可以直接用 Codex 完成仓库拉取、脚本运行和配置修改。

第三方模型实际推理仍使用对应平台的 API Key 和额度。
