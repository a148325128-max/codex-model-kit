# 抖音录屏脚本：Codex 小白一键配置多模型

核对日期：2026-06-23。

建议拍 90-120 秒。

## 标题备选

```text
Codex 不切账号，同时挂 GPT-5.5、DeepSeek、MiniMax、豆包、百炼
```

```text
小白不用改配置：让 Codex 自己接第三方 API
```

```text
Codex Spark 额度怎么用？让它帮你配置多模型
```

## 90 秒口播稿

```text
Codex 不一定只能绑一个模型。

我的默认模型还是 GPT-5.5，继续走 OpenAI。

但我还想把 MiniMax、DeepSeek、智谱 GLM、MiMo、火山方舟豆包、阿里百炼也挂进来。

以前最麻烦的是，每次切模型都要手动改配置，很容易改乱。

所以我做了一个开源小工具，名字叫 codex-model-kit。

第一步先让智能体跑 dry-run。

它只预览会写哪些文件，不会读取 Key，也不会修改配置。

确认没问题后，再让智能体跑 gui 模式。

到了输入 Key 的步骤，系统会弹出 macOS 输入框。

我只在本机弹窗里粘贴 Key，不发给 AI，不写进 GitHub。

脚本会把 Key 写到本机环境变量里，然后生成六个 Codex 模型配置档。

以后想切 MiniMax，就是 codex -p minimax。

想切 DeepSeek，就是 codex -p deepseek。

想切火山方舟豆包，就是 codex -p ark。

想切阿里百炼，就是 codex -p bailian。

这里要讲清楚：截图里的 Spark 是 Codex 的官方使用额度，不是第三方 API 免费额度。

我可以用 Spark 帮我配置仓库、跑脚本、排错。

但真正调用第三方模型时，消耗的是各平台自己的 API Key 和额度。

另外，OpenAI-compatible 不等于一定能直接跑 Codex。

Codex 自定义 provider 需要 Responses 兼容。

如果某个平台报 /responses 或 404，不代表脚本错了，而是接口协议还需要官方支持，或者要加中转层。

我把脚本、官方链接、录屏提示词和 GitHub 发布清单都放进仓库了。
```

## 屏幕大字

```text
Codex 默认保留 GPT-5.5
一键增加 6 个模型配置档
Key 不发聊天
Key 不进 GitHub
Spark 负责配置，不是免费跑第三方模型
第三方推理按各平台 API 额度计费
```

## 录屏命令

```bash
npm run setup:dry-run
npm run setup:gui
codex doctor -p minimax
codex -p minimax
```

只展示假 Key 的手动命令：

```bash
launchctl setenv MINIMAX_API_KEY "YOUR_MINIMAX_KEY"
launchctl setenv DEEPSEEK_API_KEY "YOUR_DEEPSEEK_KEY"
launchctl setenv ARK_API_KEY "YOUR_ARK_KEY"
launchctl setenv DASHSCOPE_API_KEY "YOUR_DASHSCOPE_KEY"
```

## 分镜

| 时间 | 画面 | 口播 | 屏幕字 |
| --- | --- | --- | --- |
| 0-5 秒 | Codex 界面或额度截图 | Codex 不一定只能绑一个模型。 | Codex 多模型 |
| 5-12 秒 | README 标题 | 默认还是 GPT-5.5，但我想加第三方 API。 | 默认保留 GPT-5.5 |
| 12-22 秒 | 仓库文件 | 这个小工具叫 codex-model-kit。 | 开源小工具 |
| 22-35 秒 | 跑 dry-run | 先预览，不读取 Key，不改配置。 | 先 dry-run |
| 35-50 秒 | 跑 setup:gui | 输入 Key 走本机弹窗，不进聊天。 | Key 不发 AI |
| 50-62 秒 | dry-run 输出路径 | 自动生成六个模型配置档。 | 6 个配置档 |
| 62-75 秒 | doctor 验证 | 配完先测 MiniMax。 | 先测官方示例 |
| 75-90 秒 | 官方文档链接 | 第三方推理走各平台额度。 | 不等于免费推理 |
| 90-110 秒 | README / GitHub | 脚本和教程都放 GitHub。 | 收藏复现 |

## 不要录进去

- 真实 API Key
- `~/.codex/auth.json`
- 平台后台余额
- 终端历史里带真实 Key 的命令
- OpenAI 账号隐私页
