const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  CODEX_MODEL_PROVIDERS,
  buildProviderRegistry,
  installCodexModels,
  loadModelCatalogTemplate,
  modelCatalogJson,
  modelConfigToml,
  normalizeProviderIds,
  parseProviderFileContent,
  setDefaultModelProvider,
  upsertProviders,
  upsertTomlTable,
} = require("../src/codex-models");

const MODEL_CATALOG_TEMPLATE = {
  slug: "gpt-5.5",
  display_name: "GPT-5.5",
  description: "Template model",
  default_reasoning_level: "medium",
  supported_reasoning_levels: [
    { effort: "low", description: "Fast" },
    { effort: "medium", description: "Balanced" },
  ],
  shell_type: "shell_command",
  visibility: "list",
  supported_in_api: true,
  priority: 9,
  additional_speed_tiers: [],
  service_tiers: [],
  availability_nux: null,
  upgrade: null,
  base_instructions: "You are Codex.",
  model_messages: [],
  supports_reasoning_summaries: true,
  default_reasoning_summary: "auto",
  support_verbosity: true,
  default_verbosity: "medium",
  apply_patch_tool_type: "function",
  web_search_tool_type: "function",
  truncation_policy: "auto",
  supports_parallel_tool_calls: true,
  supports_image_detail_original: true,
  context_window: 272000,
  max_context_window: 272000,
  comp_hash: "test",
  effective_context_window_percent: 100,
  experimental_supported_tools: [],
  input_modalities: ["text"],
  supports_search_tool: true,
  use_responses_lite: false,
};

function writeTemplateCatalog(home) {
  const filePath = path.join(home, "models_cache.json");
  fs.writeFileSync(filePath, JSON.stringify({ models: [MODEL_CATALOG_TEMPLATE] }), "utf8");
  return filePath;
}

test("provider registry includes the six public demo presets", () => {
  assert.deepEqual(Object.keys(CODEX_MODEL_PROVIDERS), [
    "minimax",
    "deepseek",
    "zhipu",
    "mimo",
    "ark",
    "bailian",
  ]);
  assert.equal(CODEX_MODEL_PROVIDERS.zhipu.label, "智谱 GLM");
  assert.equal(CODEX_MODEL_PROVIDERS.bailian.envKey, "DASHSCOPE_API_KEY");
});

test("normalizeProviderIds accepts all and validates unknown ids", () => {
  assert.equal(normalizeProviderIds(["all"]).length, 6);
  assert.throws(() => normalizeProviderIds(["missing"]), /未知模型：missing/);
});

test("custom provider files extend the registry", () => {
  const providers = parseProviderFileContent(JSON.stringify({
    providers: {
      relay: {
        label: "Relay",
        baseUrl: "https://relay.example.com/v1/",
        envKey: "RELAY_API_KEY",
        model: "relay-model",
        contextWindow: 128000,
      },
    },
  }));
  assert.equal(providers.relay.baseUrl, "https://relay.example.com/v1");
  assert.equal(providers.relay.model, "relay-model");
  assert.deepEqual(providers.relay.models, ["relay-model"]);
});

test("custom provider files can include multiple model ids for one relay", () => {
  const providers = parseProviderFileContent(JSON.stringify({
    providers: {
      relay: {
        label: "Relay",
        baseUrl: "https://relay.example.com/v1/",
        envKey: "RELAY_API_KEY",
        model: "relay-default",
        models: ["relay-default", "deepseek-v3", "qwen-plus"],
      },
    },
  }));
  assert.deepEqual(providers.relay.models, ["relay-default", "deepseek-v3", "qwen-plus"]);
});

test("buildProviderRegistry merges custom provider files", () => {
  const filePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "codex-model-kit-provider-")), "providers.json");
  fs.writeFileSync(filePath, JSON.stringify({
    providers: {
      relay: {
        label: "Relay",
        baseUrl: "https://relay.example.com/v1",
        envKey: "RELAY_API_KEY",
        model: "relay-model",
      },
    },
  }), "utf8");

  const registry = buildProviderRegistry({ providerFiles: [filePath] });
  assert.equal(registry.minimax.model, "MiniMax-M3");
  assert.equal(registry.relay.envKey, "RELAY_API_KEY");
});

test("upsertTomlTable appends a missing table", () => {
  const result = upsertTomlTable('model = "gpt-5.5"\n', "model_providers.demo", '[model_providers.demo]\nname = "Demo"\n');
  assert.match(result, /model = "gpt-5\.5"/);
  assert.match(result, /\[model_providers\.demo\]\nname = "Demo"/);
});

test("upsertTomlTable replaces only the matching table", () => {
  const input = [
    'model = "gpt-5.5"',
    "",
    "[model_providers.deepseek]",
    'name = "Old"',
    'base_url = "https://old.example"',
    "",
    "[projects.foo]",
    'trust_level = "trusted"',
    "",
  ].join("\n");

  const result = upsertTomlTable(input, "model_providers.deepseek", '[model_providers.deepseek]\nname = "DeepSeek"\n');
  assert.match(result, /\[model_providers\.deepseek\]\nname = "DeepSeek"/);
  assert.doesNotMatch(result, /https:\/\/old\.example/);
  assert.match(result, /\[projects\.foo\]\ntrust_level = "trusted"/);
});

test("upsertProviders installs selected provider blocks", () => {
  const result = upsertProviders('model_provider = "openai"\nmodel = "gpt-5.5"\n', ["minimax", "zhipu", "ark"]);
  assert.match(result, /\[model_providers\.minimax\]/);
  assert.match(result, /env_key = "MINIMAX_API_KEY"/);
  assert.match(result, /\[model_providers\.zhipu\]/);
  assert.match(result, /model_providers\.ark/);
  assert.match(result, /env_key = "ARK_API_KEY"/);
  assert.doesNotMatch(result, /\[model_providers\.deepseek\]/);
});

test("modelConfigToml points the model config at the provider and model", () => {
  const result = modelConfigToml("minimax", {
    model: "MiniMax-M3",
    contextWindow: 512000,
  });
  assert.match(result, /model_provider = "minimax"/);
  assert.match(result, /model = "MiniMax-M3"/);
  assert.match(result, /model_context_window = 512000/);
});

test("setDefaultModelProvider updates only top-level model settings by default", () => {
  const input = [
    'model = "gpt-5.5"',
    'model_provider = "openai"',
    "",
    "[model_providers.deepseek]",
    'name = "DeepSeek"',
    "",
  ].join("\n");

  const result = setDefaultModelProvider(input, "minimax", {
    model: "MiniMax-M3",
    contextWindow: 512000,
  });

  assert.match(result, /^model = "MiniMax-M3"/m);
  assert.match(result, /^model_provider = "minimax"/m);
  assert.doesNotMatch(result, /^model_catalog_json = /m);
  assert.match(result, /\[model_providers\.deepseek\]\nname = "DeepSeek"/);
});

test("modelCatalogJson creates a Codex model catalog from a complete template", () => {
  const registry = {
    minimax: {
      label: "MiniMax",
      model: "MiniMax-M3",
      models: ["MiniMax-M3"],
      contextWindow: 512000,
    },
  };
  const result = JSON.parse(modelCatalogJson(["minimax"], registry, {
    template: MODEL_CATALOG_TEMPLATE,
  }));
  assert.equal(result.models[0].slug, "MiniMax-M3");
  assert.equal(result.models[0].display_name, "MiniMax");
  assert.equal(result.models[0].base_instructions, "You are Codex.");
  assert.equal(result.models[0].visibility, "list");
  assert.equal(result.models[0].context_window, 512000);
});

test("modelCatalogJson expands multiple model ids under one relay provider", () => {
  const registry = {
    relay: {
      label: "Relay",
      model: "relay-default",
      models: ["relay-default", "deepseek-v3"],
      contextWindow: 128000,
    },
  };
  const result = JSON.parse(modelCatalogJson(["relay"], registry, {
    template: MODEL_CATALOG_TEMPLATE,
  }));
  assert.deepEqual(result.models.map((model) => model.slug), ["relay-default", "deepseek-v3"]);
  assert.equal(result.models[1].display_name, "Relay deepseek-v3");
});

test("loadModelCatalogTemplate rejects incomplete catalog templates", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "codex-model-kit-bad-catalog-"));
  const filePath = path.join(home, "models_cache.json");
  fs.writeFileSync(filePath, JSON.stringify({ models: [{ slug: "broken" }] }), "utf8");

  assert.throws(() => loadModelCatalogTemplate(filePath), /base_instructions/);
});

test("installCodexModels writes config, model configs, and backup", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "codex-model-kit-test-"));
  const configPath = path.join(home, "config.toml");
  fs.writeFileSync(configPath, 'model_provider = "openai"\nmodel = "gpt-5.5"\n', "utf8");

  const result = installCodexModels({
    codexHome: home,
    providers: ["deepseek"],
    now: new Date("2026-06-23T00:00:00Z"),
  });

  assert.equal(result.changedConfig, true);
  assert.ok(result.backupPath.endsWith("config.toml.bak-codex-model-kit-20260623T000000Z"));
  assert.match(fs.readFileSync(configPath, "utf8"), /\[model_providers\.deepseek\]/);
  assert.match(fs.readFileSync(path.join(home, "deepseek.config.toml"), "utf8"), /DeepSeekV4/);
});

test("installCodexModels writes custom provider model configs", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "codex-model-kit-custom-test-"));
  const providerFile = path.join(home, "providers.json");
  fs.writeFileSync(providerFile, JSON.stringify({
    providers: {
      relay: {
        label: "Relay",
        baseUrl: "https://relay.example.com/v1",
        envKey: "RELAY_API_KEY",
        model: "relay-model",
      },
    },
  }), "utf8");

  const result = installCodexModels({
    codexHome: home,
    providers: ["relay"],
    providerFiles: [providerFile],
  });

  assert.equal(result.modelConfigs[0].provider.label, "Relay");
  assert.match(fs.readFileSync(path.join(home, "config.toml"), "utf8"), /\[model_providers\.relay\]/);
  assert.match(fs.readFileSync(path.join(home, "relay.config.toml"), "utf8"), /relay-model/);
});

test("installCodexModels can set a default provider without writing a model catalog", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "codex-model-kit-default-test-"));
  const result = installCodexModels({
    codexHome: home,
    providers: ["minimax"],
    setDefault: "minimax",
  });

  const config = fs.readFileSync(path.join(home, "config.toml"), "utf8");
  assert.match(config, /^model_provider = "minimax"/m);
  assert.match(config, /^model = "MiniMax-M3"/m);
  assert.doesNotMatch(config, /^model_catalog_json = /m);
  assert.equal(result.modelCatalogPath, null);
});

test("installCodexModels writes a model catalog only when explicitly requested", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "codex-model-kit-default-catalog-test-"));
  writeTemplateCatalog(home);

  const result = installCodexModels({
    codexHome: home,
    providers: ["minimax"],
    setDefault: "minimax",
    writeModelCatalog: true,
  });

  const config = fs.readFileSync(path.join(home, "config.toml"), "utf8");
  assert.match(config, /^model_provider = "minimax"/m);
  assert.match(config, /^model = "MiniMax-M3"/m);
  assert.match(config, /^model_catalog_json = /m);
  assert.equal(result.modelCatalogPath, path.join(home, "codex-model-kit-models.json"));
  const catalog = JSON.parse(fs.readFileSync(result.modelCatalogPath, "utf8"));
  assert.equal(catalog.models[0].slug, "MiniMax-M3");
  assert.equal(catalog.models[0].base_instructions, "You are Codex.");
});

test("installCodexModels rejects model catalog generation across multiple providers", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "codex-model-kit-multi-catalog-test-"));
  writeTemplateCatalog(home);

  assert.throws(() => installCodexModels({
    codexHome: home,
    providers: ["minimax", "deepseek"],
    setDefault: "minimax",
    writeModelCatalog: true,
    catalogProviders: ["minimax", "deepseek"],
  }), /只应绑定一个当前 provider/);
});

test("installCodexModels requires setDefault for model catalog generation", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "codex-model-kit-catalog-default-test-"));
  writeTemplateCatalog(home);

  assert.throws(() => installCodexModels({
    codexHome: home,
    providers: ["minimax"],
    writeModelCatalog: true,
  }), /需要同时指定 --set-default/);
});
