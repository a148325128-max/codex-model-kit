#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const { Writable } = require("node:stream");
const {
  CODEX_MODEL_PROVIDERS,
  installCodexModels,
} = require("../src/codex-models");

const PROVIDER_LIST = Object.keys(CODEX_MODEL_PROVIDERS).join(",");

function printHelp() {
  console.log(`Codex 多模型配置工具包

用法：
  node scripts/setup-codex-models.js [参数]

常用命令：
  npm run setup:dry-run   只预览，不修改文件
  npm run setup           写入 Codex 多模型配置档
  npm run setup:gui       用 macOS 弹窗输入 Key，适合录屏
  npm run setup:keys      用终端隐藏输入 Key

参数：
  --models ${PROVIDER_LIST}
  --providers ${PROVIDER_LIST}
      要安装的模型配置档。默认全部安装。--models 和 --providers 等价。

  --codex-home PATH
      指定 Codex 配置目录。默认 ~/.codex。

  --default-model MODEL
      新配置默认 OpenAI 模型。默认 gpt-5.5。

  --dry-run
      只预览计划写入的文件，不真正修改。

  --set-keys
      在终端里隐藏输入 API Key，并写入 macOS launchctl 环境变量。

  --set-keys-gui
      用 macOS 系统弹窗输入 API Key。更适合“小白化智能体演示”。

  --restart-codex
      配置后重启 Codex App。仅 macOS 可用，默认不自动重启。

  --list
      列出内置模型预设。

  -h, --help
      显示帮助。

说明：
  这个脚本默认只写模型提供商地址、环境变量名和模型配置档。
  它不会把真实 API Key 写进 config.toml，也不会把 Key 保存进仓库文件。
  只有显式传入 --set-keys 或 --set-keys-gui 时，才会让你输入 Key。
`);
}

function printProviderList() {
  console.log("内置模型预设：");
  for (const [id, provider] of Object.entries(CODEX_MODEL_PROVIDERS)) {
    console.log(`- ${id}: ${provider.label}`);
    console.log(`  默认模型：${provider.model}`);
    console.log(`  环境变量：${provider.envKey}`);
    console.log(`  接口地址：${provider.baseUrl}`);
    console.log(`  备注：${provider.status}`);
  }
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") {
      options.help = true;
    } else if (arg === "--list") {
      options.list = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--set-keys") {
      options.setKeys = true;
    } else if (arg === "--set-keys-gui") {
      options.setKeysGui = true;
    } else if (arg === "--restart-codex") {
      options.restartCodex = true;
    } else if (arg === "--models" || arg === "--providers") {
      options.providers = splitList(argv[++index]);
    } else if (arg.startsWith("--models=")) {
      options.providers = splitList(arg.slice("--models=".length));
    } else if (arg.startsWith("--providers=")) {
      options.providers = splitList(arg.slice("--providers=".length));
    } else if (arg === "--codex-home") {
      options.codexHome = argv[++index];
    } else if (arg.startsWith("--codex-home=")) {
      options.codexHome = arg.slice("--codex-home=".length);
    } else if (arg === "--default-model") {
      options.defaultModel = argv[++index];
    } else if (arg.startsWith("--default-model=")) {
      options.defaultModel = arg.slice("--default-model=".length);
    } else {
      throw new Error(`未知参数：${arg}`);
    }
  }
  return options;
}

function promptHidden(question) {
  return new Promise((resolve) => {
    const mutedOutput = new Writable({
      write(chunk, encoding, callback) {
        if (!mutedOutput.muted) process.stdout.write(chunk, encoding);
        callback();
      },
    });
    const readline = require("node:readline").createInterface({
      input: process.stdin,
      output: mutedOutput,
      terminal: true,
    });
    mutedOutput.muted = true;
    process.stdout.write(question);
    readline.question("", (answer) => {
      mutedOutput.muted = false;
      process.stdout.write("\n");
      readline.close();
      resolve(String(answer || "").trim());
    });
  });
}

function setLaunchctlEnv(envKey, value) {
  if (process.platform !== "darwin") {
    throw new Error("自动写入环境变量目前只支持 macOS launchctl。其他系统请手动设置环境变量。");
  }
  const result = spawnSync("launchctl", ["setenv", envKey, value], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`设置 ${envKey} 失败：${result.stderr || result.stdout || "launchctl 返回非零状态"}`);
  }
}

function promptGui(provider) {
  if (process.platform !== "darwin") {
    throw new Error("--set-keys-gui 目前只支持 macOS。");
  }
  const script = `
set dialogResult to display dialog "请输入 ${provider.label} API Key\\n\\n环境变量：${provider.envKey}\\n\\n输入内容会隐藏，不会写进配置文件。" default answer "" with hidden answer buttons {"跳过", "保存"} default button "保存"
set buttonName to button returned of dialogResult
set keyText to text returned of dialogResult
return buttonName & "\\n" & keyText
`;
  const result = spawnSync("osascript", ["-e", script], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`读取 ${provider.label} Key 失败：${result.stderr || result.stdout || "osascript 返回非零状态"}`);
  }
  const [buttonName, ...rest] = String(result.stdout || "").split("\n");
  if (buttonName.trim() !== "保存") return "";
  return rest.join("\n").trim();
}

async function setProviderKeys(modelConfigs) {
  if (!process.stdin.isTTY) {
    throw new Error("--set-keys 需要在交互式终端里运行。");
  }
  console.log("\n开始设置 API Key。输入内容不会显示，直接回车会跳过该模型。");
  for (const item of modelConfigs) {
    const answer = await promptHidden(`请输入 ${item.provider.label} 的 Key（${item.provider.envKey}）：`);
    if (!answer) {
      console.log(`- 已跳过 ${item.provider.label}`);
      continue;
    }
    setLaunchctlEnv(item.provider.envKey, answer);
    console.log(`- 已设置 ${item.provider.envKey}`);
  }
}

function setProviderKeysGui(modelConfigs) {
  console.log("\n开始用 macOS 弹窗设置 API Key。输入内容会隐藏，点击“跳过”可略过。");
  for (const item of modelConfigs) {
    const answer = promptGui(item.provider);
    if (!answer) {
      console.log(`- 已跳过 ${item.provider.label}`);
      continue;
    }
    setLaunchctlEnv(item.provider.envKey, answer);
    console.log(`- 已设置 ${item.provider.envKey}`);
  }
}

function restartCodexApp() {
  if (process.platform !== "darwin") {
    throw new Error("--restart-codex 目前只支持 macOS。");
  }
  console.log("\n正在重启 Codex App...");
  spawnSync("osascript", ["-e", 'tell application "Codex" to quit'], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const result = spawnSync("open", ["-a", "Codex"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`打开 Codex 失败：${result.stderr || result.stdout || "open 返回非零状态"}`);
  }
  console.log("- Codex App 已发送重启请求");
}

function printNextSteps(result) {
  console.log("\n下一步：完全退出并重新打开 Codex，然后验证：");
  for (const item of result.modelConfigs) {
    console.log(`  codex doctor -p ${item.id}`);
  }

  console.log("\n运行指定模型配置档：");
  for (const item of result.modelConfigs) {
    console.log(`  codex -p ${item.id}`);
  }

  console.log("\n一次性测试：");
  for (const item of result.modelConfigs) {
    console.log(`  codex exec -p ${item.id} "用一句话说出你当前使用的模型提供商"`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  if (options.list) {
    printProviderList();
    return;
  }

  const result = installCodexModels({
    codexHome: options.codexHome,
    providers: options.providers,
    defaultModel: options.defaultModel,
    dryRun: options.dryRun,
  });

  console.log(options.dryRun ? "预览完成。计划写入这些 Codex 配置：" : "Codex 多模型配置已完成：");
  console.log(`- Codex 配置目录：${result.codexHome}`);
  console.log(`- 主配置文件：${result.configPath}${result.changedConfig ? "" : "（已经是最新）"}`);
  if (result.backupPath) console.log(`- 旧配置备份：${result.backupPath}`);
  for (const item of result.modelConfigs) {
    console.log(`- ${item.provider.label} 模型配置档：${item.path}`);
  }

  if ((options.setKeys || options.setKeysGui) && options.dryRun) {
    console.log("\n当前是 dry-run，已跳过 Key 输入。");
  } else if (options.setKeysGui) {
    setProviderKeysGui(result.modelConfigs);
  } else if (options.setKeys) {
    await setProviderKeys(result.modelConfigs);
  } else {
    console.log("\n下一步：把 API Key 放到环境变量里，不要写进配置文件：");
    for (const item of result.modelConfigs) {
      console.log(`  launchctl setenv ${item.provider.envKey} "YOUR_${item.id.toUpperCase()}_KEY"`);
    }
  }

  if (options.restartCodex && options.dryRun) {
    console.log("\n当前是 dry-run，已跳过 Codex 重启。");
  } else if (options.restartCodex) {
    restartCodexApp();
  }

  printNextSteps(result);
}

main().catch((error) => {
  console.error(`错误：${error.message}`);
  process.exit(1);
});
