import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// --- Validation Schema ---

const surveyPayloadSchema = z.object({
  locale: z.enum(['vi', 'en']),
  page: z.enum(['home', 'chat']),
  experienceRating: z
    .enum(['love', 'good', 'neutral', 'needsImprovement'])
    .nullable(),
  willingness: z.enum(['yes', 'maybe', 'no']).nullable(),
  pricingModel: z.enum(['monthly', 'yearly', 'lifetime']).nullable(),
  priceRange: z.string().nullable(),
  feedback: z.string().max(1000).nullable(),
  usageCount: z.number().int().min(0)
});

type SurveyPayload = z.infer<typeof surveyPayloadSchema>;

// --- Rate limiting (simple in-memory, per-deployment) ---

const recentSubmissions = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(identifier: string): boolean {
  const lastSubmission = recentSubmissions.get(identifier);
  if (!lastSubmission) return false;
  return Date.now() - lastSubmission < RATE_LIMIT_WINDOW_MS;
}

function recordSubmission(identifier: string): void {
  recentSubmissions.set(identifier, Date.now());

  // Cleanup old entries periodically
  if (recentSubmissions.size > 10000) {
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
    recentSubmissions.forEach((time, key) => {
      if (time < cutoff) recentSubmissions.delete(key);
    });
  }
}

// --- POST Handler ---

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'Rate limited. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const parseResult = surveyPayloadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payload',
          details: parseResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const payload: SurveyPayload = parseResult.data;

    // Get the Google Apps Script webhook URL
    const webhookUrl = process.env.SURVEY_SHEET_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error(
        '[Survey] SURVEY_SHEET_WEBHOOK_URL is not configured in .env'
      );
      return NextResponse.json(
        { success: false, error: 'Survey service not configured' },
        { status: 503 }
      );
    }

    // Build the row data for Google Sheet
    const sheetData = {
      timestamp: new Date().toISOString(),
      locale: payload.locale,
      page: payload.page,
      experienceRating: payload.experienceRating || '',
      willingness: payload.willingness || '',
      pricingModel: payload.pricingModel || '',
      priceRange: payload.priceRange || '',
      feedback: payload.feedback || '',
      usageCount: payload.usageCount,
      userAgent: request.headers.get('user-agent') || ''
    };

    // Send to Google Apps Script Web App
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sheetData),
      signal: AbortSignal.timeout(10000) // 10s timeout
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text().catch(() => 'Unknown');
      console.error('[Survey] Webhook failed:', {
        status: webhookResponse.status,
        body: errorText
      });
      return NextResponse.json(
        { success: false, error: 'Failed to record survey response' },
        { status: 502 }
      );
    }

    // Record successful submission for rate limiting
    recordSubmission(ip);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Survey] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
