// src/components/common/ImageUploadField.jsx
import { Controller } from "react-hook-form";
import ImageUpload from "./ImageUpload";

/**
 * ImageUpload component integrated with react-hook-form
 */
const ImageUploadField = ({
	name,
	control,
	rules,
	defaultValue = "",
	...props
}) => {
	return (
		<Controller
			name={name}
			control={control}
			rules={rules}
			defaultValue={defaultValue}
			render={({ field, fieldState }) => (
				<ImageUpload
					value={field.value}
					onChange={field.onChange}
					error={fieldState.error?.message}
					{...props}
				/>
			)}
		/>
	);
};

export default ImageUploadField;
