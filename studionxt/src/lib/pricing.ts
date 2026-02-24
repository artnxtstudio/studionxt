export type CareerStage = 'Emerging' | 'MidCareer' | 'Institutional' | 'MuseumLevel' | 'BlueChip';
export type SalesContext = 'StudioSale' | 'RegionalGallery' | 'InternationalFair' | 'GlobalMarket';
export type ArtworkCategory = '2D' | '3D';
export type ArtworkType = 'Unique' | 'Edition';

export interface PricingInputs {
  materialsCost: number; fabricationCost: number; studioCost: number; logisticsCost: number;
  hoursWorked: number; hourlyRate: number;
  artworkCategory: ArtworkCategory; artworkType: ArtworkType;
  width: number; height: number; depth?: number;
  editionSize?: number; editionNumber?: number;
  careerStage: CareerStage; salesContext: SalesContext;
  structuralComplexity: boolean; fragileMaterial: boolean; internationalShipping: boolean;
  galleryCommissionPercent?: number; manualOverridePercent?: number;
}

export interface PricingOutput {
  directCost: number; laborCost: number; baseCost: number;
  sizeMultiplier: number; careerMultiplier: number; marketMultiplier: number;
  coreValue: number; scarcityFactor: number; editionAdjustment: number; editionNumberFactor: number;
  retailPrice: number; adjustedRetailPrice: number; insuranceValue: number; secondaryEstimate: number;
  commissionAmount: number; artistNet: number; profit: number; profitMarginPercent: number;
  riskFactor: number; secondaryMultiplier: number;
}

const CAREER_MULTIPLIERS: Record<CareerStage, number> = { Emerging:1.3, MidCareer:1.6, Institutional:1.9, MuseumLevel:2.2, BlueChip:2.8 };
const MARKET_MULTIPLIERS: Record<SalesContext, number> = { StudioSale:1.0, RegionalGallery:1.15, InternationalFair:1.25, GlobalMarket:1.35 };
const SECONDARY_MULTIPLIERS: Record<CareerStage, number> = { Emerging:0.50, MidCareer:0.60, Institutional:0.70, MuseumLevel:0.75, BlueChip:0.80 };
const BASE_RISK: Record<string, number> = { '2D_Edition':0.15, '2D_Unique':0.20, '3D_Unique':0.25, '3D_Large':0.30 };

export function calculatePrice(inputs: PricingInputs): PricingOutput {
  const { materialsCost,fabricationCost,studioCost,logisticsCost,hoursWorked,hourlyRate,artworkCategory,artworkType,width,height,depth,editionSize,editionNumber,careerStage,salesContext,structuralComplexity,fragileMaterial,internationalShipping,galleryCommissionPercent,manualOverridePercent } = inputs;
  const directCost = materialsCost+fabricationCost+studioCost+logisticsCost;
  const laborCost = hoursWorked*hourlyRate;
  const baseCost = directCost+laborCost;
  let sizeMultiplier = artworkCategory==='2D' ? 1+(0.04*(width*height/1.0)) : 1+(0.06*(width*height*(depth||0)/0.5));
  sizeMultiplier = Math.min(sizeMultiplier,1.4);
  const careerMultiplier = CAREER_MULTIPLIERS[careerStage];
  const marketMultiplier = MARKET_MULTIPLIERS[salesContext];
  const coreValue = baseCost*careerMultiplier*sizeMultiplier*marketMultiplier;
  let scarcityFactor=1, editionAdjustment=1, editionNumberFactor=1;
  if(artworkType==='Edition'&&editionSize&&editionNumber){
    scarcityFactor=1+(1/Math.sqrt(editionSize));
    editionAdjustment=scarcityFactor/editionSize;
    editionNumberFactor=1+(((editionNumber-1)/editionSize)*0.25);
  }
  let retailPrice = Math.round((coreValue*editionAdjustment*editionNumberFactor)/100)*100;
  const overrideFactor = manualOverridePercent ? 1+(Math.max(-20,Math.min(20,manualOverridePercent))/100) : 1;
  const adjustedRetailPrice = Math.round((retailPrice*overrideFactor)/100)*100;
  const riskKey = artworkCategory==='3D' ? (width*height*(depth||0)>50?'3D_Large':'3D_Unique') : (artworkType==='Edition'?'2D_Edition':'2D_Unique');
  let riskFactor = BASE_RISK[riskKey]||0.20;
  if(structuralComplexity) riskFactor+=0.05;
  if(fragileMaterial) riskFactor+=0.05;
  if(internationalShipping) riskFactor+=0.05;
  riskFactor = Math.min(riskFactor,0.40);
  const insuranceValue = Math.round((adjustedRetailPrice*(1+riskFactor))/100)*100;
  const secondaryMultiplier = SECONDARY_MULTIPLIERS[careerStage];
  const secondaryEstimate = Math.round((adjustedRetailPrice*secondaryMultiplier)/100)*100;
  const commissionAmount = galleryCommissionPercent ? Math.round((adjustedRetailPrice*(galleryCommissionPercent/100))/100)*100 : 0;
  const artistNet = adjustedRetailPrice-commissionAmount;
  const profit = adjustedRetailPrice-baseCost;
  const profitMarginPercent = adjustedRetailPrice>0 ? Math.round((profit/adjustedRetailPrice)*100*10)/10 : 0;
  return { directCost,laborCost,baseCost,sizeMultiplier:Math.round(sizeMultiplier*100)/100,careerMultiplier,marketMultiplier,coreValue:Math.round(coreValue),scarcityFactor:Math.round(scarcityFactor*100)/100,editionAdjustment:Math.round(editionAdjustment*1000)/1000,editionNumberFactor:Math.round(editionNumberFactor*100)/100,retailPrice,adjustedRetailPrice,insuranceValue,secondaryEstimate,commissionAmount,artistNet,profit:Math.round(profit),profitMarginPercent,riskFactor:Math.round(riskFactor*100)/100,secondaryMultiplier };
}

export function simpleModeInputs(params: { medium:string; width:number; height:number; depth?:number; careerStage:CareerStage; salesContext:SalesContext; hourlyRate?:number }): PricingInputs {
  const { medium,width,height,depth,careerStage,salesContext,hourlyRate=50 } = params;
  const is3D = ['Sculpture','Ceramic','Installation'].includes(medium);
  const area = width*height;
  const hoursWorked = Math.max(8,Math.min(200,is3D?area*0.8:area*0.3));
  const matEstimates: Record<string,number> = { 'Oil Painting':area*2,'Acrylic':area*1.5,'Watercolor':area*0.8,'Drawing':area*0.5,'Photography':area*1.2,'Print':area*1.0,'Sculpture':area*4,'Ceramic':area*3,'Installation':area*5,'Mixed Media':area*2.5,'Digital':200 };
  const materialsCost = matEstimates[medium]||area*2;
  return { materialsCost:Math.round(materialsCost),fabricationCost:is3D?Math.round(materialsCost*0.3):0,studioCost:Math.round(hoursWorked*5),logisticsCost:is3D?200:50,hoursWorked:Math.round(hoursWorked),hourlyRate,artworkCategory:is3D?'3D':'2D',artworkType:'Unique',width,height,depth,careerStage,salesContext,structuralComplexity:false,fragileMaterial:false,internationalShipping:false };
}

export function formatCurrency(amount: number, currency='USD'): string {
  return new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:0}).format(amount);
}

export function getConfidenceLevel(inputs: PricingInputs): 'low'|'medium'|'high' {
  let score=0;
  if(inputs.materialsCost>0) score++;
  if(inputs.fabricationCost>0) score++;
  if(inputs.hoursWorked>0) score++;
  if(inputs.studioCost>0) score++;
  return score>=4?'high':score>=2?'medium':'low';
}
