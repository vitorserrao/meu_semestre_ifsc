import React from "react";
import { 
  BookOpen, Award, Clock, Calendar, ShieldAlert, AlertTriangle, 
  UserCheck, MapPin, HelpCircle, LayoutGrid, Hourglass
} from "lucide-react";
import { Class, Subject, Conflict, ScheduleStatistics } from "../types";
import { timeToMinutes } from "../utils/scheduleSolver";

interface SidebarStatsProps {
  selectedClasses: Class[];
  subjects: Subject[];
  conflicts: Conflict[];
  stats: ScheduleStatistics;
}

const DAY_NAMES = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function SidebarStats({ selectedClasses, subjects, conflicts, stats }: SidebarStatsProps) {
  return (
    <div className="space-y-6">
      {/* Quick Summary Card */}
      <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl shadow-sm relative overflow-hidden select-none">
        {/* Background graphic elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-600/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-1.5">
            <LayoutGrid className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Minha Grade</span>
          </div>
          <h3 className="font-display font-extrabold text-2xl text-white">
            {stats.subjectCount} <span className="text-slate-400 text-lg font-normal">Disciplinas</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {stats.totalCredits} Créditos Acadêmicos • {stats.weeklyHours.toFixed(1)} horas semanais
          </p>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Dias Ocupados</span>
              <span className="text-sm font-semibold text-emerald-400">{stats.daysOccupied} dias</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Tempo Ocioso</span>
              <span className="text-sm font-semibold text-amber-400">{stats.idleTimeHours.toFixed(1)}h (Janelas)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings & Conflicts Section */}
      {conflicts.length > 0 ? (
        <div className="bg-red-50 border border-red-200 p-4.5 rounded-xl animate-bounce-subtle" id="conflicts-alert-box">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-bold text-sm text-red-800">
                {conflicts.length === 1 ? "1 Conflito Detectado" : `${conflicts.length} Conflitos Detectados`}
              </h4>
              <p className="text-xs text-red-600 mt-1 mb-3">
                Existem choques de horários entre disciplinas na sua grade.
              </p>

              <div className="space-y-3.5">
                {conflicts.map((conflict) => (
                  <div 
                    key={conflict.id}
                    className="p-3 bg-white border border-red-200/60 rounded-lg shadow-xs"
                    id={`conflict-card-${conflict.id}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Choque de Horário</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                      {conflict.subject1} <span className="font-mono text-[10px] text-slate-400">({conflict.classCode1})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium my-0.5">com</div>
                    <div className="text-xs font-semibold text-slate-800">
                      {conflict.subject2} <span className="font-mono text-[10px] text-slate-400">({conflict.classCode2})</span>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>{DAY_NAMES[conflict.dayOfWeek]}-feira</span>
                      <span className="font-mono">{conflict.timeSlot}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : selectedClasses.length > 0 ? (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-800 flex items-center gap-3 select-none">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
          <p className="text-xs font-medium">
            Tudo limpo! Nenhum conflito de horário na sua grade semanal.
          </p>
        </div>
      ) : null}

      {/* Detailed Grid Statistics (Notion style list) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h4 className="font-display font-bold text-sm text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span>Estatísticas Detalhadas</span>
        </h4>

        <div className="space-y-4 text-xs">
          {/* Credits */}
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-400 flex items-center gap-2 font-medium">
              <Award className="w-4 h-4 text-slate-400 shrink-0" />
              Total de Créditos
            </span>
            <span className="font-semibold text-slate-800 font-mono">
              {stats.totalCredits} cr
            </span>
          </div>

          {/* First Class */}
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-400 flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              Primeira Aula
            </span>
            <span className="font-semibold text-slate-800 truncate max-w-[150px]">
              {stats.firstClassTime || "—"}
            </span>
          </div>

          {/* Last Class */}
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-400 flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              Última Aula
            </span>
            <span className="font-semibold text-slate-800 truncate max-w-[150px]">
              {stats.lastClassTime || "—"}
            </span>
          </div>

          {/* Unique Professors */}
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-400 flex items-center gap-2 font-medium">
              <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
              Professores Únicos
            </span>
            <span className="font-semibold text-slate-800">
              {stats.professorCount}
            </span>
          </div>

          {/* Unique Rooms */}
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-400 flex items-center gap-2 font-medium">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              Salas Utilizadas
            </span>
            <span className="font-semibold text-slate-800">
              {stats.roomCount}
            </span>
          </div>

          {/* Free academic hours */}
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-400 flex items-center gap-2 font-medium">
              <Hourglass className="w-4 h-4 text-slate-400 shrink-0" />
              Horas Livres
            </span>
            <span className="font-semibold text-slate-800 font-mono">
              {stats.freeHours.toFixed(1)}h /semana
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
