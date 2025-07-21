import React from "react";
import { HexColorPicker } from "react-colorful";
import { useLanguage } from "../../context/LanguageContext";

const EditCategoryModal = ({
  open,
  onClose,
  translations,
  setTranslations,
  color,
  setColor,
  colorError,
  setColorError,
  translationErrors,
  setTranslationErrors,
  selectedColorCategory,
  setSelectedColorCategory,
  hexInput,
  setHexInput,
  colorNames,
  colorCategories,
  getColorSuggestion,
  getContrastRatio,
  loading,
  handleEditCategory,
}) => {
  const { t } = useLanguage();

  if (!open) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{t("auth.categoryManagement.modals.editTitle")}</h2>
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
            {/* Remove Arabic field if not needed */}
          </div>
          {/* Right Column - Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("auth.categoryManagement.form.categoryColor")} <span className="text-red-500">*</span>
            </label>
            {translations.en && color && (
              <div className="mb-2 p-3 rounded-lg shadow-md flex items-center gap-4" style={{ backgroundColor: color }}>
                <span className="text-white font-semibold">{translations.en}</span>
                <div className="flex flex-col ml-4">
                  <span className="text-xs text-white font-bold">{colorNames[color] || "Custom"}</span>
                  <span
                    className="text-xs text-white underline cursor-pointer select-all"
                    title="Click to copy"
                    onClick={() => {navigator.clipboard.writeText(color);}}
                  >
                    {color}
                  </span>
                </div>
              </div>
            )}
            {color && getContrastRatio(color) === "Poor" && (
              <div className="mb-2 text-xs text-red-600 font-semibold">{t("auth.categoryManagement.addCategoryModal.contrastWarning")}</div>
            )}
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
              </div>
              <input
                type="text"
                className="border px-2 py-1 rounded-md w-32 mt-2 text-sm"
                value={hexInput}
                onChange={e => {
                  let val = e.target.value;
                  if (!val.startsWith("#")) val = "#" + val;
                  setHexInput(val);
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
            onClick={handleEditCategory}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded-md"
            disabled={loading}
          >
            {loading ? t("auth.categoryManagement.modals.updating") : t("auth.categoryManagement.modals.updateCategory")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCategoryModal;