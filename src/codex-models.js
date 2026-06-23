const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const DEFAULT_CONTEXT_WINDOW = 512000;

const CODEX_MODEL_PROVIDERS = {
  minimax: {
    label: "MiniMax",
    baseUrl: "https://api.minimax.io/v1",
    envKey: "MINIMAX_API_KEY",
    model: "MiniMax-M3",
    contextWindow: DEFAULT_CONTEXT_WINDOW,
    status: "推荐先演示，MiniMax 官方有 Codex 配置说明。",
  },
  deepseek: {
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    envKey: "DEEPSEEK_API_KEY",
    model: "deepseek-v4-flash",
    contextWindow: DEFAULT_CONTEXT_WINDOW,
    status: "需要用 doctor/exec 实测 Responses API 兼容性。",
  },
  zhipu: {
    label: "智谱 GLM",
    baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4",
    envKey: "ZHIPU_API_KEY",
    model: "glm-5.2",
    contextWindow: 1000000,
    status: "智谱写 GLM，不是 GML；模型名可按控制台开通情况调整。",
  },
  mimo: {
    label: "小米 MiMo",
    baseUrl: "https://api.xiaomimimo.com/v1",
    envKey: "MIMO_API_KEY",
    model: "mimo-v2.5-pro",
    contextWindow: DEFAULT_CONTEXT_WINDOW,
    status: "MiMo 官方 OpenAI 兼容文档以 chat/completions 为主，需要实测 Responses。",
  },
  ark: {
    label: "火山方舟豆包",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    envKey: "ARK_API_KEY",
    model: "doubao-seed-1-6-250615",
    contextWindow: 256000,
    status: "火山方舟模型名可能跟地域、接入点和开通服务有关，可按控制台替换。",
  },
  bailian: {
    label: "阿里百炼 Qwen",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    envKey: "DASHSCOPE_API_KEY",
    model: "qwen-plus",
    contextWindow: 131072,
    status: "百炼 OpenAI 兼容接口以 chat/completions 为主，需要实测 Responses。",
  },
};

function codexHome(env = process.env) {
  return env.CODEX_HOME || path.join(os.homedir(), ".codex");
}

function quoteToml(value) {
  return JSON.stringify(String(value));
}

function providerBlock(id, provider) {
  return [
    `[model_providers.${id}]`,
    `name = ${quoteToml(provider.label)}`,
    `base_url = ${quoteToml(provider.baseUrl)}`,
    `env_key = ${quoteToml(provider.envKey)}`,
    `wire_api = "responses"`,
    "",
  ].join("\n");
}

function modelConfigToml(id, provider) {
  return [
    `model_provider = ${quoteToml(id)}`,
    `model = ${quoteToml(provider.model)}`,
    `model_context_window = ${provider.contextWindow}`,
    "",
  ].join("\n");
}

function ensureOpenAiDefault(content, model = "gpt-5.5") {
  let next = content || "";
  if (!/^\s*model_provider\s*=/m.test(next)) {
    next = `model_provider = "openai"\n${next}`;
  }
  if (!/^\s*model\s*=/m.test(next)) {
    next = `model = ${quoteToml(model)}\n${next}`;
  }
  return next;
}

function tableRange(lines, tableName) {
  const header = `[${tableName}]`;
  const start = lines.findIndex((line) => line.trim() === header);
  if (start === -1) return null;

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^\s*\[[^\]]+\]\s*$/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return { start, end };
}

function upsertTomlTable(content, tableName, block) {
  const normalized = content.endsWith("\n") || content.length === 0 ? content : `${content}\n`;
  const lines = normalized.split("\n");
  if (lines.at(-1) === "") lines.pop();

  const replacement = block.trimEnd().split("\n");
  const range = tableRange(lines, tableName);

  if (!range) {
    const prefix = lines.length > 0 ? `${lines.join("\n").trimEnd()}\n\n` : "";
    return `${prefix}${block}`;
  }

  const next = [
    ...lines.slice(0, range.start),
    ...replacement,
    ...lines.slice(range.end),
  ];
  return `${next.join("\n").trimEnd()}\n`;
}

function normalizeProviderIds(ids) {
  const providerIds = ids && ids.length > 0 ? ids : Object.keys(CODEX_MODEL_PROVIDERS);
  return providerIds.flatMap((id) => {
    if (id === "all" || id === "全部") return Object.keys(CODEX_MODEL_PROVIDERS);
    if (!CODEX_MODEL_PROVIDERS[id]) throw new Error(`未知模型：${id}`);
    return id;
  });
}

function upsertProviders(content, providerIds = Object.keys(CODEX_MODEL_PROVIDERS), options = {}) {
  let next = options.ensureDefault ? ensureOpenAiDefault(content, options.defaultModel) : content || "";
  for (const id of normalizeProviderIds(providerIds)) {
    next = upsertTomlTable(next, `model_providers.${id}`, providerBlock(id, CODEX_MODEL_PROVIDERS[id]));
  }
  return next;
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "Z");
}

function readIfExists(filePath) {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf8");
}

function writeFileEnsured(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function installCodexModels(options = {}) {
  const home = options.codexHome || codexHome();
  const providerIds = normalizeProviderIds(options.providers);
  const configPath = path.join(home, "config.toml");
  const currentConfig = readIfExists(configPath);
  const nextConfig = upsertProviders(currentConfig, providerIds, {
    ensureDefault: options.ensureDefault === true || currentConfig.trim() === "",
    defaultModel: options.defaultModel || "gpt-5.5",
  });

  const modelConfigs = providerIds.map((id) => {
    const provider = CODEX_MODEL_PROVIDERS[id];
    return {
      id,
      path: path.join(home, `${id}.config.toml`),
      content: modelConfigToml(id, provider),
      provider,
    };
  });

  const result = {
    codexHome: home,
    configPath,
    changedConfig: currentConfig !== nextConfig,
    modelConfigs,
    backupPath: null,
  };

  if (options.dryRun) return result;

  fs.mkdirSync(home, { recursive: true });
  if (currentConfig && currentConfig !== nextConfig) {
    result.backupPath = path.join(home, `config.toml.bak-codex-model-kit-${timestampForFile(options.now)}`);
    fs.writeFileSync(result.backupPath, currentConfig, "utf8");
  }
  writeFileEnsured(configPath, nextConfig);
  for (const item of modelConfigs) {
    writeFileEnsured(item.path, item.content);
  }
  return result;
}

module.exports = {
  CODEX_MODEL_PROVIDERS,
  codexHome,
  ensureOpenAiDefault,
  installCodexModels,
  modelConfigToml,
  normalizeProviderIds,
  providerBlock,
  tableRange,
  timestampForFile,
  upsertProviders,
  upsertTomlTable,
};
