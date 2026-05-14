/**
 * Dry-run mode: load fixtures instead of calling real APIs.
 * Enable with DRY_RUN=true env var.
 * Save fixtures by running real scans with SAVE_FIXTURES=true.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { Envelope } from "./envelope";

const FIXTURES_DIR = join(import.meta.dirname ?? __dirname, "..", "fixtures");

export function isDryRun(): boolean {
  return process.env.DRY_RUN === "true";
}

export function shouldSaveFixtures(): boolean {
  return process.env.SAVE_FIXTURES === "true";
}

function fixtureKey(domain: string, primitive: string): string {
  return `${domain.replace(/\./g, "_")}__${primitive}`;
}

function fixturePath(domain: string, primitive: string): string {
  return join(FIXTURES_DIR, `${fixtureKey(domain, primitive)}.json`);
}

export function loadFixture(domain: string, primitive: string): Envelope | null {
  const path = fixturePath(domain, primitive);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export function saveFixture(
  domain: string,
  primitive: string,
  envelope: Envelope
): void {
  if (!existsSync(FIXTURES_DIR)) {
    mkdirSync(FIXTURES_DIR, { recursive: true });
  }
  writeFileSync(fixturePath(domain, primitive), JSON.stringify(envelope, null, 2));
}

export function hasFixtures(domain: string): boolean {
  if (!existsSync(FIXTURES_DIR)) return false;
  // Check if at least one fixture exists for this domain
  return existsSync(fixturePath(domain, "traffic_analysis"));
}
