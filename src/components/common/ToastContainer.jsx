// src/components/common/ToastContainer.jsx
import React from "react";
import { ToastContainer as ToastifyContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const ToastContainer = () => (
	<ToastifyContainer
		position="top-right"
		autoClose={3000}
		hideProgressBar={false}
		newestOnTop
		closeOnClick
		rtl={false}
		pauseOnFocusLoss
		draggable
		pauseOnHover
		theme="light"
	/>
);
