
import { readFileSync } from 'fs';
import { clearSession } from '../memory/bus.js';
import { log } from '../utils/logger.js';
import { TMP_DIR } from '../utils/paths.js';
import { join } from 'path';

const LOG_FILE = join(TMP_DIR, 'session-end.log');

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf-8').trim();
    if (!stdin) process.exit(0);

    const p = JSON.parse(stdin) as {
      session_id?: string;
      cwd?: string;
    };

    const sessionId = p.session_id ?? '';
    const cwd = p.cwd ?? process.cwd();

    if (!sessionId) {
      process.exit(0);
    }

    const cleared = clearSession(sessionId, cwd);

    log(LOG_FILE, `[SESSION END] ${sessionId} - Cleared ${cleared} messages`);

    process.exit(0);

  } catch (e: unknown) {
    console.error(`[session-end] ${(e as Error).message}`);
    process.exit(0);
  }
}

main();
