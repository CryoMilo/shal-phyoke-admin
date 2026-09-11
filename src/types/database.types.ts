export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export interface Database {
	public: {
		Tables: {
			orders: {
				Row: {
					id: string;
					order_number: string | null;
					order_type: "dine_in" | "takeaway" | "delivery";
					table_number: number | null;
					customer_name: string | null;
					customer_phone: string | null;
					delivery_address: string | null;
					delivery_fee: number;
					discount_amount: number;
					subtotal: number;
					total_amount: number;
					payment_method: "cash" | "qr" | "unpaid";
					payment_status: "pending" | "paid" | "refunded";
					pos_order_status: "pending" | "preparing" | "ready" | "completed" | "cancelled" | "refunded";
					notes: string | null;
					order_items: Json;
					item_notes: Json | null;
					item_extra_prices: Json | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					order_number?: string | null;
					order_type: "dine_in" | "takeaway" | "delivery";
					table_number?: number | null;
					customer_name?: string | null;
					customer_phone?: string | null;
					delivery_address?: string | null;
					delivery_fee?: number;
					discount_amount?: number;
					subtotal: number;
					total_amount: number;
					payment_method?: "cash" | "qr" | "unpaid";
					payment_status?: "pending" | "paid" | "refunded";
					pos_order_status?: "pending" | "preparing" | "ready" | "completed" | "cancelled" | "refunded";
					notes?: string | null;
					order_items: Json;
					item_notes?: Json | null;
					item_extra_prices?: Json | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
			};
			menu_items: {
				Row: {
					id: string;
					name_burmese: string;
					name_english: string | null;
					category: string;
					price: number;
					image_url: string | null;
					is_active: boolean;
					is_combo: boolean;
					requires_addon: boolean;
					quick_note_ids: string[] | null;
					tags: string[] | null;
					aliases: string[] | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					name_burmese: string;
					name_english?: string | null;
					category: string;
					price: number;
					image_url?: string | null;
					is_active?: boolean;
					is_combo?: boolean;
					requires_addon?: boolean;
					quick_note_ids?: string[] | null;
					tags?: string[] | null;
					aliases?: string[] | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["menu_items"]["Insert"]>;
			};
			menu_item_extras: {
				Row: {
					id: string;
					menu_item_id: string;
					name_burmese: string;
					name_english: string | null;
					additional_price: number;
					is_active: boolean;
					created_at: string;
				};
				Insert: {
					id?: string;
					menu_item_id: string;
					name_burmese: string;
					name_english?: string | null;
					additional_price?: number;
					is_active?: boolean;
					created_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["menu_item_extras"]["Insert"]>;
			};
			inventory_items: {
				Row: {
					id: string;
					name: string;
					category: string;
					quantity: number;
					unit: string;
					min_threshold: number;
					vendor_id: string | null;
					updated_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					category: string;
					quantity?: number;
					unit: string;
					min_threshold?: number;
					vendor_id?: string | null;
					updated_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["inventory_items"]["Insert"]>;
			};
			procurement_orders: {
				Row: {
					id: string;
					order_number: string;
					vendor_id: string;
					status: "draft" | "ordered" | "received" | "cancelled";
					total_cost: number;
					ordered_date: string | null;
					received_date: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					order_number: string;
					vendor_id: string;
					status?: "draft" | "ordered" | "received" | "cancelled";
					total_cost?: number;
					ordered_date?: string | null;
					received_date?: string | null;
					created_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["procurement_orders"]["Insert"]>;
			};
			daily_cash: {
				Row: {
					id: string;
					date: string;
					opening_balance: number;
					cash_collected: number;
					cash_deposited: number;
					cash_shortage: number;
					notes: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					date: string;
					opening_balance?: number;
					cash_collected?: number;
					cash_deposited?: number;
					cash_shortage?: number;
					notes?: string | null;
					created_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["daily_cash"]["Insert"]>;
			};
			daily_expenses: {
				Row: {
					id: string;
					date: string;
					amount: number;
					category: string;
					description: string | null;
					paid_by: string;
					receipt_url: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					date: string;
					amount: number;
					category: string;
					description?: string | null;
					paid_by?: string;
					receipt_url?: string | null;
					created_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["daily_expenses"]["Insert"]>;
			};
			monthly_overheads: {
				Row: {
					id: string;
					name: string;
					category: string;
					amount: number;
					due_date: string | null;
					paid_date: string | null;
					status: "pending" | "paid" | "overdue";
					month: number;
					year: number;
					notes: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					category: string;
					amount: number;
					due_date?: string | null;
					paid_date?: string | null;
					status?: "pending" | "paid" | "overdue";
					month: number;
					year: number;
					notes?: string | null;
					created_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["monthly_overheads"]["Insert"]>;
			};
			employees: {
				Row: {
					id: string;
					name: string;
					role: string;
					salary: number;
					hire_date: string | null;
					is_active: boolean;
					created_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					role: string;
					salary?: number;
					hire_date?: string | null;
					is_active?: boolean;
					created_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["employees"]["Insert"]>;
			};
			quick_notes: {
				Row: {
					id: string;
					label: string;
					type: "radio" | "multiple";
					options: string[];
					is_active: boolean;
					created_at: string;
				};
				Insert: {
					id?: string;
					label: string;
					type: "radio" | "multiple";
					options: string[];
					is_active?: boolean;
					created_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["quick_notes"]["Insert"]>;
			};
			print_jobs: {
				Row: {
					id: string;
					order_no: string;
					table_no: string;
					customer_name: string | null;
					delivery_address: string | null;
					customer_phone: string | null;
					payment_method: string | null;
					subtotal: number;
					discount_amount: number;
					delivery_fee: number;
					total_amount: number;
					items: Json;
					note: string | null;
					status: "pending" | "printed" | "failed";
					created_at: string;
				};
				Insert: {
					id?: string;
					order_no: string;
					table_no: string;
					customer_name?: string | null;
					delivery_address?: string | null;
					customer_phone?: string | null;
					payment_method?: string | null;
					subtotal?: number;
					discount_amount?: number;
					delivery_fee?: number;
					total_amount: number;
					items: Json;
					note?: string | null;
					status?: "pending" | "printed" | "failed";
					created_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["print_jobs"]["Insert"]>;
			};
		};
		Functions: {
			complete_procurement_order: {
				Args: {
					p_order_id: string;
					p_received_items: Json;
				};
				Returns: boolean;
			};
			settle_pos_order: {
				Args: {
					p_order_id: string;
					p_payment_method: string;
					p_cash_amount: number;
				};
				Returns: boolean;
			};
		};
	};
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
	Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
	Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
	Database["public"]["Tables"][T]["Update"];
