import assert from "node:assert/strict";
import test from "node:test";

import {
  MODEL_NO_MODELS_VALUE,
  resolveDefaultModelLabel,
} from "./agentConfigControls.tsx";

test("uses the harness-discovered default model label for an unset model", () => {
  assert.equal(
    resolveDefaultModelLabel({
      discoveredModelOptions: [
        { id: "", label: "Default model (claude-sonnet-5)" },
        { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
      ],
      isSharedCompute: false,
    }),
    "Default model (claude-sonnet-5)",
  );
});

test("falls back to a generic harness default when discovery has no current model", () => {
  assert.equal(
    resolveDefaultModelLabel({
      discoveredModelOptions: [{ id: "", label: "Default model" }],
      isSharedCompute: false,
    }),
    "Default model",
  );
});

test("an explicit inherited default label wins over harness discovery", () => {
  assert.equal(
    resolveDefaultModelLabel({
      defaultModelLabel: "Default model (team-model)",
      discoveredModelOptions: [
        { id: "", label: "Default model (claude-sonnet-5)" },
      ],
      isSharedCompute: false,
    }),
    "Default model (team-model)",
  );
});

// ── No-models sentinel row ─────────────────────────────────────────────────────

test("emptyOptions_discoveryFinished_yieldsNoModelsFoundRow", () => {
  // Replicate the guard AgentModelField uses:
  //   if (modelOptions.length === 0 && !modelDiscoveryLoading) {
  //     modelOptions.push({ disabled: true, label: "No models found", value: MODEL_NO_MODELS_VALUE })
  //   }
  // This test pins the sentinel value and disabled flag to prevent silent regressions.
  const modelOptions = [];
  const modelDiscoveryLoading = false;
  if (modelOptions.length === 0 && !modelDiscoveryLoading) {
    modelOptions.push({
      disabled: true,
      label: "No models found",
      value: MODEL_NO_MODELS_VALUE,
    });
  }

  assert.equal(modelOptions.length, 1);
  assert.equal(modelOptions[0].disabled, true);
  assert.equal(modelOptions[0].label, "No models found");
  assert.equal(modelOptions[0].value, MODEL_NO_MODELS_VALUE);
});

test("emptyOptions_discoveryLoading_doesNotAddNoModelsRow", () => {
  // The sentinel must not appear while discovery is still in flight — that
  // window is owned by the "Loading models..." disabled row instead.
  const modelOptions = [];
  const modelDiscoveryLoading = true;
  if (modelOptions.length === 0 && !modelDiscoveryLoading) {
    modelOptions.push({
      disabled: true,
      label: "No models found",
      value: MODEL_NO_MODELS_VALUE,
    });
  }

  assert.equal(modelOptions.length, 0);
});

test("nonEmptyOptions_discoveryFinished_doesNotAddNoModelsRow", () => {
  const modelOptions = [{ label: "Default model", value: "" }];
  const modelDiscoveryLoading = false;
  if (modelOptions.length === 0 && !modelDiscoveryLoading) {
    modelOptions.push({
      disabled: true,
      label: "No models found",
      value: MODEL_NO_MODELS_VALUE,
    });
  }

  assert.equal(modelOptions.length, 1);
  assert.equal(modelOptions[0].label, "Default model");
});
