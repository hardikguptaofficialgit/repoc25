import React, { useState, useEffect, useRef } from 'react';
import { searchLocations } from '../../utils/graphBuilder';
import {
    Search,
    X,
    Building2,
    MoveVertical,
    ArrowUpFromLine,
    Droplet,
    DoorOpen
} from 'lucide-react';
import './SearchBar.css';

const SearchBar = ({ value, onChange, onSelect, placeholder = "Search location...", variant = "default" }) => {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);

    useEffect(() => {
        if (query.length > 0) {
            const results = searchLocations(query);
            setSuggestions(results);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [query]);

    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                inputRef.current &&
                !inputRef.current.contains(event.target) &&
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setQuery(newValue);
        onChange(newValue);
        setSelectedIndex(-1);
    };

    const handleSelectSuggestion = (location) => {
        setQuery(location.label);
        setShowSuggestions(false);
        onSelect(location);
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) =>
                prev < suggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleSelectSuggestion(suggestions[selectedIndex]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'classroom':
                return <Building2 size={20} />;
            case 'lift':
                return <MoveVertical size={20} />;
            case 'stairs':
                return <ArrowUpFromLine size={20} />;
            case 'washroom_gents':
            case 'washroom_ladies':
                return <Droplet size={20} />;
            case 'entrance':
                return <DoorOpen size={20} />;
            default:
                return <Building2 size={20} />;
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'classroom':
                return 'Classroom';
            case 'lift':
                return 'Lift';
            case 'stairs':
                return 'Stairs';
            case 'washroom_gents':
                return 'Gents Washroom';
            case 'washroom_ladies':
                return 'Ladies Washroom';
            case 'entrance':
                return 'Entrance';
            default:
                return 'Location';
        }
    };

    return (
        <div className={`search-bar-container ${variant}`}>
            <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    ref={inputRef}
                    type="text"
                    className="search-input"
                    placeholder={placeholder}
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query && setShowSuggestions(true)}
                    autoComplete="off"
                    spellCheck="false"
                />
                {query && (
                    <button
                        className="clear-button"
                        onClick={() => {
                            setQuery('');
                            onChange('');
                            setShowSuggestions(false);
                            inputRef.current?.focus();
                        }}
                        aria-label="Clear search"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {showSuggestions && (
                <div ref={suggestionsRef} className="suggestions-dropdown">
                    {suggestions.length > 0 ? (
                        suggestions.map((location, index) => (
                            <div
                                key={location.id}
                                className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                                onClick={() => handleSelectSuggestion(location)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                role="option"
                                aria-selected={index === selectedIndex}
                            >
                                <span className="suggestion-icon">{getTypeIcon(location.type)}</span>
                                <div className="suggestion-content">
                                    <div className="suggestion-label">{location.label}</div>
                                    <div className="suggestion-type">{getTypeLabel(location.type)}</div>
                                </div>
                            </div>
                        ))
                    ) : query.length > 0 ? (
                        <div className="no-results">
                            <Search size={24} className="no-results-icon" />
                            <p className="no-results-text">No locations found</p>
                            <p className="no-results-hint">Try searching for classrooms, lifts, or washrooms</p>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
