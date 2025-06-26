import { useState, useCallback, useRef } from 'react';
import { debounce } from 'lodash';

/**
 * Custom hook for field validation and debounced existence checks.
 * @param {Object} options
 * @param {function} options.validate - Synchronous validation function (returns error string or '').
 * @param {function} [options.checkExists] - Async function to check if value exists (returns true if exists).
 * @param {string} [options.existsError] - Error message to show if value exists.
 * @returns {Object} { value, setValue, error, isChecking, onChange, onBlur }
 */
export function useFieldValidation({ validate, checkExists, existsError }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const lastCheckedValue = useRef('');

  // Debounced existence check
  const debouncedCheckExists = useCallback(
    debounce(async (val) => {
      if (!checkExists) return;
      setIsChecking(true);
      lastCheckedValue.current = val;
      try {
        const exists = await checkExists(val);
        if (lastCheckedValue.current === val && exists) {
          setError(existsError || 'Already exists');
        } else if (lastCheckedValue.current === val && !exists) {
          setError('');
        }
      } finally {
        setIsChecking(false);
      }
    }, 500),
    [checkExists, existsError]
  );

  // Handle change
  const onChange = (e) => {
    const val = e.target.value;
    setValue(val);
    setError('');
    const validationError = validate(val);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (checkExists) debouncedCheckExists(val);
  };

  // Handle blur
  const onBlur = () => {
    const validationError = validate(value);
    setError((prev) => (prev === existsError ? prev : validationError));
  };

  return {
    value,
    setValue,
    error,
    isChecking,
    onChange,
    onBlur,
  };
} 