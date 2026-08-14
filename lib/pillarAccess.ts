/**
 * Resolves which pillars a given university may apply for.
 *
 * Shared by the public form (to decide what to render) and by /api/apply (to
 * decide what to accept). Both must use this — the form is a convenience, the
 * API check is the one that actually enforces anything.
 */

export type PillarAccess = Record<string, string[]>;

/**
 * Pillar slugs available to `university`.
 *
 * Falls back to `defaultPillars` when the university has no explicit entry —
 * which covers universities an admin hasn't configured yet and free-text names
 * typed through the "Other" option. Falls back to every pillar if no default
 * has been set, so a missing config never blocks applicants.
 *
 * Unknown slugs are dropped, so a pillar deleted from the `pillars` table can't
 * linger in the config and reappear on the form.
 */
export function allowedPillarSlugs(
    university: string,
    pillarAccess: PillarAccess | null | undefined,
    defaultPillars: string[] | null | undefined,
    allSlugs: string[],
): string[] {
    const known = new Set(allSlugs);
    const target = (university || '').trim().toLowerCase();

    // Case-insensitive lookup: applicants type university names by hand, so
    // "university of kelaniya" must match the configured "University of Kelaniya".
    let entry: string[] | undefined;
    for (const [name, slugs] of Object.entries(pillarAccess ?? {})) {
        if (name.trim().toLowerCase() === target) {
            entry = slugs;
            break;
        }
    }

    const chosen = entry?.length ? entry : defaultPillars?.length ? defaultPillars : allSlugs;
    return chosen.filter((slug) => known.has(slug));
}
