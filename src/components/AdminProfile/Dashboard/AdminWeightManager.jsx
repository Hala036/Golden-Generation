import React, { useState, useEffect } from "react";
import { FaSliders, FaSave, FaUndo, FaBalanceScale, FaInfoCircle } from "react-icons/fa";
import { toast } from "react-hot-toast";

const AdminWeightManager = ({ 
  currentWeights = {
    location: 40,
    interests: 25,
    background: 25,
    availability: 5,
    frequency: 2.5,
    timing: 2.5
  },
  onWeightsChange,
  onSave,
  disabled = false
}) => {
  const [weights, setWeights] = useState(currentWeights);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Default weight presets
  const presets = {
    default: {
      name: "Default Balanced",
      weights: { location: 40, interests: 25, background: 25, availability: 5, frequency: 2.5, timing: 2.5 }
    },
    locationFocused: {
      name: "Location Priority",
      weights: { location: 60, interests: 20, background: 15, availability: 3, frequency: 1, timing: 1 }
    },
    skillsFocused: {
      name: "Skills Priority",
      weights: { location: 10, interests: 40, background: 35, availability: 10, frequency: 2.5, timing: 2.5 }
    },
    availabilityFocused: {
      name: "Availability Priority",
      weights: { location: 25, interests: 20, background: 20, availability: 25, frequency: 5, timing: 5 }
    }
  };

  useEffect(() => {
    setWeights(currentWeights);
    setHasChanges(false);
  }, [currentWeights]);

  // Calculate total weight
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  const isValidTotal = Math.abs(totalWeight - 100) <= 0.1;

  // Handle weight change
  const handleWeightChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    const newWeights = {
      ...weights,
      [field]: numValue
    };
    setWeights(newWeights);
    setHasChanges(true);
    
    if (onWeightsChange) {
      onWeightsChange(newWeights);
    }
  };

  // Auto-balance weights to ensure they add up to 100%
  const autoBalanceWeights = () => {
    if (totalWeight === 0) {
      toast.error("Cannot balance weights when all values are zero");
      return;
    }

    const factor = 100 / totalWeight;
    const balancedWeights = {};
    
    Object.keys(weights).forEach(key => {
      balancedWeights[key] = Math.round(weights[key] * factor * 10) / 10; // Round to 1 decimal
    });
    
    setWeights(balancedWeights);
    setHasChanges(true);
    
    if (onWeightsChange) {
      onWeightsChange(balancedWeights);
    }
    
    toast.success("Weights auto-balanced to 100%");
  };

  // Reset to default weights
  const resetToDefault = () => {
    const defaultWeights = presets.default.weights;
    setWeights(defaultWeights);
    setHasChanges(true);
    
    if (onWeightsChange) {
      onWeightsChange(defaultWeights);
    }
    
    toast.success("Weights reset to default values");
  };

  // Apply preset
  const applyPreset = (presetKey) => {
    const preset = presets[presetKey];
    setWeights(preset.weights);
    setHasChanges(true);
    
    if (onWeightsChange) {
      onWeightsChange(preset.weights);
    }
    
    toast.success(`Applied ${preset.name} preset`);
  };

  // Save weights
  const handleSave = () => {
    if (!isValidTotal) {
      toast.error(`Weights must add up to 100% (currently ${totalWeight.toFixed(1)}%)`);
      return;
    }

    if (onSave) {
      onSave(weights);
    }
    
    setHasChanges(false);
    toast.success("Weights saved successfully");
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <FaSliders className="text-blue-500" />
          <h3 className="text-lg font-semibold">Dynamic Weight Configuration</h3>
          {hasChanges && (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              Unsaved Changes
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}>
            Total: {totalWeight.toFixed(1)}%
          </span>
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t p-4 space-y-4">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <FaInfoCircle className="text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">How Dynamic Weights Work:</p>
                <ul className="text-xs space-y-1">
                  <li>• <strong>Location:</strong> How important is geographic proximity?</li>
                  <li>• <strong>Interests:</strong> How important is matching volunteer field interests?</li>
                  <li>• <strong>Background:</strong> How important is professional background alignment?</li>
                  <li>• <strong>Availability:</strong> How important is day/schedule availability?</li>
                  <li>• <strong>Frequency:</strong> How important is matching volunteer frequency?</li>
                  <li>• <strong>Timing:</strong> How important is matching preferred time slots?</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Quick Presets:</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(presets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  disabled={disabled}
                  className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-xs py-2 px-3 rounded border"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Weight Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(weights).map(([field, value]) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {field} Weight (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={value}
                  onChange={(e) => handleWeightChange(field, e.target.value)}
                  disabled={disabled}
                  className="w-full p-2 border rounded text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            ))}
          </div>

          {/* Weight Summary */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.entries(weights).map(([field, value]) => (
                <div key={field} className="flex justify-between">
                  <span className="capitalize">{field}:</span>
                  <span className="font-semibold">{value}%</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className={`font-bold ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}>
                  {totalWeight.toFixed(1)}%
                </span>
              </div>
              {!isValidTotal && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠ Weights must equal 100% for accurate scoring
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={resetToDefault}
              disabled={disabled}
              className="flex items-center space-x-1 bg-gray-500 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm py-2 px-3 rounded"
            >
              <FaUndo />
              <span>Reset to Default</span>
            </button>
            
            <button
              onClick={autoBalanceWeights}
              disabled={disabled || totalWeight === 0}
              className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm py-2 px-3 rounded"
            >
              <FaBalanceScale />
              <span>Auto Balance</span>
            </button>
            
            {onSave && (
              <button
                onClick={handleSave}
                disabled={disabled || !hasChanges || !isValidTotal}
                className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm py-2 px-3 rounded"
              >
                <FaSave />
                <span>Save Weights</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWeightManager;

