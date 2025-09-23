import { useState } from "react";
import Hero from "../components/templates/sales-page/Hero";
import useCreatorStore from "../stores/creatorStore";
import Banner1 from "../components/templates/sales-page/Banner1";
import Banner2 from "../components/templates/sales-page/Banner2";
import PainPointMarketing from "../components/templates/sales-page/PainPointMarketing";
import HeroCountdownCTA from "../components/templates/sales-page/HeroCountdownCTA";
import CreatorIntroCTA from "../components/templates/sales-page/CreatorIntroCTA";
import Testimonials from "../components/templates/sales-page/Testimonials";
import FuturePace from "../components/templates/sales-page/FuturePace";
import BenefitsCTA from "../components/templates/sales-page/BenefitsCTA";
import CourseContentCTA from "../components/templates/sales-page/CourseContentCTA";
import WhatYouWillLearn from "../components/templates/sales-page/WhatYouWillLearn";
import CourseFeatures from "../components/templates/sales-page/CourseFeatures";
import CourseStructure from "../components/templates/sales-page/CourseStructure";
import BonusContent from "../components/templates/sales-page/BonusContent";
import StudentVideoReviews from "../components/templates/sales-page/StudentVideoReviews";
import Pricing from "../components/templates/sales-page/Pricing";
import QA from "../components/templates/sales-page/QA";
import Footer from "../components/templates/sales-page/Footer";

const SalesPageContentAgent = () => {
	const { currentCreator } = useCreatorStore();
	const [activeItemIndex, setActiveItemIndex] = useState(0);
	const [activeSegment, setActiveSegment] = useState("AO");

	// Combine courses and bundles into one array with type identifier
	const allItems = [
		...(currentCreator?.courses || []).map((course) => ({
			...course,
			type: "course",
		})),
		...(currentCreator?.bundles || []).map((bundle) => ({
			...bundle,
			type: "bundle",
		})),
	];

	// Available segments
	const segments = ["AO", "WEB", "WL", "TI", "PS", "Latecomers"];

	// Get current active item
	const currentItem = allItems[activeItemIndex];

	// Check if segment is available for current item
	const isSegmentAvailable = (segment) => {
		return currentItem?.discount_price?.[segment] !== undefined;
	};

	// Handle segment click
	const handleSegmentClick = (segment) => {
		if (isSegmentAvailable(segment)) {
			setActiveSegment(segment);
		}
	};

	if (!currentCreator || allItems.length === 0) {
		return (
			<section>
				<div className="mockup-browser border border-base-200 bg-base-200 m-6 shadow-2xl">
					<div className="mockup-browser-toolbar">
						<div className="input">https://your-kajabi-site.com</div>
					</div>
					<div className="border-t border-base-300 min-h-[100vh] flex items-center justify-center">
						<div className="text-center">
							<h2 className="text-2xl font-bold mb-4">No Creator Data Found</h2>
							<p className="text-gray-600">
								Please complete the creator form first.
							</p>
						</div>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section>
			<div className="mockup-browser border border-base-200 bg-base-200 m-6 shadow-2xl">
				<div className="mockup-browser-toolbar">
					<div className="input">https://your-kajabi-site.com</div>
				</div>

				{/* Primary Tab Bar - Courses & Bundles */}
				<div className="border-t border-base-300">
					<div className="tabs tabs-lifted tabs-lg bg-base-100 px-4">
						{allItems.map((item, index) => (
							<button
								key={`${item.type}-${index}`}
								onClick={() => {
									setActiveItemIndex(index);
									// Reset to AO when switching items, or first available segment
									const firstAvailableSegment =
										segments.find(
											(seg) => item.discount_price?.[seg] !== undefined
										) || "AO";
									setActiveSegment(firstAvailableSegment);
								}}
								className={`tab tab-lifted ${
									activeItemIndex === index ? "tab-active" : ""
								}`}>
								<span className="flex items-center gap-2">
									{item.type === "course" ? "📚" : "📦"}
									{item.name}
									<span className="badge badge-sm badge-outline">
										{item.tag}
									</span>
								</span>
							</button>
						))}
					</div>

					{/* Secondary Tab Bar - Segments */}
					<div className="bg-base-200 px-4 py-2">
						<div className="tabs tabs-boxed bg-base-100">
							{segments.map((segment) => {
								const isAvailable = isSegmentAvailable(segment);
								return (
									<button
										key={segment}
										onClick={() => handleSegmentClick(segment)}
										disabled={!isAvailable}
										className={`tab ${
											activeSegment === segment && isAvailable
												? "tab-active"
												: ""
										} ${!isAvailable ? "tab-disabled opacity-50" : ""}`}>
										<span className="flex items-center gap-1">
											{segment}
											{!isAvailable && (
												<span className="text-xs text-error">❌</span>
											)}
										</span>
									</button>
								);
							})}
						</div>

						{/* Current Selection Info */}
						<div className="flex justify-between items-center mt-2 text-sm text-base-content/70">
							<div>
								<span className="font-medium">Active:</span> {currentItem?.name}{" "}
								({currentItem?.type})
							</div>
							<div>
								<span className="font-medium">Segment:</span> {activeSegment}
								{!isSegmentAvailable(activeSegment) && (
									<span className="text-error ml-1">(Not Available)</span>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Content Area */}
				<div className="border-t border-base-300 min-h-[100vh] mx-4 lg:mx-42">
					{isSegmentAvailable(activeSegment) ? (
						<>
							{/* Current Context Display */}
							<div className="bg-info/10 p-4 m-4 rounded-lg border border-info/20">
								<h3 className="font-semibold text-lg mb-2">
									Current Context: {currentItem?.name} - {activeSegment}
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
									<div>
										<span className="font-medium">Type:</span>{" "}
										{currentItem?.type}
									</div>
									<div>
										<span className="font-medium">Tag:</span> {currentItem?.tag}
									</div>
									<div>
										<span className="font-medium">One-time Price:</span>
										{currentCreator?.currency}{" "}
										{currentItem?.discount_price?.[activeSegment]?.one_time}
									</div>
									<div>
										<span className="font-medium">Installment:</span>
										{currentCreator?.currency}{" "}
										{currentItem?.discount_price?.[activeSegment]?.multi?.value}
										×{" "}
										{
											currentItem?.discount_price?.[activeSegment]?.multi
												?.months
										}{" "}
										months
									</div>
								</div>
							</div>

							{/* Templates Section */}
							<Banner1 />
							<Banner2 currentSegment={activeSegment} />
							<HeroCountdownCTA />
							<Hero currentCourse={currentItem} />
							<PainPointMarketing currentCourse={currentItem} />
							<CreatorIntroCTA />
							<Testimonials currentCourse={currentItem} />
							<FuturePace currentCourse={currentItem} />
							{/* <BenefitsCTA currentCourse={currentItem} /> */}
							<CourseContentCTA currentCourse={currentItem} />
							<WhatYouWillLearn currentCourse={currentItem} />
							<CourseFeatures currentCourse={currentItem} />
							<CourseStructure currentCourse={currentItem} />
							<BonusContent />
							<StudentVideoReviews />
							{/* <CountdownCTA /> */}
							<Pricing currentCourse={currentItem} />
							<QA />
							<Footer />
						</>
					) : (
						<div className="flex items-center justify-center min-h-[50vh]">
							<div className="text-center">
								<div className="text-6xl mb-4">🚫</div>
								<h2 className="text-2xl font-bold mb-2">
									Segment Not Included!
								</h2>
								<p className="text-base-content/70">
									{activeSegment} segment is not available for{" "}
									{currentItem?.name}
								</p>
								<p className="text-sm text-base-content/50 mt-2">
									Please select an available segment from the tabs above.
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</section>
	);
};

export default SalesPageContentAgent;
