import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Plus,
  Send,
  X,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import {
  computeRecordAverage,
  formatScore,
  getScoreClassification,
  SUBJECT_MAP,
  SUBJECTS,
  TEACHER_PROFILE,
} from '../data/seedData';
import { Bimestre, GradeRecord, SubjectId, SubmissionFileMeta } from '../types/school';
import { formatFileSize, getFileBlob, triggerFileDownload } from '../utils/fileStorage';
import { Avatar } from './Avatar';
import { LiveActivityFeed } from './LiveActivityFeed';

export type TeacherSection = 'overview' | 'grades' | 'assignments' | 'messages';

interface TeacherDashboardProps {
  activeSection: TeacherSection;
  onNavigateSection: (section: TeacherSection) => void;
  onPreviewFile: (file: SubmissionFileMeta, studentName: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  activeSection,
  onNavigateSection,
  onPreviewFile,
}) => {
  const { state, updateGrade, createAssignment, gradeSubmission, sendMessage } = useSchool();

  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('math');
  const [selectedClass, setSelectedClass] = useState<'all' | '8º Ano A' | '6º Ano B'>('all');
  const [selectedBimestre, setSelectedBimestre] = useState<Bimestre>(4);

  // New Assignment Modal
  const [showNewAssignment, setShowNewAssignment] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSubject, setNewSubject] = useState<SubjectId>('math');
  const [newClassRoom, setNewClassRoom] = useState<'8º Ano A' | '6º Ano B'>('8º Ano A');
  const [newBimestre, setNewBimestre] = useState<Bimestre>(4);
  const [newDueDate, setNewDueDate] = useState('2026-11-28');
  const [formError, setFormError] = useState('');

  // Grading Drawer / Selected Assignment
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    () => state.assignments[0]?.id ?? ''
  );
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});

  // Gradebook local edits
  const [gradeDrafts, setGradeDrafts] = useState<
    Record<string, { exam1: string; exam2: string; homeworkAvg: string; teacherNote: string }>
  >({});

  // Messages state
  const [messageStudentId, setMessageStudentId] = useState<string>('stu-lucas');
  const [messageSubjectId, setMessageSubjectId] = useState<SubjectId>('math');
  const [messageText, setMessageText] = useState('');

  const filteredStudents = useMemo(() => {
    if (selectedClass === 'all') return state.students;
    return state.students.filter((s) => s.classRoom === selectedClass);
  }, [state.students, selectedClass]);

  const pendingCorrectionSubmissions = useMemo(() => {
    return state.submissions
      .filter((s) => s.status === 'submitted')
      .map((sub) => {
        const assignment = state.assignments.find((a) => a.id === sub.assignmentId);
        const student = state.students.find((st) => st.id === sub.studentId);
        return { sub, assignment, student };
      })
      .filter((item) => item.assignment && item.student);
  }, [state.submissions, state.assignments, state.students]);

  const classAverage = useMemo(() => {
    const relevant = state.grades.filter((g) => {
      if (g.bimestre !== selectedBimestre) return false;
      if (selectedClass === 'all') return true;
      const st = state.students.find((s) => s.id === g.studentId);
      return st?.classRoom === selectedClass;
    });
    if (relevant.length === 0) return 0;
    const total = relevant.reduce((sum, r) => sum + computeRecordAverage(r), 0);
    return Math.round((total / relevant.length) * 10) / 10;
  }, [state.grades, state.students, selectedBimestre, selectedClass]);

  const submissionRatePct = useMemo(() => {
    if (state.submissions.length === 0) return 0;
    const delivered = state.submissions.filter((s) => s.status !== 'pending').length;
    return Math.round((delivered / state.submissions.length) * 100);
  }, [state.submissions]);

  const handleDownloadFile = async (meta: SubmissionFileMeta) => {
    const rec = await getFileBlob(meta.fileId);
    if (rec) {
      triggerFileDownload(rec.blob, meta.fileName);
    }
  };

  const handleCreateAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newDueDate) {
      setFormError('Preencha título, descrição e prazo de entrega.');
      return;
    }
    createAssignment({
      title: newTitle,
      description: newDescription,
      subjectId: newSubject,
      classRoom: newClassRoom,
      bimestre: newBimestre,
      dueDate: newDueDate,
    });
    setNewTitle('');
    setNewDescription('');
    setFormError('');
    setShowNewAssignment(false);
    onNavigateSection('assignments');
  };

  const getGradeDraft = (record: GradeRecord) => {
    return (
      gradeDrafts[record.id] ?? {
        exam1: record.exam1.toFixed(1),
        exam2: record.exam2.toFixed(1),
        homeworkAvg: record.homeworkAvg.toFixed(1),
        teacherNote: record.teacherNote,
      }
    );
  };

  const handleSaveGradeRow = (record: GradeRecord) => {
    const draft = getGradeDraft(record);
    const e1 = parseFloat(draft.exam1.replace(',', '.'));
    const e2 = parseFloat(draft.exam2.replace(',', '.'));
    const hw = parseFloat(draft.homeworkAvg.replace(',', '.'));
    updateGrade(record.id, {
      exam1: Number.isNaN(e1) ? record.exam1 : e1,
      exam2: Number.isNaN(e2) ? record.exam2 : e2,
      homeworkAvg: Number.isNaN(hw) ? record.homeworkAvg : hw,
      teacherNote: draft.teacherNote,
    });
    setGradeDrafts((prev) => {
      const next = { ...prev };
      delete next[record.id];
      return next;
    });
  };

  const activeAssignment = useMemo(() => {
    return (
      state.assignments.find((a) => a.id === selectedAssignmentId) ??
      state.assignments[0] ??
      null
    );
  }, [state.assignments, selectedAssignmentId]);

  const activeAssignmentSubmissions = useMemo(() => {
    if (!activeAssignment) return [];
    const classStudents = state.students.filter(
      (s) => s.classRoom === activeAssignment.classRoom
    );
    return classStudents.map((student) => {
      const sub = state.submissions.find(
        (s) => s.assignmentId === activeAssignment.id && s.studentId === student.id
      );
      return { student, sub };
    });
  }, [activeAssignment, state.students, state.submissions]);

  const studentMessages = useMemo(() => {
    return state.messages.filter((m) => m.studentId === messageStudentId);
  }, [state.messages, messageStudentId]);

  return (
    <div className="space-y-6">
      {/* Workspace Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['all', '8º Ano A', '6º Ano B'] as const).map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedClass === cls
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cls === 'all' ? 'Todas as turmas' : cls}
              </button>
            ))}
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

        <button
          type="button"
          onClick={() => {
            setNewSubject(selectedSubject);
            setNewBimestre(selectedBimestre);
            setShowNewAssignment(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </button>
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
                {formatScore(classAverage)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Escala oficial de 0,0 a 10,0</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">
                Arquivos Aguardando Correção
              </p>
              <p className="text-3xl font-bold text-amber-600 mt-2 font-mono tabular-nums">
                {pendingCorrectionSubmissions.length}
              </p>
              <button
                type="button"
                onClick={() => onNavigateSection('assignments')}
                className="text-xs font-semibold text-blue-600 hover:underline mt-1 cursor-pointer"
              >
                Abrir fila de correção
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">Tarefas Publicadas</p>
              <p className="text-3xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
                {state.assignments.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Atividades ativas nas turmas</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">Taxa de Entregas</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2 font-mono tabular-nums">
                {submissionRatePct}%
              </p>
              <p className="text-xs text-slate-500 mt-1">Com envio digital anexado</p>
            </div>
          </div>

          {/* Colorful Subject Blocks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Blocos por Disciplina · {selectedBimestre}º Bimestre
              </h2>
              <span className="text-xs text-slate-500">
                Selecione uma matéria para editar o diário de notas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {SUBJECTS.map((subject) => {
                const subGrades = state.grades.filter((g) => {
                  if (g.subjectId !== subject.id || g.bimestre !== selectedBimestre) return false;
                  if (selectedClass === 'all') return true;
                  const stu = state.students.find((s) => s.id === g.studentId);
                  return stu?.classRoom === selectedClass;
                });
                const subAvg =
                  subGrades.length > 0
                    ? subGrades.reduce((s, r) => s + computeRecordAverage(r), 0) /
                      subGrades.length
                    : 0;

                const subTasks = state.assignments.filter((a) => a.subjectId === subject.id);
                const awaitingCount = state.submissions.filter(
                  (s) =>
                    s.status === 'submitted' &&
                    subTasks.some((a) => a.id === s.assignmentId)
                ).length;

                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => {
                      setSelectedSubject(subject.id);
                      onNavigateSection('grades');
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
                          {subject.shortName} · {subject.weeklyHours}h/sem
                        </p>
                        <h3 className="text-base font-semibold text-slate-900 mt-1">
                          {subject.name}
                        </h3>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                        <div>
                          <span className="text-[11px] text-slate-500 block">Média turma</span>
                          <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                            {formatScore(subAvg)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 block">A corrigir</span>
                          <span className="text-sm font-semibold text-slate-800 font-mono tabular-nums">
                            {awaitingCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pending Correction Queue + Live Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Entregas Recentes para Correção
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Visualize ou baixe os arquivos enviados pelos alunos e lance a nota
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateSection('assignments')}
                  className="text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Ver todas
                </button>
              </div>

              {pendingCorrectionSubmissions.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  Todas as tarefas enviadas até agora já foram corrigidas.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingCorrectionSubmissions.map(({ sub, assignment, student }) => {
                    if (!assignment || !student) return null;
                    const subj = SUBJECT_MAP[assignment.subjectId];
                    return (
                      <div
                        key={sub.id}
                        className="py-3.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            name={student.name}
                            src={student.avatarUrl}
                            size="sm"
                            accentHex={subj.accentHex}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {student.name} · {assignment.title}
                            </p>
                            <p className="text-xs text-slate-500 truncate tabular-nums">
                              {subj.name} · {student.classRoom} · {sub.file?.fileName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {sub.file && (
                            <button
                              type="button"
                              onClick={() => onPreviewFile(sub.file!, student.name)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Visualizar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAssignmentId(assignment.id);
                              onNavigateSection('assignments');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Corrigir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <LiveActivityFeed activities={state.activities} limit={5} />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: GRADEBOOK (0-10) */}
      {activeSection === 'grades' && (
        <div className="space-y-4">
          {/* Subject Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {SUBJECTS.map((subject) => {
              const active = selectedSubject === subject.id;
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => setSelectedSubject(subject.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-white border-transparent'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                  style={
                    active
                      ? { backgroundColor: subject.accentHex }
                      : undefined
                  }
                >
                  <span
                    className="w-2 h-2 rounded-xs"
                    style={{ backgroundColor: active ? '#FFFFFF' : subject.accentHex }}
                    aria-hidden="true"
                  />
                  {subject.name}
                </button>
              );
            })}
          </div>

          {/* High-Density Grade Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: SUBJECT_MAP[selectedSubject].accentHex }}
            />
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Diário de Notas · {SUBJECT_MAP[selectedSubject].name} · {selectedBimestre}º
                  Bimestre
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Edite as notas de 0,0 a 10,0. A média e o boletim dos pais são atualizados em
                  tempo real ao salvar.
                </p>
              </div>
              <span className="text-xs text-slate-500 tabular-nums">
                {filteredStudents.length} estudantes exibidos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Estudante</th>
                    <th className="py-3 px-3">Turma</th>
                    <th className="py-3 px-3 text-right">Prova 1</th>
                    <th className="py-3 px-3 text-right">Prova 2</th>
                    <th className="py-3 px-3 text-right">Tarefas</th>
                    <th className="py-3 px-3 text-right">Média</th>
                    <th className="py-3 px-3">Situação</th>
                    <th className="py-3 px-4">Observação para os pais</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredStudents.map((student) => {
                    const record = state.grades.find(
                      (g) =>
                        g.studentId === student.id &&
                        g.subjectId === selectedSubject &&
                        g.bimestre === selectedBimestre
                    );
                    if (!record) return null;

                    const draft = getGradeDraft(record);
                    const previewAvg = (() => {
                      const e1 = parseFloat(draft.exam1.replace(',', '.'));
                      const e2 = parseFloat(draft.exam2.replace(',', '.'));
                      const hw = parseFloat(draft.homeworkAvg.replace(',', '.'));
                      const safeE1 = Number.isNaN(e1) ? record.exam1 : Math.min(10, Math.max(0, e1));
                      const safeE2 = Number.isNaN(e2) ? record.exam2 : Math.min(10, Math.max(0, e2));
                      const safeHw = Number.isNaN(hw)
                        ? record.homeworkAvg
                        : Math.min(10, Math.max(0, hw));
                      return Math.round(((safeE1 + safeE2 + safeHw) / 3) * 10) / 10;
                    })();

                    const classification = getScoreClassification(previewAvg);
                    const isDirty = Boolean(gradeDrafts[record.id]);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              name={student.name}
                              src={student.avatarUrl}
                              size="sm"
                              accentHex={SUBJECT_MAP[selectedSubject].accentHex}
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-sm whitespace-nowrap">
                                {student.name}
                              </p>
                              <p className="text-xs text-slate-500 font-mono tabular-nums">
                                {student.registrationCode}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-600 whitespace-nowrap">
                          {student.classRoom}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            aria-label={`Prova 1 de ${student.name}`}
                            value={draft.exam1}
                            onChange={(e) =>
                              setGradeDrafts((prev) => ({
                                ...prev,
                                [record.id]: { ...draft, exam1: e.target.value },
                              }))
                            }
                            className="w-16 text-right px-2 py-1 text-sm font-mono tabular-nums border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            aria-label={`Prova 2 de ${student.name}`}
                            value={draft.exam2}
                            onChange={(e) =>
                              setGradeDrafts((prev) => ({
                                ...prev,
                                [record.id]: { ...draft, exam2: e.target.value },
                              }))
                            }
                            className="w-16 text-right px-2 py-1 text-sm font-mono tabular-nums border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            aria-label={`Nota de tarefas de ${student.name}`}
                            value={draft.homeworkAvg}
                            onChange={(e) =>
                              setGradeDrafts((prev) => ({
                                ...prev,
                                [record.id]: { ...draft, homeworkAvg: e.target.value },
                              }))
                            }
                            className="w-16 text-right px-2 py-1 text-sm font-mono tabular-nums border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatScore(previewAvg)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {classification.tone === 'excellent' && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {classification.label}
                            </span>
                          )}
                          {classification.tone === 'nominal' && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {classification.label}
                            </span>
                          )}
                          {classification.tone === 'attention' && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {classification.label}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 min-w-[240px]">
                          <input
                            type="text"
                            aria-label={`Observação de ${student.name}`}
                            value={draft.teacherNote}
                            onChange={(e) =>
                              setGradeDrafts((prev) => ({
                                ...prev,
                                [record.id]: { ...draft, teacherNote: e.target.value },
                              }))
                            }
                            className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleSaveGradeRow(record)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                              isDirty
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isDirty ? 'Salvar' : 'Atualizar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ASSIGNMENTS & FILE GRADING */}
      {activeSection === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Assignments List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Tarefas Publicadas ({state.assignments.length})
              </h2>
            </div>

            {state.assignments
              .filter((a) => selectedClass === 'all' || a.classRoom === selectedClass)
              .map((assignment) => {
                const subj = SUBJECT_MAP[assignment.subjectId];
                const subs = state.submissions.filter((s) => s.assignmentId === assignment.id);
                const submittedCount = subs.filter((s) => s.status !== 'pending').length;
                const awaitingCount = subs.filter((s) => s.status === 'submitted').length;
                const isSelected = activeAssignment?.id === assignment.id;

                return (
                  <button
                    key={assignment.id}
                    type="button"
                    onClick={() => setSelectedAssignmentId(assignment.id)}
                    className={`w-full text-left bg-white border rounded-xl overflow-hidden transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className="h-1.5 w-full"
                      style={{ backgroundColor: subj.accentHex }}
                    />
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="font-semibold" style={{ color: subj.textHex }}>
                          {subj.name}
                        </span>
                        <span className="tabular-nums">
                          {assignment.classRoom} · {assignment.bimestre}º Bim
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mt-1">
                        {assignment.title}
                      </h3>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 tabular-nums">
                        <span>
                          Entregas: {submittedCount}/{subs.length}
                        </span>
                        {awaitingCount > 0 ? (
                          <span className="font-semibold text-amber-700">
                            {awaitingCount} para corrigir
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-700">Em dia</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>

          {/* Grading Queue for Selected Assignment */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            {activeAssignment ? (
              <>
                <div
                  className="h-2 w-full"
                  style={{
                    backgroundColor: SUBJECT_MAP[activeAssignment.subjectId].accentHex,
                  }}
                />
                <div className="p-6 border-b border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 tabular-nums">
                    <span
                      className="font-semibold"
                      style={{
                        color: SUBJECT_MAP[activeAssignment.subjectId].textHex,
                      }}
                    >
                      {SUBJECT_MAP[activeAssignment.subjectId].name} ·{' '}
                      {activeAssignment.classRoom}
                    </span>
                    <span>
                      {activeAssignment.bimestre}º Bimestre · Prazo:{' '}
                      {new Date(activeAssignment.dueDate + 'T12:00:00').toLocaleDateString(
                        'pt-BR'
                      )}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mt-1">
                    {activeAssignment.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {activeAssignment.description}
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {activeAssignmentSubmissions.map(({ student, sub }) => {
                    const draftScore =
                      scoreDrafts[sub?.id ?? ''] ??
                      (sub?.score !== undefined ? sub.score.toFixed(1) : '8.5');
                    const draftFeedback =
                      feedbackDrafts[sub?.id ?? ''] ?? sub?.feedback ?? '';

                    return (
                      <div key={student.id} className="p-5 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={student.name}
                              src={student.avatarUrl}
                              size="md"
                              accentHex={
                                SUBJECT_MAP[activeAssignment.subjectId].accentHex
                              }
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {student.name}
                              </p>
                              <p className="text-xs text-slate-500 tabular-nums">
                                Matrícula {student.registrationCode} ·{' '}
                                {sub?.status === 'graded'
                                  ? `Corrigida (${formatScore(sub.score ?? 0)})`
                                  : sub?.status === 'submitted'
                                  ? 'Arquivo enviado para correção'
                                  : 'Aguardando envio do aluno'}
                              </p>
                            </div>
                          </div>

                          {sub?.file && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onPreviewFile(sub.file!, student.name)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Visualizar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(sub.file!)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Baixar
                              </button>
                            </div>
                          )}
                        </div>

                        {sub?.file && (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                              <span className="font-medium truncate">
                                {sub.file.fileName}
                              </span>
                              <span className="text-slate-400 tabular-nums shrink-0">
                                · {formatFileSize(sub.file.fileSize)}
                              </span>
                            </div>
                            {sub.studentNote && (
                              <p className="w-full text-slate-600 mt-1">
                                Nota do aluno: “{sub.studentNote}”
                              </p>
                            )}
                          </div>
                        )}

                        {sub && sub.status !== 'pending' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                            <div className="sm:col-span-3">
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Nota (0 a 10)
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={10}
                                step={0.1}
                                value={draftScore}
                                onChange={(e) =>
                                  setScoreDrafts((prev) => ({
                                    ...prev,
                                    [sub.id]: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              />
                            </div>
                            <div className="sm:col-span-6">
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Comentário pedagógico
                              </label>
                              <input
                                type="text"
                                placeholder="Escreva um retorno objetivo para o aluno e pais..."
                                value={draftFeedback}
                                onChange={(e) =>
                                  setFeedbackDrafts((prev) => ({
                                    ...prev,
                                    [sub.id]: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              />
                            </div>
                            <div className="sm:col-span-3 flex items-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const parsed = parseFloat(draftScore.replace(',', '.'));
                                  gradeSubmission(
                                    sub.id,
                                    Number.isNaN(parsed) ? 8.5 : parsed,
                                    draftFeedback
                                  );
                                }}
                                className="w-full px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                {sub.status === 'graded' ? 'Atualizar nota' : 'Publicar nota'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            Nenhum arquivo enviado por este estudante ainda.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">
                Selecione uma tarefa ao lado para corrigir os arquivos enviados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: MESSAGES WITH PARENTS */}
      {activeSection === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 space-y-2">
            <h2 className="text-sm font-semibold text-slate-900 px-2 py-1">
              Estudantes e Responsáveis
            </h2>
            {state.students.map((stu) => {
              const active = stu.id === messageStudentId;
              return (
                <button
                  key={stu.id}
                  type="button"
                  onClick={() => setMessageStudentId(stu.id)}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors cursor-pointer ${
                    active ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <Avatar name={stu.name} src={stu.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{stu.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      Resp.: {stu.guardianName} · {stu.classRoom}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Canal Direto ·{' '}
                  {state.students.find((s) => s.id === messageStudentId)?.guardianName}
                </h3>
                <p className="text-xs text-slate-500">
                  Sobre: {state.students.find((s) => s.id === messageStudentId)?.name}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4 flex-1 max-h-[380px] overflow-y-auto bg-slate-50">
              {studentMessages.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  Nenhuma mensagem trocada ainda com este responsável.
                </p>
              ) : (
                studentMessages.map((msg) => {
                  const isTeacher = msg.senderRole === 'teacher';
                  const subj = SUBJECT_MAP[msg.subjectId];
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isTeacher ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-lg rounded-xl p-4 border ${
                          isTeacher
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-800 border-slate-200'
                        }`}
                      >
                        <p
                          className={`text-[11px] font-semibold mb-1 ${
                            isTeacher ? 'text-blue-100' : 'text-slate-500'
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
                  messageStudentId,
                  messageSubjectId,
                  'teacher',
                  TEACHER_PROFILE.name,
                  messageText
                );
                setMessageText('');
              }}
              className="p-4 border-t border-slate-200 bg-white flex flex-wrap items-center gap-3"
            >
              <select
                value={messageSubjectId}
                onChange={(e) => setMessageSubjectId(e.target.value as SubjectId)}
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
                placeholder="Escreva um comunicado para os pais..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 min-w-[200px] px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NEW ASSIGNMENT MODAL */}
      {showNewAssignment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-assignment-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 id="new-assignment-title" className="text-base font-semibold text-slate-900">
                Publicar Nova Tarefa Acadêmica
              </h3>
              <button
                type="button"
                onClick={() => setShowNewAssignment(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignmentSubmit} className="p-6 space-y-4">
              {formError && (
                <p className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título da tarefa
                </label>
                <input
                  type="text"
                  placeholder="Ex.: Lista de Funções do 1º Grau"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Disciplina
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value as SubjectId)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Turma
                  </label>
                  <select
                    value={newClassRoom}
                    onChange={(e) =>
                      setNewClassRoom(e.target.value as '8º Ano A' | '6º Ano B')
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="8º Ano A">8º Ano A</option>
                    <option value="6º Ano B">6º Ano B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bimestre
                  </label>
                  <select
                    value={newBimestre}
                    onChange={(e) => setNewBimestre(Number(e.target.value) as Bimestre)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value={1}>1º Bimestre</option>
                    <option value={2}>2º Bimestre</option>
                    <option value={3}>3º Bimestre</option>
                    <option value={4}>4º Bimestre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prazo de entrega
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instruções e critérios de entrega
                </label>
                <textarea
                  rows={3}
                  placeholder="Explique o que o estudante deve produzir e anexar no envio..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewAssignment(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Publicar tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
