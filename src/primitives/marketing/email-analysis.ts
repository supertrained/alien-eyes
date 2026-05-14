import { createEnvelope, createErrorEnvelope, type Envelope } from "@marketing/envelope";
import { withBrowser, randomDelay } from "@marketing/browser-pool";
import { captureScreenshot } from "@marketing/screenshots";
import { createInbox, getEmails, deleteInbox } from "@marketing/agentmail";
import { complete, getModelName } from "@marketing/models";
import { createClient } from "@supabase/supabase-js";
import { checkEmailAuthentication, type EmailAuthResult } from "@marketing/email-auth";
import { absenceSignal } from "@marketing/signal-builder";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// EmailAuthResult is now imported from ../lib/email-auth.js
export type { EmailAuthResult } from "@marketing/email-auth";

export interface EmailFormData {
  formFound: boolean;
  formCount: number;
  platformDetected: string | null;
  fieldCount: number;
  formTypes: string[];
  screenshotPath: string | null;
  inboxId: string | null;
  inboxEmail: string | null;
  signals: string[];
  emailAuth: EmailAuthResult | null;
  emailAuthMaturityScore: number | null;
  popupForms: {
    count: number;
    hasExitIntent: boolean;
    hasStickyBar: boolean;
    types: string[];
  };
  captureScore: {
    score: number;
    maxScore: number;
    factors: string[];
  };
}

export interface EmailSequenceData {
  emailsReceived: number;
  emails: Array<{
    subject: string;
    from: string;
    receivedAt: string;
    hasUnsubscribe: boolean;
    wordCount: number;
  }>;
  sequenceAnalysis: string | null;
  signals: string[];
}

// Email platform detection from form actions and loaded scripts
const EMAIL_PLATFORM_PATTERNS: Record<string, RegExp[]> = {
  mailchimp: [/list-manage\.com/i, /chimpstatic\.com/i, /mc-embedded/i],
  klaviyo: [/klaviyo\.com/i, /manage\.kmail/i],
  hubspot: [/forms\.hubspot\.com/i, /hs-scripts\.com/i],
  convertkit: [/convertkit\.com/i, /ck\.page/i, /kit\.com\/embed/i],
  activecampaign: [/activecampaign\.com/i, /trackcmp\.net/i],
  mailerlite: [/mailerlite\.com/i, /ml-form/i],
  drip: [/getdrip\.com/i],
  beehiiv: [/beehiiv\.com/i],
  substack: [/substack\.com/i, /substackapi\.com/i],
  sendinblue: [/sibforms\.com/i, /sendinblue\.com/i, /brevo\.com/i],
  constantcontact: [/constantcontact\.com/i],
  flodesk: [/flodesk\.com/i],
  sendfox: [/sendfox\.com/i],
  buttondown: [/buttondown\.email/i],
  ghost: [/ghost\.io.*subscribe/i],
  typeform: [/typeform\.com/i],
  jotform: [/jotform\.com/i],
  paperform: [/paperform\.co/i],
  calendly: [/calendly\.com/i],
  omnisend: [/omnisend\.com/i],
  moosend: [/moosend\.com/i],
};

// checkEmailAuthentication is now imported from ../lib/email-auth.js

export async function runEmailAnalysis(
  url: string,
  scanId: string,
  observationOnly = false
): Promise<Envelope<EmailFormData | null>> {
  const startTime = Date.now();
  const primitive = "email_analysis";

  try {
    // Extract domain for DNS checks
    const domain = new URL(url).hostname;

    // Run DNS email authentication check in parallel with browser analysis (10s timeout)
    const emailAuthPromise: Promise<EmailAuthResult | null> = Promise.race([
      checkEmailAuthentication(domain).catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000)),
    ]);

    const browserPromise = withBrowser("desktop", async (page) => {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      await randomDelay(1000, 2000);

      const html = await page.content();

      // Detect email platform from page source
      let platformDetected: string | null = null;
      for (const [platform, patterns] of Object.entries(EMAIL_PLATFORM_PATTERNS)) {
        if (patterns.some((p) => p.test(html))) {
          platformDetected = platform;
          break;
        }
      }

      // Find email forms
      const formInfo = await page.evaluate(() => {
        const forms = Array.from(document.querySelectorAll("form"));
        const emailInputs = Array.from(
          document.querySelectorAll('input[type="email"], input[name*="email"], input[placeholder*="email" i]')
        );

        // Find forms containing email inputs
        const emailForms = forms.filter((form) => {
          const formHtml = form.innerHTML.toLowerCase();
          return (
            form.querySelector('input[type="email"]') !== null ||
            formHtml.includes("subscribe") ||
            formHtml.includes("signup") ||
            formHtml.includes("sign up") ||
            formHtml.includes("newsletter") ||
            formHtml.includes("email")
          );
        });

        // Count fields in the first email form
        const firstForm = emailForms[0];
        const fieldCount = firstForm
          ? firstForm.querySelectorAll("input:not([type=hidden]):not([type=submit])").length
          : 0;

        // Determine form types
        const formTypes: string[] = [];
        for (const form of emailForms) {
          const formText = form.textContent?.toLowerCase() ?? "";
          if (formText.includes("newsletter")) formTypes.push("newsletter");
          else if (formText.includes("subscribe")) formTypes.push("subscribe");
          else if (formText.includes("contact")) formTypes.push("contact");
          else if (formText.includes("demo") || formText.includes("trial")) formTypes.push("demo/trial");
          else formTypes.push("email-capture");
        }

        return {
          formFound: emailForms.length > 0 || emailInputs.length > 0,
          formCount: Math.max(emailForms.length, emailInputs.length > 0 ? 1 : 0),
          fieldCount,
          formTypes: [...new Set(formTypes)],
        };
      });

      // Detect popup/overlay forms (not just inline forms)
      const popupInfo = await page.evaluate(() => {
        const popupSelectors = [
          // OptinMonster
          '[class*="om-"], [id*="om-"]',
          // Sumo
          '[class*="sumome"], [id*="sumo"]',
          // Hello Bar
          '[class*="hellobar"]',
          // Privy
          '[class*="privy"]',
          // Sleeknote
          '[class*="sleeknote"]',
          // Wisepops
          '[class*="wisepops"]',
          // Generic popup/modal with email
          '[class*="popup"] input[type="email"]',
          '[class*="modal"] input[type="email"]',
          '[class*="overlay"] input[type="email"]',
          // Sticky bars
          '[class*="sticky-bar"], [class*="notification-bar"], [class*="announcement-bar"]',
          // Exit intent
          '[data-exit-intent], [class*="exit-intent"], [class*="exit_intent"]',
        ];

        let popupFormCount = 0;
        let hasExitIntent = false;
        let hasStickyBar = false;
        const popupTypes: string[] = [];

        for (const selector of popupSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            if (selector.includes("exit-intent") || selector.includes("exit_intent")) {
              hasExitIntent = true;
              popupTypes.push("exit-intent");
            } else if (selector.includes("sticky-bar") || selector.includes("notification-bar") || selector.includes("announcement-bar")) {
              hasStickyBar = true;
              popupTypes.push("sticky-bar");
            } else {
              popupFormCount += elements.length;
              // Identify which tool
              if (selector.includes("om-")) popupTypes.push("optinmonster");
              else if (selector.includes("sumo")) popupTypes.push("sumo");
              else if (selector.includes("hellobar")) popupTypes.push("hellobar");
              else if (selector.includes("privy")) popupTypes.push("privy");
              else if (selector.includes("sleeknote")) popupTypes.push("sleeknote");
              else if (selector.includes("wisepops")) popupTypes.push("wisepops");
              else popupTypes.push("modal-popup");
            }
          }
        }

        // Check for scroll-triggered elements (delayed popups)
        const hasScrollTrigger = !!document.querySelector('[data-scroll-trigger], [class*="scroll-trigger"], [data-show-after]');
        if (hasScrollTrigger) {
          popupTypes.push("scroll-trigger");
        }

        // Check for timed popups
        const pageSource = document.documentElement.outerHTML;
        const hasTimedPopup = /setTimeout.*popup|setTimeout.*modal|delay.*popup|after.*seconds.*show/i.test(pageSource.slice(0, 50000));
        if (hasTimedPopup) {
          popupTypes.push("timed-popup");
        }

        return {
          popupFormCount,
          hasExitIntent,
          hasStickyBar,
          hasScrollTrigger,
          popupTypes: [...new Set(popupTypes)],
        };
      });

      // Take screenshot if form found
      let screenshotPath: string | null = null;
      if (formInfo.formFound) {
        try {
          screenshotPath = await captureScreenshot(page, "email-form", "desktop", scanId);
        } catch {
          // Optional
        }
      }

      // Try to sign up with a disposable email (Phase 1 trigger for Phase 2)
      // Only when deep analysis is enabled — observation mode skips form submission
      let inboxId: string | null = null;
      let inboxEmail: string | null = null;

      if (formInfo.formFound && !observationOnly) {
        try {
          const inbox = await createInbox();
          inboxId = inbox.id;
          inboxEmail = inbox.email;

          // Try to fill the first email input
          const emailInput = await page.$('input[type="email"], input[name*="email"], input[placeholder*="email" i]');
          if (emailInput) {
            await emailInput.fill(inbox.email);
            await randomDelay(300, 800);

            // Try to find and fill a name field if present
            const nameInput = await page.$('input[name*="name" i]:not([name*="email"]), input[placeholder*="name" i]:not([placeholder*="email"])');
            if (nameInput) {
              await nameInput.fill("Alex Thompson");
              await randomDelay(200, 500);
            }

            // Try to submit the form
            const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Subscribe"), button:has-text("Sign Up"), button:has-text("Get"), button:has-text("Join")');
            if (submitBtn) {
              await submitBtn.click();
              await randomDelay(2000, 3000);
            }
          }
        } catch {
          // Form submission is best-effort
          // Clean up inbox if signup failed
          if (inboxId) {
            try { await deleteInbox(inboxId); } catch {}
            inboxId = null;
            inboxEmail = null;
          }
        }
      }

      return {
        ...formInfo,
        platformDetected,
        screenshotPath,
        inboxId,
        inboxEmail,
        popupInfo,
        html,
      };
    });

    // Await both browser analysis and DNS check in parallel
    const [formData, emailAuth] = await Promise.all([browserPromise, emailAuthPromise]);

    // Build signals
    const signals: string[] = [];
    if (!formData.formFound) {
      signals.push(absenceSignal("an email signup form", { checked: ["homepage DOM"], method: "Playwright", coverage: "homepage_only" }));
    } else {
      if (formData.fieldCount > 3) {
        signals.push(`High form friction: ${formData.fieldCount} fields (best practice: 1-2)`);
      }
      if (formData.platformDetected) {
        signals.push(`Email platform: ${formData.platformDetected}`);
      } else {
        signals.push("Email form found but no recognized email platform detected");
      }
    }

    // Popup signals
    if (formData.popupInfo.popupFormCount > 0) {
      signals.push(`${formData.popupInfo.popupFormCount} popup/overlay email capture form(s) detected`);
    }
    if (formData.popupInfo.hasExitIntent) {
      signals.push("Exit-intent popup detected — captures leaving visitors");
    }
    if (formData.popupInfo.hasStickyBar) {
      signals.push("Sticky notification/announcement bar detected — persistent capture point");
    }
    if (!formData.popupInfo.hasExitIntent && formData.formFound) {
      signals.push("No exit-intent popup — missing opportunity to capture 10-15% of abandoning visitors");
    }

    // Email capture experience scoring (0-100)
    let captureScore = 0;
    const captureFactors: string[] = [];

    // Capture points (max 30 pts)
    const totalCapturePoints = formData.formCount + formData.popupInfo.popupFormCount;
    if (totalCapturePoints === 0) {
      captureFactors.push("No email capture points found (0/30)");
    } else if (totalCapturePoints === 1) {
      captureScore += 10;
      captureFactors.push("Single capture point (10/30)");
    } else if (totalCapturePoints === 2) {
      captureScore += 20;
      captureFactors.push("Two capture points (20/30)");
    } else {
      captureScore += 30;
      captureFactors.push(`${totalCapturePoints} capture points (30/30)`);
    }

    // Popup strategy (max 25 pts)
    if (formData.popupInfo.hasExitIntent) {
      captureScore += 15;
      captureFactors.push("Exit-intent popup (15/25)");
    }
    if (formData.popupInfo.hasStickyBar) {
      captureScore += 10;
      captureFactors.push("Sticky notification bar (10/25)");
    }

    // Platform sophistication (max 20 pts)
    if (formData.platformDetected) {
      captureScore += 20;
      captureFactors.push(`Professional email platform: ${formData.platformDetected} (20/20)`);
    } else if (formData.formFound) {
      captureScore += 5;
      captureFactors.push("Form found but no recognized platform (5/20)");
    }

    // Low friction (max 15 pts)
    if (formData.formFound) {
      if (formData.fieldCount <= 2) {
        captureScore += 15;
        captureFactors.push(`Low friction: ${formData.fieldCount} fields (15/15)`);
      } else if (formData.fieldCount <= 4) {
        captureScore += 8;
        captureFactors.push(`Moderate friction: ${formData.fieldCount} fields (8/15)`);
      } else {
        captureFactors.push(`High friction: ${formData.fieldCount} fields (0/15)`);
      }
    }

    // Incentive detection (max 10 pts)
    const hasIncentive = /discount|coupon|free|download|ebook|guide|checklist|template|webinar|% off|\$\d+/i.test(formData.html.slice(0, 100000));
    if (hasIncentive) {
      captureScore += 10;
      captureFactors.push("Incentive/lead magnet detected (10/10)");
    }

    // Capture score signal
    signals.push(`Email capture score: ${captureScore}/100 (${captureScore >= 70 ? "strong" : captureScore >= 40 ? "adequate" : "weak"})`);

    // Email authentication signals
    if (emailAuth) {
      if (!emailAuth.spf.found) {
        signals.push("No SPF record — domain is vulnerable to email spoofing");
      }
      if (emailAuth.spf.found && emailAuth.dmarc.found && emailAuth.dmarc.policy === "none") {
        signals.push("SPF present but DMARC policy is 'none' — no enforcement, spoofing still possible");
      }
      if (!emailAuth.dmarc.found) {
        signals.push("No DMARC record — only 7.6% of domains enforce DMARC, but this leaves the domain unprotected");
      }
      if (emailAuth.dmarc.found && emailAuth.dmarc.policy === "reject") {
        signals.push("DMARC policy: reject — strong email authentication");
      }
      if (!emailAuth.bimi.found) {
        signals.push("BIMI not configured — missing inbox brand logo opportunity");
      }
      if (emailAuth.mx.found && emailAuth.mx.provider) {
        signals.push(`MX records point to ${emailAuth.mx.provider} — professional email infrastructure`);
      }
      if (!emailAuth.mx.found) {
        signals.push("No MX records found — domain may not receive email");
      }
    }

    // B12: Email Auth Maturity Score
    let emailAuthMaturityScore: number | null = null;
    if (emailAuth) {
      let score = 0;
      const scoreParts: string[] = [];

      if (emailAuth.spf.found) {
        score += 20;
        scoreParts.push("SPF");
      }
      if (emailAuth.dkim.found) {
        score += 20;
        scoreParts.push("DKIM");
      }
      if (emailAuth.dmarc.found) {
        score += 20;
        if (emailAuth.dmarc.policy === "reject") {
          score += 15;
          scoreParts.push("DMARC reject");
        } else if (emailAuth.dmarc.policy === "quarantine") {
          score += 10;
          scoreParts.push("DMARC quarantine");
        } else if (emailAuth.dmarc.policy === "none") {
          score += 5;
          scoreParts.push("DMARC none");
        } else {
          scoreParts.push("DMARC");
        }
      }
      if (emailAuth.bimi.found) {
        score += 10;
        scoreParts.push("BIMI");
      }
      if (emailAuth.mx.found) {
        score += 5;
      }
      // Bonus for having all three core auth mechanisms
      if (emailAuth.spf.found && emailAuth.dkim.found && emailAuth.dmarc.found) {
        score += 10;
      }

      emailAuthMaturityScore = Math.min(score, 100);
      signals.push(
        `Email authentication maturity: ${emailAuthMaturityScore}/100 (${scoreParts.join(" + ")})`
      );
    }

    // If we created an inbox, store it for Phase 2 polling
    if (formData.inboxId) {
      await supabase.from("primitive_results").upsert({
        scan_id: scanId,
        primitive: "email_analysis",
        status: "pending",
        data: {
          type: "inbox",
          inboxId: formData.inboxId,
          inboxEmail: formData.inboxEmail,
          subscribedAt: new Date().toISOString(),
        },
      });
    }

    return createEnvelope<EmailFormData>(primitive, startTime, {
      formFound: formData.formFound,
      formCount: formData.formCount,
      platformDetected: formData.platformDetected,
      fieldCount: formData.fieldCount,
      formTypes: formData.formTypes,
      screenshotPath: formData.screenshotPath,
      inboxId: formData.inboxId,
      inboxEmail: formData.inboxEmail,
      signals,
      emailAuth,
      emailAuthMaturityScore,
      popupForms: {
        count: formData.popupInfo.popupFormCount,
        hasExitIntent: formData.popupInfo.hasExitIntent,
        hasStickyBar: formData.popupInfo.hasStickyBar,
        types: formData.popupInfo.popupTypes,
      },
      captureScore: {
        score: captureScore,
        maxScore: 100,
        factors: captureFactors,
      },
    }, {
      confidence: formData.formFound ? 0.8 : 0.6,
      confidenceFactors: [
        formData.formFound ? "Email form detected" : "No email form found",
        formData.platformDetected ? `Platform: ${formData.platformDetected}` : "No platform detected",
        observationOnly ? "Observation only (no signup)" : (formData.inboxId ? "Test subscription created" : "No test subscription"),
        emailAuth ? "DNS email auth checked" : "DNS email auth unavailable",
      ],
    });
  } catch (error) {
    return createErrorEnvelope(primitive, startTime, error);
  }
}

// Phase 2: Called by email-poll-queue worker to check inbox
export async function pollInbox(
  scanId: string,
  inboxId: string
): Promise<void> {
  try {
    const emails = await getEmails(inboxId);

    if (emails.length === 0) return; // No new emails yet

    // Analyze received emails with Sonnet
    const emailSummaries = emails.map((e) => ({
      subject: e.subject,
      from: e.from,
      receivedAt: e.receivedAt,
      bodyPreview: e.body.slice(0, 500),
    }));

    const result = await complete("sonnet", [
      {
        role: "user",
        content: `Analyze this email sequence received after signing up on a website. What can we learn about their email marketing?

Emails received:
${JSON.stringify(emailSummaries, null, 2)}

Provide analysis of:
1. Welcome sequence quality (timing, personalization, value)
2. Email marketing sophistication
3. Notable strengths or weaknesses
4. Any red flags (broken links, poor formatting, spam indicators)

Keep it concise (under 200 words).`,
      },
    ]);

    const sequenceData: EmailSequenceData = {
      emailsReceived: emails.length,
      emails: emails.map((e) => ({
        subject: e.subject,
        from: e.from,
        receivedAt: e.receivedAt,
        hasUnsubscribe: /unsubscribe/i.test(e.html || e.body),
        wordCount: e.body.split(/\s+/).length,
      })),
      sequenceAnalysis: result.content,
      signals: [],
    };

    // Generate signals
    if (emails.length === 0) {
      sequenceData.signals.push("No welcome email received — poor first impression");
    } else {
      const firstEmail = emails[0];
      const timeSinceSubscribe = Date.now() - new Date(firstEmail.receivedAt).getTime();
      if (timeSinceSubscribe < 60_000) {
        sequenceData.signals.push("Instant welcome email — good automation");
      } else if (timeSinceSubscribe < 3600_000) {
        sequenceData.signals.push("Welcome email within 1 hour");
      } else {
        sequenceData.signals.push("Slow welcome email (>1 hour) — automation may be basic");
      }
    }

    // Update the primitive result in DB
    await supabase.from("primitive_results").upsert({
      scan_id: scanId,
      primitive: "email_analysis",
      status: "success",
      data: { type: "sequence", ...sequenceData },
      confidence: 0.75,
    });

    // Clean up inbox if we have enough data (>48h or >5 emails)
    const { data: inboxData } = await supabase
      .from("primitive_results")
      .select("data")
      .eq("scan_id", scanId)
      .eq("primitive", "email_analysis")
      .single();

    if (inboxData?.data) {
      const subscribedAt = new Date((inboxData.data as Record<string, unknown>).subscribedAt as string).getTime();
      const hoursSinceSubscribe = (Date.now() - subscribedAt) / (1000 * 60 * 60);

      if (hoursSinceSubscribe > 48 || emails.length >= 5) {
        // Best-effort unsubscribe before deleting inbox
        try {
          await attemptUnsubscribe(emails);
        } catch (unsErr) {
          console.warn(`Unsubscribe attempt failed for scan ${scanId}:`, unsErr);
        }
        await deleteInbox(inboxId);
        await supabase.from("primitive_results").update({
          status: "success",
        }).eq("scan_id", scanId).eq("primitive", "email_analysis");
      }
    }
  } catch (error) {
    console.error(`Email poll failed for scan ${scanId}:`, error);
  }
}

/** Best-effort unsubscribe: find unsubscribe link in the most recent email and navigate to it. */
async function attemptUnsubscribe(
  emails: Array<{ html?: string; body: string }>
): Promise<void> {
  // Find the last email with an unsubscribe link
  for (let i = emails.length - 1; i >= 0; i--) {
    const content = emails[i].html || emails[i].body;
    const match = content.match(/href=["']([^"']*unsubscribe[^"']*)["']/i);
    if (match?.[1]) {
      const unsubUrl = match[1];
      try {
        await withBrowser("desktop", async (page) => {
          await page.goto(unsubUrl, { waitUntil: "domcontentloaded", timeout: 15_000 });
          await randomDelay(1000, 2000);
          // Try to click a confirm button if one exists
          const confirmBtn = await page.$(
            'button:has-text("Unsubscribe"), button:has-text("Confirm"), input[type="submit"]'
          );
          if (confirmBtn) {
            await confirmBtn.click();
            await randomDelay(1000, 2000);
          }
        });
        console.log(`Unsubscribed via: ${unsubUrl}`);
      } catch {
        console.warn(`Failed to navigate unsubscribe URL: ${unsubUrl}`);
      }
      return; // Only attempt once
    }
  }
}
