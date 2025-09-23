// Example of using OptionCarousel with Translation in a Template Component

import OptionCarousel from "../components/common/OptionCarousel";

export const ExampleTemplateWithTranslation = ({ currentCourse }) => {
	const fallbackFormat = {
		cautions: [
			"Is the design mobile-responsive?", // Cautions are NOT translated
			"Does the CTA stand out clearly?",
			"Is the messaging appropriate?",
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

	return (
		<div>
			{/* Cautions - NO translation */}
			<div className="mb-8">
				<h4 className="font-semibold text-lg mb-4 text-warning">
					⚠️ Design Cautions
				</h4>
				<div className="space-y-2">
					{fallbackFormat.cautions.map((caution, index) => (
						<div key={index} className="alert alert-warning">
							{caution}
						</div>
					))}
				</div>
			</div>

			{/* Title Carousel - WITH translation */}
			<OptionCarousel
				label="Title Options"
				icon="📝"
				items={fallbackFormat.title}
				currentIndex={currentTitleIndex}
				onPrev={prevTitle}
				onNext={nextTitle}
				context="Hero section titles for language learning course" // Translation context
			/>

			{/* Subtitle Carousel - WITH translation */}
			<OptionCarousel
				label="Subtitle Options" 
				icon="📄"
				items={fallbackFormat.subtitle}
				currentIndex={currentSubtitleIndex}
				onPrev={prevSubtitle}
				onNext={nextSubtitle}
				context="Hero section subtitles emphasizing course benefits" // Translation context
			/>
		</div>
	);
};

/*
HOW IT WORKS:

1. **Translation Detection**:
   - If creator's `creator_language` is "English" → No translation button
   - If creator's `creator_language` is NOT "English" → Shows "🌐 Translate" button

2. **Translation Process**:
   - User clicks "🌐 Translate" button
   - Hook translates ALL items in the array to creator's language
   - Results are cached to avoid re-translation
   - Toggle appears to switch between English and translated view

3. **DaisyUI Diff Component**:
   - When translation is active, shows visual diff slider
   - Left side: English (EN)
   - Right side: Translated language (e.g., JP for Japanese)
   - User can drag to see both sides

4. **Side-by-Side View**:
   - English text in primary colored card with 🇺🇸 flag
   - Translated text in secondary colored card with language indicator
   - Both texts shown simultaneously below diff component

5. **Copy Functionality**:
   - Regular view: Copies English text only
   - Translation view: Copies translated text only

EXAMPLE OUTPUT:
```
Regular mode: "Learn Japanese Fast!"
Translation mode: "¡Aprende Japonés Rápido!"
```

6. **Context Parameter**:
   - Provides additional context to AI for better translations
   - Helps maintain marketing tone and course-specific terminology
*/
