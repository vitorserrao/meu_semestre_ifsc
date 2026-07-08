import React from "react";
import { X, Check, AlertTriangle, Users, MapPin, Clock, Award } from "lucide-react";
import { Class, Subject } from "../types";
import { doClassesOverlap } from "../utils/scheduleSolver";

interface ClassComparatorProps {
  subject: Subject;
  selectedClasses: Class[];
  allSelectedSubjects: Subject[];
  onSelectClass: (subjectId: string, classId: string) => void;
  onClose: () => void;
}

const DAY_NAMES = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function ClassComparator({ 
  subject, 
  selectedClasses, 
  allSelectedSubjects, 
  onSelectClass, 
  onClose 
}: ClassComparatorProps) {
  
  const currentSelectedClass = selectedClasses.find(c => c.subjectId === subject.id);

  // Helper to see if a class conflicts with ANY of the other selected subjects (excluding current subject)
  const getClassConflictDetails = (cls: Class) => {
    const otherSelectedClasses = selectedClasses.filter(c => c.subjectId !== subject.id);
    
    for (const otherCls of otherSelectedClasses) {
      if (doClassesOverlap(cls, otherCls)) {
        const otherSubj = allSelectedSubjects.find(s => s.id === otherCls.subjectId);
        return {
          hasConflict: true,
          conflictingWith: otherSubj?.name || "Outra disciplina",
          conflictingCode: otherCls.code
        };
      }
    }
    return { hasConflict: false };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200"
        id="class-comparator-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                {subject.code}
              </span>
              <span className="text-xs text-slate-400">
                {subject.course}
              </span>
            </div>
            <h3 className="font-display font-extrabold text-lg text-slate-800">
              Comparador de Turmas: {subject.name}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            id="close-comparator-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Side-by-Side Comparison Container */}
        <div className="flex-1 overflow-x-auto p-6 bg-slate-50/50">
          <div className="flex gap-4 min-w-max pb-4">
            {subject.classes.map((cls) => {
              const isActive = currentSelectedClass?.id === cls.id;
              const conflict = getClassConflictDetails(cls);

              return (
                <div 
                  key={cls.id}
                  className={`w-80 bg-white border rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between ${
                    isActive 
                      ? "ring-2 ring-indigo-500 border-indigo-200" 
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  id={`comparator-class-${cls.id}`}
                >
                  {/* Top: Class identifier */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-sm font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
                        Turma {cls.code}
                      </span>
                      {isActive && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          <Check className="w-3.5 h-3.5" /> Ativa na Grade
                        </span>
                      )}
                    </div>

                    {/* Properties List */}
                    <div className="space-y-4 text-xs border-t border-slate-100 pt-4">
                      {/* Professor */}
                      <div>
                        <span className="text-slate-400 block uppercase tracking-wider text-[10px] mb-1">Professor</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          {cls.professor}
                        </span>
                      </div>

                      {/* Sala */}
                      <div>
                        <span className="text-slate-400 block uppercase tracking-wider text-[10px] mb-1">Sala</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {cls.room}
                        </span>
                      </div>

                      {/* Horários */}
                      <div>
                        <span className="text-slate-400 block uppercase tracking-wider text-[10px] mb-1">Horários</span>
                        <div className="space-y-1">
                          {cls.schedules.map((sched, idx) => (
                            <span 
                              key={idx} 
                              className="font-semibold text-slate-800 flex items-center gap-2 font-mono"
                            >
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {DAY_NAMES[sched.dayOfWeek]}: {sched.startTime} - {sched.endTime}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Vagas */}
                      <div>
                        <span className="text-slate-400 block uppercase tracking-wider text-[10px] mb-1">Vagas Disponíveis</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {cls.vacancies} vagas
                        </span>
                      </div>

                      {/* Créditos */}
                      <div>
                        <span className="text-slate-400 block uppercase tracking-wider text-[10px] mb-1">Carga Horária / Créditos</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-2">
                          <Award className="w-3.5 h-3.5 text-slate-400" />
                          {subject.credits} créditos acadêmicos
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Area: Conflict Warning & Action Button */}
                  <div className="mt-6 pt-4 border-t border-slate-100 space-y-3.5">
                    {/* Conflict notification inside card */}
                    {conflict.hasConflict ? (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-800">
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>Conflito Identificado</span>
                        </div>
                        <p className="text-[11px] leading-tight text-red-600">
                          Se selecionada, conflitará com <strong>{conflict.conflictingWith}</strong> ({conflict.conflictingCode}).
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-50 rounded-lg text-[11px] font-medium text-emerald-800 text-center select-none">
                        Sem conflitos com outras disciplinas.
                      </div>
                    )}

                    {/* Switch Class Action */}
                    <button
                      onClick={() => onSelectClass(subject.id, cls.id)}
                      disabled={isActive}
                      className={`w-full py-2 px-4 rounded-lg text-xs font-bold transition-all select-none cursor-pointer ${
                        isActive 
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                          : conflict.hasConflict
                            ? "bg-red-600 hover:bg-red-700 text-white shadow-xs"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                      }`}
                      id={`select-class-btn-${cls.id}`}
                    >
                      {isActive ? "Já está Ativa" : "Trocar para esta Turma"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            Fechar Comparador
          </button>
        </div>
      </div>
    </div>
  );
}
