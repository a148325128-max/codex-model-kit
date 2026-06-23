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
codex doctor -p minimax
codex exec -p minimax "用一句话说明当前模型提供方"
```

## 首次使用 Codex

如果 Codex Desktop 界面显示 `GPT-5.3-Codex-Spark` 可用额度，包括首次使用时提供的免费额度，可以直接用 Codex 完成仓库拉取、脚本运行和配置修改。

第三方模型实际推理仍使用对应平台的 API Key 和额度。
