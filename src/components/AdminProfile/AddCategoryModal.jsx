import React, { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { toast } from "react-hot-toast";
import { useLanguage } from "../../context/LanguageContext";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";

const AddCategoryModal = ({
  open,
  onClose,
}) => {
  const { t } = useLanguage();
  const [color, setColor] = useState(""); // Remove default color to make it required
  const [loading, setLoading] = useState(false);
  const [colorError, setColorError] = useState("");
  const [translationErrors, setTranslationErrors] = useState({ en: "", he: "" });
  const [selectedColorCategory, setSelectedColorCategory] = useState("Warm");
  const [hexInput, setHexInput] = useState("");
  const [translations, setTranslations] = useState({ en: "", he: "", ar: "" });
  const [formData, setFormData] = useState({
    translations: { en: "", he: "", ar: "" },
    color: "#CCCCCC"
  });

  // Predefined color palette
  const predefinedColors = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4",
    "#F97316", "#EC4899", "#84CC16", "#6366F1", "#14B8A6", "#F43F5E"
  ];

  // Color categories
  const colorCategories = {
    "Warm": ["#EF4444", "#F59E0B", "#F97316", "#EC4899", "#F43F5E"],
    "Cool": ["#3B82F6", "#8B5CF6", "#06B6D4", "#6366F1", "#14B8A6"],
    "Nature": ["#10B981", "#84CC16", "#22C55E", "#16A34A", "#15803D"],
    "Neutral": ["#6B7280", "#9CA3AF", "#D1D5DB", "#374151", "#1F2937"]
  };

  // Color names for accessibility
  const colorNames = {
    "#3B82F6": "Blue",
    "#10B981": "Green",
    "#F59E0B": "Amber", 
    "#EF4444": "Red",
    "#8B5CF6": "Purple",
    "#06B6D4": "Cyan",
    "#F97316": "Orange",
    "#EC4899": "Pink",
    "#84CC16": "Lime",
    "#6366F1": "Indigo",
    "#14B8A6": "Teal",
    "#F43F5E": "Rose",
    "#6B7280": "Gray",
    "#9CA3AF": "Light Gray",
    "#D1D5DB": "Very Light Gray",
    "#374151": "Dark Gray",
    "#1F2937": "Very Dark Gray",
    "#22C55E": "Bright Green",
    "#16A34A": "Forest Green",
    "#15803D": "Dark Green"
  };

  const AddCategoryModal = ({ open, onClose, onCategoryAdded }) => {
    const [translations, setTranslations] = useState({ en: "", he: "", ar: "" });
    // ...other local state...

    // When category is added:
    if (onCategoryAdded) onCategoryAdded();
    onClose();
  };
  
    useEffect(() => {
      setHexInput(formData.color || "#CCCCCC");
    }, [formData.color]);
  

  // Smart color suggestions
  const getColorSuggestion = (categoryName) => {
    if (!categoryName) return "#6B7280";
    const name = categoryName.toLowerCase();
    if (name.includes('sport') || name.includes('fitness')) return "#10B981";
    if (name.includes('food') || name.includes('cooking')) return "#F59E0B";
    if (name.includes('music') || name.includes('art')) return "#8B5CF6";
    if (name.includes('health') || name.includes('medical')) return "#EF4444";
    if (name.includes('education') || name.includes('learning')) return "#3B82F6";
    if (name.includes('nature') || name.includes('outdoor')) return "#84CC16";
    if (name.includes('technology') || name.includes('computer')) return "#6366F1";
    if (name.includes('social') || name.includes('party')) return "#EC4899";
    return "#6B7280";
  };

  // Check color contrast for accessibility
  const getContrastRatio = (hexColor) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return contrast ratio (simplified)
    return luminance > 0.5 ? "Good" : "Poor";
  };

  // Auto-suggest color when English translation changes
  useEffect(() => {
    if (translations.en && !color) {
      const suggestedColor = getColorSuggestion(translations.en);
      setColor(suggestedColor);
    }
  }, [translations.en, color]);

  useEffect(() => {
    setHexInput(color || "#CCCCCC");
  }, [color]);

  // Eyedropper handler
  const handleEyedropper = async () => {
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        setColor(result.sRGBHex);
        setHexInput(result.sRGBHex);
      } catch (e) {
        toast.error(t('auth.categoryManagement.addCategoryModal.eyedropperFailed'));
      }
    } else {
      toast.error(t('auth.categoryManagement.addCategoryModal.eyedropperNotSupported'));
    }
  };

  // Ref for modal container
  const modalRef = React.useRef(null);
  // Store original overflow
  const [originalOverflow, setOriginalOverflow] = useState("");

  // Handler for color input focus/blur
  const handleColorFocus = () => {
    if (modalRef.current) {
      setOriginalOverflow(modalRef.current.style.overflowY);
      modalRef.current.style.overflowY = "visible";
    }
  };
  const handleColorBlur = () => {
    if (modalRef.current) {
      modalRef.current.style.overflowY = originalOverflow || "auto";
    }
  };

  const handleAddCategory = async () => {
    // Reset errors
    setColorError("");
    setTranslationErrors({ en: "", he: "" });
    
    let hasErrors = false;
    
    // Validate translations
    if (!translations.en || translations.en.trim() === "") {
      setTranslationErrors(prev => ({ ...prev, en: "English translation is required" }));
      hasErrors = true;
    }
    
    if (!translations.he || translations.he.trim() === "") {
      setTranslationErrors(prev => ({ ...prev, he: "Hebrew translation is required" }));
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    // Validate color selection
    if (!color || color === "#CCCCCC" || color === "") {
      setColorError(t("auth.categoryManagement.colorRequired") || "Please select a color");
      return;
    }

    // Format the English translation to be lowercase and remove spaces
    const formattedName = translations.en.toLowerCase().replace(/\s+/g, "");

    setLoading(true);
    try {
      const categoriesRef = collection(db, "categories");
      const categoryDoc = doc(categoriesRef, formattedName); // Use formattedName as the document ID
      await setDoc(categoryDoc, {
        name: formattedName,
        translations: translations,
        color: color // Save the selected color
      });
      toast.success(t("auth.categoryManagement.categoryAddedSuccess"));
      onClose(); // Close the modal
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error(t("auth.categoryManagement.addCategoryModal.failedToAddCategory"));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{t("auth.categoryManagement.addCategoryModal.title")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Form Fields */}
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("auth.categoryManagement.form.englishTranslation")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`border px-3 py-2 rounded-md w-full ${translationErrors.en ? 'border-red-500' : 'border-gray-300'}`}
                value={translations.en}
                onChange={(e) => {
                  setTranslations({ ...translations, en: e.target.value });
                  if (translationErrors.en) setTranslationErrors(prev => ({ ...prev, en: "" }));
                }}
                placeholder={t("auth.categoryManagement.form.englishPlaceholder")}
                required
              />
              {translationErrors.en && (
                <p className="text-red-500 text-xs mt-1">{translationErrors.en}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("auth.categoryManagement.form.hebrewTranslation")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`border px-3 py-2 rounded-md w-full ${translationErrors.he ? 'border-red-500' : 'border-gray-300'}`}
                value={translations.he}
                onChange={(e) => {
                  setTranslations({ ...translations, he: e.target.value });
                  if (translationErrors.he) setTranslationErrors(prev => ({ ...prev, he: "" }));
                }}
                placeholder={t("auth.categoryManagement.form.hebrewPlaceholder")}
                required
              />
              {translationErrors.he && (
                <p className="text-red-500 text-xs mt-1">{translationErrors.he}</p>
              )}
            </div>
            
            {/* <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("auth.categoryManagement.form.arabicTranslation")}
              </label>
              <input
                type="text"
                className="border px-3 py-2 rounded-md w-full border-gray-300"
                value={translations.ar}
                onChange={(e) =>
                  setTranslations({ ...translations, ar: e.target.value })
                }
                placeholder={t("auth.categoryManagement.form.arabicPlaceholder")}
              />
            </div> */}
          </div>

          {/* Right Column - Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("auth.categoryManagement.form.categoryColor")} <span className="text-red-500">*</span>
            </label>
            
            {/* Color Preview */}
            {translations.en && color && (
              <div className="mb-2 p-3 rounded-lg shadow-md flex items-center gap-4" style={{ backgroundColor: color }}>
                <span className="text-white font-semibold">{translations.en}</span>
                <div className="flex flex-col ml-4">
                  <span className="text-xs text-white font-bold">{colorNames[color] || "Custom"}</span>
                  <span
                    className="text-xs text-white underline cursor-pointer select-all"
                    title="Click to copy"
                    onClick={() => {navigator.clipboard.writeText(color); toast.success(t('auth.categoryManagement.addCategoryModal.copied'))}}
                  >
                    {color}
                  </span>
                </div>
              </div>
            )}
            {/* Contrast warning */}
            {color && getContrastRatio(color) === "Poor" && (
              <div className="mb-2 text-xs text-red-600 font-semibold">{t("auth.categoryManagement.addCategoryModal.contrastWarning")}</div>
            )}
            {/* Color Categories */}
            <div className="mb-4">
              <div className="flex gap-2 mb-3">
                {Object.keys(colorCategories).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedColorCategory(category)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedColorCategory === category
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              {/* Color Palette Grid */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                {colorCategories[selectedColorCategory].map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 relative ${
                      color === colorOption ? 'border-gray-800 scale-110 shadow-lg' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: colorOption }}
                    onClick={() => {
                      setColor(colorOption);
                      if (colorError) setColorError("");
                    }}
                    title={`${t('auth.categoryManagement.addCategoryModal.selectColor')}: ${colorNames[colorOption] || colorOption}`}
                  >
                    {color === colorOption && (
                      <span className="absolute top-1 right-1 text-white text-lg font-bold pointer-events-none" style={{textShadow: '0 0 2px #000'}}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {/* Quick Suggestions */}
            {translations.en && (
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">{t("auth.categoryManagement.addCategoryModal.suggestedFor")}:</p>
                <div className="flex gap-2">
                  {(() => {
                    const suggestedColor = getColorSuggestion(translations.en);
                    if (suggestedColor && suggestedColor !== color) {
                      return (
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full border-2 border-gray-300 hover:scale-110 transition-all"
                          style={{ backgroundColor: suggestedColor }}
                          onClick={() => {
                            setColor(suggestedColor);
                            if (colorError) setColorError("");
                          }}
                          title={t("auth.categoryManagement.addCategoryModal.smartSuggestion")}
                        />
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            )}
            {/* Custom Color Picker */}
            <div className="mb-4 flex flex-col gap-2">
              <label className="block text-xs text-gray-600 mb-2">{t("auth.categoryManagement.addCategoryModal.customColor")}:</label>
              <div className="flex items-center gap-2">
                <HexColorPicker
                  color={color || "#CCCCCC"}
                  onChange={(newColor) => {
                    setColor(newColor);
                    setHexInput(newColor);
                    if (colorError) setColorError("");
                  }}
                  style={{ width: '100%', maxWidth: '180px', height: '150px', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                />
                <button
                  type="button"
                  onClick={handleEyedropper}
                  title={window.EyeDropper ? t("auth.categoryManagement.addCategoryModal.pickColorFromScreen") : t("auth.categoryManagement.addCategoryModal.eyedropperNotSupported")}
                  className="ml-2 p-2 rounded-full border border-gray-300 bg-white hover:bg-gray-100 shadow text-xl flex items-center justify-center"
                  style={{ height: '40px', width: '40px' }}
                >
                  <span role="img" aria-label="Eyedropper">{t("auth.categoryManagement.addCategoryModal.eyedropperIcon")}</span>
                </button>
              </div>
              {/* Hex input field */}
              <input
                type="text"
                className="border px-2 py-1 rounded-md w-32 mt-2 text-sm"
                value={hexInput}
                onChange={e => {
                  let val = e.target.value;
                  if (!val.startsWith("#")) val = "#" + val;
                  setHexInput(val);
                  // Only update color if valid hex
                  if (/^#[0-9A-Fa-f]{6}$/.test(val)) setColor(val);
                }}
                maxLength={7}
                placeholder={t("auth.categoryManagement.addCategoryModal.hexPlaceholder")}
              />
              {colorError && (
                <p className="text-red-500 text-xs mt-1">{colorError}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold px-4 py-2 rounded-md"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleAddCategory}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded-md"
            disabled={loading}
          >
            {loading ? t("auth.categoryManagement.addCategoryModal.adding") : t("auth.categoryManagement.addCategoryModal.addCategory")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCategoryModal;