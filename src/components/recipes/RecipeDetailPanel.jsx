// src/components/recipes/RecipeDetailPanel.jsx
import React, { useState } from "react";
import {
	ChefHat,
	Edit2,
	Trash2,
	Clock,
	Calendar,
	Scale,
	Box,
	Utensils,
	ExternalLink,
	Layers,
	FileText,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { getSafeImageUrl } from "../../utils/imageUtils";
import RecipeMarginBanner from "./RecipeMarginBanner";
import RecipeComponentAdder from "./RecipeComponentAdder";

const RecipeDetailPanel = ({
	recipe,
	explodedBom,
	bomLoading,
	usedInRecipes,
	branchPreps,
	inventoryItems,
	onSelectRecipe,
	onEditRecipe,
	onDeleteRecipe,
	onAddComponent,
	onDeleteComponent,
}) => {
	const [showBomBreakdown, setShowBomBreakdown] = useState(true);
	const isMenuPrep = recipe.recipe_type === "menu_prep";

	const handleDelete = () => {
		if (
			window.confirm(
				`Are you sure you want to delete "${recipe.name_english || recipe.name_burmese}"?`
			)
		) {
			onDeleteRecipe(recipe.id);
		}
	};

	const handleDeleteComp = (comp) => {
		const compName =
			comp.component_type === "sub_recipe"
				? comp.sub_recipe?.name_english || comp.sub_recipe?.name_burmese
				: comp.inventory_item?.name_english || comp.inventory_item?.name_burmese;

		if (window.confirm(`Remove ${compName} from this recipe?`)) {
			onDeleteComponent(comp.id, recipe.id);
		}
	};

	return (
		<div className="h-full overflow-y-auto space-y-5 pr-1 pb-10">
			{/* Top Hero / Header Card */}
			<div className="bg-base-100 rounded-2xl border border-base-200 p-4 sm:p-6 shadow-sm space-y-4">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div className="flex items-center gap-4 min-w-0">
						{/* Thumbnail */}
						<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-base-200 border border-base-300 overflow-hidden flex-shrink-0 flex items-center justify-center">
							{getSafeImageUrl(recipe.image_url) ? (
								<img
									src={getSafeImageUrl(recipe.image_url)}
									alt={recipe.name_english}
									className="w-full h-full object-cover"
								/>
							) : (
								<ChefHat className="w-8 h-8 text-base-content/30" />
							)}
						</div>

						<div className="min-w-0">
							<div className="flex items-center gap-2 flex-wrap">
								<span
									className={`badge badge-sm font-semibold ${
										isMenuPrep
											? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
											: "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
									}`}>
									{isMenuPrep ? "Menu Prep (POS Dish)" : "Branch Prep (Sub-Recipe)"}
								</span>
								{recipe.menu_item && (
									<span className="badge badge-warning badge-outline badge-sm">
										POS Price: ฿{recipe.menu_item.price}
									</span>
								)}
							</div>

							{/* Primary Bold Burmese Name */}
							<h2 className="text-xl sm:text-2xl font-bold leading-relaxed text-base-content mt-1">
								{recipe.name_burmese}
							</h2>

							{/* Secondary English Subtitle */}
							<p className="text-xs sm:text-sm text-base-content/60">
								{recipe.name_english}
							</p>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center gap-2 self-end sm:self-start">
						<button
							type="button"
							onClick={() => onEditRecipe(recipe)}
							className="btn btn-sm btn-outline gap-1.5">
							<Edit2 className="w-3.5 h-3.5" /> Edit Info
						</button>
						<button
							type="button"
							onClick={handleDelete}
							className="btn btn-sm btn-ghost btn-square text-error"
							title="Delete recipe">
							<Trash2 className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Quick Stats Badges */}
				<div className="flex flex-wrap items-center gap-3 pt-2 border-t border-base-200 text-xs">
					<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-base-200/60 font-medium">
						<Scale className="w-4 h-4 text-primary" />
						<span>
							Yield: <strong>{recipe.yield_quantity} {recipe.yield_unit}</strong>
						</span>
					</div>

					<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-base-200/60 font-medium">
						<Clock className="w-4 h-4 text-base-content/60" />
						<span>Prep: {recipe.prep_time_minutes || 15} mins</span>
					</div>

					<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-base-200/60 font-medium">
						<Calendar className="w-4 h-4 text-base-content/60" />
						<span>Shelf Life: {recipe.shelf_life_days || 1} day(s)</span>
					</div>
				</div>

				{/* Used In Badges (for branch_prep) */}
				{!isMenuPrep && (
					<div className="pt-2 border-t border-base-200 space-y-1.5">
						<span className="text-[11px] font-semibold text-base-content/60 uppercase tracking-wider block">
							Consumed by Parent Recipes ({usedInRecipes.length}):
						</span>
						{usedInRecipes.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{usedInRecipes.map((parent) => (
									<button
										key={parent.id}
										type="button"
										onClick={() => onSelectRecipe(parent.id)}
										className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-500/20 transition-all">
										<ExternalLink className="w-3 h-3" />
										<span>{parent.name_burmese} ({parent.name_english})</span>
									</button>
								))}
							</div>
						) : (
							<p className="text-xs text-base-content/40 italic">
								Not currently consumed by any other recipes (standalone batch).
							</p>
						)}
					</div>
				)}
			</div>

			{/* Live Margin Banner (For menu_prep) */}
			{isMenuPrep && recipe.menu_item && (
				<RecipeMarginBanner
					sellingPrice={recipe.menu_item.price}
					explodedCost={explodedBom?.totalCost || 0}
				/>
			)}

			{/* Recipe Components Section (The Bill of Materials Edges) */}
			<div className="bg-base-100 rounded-2xl border border-base-200 p-4 sm:p-5 shadow-sm space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Layers className="w-5 h-5 text-primary" />
						<h3 className="font-bold text-base leading-relaxed">
							Components & Ingredients (ပါဝင်ပစ္စည်းများနှင့် အနှစ်များ)
						</h3>
					</div>
					<span className="badge badge-ghost badge-sm">
						{recipe.components?.length || 0} items
					</span>
				</div>

				{/* Components List */}
				{recipe.components && recipe.components.length > 0 ? (
					<div className="divide-y divide-base-200 overflow-hidden rounded-xl border border-base-200">
						{recipe.components.map((comp) => {
							const isSubRecipe = comp.component_type === "sub_recipe";
							const target = isSubRecipe ? comp.sub_recipe : comp.inventory_item;

							return (
								<div
									key={comp.id}
									className="p-3 bg-base-100 hover:bg-base-200/40 transition-colors flex items-center justify-between gap-3">
									<div className="flex items-center gap-3 min-w-0">
										<span
											className={`p-2 rounded-xl flex-shrink-0 ${
												isSubRecipe
													? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
													: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
											}`}>
											{isSubRecipe ? (
												<Utensils className="w-4 h-4" />
											) : (
												<Box className="w-4 h-4" />
											)}
										</span>

										<div className="min-w-0">
											<div className="flex items-center gap-1.5 flex-wrap">
												<p className="font-semibold text-xs leading-relaxed text-base-content">
													{target?.name_burmese || target?.name}
												</p>
												<span
													className={`badge badge-xs ${
														isSubRecipe
															? "bg-indigo-500/10 text-indigo-500"
															: "bg-emerald-500/10 text-emerald-500"
													}`}>
													{isSubRecipe ? "Sub-Recipe" : "Raw Stock"}
												</span>
											</div>
											<p className="text-[11px] text-base-content/60 truncate">
												{target?.name_english}
												{comp.notes && ` • ${comp.notes}`}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-3 flex-shrink-0">
										<div className="text-right">
											<span className="font-bold text-sm block">
												{comp.quantity} {comp.unit}
											</span>
											{comp.waste_percentage > 0 && (
												<span className="text-[10px] text-amber-500 block">
													+{comp.waste_percentage}% trim
												</span>
											)}
										</div>

										<button
											type="button"
											onClick={() => handleDeleteComp(comp)}
											className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10"
											title="Remove from recipe">
											<Trash2 className="w-3.5 h-3.5" />
										</button>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className="p-8 text-center text-base-content/40 border border-dashed border-base-300 rounded-xl space-y-1">
						<Utensils className="w-8 h-8 mx-auto opacity-30" />
						<p className="text-xs">No components added yet. Add raw ingredients or sub-recipes below.</p>
					</div>
				)}

				{/* Unified Component Adder */}
				<RecipeComponentAdder
					currentRecipe={recipe}
					branchPreps={branchPreps}
					inventoryItems={inventoryItems}
					onAddComponent={onAddComponent}
				/>
			</div>

			{/* Exploded BOM Breakdown Accordion */}
			<div className="bg-base-100 rounded-2xl border border-base-200 overflow-hidden shadow-sm">
				<button
					type="button"
					onClick={() => setShowBomBreakdown(!showBomBreakdown)}
					className="w-full p-4 flex items-center justify-between text-left font-bold text-sm bg-base-200/40 hover:bg-base-200 transition-colors">
					<div className="flex items-center gap-2">
						<Scale className="w-4 h-4 text-primary" />
						<span>Exploded Bill of Materials (ကုန်ကြမ်းကုန်ကျစရိတ် အသေးစိတ်)</span>
					</div>
					<div className="flex items-center gap-3">
						{explodedBom && (
							<span className="badge badge-primary font-bold text-xs">
								Total: ฿{explodedBom.totalCost.toFixed(2)}
							</span>
						)}
						{showBomBreakdown ? (
							<ChevronUp className="w-4 h-4" />
						) : (
							<ChevronDown className="w-4 h-4" />
						)}
					</div>
				</button>

				{showBomBreakdown && (
					<div className="p-4 space-y-3">
						<p className="text-xs text-base-content/60">
							This table calculates all nested sub-recipes recursively down to vendor purchase units using the 3-step conversion pipeline.
						</p>

						{bomLoading ? (
							<div className="p-6 text-center">
								<span className="loading loading-spinner loading-md text-primary"></span>
							</div>
						) : explodedBom?.rawItems?.length > 0 ? (
							<div className="overflow-x-auto">
								<table className="table table-xs w-full">
									<thead>
										<tr className="border-b border-base-200">
											<th>Raw Ingredient</th>
											<th>Purchase Units Needed</th>
											<th>Cost / Unit</th>
											<th className="text-right">Total (฿)</th>
										</tr>
									</thead>
									<tbody>
										{explodedBom.rawItems.map((item) => (
											<tr key={item.inv_id} className="hover">
												<td>
													<p className="font-semibold leading-relaxed">
														{item.inv_name_mm}
													</p>
													<p className="text-[10px] text-base-content/60">
														{item.inv_name_en}
													</p>
												</td>
												<td>
													<span className="font-bold">
														{Number(item.total_purchase_units_required).toFixed(4)}
													</span>{" "}
													<span className="text-base-content/60">
														{item.inv_purchase_unit}
													</span>
												</td>
												<td>
													฿{Number(item.cost_per_unit).toFixed(2)}
												</td>
												<td className="text-right font-black text-rose-500 dark:text-rose-400">
													฿{Number(item.total_cost).toFixed(2)}
												</td>
											</tr>
										))}
									</tbody>
									<tfoot>
										<tr className="border-t-2 border-base-300 font-black text-xs">
											<td colSpan={3}>Exploded Total Cost per Batch:</td>
											<td className="text-right text-sm text-primary">
												฿{explodedBom.totalCost.toFixed(2)}
											</td>
										</tr>
									</tfoot>
								</table>
							</div>
						) : (
							<p className="text-xs italic text-base-content/50 py-2">
								Add components above to calculate the exploded bill of materials.
							</p>
						)}
					</div>
				)}
			</div>

			{/* Instructions Section */}
			{(recipe.instructions_burmese || recipe.instructions_english) && (
				<div className="bg-base-100 rounded-2xl border border-base-200 p-4 sm:p-5 shadow-sm space-y-3">
					<div className="flex items-center gap-2">
						<FileText className="w-5 h-5 text-primary" />
						<h3 className="font-bold text-base leading-relaxed">
							Preparation & Cooking Instructions (ချက်ပြုတ်ပြင်ဆင်နည်း)
						</h3>
					</div>

					{recipe.instructions_burmese && (
						<div className="p-3.5 rounded-xl bg-base-200/50 space-y-1">
							<span className="text-[11px] font-bold text-primary uppercase tracking-wide">
								မြန်မာဘာသာ ညွှန်ကြားချက်
							</span>
							<p className="text-xs whitespace-pre-wrap leading-relaxed text-base-content">
								{recipe.instructions_burmese}
							</p>
						</div>
					)}

					{recipe.instructions_english && (
						<div className="p-3.5 rounded-xl bg-base-200/50 space-y-1">
							<span className="text-[11px] font-bold text-base-content/60 uppercase tracking-wide">
								English Instructions
							</span>
							<p className="text-xs whitespace-pre-wrap leading-relaxed text-base-content/80">
								{recipe.instructions_english}
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default RecipeDetailPanel;
