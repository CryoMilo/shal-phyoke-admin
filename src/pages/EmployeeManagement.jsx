import { useEffect } from "react";
import { Users, CalendarOff } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import useEmployeeStore from "../stores/employeeStore";
import EmployeeTab from "../components/employees/EmployeeTab";
import AbsenceTab from "../components/employees/AbsenceTab";

const EmployeeManagement = () => {
	const { activeTab, setActiveTab, fetchEmployees } = useEmployeeStore();

	useEffect(() => {
		fetchEmployees();
	}, [fetchEmployees]);

	const tabs = [
		{ id: "employees", label: "Employees", icon: Users },
		{ id: "absences", label: "Absence Records", icon: CalendarOff },
	];

	return (
		<div className="container mx-auto p-3 md:p-6">
			<PageHeader
				title="Employee Management"
				description="Manage staff records and track absences"
			/>

			<div className="tabs tabs-boxed bg-base-200 p-1 mb-6">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`tab gap-2 flex-1 sm:flex-none ${
							activeTab === tab.id ? "tab-active" : ""
						}`}>
						<tab.icon className="w-4 h-4" />
						<span className="hidden sm:inline">{tab.label}</span>
					</button>
				))}
			</div>

			{activeTab === "employees" && <EmployeeTab />}
			{activeTab === "absences" && <AbsenceTab />}
		</div>
	);
};

export default EmployeeManagement;
