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
            className="bg-white border border-slate-200 border-l-[5px] rounded-xl p-4.5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={{ borderLeftColor: subject.color }}
            id={`subject-card-${subject.id}`}
          >
            {/* Subject Info Column */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: subject.color }}
                />
                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {subject.code}
                </span>
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Turma {cls.code}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {subject.credits} Créditos
                </span>
              </div>
              
              <h4 className="font-display font-bold text-base text-slate-800 leading-tight">
                {subject.name}
              </h4>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {subject.course} • Semestre {subject.semester}
              </p>

              {/* Class specific details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mt-3.5 pt-3.5 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 min-w-0">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate" title={cls.professor}>{cls.professor}</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate" title={cls.room}>{cls.room}</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0 col-span-2 md:col-span-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {cls.schedules.map(s => `${DAY_NAMES[s.dayOfWeek]} (${s.startTime})`).join(", ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons Column */}
            <div className="flex md:flex-col lg:flex-row items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 shrink-0">
              {/* Comparator Button */}
              <button
                onClick={() => onOpenComparator(subject)}
                className="flex-1 md:w-full lg:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-colors cursor-pointer"
                id={`btn-compare-${subject.id}`}
                title="Comparar com outras turmas desta disciplina"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Trocar Turma</span>
              </button>

              {/* Remove Button */}
              <button
                onClick={() => onRemoveSubject(subject.id)}
                className="flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-100 rounded-lg transition-colors cursor-pointer"
                id={`btn-remove-${subject.id}`}
                title="Remover disciplina da grade"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
