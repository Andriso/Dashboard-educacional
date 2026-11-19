import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Send,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import {
  computeRecordAverage,
  formatScore,
  getScoreClassification,
  PARENT_PROFILE,
  SUBJECT_MAP,
  SUBJECTS,
} from '../data/seedData';
import { Bimestre, SubjectId, SubmissionFileMeta } from '../types/school';
import { formatFileSize, getFileBlob, triggerFileDownload } from '../utils/fileStorage';
import { Avatar } from './Avatar';
import { LiveActivityFeed } from './LiveActivityFeed';
import { PerformanceCharts } from './PerformanceCharts';

export type ParentSection = 'overview' | 'grades' | 'tasks' | 'messages';

interface ParentDashboardProps {
  activeSection: ParentSection;
  onNavigateSection: (section: ParentSection) => void;
  onPreviewFile: (file: SubmissionFileMeta, studentName: string) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  activeSection,
  onNavigateSection,
  onPreviewFile,
}) => {
  const { state, activeStudentId, setActiveStudentId, sendMessage } = useSchool();

  const [selectedBimestre, setSelectedBimestre] = useState<Bimestre>(4);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>(
    'all'
  );
  const [messageSubject, setMessageSubject] = useState<SubjectId>('math');
  const [messageText, setMessageText] = useState('');

  const children = useMemo(
    () => state.students.filter((s) => s.guardianName === 'Mariana Oliveira'),
    [state.students]
  );

  const student = useMemo(
    () => children.find((c) => c.id === activeStudentId) ?? children[0] ?? state.students[0],
    [children, activeStudentId, state.students]
  );

  const bimestreGrades = useMemo(
    () =>
      state.grades.filter(
        (g) => g.studentId === student.id && g.bimestre === selectedBimestre
      ),
    [state.grades, student.id, selectedBimestre]
  );

  const overallAverage = useMemo(() => {
    if (bimestreGrades.length === 0) return 0;
    const sum = bimestreGrades.reduce((acc, r) => acc + computeRecordAverage(r), 0);
    return Math.round((sum / bimestreGrades.length) * 10) / 10;
  }, [bimestreGrades]);

  const attentionSubjects = useMemo(() => {
    return bimestreGrades.filter((g) => computeRecordAverage(g) < 7.0);
  }, [bimestreGrades]);

  const studentTasks = useMemo(() => {
    return state.assignments
      .filter((a) => a.classRoom === student.classRoom)
      .map((assignment) => {
        const submission = state.submissions.find(
          (s) => s.assignmentId === assignment.id && s.studentId === student.id
        );
        return {
          assignment,
          submission,
          status: submission?.status ?? 'pending',
        };
      });
  }, [state.assignments, state.submissions, student]);

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'all') return studentTasks;
    return studentTasks.filter((t) => t.status === taskFilter);
  }, [studentTasks, taskFilter]);

  const deliveredCount = studentTasks.filter((t) => t.status !== 'pending').length;

  const conversation = useMemo(
    () => state.messages.filter((m) => m.studentId === student.id),
    [state.messages, student.id]
  );

  const handleDownloadFile = async (meta: SubmissionFileMeta) => {
    const rec = await getFileBlob(meta.fileId);
    if (rec) {
      triggerFileDownload(rec.blob, meta.fileName);
    }
  };

  return (
    <div className="space-y-6">
      {/* Guardian Child Selector & Bimestre Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <Avatar
              name={PARENT_PROFILE.name}
              src={PARENT_PROFILE.avatarUrl}
              size="md"
              accentHex="#7C3AED"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">{PARENT_PROFILE.name}</p>
              <p className="text-xs text-slate-500">Acompanhamento Familiar</p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <div className="flex flex-wrap items-center gap-2">
            {children.map((child) => {
              const active = child.id === student.id;
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setActiveStudentId(child.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Avatar name={child.name} src={child.avatarUrl} size="sm" />
                  <span>
                    {child.name.split(' ')[0]} · {child.classRoom}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {([1, 2, 3, 4] as Bimestre[]).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setSelectedBimestre(b)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                selectedBimestre === b
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {b}º Bim
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* 4 KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">
                Média Geral · {selectedBimestre}º Bimestre
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
                {formatScore(overallAverage)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {overallAverage >= 7 ? 'Acima da meta escolar (7,0)' : 'Abaixo da meta (7,0)'}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">Frequência Escolar</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2 font-mono tabular-nums">
                {student.attendancePct}%
              </p>
              <p className="text-xs text-slate-500 mt-1">Presença regular registrada</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">Tarefas Entregues</p>
              <p className="text-3xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
                {deliveredCount}/{studentTasks.length}
              </p>
              <button
                type="button"
                onClick={() => onNavigateSection('tasks')}
                className="text-xs font-semibold text-blue-600 hover:underline mt-1 cursor-pointer"
              >
                Ver arquivos e entregas
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">Disciplinas em Atenção</p>
              <p
                className={`text-3xl font-bold mt-2 font-mono tabular-nums ${
                  attentionSubjects.length > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {attentionSubjects.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {attentionSubjects.length > 0
                  ? attentionSubjects
                      .map((r) => SUBJECT_MAP[r.subjectId].name)
                      .join(', ')
                  : 'Todas com média ≥ 7,0'}
              </p>
            </div>
          </div>

          {/* Colorful Subject Summary Blocks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Desempenho por Matéria · {student.name.split(' ')[0]}
              </h2>
              <button
                type="button"
                onClick={() => onNavigateSection('grades')}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Abrir boletim completo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {SUBJECTS.map((subject) => {
                const record = bimestreGrades.find((g) => g.subjectId === subject.id);
                const avg = record ? computeRecordAverage(record) : 0;
                const status = getScoreClassification(avg);
                return (
                  <div
                    key={subject.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between"
                  >
                    <div
                      className="h-2 w-full"
                      style={{ backgroundColor: subject.accentHex }}
                    />
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <p
                          className="text-xs font-semibold"
                          style={{ color: subject.textHex }}
                        >
                          {subject.shortName} · {subject.teacherName}
                        </p>
                        <h3 className="text-base font-semibold text-slate-900 mt-1">
                          {subject.name}
                        </h3>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-baseline justify-between">
                          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                            {formatScore(avg)}
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              status.tone === 'attention'
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {status.label}
                          </span>
                        </div>
                        {record?.teacherNote && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                            {record.teacherNote}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <PerformanceCharts
            grades={state.grades}
            studentId={student.id}
            selectedBimestre={selectedBimestre}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-900">
                  Acompanhamento de Tarefas e Arquivos
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigateSection('tasks')}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Ver detalhes
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {studentTasks.slice(0, 4).map(({ assignment, submission, status }) => {
                  const subj = SUBJECT_MAP[assignment.subjectId];
                  return (
                    <div
                      key={assignment.id}
                      className="py-3 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-sm mt-1.5 shrink-0"
                          style={{ backgroundColor: subj.accentHex }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {assignment.title}
                          </p>
                          <p className="text-xs text-slate-500 tabular-nums">
                            {subj.name} · Prazo{' '}
                            {new Date(assignment.dueDate + 'T12:00:00').toLocaleDateString(
                              'pt-BR'
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {submission?.file && (
                          <button
                            type="button"
                            onClick={() => onPreviewFile(submission.file!, student.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Arquivo
                          </button>
                        )}
                        {status === 'graded' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 font-mono tabular-nums">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {formatScore(submission?.score ?? 0)}
                          </span>
                        ) : status === 'submitted' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                            <Clock className="w-3.5 h-3.5" />
                            Entregue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5">
              <LiveActivityFeed activities={state.activities} limit={5} />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: FULL REPORT CARD */}
      {activeSection === 'grades' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Boletim Escolar · {student.name} ({student.classRoom})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  {selectedBimestre}º Bimestre selecionado · Média bimestral e média acumulada
                  anual
                </p>
              </div>
              <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                Média Geral do Bimestre: {formatScore(overallAverage)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-5">Disciplina</th>
                    <th className="py-3 px-3 text-right">Prova 1</th>
                    <th className="py-3 px-3 text-right">Prova 2</th>
                    <th className="py-3 px-3 text-right">Tarefas</th>
                    <th className="py-3 px-3 text-right">Média {selectedBimestre}º Bim</th>
                    <th className="py-3 px-3 text-right">Média Anual</th>
                    <th className="py-3 px-4">Situação</th>
                    <th className="py-3 px-5">Devolutiva Docente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {SUBJECTS.map((subject) => {
                    const rec = bimestreGrades.find((g) => g.subjectId === subject.id);
                    const allYear = state.grades.filter(
                      (g) => g.studentId === student.id && g.subjectId === subject.id
                    );
                    const annualAvg =
                      allYear.length > 0
                        ? Math.round(
                            (allYear.reduce((s, r) => s + computeRecordAverage(r), 0) /
                              allYear.length) *
                              10
                          ) / 10
                        : 0;

                    if (!rec) return null;
                    const avg = computeRecordAverage(rec);
                    const status = getScoreClassification(avg);

                    return (
                      <tr key={subject.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-2.5 h-2.5 rounded-sm shrink-0"
                              style={{ backgroundColor: subject.accentHex }}
                              aria-hidden="true"
                            />
                            <div>
                              <p className="font-semibold text-slate-900">{subject.name}</p>
                              <p className="text-xs text-slate-500">{subject.teacherName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                          {formatScore(rec.exam1)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                          {formatScore(rec.exam2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                          {formatScore(rec.homeworkAvg)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatScore(avg)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                          {formatScore(annualAvg)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {status.tone === 'attention' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {status.label}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {status.label}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-xs text-slate-600">
                          {rec.teacherNote}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <PerformanceCharts
            grades={state.grades}
            studentId={student.id}
            selectedBimestre={selectedBimestre}
          />
        </div>
      )}

      {/* SECTION 3: TASKS & SUBMITTED FILES EVIDENCE */}
      {activeSection === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Tarefas e Arquivos Enviados · {student.name}
            </h2>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  ['all', 'Todas'],
                  ['pending', 'Pendentes'],
                  ['submitted', 'Entregues'],
                  ['graded', 'Corrigidas'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTaskFilter(key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    taskFilter === key
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredTasks.map(({ assignment, submission, status }) => {
              const subj = SUBJECT_MAP[assignment.subjectId];
              return (
                <div
                  key={assignment.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                >
                  <div
                    className="h-2 w-full"
                    style={{ backgroundColor: subj.accentHex }}
                  />
                  <div className="p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 tabular-nums">
                      <span className="font-semibold" style={{ color: subj.textHex }}>
                        {subj.name} · {assignment.bimestre}º Bimestre
                      </span>
                      <span>
                        Prazo:{' '}
                        {new Date(assignment.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                        {assignment.description}
                      </p>
                    </div>

                    {submission?.file ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {submission.file.fileName}
                            </p>
                            <p className="text-[11px] text-slate-500 tabular-nums">
                              {formatFileSize(submission.file.fileSize)} · Enviado em{' '}
                              {new Date(submission.file.uploadedAt).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onPreviewFile(submission.file!, student.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Visualizar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(submission.file!)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Baixar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>
                          Aguardando o envio do arquivo pelo estudante no Portal do Aluno.
                        </span>
                      </div>
                    )}

                    {status === 'graded' && submission && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                          <span>Avaliado por {assignment.createdBy}</span>
                          <span className="font-mono text-sm tabular-nums">
                            Nota: {formatScore(submission.score ?? 0)} / 10,0
                          </span>
                        </div>
                        {submission.feedback && (
                          <p className="text-xs text-emerald-900 mt-1.5 leading-relaxed">
                            {submission.feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 4: GUARDIAN MESSAGES */}
      {activeSection === 'messages' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              Comunicação com a Escola · {student.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Converse diretamente com a equipe docente e coordenação
            </p>
          </div>

          <div className="p-6 space-y-4 bg-slate-50 max-h-[400px] overflow-y-auto">
            {conversation.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                Nenhuma mensagem registrada para {student.name} ainda.
              </p>
            ) : (
              conversation.map((msg) => {
                const isParent = msg.senderRole === 'parent';
                const subj = SUBJECT_MAP[msg.subjectId];
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isParent ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-lg rounded-xl p-4 border ${
                        isParent
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-800 border-slate-200'
                      }`}
                    >
                      <p
                        className={`text-[11px] font-semibold mb-1 ${
                          isParent ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {msg.senderName} · {subj.name}
                      </p>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 tabular-nums">
                      {new Date(msg.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!messageText.trim()) return;
              sendMessage(
                student.id,
                messageSubject,
                'parent',
                PARENT_PROFILE.name,
                messageText
              );
              setMessageText('');
            }}
            className="p-4 border-t border-slate-200 bg-white flex flex-wrap items-center gap-3"
          >
            <select
              value={messageSubject}
              onChange={(e) => setMessageSubject(e.target.value as SubjectId)}
              aria-label="Disciplina da mensagem"
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Escreva uma mensagem para a professora..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 min-w-[200px] px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar mensagem
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
