import React from 'react';
import { Clock } from 'lucide-react';
import { ActivityEvent } from '../types/school';
import { SUBJECT_MAP } from '../data/seedData';

interface LiveActivityFeedProps {
  activities: ActivityEvent[];
  limit?: number;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ activities, limit = 6 }) => {
  const items = activities.slice(0, limit);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Atualizações em Tempo Real
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Notas lançadas, entregas de arquivos e comunicados sincronizados automaticamente
          </p>
        </div>
        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">Nenhuma movimentação registrada ainda.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => {
            const subject = SUBJECT_MAP[item.subjectId];
            return (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-sm mt-1.5 shrink-0"
                  style={{ backgroundColor: subject.accentHex }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800 leading-snug">
                    <span className="font-semibold text-slate-900">{item.actorName}</span>{' '}
                    {item.summary}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 tabular-nums">
                    {subject.name} ·{' '}
                    {new Date(item.timestamp).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
