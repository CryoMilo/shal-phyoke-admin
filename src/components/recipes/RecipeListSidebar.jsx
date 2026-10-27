// src/components/recipes/RecipeListSidebar.jsx
import React from "react";
import { Search, ChefHat, Utensils, Plus, Sparkles } from "lucide-react";
import { getSafeImageUrl } from "../../utils/imageUtils";

const RecipeListSidebar = ({
	recipes,
	selectedRecipeId,
	onSelectRecipe,
	filterType,
	onFilterChange,
	searchQuery,
	onSearchChange,
	onCreateNew,
}) => {
	const menuPrepCount = recipes.filter((r) => r.recipe_type === "menu_prep").length;
	const branchPrepCount = recipes.filter((r) => r.recipe_type === "branch_prep").length;

	return (
		<div className="flex flex-col h-full bg-base-100 rounded-2xl border border-base-200 overflow-hidden shadow-sm">
			{/* Top Header & Search */}
			<div className="p-3.5 border-b border-base-200 space-y-2.5">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<ChefHat className="w-5 h-5 text-primary" />
						<span className="font-bold text-sm tracking-wide">
							Recipes ({recipes.length})
						</span>
					</div>
					<button
						type="button"
						onClick={onCreateNew}
						className="btn btn-xs btn-primary gap-1">
						<Plus className="w-3.5 h-3.5" /> New Recipe
					</button>
				</div>

				{/* Search Input */}
				<div className="relative">
					<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Search recipe by name..."
						className="input input-bordered input-sm w-full pl-9 text-xs"
					/>
				</div>

				{/* Filter Tabs */}
				<div className="grid grid-cols-3 gap-1 bg-base-200 p-1 rounded-xl text-center text-xs">
					<button
						type="button"
						onClick={() => onFilterChange("all")}
						className={`py-1 rounded-lg font-medium transition-all ${
							filterType === "all"
								? "bg-base-100 shadow-sm text-base-content font-bold"
								: "text-base-content/60 hover:text-base-content"
						}`}>
						All ({recipes.length})
					</button>
					<button
						type="button"
						onClick={() => onFilterChange("menu_prep")}
						className={`py-1 rounded-lg font-medium transition-all ${
							filterType === "menu_prep"
								? "bg-amber-500 text-white shadow-sm font-bold"
								: "text-base-content/60 hover:text-base-content"
						}`}>
						Menu ({menuPrepCount})
					</button>
					<button
						type="button"
						onClick={() => onFilterChange("branch_prep")}
						className={`py-1 rounded-lg font-medium transition-all ${
							filterType === "branch_prep"
								? "bg-indigo-500 text-white shadow-sm font-bold"
								: "text-base-content/60 hover:text-base-content"
						}`}>
						Branch ({branchPrepCount})
					</button>
				</div>
			</div>

			{/* Recipe Cards List */}
			<div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-base-200/50">
				{recipes.length === 0 ? (
					<div className="p-8 text-center text-base-content/50 space-y-2">
						<ChefHat className="w-8 h-8 mx-auto opacity-30" />
						<p className="text-xs">No recipes found matching query</p>
					</div>
				) : (
					recipes.map((recipe) => {
						const isSelected = selectedRecipeId === recipe.id;
						const isMenuPrep = recipe.recipe_type === "menu_prep";

						return (
							<button
								key={recipe.id}
								type="button"
								onClick={() => onSelectRecipe(recipe.id)}
								className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group pt-2.5 ${
									isSelected
										? "bg-primary/10 border-2 border-primary shadow-sm"
										: "hover:bg-base-200/60 border border-transparent"
								}`}>
								{/* Image Thumbnail */}
								<div className="w-12 h-12 rounded-xl bg-base-200 border border-base-300 overflow-hidden flex-shrink-0 flex items-center justify-center">
									{getSafeImageUrl(recipe.image_url) ? (
										<img
											src={getSafeImageUrl(recipe.image_url)}
											alt={recipe.name_english}
											className="w-full h-full object-cover"
										/>
									) : (
										<Utensils className="w-5 h-5 text-base-content/30" />
									)}
								</div>

								{/* Info */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-1">
										<span
											className={`badge badge-xs font-semibold ${
												isMenuPrep
													? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
													: "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
											}`}>
											{isMenuPrep ? "Menu Prep" : "Branch Prep"}
										</span>
										<span className="text-[11px] text-base-content/60 font-medium">
											{recipe.yield_quantity} {recipe.yield_unit}
										</span>
									</div>

									{/* Primary Burmese Heading */}
									<p className="font-semibold text-xs leading-relaxed text-base-content mt-1 truncate">
										{recipe.name_burmese}
									</p>

									{/* Secondary English Subtitle */}
									<p className="text-[11px] text-base-content/60 truncate">
										{recipe.name_english}
									</p>

									{/* Linked Menu indicator */}
									{recipe.menu_item && (
										<div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
											<Sparkles className="w-3 h-3" />
											<span>฿{recipe.menu_item.price}</span>
										</div>
									)}
								</div>
							</button>
						);
					})
				)}
			</div>
		</div>
	);
};

export default RecipeListSidebar;
