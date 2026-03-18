/**
 * Bot protection utilities — honeypot fields + time-based validation.
 * These run entirely client-side and require zero external API keys.
 *
 * 1. Honeypot: A hidden field that bots fill but humans never see.
 * 2. Timestamp: Records when the form loaded. Submissions faster than
 *    MIN_FORM_TIME_MS are rejected (bots fill forms instantly).
 */

/** Minimum time (ms) a human would take to fill a form */
export const MIN_FORM_TIME_MS = 3_000 // 3 seconds

/** Returns the current timestamp (ms) — call once when the form mounts */
export function getFormLoadTimestamp(): number {
  return Date.now()
}

/**
 * Validate the submission is likely human.
 * @returns `null` if OK, or an error string if likely a bot.
 */
export function validateBotProtection(opts: {
  honeypotValue: string
  formLoadedAt: number
}): string | null {
  // 1. Honeypot should be empty — bots auto-fill hidden fields
  if (opts.honeypotValue && opts.honeypotValue.trim().length > 0) {
    // Don't tell the bot *why* it failed
    console.warn('[BOT_PROTECTION] Honeypot field was filled')
    return 'Something went wrong. Please try again.'
  }

  // 2. Time-based check — form filled too fast
  const elapsed = Date.now() - opts.formLoadedAt
  if (elapsed < MIN_FORM_TIME_MS) {
    console.warn('[BOT_PROTECTION] Form submitted too fast:', elapsed, 'ms')
    return 'Please wait a moment before submitting.'
  }

  return null // all good
}
