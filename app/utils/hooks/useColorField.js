
import { useState, useEffect, useCallback } from "react";

export default function useColorField({
  savedValue,
  normalizedElement = {},
  reportChange,
}) {
  const getInitialColor = useCallback(() => {
    return (
      savedValue ??
      normalizedElement.defaultColor ??
      "#563D7C"
    );
  }, [savedValue, normalizedElement.defaultColor]);

  const [colorValue, setColorValue] = useState(getInitialColor);

  useEffect(() => {
    const nextColor = getInitialColor();

    setColorValue((previous) =>
      previous === nextColor ? previous : nextColor
    );
  }, [normalizedElement.id, getInitialColor]);

  const handleColorChange = useCallback(
    (newColor) => {
      setColorValue(newColor);
      reportChange(newColor);
    },
    [reportChange]
  );

  return {
    colorValue,
    handleColorChange,
  };
}
