import React, { useState } from "react";
import { Download, Calendar, FileText, Image, Check, AlertCircle } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Class, Subject } from "../types";

interface ExportPanelProps {
  selectedClasses: Class[];
  subjects: Subject[];
}

export default function ExportPanel({ selectedClasses, subjects }: ExportPanelProps) {
  const [exportingICS, setExportingICS] = useState(false);
  const [showPrintMessage, setShowPrintMessage] = useState(false);

  const handleExportICS = () => {
    if (selectedClasses.length === 0) return;
    setExportingICS(true);

    setTimeout(() => {
      // Generate real .ics calendar stream
      let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Meu Semestre IFSC//NONSGML v1.0//PT\nCALSCALE:GREGORIAN\n";
      
      // Base date (e.g. Monday Jul 6 2026 to Saturday Jul 11 2026)
      const baseDates: Record<number, string> = {
        1: "20260706",
        2: "20260707",
        3: "20260708",
        4: "20260709",
        5: "20260710",
        6: "20260711",
      };

      selectedClasses.forEach(cls => {
        const subj = subjects.find(s => s.id === cls.subjectId);
        if (!subj) return;

        cls.schedules.forEach(sched => {
          const dateStr = baseDates[sched.dayOfWeek];
          if (!dateStr) return;

          const startHour = sched.startTime.replace(":", "") + "00";
          const endHour = sched.endTime.replace(":", "") + "00";

          icsContent += "BEGIN:VEVENT\n";
          icsContent += `DTSTART;TZID=America/Sao_Paulo:${dateStr}T${startHour}\n`;
          icsContent += `DTEND;TZID=America/Sao_Paulo:${dateStr}T${endHour}\n`;
          icsContent += `RRULE:FREQ=WEEKLY;BYDAY=${["", "MO", "TU", "WE", "TH", "FR", "SA"][sched.dayOfWeek]}\n`;
          icsContent += `SUMMARY:${subj.name} [${cls.code}]\n`;
          icsContent += `DESCRIPTION:Professor: ${cls.professor} | Vagas: ${cls.vacancies} | Creditos: ${subj.credits}cr\n`;
          icsContent += `LOCATION:${sched.room || cls.room}\n`;
          icsContent += "END:VEVENT\n";
        });
      });

      icsContent += "END:VCALENDAR";

      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "grade_horaria_edupage.ics";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportingICS(false);
    }, 800);
  };

  const handleExportPDF = () => {
    if (selectedClasses.length === 0) return;
    
    // Helper definitions
    const timeToMinutes = (timeStr: string): number => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    const hexToRgb = (hex: string): [number, number, number] => {
      try {
        const cleanHex = hex.replace("#", "");
        if (cleanHex.length === 3) {
          const r = parseInt(cleanHex[0] + cleanHex[0], 16);
          const g = parseInt(cleanHex[1] + cleanHex[1], 16);
          const b = parseInt(cleanHex[2] + cleanHex[2], 16);
          return [r, g, b];
        }
        const num = parseInt(cleanHex, 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return [isNaN(r) ? 79 : r, isNaN(g) ? 70 : g, isNaN(b) ? 229 : b];
      } catch {
        return [79, 70, 229]; // default indigo
      }
    };

    const rgbToPastel = (r: number, g: number, b: number): [number, number, number] => {
      const pr = Math.round(r * 0.12 + 255 * 0.88);
      const pg = Math.round(g * 0.12 + 255 * 0.88);
      const pb = Math.round(b * 0.12 + 255 * 0.88);
      return [pr, pg, pb];
    };

    const analyzeSchedules = (classes: Class[]) => {
      const daySchedules: Record<number, { start: number; end: number }[]> = {};
      
      classes.forEach(cls => {
        cls.schedules.forEach(sched => {
          const day = sched.dayOfWeek;
          const start = timeToMinutes(sched.startTime);
          const end = timeToMinutes(sched.endTime);
          if (!daySchedules[day]) {
            daySchedules[day] = [];
          }
          daySchedules[day].push({ start, end });
        });
      });

      const daysOccupied = Object.keys(daySchedules).map(Number);
      let idleTimeMinutes = 0;
      let janelasCount = 0;

      Object.values(daySchedules).forEach(slots => {
        slots.sort((a, b) => a.start - b.start);
        for (let i = 0; i < slots.length - 1; i++) {
          const currentEnd = slots[i].end;
          const nextStart = slots[i+1].start;
          if (nextStart > currentEnd) {
            janelasCount++;
            idleTimeMinutes += (nextStart - currentEnd);
          }
        }
      });

      return {
        daysOccupied,
        idleTimeMinutes,
        janelasCount
      };
    };

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // ----------------------------------------------------
    // PAGE 1: HEADER, STATS AND VISUAL GRID
    // ----------------------------------------------------

    // Title & Header Banner
    doc.setFillColor(79, 70, 229); // Indigo-600
    doc.rect(0, 0, 210, 32, "F");

    // Header Text
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("GRADE HORÁRIA ACADÊMICA", 15, 14);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(224, 231, 255); // Indigo-100
    doc.text("Meu Semestre IFSC • Semestre Letivo", 15, 20);
    
    const formattedDate = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    doc.text(`Gerado em: ${formattedDate}`, 15, 26);

    // Calculate metrics
    let totalCredits = 0;
    selectedClasses.forEach(cls => {
      const sub = subjects.find(s => s.id === cls.subjectId);
      if (sub) {
        totalCredits += sub.credits;
      }
    });

    const { daysOccupied, idleTimeMinutes, janelasCount } = analyzeSchedules(selectedClasses);

    // Conflict detection
    let conflictsCount = 0;
    for (let i = 0; i < selectedClasses.length; i++) {
      for (let j = i + 1; j < selectedClasses.length; j++) {
        const c1 = selectedClasses[i];
        const c2 = selectedClasses[j];
        const overlap = c1.schedules.some(s1 => 
          c2.schedules.some(s2 => {
            if (s1.dayOfWeek !== s2.dayOfWeek) return false;
            const start1 = timeToMinutes(s1.startTime);
            const end1 = timeToMinutes(s1.endTime);
            const start2 = timeToMinutes(s2.startTime);
            const end2 = timeToMinutes(s2.endTime);
            return Math.max(start1, start2) < Math.min(end1, end2);
          })
        );
        if (overlap) {
          conflictsCount++;
        }
      }
    }

    // Section Title 1: Statistics
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text("Visão Geral e Estatísticas da Grade", 15, 41);

    // Draw 3 Stats Cards
    const cardY = 46;
    const cardW = 56;
    const cardH = 20;

    // Card 1: Resumo Geral
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.rect(15, cardY, cardW, cardH, "FD");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("CARGA ACADÊMICA", 19, cardY + 6);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`${totalCredits} Créditos`, 19, cardY + 12);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${selectedClasses.length} disciplinas selecionadas`, 19, cardY + 17);

    // Card 2: Tempo Ocioso
    doc.setFillColor(248, 250, 252);
    doc.rect(77, cardY, cardW, cardH, "FD");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("TEMPO OCIOSO (JANELAS)", 81, cardY + 6);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(15, 23, 42);
    const idleStr = idleTimeMinutes === 0 ? "Nenhum" : `${Math.floor(idleTimeMinutes / 60)}h${idleTimeMinutes % 60}m`;
    doc.text(idleStr, 81, cardY + 12);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${janelasCount} intervalo(s) vago(s)`, 81, cardY + 17);

    // Card 3: Presencialidade
    doc.setFillColor(248, 250, 252);
    doc.rect(139, cardY, cardW, cardH, "FD");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("PRESENCIALIDADE", 143, cardY + 6);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(conflictsCount > 0 ? 225 : 15, conflictsCount > 0 ? 29 : 23, conflictsCount > 0 ? 72 : 42); // Rose or Slate
    doc.text(`${daysOccupied.length} dias de aula`, 143, cardY + 12);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(conflictsCount > 0 ? 225 : 100, conflictsCount > 0 ? 29 : 116, conflictsCount > 0 ? 72 : 139);
    doc.text(conflictsCount > 0 ? `Aviso: ${conflictsCount} conflitos!` : "Sem conflitos detectados", 143, cardY + 17);

    // Section Title 2: Weekly Grid Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("Grade de Horários Semanal Visual", 15, 76);

    // Visual Grid Table Parameters
    const gridYStart = 81;
    const colWidthTime = 18;
    const colWidthDay = 27;
    const rowHeight = 11;
    const headerHeight = 8;
    const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    // 1. Draw Grid Table Header Row
    doc.setFillColor(79, 70, 229); // Indigo-600
    doc.rect(15, gridYStart, 180, headerHeight, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("Horário", 15 + colWidthTime / 2, gridYStart + 5.5, { align: "center" });

    days.forEach((day, idx) => {
      const colX = 15 + colWidthTime + idx * colWidthDay;
      doc.text(day, colX + colWidthDay / 2, gridYStart + 5.5, { align: "center" });
    });

    // 2. Draw Table Rows (for 12 periods)
    const STANDARD_SLOTS = [
      { label: "M1", start: "07:30", end: "08:20" },
      { label: "M2", start: "08:20", end: "09:10" },
      { label: "M3", start: "09:20", end: "10:10" },
      { label: "M4", start: "10:10", end: "11:00" },
      { label: "T1", start: "13:30", end: "14:20" },
      { label: "T2", start: "14:20", end: "15:10" },
      { label: "T3", start: "15:20", end: "16:10" },
      { label: "T4", start: "16:10", end: "17:00" },
      { label: "N1", start: "18:30", end: "19:20" },
      { label: "N2", start: "19:20", end: "20:10" },
      { label: "N3", start: "20:20", end: "21:10" },
      { label: "N4", start: "21:10", end: "22:30" },
    ];

    const getClassesInSlot = (dayOfWeek: number, slotStartStr: string, slotEndStr: string) => {
      const slotStart = timeToMinutes(slotStartStr);
      const slotEnd = timeToMinutes(slotEndStr);
      
      return selectedClasses.filter(cls => {
        return cls.schedules.some(sched => {
          if (sched.dayOfWeek !== dayOfWeek) return false;
          const schedStart = timeToMinutes(sched.startTime);
          const schedEnd = timeToMinutes(sched.endTime);
          return Math.max(slotStart, schedStart) < Math.min(slotEnd, schedEnd);
        });
      });
    };

    let rowY = gridYStart + headerHeight;

    STANDARD_SLOTS.forEach((slot, rowIndex) => {
      // Background for Row: Alternate white / light-slate
      const isEven = rowIndex % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(15, rowY, 180, rowHeight, "F");

      // Draw horizontal separator lines
      doc.setDrawColor(226, 232, 240);
      doc.line(15, rowY, 195, rowY);

      // Col 0: Draw Time Column block
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(15, rowY, colWidthTime, rowHeight, "F");
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(slot.label, 15 + colWidthTime / 2, rowY + 4, { align: "center" });

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`${slot.start}-${slot.end}`, 15 + colWidthTime / 2, rowY + 8.2, { align: "center" });

      // Col 1 to 6: Draw Day Columns
      for (let dayIdx = 1; dayIdx <= 6; dayIdx++) {
        const colX = 15 + colWidthTime + (dayIdx - 1) * colWidthDay;
        const classesInCell = getClassesInSlot(dayIdx, slot.start, slot.end);

        if (classesInCell.length > 1) {
          // Conflict Cell Styling
          doc.setFillColor(254, 226, 226); // red-100
          doc.rect(colX, rowY, colWidthDay, rowHeight, "F");

          doc.setDrawColor(239, 68, 68); // red-500 accent left line
          doc.setFillColor(239, 68, 68);
          doc.rect(colX, rowY, 2, rowHeight, "F");

          doc.setFont("Helvetica", "bold");
          doc.setFontSize(7);
          doc.setTextColor(185, 28, 28); // red-700
          doc.text("CONFLITO", colX + colWidthDay / 2 + 1, rowY + 4.5, { align: "center" });

          doc.setFont("Helvetica", "normal");
          doc.setFontSize(5.5);
          doc.setTextColor(185, 28, 28);
          const codes = classesInCell.map(c => {
            const s = subjects.find(sub => sub.id === c.subjectId);
            return s?.code || c.code;
          }).join(" e ");
          doc.text(codes.substring(0, 16), colX + colWidthDay / 2 + 1, rowY + 8.5, { align: "center" });

        } else if (classesInCell.length === 1) {
          // Standard Active Class cell
          const cls = classesInCell[0];
          const sub = subjects.find(s => s.id === cls.subjectId);
          const subjectColorHex = sub?.color || "#4f46e5";
          const [r, g, b] = hexToRgb(subjectColorHex);
          const [pr, pg, pb] = rgbToPastel(r, g, b);

          // Fill cell with nice light pastel background
          doc.setFillColor(pr, pg, pb);
          doc.rect(colX, rowY, colWidthDay, rowHeight, "F");

          // Accent color bar on left edge
          doc.setFillColor(r, g, b);
          doc.rect(colX, rowY, 2, rowHeight, "F");

          // Text Line 1: Subject Code
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42); // slate-900
          const displayCode = sub?.code || cls.code;
          doc.text(displayCode.substring(0, 14), colX + colWidthDay / 2 + 1, rowY + 4.5, { align: "center" });

          // Text Line 2: Class Code + Location/Room
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(6);
          doc.setTextColor(71, 85, 105); // slate-600
          const roomStr = cls.schedules.find(s => s.dayOfWeek === dayIdx)?.room || cls.room || "Sala";
          doc.text(`${cls.code} • ${roomStr}`, colX + colWidthDay / 2 + 1, rowY + 8.5, { align: "center" });

        } else {
          // Empty cell border dividers for clean alignment
          doc.setDrawColor(241, 245, 249);
          doc.line(colX, rowY, colX, rowY + rowHeight);
        }
      }

      rowY += rowHeight;
    });

    // Outer table border lines to lock visual layout together
    doc.setDrawColor(226, 232, 240);
    doc.line(15, rowY, 195, rowY); // bottom row line
    
    // Draw vertical separator lines between days
    doc.setDrawColor(226, 232, 240);
    doc.line(15, gridYStart, 15, rowY); // left boundary
    doc.line(15 + colWidthTime, gridYStart, 15 + colWidthTime, rowY); // first separator
    for (let d = 1; d <= 6; d++) {
      const colBorderX = 15 + colWidthTime + d * colWidthDay;
      doc.line(colBorderX, gridYStart, colBorderX, rowY); // right day separations
    }

    // Footnote on page 1
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Página 1 • Planejamento Horário Geral e Grade Semanal", 15, 282);

    // ----------------------------------------------------
    // PAGE 2: DETAILED LIST OF CLASSES
    // ----------------------------------------------------
    doc.addPage();

    // Small Page 2 Header Banner
    doc.setFillColor(79, 70, 229); // Indigo-600
    doc.rect(0, 0, 210, 15, "F");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("Detalhamento das Disciplinas Selecionadas", 15, 9.5);

    let y = 26;

    // Table Header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(15, y, 180, 8, "F");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text("Disciplina", 18, y + 5.5);
    doc.text("Turma", 95, y + 5.5);
    doc.text("Horários", 115, y + 5.5);
    doc.text("Local/Sala", 165, y + 5.5);

    y += 8;

    // Table rows
    const daysNameMap: Record<number, string> = {
      1: "Segunda",
      2: "Terça",
      3: "Quarta",
      4: "Quinta",
      5: "Sexta",
      6: "Sábado",
      7: "Domingo"
    };

    selectedClasses.forEach((cls) => {
      const sub = subjects.find(s => s.id === cls.subjectId);
      if (!sub) return;

      // Calculate height needed for schedule lines
      const scheduleLines: string[] = [];
      cls.schedules.forEach(sched => {
        const dayStr = daysNameMap[sched.dayOfWeek] || `Dia ${sched.dayOfWeek}`;
        scheduleLines.push(`${dayStr} das ${sched.startTime} às ${sched.endTime}`);
      });

      // Height logic to prevent overflow
      const rowHeight = Math.max(12, 6 + (scheduleLines.length * 4.5));
      if (y + rowHeight > 270) {
        doc.addPage();
        y = 20;
        // Table Header again on next page
        doc.setFillColor(241, 245, 249);
        doc.rect(15, y, 180, 8, "F");
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text("Disciplina", 18, y + 5.5);
        doc.text("Turma", 95, y + 5.5);
        doc.text("Horários", 115, y + 5.5);
        doc.text("Local/Sala", 165, y + 5.5);
        y += 8;
      }

      // Draw thin bottom divider
      doc.setDrawColor(241, 245, 249); // lighter divider
      doc.line(15, y + rowHeight, 195, y + rowHeight);

      // Accent colored line indicator on left edge of the row
      const subjectColorHex = sub.color || "#4f46e5";
      const [r, g, b] = hexToRgb(subjectColorHex);
      doc.setFillColor(r, g, b);
      doc.rect(15, y + 1, 1.5, rowHeight - 2, "F");

      // Text column 1: Subject Name + Professor
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      
      // Handle potential long name truncate
      let displayName = sub.name;
      if (displayName.length > 36) {
        displayName = displayName.substring(0, 34) + "...";
      }
      doc.text(displayName, 18, y + 6);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      let displayProf = cls.professor || "A definir";
      if (displayProf.length > 40) {
        displayProf = displayProf.substring(0, 38) + "...";
      }
      doc.text(displayProf, 18, y + 10);

      // Text column 2: Class Code
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text(cls.code, 95, y + 6);

      // Text column 3: Schedules
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105); // slate-600
      scheduleLines.forEach((line, index) => {
        doc.text(line, 115, y + 6 + (index * 4.5));
      });

      // Text column 4: Room Location
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      let roomStr = cls.schedules[0]?.room || cls.room || "A definir";
      if (roomStr.length > 15) {
        roomStr = roomStr.substring(0, 13) + "...";
      }
      doc.text(roomStr, 165, y + 6);

      y += rowHeight;
    });

    // Add footer reference on page 2
    y += 12;
    if (y < 270) {
      doc.setDrawColor(226, 232, 240);
      doc.line(15, y, 195, y);
      y += 6;
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Este documento representa a programação horária acadêmica elaborada de forma inteligente.", 15, y);
      doc.text("Por favor, verifique sempre com a secretaria acadêmica ou portal do aluno se houve alteração de turmas.", 15, y + 4);
    }

    doc.setFont("Helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("Página 2 • Lista Detalhada de Matérias, Professores e Horários", 15, 282);

    // Save and download PDF
    doc.save("Grade_Academica_Planejada.pdf");
  };

  const handleExportPNG = () => {
    if (selectedClasses.length === 0) return;

    // Helper definitions
    const timeToMinutes = (timeStr: string): number => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    const hexToRgb = (hex: string): [number, number, number] => {
      try {
        const cleanHex = hex.replace("#", "");
        if (cleanHex.length === 3) {
          const r = parseInt(cleanHex[0] + cleanHex[0], 16);
          const g = parseInt(cleanHex[1] + cleanHex[1], 16);
          const b = parseInt(cleanHex[2] + cleanHex[2], 16);
          return [r, g, b];
        }
        const num = parseInt(cleanHex, 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return [isNaN(r) ? 79 : r, isNaN(g) ? 70 : g, isNaN(b) ? 229 : b];
      } catch {
        return [79, 70, 229]; // default indigo
      }
    };

    const rgbToPastel = (r: number, g: number, b: number): [number, number, number] => {
      const pr = Math.round(r * 0.12 + 255 * 0.88);
      const pg = Math.round(g * 0.12 + 255 * 0.88);
      const pb = Math.round(b * 0.12 + 255 * 0.88);
      return [pr, pg, pb];
    };

    const analyzeSchedules = (classes: Class[]) => {
      const daySchedules: Record<number, { start: number; end: number }[]> = {};
      
      classes.forEach(cls => {
        cls.schedules.forEach(sched => {
          const day = sched.dayOfWeek;
          const start = timeToMinutes(sched.startTime);
          const end = timeToMinutes(sched.endTime);
          if (!daySchedules[day]) {
            daySchedules[day] = [];
          }
          daySchedules[day].push({ start, end });
        });
      });

      const daysOccupied = Object.keys(daySchedules).map(Number);
      let idleTimeMinutes = 0;
      let janelasCount = 0;

      Object.values(daySchedules).forEach(slots => {
        slots.sort((a, b) => a.start - b.start);
        for (let i = 0; i < slots.length - 1; i++) {
          const currentEnd = slots[i].end;
          const nextStart = slots[i+1].start;
          if (nextStart > currentEnd) {
            janelasCount++;
            idleTimeMinutes += (nextStart - currentEnd);
          }
        }
      });

      return {
        daysOccupied,
        idleTimeMinutes,
        janelasCount
      };
    };

    const { daysOccupied, idleTimeMinutes, janelasCount } = analyzeSchedules(selectedClasses);

    // Calculate metrics
    let totalCredits = 0;
    selectedClasses.forEach(cls => {
      const sub = subjects.find(s => s.id === cls.subjectId);
      if (sub) {
        totalCredits += sub.credits;
      }
    });

    // Conflict detection
    let conflictsCount = 0;
    for (let i = 0; i < selectedClasses.length; i++) {
      for (let j = i + 1; j < selectedClasses.length; j++) {
        const c1 = selectedClasses[i];
        const c2 = selectedClasses[j];
        const overlap = c1.schedules.some(s1 => 
          c2.schedules.some(s2 => {
            if (s1.dayOfWeek !== s2.dayOfWeek) return false;
            const start1 = timeToMinutes(s1.startTime);
            const end1 = timeToMinutes(s1.endTime);
            const start2 = timeToMinutes(s2.startTime);
            const end2 = timeToMinutes(s2.endTime);
            return Math.max(start1, start2) < Math.min(end1, end2);
          })
        );
        if (overlap) {
          conflictsCount++;
        }
      }
    }

    const idleStr = idleTimeMinutes === 0 ? "Nenhum" : `${Math.floor(idleTimeMinutes / 60)}h${idleTimeMinutes % 60}m`;
    const formattedDate = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    // Compute standard periods to build the visual grid rows
    const STANDARD_SLOTS = [
      { label: "M1", start: "07:30", end: "08:20" },
      { label: "M2", start: "08:20", end: "09:10" },
      { label: "M3", start: "09:20", end: "10:10" },
      { label: "M4", start: "10:10", end: "11:00" },
      { label: "T1", start: "13:30", end: "14:20" },
      { label: "T2", start: "14:20", end: "15:10" },
      { label: "T3", start: "15:20", end: "16:10" },
      { label: "T4", start: "16:10", end: "17:00" },
      { label: "N1", start: "18:30", end: "19:20" },
      { label: "N2", start: "19:20", end: "20:10" },
      { label: "N3", start: "20:20", end: "21:10" },
      { label: "N4", start: "21:10", end: "22:30" },
    ];

    const getClassesInSlot = (dayOfWeek: number, slotStartStr: string, slotEndStr: string) => {
      const slotStart = timeToMinutes(slotStartStr);
      const slotEnd = timeToMinutes(slotEndStr);
      
      return selectedClasses.filter(cls => {
        return cls.schedules.some(sched => {
          if (sched.dayOfWeek !== dayOfWeek) return false;
          const schedStart = timeToMinutes(sched.startTime);
          const schedEnd = timeToMinutes(sched.endTime);
          return Math.max(slotStart, schedStart) < Math.min(slotEnd, schedEnd);
        });
      });
    };

    const daysNameMap: Record<number, string> = {
      1: "Segunda",
      2: "Terça",
      3: "Quarta",
      4: "Quinta",
      5: "Sexta",
      6: "Sábado",
      7: "Domingo"
    };

    // Build visual grid HTML rows
    let gridRowsHtml = "";
    STANDARD_SLOTS.forEach((slot, rowIndex) => {
      const isEven = rowIndex % 2 === 0;
      const bgRow = isEven ? "#ffffff" : "#f8fafc";
      
      gridRowsHtml += `<div style="display: grid; grid-template-columns: 60px repeat(6, 1fr); background-color: ${bgRow}; border-top: 1px solid #e2e8f0; min-height: 56px; align-items: stretch; box-sizing: border-box;">`;
      
      // Col 0: Period label
      gridRowsHtml += `
        <div style="text-align: center; border-right: 1px solid #e2e8f0; background-color: #f1f5f9; padding: 6px 4px; display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box; min-height: 56px; overflow: visible;">
          <div style="font-size: 11px; font-weight: bold; color: #475569; line-height: 1.5; overflow: visible;">${slot.label}</div>
          <div style="font-size: 8px; color: #94a3b8; margin-top: 2px; line-height: 1.5; overflow: visible;">${slot.start}-${slot.end}</div>
        </div>
      `;

      // Col 1 to 6: Days
      for (let dayIdx = 1; dayIdx <= 6; dayIdx++) {
        const classesInCell = getClassesInSlot(dayIdx, slot.start, slot.end);
        const hasBorderRight = dayIdx < 6 ? "border-right: 1px solid #e2e8f0;" : "";

        if (classesInCell.length > 1) {
          // Conflict
          gridRowsHtml += `
            <div style="padding: 6px 4px; text-align: center; background-color: #fee2e2; border-left: 2px solid #ef4444; ${hasBorderRight} display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box; min-height: 56px; overflow: visible;">
              <div style="font-size: 9px; font-weight: bold; color: #b91c1c; line-height: 1.5; overflow: visible;">CONFLITO</div>
              <div style="font-size: 7px; color: #b91c1c; text-overflow: ellipsis; white-space: nowrap; overflow: visible; line-height: 1.5; width: 100%;">Múltiplas</div>
            </div>
          `;
        } else if (classesInCell.length === 1) {
          const cls = classesInCell[0];
          const sub = subjects.find(s => s.id === cls.subjectId);
          const subjectColorHex = sub?.color || "#4f46e5";
          const [r, g, b] = hexToRgb(subjectColorHex);
          const [pr, pg, pb] = rgbToPastel(r, g, b);
          const roomStr = cls.schedules.find(s => s.dayOfWeek === dayIdx)?.room || cls.room || "Sala";

          gridRowsHtml += `
            <div style="padding: 6px 4px; text-align: center; background-color: rgb(${pr}, ${pg}, ${pb}); border-left: 3px solid rgb(${r}, ${g}, ${b}); ${hasBorderRight} display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box; min-height: 56px; overflow: visible;">
              <div style="font-size: 10px; font-weight: bold; color: #0f172a; text-overflow: ellipsis; white-space: nowrap; overflow: visible; line-height: 1.5; width: 100%;">${sub?.code || cls.code}</div>
              <div style="font-size: 7.5px; color: #475569; text-overflow: ellipsis; white-space: nowrap; overflow: visible; margin-top: 2px; line-height: 1.5; width: 100%;">${cls.code} • ${roomStr}</div>
            </div>
          `;
        } else {
          // Empty cell
          gridRowsHtml += `
            <div style="padding: 6px 4px; text-align: center; ${hasBorderRight} display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box; min-height: 56px; overflow: visible;">
              <div style="font-size: 9px; color: #cbd5e1; line-height: 1.5; overflow: visible;">-</div>
            </div>
          `;
        }
      }
      gridRowsHtml += `</div>`;
    });

    // Build disciplines list HTML
    let disciplinesListHtml = "";
    selectedClasses.forEach(cls => {
      const sub = subjects.find(s => s.id === cls.subjectId);
      if (!sub) return;

      const subjectColorHex = sub.color || "#4f46e5";
      const scheduleText = cls.schedules.map(sched => {
        const dayStr = daysNameMap[sched.dayOfWeek]?.substring(0, 3) || `Dia ${sched.dayOfWeek}`;
        return `${dayStr} ${sched.startTime}-${sched.endTime}`;
      }).join(" | ");

      const displayName = sub.name.length > 55 ? sub.name.substring(0, 52) + "..." : sub.name;

      disciplinesListHtml += `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid ${subjectColorHex}; border-radius: 8px; padding: 12px 10px; display: flex; flex-direction: column; gap: 4px; text-align: left; box-sizing: border-box; margin-bottom: 8px; overflow: visible;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; box-sizing: border-box; overflow: visible;">
            <div style="font-size: 11.5px; font-weight: bold; color: #1e293b; line-height: 1.5; word-break: break-word; flex-grow: 1; overflow: visible; padding: 1px 0;">
              ${displayName}
            </div>
            <div style="font-size: 9px; font-weight: bold; color: #4f46e5; background-color: #eeebff; border: 1px solid #e0dbff; border-radius: 4px; padding: 3px 6px; white-space: nowrap; line-height: 1.5; overflow: visible; margin-top: 1px;">
              ${cls.code}
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px; box-sizing: border-box; margin-top: 2px; overflow: visible;">
            <div style="font-size: 9px; color: #64748b; font-weight: 500; line-height: 1.5; overflow: visible;">Prof: ${cls.professor || "A definir"}</div>
            <div style="font-size: 9px; color: #64748b; font-weight: 500; line-height: 1.5; overflow: visible;">Salas: ${cls.schedules.map(s => s.room).join(", ") || cls.room || "A definir"}</div>
            <div style="font-size: 9px; color: #4f46e5; font-weight: bold; margin-top: 2px; line-height: 1.5; overflow: visible;">${scheduleText}</div>
          </div>
        </div>
      `;
    });

    // Create container element to render off-screen
    const container = document.createElement("div");
    container.id = "temp-export-container";
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0px";
    container.style.width = "1200px";
    container.style.zIndex = "-9999";

    container.innerHTML = `
      <div style="padding: 32px; background-color: #f8fafc; width: 1200px; border: 1px solid #e2e8f0; border-radius: 24px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box;">
        <!-- Header Banner -->
        <div style="display: flex; align-items: center; justify-content: space-between; background-color: #4f46e5; color: white; padding: 24px; border-radius: 16px; margin-bottom: 24px; box-sizing: border-box;">
          <div>
            <h1 style="font-size: 24px; font-weight: 900; margin: 0; tracking-tight: -0.025em; text-transform: uppercase;">MEU SEMESTRE IFSC</h1>
            <p style="font-size: 14px; margin: 4px 0 0 0; opacity: 0.9;">Grade Horária e Quadro de Disciplinas Planejadas</p>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 12px; font-weight: 700; background-color: rgba(67, 56, 202, 0.6); padding: 6px 12px; border-radius: 9999px; white-space: nowrap;">
              Gerado em ${formattedDate}
            </span>
          </div>
        </div>

        <!-- Stats Cards -->
        <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; box-sizing: border-box;">
          <!-- Card 1 -->
          <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; min-height: 80px; text-align: left; box-sizing: border-box;">
            <span style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">CARGA ACADÊMICA</span>
            <span style="font-size: 20px; font-weight: 900; color: #1e293b; margin-top: 4px;">${totalCredits} Créditos</span>
            <span style="font-size: 12px; color: #64748b; margin-top: 4px;">${selectedClasses.length} disciplinas selecionadas</span>
          </div>
          <!-- Card 2 -->
          <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; min-height: 80px; text-align: left; box-sizing: border-box;">
            <span style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">TEMPO OCIOSO (JANELAS)</span>
            <span style="font-size: 20px; font-weight: 900; color: #1e293b; margin-top: 4px;">${idleStr}</span>
            <span style="font-size: 12px; color: #64748b; margin-top: 4px;">${janelasCount} intervalo(s) vago(s)</span>
          </div>
          <!-- Card 3 -->
          <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; min-height: 80px; text-align: left; box-sizing: border-box;">
            <span style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">PRESENCIALIDADE</span>
            <span style="font-size: 20px; font-weight: 900; color: #1e293b; margin-top: 4px;">${daysOccupied.length} dias de aula</span>
            <span style="font-size: 12px; color: #64748b; margin-top: 4px;">${conflictsCount > 0 ? `Aviso: ${conflictsCount} conflitos!` : 'Sem conflitos detectados'}</span>
          </div>
        </div>

        <!-- Main Layout Split -->
        <div style="display: grid; grid-template-columns: 780px 356px; gap: 24px; align-items: start; box-sizing: border-box;">
          <!-- Left Column (Grid Table) -->
          <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; text-align: left; box-sizing: border-box;">
            <h3 style="font-size: 14px; font-weight: 700; color: #334155; margin: 0 0 12px 0;">Grade Horária Semanal</h3>
            
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-sizing: border-box;">
              <!-- Header Row -->
              <div style="display: grid; grid-template-columns: 60px repeat(6, 1fr); background-color: #4f46e5; color: white; text-align: center; font-size: 11px; font-weight: 700; height: 36px; align-items: center; box-sizing: border-box;">
                <div style="border-right: 1px solid rgba(255,255,255,0.15);">Horário</div>
                <div style="border-right: 1px solid rgba(255,255,255,0.15);">Segunda</div>
                <div style="border-right: 1px solid rgba(255,255,255,0.15);">Terça</div>
                <div style="border-right: 1px solid rgba(255,255,255,0.15);">Quarta</div>
                <div style="border-right: 1px solid rgba(255,255,255,0.15);">Quinta</div>
                <div style="border-right: 1px solid rgba(255,255,255,0.15);">Sexta</div>
                <div>Sábado</div>
              </div>
              <!-- Rows HTML -->
              ${gridRowsHtml}
            </div>
          </div>

          <!-- Right Column (Disciplines List) -->
          <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; text-align: left; box-sizing: border-box;">
            <div>
              <h3 style="font-size: 14px; font-weight: 700; color: #334155; margin: 0 0 12px 0;">Lista de Disciplinas</h3>
              <div style="display: flex; flex-direction: column; gap: 4px; box-sizing: border-box;">
                ${disciplinesListHtml}
              </div>
            </div>
            
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; box-sizing: border-box;">
              <p style="font-size: 10px; color: #94a3b8; font-style: italic; margin: 0;">Meu Semestre IFSC - Planejamento Acadêmico Inteligente</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Call html2canvas on the generated container
    html2canvas(container, {
      scale: 2, // 2x scale for crystal-clear high definition PNG
      useCORS: true,
      backgroundColor: null,
      logging: false,
    }).then((canvas) => {
      // Trigger download
      const imageUri = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "Grade_Academica_Meu_Semestre_IFSC.png";
      link.href = imageUri;
      link.click();
      
      // Cleanup
      document.body.removeChild(container);
    }).catch((err) => {
      console.error("Error generating image:", err);
      alert("Houve um erro ao exportar a imagem. Por favor, utilize a exportação em PDF.");
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    });
  };

  const disabled = selectedClasses.length === 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs select-none" id="export-panel-card">
      <h4 className="font-display font-bold text-sm text-slate-800 mb-1 flex items-center gap-2">
        <Download className="w-4 h-4 text-indigo-500" />
        <span>Exportação Profissional</span>
      </h4>
      <p className="text-xs text-slate-400 mb-4">
        Sincronize sua grade planejada com outros dispositivos ou exporte para compartilhar.
      </p>

      {showPrintMessage && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-800 flex items-center gap-2 animate-pulse">
          <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Formatando página para impressão limpa... O diálogo abrirá em instantes.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Google Calendar .ICS */}
        <button
          onClick={handleExportICS}
          disabled={disabled || exportingICS}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
            disabled 
              ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed" 
              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
          }`}
          id="btn-export-ics"
        >
          <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
          <span>{exportingICS ? "Exportando..." : "Google Calendar (.ics)"}</span>
        </button>

        {/* Vector PDF (Print Optimized) */}
        <button
          onClick={handleExportPDF}
          disabled={disabled}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
            disabled 
              ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed" 
              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
          }`}
          id="btn-export-pdf"
        >
          <FileText className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Salvar como PDF</span>
        </button>

        {/* High-res Image (PNG) */}
        <button
          onClick={handleExportPNG}
          disabled={disabled}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
            disabled 
              ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed" 
              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
          }`}
          id="btn-export-png"
        >
          <Image className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Exportar Imagem</span>
        </button>
      </div>

      {disabled && (
        <div className="mt-3.5 text-center text-[10px] text-slate-400 font-medium">
          * Adicione pelo menos uma turma para habilitar as ferramentas de exportação.
        </div>
      )}
    </div>
  );
}
