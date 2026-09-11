import { describe, it, expect, beforeEach } from "vitest";
import useMenuStore from "../menuStore";

describe("menuStore.js - Menu queries and category filters", () => {
	beforeEach(() => {
		useMenuStore.setState({
			allMenuItems: [
				{ id: "1", name_burmese: "Salad A", category: "Salad", is_regular: true, is_active: true },
				{ id: "2", name_burmese: "Salad B", category: "Salad", is_regular: false, is_active: true },
				{ id: "3", name_burmese: "Rice A", category: "Rice", is_regular: true, is_active: true },
				{ id: "4", name_burmese: "Combo Fixed", category: "Combo", is_regular: true, is_active: true, is_combo: true, combo_type: "fixed" },
			],
		});
	});

	it("returns correct regular categories", () => {
		const categories = useMenuStore.getState().getRegularCategories();
		expect(categories).toContain("Salad");
		expect(categories).toContain("Rice");
		expect(categories).toContain("Combo");
	});

	it("returns regular items filtered by category", () => {
		const saladItems = useMenuStore.getState().getRegularItemsByCategory("Salad");
		expect(saladItems.length).toBe(1);
		expect(saladItems[0].name_burmese).toBe("Salad A");

		const riceItems = useMenuStore.getState().getRegularItemsByCategory("Rice");
		expect(riceItems.length).toBe(1);
		expect(riceItems[0].name_burmese).toBe("Rice A");
	});

	it("returns active fixed combos", () => {
		const fixedCombos = useMenuStore.getState().getActiveFixedCombos();
		expect(fixedCombos.length).toBe(1);
		expect(fixedCombos[0].id).toBe("4");
	});
});
