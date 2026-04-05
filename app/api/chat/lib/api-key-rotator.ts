/**
 * Round-robin API key rotator for Google AI Studio.
 * Distributes requests across multiple API keys to avoid rate limits.
 * Keys are parsed from the GEMINI_API_KEYS environment variable (comma-separated).
 */

interface ApiKeyState {
  key: string;
  failureCount: number;
  lastFailureTime: number;
}

const FAILURE_COOLDOWN_MS = 60_000; // Skip failed keys for 60 seconds
const MAX_CONSECUTIVE_FAILURES = 3;

class ApiKeyRotator {
  private keys: ApiKeyState[] = [];
  private currentIndex = 0;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const rawKeys = process.env.API_KEYS ?? "";
    const parsedKeys = rawKeys
      .split(",")
      .map((key) => key.trim())
      .filter(Boolean);

    if (parsedKeys.length === 0) {
      throw new Error(
        "API_KEYS environment variable is missing or empty"
      );
    }

    this.keys = parsedKeys.map((key) => ({
      key,
      failureCount: 0,
      lastFailureTime: 0,
    }));
  }

  /**
   * Returns the next available API key using round-robin strategy.
   * Skips keys that have exceeded failure threshold within cooldown period.
   */
  getNextApiKey(): string {
    const totalKeys = this.keys.length;
    const now = Date.now();

    for (let attempt = 0; attempt < totalKeys; attempt++) {
      const index = this.currentIndex % totalKeys;
      this.currentIndex = (this.currentIndex + 1) % totalKeys;

      const keyState = this.keys[index];
      const isCoolingDown =
        keyState.failureCount >= MAX_CONSECUTIVE_FAILURES &&
        now - keyState.lastFailureTime < FAILURE_COOLDOWN_MS;

      if (!isCoolingDown) {
        return keyState.key;
      }
    }

    // All keys are in cooldown — reset oldest and use it
    const oldestFailure = this.keys.reduce((oldest, current) =>
      current.lastFailureTime < oldest.lastFailureTime ? current : oldest
    );
    oldestFailure.failureCount = 0;
    return oldestFailure.key;
  }

  /**
   * Report a failure for a specific API key (e.g., 429 rate limit).
   */
  reportFailure(apiKey: string): void {
    const keyState = this.keys.find((state) => state.key === apiKey);
    if (keyState) {
      keyState.failureCount++;
      keyState.lastFailureTime = Date.now();
    }
  }

  /**
   * Report a success for a specific API key, resetting its failure count.
   */
  reportSuccess(apiKey: string): void {
    const keyState = this.keys.find((state) => state.key === apiKey);
    if (keyState) {
      keyState.failureCount = 0;
    }
  }

  /**
   * Returns the total number of available API keys.
   */
  get totalKeys(): number {
    return this.keys.length;
  }
}

// Singleton instance — survives across API route invocations in the same process
let rotatorInstance: ApiKeyRotator | null = null;

export function getApiKeyRotator(): ApiKeyRotator {
  if (!rotatorInstance) {
    rotatorInstance = new ApiKeyRotator();
  }
  return rotatorInstance;
}

export type { ApiKeyRotator };
