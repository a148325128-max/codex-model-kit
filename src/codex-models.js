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
    status: "内置预设。",
  },
  deepseek: {
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    envKey: "DEEPSEEK_API_KEY",
    model: "deepseek-v4-flash",
    contextWindow: DEFAULT_CONTEXT_WINDOW,
    status: "OpenAI-compatible 接口，需确认 Responses API 兼容性。",
  },
  zhipu: {
    label: "智谱 GLM",
    baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4",
    envKey: "ZHIPU_API_KEY",
    model: "glm-5.2",
    contextWindow: 1000000,
    status: "智谱 GLM 预设，模型名可按控制台开通情况调整。",
  },
  mimo: {
    label: "小米 MiMo",
    baseUrl: "https://api.xiaomimimo.com/v1",
    envKey: "MIMO_API_KEY",
    model: "mimo-v2.5-pro",
    contextWindow: DEFAULT_CONTEXT_WINDOW,
    status: "OpenAI-compatible 接口，需确认 Responses API 兼容性。",
  },
  ark: {
    label: "火山方舟豆包",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    envKey: "ARK_API_KEY",
    model: "doubao-seed-1-6-250615",
    contextWindow: 256000,
    status: "模型名可能跟地域、接入点和开通服务有关，可按控制台替换。",
  },
  bailian: {
    label: "阿里百炼 Qwen",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    envKey: "DASHSCOPE_API_KEY",
    model: "qwen-plus",
    contextWindow: 131072,
    status: "OpenAI-compatible 接口，需确认 Responses API 兼容性。",
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

function validateProvider(id, provider) {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new Error(`模型配置档名称只能包含字母、数字、下划线和短横线：${id}`);
  }
  for (const key of ["label", "baseUrl", "envKey", "model"]) {
    if (!provider || typeof provider[key] !== "string" || provider[key].trim() === "") {
      throw new Error(`${id} 缺少必填字段：${key}`);
    }
  }
  if (!/^[A-Z][A-Z0-9_]*$/.test(provider.envKey)) {
    throw new Error(`${id} 的 envKey 必须是环境变量名，例如 CUSTOM_API_KEY`);
  }
  const contextWindow = Number(provider.contextWindow || DEFAULT_CONTEXT_WINDOW);
  if (!Number.isFinite(contextWindow) || contextWindow <= 0) {
    throw new Error(`${id} 的 contextWindow 必须是正数`);
  }
  return {
    label: provider.label.trim(),
    baseUrl: provider.baseUrl.trim().replace(/\/+$/, ""),
    envKey: provider.envKey.trim(),
    model: provider.model.trim(),
    contextWindow,
    status: provider.status || "自定义 OpenAI-compatible 提供方。",
  };
}

function parseProviderFileContent(content, filePath = "provider file") {
  const parsed = JSON.parse(content);
  const providers = parsed.providers || parsed;
  if (!providers || typeof providers !== "object" || Array.isArray(providers)) {
    throw new Error(`${filePath} 必须是 provider 对象，或包含 providers 对象`);
  }
  const result = {};
  for (const [id, provider] of Object.entries(providers)) {
    result[id] = validateProvider(id, provider);
  }
  return result;
}

function loadProviderFile(filePath) {
  return parseProviderFileContent(fs.readFileSync(filePath, "utf8"), filePath);
}

function buildProviderRegistry(options = {}) {
  const registry = { ...CODEX_MODEL_PROVIDERS };
  const files = options.providerFiles || [];
  for (const filePath of files) {
    Object.assign(registry, loadProviderFile(filePath));
  }
  return registry;
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

function normalizeProviderIds(ids, registry = CODEX_MODEL_PROVIDERS) {
  const providerIds = ids && ids.length > 0 ? ids : Object.keys(registry);
  return providerIds.flatMap((id) => {
    if (id === "all" || id === "全部") return Object.keys(registry);
    if (!registry[id]) throw new Error(`未知模型：${id}`);
    return id;
  });
}

function upsertProviders(content, providerIds = Object.keys(CODEX_MODEL_PROVIDERS), options = {}) {
  const registry = options.registry || CODEX_MODEL_PROVIDERS;
  let next = options.ensureDefault ? ensureOpenAiDefault(content, options.defaultModel) : content || "";
  for (const id of normalizeProviderIds(providerIds, registry)) {
    next = upsertTomlTable(next, `model_providers.${id}`, providerBlock(id, registry[id]));
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
  const registry = options.registry || buildProviderRegistry({ providerFiles: options.providerFiles || [] });
  const providerIds = normalizeProviderIds(options.providers, registry);
  const configPath = path.join(home, "config.toml");
  const currentConfig = readIfExists(configPath);
  const nextConfig = upsertProviders(currentConfig, providerIds, {
    ensureDefault: options.ensureDefault === true || currentConfig.trim() === "",
    defaultModel: options.defaultModel || "gpt-5.5",
    registry,
  });

  const modelConfigs = providerIds.map((id) => {
    const provider = registry[id];
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
    registry,
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
  buildProviderRegistry,
  codexHome,
  ensureOpenAiDefault,
  installCodexModels,
  loadProviderFile,
  modelConfigToml,
  normalizeProviderIds,
  parseProviderFileContent,
  providerBlock,
  tableRange,
  timestampForFile,
  upsertProviders,
  upsertTomlTable,
};
