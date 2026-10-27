// src/stores/recipeStore.js
import { create } from "zustand";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";

const useRecipeStore = create((set, get) => ({
	recipes: [],
	allComponents: [], // Cached graph edges for instant dependency lookup
	selectedRecipeId: null,
	selectedRecipe: null,
	explodedBom: null,
	loading: false,
	bomLoading: false,
	error: null,

	// Filters
	filterType: "all", // 'all' | 'menu_prep' | 'branch_prep'
	searchQuery: "",

	setFilterType: (type) => set({ filterType: type }),
	setSearchQuery: (query) => set({ searchQuery: query }),
	setSelectedRecipeId: (id) => {
		set({ selectedRecipeId: id });
		if (id) {
			get().fetchRecipeDetails(id);
		} else {
			set({ selectedRecipe: null, explodedBom: null });
		}
	},

	// Fetch all recipes + all component edges for DAG & "Used in" lookups
	fetchRecipes: async () => {
		set({ loading: true });
		try {
			const [recipesRes, componentsRes] = await Promise.all([
				supabase
					.from("recipes")
					.select(
						`
            *,
            menu_item:menu_item_id (
              id,
              name_burmese,
              name_english,
              price,
              image_url
            )
          `
					)
					.order("recipe_type", { ascending: false })
					.order("name_english"),
				supabase
					.from("recipe_components")
					.select("id, parent_recipe_id, component_type, inventory_item_id, sub_recipe_id, quantity, unit, waste_percentage, sort_order"),
			]);

			if (recipesRes.error) throw recipesRes.error;
			if (componentsRes.error) throw componentsRes.error;

			set({
				recipes: recipesRes.data || [],
				allComponents: componentsRes.data || [],
				error: null,
			});
		} catch (error) {
			console.error("Error fetching recipes:", error);
			showToast.error("Failed to load recipes");
			set({ error: error.message });
		} finally {
			set({ loading: false });
		}
	},

	// Fetch full details of single recipe (including its resolved components & BOM cost)
	fetchRecipeDetails: async (recipeId) => {
		try {
			const { data: recipe, error: recipeErr } = await supabase
				.from("recipes")
				.select(
					`
          *,
          menu_item:menu_item_id (
            id,
            name_burmese,
            name_english,
            price,
            image_url
          )
        `
				)
				.eq("id", recipeId)
				.single();

			if (recipeErr) throw recipeErr;

			// Fetch components
			const { data: components, error: compErr } = await supabase
				.from("recipe_components")
				.select(
					`
          *,
          inventory_item:inventory_item_id (
            id,
            name_english,
            name_burmese,
            unit,
            base_unit,
            base_quantity_per_unit,
            cost_per_unit,
            image_url
          ),
          sub_recipe:sub_recipe_id (
            id,
            name_burmese,
            name_english,
            recipe_type,
            yield_quantity,
            yield_unit,
            image_url
          )
        `
				)
				.eq("parent_recipe_id", recipeId)
				.order("sort_order", { ascending: true })
				.order("created_at", { ascending: true });

			if (compErr) throw compErr;

			set({
				selectedRecipe: {
					...recipe,
					components: components || [],
				},
			});

			// Also explode BOM
			await get().explodeRecipeBom(recipeId);
		} catch (error) {
			console.error("Error fetching recipe details:", error);
			showToast.error("Failed to load recipe details");
		}
	},

	// Explode recipe BOM via recursive Supabase RPC function
	explodeRecipeBom: async (recipeId) => {
		set({ bomLoading: true });
		try {
			const { data, error } = await supabase.rpc("explode_recipe_bom", {
				target_recipe_id: recipeId,
			});

			if (error) throw error;

			const rawItems = data || [];
			const totalCost = rawItems.reduce(
				(sum, item) => sum + (Number(item.total_cost) || 0),
				0
			);

			set({
				explodedBom: {
					rawItems,
					totalCost: Math.round(totalCost * 100) / 100,
				},
			});
			return { rawItems, totalCost };
		} catch (error) {
			console.error("Error exploding recipe BOM:", error);
			set({ explodedBom: { rawItems: [], totalCost: 0 } });
			return null;
		} finally {
			set({ bomLoading: false });
		}
	},

	// Recipe CRUD
	createRecipe: async (recipeData) => {
		try {
			const { data, error } = await supabase
				.from("recipes")
				.insert([recipeData])
				.select()
				.single();

			if (error) throw error;

			await get().fetchRecipes();
			set({ selectedRecipeId: data.id });
			await get().fetchRecipeDetails(data.id);
			showToast.success("Recipe created successfully");
			return { success: true, recipe: data };
		} catch (error) {
			console.error("Error creating recipe:", error);
			showToast.error(error.message || "Failed to create recipe");
			return { error: error.message };
		}
	},

	updateRecipe: async (id, recipeData) => {
		try {
			const { error } = await supabase
				.from("recipes")
				.update({
					...recipeData,
					updated_at: new Date().toISOString(),
				})
				.eq("id", id);

			if (error) throw error;

			await get().fetchRecipes();
			await get().fetchRecipeDetails(id);
			showToast.success("Recipe updated successfully");
			return { success: true };
		} catch (error) {
			console.error("Error updating recipe:", error);
			showToast.error(error.message || "Failed to update recipe");
			return { error: error.message };
		}
	},

	deleteRecipe: async (id) => {
		try {
			const { error } = await supabase.from("recipes").delete().eq("id", id);

			if (error) throw error;

			set((state) => ({
				recipes: state.recipes.filter((r) => r.id !== id),
				selectedRecipeId:
					state.selectedRecipeId === id ? null : state.selectedRecipeId,
				selectedRecipe:
					state.selectedRecipeId === id ? null : state.selectedRecipe,
				explodedBom: state.selectedRecipeId === id ? null : state.explodedBom,
			}));

			await get().fetchRecipes();
			showToast.success("Recipe deleted");
			return { success: true };
		} catch (error) {
			console.error("Error deleting recipe:", error);
			showToast.error(
				error.message || "Cannot delete recipe because it is used by other recipes"
			);
			return { error: error.message };
		}
	},

	// Component CRUD (DAG Edges)
	addComponent: async (componentData) => {
		try {
			const { error } = await supabase
				.from("recipe_components")
				.insert([componentData]);

			if (error) {
				// Detect circular dependency trigger error
				if (
					error.message?.includes("Circular recipe dependency") ||
					error.details?.includes("Circular recipe dependency")
				) {
					showToast.error(
						"Circular Loop Detected: A sub-recipe cannot consume its parent recipe!"
					);
					return { error: "Circular recipe loop detected" };
				}
				throw error;
			}

			if (componentData.parent_recipe_id) {
				await get().fetchRecipeDetails(componentData.parent_recipe_id);
			}
			await get().fetchRecipes();
			showToast.success("Ingredient / Sub-recipe added");
			return { success: true };
		} catch (error) {
			console.error("Error adding recipe component:", error);
			showToast.error(error.message || "Failed to add ingredient");
			return { error: error.message };
		}
	},

	updateComponent: async (componentId, updateData, parentRecipeId) => {
		try {
			const { error } = await supabase
				.from("recipe_components")
				.update(updateData)
				.eq("id", componentId);

			if (error) {
				if (
					error.message?.includes("Circular recipe dependency") ||
					error.details?.includes("Circular recipe dependency")
				) {
					showToast.error(
						"Circular Loop Detected: A sub-recipe cannot consume its parent recipe!"
					);
					return { error: "Circular recipe loop detected" };
				}
				throw error;
			}

			if (parentRecipeId) {
				await get().fetchRecipeDetails(parentRecipeId);
			}
			await get().fetchRecipes();
			showToast.success("Component updated");
			return { success: true };
		} catch (error) {
			console.error("Error updating component:", error);
			showToast.error(error.message || "Failed to update component");
			return { error: error.message };
		}
	},

	deleteComponent: async (componentId, parentRecipeId) => {
		try {
			const { error } = await supabase
				.from("recipe_components")
				.delete()
				.eq("id", componentId);

			if (error) throw error;

			if (parentRecipeId) {
				await get().fetchRecipeDetails(parentRecipeId);
			}
			await get().fetchRecipes();
			showToast.success("Ingredient removed from recipe");
			return { success: true };
		} catch (error) {
			console.error("Error deleting component:", error);
			showToast.error(error.message || "Failed to remove component");
			return { error: error.message };
		}
	},

	// Helper: Get list of parent recipes that consume a given sub-recipe
	getUsedInRecipes: (subRecipeId) => {
		const { allComponents, recipes } = get();
		const parentIds = allComponents
			.filter(
				(c) => c.component_type === "sub_recipe" && c.sub_recipe_id === subRecipeId
			)
			.map((c) => c.parent_recipe_id);

		return recipes.filter((r) => parentIds.includes(r.id));
	},

	// Filtered recipes
	getFilteredRecipes: () => {
		const { recipes, filterType, searchQuery } = get();
		const q = (searchQuery || "").trim().toLowerCase();

		return recipes.filter((recipe) => {
			if (filterType !== "all" && recipe.recipe_type !== filterType) {
				return false;
			}

			if (q === "") return true;

			const matchEn = recipe.name_english?.toLowerCase().includes(q);
			const matchMm = recipe.name_burmese?.toLowerCase().includes(q);
			const matchMenu = recipe.menu_item?.name_english
				?.toLowerCase()
				.includes(q);

			return matchEn || matchMm || matchMenu;
		});
	},
}));

export default useRecipeStore;
