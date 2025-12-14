import { GoogleGenAI } from "@google/genai";
import { SearchSource, EmailDraft, UserProfile } from "../types";

// Helper to initialize the client safely
const getAiClient = () => {
  let apiKey = '';

  // 1. Try to get the user's custom API key from LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const storedProfile = localStorage.getItem('energyScout_userProfile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile) as UserProfile;
        if (profile.apiKey) {
          apiKey = profile.apiKey;
        }
      }
    } catch (e) {
      console.warn("Failed to read user profile for API key", e);
    }
  }

  // 2. Fallback to process.env if no user key is found
  if (!apiKey && typeof process !== 'undefined' && process.env) {
    apiKey = process.env.API_KEY || '';
  }
  
  if (!apiKey) {
    console.warn("EnergyScout: API_KEY is missing. Please sign up with your key or configure environment variables.");
    // We return an empty client, but calls will fail. 
    // The UI should handle the error when the call is actually made.
  }
  
  return new GoogleGenAI({ apiKey: apiKey });
};

/**
 * Searches for news using Gemini with Google Search grounding.
 */
export const searchEnergyNews = async (topic: string): Promise<{ text: string; sources: SearchSource[] }> => {
  const ai = getAiClient();
  const model = 'gemini-2.5-flash';
  
  const prompt = `
    You are an expert energy sector analyst specializing in the Middle East and Global metering markets.
    Find the latest news, product releases, regulatory updates, and technological advancements regarding: "${topic}".
    Focus on the last 7 to 30 days.

    SEARCH PRIORITY:
    1. **Primary Focus (Egypt & Arabic Sources):** STRICTLY prioritize searching Egyptian government websites (e.g., Ministry of Electricity and Renewable Energy, Egypt Electricity Holding Company - EEHC), Egyptian news portals (e.g., Al-Ahram, Al-Youm Al-Sabea), and Arabic energy journals.
    2. **Secondary Focus (Global/English):** After checking Egyptian sources, look for major international updates in this sector.

    OUTPUT FORMAT:
    Provide a comprehensive executive summary in English (translating key points from Arabic sources if necessary).
    
    Structure the response as a clear, bulleted executive summary. 
    For each news item, include:
    1. A bold headline.
    2. A concise summary of the event or update.
    3. The source origin (e.g., "Source: Egypt Ministry of Electricity" or "Source: Global").
    4. The implication for the energy/metering sector.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType cannot be JSON when using googleSearch
      },
    });

    const text = response.text || "No results found.";
    
    // Extract grounding chunks (sources)
    const sources: SearchSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    // Filter duplicate sources based on URI
    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);

    return { text, sources: uniqueSources };

  } catch (error) {
    console.error("Error fetching news:", error);
    throw new Error("Failed to fetch news. Please check your API Key in Settings.");
  }
};

/**
 * Generates an email draft based on the found news.
 */
export const generateEmailNewsletter = async (newsText: string): Promise<EmailDraft> => {
  const ai = getAiClient();
  const model = 'gemini-2.5-flash';
  
  const prompt = `
    You are a professional energy sector analyst. 
    Convert the following news summary into a professional, clean email newsletter format.
    
    The email should have:
    1. A professional subject line (e.g., "Egypt & Global Metering Update: [Key Topic]").
    2. A polite opening.
    3. The news items organized clearly with headings.
    4. A brief "Analyst Take" or conclusion at the end.
    
    Input Text:
    ${newsText}

    Return the output in JSON format with "subject" and "body" fields.
    The "body" should be plain text suitable for email clients.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response for email draft");
    
    const draft = JSON.parse(jsonText) as EmailDraft;
    return draft;

  } catch (error) {
    console.error("Error generating email:", error);
    throw new Error("Failed to generate email draft.");
  }
};