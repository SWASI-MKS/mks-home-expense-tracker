// In a real robust system, this could be persisted in local storage or indexedDB to survive reloads.
// For now, an in-memory map keyed by event type + identifier is used.

type RateLimitKey = string;

interface RateLimitEntry {
  timestamp: number;
}

export class NotificationRateLimiter {
  private limits: Map<RateLimitKey, RateLimitEntry> = new Map();

  /**
   * Evaluates if an event should be rate limited.
   * @param key Unique identifier for the event (e.g., 'BUDGET_WARNING_123')
   * @param limitMs Cooldown period in milliseconds
   * @returns true if the event is ALLOWED (not limited), false if it is rate LIMITED.
   */
  public evaluate(key: RateLimitKey, limitMs: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry) {
      // First time, allow and record
      this.limits.set(key, { timestamp: now });
      return true;
    }

    if (now - entry.timestamp >= limitMs) {
      // Cooldown passed, allow and update
      this.limits.set(key, { timestamp: now });
      return true;
    }

    // Still in cooldown, rate limit
    return false;
  }

  // Pre-defined limits
  public static readonly LIMITS = {
    BUDGET_WARNING: 24 * 60 * 60 * 1000, // 24 hours
    BUDGET_EXCEEDED: 24 * 60 * 60 * 1000, // 24 hours
    LARGE_EXPENSE: 10 * 60 * 1000, // 10 minutes
    LARGE_INCOME: 10 * 60 * 1000, // 10 minutes
    LARGE_TRANSFER: 10 * 60 * 1000, // 10 minutes
  };
}

export const rateLimiter = new NotificationRateLimiter();
