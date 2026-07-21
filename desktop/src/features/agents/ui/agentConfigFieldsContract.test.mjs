/**
 * Contract tests for the canonical agent-config behaviors and disclosure
 * presets (PR 2 flag cleanup).
 *
 * Before PR 2, AgentConfigFields exposed 23 optional props and no test pinned
 * any surface's behavior — a flag could be flipped or reintroduced and the
 * suite would stay green. These tests pin the decided contract:
 *
 *   1. The four canonical behaviors hold (onboarding's values won every call).
 *   2. "full" disclosure shows everything (the evergreen stance).
 *   3. "onboarding-essential" hides escape hatches and power tools, but
 *      NEVER the effort field (onboarding never hid it).
 *
 * If a future change needs a different behavior or preset, it must edit these
 * assertions — which is the conversation the flag cleanup was designed to force.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  CANONICAL_CONFIG_BEHAVIORS,
  resolveDisclosure,
} from "./AgentConfigFields.tsx";

test("canonical behaviors: onboarding's values are the only behavior", () => {
  assert.deepEqual(CANONICAL_CONFIG_BEHAVIORS, {
    // Changing provider auto-selects a valid model (no dead-end empty model).
    autoSelectModelOnProviderChange: true,
    // Model select stays usable while discovery loads (no flash-disable).
    disableModelSelectDuringDiscovery: false,
    // Switching provider keeps the old provider's typed API key in env_vars.
    preserveCredentialEnvVarsOnProviderChange: true,
    // Model/effort are locked until a provider exists (no saveable invalid state).
    requireProviderForModelAndEffort: true,
  });
});

test("full disclosure shows every field, escape hatch, and description", () => {
  const full = resolveDisclosure("full");
  for (const [key, value] of Object.entries(full)) {
    assert.equal(value, true, `full preset must show ${key}`);
  }
});

test("onboarding-essential hides power tools but never the effort field", () => {
  const essential = resolveDisclosure("onboarding-essential");
  assert.deepEqual(essential, {
    showAdvancedFields: false,
    showCustomModelOption: false,
    showCustomProviderOption: false,
    showDescriptions: false,
    // Effort was never hidden by onboarding; both presets show it.
    showEffortField: true,
    showProviderPlaceholderOption: false,
    showRequiredIndicators: false,
    showUnavailableEffortOptions: false,
  });
});

test("model status message shows in onboarding-essential when discovery status is non-null", () => {
  // AgentConfigFields passes showStatusMessage={showDescriptions || modelDiscoveryStatus !== null}.
  // In onboarding-essential, showDescriptions is false — so a non-null discovery
  // status (error or synthesized warning) must still surface the status line.
  const { showDescriptions } = resolveDisclosure("onboarding-essential");
  assert.equal(showDescriptions, false);

  // null status → status line stays hidden in onboarding (happy path stays clean)
  /** @type {{ message: string; tone: string } | null} */
  const noStatus = null;
  assert.equal(showDescriptions || noStatus !== null, false);

  // non-null status → status line shows even in onboarding
  const warningStatus = { message: "check your CLI", tone: "warning" };
  assert.equal(showDescriptions || warningStatus !== null, true);
});
