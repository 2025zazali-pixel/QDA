
import { GoogleGenAI, Type } from "@google/genai";
import { Document, Segment, Code, AiSuggestedTheme, ChatMessage, Quote } from '../types';

if (!process.env.API_KEY) {
    alert("API_KEY environment variable not set. Please set it in your .env file to use AI features.");
}

const ai = new GoogleGenAI({apiKey: process.env.API_KEY as string});

// Function to suggest codes for a selected text segment
export const suggestCodes = async (
    segment: Segment,
    document: Document,
    existingCodes: Code[]
): Promise<Code[]> => {
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are an expert qualitative researcher. Your task is to suggest relevant codes for a given text segment. The user provides a text segment, the full document for context, and a list of existing codes.
- Analyze the segment in the context of the full document.
- If any existing codes are highly relevant, suggest them.
- If the segment introduces a new concept, suggest a new code with a clear name and a brief description.
- Return a JSON array of suggested codes. Each object should have an "id", "name", "description". For new codes, the "id" should start with "new-".
- For existing codes, use their original "id". For new codes, create a temporary "id" starting with "new-".
- Prioritize concise and meaningful code names.
- If no codes are relevant, return an empty array.`;

    const prompt = `
        DOCUMENT CONTEXT:
        ---
        ${document.content.substring(0, 4000)}... 
        ---
        SELECTED SEGMENT:
        ---
        "${segment.text}"
        ---
        EXISTING CODES:
        ---
        ${JSON.stringify(existingCodes.map(c => ({id: c.id, name: c.name, description: c.description})), null, 2)}
        ---
        Based on the selected segment and its context, suggest relevant codes.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                        },
                        required: ["id", "name", "description"]
                    }
                }
            }
        });

        const jsonString = response.text;
        const suggestions = JSON.parse(jsonString);

        // Map suggestions to the Code type, adding a color placeholder for new codes
        return suggestions.map((s: any) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            // color is assigned when the code is actually created in the app state
            color: existingCodes.find(c => c.id === s.id)?.color || '#E2E8F0' 
        }));

    } catch (error) {
        console.error("Error suggesting codes:", error);
        throw new Error("Failed to get AI suggestions. Please check the API key and try again.");
    }
};


// Function to detect major themes in a document
export const detectThemes = async (
    document: Document,
    existingCodes: Code[]
): Promise<AiSuggestedTheme[]> => {
    if (document.type !== 'text') {
        throw new Error("Theme detection is currently only supported for text documents.");
    }
    const model = 'gemini-2.5-pro'; // Using a more powerful model for a complex task

     const systemInstruction = `You are an expert qualitative data analyst. Your goal is to identify the main themes in a given document.
- Read the entire document.
- Identify recurring topics, ideas, or patterns that can be considered themes.
- For each theme, propose a concise name and a brief, clear description. This will become a "code".
- For each theme, extract a few (3-5) representative quotes from the document that best exemplify it.
- Do NOT use existing code names if provided, generate new ones based on the document.
- The output must be a valid JSON array of themes. Each theme object must contain a "code" object (with "name" and "description") and a "quotes" array (of strings).
- If no significant themes are found, return an empty array.`;

    const prompt = `
        DOCUMENT:
        ---
        ${document.content}
        ---
        EXISTING CODES TO AVOID DUPLICATING:
        ---
        ${JSON.stringify(existingCodes.map(c => c.name), null, 2)}
        ---
        Analyze the document and identify the major themes as instructed.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            code: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    description: { type: Type.STRING }
                                },
                                required: ["name", "description"]
                            },
                            quotes: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        },
                        required: ["code", "quotes"]
                    }
                }
            }
        });
        
        const jsonString = response.text.trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error detecting themes:", error);
        throw new Error("Failed to perform AI theme detection. Please check your API key and network connection.");
    }
};

// Function to get a response from the AI chatbot
export const getChatbotResponse = async (
    currentQuestion: string,
    chatHistory: ChatMessage[],
    documents: Document[],
    codes: Code[],
    quotes: Quote[]
): Promise<string> => {
    const model = 'gemini-2.5-pro';

    const systemInstruction = `You are a helpful AI research assistant for a qualitative analysis application.
Your role is to answer questions about the user's research data, which includes documents, codes, and quotes.
- Be concise and helpful.
- Base your answers strictly on the provided data context.
- If the question cannot be answered from the context, say so.
- You can summarize documents, compare themes (codes), or find relationships between data points.`;
    
    const context = `
    DOCUMENTS:
    ${documents.map(d => `- ${d.title} (type: ${d.type})`).join('\n')}

    CODES (THEMES):
    ${codes.map(c => `- ${c.name}: ${c.description}`).join('\n')}

    QUOTES: ${quotes.length} quotes have been created linking documents to codes.
    `;
    
    // Constructing a simple prompt with history. For more complex chats, use the chat API.
    const historyText = chatHistory
        .map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`)
        .join('\n');

    const fullPrompt = `
    CONTEXT:
    ${context}
    ---
    CHAT HISTORY:
    ${historyText}
    ---
    NEW QUESTION: ${currentQuestion}
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: fullPrompt,
            config: {
                systemInstruction
            }
        });
        return response.text;
    } catch(error) {
        console.error("Error in chatbot:", error);
        throw new Error("Failed to get response from AI assistant.");
    }
};

// Function to transcribe audio or video files
export const transcribeMedia = async (dataUrl: string): Promise<string> => {
    const model = 'gemini-2.5-pro';

    const [header, data] = dataUrl.split(',');
    if (!header || !data) {
        throw new Error('Invalid data URL format for transcription.');
    }
    const mimeType = header.split(':')[1]?.split(';')[0];
    if (!mimeType || (!mimeType.startsWith('audio/') && !mimeType.startsWith('video/'))) {
        throw new Error(`Unsupported MIME type for transcription: ${mimeType}`);
    }

    const systemInstruction = "You are an AI model that transcribes audio and video files. Provide a verbatim transcript of the content. Do not add any commentary or introductory text, just the transcribed speech.";

    try {
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    { text: "Transcribe this file verbatim." },
                    { inlineData: { mimeType, data } },
                ]
            },
            config: {
                systemInstruction,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error transcribing media:", error);
        throw new Error("Failed to transcribe media file. The file may be unsupported or the API call failed.");
    }
};
