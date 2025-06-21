import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const SearchableDropdown = ({
  options,
  value,
  onChange,
  onBlur,
  name,
  touched,
  error,
  placeholder = "Select an option"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        if (!selectedOption) {
            onBlur({ target: { name } });
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef, name, onBlur, selectedOption]);

  const handleSelect = (option) => {
    onChange({ target: { name, value: option.value } });
    setIsOpen(false);
    setSearchTerm('');
    onBlur({ target: { name } });
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasError = touched && error;
  const isValid = touched && value && !error;

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`w-full border rounded-lg px-3 py-2 flex justify-between items-center cursor-pointer ${
          hasError ? 'border-red-500 bg-red-50' :
          isValid ? 'border-green-500 bg-green-50' :
          'border-gray-300'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-black' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-30 w-full bg-white border rounded-lg shadow-lg mt-1">
          <div className="p-2 relative flex items-center border-b">
            <Search size={16} className="text-gray-400 absolute left-4" />
            <input
              type="text"
              placeholder="Search categories..."
              className="w-full border-none focus:ring-0 pl-8 pr-2 py-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500">No categories found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown; 