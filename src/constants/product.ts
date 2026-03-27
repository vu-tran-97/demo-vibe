/**
 * Product-related constants.
 * Category definitions, status labels, sort options.
 */

export const CATEGORY_LABELS: Record<string, string> = {
  CERAMICS: 'Ceramics & Pottery',
  TEXTILES: 'Textiles & Fabrics',
  ART: 'Art & Prints',
  JEWELRY: 'Jewelry & Accessories',
  HOME: 'Home & Living',
  FOOD: 'Food & Beverages',
};

export const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([code, label]) => ({
  code,
  label,
}));

export const PRODUCT_STATUSES: Record<string, string> = {
  DRAFT: 'Draft',
  ACTV: 'Active',
  ACTIVE: 'Active',
  SOLD_OUT: 'Sold Out',
  HIDDEN: 'Hidden',
};

export const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Latest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];
