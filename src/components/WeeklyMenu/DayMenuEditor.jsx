import { useState } from "react";
import { X, Camera, Type } from "lucide-react";

const DailyMenuImageModal = ({
	day,
	menuItems,
	weekRange,
	isOpen,
	onClose,
}) => {
	const [selectedItems, setSelectedItems] = useState([]);
	const [focItems, setFocItems] = useState([]);

	// Background image URL - Blackboard texture
	const backgroundImageUrl =
		// "https://i.pinimg.com/736x/0d/5a/4c/0d5a4cc0d7f634288909bbc06fa240a0.jpg";
		"https://i.pinimg.com/736x/4e/dd/77/4edd77625687b798568acaae825544f6.jpg";

	// Separate items by category
	const mainItems = menuItems.filter(
		(item) => !["Soup", "Side"].includes(item.category)
	);
	const soupItems = menuItems.filter((item) => item.category === "Soup");
	const sideItems = menuItems.filter((item) => item.category === "Side");

	const toggleItemSelection = (item) => {
		if (selectedItems.some((i) => i.id === item.id)) {
			setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
		} else {
			setSelectedItems([...selectedItems, item]);
		}
	};

	const toggleFocItem = (item) => {
		if (focItems.some((i) => i.id === item.id)) {
			setFocItems(focItems.filter((i) => i.id !== item.id));
		} else {
			setFocItems([...focItems, item]);
		}
	};

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div
				className="modal-backdrop fixed inset-0 bg-black/50 z-40"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="modal modal-open z-50">
				<div className="modal-box max-w-6xl w-full max-h-[90vh] overflow-y-auto">
					<div className="flex justify-between items-center mb-6">
						<div>
							<h3 className="font-bold text-2xl">
								Create Menu Image for {day}
							</h3>
							<p className="text-gray-600">{weekRange}</p>
						</div>
						<button className="btn btn-circle btn-ghost" onClick={onClose}>
							<X className="w-6 h-6" />
						</button>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						{/* Left Panel - Editor Controls */}
						<div className="space-y-6">
							{/* Item Selection */}
							<div className="bg-base-100 rounded-lg p-4 border">
								<h4 className="font-bold text-lg mb-3 flex items-center gap-2">
									<Type className="w-5 h-5" />
									Select Menu Items
								</h4>
								<div className="space-y-4">
									{mainItems.length > 0 && (
										<div>
											<h5 className="font-medium mb-2">Main Dishes</h5>
											<div className="space-y-2 max-h-60 overflow-y-auto p-1">
												{mainItems.map((item) => (
													<label
														key={item.id}
														className="flex items-center gap-3 p-2 hover:bg-base-200 rounded cursor-pointer">
														<input
															type="checkbox"
															checked={selectedItems.some(
																(i) => i.id === item.id
															)}
															onChange={() => toggleItemSelection(item)}
															className="checkbox checkbox-primary"
														/>
														<div className="flex-1 min-w-0">
															<div className="font-medium truncate">
																{item.name_burmese}
															</div>
															<div className="text-sm text-gray-600 truncate">
																{item.name_english}
															</div>
														</div>
														<div className="badge badge-outline shrink-0">
															{item.category}
														</div>
													</label>
												))}
											</div>
										</div>
									)}

									{soupItems.length > 0 && (
										<div>
											<h5 className="font-medium mb-2 text-emerald-700">
												Soup (FOC)
											</h5>
											<div className="space-y-2 max-h-40 overflow-y-auto p-1">
												{soupItems.map((item) => (
													<label
														key={item.id}
														className="flex items-center gap-3 p-2 hover:bg-emerald-50 rounded cursor-pointer">
														<input
															type="checkbox"
															checked={focItems.some((i) => i.id === item.id)}
															onChange={() => toggleFocItem(item)}
															className="checkbox checkbox-accent"
														/>
														<div className="flex-1 min-w-0">
															<div className="font-medium truncate">
																{item.name_burmese}
															</div>
															<div className="text-sm text-gray-600 truncate">
																{item.name_english}
															</div>
														</div>
														<div className="badge badge-accent shrink-0">
															FREE
														</div>
													</label>
												))}
											</div>
										</div>
									)}

									{sideItems.length > 0 && (
										<div>
											<h5 className="font-medium mb-2 text-emerald-700">
												Side Dishes (FOC)
											</h5>
											<div className="space-y-2 max-h-40 overflow-y-auto p-1">
												{sideItems.map((item) => (
													<label
														key={item.id}
														className="flex items-center gap-3 p-2 hover:bg-emerald-50 rounded cursor-pointer">
														<input
															type="checkbox"
															checked={focItems.some((i) => i.id === item.id)}
															onChange={() => toggleFocItem(item)}
															className="checkbox checkbox-accent"
														/>
														<div className="flex-1 min-w-0">
															<div className="font-medium truncate">
																{item.name_burmese}
															</div>
															<div className="text-sm text-gray-600 truncate">
																{item.name_english}
															</div>
														</div>
														<div className="badge badge-accent shrink-0">
															FREE
														</div>
													</label>
												))}
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Selection Summary */}
							<div className="bg-base-100 rounded-lg p-4 border">
								<h4 className="font-bold text-lg mb-3">Selection Summary</h4>
								<div className="space-y-2">
									<div className="flex justify-between">
										<span>Main Dishes:</span>
										<span className="font-medium">
											{selectedItems.length} selected
										</span>
									</div>
									<div className="flex justify-between">
										<span>FOC Items:</span>
										<span className="font-medium text-emerald-600">
											{focItems.length} selected
										</span>
									</div>
									<div className="pt-2 border-t">
										<div className="flex justify-between font-bold">
											<span>Total Items:</span>
											<span>{selectedItems.length + focItems.length}</span>
										</div>
									</div>
								</div>
							</div>

							{/* Instructions */}
							<div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
								<h4 className="font-bold text-lg mb-2 text-blue-700">
									How to Use
								</h4>
								<ul className="text-sm text-blue-600 space-y-1">
									<li>✓ Select menu items from the left</li>
									<li>✓ The right panel shows how it will look</li>
									<li>✓ Take a screenshot of the right panel</li>
									<li>✓ Use for social media or printing</li>
								</ul>
							</div>
						</div>

						{/* Right Panel - Blackboard Preview (Portrait 9:16) */}
						<div className="space-y-4 md:p-16">
							<div className="flex justify-between items-center">
								<h4 className="font-bold text-lg flex items-center gap-2">
									<Camera className="w-5 h-5" />
									Blackboard Preview (Screenshot this)
								</h4>
							</div>

							{/* Blackboard Container - Fixed 9:16 Aspect Ratio */}
							<div
								className="relative overflow-hidden rounded-lg shadow-2xl"
								style={{
									width: "100%",
									paddingBottom: "177.77%", // 9:16 aspect ratio (9/16 = 0.5625)
									position: "relative",
								}}>
								<div
									className="absolute inset-0 flex flex-col p-8"
									style={{
										backgroundImage: `url(${backgroundImageUrl})`,
										backgroundSize: "cover",
										backgroundPosition: "center",
										backgroundRepeat: "no-repeat",
										fontFamily:
											"'Dancing Script', 'Caveat', 'Patrick Hand', cursive, sans-serif",
									}}>
									{/* Dark overlay for better text readability */}
									{/* <div className="absolute inset-0 bg-black/30"></div> */}

									{/* Content Container */}
									<div className="relative z-10 flex-1 flex flex-col text-white">
										{/* Day Header - Chalk Text Effect */}
										<div className="text-center">
											<p
												className="text-2xl font-bold mb-2"
												style={{
													textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
													fontFamily: "'Caveat', cursive",
													color: "#fff",
													letterSpacing: "1px",
												}}>
												{day.toUpperCase()}
											</p>
											{/* <p
												className="text-sm opacity-90"
												style={{
													fontFamily: "'Dancing Script', cursive",
													color: "#f0f0f0",
												}}>
												{weekRange}
											</p> */}
										</div>

										{/* Main Dishes Section */}
										<div className="flex-1 overflow-y-auto">
											{selectedItems.length > 0 ? (
												<div className="space-y-4">
													<div className="text-center mb-6">
														<h2 className="text-2xl font-bold mb-4 inline-block px-6 py-2 border-b-2 border-white/50">
															Special Menu
														</h2>
													</div>

													{/* Menu Items List */}
													<div className="space-y-3 pl-4 pr-2">
														{selectedItems.map((item) => (
															<div
																key={item.id}
																className="flex items-start"
																style={{
																	fontFamily:
																		"'Myanmar Moe', 'Pyidaungsu', 'Myanmar3', sans-serif",
																}}>
																{/* Burmese Name */}
																<div className="flex-1">
																	<div className="text-2xl font-bold leading-tight">
																		{item.name_burmese}
																	</div>
																	{/* English Name */}
																	{item.name_english && (
																		<div className="text-sm opacity-80 italic">
																			{item.name_english}
																		</div>
																	)}
																</div>
															</div>
														))}
													</div>
												</div>
											) : (
												<div className="flex items-center justify-center h-full">
													<p
														className="text-lg text-center opacity-70"
														style={{
															fontFamily: "'Caveat', cursive",
														}}>
														Select menu items to display
													</p>
												</div>
											)}
										</div>

										{/* FOC Section - Bottom of blackboard */}
										{focItems.length > 0 && (
											<div
												className="mt-auto pt-4 border-t border-white/30"
												style={{
													fontFamily:
														"'Myanmar Moe', 'Pyidaungsu', 'Myanmar3', sans-serif",
												}}>
												<h3
													className="text-xl font-bold text-center mb-3"
													style={{
														color: "#a5d6a7",
														textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
													}}>
													Complimentary
												</h3>
												<div className="grid grid-cols-2 gap-3">
													{focItems.map((item) => (
														<div key={item.id} className="text-center">
															<div className="text-sm md:text-lg font-bold">
																{item.name_burmese}
															</div>
															{item.name_english && (
																<div className="text-sm opacity-80">
																	{item.name_english}
																</div>
															)}
														</div>
													))}
												</div>
											</div>
										)}

										{/* Footer - Restaurant Name */}
										{/* <div className="text-center pt-4 mt-4 border-t border-white/20">
											<p
												className="text-lg font-bold"
												style={{
													fontFamily: "'Caveat', cursive",
													color: "#fff",
													textShadow: "1px 1px 3px rgba(0,0,0,0.8)",
												}}>
												Shal 
											</p>
										</div> */}
									</div>
								</div>
							</div>

							{/* Screenshot Instructions */}
							<div className="text-center">
								<p className="text-sm text-gray-600">
									📱 Use your device's screenshot function to capture this
									blackboard
								</p>
								<p className="text-xs text-gray-500 mt-1">
									Portrait 9:16 ratio - Perfect for Instagram Stories
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default DailyMenuImageModal;
