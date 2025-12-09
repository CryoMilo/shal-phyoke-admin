import React from "react";
import { Search, Filter } from "lucide-react";

const MenuFilters = ({
	searchQuery,
	setSearchQuery,
	activeCategory,
	setActiveCategory,
	showActiveOnly,
	setShowActiveOnly,
	categories,
	filteredCount,
	totalCount,
}) => {
	return (
		<div className="bg-base-100 rounded-lg shadow-sm p-4 mb-6">
			{/* Search Bar */}
			<div className="mb-4">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
					<input
						type="text"
						placeholder="Search menu items by name or description..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-10 pr-4 py-2 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-4">
				{/* Category Filter */}
				<div className="flex items-center gap-2">
					<Filter className="w-4 h-4 text-gray-500" />
					<select
						value={activeCategory}
						onChange={(e) => setActiveCategory(e.target.value)}
						className="select select-bordered select-sm">
						<option value="all">All Categories</option>
						{categories.map((category) => (
							<option key={category} value={category}>
								{category}
							</option>
						))}
					</select>
				</div>

				{/* Active/Inactive Toggle */}
				<div className="flex items-center gap-2">
					<label className="label cursor-pointer">
						<span className="label-text mr-2">Active Only</span>
						<input
							type="checkbox"
							className="toggle toggle-sm toggle-primary"
							checked={showActiveOnly}
							onChange={(e) => setShowActiveOnly(e.target.checked)}
						/>
					</label>
				</div>

				{/* Results Count */}
				<div className="ml-auto text-sm text-gray-500">
					Showing {filteredCount} of {totalCount} items
				</div>
			</div>
		</div>
	);
};

export default MenuFilters;
