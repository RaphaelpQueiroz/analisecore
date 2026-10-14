"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export default function MultiSelect({ options = [], value = "", name, onChange, placeholder, disabled, alignRight = false, requireSearch = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const isExcludeMode = value && value.startsWith('!');
  const parsedValues = value ? value.split(',').filter(v => v !== '!').map(v => v.replace(/^!/, '')) : [];
  
  const isSelected = (opt) => isExcludeMode ? !parsedValues.includes(opt) : parsedValues.includes(opt);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (opt) => {
    let newParsed = [...parsedValues];
    if (isExcludeMode) {
      if (parsedValues.includes(opt)) {
        newParsed = newParsed.filter(v => v !== opt);
      } else {
        newParsed.push(opt);
      }
      onChange({ target: { name, value: newParsed.length > 0 ? '!' + newParsed.join(',!') : '!' } });
    } else {
      if (parsedValues.includes(opt)) {
        newParsed = newParsed.filter(v => v !== opt);
      } else {
        newParsed.push(opt);
      }
      onChange({ target: { name, value: newParsed.join(',') } });
    }
  };

  const filteredOptions = (options || []).filter(o => {
    if (o == null) return false;
    return String(o).toLowerCase().includes(search.toLowerCase());
  });
  
  const displayOptions = (requireSearch && search.trim().length < 3) ? [] : filteredOptions.slice(0, 100);
  
  let displayText = placeholder;
  if (isExcludeMode) {
    if (parsedValues.length === 0) displayText = "(Todos)";
    else if (parsedValues.length === 1) displayText = `Exceto ${parsedValues[0]}`;
    else displayText = `Exceto ${parsedValues.length}`;
  } else {
    if (parsedValues.length === 1) displayText = parsedValues[0];
    else if (parsedValues.length > 1) displayText = `${parsedValues.length} selecionados`;
  }

  return (
    <div ref={containerRef} className={`multi-select-container ${disabled ? 'disabled' : ''}`}>
      <div className={`multi-select-trigger ${(parsedValues.length > 0 || isExcludeMode) ? 'active-filter' : ''}`} onClick={() => !disabled && setIsOpen(!isOpen)}>
        <span className="multi-select-value" title={displayText}>{displayText}</span>
        <ChevronDown size={14} className="multi-select-icon" />
      </div>
      
      {isOpen && (
        <div className="multi-select-dropdown" style={alignRight ? { right: 0, left: 'auto', width: '350px' } : {}}>
          <div className="multi-select-search-box" style={{ position: 'relative' }}>
            <Search size={14} className="search-icon" />
            <input 
              type="text" 
              className="multi-select-search-input" 
              placeholder="Pesquisar..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              autoFocus
              style={{ paddingRight: search ? '30px' : '10px' }}
            />
            {search && (
              <X 
                size={14} 
                className="clear-search-icon" 
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#888' }}
              />
            )}
          </div>
          
          {(options.length > 0) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '12px', backgroundColor: '#f8fafc' }}>
              <span 
                style={{ cursor: 'pointer', fontWeight: 500, color: '#2563eb' }} 
                onClick={() => {
                  onChange({ target: { name, value: '!' } });
                }}
              >
                Selecionar todos
              </span>
              <span 
                style={{ cursor: 'pointer', fontWeight: 500, color: '#ef4444' }} 
                onClick={() => {
                  onChange({ target: { name, value: '' } });
                }}
              >
                Limpar
              </span>
            </div>
          )}

          <div className="multi-select-options">
            {requireSearch && search.trim().length < 3 ? (
              <div className="no-results" style={{textAlign: 'center', padding: '16px', color: '#888', fontSize: '12px'}}>
                Digite ao menos 3 caracteres para pesquisar o cliente.
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="no-results">Nenhum encontrado</div>
            ) : null}
            {displayOptions.map(opt => {
              const isSelectedState = isSelected(opt);
              return (
                <div 
                  key={opt} 
                  className={`multi-select-option ${isSelectedState ? 'selected' : ''}`}
                  onClick={() => toggleOption(opt)}
                >
                  <div className={`checkbox ${isSelectedState ? 'checked' : ''}`}>
                    {isSelectedState && <Check size={12} />}
                  </div>
                  <span title={opt}>{opt}</span>
                </div>
              );
            })}
            {(!requireSearch || search.trim().length >= 3) ? (
              filteredOptions.length > 100 && (
                <div className="multi-select-limit-msg" style={{fontSize: '11px', color: '#888', padding: '8px', textAlign: 'center'}}>
                  Mostrando 100 de {filteredOptions.length} resultados. Use a pesquisa.
                </div>
              )
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
