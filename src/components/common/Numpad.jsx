import React, { useCallback, memo } from "react";

const NumpadButton = memo(({ value, onClick, className, children }) => (
  <button
    type="button"
    onClick={() => onClick(value)}
    className={className}
  >
    {children || value}
  </button>
));

NumpadButton.displayName = "NumpadButton";

const Numpad = ({ 
  value, 
  onChange, 
  onClear, 
  onDelete,
  className = "",
  buttonClassName = "btn bg-base-200 border-none hover:bg-base-300 text-base-content text-2xl font-bold h-14 rounded-xl shadow-sm",
  clearButtonClassName = "btn btn-neutral bg-neutral hover:bg-neutral/80 text-neutral-content col-span-3 text-lg font-bold h-12 rounded-xl shadow-sm mt-1",
  deleteButtonClassName = "btn bg-error/10 hover:bg-error/20 text-error border-none text-2xl font-bold h-14 rounded-xl shadow-sm",
  disabled = false,
  maxDecimalPlaces = 2,
}) => {
  
  const handlePress = useCallback((val) => {
    if (disabled) return;
    
    const current = value || "";
    let newValue = current;

    if (val === "C") {
      newValue = "";
      if (onClear) onClear();
    } else if (val === "⌫") {
      newValue = current.slice(0, -1);
      if (onDelete) onDelete(current);
    } else if (val === ".") {
      if (!current.includes(".")) {
        newValue = current + ".";
      }
    } else {
      // Handle number input
      if (current.includes(".")) {
        const parts = current.split(".");
        if (parts[1].length >= maxDecimalPlaces) return;
      }
      
      // Replace leading zero
      if (current === "0" && val !== ".") {
        newValue = val;
      } else {
        newValue = current + val;
      }
    }

    onChange(newValue);
  }, [value, onChange, onClear, onDelete, disabled, maxDecimalPlaces]);

  // Memoize the number buttons array
  const numberButtons = useCallback(() => {
    return ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
      <NumpadButton
        key={num}
        value={num}
        onClick={handlePress}
        className={buttonClassName}
      />
    ));
  }, [handlePress, buttonClassName]);

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {numberButtons()}
      
      <NumpadButton
        value="."
        onClick={handlePress}
        className={buttonClassName}
      />
      
      <NumpadButton
        value="0"
        onClick={handlePress}
        className={buttonClassName}
      />
      
      <NumpadButton
        value="⌫"
        onClick={handlePress}
        className={deleteButtonClassName}
      />
      
      <NumpadButton
        value="C"
        onClick={handlePress}
        className={clearButtonClassName}
      >
        Clear
      </NumpadButton>
    </div>
  );
};

Numpad.displayName = "Numpad";

export default Numpad;