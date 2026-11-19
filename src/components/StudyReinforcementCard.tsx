import React, { useMemo, useState } from 'react';
import { ArrowRight, BookMarked, Check, CheckCircle2, Sparkles } from 'lucide-react';
import { Bimestre, GradeRecord, Student, SubjectId } from '../types/school';
import { computeRecordAverage, formatScore, SUBJECT_MAP, SUBJECTS } from '../data/seedData';

interface StudyReinforcementCardProps {
  student: Student;
  grades: GradeRecord[];
  selectedBimestre: Bimestre;
  onSelectBimestre: (bimestre: Bimestre) => void;
  onOpenSubjectTasks: (subjectId: SubjectId) => void;
}

interface ReinforcementTopic {
  id: string;
  title: string;
  actionHint: string;
}

const CURRICULUM_TOPICS: Record<
  SubjectId,
  Record<'8º Ano A' | '6º Ano B', ReinforcementTopic[]>
> = {
  math: {
    '8º Ano A': [
      {
        id: 'math-8-1',
        title: 'Equações e sistemas lineares do 1º grau',
        actionHint: 'Refaça 5 exercícios isolando incógnitas passo a passo.',
      },
      {
        id: 'math-8-2',
        title: 'Interpretação de gráficos no plano cartesiano',
        actionHint: 'Revise coeficiente angular e pontos de interseção.',
      },
      {
        id: 'math-8-3',
        title: 'Expressões algébricas e fatoração simples',
        actionHint: 'Pratique simplificação de termos semelhantes.',
      },
    ],
    '6º Ano B': [
      {
        id: 'math-6-1',
        title: 'Frações equivalentes e operações básicas',
        actionHint: 'Resolva problemas visuais dividindo inteiros em partes.',
      },
      {
        id: 'math-6-2',
        title: 'Porcentagem e razão no cotidiano',
        actionHint: 'Calcule descontos e proporções com números decimais.',
      },
      {
        id: 'math-6-3',
        title: 'Múltiplos, divisores e MMC',
        actionHint: 'Revise decomposição em fatores primos.',
      },
    ],
  },
  portuguese: {
    '8º Ano A': [
      {
        id: 'port-8-1',
        title: 'Coesão textual e uso de conectivos argumentativos',
        actionHint: 'Releia sua última redação substituindo repetições por conjunções.',
      },
      {
        id: 'port-8-2',
        title: 'Pontuação e períodos compostos',
        actionHint: 'Revise vírgula em orações subordinadas e aposto.',
      },
      {
        id: 'port-8-3',
        title: 'Análise de foco narrativo e inferência',
        actionHint: 'Identifique voz do narrador e intenção implícita em contos.',
      },
    ],
    '6º Ano B': [
      {
        id: 'port-6-1',
        title: 'Ortografia e acentuação gráfica',
        actionHint: 'Classifique palavras oxítonas, paroxítonas e proparoxítonas.',
      },
      {
        id: 'port-6-2',
        title: 'Estrutura narrativa: início, conflito e desfecho',
        actionHint: 'Faça um esquema em 4 tópicos antes de redigir textos.',
      },
      {
        id: 'port-6-3',
        title: 'Classes gramaticais e concordância nominal',
        actionHint: 'Verifique gênero e número entre substantivos e adjetivos.',
      },
    ],
  },
  science: {
    '8º Ano A': [
      {
        id: 'sci-8-1',
        title: 'Circuitos elétricos, tensão e corrente',
        actionHint: 'Compare circuitos em série e paralelo com esquemas simples.',
      },
      {
        id: 'sci-8-2',
        title: 'Transformações de energia e sustentabilidade',
        actionHint: 'Revise eficiência energética em fontes renováveis.',
      },
      {
        id: 'sci-8-3',
        title: 'Registro de hipóteses e análise de dados experimentais',
        actionHint: 'Organize medições em tabelas antes de escrever a conclusão.',
      },
    ],
    '6º Ano B': [
      {
        id: 'sci-6-1',
        title: 'Ciclo hidrológico e estados físicos da água',
        actionHint: 'Associe evaporação, condensação e precipitação a exemplos reais.',
      },
      {
        id: 'sci-6-2',
        title: 'Relações ecológicas e cadeias alimentares',
        actionHint: 'Diferencie produtores, consumidores e decompositores.',
      },
      {
        id: 'sci-6-3',
        title: 'Observação científica e diário de laboratório',
        actionHint: 'Descreva etapa por etapa o que mudou em cada experimento.',
      },
    ],
  },
  history: {
    '8º Ano A': [
      {
        id: 'hist-8-1',
        title: 'Revolução Industrial e mudanças no trabalho urbano',
        actionHint: 'Compare produção artesanal e fabril em uma tabela rápida.',
      },
      {
        id: 'hist-8-2',
        title: 'Leitura e fichamento de fontes históricas primárias',
        actionHint: 'Destaque autor, contexto e objetivo de cada documento lido.',
      },
      {
        id: 'hist-8-3',
        title: 'Linha do tempo do século XVIII ao XIX',
        actionHint: 'Ordene os principais marcos políticos e econômicos do período.',
      },
    ],
    '6º Ano B': [
      {
        id: 'hist-6-1',
        title: 'Civilizações da Antiguidade e rotas comerciais',
        actionHint: 'Localize no mapa Egito, Mesopotâmia e Grécia Antiga.',
      },
      {
        id: 'hist-6-2',
        title: 'Organização de linhas do tempo e cronologia',
        actionHint: 'Pratique conversão de anos em séculos (a.C. e d.C.).',
      },
      {
        id: 'hist-6-3',
        title: 'Fontes materiais e patrimônio cultural',
        actionHint: 'Diferencie fontes escritas, visuais e arqueológicas.',
      },
    ],
  },
  english: {
    '8º Ano A': [
      {
        id: 'eng-8-1',
        title: 'Present Simple vs. Present Continuous em contexto',
        actionHint: 'Escreva 6 frases contrastando rotina diária e ações atuais.',
      },
      {
        id: 'eng-8-2',
        title: 'Conectores de sequência e compreensão de leitura',
        actionHint: 'Use first, then, after that e finally em diálogos curtos.',
      },
      {
        id: 'eng-8-3',
        title: 'Prática de escuta ativa e pronúncia',
        actionHint: 'Leia o roteiro da unidade em voz alta por 10 minutos.',
      },
    ],
    '6º Ano B': [
      {
        id: 'eng-6-1',
        title: 'Vocabulário cotidiano: rotina, escola e família',
        actionHint: 'Monte cartões visuais com 12 palavras-chave da unidade.',
      },
      {
        id: 'eng-6-2',
        title: 'Verbo To Be e perguntas simples (Wh- questions)',
        actionHint: 'Pratique respostas completas com what, where e when.',
      },
      {
        id: 'eng-6-3',
        title: 'Leitura guiada de diálogos curtos',
        actionHint: 'Sublinhe palavras cognatas para acelerar a compreensão.',
      },
    ],
  },
};

export const StudyReinforcementCard: React.FC<StudyReinforcementCardProps> = ({
  student,
  grades,
  selectedBimestre,
  onSelectBimestre,
  onOpenSubjectTasks,
}) => {
  const [checkedTopics, setCheckedTopics] = useState<Record<string, boolean>>({});

  const studentGrades = useMemo(
    () => grades.filter((g) => g.studentId === student.id),
    [grades, student.id]
  );

  const lowSubjects = useMemo(() => {
    return SUBJECTS.map((subject) => {
      const record = studentGrades.find(
        (g) => g.subjectId === subject.id && g.bimestre === selectedBimestre
      );
      if (!record) return null;
      const average = computeRecordAverage(record);
      if (average >= 7.0) return null;

      const weakAreas: string[] = [];
      if (record.exam1 < 7.0 || record.exam2 < 7.0) {
        weakAreas.push('Avaliações escritas');
      }
      if (record.homeworkAvg < 7.0) {
        weakAreas.push('Entregas e tarefas');
      }

      const topics = CURRICULUM_TOPICS[subject.id][student.classRoom];
      return {
        subject,
        record,
        average,
        gap: Math.round((7.0 - average) * 10) / 10,
        weakAreas,
        topics,
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [studentGrades, selectedBimestre, student.classRoom]);

  const otherAlertBimestre = useMemo(() => {
    if (lowSubjects.length > 0) return null;
    for (const b of [4, 3, 2, 1] as Bimestre[]) {
      if (b === selectedBimestre) continue;
      const found = studentGrades.find(
        (g) => g.bimestre === b && computeRecordAverage(g) < 7.0
      );
      if (found) {
        return {
          bimestre: b,
          subjectName: SUBJECT_MAP[found.subjectId].name,
          average: computeRecordAverage(found),
        };
      }
    }
    return null;
  }, [lowSubjects.length, selectedBimestre, studentGrades]);

  const toggleTopic = (topicKey: string) => {
    setCheckedTopics((prev) => ({
      ...prev,
      [topicKey]: !prev[topicKey],
    }));
  };

  if (lowSubjects.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Trilha de Reforço · Tudo em dia no {selectedBimestre}º Bimestre
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Todas as suas disciplinas estão com média igual ou superior a 7,0 neste bimestre.
              Continue mantendo a entrega das atividades em dia.
            </p>
          </div>
        </div>

        {otherAlertBimestre && (
          <button
            type="button"
            onClick={() => onSelectBimestre(otherAlertBimestre.bimestre)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
          >
            Revisar {otherAlertBimestre.bimestre}º Bim ({otherAlertBimestre.subjectName} ·{' '}
            {formatScore(otherAlertBimestre.average)})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <section
      aria-label="Tópicos recomendados para reforço"
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <BookMarked className="w-4 h-4 text-amber-700" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Plano Amigável de Reforço · {selectedBimestre}º Bimestre
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              Sugestões personalizadas para disciplinas abaixo da meta 7,0. Marque os tópicos conforme revisar.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-amber-800 tabular-nums">
          {lowSubjects.length}{' '}
          {lowSubjects.length === 1 ? 'disciplina em atenção' : 'disciplinas em atenção'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {lowSubjects.map(({ subject, record, average, gap, weakAreas, topics }) => {
          const completedCount = topics.filter(
            (t) => checkedTopics[`${student.id}-${selectedBimestre}-${t.id}`]
          ).length;

          return (
            <div
              key={subject.id}
              className="border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between bg-slate-50/40"
            >
              <div>
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: subject.accentHex }}
                />
                <div className="p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: subject.textHex }}
                      >
                        {subject.name} · {subject.teacherName}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                        Média atual{' '}
                        <span className="font-mono font-bold text-slate-900">
                          {formatScore(average)}
                        </span>{' '}
                        · Faltam{' '}
                        <span className="font-mono font-semibold text-amber-700">
                          {formatScore(gap)}
                        </span>{' '}
                        pontos para 7,0
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 font-mono tabular-nums">
                      {completedCount}/{topics.length} revisados
                    </span>
                  </div>

                  {weakAreas.length > 0 && (
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">Foco principal:</span>{' '}
                      {weakAreas.join(' · ')}
                      {record.teacherNote ? ` — "${record.teacherNote}"` : ''}
                    </p>
                  )}

                  <div className="space-y-2 pt-1">
                    {topics.map((topic) => {
                      const key = `${student.id}-${selectedBimestre}-${topic.id}`;
                      const isChecked = Boolean(checkedTopics[key]);
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => toggleTopic(key)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors flex items-start gap-3 cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-50/70 border-emerald-200'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span
                            className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                              isChecked
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white border-slate-300'
                            }`}
                            aria-hidden="true"
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </span>
                          <span className="min-w-0">
                            <span
                              className={`block text-xs font-semibold ${
                                isChecked
                                  ? 'line-through text-slate-500'
                                  : 'text-slate-900'
                              }`}
                            >
                              {topic.title}
                            </span>
                            <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
                              {topic.actionHint}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                  15 min de prática por tópico
                </span>
                <button
                  type="button"
                  onClick={() => onOpenSubjectTasks(subject.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                >
                  Ver tarefas de {subject.shortName}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
