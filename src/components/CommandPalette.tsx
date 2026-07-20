import React, { useState, useEffect, useRef } from "react";
import { Search, Sliders, Sparkles, BookOpen, Clock, Layers } from "lucide-react";
import { Subject } from "../types";

interface CommandPaletteProps {
  onSelectSubject: (subject: Subject) => void;
  selectedSubjectIds: string[];
  calendarSemester: string;
}

export default function CommandPalette({ onSelectSubject, selectedSubjectIds, calendarSemester }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Subject[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ctrl+K keyboard shortcut to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch results as query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/subjects?q=${encodeURIComponent(query)}&calendarSemester=${calendarSemester}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Erro ao buscar disciplinas:", error);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(debounceTimer);
  }, [query, calendarSemester]);

  return (
    <div className="relative w-full" ref={paletteRef}>
      {/* VSCode/Linear search triggers */}
      <div 
        className="flex items-center w-full h-11 px-5 bg-slate-100 hover:bg-slate-200/60 rounded-full cursor-text transition-all duration-200"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        id="vscode-search-trigger"
      >
        <Search className="w-4 h-4 mr-3 text-slate-400 shrink-0" />
        <span className="text-sm text-slate-400 flex-1 truncate">
          {query ? query : "Pesquisar disciplinas ou turmas (ex: Cálculo, Algoritmos)..."}
        </span>

      </div>

      {isOpen && (
        <div 
          className="absolute left-0 right-0 top-12 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          id="vscode-command-palette"
        >
          {/* Active Search Input inside Palette */}
          <div className="flex items-center border-b border-slate-100 px-4 py-3">
            <Search className="w-5 h-5 mr-3 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o nome, código ou curso..."
              className="w-full text-slate-800 text-sm focus:outline-hidden"
              id="vscode-search-input"
            />
            {query && (
              <button 
                onClick={() => setQuery("")}
                className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded bg-slate-100"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Quick Help Header */}
          <div className="bg-slate-50 px-4 py-1.5 border-b border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-medium">
            <span>Sugestões Inteligentes ({results.length})</span>
            <span>ESC para fechar</span>
          </div>

          {/* Results list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="flex items-center justify-center p-6 text-sm text-slate-400 gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <span>Buscando na base de dados...</span>
              </div>
            ) : query.trim() === "" ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <p className="font-medium mb-1">Comece a digitar para pesquisar</p>
                <p className="text-[11px] text-slate-300">Exemplos: "calcu", "dados", "civil", "CIV201"</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <p className="font-medium">Nenhuma disciplina encontrada</p>
                <p className="text-[11px] text-slate-300">Tente buscar por termos mais genéricos ou certifique-se de que a disciplina pertence aos cursos de Sistemas de Energia ou Eletrotécnica.</p>
              </div>
            ) : (
              results.map((subject) => {
                const isAlreadySelected = selectedSubjectIds.includes(subject.id);
                return (
                  <button
                    key={subject.id}
                    onClick={() => {
                      onSelectSubject(subject);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-slate-50 focus:bg-slate-50 transition-colors"
                    id={`search-item-${subject.code}`}
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" 
                      style={{ backgroundColor: subject.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {subject.code}
                        </span>
                        <h4 className="font-medium text-sm text-slate-800 truncate">
                          {subject.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {subject.course}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {subject.semester}º Semestre
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {subject.credits} Créditos
                      </span>
                    </div>
                    {isAlreadySelected && (
                      <span className="ml-2 shrink-0 self-center text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                        Adicionada
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
