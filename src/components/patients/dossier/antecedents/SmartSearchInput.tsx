/**
 * SmartSearchInput - Medical terminology search with abbreviation support
 * Like Doctolib: supports HTA, DID, K PO, etc.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Shield, FileText, Loader2, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSearchMedicalTerminology, type MedicalTerminology } from '@/hooks/data/useMedicalHistory';

interface SmartSearchInputProps {
  placeholder?: string;
  category?: 'condition' | 'procedure' | 'allergen';
  onSelect: (term: MedicalTerminology | null, freeText?: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

// Debounce hook
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const SmartSearchInput: React.FC<SmartSearchInputProps> = ({
  placeholder = 'Rechercher (HTA, diabète, K poumon...)',
  category,
  onSelect,
  disabled = false,
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounceValue(query, 300);
  const { data: results = [], isLoading } = useSearchMedicalTerminology(
    debouncedQuery,
    { category, enabled: debouncedQuery.length >= 2 }
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length)); // +1 for free text option
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex < results.length) {
          handleSelectTerm(results[selectedIndex]);
        } else if (query.trim()) {
          handleAddFreeText();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  }, [isOpen, results, selectedIndex, query]);

  const handleSelectTerm = (term: MedicalTerminology) => {
    onSelect(term);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(0);
  };

  const handleAddFreeText = () => {
    if (query.trim()) {
      onSelect(null, query.trim());
      setQuery('');
      setIsOpen(false);
      setSelectedIndex(0);
    }
  };

  // Show dropdown when typing
  useEffect(() => {
    if (query.length >= 2) {
      setIsOpen(true);
      setSelectedIndex(0);
    } else {
      setIsOpen(false);
    }
  }, [query]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node) &&
          listRef.current && !listRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <strong key={i} className="text-primary font-semibold">{part}</strong>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {query && !isLoading && (
          <button
            type="button"
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && (results.length > 0 || query.length >= 2) && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-[300px] overflow-auto"
        >
          {results.map((term, index) => (
            <button
              key={`${term.system}-${term.code}`}
              type="button"
              className={cn(
                'w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors flex items-start gap-3 border-b border-border last:border-b-0',
                selectedIndex === index && 'bg-muted'
              )}
              onClick={() => handleSelectTerm(term)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">
                  {highlightMatch(term.display, query)}
                </div>
                <div className="text-xs text-primary mt-0.5">
                  {term.system} - {term.code}
                </div>
              </div>
              <Shield className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            </button>
          ))}

          {/* Free text option */}
          {query.trim() && (
            <button
              type="button"
              className={cn(
                'w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors flex items-center gap-2 bg-muted/30',
                selectedIndex === results.length && 'bg-muted'
              )}
              onClick={handleAddFreeText}
              onMouseEnter={() => setSelectedIndex(results.length)}
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Ajouter "<span className="text-foreground font-medium">{query}</span>" en texte libre
              </span>
              <FileText className="h-4 w-4 text-orange-400 ml-auto" />
            </button>
          )}

          {results.length === 0 && query.length >= 2 && !isLoading && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              <p>Aucun résultat pour "{query}"</p>
              <p className="text-xs mt-1">Appuyez sur Entrée pour ajouter en texte libre</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearchInput;
