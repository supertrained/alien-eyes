/**
 * Shared ad longevity analysis for Meta and Google ads primitives.
 * Buckets ads by age: testing (<14d), validated (14-60d), winners (>60d).
 */

export interface AdLongevity {
  longestRunningDays: number;
  averageAgeDays: number;
  testing: number;
  validated: number;
  winners: number;
  noCreativeRefresh: boolean;
}

/**
 * Compute ad longevity stats from an array of date strings.
 * Returns null if no valid dates are provided.
 */
export function computeAdLongevity(
  dates: (string | null | undefined)[]
): AdLongevity | null {
  const now = Date.now();
  const ages = dates
    .filter((d): d is string => !!d)
    .map((d) => Math.floor((now - new Date(d).getTime()) / (1000 * 60 * 60 * 24)))
    .filter((age) => age >= 0);

  if (ages.length === 0) return null;

  const testing = ages.filter((a) => a < 14).length;
  const validated = ages.filter((a) => a >= 14 && a <= 60).length;
  const winners = ages.filter((a) => a > 60).length;

  return {
    longestRunningDays: Math.max(...ages),
    averageAgeDays: Math.round(ages.reduce((s, a) => s + a, 0) / ages.length),
    testing,
    validated,
    winners,
    noCreativeRefresh: ages.every((a) => a > 180),
  };
}

/**
 * Generate human-readable signals from ad longevity data.
 * Returns an array of signal strings to append to the primitive's signals list.
 */
export function adLongevitySignals(
  longevity: AdLongevity | null,
  totalAds: number
): string[] {
  if (!longevity) return [];

  const signals: string[] = [];

  if (longevity.winners > 0 || longevity.testing > 0) {
    const parts: string[] = [];
    if (longevity.winners > 0) {
      parts.push(
        `${longevity.winners} ad${longevity.winners > 1 ? "s" : ""} running 60+ days (likely profitable)`
      );
    }
    if (longevity.testing > 0) {
      parts.push(
        `${longevity.testing} ad${longevity.testing > 1 ? "s" : ""} launched in last 2 weeks (active testing)`
      );
    }
    signals.push(parts.join(". "));
  }

  if (longevity.noCreativeRefresh) {
    signals.push("All ads are 6+ months old — no creative refresh detected");
  }

  if (longevity.testing === totalAds && totalAds > 0) {
    signals.push("All ads launched recently — early testing phase");
  }

  return signals;
}
