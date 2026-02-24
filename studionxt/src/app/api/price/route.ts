import { NextRequest, NextResponse } from 'next/server';
import { calculatePrice, simpleModeInputs, formatCurrency, getConfidenceLevel, PricingInputs, CareerStage, SalesContext } from '@/lib/pricing';

const MOCK_MODE = true;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, artwork, userId = 'demo-user', inputs } = body;

    // Auto mode: fetch pricing settings from Firestore
    let pricingSettings: any = {};
    try {
      const { db } = await import('@/lib/firebase-admin');
      const snap = await db.doc(`artists/${userId}/settings/pricing`).get();
      if (snap.exists) pricingSettings = snap.data();
    } catch {
      // Firebase admin not configured — use defaults
      pricingSettings = {};
    }

    const careerStage = (pricingSettings.careerStage || 'Emerging') as CareerStage;
    const salesContext = (pricingSettings.primaryMarket || 'RegionalGallery') as SalesContext;
    const hourlyRate = parseFloat(pricingSettings.hourlyRate) || 50;
    const galleryCommission = parseFloat(pricingSettings.galleryCommission) || 50;

    let pricingInputs: PricingInputs;

    if (mode === 'auto' || mode === 'simple') {
      pricingInputs = simpleModeInputs({
        medium: artwork.medium || 'Mixed Media',
        width: parseFloat(artwork.width) || 24,
        height: parseFloat(artwork.height) || 36,
        depth: artwork.depth ? parseFloat(artwork.depth) : undefined,
        careerStage,
        salesContext,
        hourlyRate,
      });
      pricingInputs.galleryCommissionPercent = galleryCommission;
    } else {
      pricingInputs = { ...inputs, careerStage, salesContext } as PricingInputs;
    }

    const result = calculatePrice(pricingInputs);
    const confidence = getConfidenceLevel(pricingInputs);

    // Build three reasons
    const reasons = [
      `At ${artwork.width || '?'}×${artwork.height || '?'} inches, this is a ${Number((parseFloat(artwork.width||'24') * parseFloat(artwork.height||'36'))).toFixed(0)} sq in work — the size multiplier of ${result.sizeMultiplier}× reflects its physical presence.`,
      `As a ${careerStage.replace('MidCareer','mid-career').replace('MuseumLevel','museum-level').replace('BlueChip','blue chip')} artist, the career multiplier of ${result.careerMultiplier}× positions this work correctly in the ${salesContext.replace('RegionalGallery','regional gallery').replace('InternationalFair','international fair').replace('GlobalMarket','global market').replace('StudioSale','studio sale')} context.`,
      `After a ${galleryCommission}% gallery commission, you would receive ${formatCurrency(result.artistNet)} — a ${result.profitMarginPercent}% margin on your investment.`,
    ];

    let miraExplanation = '';
    if (MOCK_MODE) {
      miraExplanation = `${formatCurrency(result.adjustedRetailPrice)} is a well-supported price for this work. The insurance value of ${formatCurrency(result.insuranceValue)} accounts for the materials and scale. If this work enters the secondary market, expect it to trade around ${formatCurrency(result.secondaryEstimate)}.`;
    } else {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic();
      const msg = await client.messages.create({
        model: 'claude-opus-4-5', max_tokens: 200,
        messages: [{ role: 'user', content: `You are Mira, a studio assistant for artists. In 2-3 sentences, explain this valuation warmly and give the artist confidence to use this price. Artwork: "${artwork.title}", ${artwork.medium}. Retail: ${formatCurrency(result.adjustedRetailPrice)}. Insurance: ${formatCurrency(result.insuranceValue)}. Secondary: ${formatCurrency(result.secondaryEstimate)}.` }],
      });
      miraExplanation = (msg.content[0] as any).text;
    }

    return NextResponse.json({
      result,
      confidence,
      reasons,
      miraExplanation,
      pricingSettings: { careerStage, salesContext, galleryCommission },
      formatted: {
        retail: formatCurrency(result.adjustedRetailPrice),
        insurance: formatCurrency(result.insuranceValue),
        secondary: formatCurrency(result.secondaryEstimate),
        artistNet: formatCurrency(result.artistNet),
        baseCost: formatCurrency(result.baseCost),
        profit: formatCurrency(result.profit),
      },
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Valuation engine error' }, { status: 500 });
  }
}
