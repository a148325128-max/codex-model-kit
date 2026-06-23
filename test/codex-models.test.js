const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  CODEX_MODEL_PROVIDERS,
  installCodexModels,
  modelConfigToml,
  normalizeProviderIds,
  upsertProviders,
  upsertTomlTable,
} = require("../src/codex-models");

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
  assert.match(fs.readFileSync(path.join(home, "deepseek.config.toml"), "utf8"), /deepseek-v4-flash/);
});
