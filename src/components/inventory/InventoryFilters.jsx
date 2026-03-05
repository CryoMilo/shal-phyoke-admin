// src/components/inventory/InventoryFilters.jsx
import React from "react";
import { Search, Filter, X } from "lucide-react";

const InventoryFilters = ({
	searchQuery,
	setSearchQuery,
	activeCategory,
	setActiveCategory,
	showRegularOnly,
	setShowRegularOnly,
	categories,
	filteredCount,
	totalCount,
}) => {
	const handleClearSearch = () => {
		setSearchQuery("");
	};

	const handleToggleRegularOnly = () => {
		setShowRegularOnly(!showRegularOnly);
	};

	const handleClearFilters = () => {
		setSearchQuery("");
		setActiveCategory("all");
		setShowRegularOnly(false);
	};

	const hasActiveFilters =
		searchQuery !== "" || activeCategory !== "all" || showRegularOnly;

	return (
		<div className="card bg-base-100 shadow-sm border border-base-200 mb-6">
			<div className="card-body p-4 md:p-6">
				{/* Search and Filter Row */}
				<div className="flex flex-col md:flex-row gap-4">
					{/* Search Input */}
					<div className="flex-1">
						<label className="input input-bordered flex items-center gap-2 w-full">
							<Search className="w-4 h-4 text-gray-500" />
							<input
								type="text"
								className="grow"
								placeholder="Search by name or category..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
							{searchQuery && (
								<button
									onClick={handleClearSearch}
									className="btn btn-ghost btn-xs btn-circle">
									<X className="w-3 h-3" />
								</button>
							)}
						</label>
					</div>

					{/* Category Filter */}
					<div className="w-full md:w-64">
						<select
							className="select select-bordered w-full"
							value={activeCategory}
							onChange={(e) => setActiveCategory(e.target.value)}>
							<option value="all">All Categories</option>
							{categories.map((category) => (
								<option key={category} value={category}>
									{category}
								</option>
							))}
						</select>
					</div>

					{/* Regular Only Toggle */}
					<div className="flex items-center gap-2">
						<label className="label cursor-pointer gap-2">
							<span className="label-text text-sm">Regular only</span>
							<input
								type="checkbox"
								className="toggle toggle-primary toggle-sm"
								checked={showRegularOnly}
								onChange={handleToggleRegularOnly}
							/>
						</label>
					</div>
				</div>

				{/* Filter Stats and Clear */}
				<div className="flex justify-between items-center mt-2">
					<div className="text-sm text-gray-500">
						Showing{" "}
						<span className="font-medium text-gray-700">{filteredCount}</span>{" "}
						of <span className="font-medium text-gray-700">{totalCount}</span>{" "}
						items
					</div>

					{hasActiveFilters && (
						<button
							onClick={handleClearFilters}
							className="btn btn-ghost btn-xs gap-1 text-gray-500 hover:text-gray-700">
							<Filter className="w-3 h-3" />
							Clear Filters
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default InventoryFilters;
