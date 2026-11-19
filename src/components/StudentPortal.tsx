import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Upload,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import {
  computeRecordAverage,
  formatScore,
  getScoreClassification,
  SUBJECT_MAP,
  SUBJECTS,
} from '../data/seedData';
import { Bimestre, SubjectId, SubmissionFileMeta } from '../types/school';
import { formatFileSize, getFileBlob, triggerFileDownload } from '../utils/fileStorage';
import { Avatar } from './Avatar';
import { BimestreTargetBar } from './BimestreTargetBar';
import { LiveActivityFeed } from './LiveActivityFeed';
import { PerformanceCharts } from './PerformanceCharts';
import { StudentTrajectoryChart } from './StudentTrajectoryChart';
import { StudyReinforcementCard } from './StudyReinforcementCard';

export type StudentSection = 'overview' | 'tasks' | 'grades';

interface StudentPortalProps {
  activeSection: StudentSection;
  onNavigateSection: (section: StudentSection) => void;
  onPreviewFile: (file: SubmissionFileMeta, studentName: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  activeSection,
  onNavigateSection,
  onPreviewFile,
}) => {
  const { state, activeStudentId, setActiveStudentId, submitAssignmentFile } = useSchool();

  const [selectedBimestre, setSelectedBimestre] = useState<Bimestre>(4);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>(
    'all'
  );
  const [subjectFilter, setSubjectFilter] = useState<'all' | SubjectId>('all');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const student = useMemo(
    () => state.students.find((s) => s.id === activeStudentId) ?? state.students[0],
    [state.students, activeStudentId]
  );

  const studentAssignments = useMemo(() => {
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
    return studentAssignments.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (subjectFilter !== 'all' && item.assignment.subjectId !== subjectFilter) return false;
      return true;
    });
  }, [studentAssignments, statusFilter, subjectFilter]);

  const overallBimestreAvg = useMemo(() => {
    const records = state.grades.filter(
      (g) => g.studentId === student.id && g.bimestre === selectedBimestre
    );
    if (records.length === 0) return 0;
    const sum = records.reduce((acc, r) => acc + computeRecordAverage(r), 0);
    return Math.round((sum / records.length) * 10) / 10;
  }, [state.grades, student.id, selectedBimestre]);

  const handleFileUpload = async (assignmentId: string, file: File | undefined) => {
    if (!file) return;
    setUploadingId(assignmentId);
    try {
      await submitAssignmentFile(
        assignmentId,
        student.id,
        file,
        noteDrafts[assignmentId] ?? ''
      );
      setNoteDrafts((prev) => {
        const next = { ...prev };
        delete next[assignmentId];
        return next;
      });
    } finally {
      setUploadingId(null);
    }
  };

  const handleDownloadFile = async (meta: SubmissionFileMeta) => {
    const rec = await getFileBlob(meta.fileId);
    if (rec) {
      triggerFileDownload(rec.blob, meta.fileName);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Identity & Bimestre Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={student.name} src={student.avatarUrl} size="md" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">{student.name}</span>
              <span className="text-xs text-slate-500 tabular-nums">
                · {student.classRoom} · Matrícula {student.registrationCode}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {(['stu-lucas', 'stu-sofia'] as const).map((id) => {
                const s = state.students.find((st) => st.id === id);
                if (!s) return null;
                const active = student.id === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveStudentId(id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s.name.split(' ')[0]} ({s.classRoom})
                  </button>
                );
              })}
            </div>
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

      {/* SECTION 1: SUBJECT BLOCKS OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Student KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">
                Média Geral · {selectedBimestre}º Bimestre
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
                {formatScore(overallBimestreAvg)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Meta escolar: 7,0</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">Tarefas Pendentes de Envio</p>
              <p className="text-3xl font-bold text-amber-600 mt-2 font-mono tabular-nums">
                {studentAssignments.filter((t) => t.status === 'pending').length}
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('pending');
                  onNavigateSection('tasks');
                }}
                className="text-xs font-semibold text-blue-600 hover:underline mt-1 cursor-pointer"
              >
                Enviar arquivos agora
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">Atividades Corrigidas</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2 font-mono tabular-nums">
                {studentAssignments.filter((t) => t.status === 'graded').length}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Frequência anual: {student.attendancePct}%
              </p>
            </div>
          </div>

          <BimestreTargetBar
            currentAverage={overallBimestreAvg}
            targetScore={7.0}
            selectedBimestre={selectedBimestre}
          />

          {/* Colorful Subject Blocks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Minhas Matérias · {selectedBimestre}º Bimestre
              </h2>
              <span className="text-xs text-slate-500">
                Clique em qualquer bloco para abrir as tarefas da disciplina
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {SUBJECTS.map((subject) => {
                const record = state.grades.find(
                  (g) =>
                    g.studentId === student.id &&
                    g.subjectId === subject.id &&
                    g.bimestre === selectedBimestre
                );
                const avg = record ? computeRecordAverage(record) : 0;
                const status = getScoreClassification(avg);
                const pendingCount = studentAssignments.filter(
                  (t) => t.assignment.subjectId === subject.id && t.status === 'pending'
                ).length;

                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => {
                      setSubjectFilter(subject.id);
                      setStatusFilter('all');
                      onNavigateSection('tasks');
                    }}
                    className="text-left bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors cursor-pointer flex flex-col"
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
                        <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
                          {pendingCount > 0
                            ? `${pendingCount} tarefa(s) pendente(s)`
                            : 'Sem pendências de entrega'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <StudyReinforcementCard
            student={student}
            grades={state.grades}
            selectedBimestre={selectedBimestre}
            onSelectBimestre={setSelectedBimestre}
            onOpenSubjectTasks={(subjectId) => {
              setSubjectFilter(subjectId);
              setStatusFilter('all');
              onNavigateSection('tasks');
            }}
          />

          <StudentTrajectoryChart
            grades={state.grades}
            studentId={student.id}
            selectedBimestre={selectedBimestre}
            studentName={student.name}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-900">
                  Próximas Entregas
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigateSection('tasks')}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Abrir todas as tarefas
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {studentAssignments.slice(0, 4).map(({ assignment, status, submission }) => {
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
                            {subj.name} · Entrega{' '}
                            {new Date(assignment.dueDate + 'T12:00:00').toLocaleDateString(
                              'pt-BR'
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {status === 'graded' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 font-mono tabular-nums">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Nota {formatScore(submission?.score ?? 0)}
                          </span>
                        ) : status === 'submitted' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                            <Clock className="w-3.5 h-3.5" />
                            Enviada
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSubjectFilter(assignment.subjectId);
                              setStatusFilter('pending');
                              onNavigateSection('tasks');
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Enviar arquivo
                          </button>
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

      {/* SECTION 2: TASKS & FILE UPLOAD */}
      {activeSection === 'tasks' && (
        <div className="space-y-5">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  ['all', 'Todas'],
                  ['pending', 'Pendentes'],
                  ['submitted', 'Enviadas'],
                  ['graded', 'Corrigidas'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === key
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value as 'all' | SubjectId)}
              aria-label="Filtrar por disciplina"
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              <option value="all">Todas as disciplinas</option>
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <p className="text-sm font-semibold text-slate-900">
                Nenhuma tarefa encontrada neste filtro
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setSubjectFilter('all');
                }}
                className="mt-3 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
              >
                Mostrar todas as tarefas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredTasks.map(({ assignment, submission, status }) => {
                const subj = SUBJECT_MAP[assignment.subjectId];
                const isUploading = uploadingId === assignment.id;
                const isDragActive = dragTargetId === assignment.id;

                return (
                  <div
                    key={assignment.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div
                        className="h-2 w-full"
                        style={{ backgroundColor: subj.accentHex }}
                      />
                      <div className="p-6">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 tabular-nums">
                          <span className="font-semibold" style={{ color: subj.textHex }}>
                            {subj.name} · {assignment.bimestre}º Bimestre
                          </span>
                          <span>
                            Prazo:{' '}
                            {new Date(assignment.dueDate + 'T12:00:00').toLocaleDateString(
                              'pt-BR'
                            )}
                          </span>
                        </div>

                        <h3 className="text-base font-semibold text-slate-900 mt-1.5">
                          {assignment.title}
                        </h3>
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                          {assignment.description}
                        </p>

                        {/* Graded Feedback */}
                        {status === 'graded' && submission && (
                          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                                <CheckCircle2 className="w-4 h-4" />
                                Tarefa Corrigida
                              </span>
                              <span className="text-base font-bold text-emerald-900 font-mono tabular-nums">
                                {formatScore(submission.score ?? 0)} / 10,0
                              </span>
                            </div>
                            {submission.feedback && (
                              <p className="text-xs text-emerald-900 mt-2 leading-relaxed">
                                {submission.feedback}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Submitted File Info */}
                        {submission?.file && (
                          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-2">
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
                                Ver
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
                        )}

                        {/* Interactive Upload Zone (if pending or submitted before grading) */}
                        {status !== 'graded' && (
                          <div className="mt-4 space-y-3">
                            <input
                              type="text"
                              placeholder="Observação opcional sobre o seu arquivo..."
                              value={noteDrafts[assignment.id] ?? ''}
                              onChange={(e) =>
                                setNoteDrafts((prev) => ({
                                  ...prev,
                                  [assignment.id]: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <div
                              onDragOver={(e) => {
                                e.preventDefault();
                                setDragTargetId(assignment.id);
                              }}
                              onDragLeave={() => setDragTargetId(null)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setDragTargetId(null);
                                const dropped = e.dataTransfer.files?.[0];
                                handleFileUpload(assignment.id, dropped);
                              }}
                              className={`border border-dashed rounded-xl p-4 text-center transition-colors ${
                                isDragActive
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-slate-300 bg-slate-50/70 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                ref={(el) => {
                                  fileInputsRef.current[assignment.id] = el;
                                }}
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const picked = e.target.files?.[0];
                                  handleFileUpload(assignment.id, picked);
                                  e.target.value = '';
                                }}
                              />
                              <Upload className="w-5 h-5 text-slate-500 mx-auto mb-1.5" />
                              <p className="text-xs font-medium text-slate-700">
                                {isUploading
                                  ? 'Enviando arquivo...'
                                  : status === 'submitted'
                                  ? 'Arraste outro arquivo para substituir o envio'
                                  : 'Arraste seu arquivo aqui (PDF, imagem, DOC, TXT)'}
                              </p>
                              <button
                                type="button"
                                disabled={isUploading}
                                onClick={() => fileInputsRef.current[assignment.id]?.click()}
                                className="mt-2.5 inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                              >
                                {status === 'submitted'
                                  ? 'Substituir arquivo'
                                  : 'Selecionar arquivo'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: STUDENT GRADES REPORT */}
      {activeSection === 'grades' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Boletim Individual · {selectedBimestre}º Bimestre
                </h2>
                <p className="text-xs text-slate-500">
                  Notas atualizadas automaticamente após cada correção ou lançamento docente
                </p>
              </div>
              <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                Média Geral: {formatScore(overallBimestreAvg)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-5">Disciplina</th>
                    <th className="py-3 px-4 text-right">Prova 1</th>
                    <th className="py-3 px-4 text-right">Prova 2</th>
                    <th className="py-3 px-4 text-right">Tarefas</th>
                    <th className="py-3 px-4 text-right">Média Bimestral</th>
                    <th className="py-3 px-4">Situação</th>
                    <th className="py-3 px-5">Comentário do Professor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {SUBJECTS.map((subject) => {
                    const rec = state.grades.find(
                      (g) =>
                        g.studentId === student.id &&
                        g.subjectId === subject.id &&
                        g.bimestre === selectedBimestre
                    );
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
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {formatScore(rec.exam1)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {formatScore(rec.exam2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {formatScore(rec.homeworkAvg)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatScore(avg)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold ${
                              status.tone === 'attention'
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {status.label}
                          </span>
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
    </div>
  );
};
