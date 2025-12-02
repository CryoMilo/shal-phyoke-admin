// components/TableSelectionModal.jsx
const TableSelectionModal = ({ tableNumber, setTableNumber, onClose }) => {
	const tables = Array.from({ length: 20 }, (_, i) => i + 1);

	return (
		<div className="modal modal-open">
			<div className="modal-box">
				<h3 className="font-bold text-lg mb-4">Select Table Number</h3>
				<div className="grid grid-cols-5 gap-2">
					{tables.map((table) => (
						<button
							key={table}
							className={`btn btn-sm ${
								tableNumber === table ? "btn-primary" : "btn-outline"
							}`}
							onClick={() => {
								setTableNumber(table);
								onClose();
							}}>
							{table}
						</button>
					))}
				</div>
				<div className="modal-action">
					<button className="btn btn-ghost" onClick={onClose}>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
};

export default TableSelectionModal;
