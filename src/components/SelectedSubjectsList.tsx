import React from "react";
import { Trash2, Shuffle, Info, BookOpen, User, MapPin, Calendar, Clock } from "lucide-react";
import { Class, Subject } from "../types";

interface SelectedSubjectsListProps {
  selectedClasses: Class[];
  subjects: Subject[];
  onRemoveSubject: (subjectId: string) => void;
  onOpenComparator: (subject: Subject) => void;
}

const DAY_NAMES = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function SelectedSubjectsList({ 
  selectedClasses, 
  subjects, 
  onRemoveSubject, 
  onOpenComparator 
}: SelectedSubjectsListProps) {
  
  if (selectedClasses.length === 0) {
    return (
      <div className="bg-white border border-slate-200 border-dashed p-10 rounded-xl text-center select-none" id="empty-subjects-list">
        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h4 className="font-display font-bold text-slate-700 mb-1">Nenhuma disciplina na grade</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Use a barra de pesquisa acima para encontrar disciplinas e adicionar turmas para montar sua grade semanal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" id="selected-subjects-list">
      {selectedClasses.map((cls) => {
        const subject = subjects.find(s => s.id === cls.subjectId);
        if (!subject) return null;

        return (
            <div 
              key={subject.id}
              className="bg-white border border-slate-200 border-l-[5px] rounded-lg p-3 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between gap-4"
              style={{ borderLeftColor: subject.color }}
              id={`subject-card-${subject.id}`}
            >
              {/* Subject Info Column */}
              <div className="flex items-center gap-4 min-w-0">
                <span 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: subject.color }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {subject.code}
                    </span>
                    <h4 className="font-display font-bold text-sm text-slate-800 truncate">
                      {subject.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="font-mono font-bold text-indigo-600">Turma {cls.code}</span>
                    <span>{cls.professor}</span>
                    <span>{cls.room}</span>
                    <span>{cls.schedules.map(s => `${DAY_NAMES[s.dayOfWeek]} (${s.startTime})`).join(", ")}</span>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons Column */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onOpenComparator(subject)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-md transition-colors cursor-pointer"
                  id={`btn-compare-${subject.id}`}
                  title="Comparar com outras turmas"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Trocar</span>
                </button>

                <button
                  onClick={() => onRemoveSubject(subject.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-100 rounded-md transition-colors cursor-pointer"
                  id={`btn-remove-${subject.id}`}
                  title="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
        );
      })}
    </div>
  );
}
