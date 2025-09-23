import { useState, useEffect } from "react";
import {
	CheckCircle,
	Circle,
	ArrowRight,
	FileText,
	Mail,
	ShoppingCart,
	Layout,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import useCreatorStore from "../stores/creatorStore";

// Dummy precheck data for each task type
const precheckData = {
	"sales-page": {
		title: "Sales Page Pre-Checks",
		icon: <Layout className="w-6 h-6" />,
		items: [
			"Course pricing and segments are finalized",
			"Bundle information is complete and accurate",
			"All bonus materials are listed and described",
			"Brand colors and visual elements are confirmed",
			"Payment methods and currency are set",
			"Course delivery timeline is established",
			"Legal disclaimers and terms are reviewed",
			"CTA buttons and links are verified",
		],
	},
	"wl-page": {
		title: "Waiting List Pre-Checks",
		icon: <FileText className="w-6 h-6" />,
		items: [
			"Launch date and timeline are confirmed",
			"Early bird pricing strategy is defined",
			"Email sequence for waitlist is prepared",
			"Waitlist capacity limits are set",
			"Notification system is configured",
			"Social proof elements are gathered",
			"FOMO elements and urgency copy are ready",
			"Thank you page content is prepared",
		],
	},
	email: {
		title: "Email Campaign Pre-Checks",
		icon: <Mail className="w-6 h-6" />,
		items: [
			"Email list segments are identified",
			"Subject line variations are tested",
			"Email template design is approved",
			"Personalization tokens are configured",
			"Call-to-action buttons are optimized",
			"Mobile responsiveness is verified",
			"Spam filter compliance is checked",
			"Unsubscribe links are functional",
			"A/B testing parameters are set",
		],
	},
	"store-page": {
		title: "Store Page Pre-Checks",
		icon: <ShoppingCart className="w-6 h-6" />,
		items: [
			"Product catalog is complete and organized",
			"Inventory levels are updated",
			"Shipping options and rates are configured",
			"Payment gateway integration is tested",
			"Product images and descriptions are optimized",
			"Customer reviews and testimonials are collected",
			"Return and refund policies are published",
			"SEO metadata is optimized",
			"Analytics tracking is implemented",
		],
	},
};

const GlobalPreChecks = () => {
	const { currentCreator } = useCreatorStore();
	const creatorId = currentCreator.id;
	// Simulate getting taskType and id from URL search params
	const [taskType, setTaskType] = useState("sales-page");
	const [checkedItems, setCheckedItems] = useState({});

	// Get current precheck data
	const currentPrecheck = precheckData[taskType] || precheckData["sales-page"];

	// Initialize checked items state
	useEffect(() => {
		const initialState = {};
		currentPrecheck.items.forEach((_, index) => {
			initialState[index] = false;
		});
		setCheckedItems(initialState);
	}, [currentPrecheck.items, taskType]);

	// Handle checkbox toggle
	const handleCheckToggle = (index) => {
		setCheckedItems((prev) => ({
			...prev,
			[index]: !prev[index],
		}));
	};

	// Check if all items are checked
	const allItemsChecked = Object.values(checkedItems).every(
		(checked) => checked
	);
	const checkedCount = Object.values(checkedItems).filter(
		(checked) => checked
	).length;
	const totalCount = currentPrecheck.items.length;

	// Task type selector for demo purposes
	const handleTaskTypeChange = (newTaskType) => {
		setTaskType(newTaskType);
	};

	return (
		<div className="min-h-screen bg-base-200 p-6">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center gap-3 mb-4">
						<div className="p-2 bg-primary/10 rounded-lg text-primary">
							{currentPrecheck.icon}
						</div>
						<div>
							<h1 className="text-3xl font-bold text-base-content">
								{currentPrecheck.title}
							</h1>
							<p className="text-base-content/70">
								Complete all pre-checks before proceeding
							</p>
						</div>
					</div>

					{/* Progress indicator */}
					<div className="flex items-center gap-4">
						<div className="flex-1">
							<div className="flex justify-between text-sm text-base-content/70 mb-1">
								<span>Progress</span>
								<span>
									{checkedCount}/{totalCount}
								</span>
							</div>
							<div className="w-full bg-base-300 rounded-full h-2">
								<div
									className="bg-primary h-2 rounded-full transition-all duration-300"
									style={{
										width: `${(checkedCount / totalCount) * 100}%`,
									}}></div>
							</div>
						</div>
					</div>
				</div>

				{/* Demo Task Type Selector */}
				<div className="mb-6">
					<div className="text-sm text-base-content/70 mb-2">
						Demo: Select Task Type
					</div>
					<div className="flex gap-2 flex-wrap">
						{Object.keys(precheckData).map((type) => (
							<button
								key={type}
								onClick={() => handleTaskTypeChange(type)}
								className={`btn btn-sm ${
									taskType === type ? "btn-primary" : "btn-outline"
								}`}>
								{type
									.replace("-", " ")
									.replace(/\b\w/g, (l) => l.toUpperCase())}
							</button>
						))}
					</div>
				</div>

				{/* Pre-checks Card */}
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<div className="space-y-4">
							{currentPrecheck.items.map((item, index) => (
								<div
									key={index}
									className="flex items-start gap-4 p-4 rounded-lg hover:bg-base-200/50 transition-colors cursor-pointer"
									onClick={() => handleCheckToggle(index)}>
									{/* Checkbox */}
									<div className="flex-shrink-0 pt-1">
										{checkedItems[index] ? (
											<CheckCircle className="w-6 h-6 text-success" />
										) : (
											<Circle className="w-6 h-6 text-base-content/30" />
										)}
									</div>

									{/* Pre-check text */}
									<div className="flex-1">
										<p
											className={`text-base leading-relaxed ${
												checkedItems[index]
													? "text-base-content line-through opacity-70"
													: "text-base-content"
											}`}>
											{item}
										</p>
									</div>
								</div>
							))}
						</div>

						{/* Proceed Button */}
						<Link
							to="/content-agent/sales-page"
							search={{ id: creatorId }}
							className="card-actions justify-end mt-8">
							<button
								className={`btn btn-lg gap-2 ${
									allItemsChecked ? "btn-primary" : "btn-disabled"
								}`}
								disabled={!allItemsChecked}>
								Proceed to Content Agent
								<ArrowRight className="w-5 h-5" />
							</button>
						</Link>
					</div>
				</div>

				{/* Info Card */}
				{allItemsChecked && (
					<div className="alert alert-success mt-6 animate-fade-in">
						<CheckCircle className="w-6 h-6" />
						<div>
							<h3 className="font-bold">All pre-checks completed!</h3>
							<div className="text-sm opacity-90">
								You're ready to proceed to the Content Agent page.
							</div>
						</div>
					</div>
				)}

				{!allItemsChecked && (
					<div className="alert alert-info mt-6">
						<Circle className="w-6 h-6" />
						<div>
							<h3 className="font-bold">Complete all pre-checks</h3>
							<div className="text-sm opacity-90">
								Please ensure all items are verified before proceeding to
								content generation.
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default GlobalPreChecks;
