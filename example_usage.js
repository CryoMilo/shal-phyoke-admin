// Example usage of the updated useTemplateAI hook

import { useTemplateAI } from "../hooks/useTemplateAI";
import useCreatorStore from "../stores/creatorStore";

export const ExampleTemplateComponent = ({ currentCourse, activeSegment }) => {
	const { currentCreator, getCreatorMeta } = useCreatorStore();
	const [aiContent, setAiContent] = useState(null);

	const creatorMeta = getCreatorMeta();

	// Universal hook usage
	const {
		generateTemplateContent,
		generateQuickVariation,
		isGenerating,
		error,
		clearError,
	} = useTemplateAI();

	// Fallback data with cautions
	const fallbackFormat = {
		cautions: [
			"Is the design mobile-responsive?",
			"Does the CTA stand out clearly?",
			"Is the messaging segment-appropriate?",
		],
		title: [
			"Learn Japanese Fast!",
			"Master Japanese in 30 Days",
			"Speak Japanese Confidently",
		],
		subtitle: [
			"Transform your language skills with our proven method",
			"Join thousands of successful students",
			"Start speaking from day one",
		],
	};

	const handleAIGeneration = async () => {
		if (!currentCreator) {
			alert("Please fill out creator information first!");
			return;
		}

		try {
			clearError();
			
			// ✅ NEW: Updated function signature with currentSegment parameter
			const aiContent = await generateTemplateContent(
				"hero", // template type
				currentCourse, // course data
				creatorMeta, // creator metadata
				activeSegment, // 🆕 CURRENT SEGMENT (AO, WL, WEB, etc.)
				fallbackFormat, // fallback data with cautions
				{
					// cautions no longer needed in preserveFields - always preserved
					customInstructions: "Focus on emotional connection and urgency for this segment."
				}
			);
			
			setAiContent(aiContent);
		} catch (error) {
			console.error("AI generation failed:", error);
			alert(`AI generation failed: ${error.message}`);
		}
	};

	// The AI content will automatically include:
	// - Generated title and subtitle arrays
	// - Cautions from fallbackFormat (always preserved)
	// - Segment-aware prompts and messaging

	return (
		<div>
			<button onClick={handleAIGeneration} disabled={isGenerating}>
				{isGenerating ? "Generating..." : "🤖 Generate AI Content"}
			</button>
			
			{aiContent && (
				<div>
					{/* Cautions are always preserved from fallback */}
					<div>
						{aiContent.cautions.map((caution, index) => (
							<div key={index}>⚠️ {caution}</div>
						))}
					</div>
					
					{/* AI-generated content */}
					<div>
						<h3>AI Titles:</h3>
						{aiContent.title.map((title, index) => (
							<div key={index}>{title}</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

// Different template types examples:

// 1. Hero Template
const heroAI = await generateTemplateContent(
	"hero",
	currentCourse,
	creatorMeta,
	"AO", // All Others segment
	fallbackHeroFormat
);

// 2. Pain Point Template
const painPointAI = await generateTemplateContent(
	"painpoint",
	currentCourse,
	creatorMeta,
	"WL", // Waitlist segment
	fallbackPainFormat
);

// 3. Benefits Template
const benefitsAI = await generateTemplateContent(
	"benefits",
	currentCourse,
	creatorMeta,
	"WEB", // Webinar segment
	fallbackBenefitsFormat
);

// 4. Pricing Template
const pricingAI = await generateTemplateContent(
	"pricing",
	currentCourse,
	creatorMeta,
	"TI", // Tuesday Installments segment
	fallbackPricingFormat
);

// All templates will automatically:
// ✅ Preserve cautions from fallback
// ✅ Include segment-specific messaging
// ✅ Use consistent AI generation patterns
// ✅ Handle loading states and errors uniformly
