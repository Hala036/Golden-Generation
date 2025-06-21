const tailwindColors = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
];

/**
 * A simple hashing function to convert a string to a number.
 * This is used to give each category a consistent, but unique, color.
 * @param {string} str The category ID.
 * @returns {number} A hash of the string.
 */
const getHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

/**
 * Gets a background color for a given category.
 * If a custom color is defined in the category object, it returns that as an inline style.
 * Otherwise, it falls back to a consistent, hash-based Tailwind CSS class.
 * @param {object} category The category object, which may contain a 'color' property.
 * @returns {{ style: object } | { className: string }} An object with either a style or a className.
 */
export const getCategoryAppearance = (category) => {
  // If the category has a custom color, use it as an inline style.
  if (category?.color) {
    return { style: { backgroundColor: category.color } };
  }

  // Otherwise, fall back to the automatic, hash-based color.
  if (!category?.id) {
    return { className: "bg-gray-500" }; // Default for no category ID.
  }

  const hash = getHash(category.id);
  const index = Math.abs(hash % tailwindColors.length);
  return { className: tailwindColors[index] };
}; 