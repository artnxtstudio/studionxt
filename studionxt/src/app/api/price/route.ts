import { NextRequest, NextResponse } from 'next/server';
import { calculatePrice, simpleModeInputs, formatCurrency, getConfidenceLevel, PricingInputs, CareerStage, SalesContext } from '@/lib/pricing';

const MOCK_MODE = true;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, artwork, artistProfile, inputs } = body;
    let pricingInputs: PricingInputs;
    if (mode === 'simple') {
      pricingInputs = simpleModeInputs({
        medium: artwork.medium || 'Mixed Media',
        width: parseFloat(artwork.width) || 24,
        height: parseFloat(artwork.height) || 36,
        depth: artwork.depth ? parseFloat(artwork.depth) : undefined,
        careerStage: (artistProfile?.careerStage || 'Emerging') as CareerStage,
        salesContext: (inputs?.salesContext || 'RegionalGallery') as SalesContext,
        hourlyRate: artistProfile?.hourlyRate || 50,
      });
    } else {
      pricingInputs = inputs as PricingInputs;
    }
    const result = calculatePrice(pricingInputs);
    const confidence = getConfidenceLevel(pricingInputs);
    let miraExplanation = '';
    if (MOCK_MODE) {
      miraExplanation = `Based on your career stage and the scale of this work, ${formatCurrency(result.adjustedRetailPrice)} is a well-supported price. Your production costs represent ${Math.round((result.baseCost/result.adjustedRetailPrice)*100)}% of the retail price, leaving a healthy margin of ${result.profitMarginPercent}%. For insurance, declare ${formatCurrency(result.insuranceValue)} — this accounts for replacement complexity. If this work enters the secondary market, expect it to trade around ${formatCurrency(result.secondaryEstimate)}.`;
    } else {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic();
      const msg = await client.messages.create({
        model: 'claude-opus-4-5', max_tokens: 300,
        messages: [{ role: 'user', content: `You are Mira, a studio assistant. Explain this artwork valuation in 3-4 warm, professional sentences. Give the artist confidence.\n\nArtwork: "${artwork.title}", ${artwork.medium}\nRetail: ${formatCurrency(result.adjustedRetailPrice)}\nInsurance: ${formatCurrency(result.insuranceValue)}\nSecondary: ${formatCurrency(result.secondaryEstimate)}\nMargin: ${result.profitMarginPercent}%` }],
      });
      miraExplanation = (msg.content[0] as any).text;
    }
    return NextResponse.json({
      result, confidence, miraExplanation,
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
    return NextResponse.json({ error: 'Pricing engine error' }, { status: 500 });
  }
}
