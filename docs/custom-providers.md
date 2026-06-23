# 自定义 Provider 与中转站

`codex-model-kit` 支持两类配置：

- 内置 provider 预设。
- 通过 `providers.local.json` 定义的自定义 provider。

自定义 provider 适用于：

- OpenAI-compatible API。
- 第三方模型网关。
- 企业内部代理。
- 聚合中转站。
- 私有部署的大模型服务。

## 配置文件

复制示例：

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
      "models": ["DeepSeekV4", "MiMo-V2.5", "GLM-V5.2", "MiniMax-M3", "Doubgo-Seed-2.1-pro"],
      "contextWindow": 128000,
      "status": "自定义 OpenAI-compatible 或中转站配置。"
    }
  }
}
```

字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `label` | 是 | 显示名称 |
| `baseUrl` | 是 | API 基础地址 |
| `envKey` | 是 | 本机环境变量名 |
| `model` | 是 | 模型名或中转站模型标识 |
| `models` | 否 | 本工具元数据。用于统一中转站下生成模型目录，不会写入 Codex 官方 TOML |
| `contextWindow` | 否 | 上下文窗口大小 |
| `status` | 否 | 备注 |

## 安装自定义配置档

当前目录存在 `providers.local.json` 时，脚本会自动读取：

```bash
node scripts/setup-codex-models.js --models relay --set-keys-gui
```

`--set-keys-gui` 在 macOS 和 Windows 上都会弹出隐藏输入框。

也可以显式指定：

```bash
node scripts/setup-codex-models.js --provider-file providers.local.json --models relay --set-keys-gui
```

安装后会生成：

```text
~/.codex/relay.config.toml
```

并在 `~/.codex/config.toml` 中写入：

```toml
[model_providers.relay]
name = "OpenAI-compatible Relay"
base_url = "https://your-relay.example.com/v1"
env_key = "RELAY_API_KEY"
wire_api = "responses"
```

如果配置中包含 `models`，这些模型不会写进 `[model_providers.relay]`。它们只会在你显式运行 `--write-model-catalog` 时，用来生成 `model_catalog_json`。该功能适合一个统一中转站 provider 下的多个模型；不建议把多个不同平台强行合成一个模型下拉。

## 兼容性

Codex 自定义 provider 当前使用 Responses 协议。

如果中转站只实现了 `chat/completions`，可能需要：

- 更换支持 Responses 的中转站。
- 在中转站开启 Responses API。
- 增加 Responses 到 Chat Completions 的协议转换层。

配置可以由脚本完成，但接口是否可用仍需要实际验证：

```bash
codex exec -p relay "hello"
```
