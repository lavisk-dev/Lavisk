import { AutomationRegistry } from "./automation-registry";

let initialized = false;

export function ensureAutomationInitialized(): void {
  if (initialized) return;
  initialized = true;
  AutomationRegistry.initialize();
}
