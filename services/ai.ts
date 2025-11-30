import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export async function suggestCategory(itemName: string): Promise<string> {
  if (!itemName || itemName.length < 2) return '';

  try {
    const model = ai.models.getGenerativeModel({
       model: "gemini-2.5-flash",
       systemInstruction: "You are a shopping assistant helping to categorize grocery items in Portuguese (Brazil). Return only the category name."
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Categorize this item: "${itemName}". Return a single, short category name (e.g., Hortifruti, Carnes, Limpeza, Padaria). If unsure, return "Outros".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING }
          }
        }
      }
    });

    const json = JSON.parse(response.text || '{}');
    return json.category || 'Geral';
  } catch (error) {
    console.error("AI Category Error:", error);
    return '';
  }
}

export async function lookupProductByBarcodeAI(barcode: string): Promise<{ name: string; category: string; price: number } | null> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `I have a product with barcode "${barcode}". Simulate a database lookup. Provide a realistic product name (in Portuguese), a likely category, and an estimated price in BRL.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Product name" },
                        category: { type: Type.STRING, description: "Product category" },
                        price: { type: Type.NUMBER, description: "Estimated price in Reais" }
                    },
                    required: ["name", "category", "price"]
                }
            }
        });

        const data = JSON.parse(response.text || '{}');
        if (data.name) {
            return data;
        }
        return null;
    } catch (error) {
        console.error("AI Barcode Error:", error);
        return null;
    }
}