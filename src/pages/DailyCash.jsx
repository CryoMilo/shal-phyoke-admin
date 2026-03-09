import { useState, useEffect, useMemo } from "react";
import { format, subDays, addDays } from "date-fns";
import {
        Calendar,
        DollarSign,
        TrendingUp,
        TrendingDown,
        Save,
        CreditCard,
        AlertCircle,
        ArrowLeft,
        ArrowRight,
        Receipt,
        Banknote,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { supabase } from "../services/supabase";
import { PageHeader } from "../components/common/PageHeader";
import { Loading } from "../components/common/Loading";
import { showToast } from "../utils/toastUtils";

const DailyCash = () => {
        const [selectedDate, setSelectedDate] = useState(
                format(new Date(), "yyyy-MM-dd")
        );
        const [loading, setLoading] = useState(true);
        const [isSaving, setIsSaving] = useState(false);
        const [salesData, setSalesData] = useState({ cash: 0, card: 0, online: 0 });
        const [expensesData, setExpensesData] = useState({ total: 0, fromDrawer: 0 });
        const [additionalIncome, setAdditionalIncome] = useState(0);

        const {
                register,
                handleSubmit,
                reset,
                watch,
                setValue,
                formState: { isDirty },
        } = useForm({
                defaultValues: {
                        opening_balance: 0,
                        cash_collected: 0,
                        cash_deposited: 0,
                        notes: "",
                        closing_balance: 0,
                },
        });

        const watchedValues = watch();

        const fetchDailyData = async (date) => {
                setLoading(true);
                try {
                        // 1. Fetch Daily Cash Record
                        const { data: cash, error: cashError } = await supabase
                                .from("daily_cash")
                                .select("*")
                                .eq("date", date)
                                .single();

                        if (cashError && cashError.code !== "PGRST116") throw cashError;

                        if (cash) {
                                reset({
                                        opening_balance: parseFloat(cash.opening_balance) || 0,
                                        cash_collected: parseFloat(cash.cash_collected) || 0,
                                        cash_deposited: parseFloat(cash.cash_deposited) || 0,
                                        notes: cash.notes || "",
                                        closing_balance: parseFloat(cash.closing_balance) || 0,
                                });
                        } else {
                                // Try to get yesterday's closing balance as today's opening balance
                                const yesterday = format(subDays(new Date(date), 1), "yyyy-MM-dd");
                                const { data: prevDay } = await supabase
                                        .from("daily_cash")
                                        .select("closing_balance")
                                        .eq("date", yesterday)
                                        .single();

                                reset({
                                        opening_balance: prevDay?.closing_balance || 0,
                                        cash_collected: 0,
                                        cash_deposited: 0,
                                        notes: "",
                                        closing_balance: 0,
                                });
                        }

                        // 2. Fetch Sales from Orders
                        const { data: sales } = await supabase
                                .from("orders")
                                .select("total_amount, payment_method")
                                .eq("payment_status", "paid")
                                .gte("created_at", `${date}T00:00:00`)
                                .lt("created_at", `${date}T23:59:59`);

                        const salesTotals = (sales || []).reduce(
                                (acc, order) => {
                                        const amount = parseFloat(order.total_amount) || 0;
                                        if (order.payment_method === "cash") acc.cash += amount;
                                        else if (order.payment_method === "card") acc.card += amount;
                                        else if (order.payment_method === "online") acc.online += amount;
                                        return acc;
                                },
                                { cash: 0, card: 0, online: 0 }
                        );
                        setSalesData(salesTotals);

                        // 3. Fetch Expenses
                        const { data: expenses } = await supabase
                                .from("daily_expenses")
                                .select("amount, paid_by")
                                .eq("date", date);

                        const expenseTotals = (expenses || []).reduce(
                                (acc, exp) => {
                                        const amount = parseFloat(exp.amount) || 0;
                                        acc.total += amount;
                                        if (exp.paid_by === "cash_drawer") acc.fromDrawer += amount;
                                        return acc;
                                },
                                { total: 0, fromDrawer: 0 }
                        );
                        setExpensesData(expenseTotals);

                        // 4. Fetch Additional Income
                        const { data: income } = await supabase
                                .from("additional_income")
                                .select("amount")
                                .eq("date", date)
                                .eq("payment_method", "cash");

                        const incomeTotal = (income || []).reduce(
                                (acc, inc) => acc + (parseFloat(inc.amount) || 0),
                                0
                        );
                        setAdditionalIncome(incomeTotal);
                } catch (error) {
                        console.error("Error fetching daily data:", error);
                        showToast.error("Failed to load daily data");
                } finally {
                        setLoading(false);
                }
        };

        useEffect(() => {
                fetchDailyData(selectedDate);
        }, [selectedDate]);

        // Derived Calculations
        const expectedCash = useMemo(() => {
                return (
                        watchedValues.opening_balance +
                        salesData.cash +
                        additionalIncome -
                        expensesData.fromDrawer
                );
        }, [
                watchedValues.opening_balance,
                salesData.cash,
                additionalIncome,
                expensesData.fromDrawer,
        ]);

        const variance = useMemo(() => {
                return watchedValues.cash_collected - expectedCash;
        }, [watchedValues.cash_collected, expectedCash]);

        const shortage = useMemo(() => {
                return watchedValues.cash_collected - watchedValues.cash_deposited;
        }, [watchedValues.cash_collected, watchedValues.cash_deposited]);

        const handleSave = async (data) => {
                setIsSaving(true);
                try {
                        const payload = {
                                ...data,
                                date: selectedDate,
                                cash_sales: salesData.cash,
                                card_sales: salesData.card,
                                online_sales: salesData.online,
                                // closing_balance is calculated as collected - deposited
                                closing_balance: data.cash_collected - data.cash_deposited,
                        };

                        const { error } = await supabase.from("daily_cash").upsert(payload, {
                                onConflict: "date",
                        });

                        if (error) throw error;
                        showToast.success("Daily cash record saved");
                        fetchDailyData(selectedDate);
                } catch (error) {
                        console.error("Error saving daily cash:", error);
                        showToast.error("Failed to save record");
                } finally {
                        setIsSaving(false);
                }
        };

        const navigateDate = (days) => {
                const baseDate = new Date(selectedDate);
                const newDate = days > 0 ? addDays(baseDate, 1) : subDays(baseDate, 1);
                setSelectedDate(format(newDate, "yyyy-MM-dd"));
        };

        if (loading) return <Loading />;

        return (
                <div className="container mx-auto p-3 md:p-6 max-w-6xl">
                        <PageHeader
                                title="Daily Cash Tracking"
                                description="Reconcile daily cash flow, expenses, and deposits"
                                buttons={[
                                        {
                                                label: "Save Changes",
                                                icon: Save,
                                                onClick: handleSubmit(handleSave),
                                                variant: "primary",
                                                disabled: isSaving || !isDirty,
                                                loading: isSaving,
                                        },
                                ]}
                        />

                        {/* Date Navigation */}
                        <div className="flex items-center justify-between mb-8 bg-base-100 p-4 rounded-xl shadow-sm border border-base-200">
                                <button
                                        onClick={() => navigateDate(-1)}
                                        className="btn btn-circle btn-ghost btn-sm">
                                        <ArrowLeft className="w-5 h-5" />
                                </button>

                                <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        <input
                                                type="date"
                                                value={selectedDate}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                className="input input-ghost font-bold text-lg focus:bg-transparent"
                                        />
                                </div>

                                <button
                                        onClick={() => navigateDate(1)}
                                        className="btn btn-circle btn-ghost btn-sm">
                                        <ArrowRight className="w-5 h-5" />
                                </button>
                        </div>

                        <form onSubmit={handleSubmit(handleSave)} className="space-y-8">
                                {/* Top Stats Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="card bg-base-100 border border-base-200 shadow-sm">
                                                <div className="card-body p-4">
                                                        <div className="flex justify-between items-start">
                                                                <div>
                                                                        <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                                                                                Expected Cash
                                                                        </p>
                                                                        <h3 className="text-2xl font-bold mt-1">
                                                                                ฿{expectedCash.toLocaleString()}
                                                                        </h3>
                                                                </div>
                                                                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                                                        <DollarSign className="w-5 h-5" />
                                                                </div>
                                                        </div>
                                                        <p className="text-[10px] text-base-content/50 mt-2">
                                                                Opening + Sales + Income - Drawer Exp
                                                        </p>
                                                </div>
                                        </div>

                                        <div className="card bg-base-100 border border-base-200 shadow-sm">
                                                <div className="card-body p-4">
                                                        <div className="flex justify-between items-start">
                                                                <div>
                                                                        <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                                                                                Cash Variance
                                                                        </p>
                                                                        <h3
                                                                                className={`text-2xl font-bold mt-1 ${variance < 0 ? "text-error" : variance > 0 ? "text-success" : ""}`}>
                                                                                ฿{variance.toLocaleString()}
                                                                        </h3>
                                                                </div>
                                                                <div
                                                                        className={`p-2 rounded-lg ${variance < 0 ? "bg-error/10 text-error" : "bg-success/10 text-success"}`}>
                                                                        {variance < 0 ? (
                                                                                <TrendingDown className="w-5 h-5" />
                                                                        ) : (
                                                                                <TrendingUp className="w-5 h-5" />
                                                                        )}
                                                                </div>
                                                        </div>
                                                        <p className="text-[10px] text-base-content/50 mt-2">
                                                                Collected vs Expected
                                                        </p>
                                                </div>
                                        </div>

                                        <div className="card bg-base-100 border border-base-200 shadow-sm">
                                                <div className="card-body p-4">
                                                        <div className="flex justify-between items-start">
                                                                <div>
                                                                        <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                                                                                Shortage/Overage
                                                                        </p>
                                                                        <h3
                                                                                className={`text-2xl font-bold mt-1 ${shortage !== 0 ? "text-warning" : "text-success"}`}>
                                                                                ฿{shortage.toLocaleString()}
                                                                        </h3>
                                                                </div>
                                                                <div className="p-2 bg-warning/10 text-warning rounded-lg">
                                                                        <AlertCircle className="w-5 h-5" />
                                                                </div>
                                                        </div>
                                                        <p className="text-[10px] text-base-content/50 mt-2">
                                                                Collected vs Deposited
                                                        </p>
                                                </div>
                                        </div>

                                        <div className="card bg-primary text-primary-content shadow-md">
                                                <div className="card-body p-4">
                                                        <div className="flex justify-between items-start">
                                                                <div>
                                                                        <p className="text-xs font-semibold text-primary-content/70 uppercase tracking-wider">
                                                                                Final Closing
                                                                        </p>
                                                                        <h3 className="text-2xl font-bold mt-1">
                                                                                ฿{(watchedValues.cash_collected - watchedValues.cash_deposited).toLocaleString()}
                                                                        </h3>
                                                                </div>
                                                                <div className="p-2 bg-white/20 rounded-lg text-white">
                                                                        <Banknote className="w-5 h-5" />
                                                                </div>
                                                        </div>
                                                        <p className="text-[10px] text-primary-content/70 mt-2">
                                                                Amount remaining in drawer
                                                        </p>
                                                </div>
                                        </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Left Column: Form Inputs */}
                                        <div className="lg:col-span-2 space-y-6">
                                                <div className="card bg-base-100 border border-base-200">
                                                        <div className="card-body">
                                                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                                                        <DollarSign className="w-5 h-5 text-primary" />
                                                                        Cash Details
                                                                </h3>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                        <div className="form-control w-full">
                                                                                <label className="label">
                                                                                        <span className="label-text font-semibold">
                                                                                                Opening Balance
                                                                                        </span>
                                                                                </label>
                                                                                <input
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        {...register("opening_balance", {
                                                                                                valueAsNumber: true,
                                                                                        })}
                                                                                        className="input input-bordered focus:input-primary w-full"
                                                                                />
                                                                        </div>

                                                                        <div className="form-control w-full">
                                                                                <label className="label">
                                                                                        <span className="label-text font-semibold">
                                                                                                Actual Cash Collected
                                                                                        </span>
                                                                                </label>
                                                                                <input
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        {...register("cash_collected", {
                                                                                                valueAsNumber: true,
                                                                                        })}
                                                                                        className="input input-bordered focus:input-primary w-full"
                                                                                />
                                                                        </div>

                                                                        <div className="form-control w-full">
                                                                                <label className="label">
                                                                                        <span className="label-text font-semibold">
                                                                                                Total Cash Deposited
                                                                                        </span>
                                                                                </label>
                                                                                <input
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        {...register("cash_deposited", {
                                                                                                valueAsNumber: true,
                                                                                        })}
                                                                                        className="input input-bordered focus:input-primary w-full"
                                                                                />
                                                                        </div>

                                                                        <div className="form-control w-full">
                                                                                <label className="label">
                                                                                        <span className="label-text font-semibold text-base-content/50">
                                                                                                Calculated Closing Balance
                                                                                        </span>
                                                                                </label>
                                                                                <input
                                                                                        type="number"
                                                                                        readOnly
                                                                                        value={watchedValues.cash_collected - watchedValues.cash_deposited}
                                                                                        className="input input-bordered bg-base-200 cursor-not-allowed"
                                                                                />
                                                                        </div>
                                                                </div>

                                                                <div className="mt-8">
                                                                        <div className="bg-base-200/50 rounded-2xl p-4 border border-base-300">
                                                                                <label className="label pt-0">
                                                                                        <span className="label-text font-bold text-xs uppercase text-base-content/50 tracking-widest">
                                                                                                Operational Notes & Discrepancies
                                                                                        </span>
                                                                                </label>
                                                                                <textarea
                                                                                        {...register("notes")}
                                                                                        className="textarea textarea-ghost focus:bg-base-100 w-full h-32 text-sm leading-relaxed placeholder:text-base-content/30 transition-all duration-300 resize-none p-0 focus:p-2"
                                                                                        placeholder="Describe any shortages, overages, or specific events that occurred during the shift..."
                                                                                ></textarea>
                                                                        </div>
                                                                </div>
                                                        </div>
                                                </div>

                                                {/* Income/Expense Summary */}
                                                <div className="card bg-base-100 border border-base-200">
                                                        <div className="card-body">
                                                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                                                        <Receipt className="w-5 h-5 text-primary" />
                                                                        Flow Summary
                                                                </h3>
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                        <div className="p-4 bg-base-200 rounded-xl">
                                                                                <p className="text-xs font-bold text-base-content/50 uppercase">
                                                                                        Additional Income
                                                                                </p>
                                                                                <p className="text-xl font-bold mt-1 text-success">
                                                                                        + ฿{additionalIncome.toLocaleString()}
                                                                                </p>
                                                                        </div>
                                                                        <div className="p-4 bg-base-200 rounded-xl">
                                                                                <p className="text-xs font-bold text-base-content/50 uppercase">
                                                                                        Drawer Expenses
                                                                                </p>
                                                                                <p className="text-xl font-bold mt-1 text-error">
                                                                                        - ฿{expensesData.fromDrawer.toLocaleString()}
                                                                                </p>
                                                                        </div>
                                                                        <div className="p-4 bg-base-200 rounded-xl">
                                                                                <p className="text-xs font-bold text-base-content/50 uppercase">
                                                                                        Total Expenses
                                                                                </p>
                                                                                <p className="text-xl font-bold mt-1">
                                                                                        ฿{expensesData.total.toLocaleString()}
                                                                                </p>
                                                                        </div>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>

                                        {/* Right Column: Sales Breakdown */}
                                        <div className="space-y-6">
                                                <div className="card bg-base-100 border border-base-200">
                                                        <div className="card-body">
                                                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                                                        <CreditCard className="w-5 h-5 text-primary" />
                                                                        Sales Revenue
                                                                </h3>
                                                                <div className="space-y-4">
                                                                        <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                                                                                <span className="text-sm font-medium">Cash Sales</span>
                                                                                <span className="font-bold">
                                                                                        ฿{salesData.cash.toLocaleString()}
                                                                                </span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                                                                                <span className="text-sm font-medium">Card Sales</span>
                                                                                <span className="font-bold">
                                                                                        ฿{salesData.card.toLocaleString()}
                                                                                </span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                                                                                <span className="text-sm font-medium">Online Sales</span>
                                                                                <span className="font-bold">
                                                                                        ฿{salesData.online.toLocaleString()}
                                                                                </span>
                                                                        </div>
                                                                        <div className="divider my-0"></div>
                                                                        <div className="flex justify-between items-center p-3 bg-primary/10 text-primary rounded-lg">
                                                                                <span className="font-bold">Total Sales</span>
                                                                                <span className="font-bold text-lg">
                                                                                        ฿{(
                                                                                                salesData.cash +
                                                                                                salesData.card +
                                                                                                salesData.online
                                                                                        ).toLocaleString()}
                                                                                </span>
                                                                        </div>
                                                                </div>
                                                        </div>
                                                </div>

                                                <div className="alert alert-info shadow-sm">
                                                        <AlertCircle className="w-5 h-5" />
                                                        <div>
                                                                <h3 className="font-bold text-xs uppercase tracking-tight">
                                                                        Note
                                                                </h3>
                                                                <div className="text-xs opacity-80">
                                                                        Expected cash is automatically calculated from opening
                                                                        balance, orders, and expenses paid from drawer.
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </form>
                </div>
        );
};

export default DailyCash;
