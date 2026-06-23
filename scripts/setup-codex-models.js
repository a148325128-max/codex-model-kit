#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { Writable } = require("node:stream");
const {
  CODEX_MODEL_PROVIDERS,
  buildProviderRegistry,
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
  npm run setup:gui       用 macOS / Windows 弹窗输入 Key
  npm run setup:keys      用终端隐藏输入 Key
  npm run setup:default -- minimax
                        将指定模型配置档设为 Codex 当前默认模型

参数：
  --models ${PROVIDER_LIST}
  --providers ${PROVIDER_LIST}
      要安装的模型配置档。默认全部安装。--models 和 --providers 等价。

  --provider-file PATH
      读取自定义模型提供方配置。可重复传入。
      当前目录存在 providers.local.json 时会自动读取。

  --codex-home PATH
      指定 Codex 配置目录。默认 ~/.codex。

  --default-model MODEL
      新配置默认 OpenAI 模型。默认 gpt-5.5。

  --set-default MODEL_CONFIG
      将指定模型配置档写入主 config.toml 的 model_provider 和 model。
      这会改变 Codex 当前默认 provider。不会默认写 model_catalog_json。

  --write-model-catalog
      尝试生成 Codex Desktop 可读取的 model_catalog_json，并写入主 config.toml。
      该功能会读取本机 Codex 已缓存的 models_cache.json 作为完整字段模板。
      必须同时指定 --set-default。

  --catalog-models relay
      指定写入模型目录的单个 provider。默认写入 --set-default 指定的 provider。
      如果要在底部下拉里显示多个第三方模型，请使用一个统一中转站 provider 的 models 字段。

  --dry-run
      只预览计划写入的文件，不真正修改。

  --set-keys
      在终端里隐藏输入 API Key，并写入本机用户环境变量。

  --set-keys-gui
      用 macOS / Windows 系统弹窗输入 API Key。

  --restart-codex
      配置后重启 Codex App。当前仅 macOS 支持自动重启，默认不自动重启。

  --list
      列出可用模型配置档。

  -h, --help
      显示帮助。

说明：
  这个脚本默认只写模型提供商地址、环境变量名和模型配置档。
  它不会把真实 API Key 写进 config.toml，也不会把 Key 保存进仓库文件。
  只有显式传入 --set-keys 或 --set-keys-gui 时，才会让你输入 Key。
`);
}

function printProviderList(providerFiles = []) {
  const registry = buildProviderRegistry({
    providerFiles,
  });
  console.log("可用模型配置档：");
  for (const [id, provider] of Object.entries(registry)) {
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

function defaultProviderFiles(files = []) {
  const result = [...files];
  const localFile = path.resolve(process.cwd(), "providers.local.json");
  if (fs.existsSync(localFile) && !result.includes(localFile)) {
    result.push(localFile);
  }
  return result;
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
    } else if (arg === "--write-model-catalog") {
      options.writeModelCatalog = true;
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
    } else if (arg === "--set-default") {
      options.setDefault = argv[++index];
    } else if (arg.startsWith("--set-default=")) {
      options.setDefault = arg.slice("--set-default=".length);
    } else if (arg === "--catalog-models") {
      options.catalogProviders = splitList(argv[++index]);
      options.writeModelCatalog = true;
    } else if (arg.startsWith("--catalog-models=")) {
      options.catalogProviders = splitList(arg.slice("--catalog-models=".length));
      options.writeModelCatalog = true;
    } else if (arg === "--provider-file") {
      options.providerFiles = [...(options.providerFiles || []), path.resolve(argv[++index])];
    } else if (arg.startsWith("--provider-file=")) {
      options.providerFiles = [...(options.providerFiles || []), path.resolve(arg.slice("--provider-file=".length))];
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
  const result = spawnSync("launchctl", ["setenv", envKey, value], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`设置 ${envKey} 失败：${result.stderr || result.stdout || "launchctl 返回非零状态"}`);
  }
}

function windowsPowerShell() {
  return process.env.SystemRoot
    ? path.join(process.env.SystemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
    : "powershell.exe";
}

function runWindowsPowerShell(script, extraEnv = {}, options = {}) {
  const args = ["-NoProfile", "-ExecutionPolicy", "Bypass"];
  if (options.sta) args.push("-STA");
  args.push("-Command", script);
  const result = spawnSync(windowsPowerShell(), args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...extraEnv },
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "PowerShell 返回非零状态");
  }
  return result.stdout || "";
}

function setWindowsUserEnv(envKey, value) {
  runWindowsPowerShell(
    "[Environment]::SetEnvironmentVariable($env:CODEX_MODEL_KIT_ENV_KEY, $env:CODEX_MODEL_KIT_ENV_VALUE, 'User')",
    {
      CODEX_MODEL_KIT_ENV_KEY: envKey,
      CODEX_MODEL_KIT_ENV_VALUE: value,
    },
  );
}

function setPersistentEnv(envKey, value) {
  if (process.platform === "darwin") {
    setLaunchctlEnv(envKey, value);
    return;
  }
  if (process.platform === "win32") {
    setWindowsUserEnv(envKey, value);
    return;
  }
  throw new Error("自动写入环境变量目前支持 macOS 和 Windows。其他系统请手动设置环境变量。");
}

function appleScriptString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function promptMacGui(provider) {
  const label = appleScriptString(provider.label);
  const envKey = appleScriptString(provider.envKey);
  const script = `
set dialogResult to display dialog "请输入 ${label} API Key\\n\\n环境变量：${envKey}\\n\\n输入内容会隐藏，不会写进配置文件。" default answer "" with hidden answer buttons {"跳过", "保存"} default button "保存"
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

function promptWindowsGui(provider) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$form = New-Object System.Windows.Forms.Form
$form.Text = "Codex Model Kit"
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.ClientSize = New-Object System.Drawing.Size(520, 185)
$form.TopMost = $true

$label = New-Object System.Windows.Forms.Label
$label.AutoSize = $false
$label.Location = New-Object System.Drawing.Point(16, 16)
$label.Size = New-Object System.Drawing.Size(488, 64)
$label.Text = "请输入 " + $env:CODEX_MODEL_KIT_LABEL + " API Key" + [Environment]::NewLine + "环境变量：" + $env:CODEX_MODEL_KIT_ENV_KEY + [Environment]::NewLine + "输入内容会隐藏，不会写进配置文件。"
$form.Controls.Add($label)

$textBox = New-Object System.Windows.Forms.TextBox
$textBox.Location = New-Object System.Drawing.Point(16, 88)
$textBox.Size = New-Object System.Drawing.Size(488, 24)
$textBox.UseSystemPasswordChar = $true
$form.Controls.Add($textBox)

$saveButton = New-Object System.Windows.Forms.Button
$saveButton.Text = "保存"
$saveButton.Location = New-Object System.Drawing.Point(328, 136)
$saveButton.Size = New-Object System.Drawing.Size(80, 30)
$saveButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
$form.AcceptButton = $saveButton
$form.Controls.Add($saveButton)

$skipButton = New-Object System.Windows.Forms.Button
$skipButton.Text = "跳过"
$skipButton.Location = New-Object System.Drawing.Point(424, 136)
$skipButton.Size = New-Object System.Drawing.Size(80, 30)
$skipButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
$form.CancelButton = $skipButton
$form.Controls.Add($skipButton)

$result = $form.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
  "SAVE"
  $textBox.Text
} else {
  "SKIP"
}
`;
  const stdout = runWindowsPowerShell(script, {
    CODEX_MODEL_KIT_LABEL: provider.label,
    CODEX_MODEL_KIT_ENV_KEY: provider.envKey,
  }, { sta: true });
  const [buttonName, ...rest] = String(stdout || "").split(/\r?\n/);
  if (buttonName.trim() !== "SAVE") return "";
  return rest.join("\n").trim();
}

function promptGui(provider) {
  if (process.platform === "darwin") return promptMacGui(provider);
  if (process.platform === "win32") return promptWindowsGui(provider);
  throw new Error("--set-keys-gui 目前支持 macOS 和 Windows。其他系统请使用 --set-keys 或手动设置环境变量。");
}

function manualEnvCommand(envKey, placeholder) {
  if (process.platform === "win32") {
    return `setx ${envKey} "${placeholder}"`;
  }
  return `launchctl setenv ${envKey} "${placeholder}"`;
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
    setPersistentEnv(item.provider.envKey, answer);
    console.log(`- 已设置 ${item.provider.envKey}`);
  }
}

function setProviderKeysGui(modelConfigs) {
  console.log("\n开始用系统弹窗设置 API Key。输入内容会隐藏，点击“跳过”可略过。");
  for (const item of modelConfigs) {
    const answer = promptGui(item.provider);
    if (!answer) {
      console.log(`- 已跳过 ${item.provider.label}`);
      continue;
    }
    setPersistentEnv(item.provider.envKey, answer);
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
  console.log("\n下一步：完全退出并重新打开 Codex，然后运行指定模型配置档：");
  for (const item of result.modelConfigs) {
    console.log(`  codex -p ${item.id}`);
  }

  console.log("\n一次性验证：");
  for (const item of result.modelConfigs) {
    console.log(`  codex exec -p ${item.id} "用一句话说出你当前使用的模型提供商"`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  options.providerFiles = defaultProviderFiles(options.providerFiles || []);
  if (options.help) {
    printHelp();
    return;
  }
  if (options.list) {
    printProviderList(options.providerFiles);
    return;
  }

  const result = installCodexModels({
    codexHome: options.codexHome,
    providers: options.providers,
    providerFiles: options.providerFiles,
    defaultModel: options.defaultModel,
    setDefault: options.setDefault,
    writeModelCatalog: options.writeModelCatalog,
    catalogProviders: options.catalogProviders,
    dryRun: options.dryRun,
  });

  console.log(options.dryRun ? "预览完成。计划写入这些 Codex 配置：" : "Codex 多模型配置已完成：");
  console.log(`- Codex 配置目录：${result.codexHome}`);
  console.log(`- 主配置文件：${result.configPath}${result.changedConfig ? "" : "（已经是最新）"}`);
  if (options.providerFiles.length > 0) console.log(`- 自定义配置源：${options.providerFiles.join(", ")}`);
  if (result.setDefault) console.log(`- 当前默认模型配置档：${result.setDefault}`);
  if (result.modelCatalogPath) console.log(`- 模型目录文件：${result.modelCatalogPath}`);
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
      console.log(`  ${manualEnvCommand(item.provider.envKey, `YOUR_${item.id.toUpperCase()}_KEY`)}`);
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
