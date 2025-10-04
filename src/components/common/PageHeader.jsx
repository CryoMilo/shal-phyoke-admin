// components/common/PageHeader.jsx
import React from "react";
import { Link } from "@tanstack/react-router";

export const PageHeader = ({
	title,
	description,
	buttons = [],
	className = "",
}) => {
	return (
		<div
			className={`flex flex-row justify-between items-start sm:items-center gap-4 mb-6 ${className}`}>
			<div className="text-center sm:text-left">
				<h1
					className="font-bold"
					style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
					{title}
				</h1>
				{description && (
					<p className="text-gray-600 text-sm sm:text-base mt-1">
						{description}
					</p>
				)}
			</div>

			{buttons.length > 0 && (
				<div className="flex gap-2 self-center sm:self-auto">
					{buttons.map((button, index) => (
						<ButtonRenderer key={index} button={button} />
					))}
				</div>
			)}
		</div>
	);
};

const ButtonRenderer = ({ button }) => {
	const {
		type = "button",
		label,
		icon: Icon,
		onClick,
		to,
		variant = "primary",
		component,
		...props
	} = button;

	// If it's a custom component, just render it
	if (type === "custom" && component) {
		return component;
	}

	const commonClasses = `btn btn-${variant} btn-sm sm:btn-md flex items-center`;
	const content = (
		<>
			{Icon && <Icon className="w-4 h-4" />}
			<span className="hidden sm:inline ml-2">{label}</span>
		</>
	);

	if (type === "link" && to) {
		return (
			<Link
				to={to}
				className={commonClasses}
				title={label} // Add title for accessibility
				{...props}>
				{content}
			</Link>
		);
	}

	return (
		<button
			type={type}
			onClick={onClick}
			className={commonClasses}
			title={label} // Add title for accessibility
			{...props}>
			{content}
		</button>
	);
};
