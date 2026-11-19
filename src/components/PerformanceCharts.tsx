import React, { useMemo, useState } from 'react';
import { Bimestre, GradeRecord, SubjectId } from '../types/school';
import { computeRecordAverage, formatScore, SUBJECT_MAP, SUBJECTS } from '../data/seedData';
import { StudentTrajectoryChart } from './StudentTrajectoryChart';

interface PerformanceChartsProps {
  grades: GradeRecord[];
  studentId: string;
  selectedBimestre: Bimestre;
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  grades,
  studentId,
  selectedBimestre,
}) => {
  const [hoveredSubject, setHoveredSubject] = useState<SubjectId | null>(null);

  const studentGrades = useMemo(
    () => grades.filter((g) => g.studentId === studentId),
    [grades, studentId]
  );

  const barData = useMemo(() => {
    return SUBJECTS.map((subject) => {
      const record = studentGrades.find(
        (g) => g.subjectId === subject.id && g.bimestre === selectedBimestre
      );
      const average = record ? computeRecordAverage(record) : 0;
      return {
        subject,
        record,
        average,
      };
    });
  }, [studentGrades, selectedBimestre]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Chart 1: Subject Averages Bar View */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Desempenho por Disciplina
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {selectedBimestre}º Bimestre · Escala de 0,0 a 10,0 · Meta escolar 7,0
            </p>
          </div>
          {hoveredSubject && (
            <div className="text-right tabular-nums">
              <p className="text-xs font-semibold text-slate-900">
                {SUBJECT_MAP[hoveredSubject].name}
              </p>
              {(() => {
                const item = barData.find((d) => d.subject.id === hoveredSubject);
                if (!item?.record) return null;
                return (
                  <p className="text-xs text-slate-500 font-mono">
                    P1 {formatScore(item.record.exam1)} · P2 {formatScore(item.record.exam2)} · Tar{' '}
                    {formatScore(item.record.homeworkAvg)}
                  </p>
                );
              })()}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {barData.map(({ subject, average }) => {
            const pct = Math.min(100, Math.max(0, (average / 10) * 100));
            const belowTarget = average < 7.0;
            return (
              <div
                key={subject.id}
                onMouseEnter={() => setHoveredSubject(subject.id)}
                onMouseLeave={() => setHoveredSubject(null)}
                className="group"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: subject.accentHex }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-slate-800 truncate">{subject.name}</span>
                    <span className="text-slate-400 hidden sm:inline">· {subject.teacherName}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 tabular-nums font-mono">
                    {belowTarget && (
                      <span className="text-[11px] font-sans font-semibold text-amber-700">
                        Abaixo de 7,0
                      </span>
                    )}
                    <span className="text-sm font-semibold text-slate-900">
                      {formatScore(average)}
                    </span>
                  </div>
                </div>
                <div className="relative h-3 w-full rounded-md bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-md transition-[width] duration-300 ease-out"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: subject.accentHex,
                    }}
                  />
                  {/* Target 7.0 vertical marker */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-slate-900/35"
                    style={{ left: '70%' }}
                    title="Meta escolar: 7,0"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart 2: Recharts Bimestral Trajectory Line Chart */}
      <StudentTrajectoryChart
        grades={grades}
        studentId={studentId}
        selectedBimestre={selectedBimestre}
      />
    </div>
  );
};
