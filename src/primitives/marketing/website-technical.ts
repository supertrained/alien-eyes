import { createEnvelope, createErrorEnvelope, type Envelope } from "@marketing/envelope";
import { withBrowser, cfFetchHtml, cfFetchScreenshot } from "@marketing/browser-pool";
import { captureScreenshot, uploadScreenshotBuffer } from "@marketing/screenshots";
import { runPageSpeedInsight, type PageSpeedResult } from "@marketing/pagespeed";
import { complete, getModelName } from "@marketing/models";
import { cleanHtmlForLlm } from "@marketing/html-cleaner";
import { extractSocialLinks as extractSocialLinksShared } from "@marketing/social-links";
import { absenceSignal } from "@marketing/signal-builder";

// ── Data Interface ──

export interface WebsiteTechnicalData {
  screenshots: {
    desktopPath: string | null;
    mobilePath: string | null;
  };
  pagespeed: {
    mobile: PageSpeedResult | null;
    desktop: PageSpeedResult | null;
    lighthouseOpportunities: LighthouseOpportunity[];
  };
  analysis: {
    trustSignals: string[];
    ctaAnalysis: string[];
    aboveFoldContent: string[];
    formFriction: string[];
    mobileIssues: string[];
    navigationUx: string[];
    overallGrade: string;
  };
  fullPageHtml: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
  };
  onPageSeo: {
    title: { text: string | null; length: number; issues: string[] };
    metaDescription: { text: string | null; length: number; issues: string[] };
    robots: string | null;
    h1s: { texts: string[]; count: number; issues: string[] };
    canonical: string | null;
    structuredData: { types: string[]; count: number };
    openGraph: { title: string | null; description: string | null; image: string | null; type: string | null };
    viewport: string | null;
    score: number;
    issues: string[];
  } | null;
  additionalPages: Array<{
    url: string;
    type: string;
    title: string | null;
    h1: string | null;
    formCount: number;
    ctaTexts: string[];
  }> | null;
  popupEmailCapture: Array<{ trigger: string; formFields: number; platform: string | null }>;
  gatedContent: { count: number; types: string[] } | null;
  formFrictionDetails: Array<{
    fieldCount: number;
    fields: Array<{
      type: string;
      label: string | null;
      required: boolean;
      autocomplete: string | null;
    }>;
    submitButtonText: string | null;
    hasPasswordField: boolean;
  }> | null;
  trustSignalHints: string[];
  signals: string[];
  methodology: string[];
}

interface LighthouseOpportunity {
  id: string;
  title: string;
  description: string;
  savings: string | null;
}

// ── Prompts ──

const CRO_ANALYSIS_PROMPT = `You are a conversion rate optimization expert analyzing a website homepage. Analyze the HTML and provide a thorough assessment.

IMPORTANT: Look carefully for trust signals even if they are not explicitly labeled. Quote blocks, client carousels, star ratings, review widgets (Trustpilot, G2, Capterra, Clutch), partner logos, "as seen in" sections, client count numbers, and case study links ALL count as trust signals.

Look for:

1. TRUST SIGNALS: Reviews, testimonials, guarantees, security badges, partner logos, social proof numbers, client count, years in business, media mentions, awards, certifications. Check NAVIGATION LINKS for "testimonials", "case-studies", "reviews", "clients", "portfolio" pages. List what EXISTS and what's MISSING.

2. CTA ANALYSIS: Is there a clear primary CTA above the fold? Does it stand out visually? Is the value proposition clear? Is there a single focused next action or too many competing CTAs?

3. ABOVE-FOLD CONTENT: Does the headline clearly state what the company does and for whom? Is there a subheadline? Is the benefit clear in <5 seconds? Any hero image/video?

4. FORM FRICTION: Count form fields visible on the page. Are there unnecessary required fields? Could steps be reduced? Multi-step vs single form?

5. MOBILE ISSUES: (Based on HTML structure) Are there elements that would be problematic on mobile? Large images without responsive sizing? Fixed-width elements? Touch target sizes?

6. NAVIGATION/UX: Is navigation clear? Too many items? Is there a search function? Are important pages (pricing, contact, about) easily findable?

7. VISUAL HIERARCHY & SCANNABILITY: Can someone scanning get the main message? Are the most important elements visually prominent? Is there enough white space? Do images support or distract?

8. OBJECTION HANDLING: Does the page address common concerns? Price/value, "will this work for me?", implementation difficulty, "what if it doesn't work?" — through FAQs, guarantees, comparisons, or process transparency.

CTA COPY QUALITY:
- Weak CTAs: "Submit", "Sign Up", "Learn More", "Get Started"
- Strong CTAs: "Start Free Trial", "Get My Report", "See Pricing", "Book a Demo"
Does the button copy communicate VALUE, not just action?

VALUE PROPOSITION CHECK:
- Is the primary benefit clear, specific, and differentiated?
- Is it written in the customer's language (not company jargon)?
- Feature-focused vs benefit-focused? Which dominates?

Respond in this exact JSON format:
{
  "trustSignals": ["signal 1", "signal 2"],
  "ctaAnalysis": ["finding 1", "finding 2"],
  "aboveFoldContent": ["finding 1", "finding 2"],
  "formFriction": ["finding 1", "finding 2"],
  "mobileIssues": ["finding 1", "finding 2"],
  "navigationUx": ["finding 1", "finding 2"],
  "overallGrade": "A|B|C|D|F with one sentence explanation"
}`;

// ── Trust Signal Detection ──

/** Detect trust signal hints from HTML before sending to LLM */
function detectTrustSignalHints(html: string, navLinks: string[]): string[] {
  const hints: string[] = [];
  const patterns: Array<[RegExp, string]> = [
    [/testimonial/i, "testimonial"],
    [/case.?stud/i, "case study"],
    [/review/i, "review"],
    [/client/i, "client reference"],
    [/success.?stor/i, "success story"],
    [/partner/i, "partner reference"],
    [/trust.?pilot/i, "Trustpilot widget"],
    [/g2\.com|g2-badge/i, "G2 badge/widget"],
    [/capterra/i, "Capterra reference"],
    [/clutch/i, "Clutch reference"],
    [/\bstar\b|★|rating/i, "star rating"],
    [/as.?seen.?in|featured.?in/i, "media mentions"],
    [/award/i, "award reference"],
    [/certif/i, "certification"],
    [/guarantee/i, "guarantee"],
    [/money.?back/i, "money-back guarantee"],
  ];
  for (const [pattern, label] of patterns) {
    if (pattern.test(html)) hints.push(`Found "${label}" pattern in page HTML`);
  }
  for (const link of navLinks) {
    if (/testimonial|case.?stud|review|client|portfolio|success/i.test(link)) {
      hints.push(`Navigation link found: "${link}"`);
    }
  }
  return hints;
}

// ── Social Link Extraction (delegates to shared lib) ──

function extractSocialLinks(html: string): WebsiteTechnicalData["socialLinks"] {
  return extractSocialLinksShared(html);
}

// ── Lighthouse Opportunity Extraction ──

function extractLighthouseOpportunities(psiMobile: PageSpeedResult | null, psiDesktop: PageSpeedResult | null): LighthouseOpportunity[] {
  // PageSpeed diagnostics already contain scored audit titles — surface the top ones
  const opportunities: LighthouseOpportunity[] = [];
  const seen = new Set<string>();

  for (const psi of [psiMobile, psiDesktop]) {
    if (!psi) continue;
    for (const diag of psi.diagnostics) {
      // diagnostics format: "Title: displayValue"
      const colonIdx = diag.indexOf(":");
      const title = colonIdx > 0 ? diag.slice(0, colonIdx).trim() : diag;
      const savings = colonIdx > 0 ? diag.slice(colonIdx + 1).trim() : null;
      if (seen.has(title)) continue;
      seen.add(title);
      opportunities.push({
        id: title.toLowerCase().replace(/\s+/g, "-"),
        title,
        description: diag,
        savings,
      });
    }
  }

  // Return top 5 opportunities
  return opportunities.slice(0, 5);
}

// ── Confidence Calculation ──

function calculateTechnicalConfidence(
  psiMobile: PageSpeedResult | null,
  psiDesktop: PageSpeedResult | null,
  analysis: WebsiteTechnicalData["analysis"],
  usedCfBr: boolean,
  onPageSeo: WebsiteTechnicalData["onPageSeo"],
  additionalPages: WebsiteTechnicalData["additionalPages"]
): number {
  // CF BR fallback starts lower — no scroll, no nav extraction, no mobile screenshot
  let confidence = usedCfBr ? 0.35 : 0.5;
  if (psiMobile) confidence += 0.1;
  if (psiDesktop) confidence += 0.05;
  if (analysis.trustSignals.length > 0 || analysis.ctaAnalysis.length > 0) confidence += 0.1;
  if (onPageSeo) confidence += 0.03;
  if (additionalPages && additionalPages.length > 0) confidence += 0.02;
  return Math.min(confidence, usedCfBr ? 0.75 : 0.85);
}

// ── Main Runner ──

export async function runWebsiteTechnical(
  url: string,
  scanId: string
): Promise<Envelope<WebsiteTechnicalData | null>> {
  const startTime = Date.now();
  const primitive = "website_technical";
  const methodology: string[] = [];

  try {
    // Capture desktop screenshot + full HTML
    let desktopPath: string | null;
    let fullHtml: string;
    let navLinks: string[];
    let navLinksFull: Array<{ text: string; href: string }> = [];
    let mobilePath: string | null = null;
    let usedCfBr = false;
    let popupForms: Array<{ trigger: string; formFields: number; platform: string | null }> = [];
    let onPageSeo: WebsiteTechnicalData["onPageSeo"] = null;
    let additionalPages: WebsiteTechnicalData["additionalPages"] = null;
    let formFrictionDetails: WebsiteTechnicalData["formFrictionDetails"] = null;

    try {
      const pwResult = await withBrowser(
        "desktop",
        async (page) => {
          await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
          methodology.push("Loaded page with Playwright (desktop, networkidle)");

          // Scroll to bottom to trigger lazy-loaded content — best effort, non-fatal
          try {
            let scrollTimer: ReturnType<typeof setTimeout>;
            await Promise.race([
              page.evaluate(async () => {
                for (let i = 0; i < document.body.scrollHeight; i += 500) {
                  window.scrollTo(0, i);
                  await new Promise((r) => setTimeout(r, 100));
                }
                window.scrollTo(0, 0);
              }),
              new Promise((_, reject) => {
                scrollTimer = setTimeout(() => reject(new Error("Scroll timed out")), 10_000);
              }),
            ]).finally(() => clearTimeout(scrollTimer!));
            methodology.push("Scrolled full page to trigger lazy-loaded content");
          } catch (scrollErr) {
            methodology.push(
              `Scroll failed (${(scrollErr as Error).message.slice(0, 80)}), continuing with above-fold HTML`
            );
          }

          // --- Behavioral popup detection (exit-intent, scroll, time-delay) ---
          let detectedPopups: Array<{ trigger: string; formFields: number; platform: string | null }> = [];
          try {
            // Set up MutationObserver to detect newly-appeared elements
            await page.evaluate(() => {
              (window as any).__gmpfPopups = [];
              const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                  for (const node of Array.from(mutation.addedNodes)) {
                    if (node instanceof HTMLElement) {
                      const hasEmail = node.querySelector('input[type="email"], input[name*="email"]');
                      const isPopupLike = /modal|popup|overlay|exit|opt-?in/i.test(
                        node.className + " " + node.id + " " + (node.getAttribute("role") ?? "")
                      );
                      if (hasEmail || isPopupLike) {
                        const fields = node.querySelectorAll("input:not([type=hidden]):not([type=submit])").length;
                        (window as any).__gmpfPopups.push({
                          hasEmail: !!hasEmail,
                          isPopupLike,
                          fields,
                          html: node.outerHTML.slice(0, 500),
                        });
                      }
                    }
                  }
                }
              });
              observer.observe(document.body, { childList: true, subtree: true });
              (window as any).__gmpfObserver = observer;
            });

            // 1. Scroll trigger: scroll to 80% of page height
            await page.evaluate(async () => {
              window.scrollTo(0, document.body.scrollHeight * 0.8);
              await new Promise((r) => setTimeout(r, 2000));
            });

            // 2. Time-delay: wait 5s for timed popups
            await page.waitForTimeout(5000);

            // 3. Exit-intent: move mouse rapidly to top of viewport
            try {
              await page.mouse.move(400, 300);
              await page.mouse.move(400, 0, { steps: 2 });
              await page.waitForTimeout(1500);
            } catch {
              // Mouse simulation may not work in all environments
            }

            // Collect detected popups and disconnect observer
            const detected = await page.evaluate(() => {
              if ((window as any).__gmpfObserver) {
                (window as any).__gmpfObserver.disconnect();
              }
              return (window as any).__gmpfPopups ?? [];
            });

            // Also re-scan DOM for popup-like elements with email inputs
            const domPopups = await page.evaluate(() => {
              const selectors = [
                '.modal input[type="email"]',
                '.popup input[type="email"]',
                '[class*="exit"] input[type="email"]',
                '[class*="popup"] input[type="email"]',
                '[class*="overlay"] input[type="email"]',
                '[class*="optin"] input[type="email"]',
                '[class*="opt-in"] input[type="email"]',
              ];
              const found: Array<{ selector: string; fields: number }> = [];
              for (const sel of selectors) {
                const els = document.querySelectorAll(sel);
                if (els.length > 0) {
                  const container = els[0].closest(".modal, .popup, [class*='overlay'], form") ?? els[0].parentElement;
                  found.push({
                    selector: sel,
                    fields: container?.querySelectorAll("input:not([type=hidden]):not([type=submit])").length ?? 1,
                  });
                }
              }
              return found;
            });

            // Build popup form records
            if (detected.length > 0) {
              for (const d of detected) {
                detectedPopups.push({
                  trigger: d.isPopupLike ? "behavioral popup" : "dynamic form injection",
                  formFields: d.fields,
                  platform: null,
                });
              }
            }
            if (domPopups.length > 0) {
              for (const dp of domPopups) {
                const alreadyFound = detectedPopups.length > 0;
                if (!alreadyFound) {
                  detectedPopups.push({
                    trigger: "popup/modal with email input",
                    formFields: dp.fields,
                    platform: null,
                  });
                }
              }
            }

            if (detectedPopups.length > 0) {
              methodology.push(`Behavioral popup detection: ${detectedPopups.length} popup form(s) found`);
            } else {
              methodology.push("Behavioral popup detection: no exit-intent, scroll, or timed popups found");
            }

            // Scroll back to top
            await page.evaluate(() => window.scrollTo(0, 0));
          } catch (popupErr) {
            methodology.push(
              `Behavioral popup detection failed (${(popupErr as Error).message.slice(0, 60)}), continuing`
            );
          }

          const path = await captureScreenshot(page, "homepage", "desktop", scanId);
          const html = await page.content();

          // Extract navigation links for trust signal detection
          const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("nav a, header a, [role='navigation'] a"))
              .map((a) => ({
                text: (a as HTMLAnchorElement).textContent?.trim() ?? "",
                href: (a as HTMLAnchorElement).href ?? "",
              }))
              .filter((l) => l.text.length > 0);
          });
          const navLinkTexts = links.map((l) => `${l.text} (${l.href})`);

          // --- On-Page SEO Extraction ---
          let seoData: {
            title: string | null;
            metaDescription: string | null;
            robots: string | null;
            h1s: string[];
            canonical: string | null;
            structuredDataTypes: string[];
            structuredDataCount: number;
            ogTitle: string | null;
            ogDescription: string | null;
            ogImage: string | null;
            ogType: string | null;
            viewport: string | null;
          } | null = null;
          try {
            seoData = await page.evaluate(() => {
              const title = document.title || null;
              const metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
              const metaDescription = metaDesc?.content || null;
              const robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
              const robots = robotsMeta?.content || null;
              const h1Elements = document.querySelectorAll("h1");
              const h1s = Array.from(h1Elements).map((h) => h.textContent?.trim() ?? "").filter((t) => t.length > 0);
              const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
              const canonical = canonicalLink?.href || null;
              const jsonLdElements = document.querySelectorAll('script[type="application/ld+json"]');
              const sdTypes: string[] = [];
              let sdCount = 0;
              jsonLdElements.forEach((el) => {
                sdCount++;
                try {
                  const parsed = JSON.parse(el.textContent ?? "");
                  if (parsed["@type"]) {
                    sdTypes.push(String(parsed["@type"]));
                  } else if (Array.isArray(parsed["@graph"])) {
                    for (const item of parsed["@graph"]) {
                      if (item["@type"]) sdTypes.push(String(item["@type"]));
                    }
                  }
                } catch {
                  // Malformed JSON-LD
                }
              });
              const ogTitle = (document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null)?.content || null;
              const ogDescription = (document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null)?.content || null;
              const ogImage = (document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null)?.content || null;
              const ogType = (document.querySelector('meta[property="og:type"]') as HTMLMetaElement | null)?.content || null;
              const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
              const viewport = viewportMeta?.content || null;
              return {
                title, metaDescription, robots, h1s, canonical,
                structuredDataTypes: sdTypes, structuredDataCount: sdCount,
                ogTitle, ogDescription, ogImage, ogType, viewport,
              };
            });
          } catch {
            // Non-fatal — seoData stays null
          }

          // --- Form Friction Details extraction ---
          let extractedFormFriction: WebsiteTechnicalData["formFrictionDetails"] = null;
          try {
            const rawFormData = await page.evaluate(() => {
              const forms = Array.from(document.querySelectorAll("form"));
              if (forms.length === 0) return null;

              return forms.slice(0, 5).map((form) => {
                const inputs = Array.from(
                  form.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select")
                );

                const fields = inputs.map((input) => {
                  const el = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
                  let label: string | null = null;
                  const id = el.id;
                  if (id) {
                    const labelEl = document.querySelector(`label[for="${id}"]`);
                    if (labelEl) label = labelEl.textContent?.trim() ?? null;
                  }
                  if (!label) {
                    const parentLabel = el.closest("label");
                    if (parentLabel) {
                      label = parentLabel.textContent?.trim() ?? null;
                    }
                  }
                  if (!label) {
                    label = el.getAttribute("aria-label") || el.getAttribute("placeholder") || null;
                  }

                  return {
                    type: el.tagName === "SELECT" ? "select" : (el as HTMLInputElement).type || "text",
                    label,
                    required: el.required || el.getAttribute("aria-required") === "true",
                    autocomplete: el.getAttribute("autocomplete"),
                  };
                });

                let submitButtonText: string | null = null;
                const submitBtn =
                  form.querySelector('button[type="submit"], input[type="submit"]') ||
                  form.querySelector("button:last-of-type");
                if (submitBtn) {
                  submitButtonText =
                    (submitBtn as HTMLInputElement).value ||
                    submitBtn.textContent?.trim() ||
                    null;
                }

                const hasPasswordField = inputs.some(
                  (i) => (i as HTMLInputElement).type === "password"
                );

                return { fieldCount: fields.length, fields, submitButtonText, hasPasswordField };
              });
            });
            if (rawFormData && rawFormData.length > 0) {
              extractedFormFriction = rawFormData;
              methodology.push(`Form friction details: ${rawFormData.length} form(s) analyzed, ${rawFormData.reduce((s, f) => s + f.fieldCount, 0)} total fields`);
            }
          } catch (formErr) {
            methodology.push(`Form friction extraction failed (${(formErr as Error).message.slice(0, 60)}), continuing`);
          }

          return {
            desktopPath: path,
            html,
            navLinks: navLinkTexts,
            navLinksFull: links,
            popupForms: detectedPopups,
            seoData,
            formFrictionDetails: extractedFormFriction,
          };
        }
      );
      desktopPath = pwResult.desktopPath;
      fullHtml = pwResult.html;
      navLinks = pwResult.navLinks;
      navLinksFull = pwResult.navLinksFull;
      popupForms = pwResult.popupForms;
      formFrictionDetails = pwResult.formFrictionDetails;

      // --- Process On-Page SEO data ---
      try {
        if (pwResult.seoData) {
          const sd = pwResult.seoData;
          const allIssues: string[] = [];

          const titleIssues: string[] = [];
          const titleLen = sd.title?.length ?? 0;
          if (!sd.title) {
            titleIssues.push("Missing title tag");
          } else {
            if (titleLen > 60) titleIssues.push(`Title too long (${titleLen} chars, max 60)`);
            if (titleLen < 30) titleIssues.push(`Title too short (${titleLen} chars, min 30)`);
            if (/^(home|welcome|untitled|homepage)$/i.test(sd.title.trim())) {
              titleIssues.push(`Generic title: "${sd.title.trim()}"`);
            }
          }
          allIssues.push(...titleIssues);

          const descIssues: string[] = [];
          const descLen = sd.metaDescription?.length ?? 0;
          if (!sd.metaDescription) {
            descIssues.push("Missing meta description");
          } else {
            if (descLen > 160) descIssues.push(`Meta description too long (${descLen} chars, max 160)`);
            if (descLen < 50) descIssues.push(`Meta description too short (${descLen} chars, min 50)`);
          }
          allIssues.push(...descIssues);

          const h1Issues: string[] = [];
          if (sd.h1s.length === 0) {
            h1Issues.push("Missing H1 tag");
          } else if (sd.h1s.length > 1) {
            h1Issues.push(`Multiple H1 tags found (${sd.h1s.length}) — should be exactly 1`);
          }
          allIssues.push(...h1Issues);

          if (!sd.canonical) allIssues.push("Missing canonical tag");
          if (sd.structuredDataCount === 0) allIssues.push("No structured data (JSON-LD) found");
          if (!sd.ogTitle && !sd.ogDescription && !sd.ogImage) {
            allIssues.push("No Open Graph tags — poor social sharing previews");
          }
          if (!sd.viewport) allIssues.push("Missing viewport meta tag — mobile rendering issues");

          const totalChecks = 8;
          const failedChecks = allIssues.length;
          const score = Math.max(0, Math.round(((totalChecks - Math.min(failedChecks, totalChecks)) / totalChecks) * 100));

          onPageSeo = {
            title: { text: sd.title, length: titleLen, issues: titleIssues },
            metaDescription: { text: sd.metaDescription, length: descLen, issues: descIssues },
            robots: sd.robots,
            h1s: { texts: sd.h1s, count: sd.h1s.length, issues: h1Issues },
            canonical: sd.canonical,
            structuredData: { types: sd.structuredDataTypes, count: sd.structuredDataCount },
            openGraph: { title: sd.ogTitle, description: sd.ogDescription, image: sd.ogImage, type: sd.ogType },
            viewport: sd.viewport,
            score,
            issues: allIssues,
          };
          methodology.push(`On-page SEO extracted: score ${score}/100, ${allIssues.length} issue(s)`);
        }
      } catch (seoProcessErr) {
        methodology.push(`On-page SEO processing failed (${(seoProcessErr as Error).message.slice(0, 60)}), continuing`);
      }

      // Capture mobile screenshot
      mobilePath = await withBrowser("mobile", async (page) => {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
        return captureScreenshot(page, "homepage", "mobile", scanId);
      });
      methodology.push("Captured mobile screenshot");
    } catch (playwrightError) {
      // Playwright failed — try CF Browser Rendering as fallback
      const errMsg = (playwrightError as Error).message;
      console.warn(`[website-technical] Playwright failed: ${errMsg}, trying CF BR...`);
      methodology.push(`Playwright failed (${errMsg.slice(0, 100)}), falling back to CF Browser Rendering`);

      const cfHtml = await cfFetchHtml(url);
      if (!cfHtml) {
        return createErrorEnvelope(primitive, startTime, new Error(
          "Could not assess — site blocked automated access"
        ));
      }

      fullHtml = cfHtml;
      navLinks = [];
      usedCfBr = true;
      methodology.push("CF Browser Rendering returned rendered HTML");

      // Try CF BR screenshot
      const screenshotBuf = await cfFetchScreenshot(url);
      if (screenshotBuf) {
        desktopPath = await uploadScreenshotBuffer(screenshotBuf, scanId, "homepage", "desktop");
        methodology.push("CF Browser Rendering screenshot captured");
      } else {
        desktopPath = null;
        methodology.push("CF Browser Rendering screenshot unavailable");
      }
    }

    // Extract social links from HTML
    const socialLinks = extractSocialLinks(fullHtml);
    const socialLinkCount = Object.keys(socialLinks).length;
    if (socialLinkCount > 0) {
      methodology.push(`Social links extracted: ${Object.keys(socialLinks).join(", ")}`);
    } else {
      methodology.push("No social media links found in homepage HTML");
    }

    // Run PageSpeed Insights in parallel
    const [psiMobile, psiDesktop] = await Promise.all([
      runPageSpeedInsight(url, "mobile").catch(() => null),
      runPageSpeedInsight(url, "desktop").catch(() => null),
    ]);
    if (psiMobile) methodology.push("Google PageSpeed Insights (mobile) collected");
    if (psiDesktop) methodology.push("Google PageSpeed Insights (desktop) collected");

    // Extract top Lighthouse opportunities
    const lighthouseOpportunities = extractLighthouseOpportunities(psiMobile, psiDesktop);
    if (lighthouseOpportunities.length > 0) {
      methodology.push(`Lighthouse opportunities: ${lighthouseOpportunities.length} extracted`);
    }

    // Pre-filter: detect trust signal hints before sending to LLM
    const trustSignalHints = detectTrustSignalHints(fullHtml, navLinks);
    methodology.push(`Pre-filter detected ${trustSignalHints.length} trust signal hint(s)`);

    // Clean HTML before sending to LLM
    const truncatedHtml = cleanHtmlForLlm(fullHtml, 15_000);

    // CRO Analysis with Haiku — enhanced prompt including trust signal hints
    const hintsContext = trustSignalHints.length > 0
      ? `\n\nPRE-FILTER DETECTED THESE TRUST SIGNAL HINTS (confirm or deny each):\n${trustSignalHints.map((h) => `- ${h}`).join("\n")}`
      : "\n\nPRE-FILTER: No obvious trust signal patterns detected in HTML. Look carefully for implicit trust signals (client logos, quote blocks, stats).";

    const navContext = navLinks.length > 0
      ? `\n\nNAVIGATION LINKS FOUND:\n${navLinks.slice(0, 20).map((l) => `- ${l}`).join("\n")}`
      : "";

    const result = await complete("haiku", [
      { role: "user", content: `Analyze this homepage HTML:${hintsContext}${navContext}\n\n${truncatedHtml}` },
    ], {
      system: CRO_ANALYSIS_PROMPT,
      temperature: 0.2,
    });
    methodology.push("Haiku CRO analysis complete (cleaned 15K HTML + trust signal hints + nav links)");

    let analysis: WebsiteTechnicalData["analysis"];
    try {
      analysis = JSON.parse(result.content);
    } catch {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : {
            trustSignals: ["Analysis parsing failed"],
            ctaAnalysis: [],
            aboveFoldContent: [],
            formFriction: [],
            mobileIssues: [],
            navigationUx: [],
            overallGrade: "Unable to grade",
          };
    }

    // Gated content detection — scan HTML for lead magnets
    let gatedContent: WebsiteTechnicalData["gatedContent"] = null;
    try {
      const gatedPatterns = [
        { pattern: /download\s+(your\s+)?free|get\s+(your\s+)?free|grab\s+(the|your)/i, type: "lead magnet" },
        { pattern: /access\s+(the|your)|unlock\s+(the|your)|claim\s+(your)/i, type: "gated resource" },
        { pattern: /get\s+instant\s+access/i, type: "gated resource" },
        { pattern: /free\s+(ebook|e-book|guide|checklist|template|whitepaper|white\s+paper|playbook|toolkit|worksheet|cheat\s+sheet)/i, type: "ebook/guide" },
        { pattern: /download\s+(the\s+)?(ebook|e-book|guide|checklist|template|whitepaper|playbook)/i, type: "ebook/guide" },
        { pattern: /sign\s+up\s+(to|for)\s+(get|receive|access|download)/i, type: "gated signup" },
        { pattern: /webinar|on-demand|watch\s+now.*free/i, type: "webinar" },
      ];
      const types = new Set<string>();
      let count = 0;
      for (const { pattern, type } of gatedPatterns) {
        const matches = truncatedHtml.match(new RegExp(pattern.source, "gi"));
        if (matches) {
          types.add(type);
          count += matches.length;
        }
      }
      if (count > 0) {
        gatedContent = { count, types: [...types] };
        methodology.push(`Gated content detection: ${count} indicator(s) found (${[...types].join(", ")})`);
      } else {
        methodology.push("Gated content detection: no lead magnets or gated resources found");
      }
    } catch {
      // Non-fatal
    }

    // --- Multi-Page Crawl ---
    try {
      if (!usedCfBr && navLinksFull.length > 0) {
        const priorityPatterns: Array<{ pattern: RegExp; type: string; priority: number }> = [
          { pattern: /pricing/i, type: "pricing", priority: 1 },
          { pattern: /contact/i, type: "contact", priority: 2 },
          { pattern: /demo/i, type: "demo", priority: 2 },
          { pattern: /book/i, type: "booking", priority: 2 },
          { pattern: /schedule/i, type: "scheduling", priority: 2 },
          { pattern: /blog/i, type: "blog", priority: 3 },
          { pattern: /resources/i, type: "resources", priority: 3 },
          { pattern: /case.?stud/i, type: "case-studies", priority: 3 },
        ];

        const scored: Array<{ href: string; type: string; priority: number }> = [];
        const seenHrefs = new Set<string>();
        for (const link of navLinksFull) {
          if (!link.href || seenHrefs.has(link.href)) continue;
          try {
            const linkUrl = new URL(link.href);
            const baseUrl = new URL(url);
            if (linkUrl.origin !== baseUrl.origin) continue;
            if (linkUrl.pathname === "/" || linkUrl.pathname === baseUrl.pathname) continue;
          } catch {
            continue;
          }
          for (const pp of priorityPatterns) {
            if (pp.pattern.test(link.href) || pp.pattern.test(link.text)) {
              scored.push({ href: link.href, type: pp.type, priority: pp.priority });
              seenHrefs.add(link.href);
              break;
            }
          }
        }

        scored.sort((a, b) => a.priority - b.priority);
        const pagesToVisit = scored.slice(0, 2);

        if (pagesToVisit.length > 0) {
          const crawledPages = await withBrowser("desktop", async (page) => {
            const results: NonNullable<WebsiteTechnicalData["additionalPages"]> = [];
            const crawlStart = Date.now();

            for (const target of pagesToVisit) {
              if (Date.now() - crawlStart > 20_000) break;

              try {
                await page.goto(target.href, { waitUntil: "domcontentloaded", timeout: 10_000 });

                const pageData = await page.evaluate(() => {
                  const titleEl = document.title || null;
                  const h1El = document.querySelector("h1");
                  const h1Text = h1El?.textContent?.trim() || null;
                  const forms = document.querySelectorAll("form");
                  const formCount = forms.length;

                  const ctaSelectors = [
                    'a[class*="btn"], a[class*="button"], a[class*="cta"]',
                    'button[class*="btn"], button[class*="button"], button[class*="cta"]',
                    'a[href*="demo"], a[href*="trial"], a[href*="signup"], a[href*="contact"]',
                    'input[type="submit"]',
                  ];
                  const ctaTexts: string[] = [];
                  const seenTexts = new Set<string>();
                  for (const sel of ctaSelectors) {
                    document.querySelectorAll(sel).forEach((el) => {
                      const text = (el.textContent?.trim() ?? "").slice(0, 100);
                      if (text && !seenTexts.has(text.toLowerCase())) {
                        ctaTexts.push(text);
                        seenTexts.add(text.toLowerCase());
                      }
                    });
                  }

                  return { title: titleEl, h1: h1Text, formCount, ctaTexts: ctaTexts.slice(0, 10) };
                });

                results.push({
                  url: target.href,
                  type: target.type,
                  title: pageData.title,
                  h1: pageData.h1,
                  formCount: pageData.formCount,
                  ctaTexts: pageData.ctaTexts,
                });
              } catch {
                // Skip silently on failure
              }
            }

            return results;
          });

          if (crawledPages.length > 0) {
            additionalPages = crawledPages;
            methodology.push(`Multi-page crawl: visited ${crawledPages.length} additional page(s) (${crawledPages.map((p) => p.type).join(", ")})`);
          } else {
            methodology.push("Multi-page crawl: all additional page visits failed");
          }
        } else {
          methodology.push("Multi-page crawl: no priority pages found in navigation");
        }
      } else if (usedCfBr) {
        methodology.push("Multi-page crawl: skipped (CF Browser Rendering fallback — no nav links)");
      }
    } catch (multiPageErr) {
      methodology.push(`Multi-page crawl failed (${(multiPageErr as Error).message.slice(0, 60)}), continuing`);
    }

    // Build signals summary with nuanced language
    const signals: string[] = [];

    // Trust signals — nuanced
    if (analysis.trustSignals.length === 0 && trustSignalHints.length === 0) {
      signals.push(absenceSignal("testimonials or social proof", { checked: ["homepage HTML", "navigation links"], method: "HTML pattern match", coverage: "homepage_only" }));
    } else if (analysis.trustSignals.length === 0 && trustSignalHints.length > 0) {
      signals.push(`Trust signal patterns detected in HTML but not prominently displayed (found: ${trustSignalHints.length} hint(s))`);
    }

    // PageSpeed — with source attribution
    if (psiMobile && psiMobile.performanceScore !== null && psiMobile.performanceScore < 0.5) {
      signals.push(`Poor mobile PageSpeed score: ${Math.round(psiMobile.performanceScore * 100)}/100 (per Google PageSpeed Insights)`);
    }
    if (psiDesktop && psiDesktop.performanceScore !== null && psiDesktop.performanceScore < 0.5) {
      signals.push(`Poor desktop PageSpeed score: ${Math.round(psiDesktop.performanceScore * 100)}/100 (per Google PageSpeed Insights)`);
    }
    if (psiMobile?.lcp && psiMobile.lcp > 4000) {
      signals.push(`Very slow LCP on mobile: ${(psiMobile.lcp / 1000).toFixed(1)}s (per Google PageSpeed Insights)`);
    }

    // Accessibility scores
    if (psiMobile?.accessibilityScore != null && psiMobile.accessibilityScore < 0.7) {
      signals.push(`Poor accessibility score: ${Math.round(psiMobile.accessibilityScore * 100)}/100 (per Google PageSpeed Insights, mobile) — likely has conversion-impacting UX issues`);
    }
    if (psiDesktop?.accessibilityScore != null && psiDesktop.accessibilityScore < 0.7) {
      signals.push(`Poor accessibility score: ${Math.round(psiDesktop.accessibilityScore * 100)}/100 (per Google PageSpeed Insights, desktop) — likely has conversion-impacting UX issues`);
    }

    // On-page SEO signals
    if (onPageSeo) {
      if (onPageSeo.score < 50) {
        signals.push(`On-page SEO score: ${onPageSeo.score}/100 — ${onPageSeo.issues.length} issues found (${onPageSeo.issues.slice(0, 3).join("; ")})`);
      } else if (onPageSeo.issues.length > 0) {
        signals.push(`On-page SEO has ${onPageSeo.issues.length} issue(s): ${onPageSeo.issues.slice(0, 3).join("; ")}`);
      }
      if (onPageSeo.structuredData.count === 0) {
        signals.push(absenceSignal("structured data (JSON-LD)", { checked: ["homepage HTML"], method: "HTML pattern match", coverage: "homepage_only" }, "missing rich snippet opportunities"));
      }
    }

    // Popup email capture signals
    if (popupForms.length > 0) {
      signals.push(`${popupForms.length} behavioral popup email capture form(s) detected (${popupForms.map((p) => p.trigger).join(", ")})`);
    }

    // Gated content signals
    if (gatedContent && gatedContent.count > 0) {
      signals.push(`${gatedContent.count} gated lead magnet indicator(s) detected (${gatedContent.types.join(", ")})`);
    } else if (!gatedContent || gatedContent.count === 0) {
      signals.push(absenceSignal("gated content (ebooks, checklists, templates)", { checked: ["homepage HTML"], method: "HTML pattern match", coverage: "homepage_only" }, "missing mid-funnel capture"));
    }

    // Multi-page crawl signals
    if (additionalPages && additionalPages.length > 0) {
      const pricingPage = additionalPages.find((p) => p.type === "pricing");
      if (pricingPage) {
        const hasContactSalesCta = pricingPage.ctaTexts.some((t) =>
          /contact\s+sales|talk\s+to\s+sales|get\s+a\s+quote|request\s+(a\s+)?quote/i.test(t)
        );
        const tierCount = pricingPage.ctaTexts.filter((t) =>
          /start|buy|subscribe|choose|select|get\s+started|sign\s+up|try/i.test(t)
        ).length;
        if (hasContactSalesCta && tierCount === 0) {
          signals.push('Pricing page exists but requires "Contact Sales" — no transparent pricing');
        } else if (tierCount > 0) {
          signals.push(`Pricing page found with ${tierCount} tier(s) displayed`);
        } else {
          signals.push("Pricing page found");
        }
      } else {
        const hasPricingInNav = navLinksFull.some((l) => /pricing/i.test(l.text) || /pricing/i.test(l.href));
        if (!hasPricingInNav) {
          signals.push(absenceSignal("a pricing page", { checked: ["navigation links"], method: "HTML pattern match", coverage: "homepage_only" }));
        }
      }

      const contactPage = additionalPages.find((p) => ["contact", "demo", "booking", "scheduling"].includes(p.type));
      if (contactPage && contactPage.formCount > 0) {
        signals.push(`Contact/demo form found on ${contactPage.type} page with ${contactPage.formCount} form(s)`);
      }
    } else if (!usedCfBr) {
      const hasPricingInNav = navLinksFull.some((l) => /pricing/i.test(l.text) || /pricing/i.test(l.href));
      if (!hasPricingInNav && navLinksFull.length > 0) {
        signals.push(absenceSignal("a pricing page", { checked: ["navigation links"], method: "HTML pattern match", coverage: "homepage_only" }));
      }
    }

    const confidence = calculateTechnicalConfidence(psiMobile, psiDesktop, analysis, usedCfBr, onPageSeo, additionalPages);

    return createEnvelope<WebsiteTechnicalData>(primitive, startTime, {
      screenshots: { desktopPath, mobilePath },
      pagespeed: { mobile: psiMobile, desktop: psiDesktop, lighthouseOpportunities },
      analysis,
      fullPageHtml: fullHtml,
      socialLinks,
      onPageSeo,
      additionalPages,
      popupEmailCapture: popupForms,
      gatedContent,
      formFrictionDetails,
      trustSignalHints,
      signals,
      methodology,
    }, {
      confidence,
      confidenceFactors: [
        usedCfBr ? "CF Browser Rendering fallback (reduced fidelity)" : "Playwright screenshot captured",
        usedCfBr ? "No full-page scroll (CF BR limitation)" : "Full page scrolled for lazy-loaded content",
        psiMobile ? "Mobile PageSpeed data" : "Mobile PageSpeed failed",
        psiDesktop ? "Desktop PageSpeed data" : "Desktop PageSpeed failed",
        "Haiku CRO analysis complete (15K HTML)",
        `${trustSignalHints.length} trust signal hints pre-detected`,
        onPageSeo ? `On-page SEO: ${onPageSeo.score}/100` : "On-page SEO extraction failed or skipped",
        additionalPages ? `Multi-page crawl: ${additionalPages.length} page(s)` : "Multi-page crawl skipped or failed",
        socialLinkCount > 0 ? `Social links: ${Object.keys(socialLinks).join(", ")}` : "No social links found",
        lighthouseOpportunities.length > 0 ? `${lighthouseOpportunities.length} Lighthouse opportunities` : "No Lighthouse opportunities extracted",
      ],
      model: getModelName("haiku"),
      tokensUsed: result.usage.inputTokens + result.usage.outputTokens,
      costUsd: result.usage.cost,
    });
  } catch (error) {
    return createErrorEnvelope(primitive, startTime, error);
  }
}
