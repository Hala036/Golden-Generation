import React, { useState } from 'react';
import { FaSun, FaMoon, FaDesktop, FaChevronDown } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const ThemeSwitcher = ({ className = '' }) => {
  const { theme, isSystemTheme, toggleTheme, setSystemTheme, setLightTheme, setDarkTheme } = useTheme();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions = [
    {
      id: 'light',
      label: t('theme.light'),
      icon: <FaSun className="w-4 h-4" />,
      action: setLightTheme,
      active: theme === 'light' && !isSystemTheme
    },
    {
      id: 'dark',
      label: t('theme.dark'),
      icon: <FaMoon className="w-4 h-4" />,
      action: setDarkTheme,
      active: theme === 'dark' && !isSystemTheme
    },
    {
      id: 'system',
      label: t('theme.system'),
      icon: <FaDesktop className="w-4 h-4" />,
      action: setSystemTheme,
      active: isSystemTheme
    }
  ];

  const getCurrentIcon = () => {
    if (isSystemTheme) return <FaDesktop className="w-4 h-4" />;
    return theme === 'dark' ? <FaMoon className="w-4 h-4" /> : <FaSun className="w-4 h-4" />;
  };

  const getCurrentLabel = () => {
    if (isSystemTheme) return t('theme.system');
    return theme === 'dark' ? t('theme.dark') : t('theme.light');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Quick Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`
          flex items-center justify-center w-10 h-10 rounded-lg
          transition-all duration-200 ease-in-out
          hover:scale-105 active:scale-95
          ${theme === 'dark' 
            ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
          shadow-sm hover:shadow-md
        `}
        aria-label={t('theme.toggleTheme')}
        title={t('theme.toggleTheme')}
      >
        {getCurrentIcon()}
      </button>

      {/* Dropdown Menu */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            ml-2 flex items-center space-x-2 px-3 py-2 rounded-lg
            transition-all duration-200 ease-in-out
            hover:scale-105 active:scale-95
            ${theme === 'dark' 
              ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
            shadow-sm hover:shadow-md
          `}
          aria-label={t('theme.openMenu')}
          aria-expanded={isOpen}
        >
          <span className="text-sm font-medium">{getCurrentLabel()}</span>
          <FaChevronDown 
            className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {/* Dropdown Content */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <div className={`
              absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg
              transition-all duration-200 ease-in-out z-20
              ${theme === 'dark' 
                ? 'bg-gray-800 border border-gray-700' 
                : 'bg-white border border-gray-200'
              }
            `}>
              <div className="py-1">
                {themeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      option.action();
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 text-left
                      transition-all duration-150 ease-in-out
                      hover:scale-[1.02] active:scale-[0.98]
                      ${option.active 
                        ? (theme === 'dark' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-blue-50 text-blue-700'
                          )
                        : (theme === 'dark' 
                            ? 'text-gray-200 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-50'
                          )
                      }
                    `}
                  >
                    <span className={`
                      ${option.active 
                        ? 'text-current' 
                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }
                    `}>
                      {option.icon}
                    </span>
                    <span className="text-sm font-medium">{option.label}</span>
                    {option.active && (
                      <div className={`
                        ml-auto w-2 h-2 rounded-full
                        ${theme === 'dark' ? 'bg-white' : 'bg-blue-600'}
                      `} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ThemeSwitcher; 