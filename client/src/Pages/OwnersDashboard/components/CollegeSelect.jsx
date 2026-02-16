import React, { useState, useMemo, useEffect } from 'react';
import { Search, Check, Loader2, Globe } from 'lucide-react';
import collegeData from '../../../data/college_data.json';

const CollegeSelect = ({ value, onChange, isDark, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [apiResults, setApiResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Extract local college names only once
    const localColleges = useMemo(() => {
        try {
            if (!Array.isArray(collegeData)) return [];
            return collegeData
                .map(item => item["Unnamed: 1"])
                .filter(name => name && name !== "Name" && typeof name === 'string' && name.trim() !== '')
                .map(name => ({ name: name.trim(), source: 'local' }))
                .sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error("Error parsing college data:", error);
            return [];
        }
    }, []);

    // Filter local colleges based on input
    const filteredLocalColleges = useMemo(() => {
        if (!value) return localColleges.slice(0, 50);
        const term = value.toLowerCase();
        return localColleges
            .filter(item => item.name.toLowerCase().includes(term))
            .slice(0, 50);
    }, [value, localColleges]);

    // Fetch from API with debounce
    useEffect(() => {
        const fetchColleges = async () => {
            if (!value || value.length < 3) {
                setApiResults([]);
                return;
            }

            setIsLoading(true);
            try {
                // Using http because hipolabs free tier/setup might not support https or have cert issues 
                // mixed content warning might appear in production if deployed on https
                const response = await fetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(value)}`);
                if (response.ok) {
                    const data = await response.json();
                    // Map API results to our format
                    const formatted = data.map(item => ({
                        name: item.name,
                        source: 'api',
                        country: item.country
                    })).slice(0, 20); // Limit API results
                    setApiResults(formatted);
                }
            } catch (error) {
                console.error("Failed to fetch universities:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchColleges, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [value]);

    // Combine results
    const combinedResults = useMemo(() => {
        // Create a map to remove duplicates by name
        const unique = new Map();

        // Add local results first
        filteredLocalColleges.forEach(item => unique.set(item.name, item));

        // Add API results (if not already present)
        apiResults.forEach(item => {
            if (!unique.has(item.name)) {
                unique.set(item.name, item);
            }
        });

        return Array.from(unique.values());
    }, [filteredLocalColleges, apiResults]);

    const handleSelect = (name) => {
        onChange(name);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder || "Search worldwide colleges..."}
                    className="w-full px-4 py-2.5 pl-10 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    style={{
                        backgroundColor: isDark ? '#374151' : '#f9fafb',
                        borderColor: isDark ? '#4b5563' : '#d1d5db',
                        color: isDark ? '#fff' : '#000'
                    }}
                />
                <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 size={16} className="animate-spin text-emerald-500" />
                    </div>
                )}
            </div>

            {isOpen && (combinedResults.length > 0 || isLoading) && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <ul
                        className="absolute z-20 w-full mt-1 max-h-60 overflow-y-auto rounded-lg shadow-lg border"
                        style={{
                            backgroundColor: isDark ? '#1f2937' : '#ffffff',
                            borderColor: isDark ? '#374151' : '#e5e7eb'
                        }}
                    >
                        {combinedResults.map((college, idx) => (
                            <li
                                key={`${college.source}-${idx}`}
                                onClick={() => handleSelect(college.name)}
                                className="px-4 py-2 cursor-pointer transition-colors flex items-center justify-between group text-sm"
                                style={{
                                    color: isDark ? '#d1d5db' : '#374151',
                                    borderBottom: idx === combinedResults.length - 1 ? 'none' : `1px solid ${isDark ? '#374151' : '#f3f4f6'}`
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className="truncate font-medium">{college.name}</span>
                                    {college.source === 'api' && (
                                        <span className="text-xs flex items-center gap-1 opacity-60">
                                            <Globe size={10} />
                                            {college.country}
                                        </span>
                                    )}
                                </div>
                                {value === college.name && <Check size={16} className="text-emerald-500 flex-shrink-0 ml-2" />}
                            </li>
                        ))}

                        {!isLoading && combinedResults.length === 0 && value && (
                            <li className="px-4 py-2 text-sm text-gray-500 text-center">
                                No matches found
                            </li>
                        )}
                    </ul>
                </>
            )}
        </div>
    );
};

export default CollegeSelect;
