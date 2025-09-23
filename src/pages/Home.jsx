import { Type } from "@google/genai";
import { useGeminiAPI } from "../services/GeminiService";

// Example usage in a React component
export const Home = () => {
	const { generateText, generateJSON, testConnection, isLoading, error } =
		useGeminiAPI();

	const handleTextGeneration = async () => {
		try {
			const result = await generateText("Write a short poem about coding");
			console.log("Generated text:", result);
		} catch (error) {
			console.error("Generation failed:", error);
		}
	};

	const handleJSONGeneration = async () => {
		try {
			const prompt = "Generate 3 programming tips with descriptions";

			const schema = {
				type: Type.OBJECT,
				properties: {
					tips: {
						type: Type.ARRAY,
						items: {
							type: Type.OBJECT,
							properties: {
								title: { type: Type.STRING },
								description: { type: Type.STRING },
							},
							propertyOrdering: ["title", "description"],
						},
					},
				},
				propertyOrdering: ["tips"],
			};

			const result = await generateJSON(prompt, schema);
			console.log("Generated JSON:", result);
		} catch (error) {
			console.error("JSON generation failed:", error);
		}
	};

	const handleCookieRecipeExample = async () => {
		try {
			const prompt =
				"List a few popular cookie recipes, and include the amounts of ingredients.";

			const schema = {
				type: Type.ARRAY,
				items: {
					type: Type.OBJECT,
					properties: {
						recipeName: { type: Type.STRING },
						ingredients: {
							type: Type.ARRAY,
							items: { type: Type.STRING },
						},
					},
					propertyOrdering: ["recipeName", "ingredients"],
				},
			};

			const result = await generateJSON(prompt, schema);
			console.log("Generated recipes:", result);
		} catch (error) {
			console.error("Recipe generation failed:", error);
		}
	};

	const handleConnectionTest = async () => {
		const result = await testConnection();
		if (result.success) {
			alert("API connection successful!");
		} else {
			alert(`API connection failed: ${result.error}`);
		}
	};

	return (
		<div className="p-4 space-y-4">
			<button
				onClick={handleConnectionTest}
				disabled={isLoading}
				className="btn btn-primary">
				{isLoading ? "Testing..." : "Test API Connection"}
			</button>

			<button
				onClick={handleTextGeneration}
				disabled={isLoading}
				className="btn btn-secondary">
				{isLoading ? "Generating..." : "Generate Text"}
			</button>

			<button
				onClick={handleJSONGeneration}
				disabled={isLoading}
				className="btn btn-accent">
				{isLoading ? "Generating..." : "Generate JSON"}
			</button>

			<button
				onClick={handleCookieRecipeExample}
				disabled={isLoading}
				className="btn btn-info">
				{isLoading ? "Generating..." : "Generate Cookie Recipes"}
			</button>

			{error && (
				<div className="alert alert-error">
					<span>Error: {error}</span>
				</div>
			)}
		</div>
	);
};

export default Home;
