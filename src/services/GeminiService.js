import { GoogleGenAI, Type } from "@google/genai";

class GeminiService {
	constructor() {
		this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;

		if (!this.apiKey) {
			throw new Error("API Key is not set in environment variables");
		}

		this.ai = new GoogleGenAI({
			apiKey: this.apiKey,
		});
	}

	// Basic text generation
	async generateText(prompt, modelType = "gemini-2.5-flash") {
		try {
			const response = await this.ai.models.generateContent({
				model: modelType,
				contents: prompt,
			});
			return response.text;
		} catch (error) {
			console.error("Gemini API Error:", error);
			throw new Error(`Failed to generate text: ${error.message}`);
		}
	}

	// JSON generation with proper schema structure
	async generateJSON(prompt, responseSchema, modelType = "gemini-2.5-flash") {
		try {
			const response = await this.ai.models.generateContent({
				model: modelType,
				contents: prompt,
				config: {
					responseMimeType: "application/json",
					responseSchema: responseSchema,
				},
			});

			// Parse the JSON response
			const jsonText = response.text;
			const parsedJson = JSON.parse(jsonText);
			return parsedJson;
		} catch (error) {
			console.error("Gemini JSON API Error:", error);
			throw new Error(`Failed to generate JSON: ${error.message}`);
		}
	}

	// Generate with full custom configuration
	async generateWithConfig(
		prompt,
		config = {},
		modelType = "gemini-2.5-flash"
	) {
		try {
			const response = await this.ai.models.generateContent({
				model: modelType,
				contents: prompt,
				config: config,
			});

			// Return parsed JSON if responseMimeType is application/json
			if (config.responseMimeType === "application/json") {
				return JSON.parse(response.text);
			}

			return response.text;
		} catch (error) {
			console.error("Gemini API Error:", error);
			throw new Error(`Failed to generate content: ${error.message}`);
		}
	}

	// Predefined schema builders for common use cases
	createArraySchema(itemSchema) {
		return {
			type: Type.ARRAY,
			items: itemSchema,
		};
	}

	createObjectSchema(properties, propertyOrdering = null) {
		const schema = {
			type: Type.OBJECT,
			properties: properties,
		};

		if (propertyOrdering) {
			schema.propertyOrdering = propertyOrdering;
		}

		return schema;
	}

	createStringSchema() {
		return { type: Type.STRING };
	}

	createNumberSchema() {
		return { type: Type.NUMBER };
	}

	createBooleanSchema() {
		return { type: Type.BOOLEAN };
	}

	// Check API key validity
	async testConnection() {
		try {
			const response = await this.generateText("Say hello");
			return { success: true, response };
		} catch (error) {
			return { success: false, error: error.message };
		}
	}

	// Available models
	getAvailableModels() {
		return ["gemini-2.5-flash", "gemini-1.5-pro", "gemini-1.5-flash"];
	}
}

// React Hook for easy usage
import { useState, useCallback } from "react";

export const useGeminiAPI = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const geminiService = new GeminiService();

	const generateText = useCallback(
		async (prompt, modelType = "gemini-2.5-flash") => {
			setIsLoading(true);
			setError(null);

			try {
				const result = await geminiService.generateText(prompt, modelType);
				return result;
			} catch (err) {
				setError(err.message);
				throw err;
			} finally {
				setIsLoading(false);
			}
		},
		[]
	);

	const generateJSON = useCallback(
		async (prompt, responseSchema, modelType = "gemini-2.5-flash") => {
			setIsLoading(true);
			setError(null);

			try {
				const result = await geminiService.generateJSON(
					prompt,
					responseSchema,
					modelType
				);
				return result;
			} catch (err) {
				setError(err.message);
				throw err;
			} finally {
				setIsLoading(false);
			}
		},
		[]
	);

	const generateWithConfig = useCallback(
		async (prompt, config, modelType = "gemini-2.5-flash") => {
			setIsLoading(true);
			setError(null);

			try {
				const result = await geminiService.generateWithConfig(
					prompt,
					config,
					modelType
				);
				return result;
			} catch (err) {
				setError(err.message);
				throw err;
			} finally {
				setIsLoading(false);
			}
		},
		[]
	);

	const testConnection = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const result = await geminiService.testConnection();
			if (!result.success) {
				setError(result.error);
			}
			return result;
		} catch (err) {
			setError(err.message);
			return { success: false, error: err.message };
		} finally {
			setIsLoading(false);
		}
	}, []);

	return {
		generateText,
		generateJSON,
		generateWithConfig,
		testConnection,
		isLoading,
		error,
		geminiService,
	};
};

// Direct usage example (your exact format)
// export const directExample = async () => {
// 	const ai = new GoogleGenAI({
// 		apiKey: import.meta.env.VITE_GEMINI_API_KEY,
// 	});

// 	const response = await ai.models.generateContent({
// 		model: "gemini-2.5-flash",
// 		contents:
// 			"List a few popular cookie recipes, and include the amounts of ingredients.",
// 		config: {
// 			responseMimeType: "application/json",
// 			responseSchema: {
// 				type: Type.ARRAY,
// 				items: {
// 					type: Type.OBJECT,
// 					properties: {
// 						recipeName: { type: Type.STRING },
// 						ingredients: {
// 							type: Type.ARRAY,
// 							items: { type: Type.STRING },
// 						},
// 					},
// 					propertyOrdering: ["recipeName", "ingredients"],
// 				},
// 			},
// 		},
// 	});

// 	console.log(response.text);
// 	return JSON.parse(response.text);
// };

// Export the main service
export default GeminiService;
