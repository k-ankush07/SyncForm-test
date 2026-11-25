
import { useMemo, useCallback } from "react";

export default function useProductField({
  normalizedElement = {},
  products = [],
  value = "",
  selected = [],
  setSelected,
  reportChange,
}) {
  // Products selected in Product Settings.
  const selectedProductIds = useMemo(
    () =>
      Array.isArray(normalizedElement.selectedProductIds)
        ? normalizedElement.selectedProductIds
        : [],
    [normalizedElement.selectedProductIds]
  );

  // Get selected products from Shopify products.
  const selectedProducts = useMemo(
    () =>
      products.filter((product) =>
        selectedProductIds.includes(product.id)
      ),
    [products, selectedProductIds]
  );

  // Search configuration.
  const showSearch = normalizedElement.showSearchBar !== false;

  // Filter products by search value.
  const filteredProducts = useMemo(
    () =>
      showSearch
        ? selectedProducts.filter((product) =>
            (product.title || "")
              .toLowerCase()
              .includes(String(value || "").toLowerCase())
          )
        : selectedProducts,
    [showSearch, selectedProducts, value]
  );

  // Product selection handler.
  const handleProductSelect = useCallback(
    (product) => {
      const isSelected = selected.includes(product.id);

      let nextSelected;

      if (normalizedElement.allowMultiple) {
        nextSelected = isSelected
          ? selected.filter((id) => id !== product.id)
          : [...selected, product.id];
      } else {
        nextSelected = isSelected ? [] : [product.id];
      }

      setSelected(nextSelected);
      reportChange(nextSelected);
    },
    [
      selected,
      normalizedElement.allowMultiple,
      setSelected,
      reportChange,
    ]
  );

  return {
    selectedProductIds,
    selectedProducts,
    filteredProducts,
    showSearch,
    handleProductSelect,
  };
}
