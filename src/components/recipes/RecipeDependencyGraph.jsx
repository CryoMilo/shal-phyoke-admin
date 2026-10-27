// src/components/recipes/RecipeDependencyGraph.jsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Utensils, ChefHat, Eye, ArrowRight, Layers } from "lucide-react";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 86;
const HORIZONTAL_GAP = 140;
const VERTICAL_GAP = 40;

const RecipeDependencyGraph = ({
	recipes,
	components,
	onSelectRecipe,
	onSwitchToSplitView,
}) => {
	const containerRef = useRef(null);
	const [scale, setScale] = useState(1);
	const [translate, setTranslate] = useState({ x: 80, y: 80 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [hoveredNodeId, setHoveredNodeId] = useState(null);
	const [inspectNode, setInspectNode] = useState(null);

	// Compute DAG Layers & Positions
	const { nodes, edges } = useMemo(() => {
		// 1. Filter recipe components that represent sub_recipe dependencies
		const subRecipeEdges = components.filter(
			(c) => c.component_type === "sub_recipe" && c.sub_recipe_id
		);

		// Compute node in-degrees and hierarchy levels
		// Level 0: branch_prep that don't consume other sub-recipes
		// Level 1+: branch_prep that consume other sub-recipes
		// Max Level: menu_prep (POS dishes)
		const levels = {};
		recipes.forEach((r) => {
			if (r.recipe_type === "menu_prep") {
				levels[r.id] = 2; // Rightmost
			} else {
				// Count if this branch prep consumes other branch preps
				const consumesOthers = subRecipeEdges.some(
					(e) => e.parent_recipe_id === r.id
				);
				levels[r.id] = consumesOthers ? 1 : 0;
			}
		});

		// Group nodes by level
		const columns = { 0: [], 1: [], 2: [] };
		recipes.forEach((r) => {
			const lvl = levels[r.id] ?? 0;
			columns[lvl].push(r);
		});

		// Calculate coordinates for each node
		const calculatedNodes = [];
		const nodePosMap = {};

		[0, 1, 2].forEach((lvl) => {
			const colItems = columns[lvl];
			colItems.forEach((recipe, idx) => {
				const x = lvl * (NODE_WIDTH + HORIZONTAL_GAP) + 60;
				const y = idx * (NODE_HEIGHT + VERTICAL_GAP) + 60;
				nodePosMap[recipe.id] = { x, y };

				calculatedNodes.push({
					...recipe,
					x,
					y,
					level: lvl,
				});
			});
		});

		// Format directed edges (pointing from consumed sub_recipe -> parent recipe)
		const calculatedEdges = subRecipeEdges
			.map((comp) => {
				const sourcePos = nodePosMap[comp.sub_recipe_id];
				const targetPos = nodePosMap[comp.parent_recipe_id];

				if (!sourcePos || !targetPos) return null;

				const sourceRecipe = recipes.find((r) => r.id === comp.sub_recipe_id);
				const targetRecipe = recipes.find((r) => r.id === comp.parent_recipe_id);

				return {
					id: comp.id,
					sourceId: comp.sub_recipe_id,
					targetId: comp.parent_recipe_id,
					sourcePos: {
						x: sourcePos.x + NODE_WIDTH,
						y: sourcePos.y + NODE_HEIGHT / 2,
					},
					targetPos: {
						x: targetPos.x,
						y: targetPos.y + NODE_HEIGHT / 2,
					},
					label: `${comp.quantity} ${comp.unit}`,
					sourceName: sourceRecipe?.name_english || "",
					targetName: targetRecipe?.name_english || "",
				};
			})
			.filter(Boolean);

		return { nodes: calculatedNodes, edges: calculatedEdges };
	}, [recipes, components]);

	// Mouse Pan & Drag Handlers
	const handleMouseDown = (e) => {
		if (e.target.closest(".graph-node") || e.target.closest("button")) return;
		setIsDragging(true);
		setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
	};

	const handleMouseMove = (e) => {
		if (!isDragging) return;
		setTranslate({
			x: e.clientX - dragStart.x,
			y: e.clientY - dragStart.y,
		});
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	const handleWheel = (e) => {
		e.preventDefault();
		const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
		setScale((prev) => Math.min(Math.max(0.4, prev * zoomFactor), 2.2));
	};

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		el.addEventListener("wheel", handleWheel, { passive: false });
		return () => el.removeEventListener("wheel", handleWheel);
	}, []);

	// Reset Pan & Zoom
	const handleResetView = () => {
		setScale(1);
		setTranslate({ x: 80, y: 80 });
	};

	return (
		<div className="relative w-full h-[750px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden select-none">
			{/* Canvas Grid Background */}
			<div
				ref={containerRef}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
				style={{
					backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)`,
					backgroundSize: `${24 * scale}px ${24 * scale}px`,
					backgroundPosition: `${translate.x}px ${translate.y}px`,
				}}>
				{/* Canvas Transform Stage */}
				<div
					style={{
						transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
						transformOrigin: "0 0",
						transition: isDragging ? "none" : "transform 0.05s ease-out",
					}}
					className="relative w-full h-full pointer-events-none">
					{/* SVG Directed Edges Canvas */}
					<svg className="absolute top-0 left-0 w-[3000px] h-[3000px] pointer-events-none overflow-visible">
						<defs>
							<marker
								id="arrowhead-default"
								markerWidth="10"
								markerHeight="7"
								refX="9"
								refY="3.5"
								orient="auto">
								<polygon
									points="0 0, 10 3.5, 0 7"
									fill="rgb(129, 140, 248)"
								/>
							</marker>
							<marker
								id="arrowhead-highlight"
								markerWidth="12"
								markerHeight="8"
								refX="10"
								refY="4"
								orient="auto">
								<polygon
									points="0 0, 12 4, 0 8"
									fill="rgb(245, 158, 11)"
								/>
							</marker>
						</defs>

						{edges.map((edge) => {
							const isConnectedToHovered =
								hoveredNodeId &&
								(edge.sourceId === hoveredNodeId || edge.targetId === hoveredNodeId);

							const sx = edge.sourcePos.x;
							const sy = edge.sourcePos.y;
							const tx = edge.targetPos.x;
							const ty = edge.targetPos.y;
							const dx = tx - sx;
							const pathD = `M ${sx} ${sy} C ${sx + dx * 0.45} ${sy}, ${tx - dx * 0.45} ${ty}, ${tx} ${ty}`;
							const midX = (sx + tx) / 2;
							const midY = (sy + ty) / 2;

							return (
								<g key={edge.id} className="transition-all duration-300">
									{/* Glow backing */}
									<path
										d={pathD}
										fill="none"
										stroke={isConnectedToHovered ? "rgba(245, 158, 11, 0.4)" : "rgba(99, 102, 241, 0.2)"}
										strokeWidth={isConnectedToHovered ? 8 : 4}
										strokeLinecap="round"
									/>

									{/* Main directed curve */}
									<path
										d={pathD}
										fill="none"
										stroke={isConnectedToHovered ? "#f59e0b" : "#6366f1"}
										strokeWidth={isConnectedToHovered ? 3 : 2}
										strokeDasharray={isConnectedToHovered ? "4 4" : "none"}
										markerEnd={
											isConnectedToHovered
												? "url(#arrowhead-highlight)"
												: "url(#arrowhead-default)"
										}
										className={isConnectedToHovered ? "animate-pulse" : ""}
									/>

									{/* Edge Label Badge */}
									<foreignObject
										x={midX - 45}
										y={midY - 14}
										width="90"
										height="28">
										<div className="flex items-center justify-center h-full">
											<span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight bg-slate-900/90 text-indigo-300 border border-indigo-500/40 shadow-lg">
												{edge.label}
											</span>
										</div>
									</foreignObject>
								</g>
							);
						})}
					</svg>

					{/* Nodes rendered as HTML elements */}
					{nodes.map((node) => {
						const isMenuPrep = node.recipe_type === "menu_prep";
						const isHovered = hoveredNodeId === node.id;
						const isSelected = inspectNode?.id === node.id;

						let borderStyles = isMenuPrep
							? "border-amber-500/40 bg-slate-900/95 hover:border-amber-400 text-amber-200"
							: "border-indigo-500/40 bg-slate-900/95 hover:border-indigo-400 text-indigo-200";

						if (isHovered || isSelected) {
							borderStyles = isMenuPrep
								? "border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/30 bg-slate-900"
								: "border-indigo-400 ring-2 ring-indigo-400/40 shadow-indigo-500/30 bg-slate-900";
						}

						return (
							<div
								key={node.id}
								onMouseEnter={() => setHoveredNodeId(node.id)}
								onMouseLeave={() => setHoveredNodeId(null)}
								onClick={() => setInspectNode(node)}
								style={{
									left: `${node.x}px`,
									top: `${node.y}px`,
									width: `${NODE_WIDTH}px`,
									height: `${NODE_HEIGHT}px`,
								}}
								className={`graph-node absolute pointer-events-auto p-3 rounded-2xl border backdrop-blur-md cursor-pointer transition-all duration-200 shadow-xl flex flex-col justify-between ${borderStyles}`}>
								{/* Header Tag */}
								<div className="flex items-center justify-between gap-1">
									<span
										className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
											isMenuPrep
												? "bg-amber-500/20 text-amber-400"
												: "bg-indigo-500/20 text-indigo-400"
										}`}>
										{isMenuPrep ? "Menu Prep" : "Branch Prep"}
									</span>
									<span className="text-[10px] text-slate-400 font-semibold">
										{node.yield_quantity} {node.yield_unit}
									</span>
								</div>

								{/* Bilingual Names */}
								<div className="min-w-0 pr-1">
									<p className="font-bold text-xs text-white leading-relaxed truncate">
										{node.name_burmese}
									</p>
									<p className="text-[10px] text-slate-400 truncate">
										{node.name_english}
									</p>
								</div>

								{/* Footer */}
								<div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800 text-slate-400">
									<span>{node.prep_time_minutes || 15}m prep</span>
									{node.menu_item && (
										<span className="text-amber-400 font-bold">
											฿{node.menu_item.price}
										</span>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Canvas Floating Controls */}
			<div className="absolute top-4 right-4 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md">
				<button
					type="button"
					onClick={() => setScale((s) => Math.min(s + 0.15, 2.2))}
					className="btn btn-ghost btn-xs btn-square text-slate-300 hover:text-white"
					title="Zoom In">
					<ZoomIn className="w-4 h-4" />
				</button>
				<button
					type="button"
					onClick={() => setScale((s) => Math.max(s - 0.15, 0.4))}
					className="btn btn-ghost btn-xs btn-square text-slate-300 hover:text-white"
					title="Zoom Out">
					<ZoomOut className="w-4 h-4" />
				</button>
				<button
					type="button"
					onClick={handleResetView}
					className="btn btn-ghost btn-xs btn-square text-slate-300 hover:text-white"
					title="Reset Pan & Zoom">
					<RotateCcw className="w-4 h-4" />
				</button>
			</div>

			{/* Bottom Legend */}
			<div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-3 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs text-slate-300">
				<div className="flex items-center gap-1.5">
					<span className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50"></span>
					<span>Branch Prep (Sub-Recipe)</span>
				</div>
				<div className="flex items-center gap-1.5">
					<span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
					<span>Menu Prep (POS Dish)</span>
				</div>
				<div className="flex items-center gap-1 text-[11px] text-slate-400">
					<ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
					<span>Consumed by</span>
				</div>
			</div>

			{/* Slide-over Node Inspector Drawer */}
			{inspectNode && (
				<div className="absolute top-4 left-4 w-80 max-h-[90%] overflow-y-auto p-4 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-xl text-white space-y-3 animate-in fade-in slide-in-from-left duration-200">
					<div className="flex items-start justify-between gap-2">
						<span
							className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
								inspectNode.recipe_type === "menu_prep"
									? "bg-amber-500/20 text-amber-400"
									: "bg-indigo-500/20 text-indigo-400"
							}`}>
							{inspectNode.recipe_type === "menu_prep" ? "Menu Prep" : "Branch Prep"}
						</span>
						<button
							type="button"
							onClick={() => setInspectNode(null)}
							className="btn btn-ghost btn-xs btn-circle text-slate-400 hover:text-white">
							✕
						</button>
					</div>

					<div>
						<h4 className="text-base font-bold leading-relaxed">
							{inspectNode.name_burmese}
						</h4>
						<p className="text-xs text-slate-400">
							{inspectNode.name_english}
						</p>
					</div>

					<div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800">
						<div>
							<span className="text-slate-400 text-[10px] block">Yield</span>
							<span className="font-semibold">{inspectNode.yield_quantity} {inspectNode.yield_unit}</span>
						</div>
						<div>
							<span className="text-slate-400 text-[10px] block">Prep Time</span>
							<span className="font-semibold">{inspectNode.prep_time_minutes || 15} mins</span>
						</div>
					</div>

					{inspectNode.instructions_burmese && (
						<div className="space-y-1">
							<span className="text-[10px] text-slate-400 uppercase font-semibold">Instructions:</span>
							<p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
								{inspectNode.instructions_burmese}
							</p>
						</div>
					)}

					<div className="pt-2 flex gap-2">
						<button
							type="button"
							onClick={() => {
								onSelectRecipe(inspectNode.id);
								onSwitchToSplitView();
							}}
							className="btn btn-xs btn-primary w-full gap-1">
							<Eye className="w-3.5 h-3.5" /> Edit in Split Builder
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default RecipeDependencyGraph;
