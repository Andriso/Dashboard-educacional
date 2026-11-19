import React from 'react';
import { AlertCircle, CheckCircle2, Target } from 'lucide-react';
import { Bimestre } from '../types/school';
import { formatScore } from '../data/seedData';

interface BimestreTargetBarProps {
  currentAverage: number;
  targetScore?: number;
  selectedBimestre: Bimestre;
}

export const BimestreTargetBar: React.FC<BimestreTargetBarProps> = ({
  currentAverage,
  targetScore = 7.0,
  selectedBimestre,
}) => {
  const clampedAvg = Math.min(10, Math.max(0, currentAverage));
  const clampedTarget = Math.min(10, Math.max(0, targetScore));
  const avgPct = (clampedAvg / 10) * 100;
  const targetPct = (clampedTarget / 10) * 100;
  const diff = Math.round((clampedAvg - clampedTarget) * 10) / 10;
  const reachedTarget = clampedAvg >= clampedTarget;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <Target className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Progresso em Relação à Meta · {selectedBimestre}º Bimestre
            </h3>
            <p className="text-xs text-slate-500 tabular-nums">
              Média atual {formatScore(clampedAvg)} comparada à nota meta {formatScore(clampedTarget)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 tabular-nums">
          {reachedTarget ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              {diff === 0
                ? 'Na nota meta'
                : `+${formatScore(diff)} acima da meta`}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              Falta {formatScore(Math.abs(diff))} para a meta
            </span>
          )}
          <span className="text-base font-bold text-slate-900 font-mono">
            {formatScore(clampedAvg)} / 10,0
          </span>
        </div>
      </div>

      {/* Simple progress bar with target marker */}
      <div
        className="relative h-3.5 w-full bg-slate-100 rounded-md overflow-visible"
        role="progressbar"
        aria-valuenow={clampedAvg}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-label={`Média atual ${formatScore(clampedAvg)} de 10,0. Meta definida: ${formatScore(clampedTarget)}`}
      >
        <div
          className={`h-full rounded-md transition-[width] duration-300 ease-out ${
            reachedTarget ? 'bg-emerald-600' : 'bg-amber-500'
          }`}
          style={{ width: `${avgPct}%` }}
        />
        <div
          className="absolute -top-1 -bottom-1 w-0.5 bg-slate-900"
          style={{ left: `${targetPct}%` }}
          title={`Nota meta: ${formatScore(clampedTarget)}`}
        />
      </div>

      {/* Scale labels */}
      <div className="relative mt-2 h-4 text-[11px] text-slate-500 font-mono tabular-nums">
        <span className="absolute left-0">0,0</span>
        <span className="absolute left-1/2 -translate-x-1/2">5,0</span>
        <span
          className="absolute -translate-x-1/2 font-semibold text-slate-800"
          style={{ left: `${targetPct}%` }}
        >
          Meta {formatScore(clampedTarget)}
        </span>
        <span className="absolute right-0">10,0</span>
      </div>
    </div>
  );
};
