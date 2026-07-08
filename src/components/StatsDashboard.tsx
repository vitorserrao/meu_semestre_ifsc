import React from "react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, PieChart, Pie, Cell, CartesianGrid, AreaChart, Area 
} from "recharts";
import { Class, Subject } from "../types";
import { BarChart3, PieChart as PieIcon, TrendingUp, Info } from "lucide-react";

interface StatsDashboardProps {
  selectedClasses: Class[];
  subjects: Subject[];
}

const DAY_LABELS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1", "#ef4444"];

export default function StatsDashboard({ selectedClasses, subjects }: StatsDashboardProps) {
  
  if (selectedClasses.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center select-none" id="stats-empty">
        <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h4 className="font-display font-bold text-slate-700 mb-1">Estatísticas Indisponíveis</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          Adicione disciplinas à sua grade horária para gerar gráficos modernos com dados de carga horária, professores e distribuição de aulas.
        </p>
      </div>
    );
  }

  // 1. Distribution by Day
  const dayDistributionData = DAY_LABELS.map((dayLabel, index) => {
    const dayOfWeek = index + 1;
    let totalMinutes = 0;
    let classCount = 0;

    selectedClasses.forEach(cls => {
      cls.schedules.forEach(sched => {
        if (sched.dayOfWeek === dayOfWeek) {
          classCount++;
          const start = sched.startTime.split(":").map(Number);
          const end = sched.endTime.split(":").map(Number);
          const diffMin = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
          totalMinutes += diffMin;
        }
      });
    });

    return {
      name: dayLabel,
      "Horas de Aula": Number((totalMinutes / 60).toFixed(2)),
      "Aulas": classCount
    };
  });

  // 2. Hours by Subject
  const hoursBySubjectData = selectedClasses.map(cls => {
    const subject = subjects.find(s => s.id === cls.subjectId);
    let totalMinutes = 0;
    cls.schedules.forEach(sched => {
      const start = sched.startTime.split(":").map(Number);
      const end = sched.endTime.split(":").map(Number);
      totalMinutes += (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
    });

    return {
      name: subject?.code || cls.code,
      fullName: subject?.name || "",
      "Horas": Number((totalMinutes / 60).toFixed(2)),
      color: subject?.color || "#cbd5e1"
    };
  });

  // 3. Classes by Professor
  const profMap: Record<string, number> = {};
  selectedClasses.forEach(cls => {
    const name = cls.professor;
    profMap[name] = (profMap[name] || 0) + cls.schedules.length;
  });

  const profData = Object.entries(profMap).map(([name, count]) => ({
    name: name.split(" ").slice(0, 2).join(" "), // Shorten name
    "Aulas Ministradas": count
  })).sort((a, b) => b["Aulas Ministradas"] - a["Aulas Ministradas"]);

  return (
    <div className="space-y-6" id="stats-dashboard">
      
      {/* Dynamic Summary Stats Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Densidade Diária</span>
            <span className="text-base font-black text-slate-800">
              {(hoursBySubjectData.reduce((acc, curr) => acc + curr["Horas"], 0) / dayDistributionData.filter(d => d.Aulas > 0).length || 0).toFixed(1)}h / dia ativo
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Média por Disciplina</span>
            <span className="text-base font-black text-slate-800">
              {(hoursBySubjectData.reduce((acc, curr) => acc + curr["Horas"], 0) / selectedClasses.length || 0).toFixed(1)} horas
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-bold">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Compromisso Semanal</span>
            <span className="text-base font-black text-slate-800">
              {hoursBySubjectData.reduce((acc, curr) => acc + curr["Horas"], 0).toFixed(1)} Horas Total
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Distribution by Day */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col h-80">
          <h4 className="font-display font-bold text-sm text-slate-800 mb-4 flex items-center gap-1.5 shrink-0 select-none">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <span>Distribuição de Carga Horária por Dia</span>
          </h4>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dayDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "#f8fafc", fontSize: "11px" }}
                  labelStyle={{ fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="Horas de Aula" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Hours by Subject (Pie) */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col h-80">
          <h4 className="font-display font-bold text-sm text-slate-800 mb-4 flex items-center gap-1.5 shrink-0 select-none">
            <PieIcon className="w-4 h-4 text-indigo-500" />
            <span>Carga Horária Semanal por Disciplina</span>
          </h4>
          <div className="flex-1 w-full min-h-0 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hoursBySubjectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="Horas"
                  >
                    {hoursBySubjectData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "#f8fafc", fontSize: "11px" }}
                    formatter={(value) => [`${value} horas`, "Duração"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Pie Legend list */}
            <div className="w-full md:w-1/2 overflow-y-auto max-h-52 space-y-2 pr-2">
              {hoursBySubjectData.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="font-bold text-slate-700 font-mono">{entry.name}</span>
                    <span className="text-slate-400 truncate" title={entry.fullName}>{entry.fullName}</span>
                  </div>
                  <span className="font-semibold text-slate-600 shrink-0 ml-1">{entry["Horas"]}h</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Classes by Professor */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col h-80 lg:col-span-2">
          <h4 className="font-display font-bold text-sm text-slate-800 mb-4 flex items-center gap-1.5 shrink-0 select-none">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <span>Quantidade de Aulas Semanais por Professor</span>
          </h4>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "#f8fafc", fontSize: "11px" }}
                />
                <Bar dataKey="Aulas Ministradas" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={36}>
                  {profData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
