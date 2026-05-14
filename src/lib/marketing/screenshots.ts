import type { Page } from "playwright";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "screenshots";

/** Insert a row into the screenshots table so the gallery/API can find it. */
async function insertScreenshotRow(
  scanId: string,
  storagePath: string,
  label: string,
  deviceType: "desktop" | "mobile",
  pageUrl?: string,
  viewportWidth?: number,
  viewportHeight?: number
): Promise<string | null> {
  const { data, error } = await supabase
    .from("screenshots")
    .insert({
      scan_id: scanId,
      storage_path: storagePath,
      label,
      device_type: deviceType,
      page_url: pageUrl ?? null,
      viewport_width: viewportWidth ?? null,
      viewport_height: viewportHeight ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.warn(`[screenshots] DB insert failed for ${label}: ${error.message}`);
    return null;
  }

  return data?.id ?? null;
}

export interface CaptureResult {
  storagePath: string;
  screenshotId: string | null;
}

export async function captureScreenshot(
  page: Page,
  label: string,
  deviceType: "desktop" | "mobile",
  scanId: string,
  pageUrl?: string
): Promise<string> {
  const buffer = await page.screenshot({ fullPage: false, type: "png" });
  const fileName = `${label}-${deviceType}.png`;
  const storagePath = `${scanId}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    throw new Error(`Screenshot upload failed: ${error.message}`);
  }

  // Get viewport dimensions from the page
  const viewport = page.viewportSize();

  // Write row to screenshots table (best-effort — don't fail the capture)
  await insertScreenshotRow(
    scanId,
    storagePath,
    label,
    deviceType,
    pageUrl ?? page.url(),
    viewport?.width,
    viewport?.height
  );

  return storagePath;
}

/**
 * Upload a raw PNG buffer to Supabase Storage.
 * Used when screenshot comes from CF Browser Rendering (not Playwright).
 */
export async function uploadScreenshotBuffer(
  buffer: Buffer,
  scanId: string,
  label: string,
  deviceType: "desktop" | "mobile",
  pageUrl?: string
): Promise<string | null> {
  const fileName = `${label}-${deviceType}.png`;
  const storagePath = `${scanId}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    console.warn(`[screenshots] Buffer upload failed: ${error.message}`);
    return null;
  }

  // Write row to screenshots table
  await insertScreenshotRow(scanId, storagePath, label, deviceType, pageUrl);

  return storagePath;
}

export async function getSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60); // 1 hour

  if (error) {
    throw new Error(`Signed URL failed: ${error.message}`);
  }

  return data.signedUrl;
}
