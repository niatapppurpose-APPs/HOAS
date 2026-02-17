import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Check, Loader2, Globe, Building2 } from 'lucide-react';
import collegeData from '../../../data/college_data.json';

/**
 * Helper — try to build a logo URL from the website field.
 * Uses Google's public favicon service (reliable, fast, CORS-friendly).
 * Falls back to null if the website is empty or '-'.
 */
const getLogoUrl = (website) => {
    if (!website || website === '-' || website.trim() === '' || website.trim() === '-') return null;
    // Normalise: ensure it starts with http(s)
    let domain = website.trim();
    if (!domain.startsWith('http')) {
        domain = `https://${domain}`;
    }
    try {
        const url = new URL(domain);
        // Google S2 favicon service — returns 16-128px icons
        return `https://www.google.com/s2/favicons?sz=64&domain=${url.hostname}`;
    } catch {
        return null;
    }
};

const CollegeSelect = ({ value, onChange, isDark, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [apiResults, setApiResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef(null);

    // ── Extract local college data (with state, website) ───────
    const localColleges = useMemo(() => {
        try {
            if (!Array.isArray(collegeData)) return [];
            return collegeData
                .filter(item => {
                    const name = item["Unnamed: 1"];
                    return name && name !== "Name" && typeof name === 'string' && name.trim() !== '';
                })
                .map(item => {
                    const website = item["Unnamed: 4"] || '';
                    return {
                        name: item["Unnamed: 1"].trim(),
                        state: item["Unnamed: 2"] || '',
                        website: website,
                        logo: getLogoUrl(website),
                        source: 'local',
                    };
                })
                .sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error("Error parsing college data:", error);
            return [];
        }
    }, []);

    // ── Filter local colleges on input ─────────────────────────
    const filteredLocalColleges = useMemo(() => {
        if (!value) return localColleges.slice(0, 50);
        const term = value.toLowerCase();
        return localColleges
            .filter(item => item.name.toLowerCase().includes(term))
            .slice(0, 50);
    }, [value, localColleges]);

    // ── Fetch from API (universities + institutions) ──────────
    useEffect(() => {
        const fetchInstitutions = async () => {
            if (!value || value.length < 3) {
                setApiResults([]);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch universities from hipolabs AND add a country=India filter
                // for more relevant results (can be removed for global)
                const urls = [
                    `http://universities.hipolabs.com/search?name=${encodeURIComponent(value)}`,
                    `http://universities.hipolabs.com/search?name=${encodeURIComponent(value)}&country=india`,
                ];

                const responses = await Promise.allSettled(urls.map(u => fetch(u)));
                const allItems = new Map();

                for (const resp of responses) {
                    if (resp.status === 'fulfilled' && resp.value.ok) {
                        const data = await resp.value.json();
                        data.forEach(item => {
                            if (!allItems.has(item.name)) {
                                const domain = item.domains?.[0] || item.web_pages?.[0] || '';
                                let logo = null;
                                if (domain) {
                                    const hostname = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
                                    logo = `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;
                                }
                                allItems.set(item.name, {
                                    name: item.name,
                                    source: 'api',
                                    country: item.country,
                                    state: item["state-province"] || '',
                                    website: item.web_pages?.[0] || '',
                                    logo: logo,
                                });
                            }
                        });
                    }
                }

                setApiResults(Array.from(allItems.values()).slice(0, 30));
            } catch (error) {
                console.error("Failed to fetch institutions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchInstitutions, 500);
        return () => clearTimeout(timeoutId);
    }, [value]);

    // ── Combine & dedupe ──────────────────────────────────────
    const combinedResults = useMemo(() => {
        const unique = new Map();

        // Local results have priority
        filteredLocalColleges.forEach(item => unique.set(item.name, item));

        // API results fill in extras
        apiResults.forEach(item => {
            if (!unique.has(item.name)) {
                unique.set(item.name, item);
            }
        });

        return Array.from(unique.values());
    }, [filteredLocalColleges, apiResults]);

    const handleSelect = (college) => {
        onChange(college.name);
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder || "Search colleges & institutions..."}
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

            {isOpen && (combinedResults.length > 0 || isLoading || value?.trim()) && (
                <ul
                    className="absolute z-50 w-full mt-1 max-h-72 overflow-y-auto rounded-xl shadow-2xl border"
                    style={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        scrollbarWidth: 'thin',
                    }}
                >
                    {/* Custom name option — shown when typed text doesn't exactly match */}
                    {value?.trim() && !combinedResults.some(c => c.name.toLowerCase() === value.trim().toLowerCase()) && (
                        <li
                            onClick={() => handleSelect({ name: value.trim() })}
                            className="px-3 py-2.5 cursor-pointer transition-colors flex items-center gap-3"
                            style={{
                                color: isDark ? '#d1d5db' : '#374151',
                                borderBottom: `1px solid ${isDark ? '#374151' : '#f3f4f6'}`,
                                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.03)',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.03)'}
                        >
                            <div
                                className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                }}
                            >
                                <Check size={16} className="text-white" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="truncate text-sm font-semibold">Use "{value.trim()}"</span>
                                <span className="text-xs" style={{ color: isDark ? '#6ee7b7' : '#059669' }}>
                                    Custom institution name
                                </span>
                            </div>
                        </li>
                    )}
                    {combinedResults.map((college, idx) => (
                        <li
                            key={`${college.source}-${idx}`}
                            onClick={() => handleSelect(college)}
                            className="px-3 py-2.5 cursor-pointer transition-colors flex items-center gap-3 group"
                            style={{
                                color: isDark ? '#d1d5db' : '#374151',
                                borderBottom: idx === combinedResults.length - 1 ? 'none' : `1px solid ${isDark ? '#374151' : '#f3f4f6'}`
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            {/* College Logo / Fallback Icon */}
                            <div
                                className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden"
                                style={{
                                    backgroundColor: isDark ? '#374151' : '#f3f4f6',
                                    border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                                }}
                            >
                                {college.logo ? (
                                    <img
                                        src={college.logo}
                                        alt=""
                                        className="w-6 h-6 object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="items-center justify-center"
                                    style={{ display: college.logo ? 'none' : 'flex' }}
                                >
                                    <Building2 size={16} style={{ color: isDark ? '#6b7280' : '#9ca3af' }} />
                                </div>
                            </div>

                            {/* Name + badge */}
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="truncate text-sm font-medium">{college.name}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {college.state && (
                                        <span className="text-xs truncate" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                                            {college.state}
                                        </span>
                                    )}
                                    {college.source === 'api' && (
                                        <span
                                            className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"
                                            style={{
                                                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                                                color: isDark ? '#93c5fd' : '#3b82f6',
                                            }}
                                        >
                                            <Globe size={9} />
                                            {college.country || 'Global'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {value === college.name && <Check size={16} className="text-emerald-500 flex-shrink-0 ml-1" />}
                        </li>
                    ))}

                    {isLoading && (
                        <li className="px-4 py-3 text-center text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 size={14} className="animate-spin" />
                                Searching institutions...
                            </div>
                        </li>
                    )}

                    {!isLoading && combinedResults.length === 0 && value && (
                        <li className="px-4 py-3 text-sm text-center" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                            No matches found — you can type a custom name
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default CollegeSelect;
