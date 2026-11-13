import {
  tableFeatures,
  columnSizingFeature,
  columnVisibilityFeature,
  rowSelectionFeature,
  rowSortingFeature,
  createSortedRowModel,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  sortFn_basic,
} from "@tanstack/react-table";

// V9 registers both the sorting feature and its row model explicitly.
export const reportTableFeatures = tableFeatures({
  columnSizingFeature,
  columnVisibilityFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    datetime: sortFn_datetime,
    text: sortFn_text,
    basic: sortFn_basic,
  },
});
