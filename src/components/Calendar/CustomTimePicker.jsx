import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

const CustomTimePicker = ({
  name,
  value,
  onChange,
  onBlur,
  touched,
  error,
  isOpen,
  setIsOpen,
  timeSlots,
  getIsDisabled,
  handleSelect,
  pickerRef,
  selectedRef
}) => {
  const hasError = touched && error;
  const isValid = touched && value && !error;

  return (
    <div className="relative" ref={pickerRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          name={name}
          value={value || ''}
          onChange={onChange}
          onFocus={() => setIsOpen(true)}
          onBlur={onBlur}
          placeholder="HH:MM"
          className={`w-full border rounded-lg pl-3 pr-10 py-2 ${
            hasError ? 'border-red-500 bg-red-50' :
            isValid ? 'border-green-500 bg-green-50' :
            'border-gray-300'
          }`}
          autoComplete="off"
        />
        <div 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
        >
          <Clock size={16} className="text-gray-500" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-20 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          {timeSlots.map(time => {
            const isDisabled = getIsDisabled(time);
            const isSelected = value === time;
            return (
              <div
                key={time}
                ref={isSelected ? selectedRef : null}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!isDisabled) {
                    handleSelect(time);
                  }
                }}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                  isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''
                } ${
                  isDisabled ? 'text-gray-400 cursor-not-allowed bg-gray-50' : ''
                }`}
              >
                {time}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CustomTimePickerWrapper = (props) => {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef(null);
    const selectedRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (isOpen && props.value && selectedRef.current) {
            selectedRef.current.scrollIntoView({
                block: 'nearest',
            });
        }
    }, [isOpen, props.value]);

    const handleSelect = (time) => {
        props.onChange({ target: { name: props.name, value: time } });
        setIsOpen(false);
        props.onBlur({ target: { name: props.name } });
    };
    
    return (
        <CustomTimePicker
            {...props}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            pickerRef={pickerRef}
            selectedRef={selectedRef}
            handleSelect={handleSelect}
        />
    )
}

export default CustomTimePickerWrapper; 