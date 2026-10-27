// src/pages/Recipes.jsx
import React, { useState, useEffect } from "react";
import { ChefHat, LayoutGrid, Network, Plus } from "lucide-react";
import { Loading } from "../components/common/Loading";
import { PageHeader } from "../components/common/PageHeader";
import useRecipeStore from "../stores/recipeStore";
import useInventoryStore from "../stores/inventoryStore";
import RecipeListSidebar from "../components/recipes/RecipeListSidebar";
import RecipeDetailPanel from "../components/recipes/RecipeDetailPanel";
import RecipeDependencyGraph from "../components/recipes/RecipeDependencyGraph";
import RecipeModal from "../components/recipes/RecipeModal";

const Recipes = () => {
	const {
		recipes,
		allComponents,
		selectedRecipeId,
		selectedRecipe,
		explodedBom,
		bomLoading,
		loading,
		filterType,
		searchQuery,
		fetchRecipes,
		setSelectedRecipeId,
		createRecipe,
		updateRecipe,
		deleteRecipe,
		addComponent,
		deleteComponent,
		getUsedInRecipes,
		getFilteredRecipes,
		setFilterType,
		setSearchQuery,
	} = useRecipeStore();

	const { inventoryItems, fetchInventoryItems } = useInventoryStore();

	const [viewMode, setViewMode] = useState("split"); // 'split' | 'graph'
	const [showRecipeModal, setShowRecipeModal] = useState(false);
	const [editingRecipe, setEditingRecipe] = useState(null);

	useEffect(() => {
		fetchRecipes();
		fetchInventoryItems();
	}, [fetchRecipes, fetchInventoryItems]);

	// Auto-select first recipe if none selected
	useEffect(() => {
		if (!selectedRecipeId && recipes.length > 0) {
			setSelectedRecipeId(recipes[0].id);
		}
	}, [recipes, selectedRecipeId, setSelectedRecipeId]);

	const filteredRecipes = getFilteredRecipes();
	const branchPreps = recipes.filter((r) => r.recipe_type === "branch_prep");
	const usedInList = selectedRecipeId ? getUsedInRecipes(selectedRecipeId) : [];

	const handleCreateNew = () => {
		setEditingRecipe(null);
		setShowRecipeModal(true);
	};

	const handleEditRecipe = (recipe) => {
		setEditingRecipe(recipe);
		setShowRecipeModal(true);
	};

	const handleRecipeModalSubmit = async (data) => {
		if (editingRecipe) {
			return await updateRecipe(editingRecipe.id, data);
		} else {
			return await createRecipe(data);
		}
	};

	if (loading && recipes.length === 0) {
		return <Loading />;
	}

	return (
		<div className="container mx-auto p-3 md:p-6 space-y-4">
			{/* Top Page Header & Segmented View Mode Toggle */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div>
					<h1 className="text-xl sm:text-2xl font-bold text-base-content leading-relaxed">
						Interconnected Recipe Book (ဟင်းချက်နည်းနှင့် ကုန်ကျစရိတ်)
					</h1>
					<p className="text-xs text-base-content/60">
						Multi-level Bill of Materials, DAG Sub-Recipes, and live BOM Explosion.
					</p>
				</div>

				<div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
					{/* Top Segmented Toggle */}
					<div className="join bg-base-200 p-1 rounded-xl shadow-inner">
						<button
							type="button"
							onClick={() => setViewMode("split")}
							className={`join-item btn btn-sm gap-1.5 border-none ${
								viewMode === "split"
									? "btn-primary shadow-sm"
									: "btn-ghost text-base-content/70"
							}`}>
							<LayoutGrid className="w-4 h-4" />
							<span className="text-xs">Split Builder</span>
						</button>
						<button
							type="button"
							onClick={() => setViewMode("graph")}
							className={`join-item btn btn-sm gap-1.5 border-none ${
								viewMode === "graph"
									? "btn-primary shadow-sm"
									: "btn-ghost text-base-content/70"
							}`}>
							<Network className="w-4 h-4" />
							<span className="text-xs">Dependency Graph (DAG)</span>
						</button>
					</div>

					<button
						type="button"
						onClick={handleCreateNew}
						className="btn btn-sm btn-primary gap-1">
						<Plus className="w-4 h-4" /> New Recipe
					</button>
				</div>
			</div>

			{/* Main Workspace */}
			{viewMode === "split" ? (
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-180px)] min-h-[600px]">
					{/* Left Sidebar: Filterable Recipe List */}
					<div className="lg:col-span-4 xl:col-span-4 h-full">
						<RecipeListSidebar
							recipes={filteredRecipes}
							selectedRecipeId={selectedRecipeId}
							onSelectRecipe={setSelectedRecipeId}
							filterType={filterType}
							onFilterChange={setFilterType}
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
							onCreateNew={handleCreateNew}
						/>
					</div>

					{/* Right Main Panel: Recipe Details & Components */}
					<div className="lg:col-span-8 xl:col-span-8 h-full">
						{selectedRecipe ? (
							<RecipeDetailPanel
								recipe={selectedRecipe}
								explodedBom={explodedBom}
								bomLoading={bomLoading}
								usedInRecipes={usedInList}
								branchPreps={branchPreps}
								inventoryItems={inventoryItems}
								onSelectRecipe={setSelectedRecipeId}
								onEditRecipe={handleEditRecipe}
								onDeleteRecipe={deleteRecipe}
								onAddComponent={addComponent}
								onDeleteComponent={deleteComponent}
							/>
						) : (
							<div className="h-full flex flex-col items-center justify-center p-8 bg-base-100 rounded-2xl border border-base-200 text-center text-base-content/40 space-y-2">
								<ChefHat className="w-12 h-12 opacity-30" />
								<p className="text-sm font-semibold">No recipe selected</p>
								<p className="text-xs">Select a recipe from the sidebar or create a new one.</p>
							</div>
						)}
					</div>
				</div>
			) : (
				/* View B: Interactive Dependency Graph View */
				<div className="space-y-2">
					<RecipeDependencyGraph
						recipes={recipes}
						components={allComponents}
						onSelectRecipe={setSelectedRecipeId}
						onSwitchToSplitView={() => setViewMode("split")}
					/>
				</div>
			)}

			{/* Recipe Create/Edit Modal */}
			<RecipeModal
				showModal={showRecipeModal}
				setShowModal={setShowRecipeModal}
				editingRecipe={editingRecipe}
				onSubmitRecipe={handleRecipeModalSubmit}
				loading={loading}
			/>
		</div>
	);
};

export default Recipes;
