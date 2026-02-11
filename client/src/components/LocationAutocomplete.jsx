import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, X, Navigation } from 'lucide-react';

/**
 * LocationAutocomplete - A reusable location search input with autocomplete suggestions
 * Uses the free OpenStreetMap Nominatim API (no API key required)
 * 
 * Props:
 * - value: current input value
 * - onChange: callback when value changes (string)
 * - onSelect: callback when a suggestion is selected ({ display_name, lat, lon })
 * - placeholder: input placeholder text
 * - className: additional CSS classes for the wrapper
 * - inputClassName: additional CSS classes for the input
 * - isDark: whether dark mode is active (optional, auto-detects if not provided)
 * - style: inline styles for the input
 * - disabled: whether the input is disabled
 */
const LocationAutocomplete = ({
    value = '',
    onChange,
    onSelect,
    placeholder = 'Search for a location...',
    className = '',
    inputClassName = '',
    isDark,
    style = {},
    disabled = false,
}) => {
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [inputFocused, setInputFocused] = useState(false);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Fetch suggestions from Nominatim API
    const fetchSuggestions = useCallback(async (query) => {
        if (!query || query.trim().length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=in`,
                {
                    signal: controller.signal,
                    headers: {
                        'Accept-Language': 'en',
                    },
                }
            );

            if (!response.ok) throw new Error('Network error');

            const data = await response.json();

            const formattedSuggestions = data.map((item) => {
                // Build a clean display name
                const parts = [];
                const addr = item.address || {};

                // City/town/village
                const city = addr.city || addr.town || addr.village || addr.county || '';
                if (city) parts.push(city);

                // State
                if (addr.state && addr.state !== city) parts.push(addr.state);

                // Country
                if (addr.country) parts.push(addr.country);

                return {
                    display_name: parts.length > 0 ? parts.join(', ') : item.display_name,
                    full_display_name: item.display_name,
                    lat: item.lat,
                    lon: item.lon,
                    type: item.type,
                    address: addr,
                };
            });

            // Remove duplicates based on display_name
            const unique = formattedSuggestions.filter(
                (item, index, self) => index === self.findIndex((t) => t.display_name === item.display_name)
            );

            setSuggestions(unique);
            setShowSuggestions(unique.length > 0);
            setActiveIndex(-1);
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Location search error:', err);
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounced input handler
    const handleInputChange = (e) => {
        const newValue = e.target.value;
        onChange(newValue);

        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Debounce API call (400ms)
        debounceRef.current = setTimeout(() => {
            fetchSuggestions(newValue);
        }, 400);
    };

    // Handle suggestion selection
    const handleSelect = (suggestion) => {
        onChange(suggestion.display_name);
        if (onSelect) {
            onSelect(suggestion);
        }
        setShowSuggestions(false);
        setSuggestions([]);
        inputRef.current?.blur();
    };

    // Clear input
    const handleClear = () => {
        onChange('');
        setSuggestions([]);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
                break;
            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < suggestions.length) {
                    handleSelect(suggestions[activeIndex]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setActiveIndex(-1);
                break;
            default:
                break;
        }
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, []);

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            {/* Input with icons */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    ) : (
                        <MapPin className="w-4 h-4 text-emerald-500" />
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        setInputFocused(true);
                        if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    onBlur={() => setInputFocused(false)}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete="off"
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border transition-all duration-300 ${inputClassName}`}
                    style={{
                        backgroundColor: 'var(--bg-input, rgba(51, 65, 85, 0.5))',
                        borderColor: inputFocused
                            ? 'rgba(16, 185, 129, 0.5)'
                            : 'var(--border-primary, rgba(71, 85, 105, 0.5))',
                        color: 'var(--text-primary, #fff)',
                        outline: 'none',
                        boxShadow: inputFocused ? '0 0 0 3px rgba(16, 185, 129, 0.1)' : 'none',
                        ...style,
                    }}
                />

                {/* Clear button */}
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 transition-opacity hover:opacity-80"
                    >
                        <X className="w-4 h-4" style={{ color: 'var(--text-muted, #94a3b8)' }} />
                    </button>
                )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div
                    className="absolute z-50 w-full mt-2 rounded-xl border overflow-hidden"
                    style={{
                        backgroundColor: 'var(--bg-card, #1e293b)',
                        borderColor: 'var(--border-primary, rgba(71, 85, 105, 0.5))',
                        boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.4)',
                        animation: 'slideDown 0.2s ease-out',
                    }}
                >
                    {/* Header */}
                    <div
                        className="px-3 py-2 text-xs font-medium flex items-center gap-1.5 border-b"
                        style={{
                            color: 'var(--text-muted, #94a3b8)',
                            borderColor: 'var(--border-primary, rgba(71, 85, 105, 0.3))',
                            backgroundColor: 'var(--bg-tertiary, rgba(30, 41, 59, 0.5))',
                        }}
                    >
                        <Navigation className="w-3 h-3" />
                        Suggestions
                    </div>

                    {/* Suggestion items */}
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                            type="button"
                            onClick={() => handleSelect(suggestion)}
                            onMouseEnter={() => setActiveIndex(index)}
                            className="w-full text-left px-4 py-3 flex items-start gap-3 transition-all duration-150 border-b last:border-b-0"
                            style={{
                                backgroundColor:
                                    activeIndex === index
                                        ? 'var(--bg-hover, rgba(99, 102, 241, 0.1))'
                                        : 'transparent',
                                borderColor: 'var(--border-primary, rgba(71, 85, 105, 0.2))',
                            }}
                        >
                            <MapPin
                                className="w-4 h-4 mt-0.5 flex-shrink-0"
                                style={{
                                    color: activeIndex === index ? '#10b981' : 'var(--text-muted, #64748b)',
                                }}
                            />
                            <div className="flex-1 min-w-0">
                                <p
                                    className="text-sm font-medium truncate"
                                    style={{
                                        color:
                                            activeIndex === index
                                                ? 'var(--text-primary, #fff)'
                                                : 'var(--text-secondary, #cbd5e1)',
                                    }}
                                >
                                    {suggestion.display_name}
                                </p>
                                {suggestion.full_display_name !== suggestion.display_name && (
                                    <p
                                        className="text-xs truncate mt-0.5"
                                        style={{ color: 'var(--text-muted, #64748b)' }}
                                    >
                                        {suggestion.full_display_name}
                                    </p>
                                )}
                            </div>
                        </button>
                    ))}

                    {/* Footer */}
                    <div
                        className="px-3 py-1.5 text-[10px] text-right"
                        style={{
                            color: 'var(--text-muted, #64748b)',
                            backgroundColor: 'var(--bg-tertiary, rgba(30, 41, 59, 0.5))',
                        }}
                    >
                        Powered by OpenStreetMap
                    </div>
                </div>
            )}

            {/* Inline CSS for animation */}
            <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
};

export default LocationAutocomplete;
