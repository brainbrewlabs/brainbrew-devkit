import { execSync } from 'child_process';
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export const AI_TIMEOUT = 30000;

/** Allowed characters in a model identifier (e.g. "openai/gpt-4o-mini"). */
const VALID_MODEL = /^[a-zA-Z0-9_\-\/:.@]+$/;

/**
 * Read the routing model from opencode.json.
 * Checks project-level config first, then global config.
 * Returns null if not configured or empty — caller falls back to keyword routing.
 */
export function readRoutingModel(cwd: string): string | null {
  const candidates = [
    join(cwd, 'opencode.json'),
    join(homedir(), '.config', 'opencode', 'opencode.json'),
  ];

  for (const configPath of candidates) {
    if (!existsSync(configPath)) continue;
    try {
      const parsed = JSON.parse(readFileSync(configPath, 'utf-8'));
      const model = parsed?.brainbrew?.routingModel;
      if (model && typeof model === 'string' && model.trim() !== '') {
        return model.trim();
      }
    } catch { /* malformed JSON — try next */ }
  }

  return null;
}

/**
 * Call the configured routing model via `opencode run`.
 * Falls back gracefully when no model is configured.
 *
 * NOTE: If opencode run does not support stdin piping, update the command to:
 *   opencode run --model ${model} --prompt "$(cat "${tmpFile}")"
 */
export function callRoutingAI(
  prompt: string,
  logFn: (msg: string) => void = () => {}
): Record<string, unknown> {
  const model = readRoutingModel(process.cwd());

  if (!model) {
    return { error: 'no_model', message: 'routingModel not set in opencode.json brainbrew section' };
  }

  if (!VALID_MODEL.test(model)) {
    logFn(`[ROUTER] Invalid routingModel: "${model}"`);
    return { error: 'invalid_model', message: `Invalid routingModel: "${model}"` };
  }

  const tmpDir = mkdtempSync(join('/tmp', 'ai-call-'));
  const tmpFile = join(tmpDir, 'prompt.txt');

  try {
    writeFileSync(tmpFile, prompt, { mode: 0o600 });

    const cleanEnv = { ...process.env };
    delete cleanEnv['OPENCODE'];
    delete cleanEnv['OPENCODE_PLUGIN_ROOT'];

    const aiOutput = execSync(`cat "${tmpFile}" | opencode run --model ${model}`, {
      timeout: AI_TIMEOUT,
      encoding: 'utf8',
      shell: '/bin/bash',
      env: cleanEnv,
      cwd: tmpDir,
      maxBuffer: 5 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    }) as string;

    // Cleanup
    try { unlinkSync(tmpFile); rmdirSync(tmpDir); } catch { /* ignore */ }

    // Extract JSON from response
    let jsonStr = aiOutput.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    return JSON.parse(jsonStr) as Record<string, unknown>;

  } catch (err: unknown) {
    try { unlinkSync(tmpFile); rmdirSync(tmpDir); } catch { /* ignore */ }

    const error = err as NodeJS.ErrnoException & { killed?: boolean };
    logFn(`[ROUTER ERROR] ${error.message}`);

    if (error.killed) {
      return { error: 'timeout', message: 'Routing AI timed out' };
    }
    return { error: 'call_failed', message: error.message };
  }
}
