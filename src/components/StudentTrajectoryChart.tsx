import React, { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Bimestre, GradeRecord, SubjectId } from '../types/school';
import { computeRecordAverage, formatScore, SUBJECT_MAP, SUBJECTS } from '../data/seedData';

interface StudentTrajectoryChartProps {
  grades: GradeRecord[];
  studentId: string;
  selectedBimestre: Bimestre;
  studentName?: string;
}

interface ChartDatum {
  bimestreLabel: string;
  bimestre: Bimestre;
  math: number;
  portuguese: number;
  science: number;
  history: number;
  english: number;
}

interface CustomTooltipPayloadItem {
  dataKey?: string | number;
  value?: number;
  color?: string;
  name?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  label?: string;
}

const TrajectoryTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg min-w-[190px]">
      <p className="text-xs font-semibold text-slate-900 pb-1.5 mb-2 border-b border-slate-100">
        {label} · Escala 0 a 10
      </p>
      <div className="space-y-1.5">
        {payload.map((entry) => {
          const subjectId = entry.dataKey as SubjectId;
          const subject = SUBJECT_MAP[subjectId];
          const val = typeof entry.value === 'number' ? entry.value : 0;
          return (
            <div
              key={String(entry.dataKey)}
              className="flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: subject?.accentHex ?? entry.color }}
                  aria-hidden="true"
                />
                <span className="text-slate-700 font-medium">
                  {subject?.name ?? entry.name}
                </span>
              </div>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {formatScore(val)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const StudentTrajectoryChart: React.FC<StudentTrajectoryChartProps> = ({
  grades,
  studentId,
  selectedBimestre,
  studentName,
}) => {
  const [visibleSubjects, setVisibleSubjects] = useState<Record<SubjectId, boolean>>({
    math: true,
    portuguese: true,
    science: true,
    history: true,
    english: true,
  });

  const studentGrades = useMemo(
    () => grades.filter((g) => g.studentId === studentId),
    [grades, studentId]
  );

  const chartData: ChartDatum[] = useMemo(() => {
    return ([1, 2, 3, 4] as Bimestre[]).map((b) => {
      const getAvg = (subjectId: SubjectId) => {
        const rec = studentGrades.find(
          (g) => g.subjectId === subjectId && g.bimestre === b
        );
        return rec ? computeRecordAverage(rec) : 0;
      };

      return {
        bimestreLabel: `${b}º Bim`,
        bimestre: b,
        math: getAvg('math'),
        portuguese: getAvg('portuguese'),
        science: getAvg('science'),
        history: getAvg('history'),
        english: getAvg('english'),
      };
    });
  }, [studentGrades]);

  const allVisible = useMemo(
    () => Object.values(visibleSubjects).every(Boolean),
    [visibleSubjects]
  );

  const toggleSubject = (subjectId: SubjectId) => {
    setVisibleSubjects((prev) => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (prev[subjectId] && activeCount === 1) return prev;
      return { ...prev, [subjectId]: !prev[subjectId] };
    });
  };

  const showAllSubjects = () => {
    setVisibleSubjects({
      math: true,
      portuguese: true,
      science: true,
      history: true,
      english: true,
    });
  };

  const trajectorySummary = useMemo(() => {
    const first = chartData[0];
    const current = chartData[selectedBimestre - 1] ?? chartData[3];
    return SUBJECTS.filter((s) => visibleSubjects[s.id]).map((subject) => {
      const startVal = first ? first[subject.id] : 0;
      const currentVal = current ? current[subject.id] : 0;
      const delta = Math.round((currentVal - startVal) * 10) / 10;
      return {
        subject,
        startVal,
        currentVal,
        delta,
      };
    });
  }, [chartData, selectedBimestre, visibleSubjects]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Trajetória das Notas Bimestrais{studentName ? ` · ${studentName.split(' ')[0]}` : ''}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            Evolução do 1º ao 4º Bimestre por disciplina · Linha tracejada indica meta 7,0
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={showAllSubjects}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              allVisible
                ? 'text-white bg-slate-900 border-slate-900'
                : 'text-slate-600 bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            Todas
          </button>
          {SUBJECTS.map((subject) => {
            const active = visibleSubjects[subject.id];
            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => toggleSubject(subject.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'text-slate-900 bg-white border-slate-300'
                    : 'text-slate-400 bg-slate-50 border-slate-200'
                }`}
              >
                <span
                  className="inline-block w-2 h-2 rounded-xs mr-1.5"
                  style={{
                    backgroundColor: active ? subject.accentHex : '#CBD5E1',
                  }}
                  aria-hidden="true"
                />
                {subject.shortName}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full h-[250px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 16, left: -14, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="bimestreLabel"
              tick={{ fontSize: 12, fill: '#475569' }}
              axisLine={{ stroke: '#CBD5E1' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 10]}
              ticks={[0, 2.5, 5, 7, 10]}
              tickFormatter={(v: number) => (v === 7 ? '7,0' : String(v))}
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<TrajectoryTooltip />} />
            <ReferenceLine
              y={7}
              stroke="#64748B"
              strokeDasharray="4 4"
              strokeWidth={1.25}
            />
            {SUBJECTS.filter((s) => visibleSubjects[s.id]).map((subject) => (
              <Line
                key={subject.id}
                type="monotone"
                dataKey={subject.id}
                name={subject.name}
                stroke={subject.accentHex}
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#FFFFFF', stroke: subject.accentHex, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: subject.accentHex, stroke: '#FFFFFF', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trajectory delta summary */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs tabular-nums">
        {trajectorySummary.map(({ subject, startVal, currentVal, delta }) => (
          <div key={subject.id} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-xs shrink-0"
              style={{ backgroundColor: subject.accentHex }}
              aria-hidden="true"
            />
            <span className="font-semibold text-slate-700">{subject.shortName}</span>
            <span className="font-mono text-slate-600">
              {formatScore(startVal)} → {formatScore(currentVal)}
            </span>
            <span
              className={`font-mono font-semibold ${
                delta > 0
                  ? 'text-emerald-700'
                  : delta < 0
                  ? 'text-amber-700'
                  : 'text-slate-500'
              }`}
            >
              ({delta > 0 ? '+' : ''}
              {formatScore(delta)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
