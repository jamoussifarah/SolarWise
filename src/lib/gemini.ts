import { GoogleGenAI } from "@google/genai";
import { Recommendation, UserInput } from "./solar-engine";

export async function getSolarInsights(input: UserInput, recommendation: Recommendation) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "AI insights are currently unavailable. Please configure your Gemini API key.";
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemma-3-4b-it";


  const prompt = `
    You are an expert solar energy consultant. 
    A user in ${input.location} is looking to install solar panels.
    
    User Input:
    - Monthly Consumption: ${input.monthlyConsumption} kWh
    - Budget: $${input.budget}
    - Available Area: ${input.availableArea} m²
    
    Our Recommendation:
    - System Size: ${recommendation.systemSizeKW} kW
    - Panel Type: ${recommendation.panelType.type} (${recommendation.panelType.description})
    - Number of Panels: ${recommendation.numberOfPanels}
    - Estimated Cost: $${recommendation.estimatedCost}
    - Monthly Production: ${recommendation.monthlyProduction} kWh
    - Annual CO2 Savings: ${recommendation.annualCO2Savings} kg
    - Payback Period: ${recommendation.paybackPeriod} years
    
    Please provide:
    1. A brief explanation of why this system was recommended.
    2. **Local Availability & Market Options**: Research and list 2-3 specific solar panel brands and models that are highly available and popular in **${input.location}**. For each, provide:
       - Brand and Model name.
       - A brief reason why it's a good choice for this specific region.
       - A direct purchase link or a specific guidance on where to buy it locally (e.g., "Available at [Retailer Name] in ${input.location}" or a URL like "https://www.google.com/search?q=buy+solar+panels+in+${encodeURIComponent(input.location)}").
    3. 3 actionable optimization tips to get more out of their investment.
    4. A **Smart Maintenance Strategy**: Suggest a cleaning and check-up schedule based on their location and panel type.
    5. An inspiring eco-impact summary (e.g., equivalent number of trees planted).
    
    Format the response in clean Markdown with clear headings. Keep it professional yet encouraging.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Could not generate insights at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating AI insights. Please try again later.";
  }
}
