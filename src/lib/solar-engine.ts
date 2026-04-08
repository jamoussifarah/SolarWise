export type PanelType = 'monocrystalline' | 'polycrystalline' | 'thin-film';

export interface UserInput {
  location: string;
  monthlyConsumption: number; // kWh
  budget: number; // USD
  availableArea: number; // m2
}

export interface PanelSpecs {
  type: PanelType;
  brand: string;
  model: string;
  efficiency: number;
  costPerWatt: number;
  wattsPerPanel: number;
  areaPerPanel: number;
  description: string;
  purchaseUrl: string;
}

export interface Recommendation {
  systemSizeKW: number;
  panelType: PanelSpecs;
  numberOfPanels: number;
  totalAreaRequired: number;
  estimatedCost: number;
  monthlyProduction: number;
  annualCO2Savings: number; // kg
  paybackPeriod: number; // years
}

export const PANEL_DATA: Record<PanelType, PanelSpecs> = {
  monocrystalline: {
    type: 'monocrystalline',
    brand: 'SunPower',
    model: 'Maxeon 6 AC',
    efficiency: 0.22,
    costPerWatt: 1.2,
    wattsPerPanel: 440,
    areaPerPanel: 2.1,
    description: 'Premium monocrystalline panel with integrated microinverter. Highest efficiency and durability.',
    purchaseUrl: 'https://sunpower.maxeon.com/int/solar-panel-products/maxeon-solar-panels',
  },
  polycrystalline: {
    type: 'polycrystalline',
    brand: 'Canadian Solar',
    model: 'HiKu CS3W-P',
    efficiency: 0.18,
    costPerWatt: 0.8,
    wattsPerPanel: 360,
    areaPerPanel: 2.0,
    description: 'Reliable polycrystalline technology. Excellent balance of performance and affordability.',
    purchaseUrl: 'https://www.canadiansolar.com/products/',
  },
  'thin-film': {
    type: 'thin-film',
    brand: 'First Solar',
    model: 'Series 6 Plus',
    efficiency: 0.12,
    costPerWatt: 0.65,
    wattsPerPanel: 120,
    areaPerPanel: 1.6,
    description: 'Advanced thin-film technology. Superior performance in high temperatures and humid conditions.',
    purchaseUrl: 'https://www.firstsolar.com/Modules/Series-6',
  },
};

export const calculateRecommendation = (input: UserInput): Recommendation => {
  const { monthlyConsumption, budget, availableArea } = input;
  
  // Constants
  const avgPeakSunHours = 4.5; // Average global peak sun hours
  const systemEfficiencyLoss = 0.75; // Inverter, wiring, etc.
  
  // 1. Calculate ideal system size based on consumption
  // Daily kWh / Peak Sun Hours / Efficiency
  const dailyConsumption = monthlyConsumption / 30;
  const idealSystemSizeKW = dailyConsumption / avgPeakSunHours / systemEfficiencyLoss;
  
  // 2. Select best panel type based on budget and area
  // We prioritize Monocrystalline if budget and area allow, else fallback
  const types: PanelType[] = ['monocrystalline', 'polycrystalline', 'thin-film'];
  let bestType = PANEL_DATA.monocrystalline;
  
  for (const typeKey of types) {
    const specs = PANEL_DATA[typeKey];
    const estimatedCost = idealSystemSizeKW * 1000 * specs.costPerWatt;
    const panelsNeeded = Math.ceil((idealSystemSizeKW * 1000) / specs.wattsPerPanel);
    const areaNeeded = panelsNeeded * specs.areaPerPanel;
    
    if (estimatedCost <= budget && areaNeeded <= availableArea) {
      bestType = specs;
      break;
    } else {
      // If monocrystalline is too expensive or big, we'll try the next one in the loop
      bestType = specs;
    }
  }
  
  // 3. Finalize based on constraints (Budget is the hard limit)
  let finalSystemSizeKW = idealSystemSizeKW;
  const maxKWByBudget = budget / (bestType.costPerWatt * 1000);
  const maxKWByArea = (availableArea / bestType.areaPerPanel) * (bestType.wattsPerPanel / 1000);
  
  finalSystemSizeKW = Math.min(idealSystemSizeKW, maxKWByBudget, maxKWByArea);
  
  const numberOfPanels = Math.floor((finalSystemSizeKW * 1000) / bestType.wattsPerPanel);
  const totalAreaRequired = numberOfPanels * bestType.areaPerPanel;
  const estimatedCost = finalSystemSizeKW * 1000 * bestType.costPerWatt;
  const monthlyProduction = finalSystemSizeKW * avgPeakSunHours * 30 * systemEfficiencyLoss;
  
  // Eco impact: ~0.4 kg CO2 saved per kWh
  const annualCO2Savings = monthlyProduction * 12 * 0.4;
  
  // Payback: Assuming $0.15 per kWh cost
  const annualSavingsUSD = monthlyProduction * 12 * 0.15;
  const paybackPeriod = estimatedCost / annualSavingsUSD;

  return {
    systemSizeKW: Number(finalSystemSizeKW.toFixed(2)),
    panelType: bestType,
    numberOfPanels,
    totalAreaRequired: Number(totalAreaRequired.toFixed(2)),
    estimatedCost: Math.round(estimatedCost),
    monthlyProduction: Math.round(monthlyProduction),
    annualCO2Savings: Math.round(annualCO2Savings),
    paybackPeriod: Number(paybackPeriod.toFixed(1)),
  };
};
