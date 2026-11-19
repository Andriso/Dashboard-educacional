import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Download,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  RotateCcw,
  Users,
  X,
} from 'lucide-react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import {
  computeRecordAverage,
  formatScore,
  PARENT_PROFILE,
  SUBJECT_MAP,
  TEACHER_PROFILE,
} from './data/seedData';
import { Role, SubmissionFileMeta } from './types/school';
import { triggerFileDownload } from './utils/fileStorage';
import { Avatar } from './components/Avatar';
import { FilePreviewModal } from './components/FilePreviewModal';
import { ParentDashboard, ParentSection } from './components/ParentDashboard';
import { StudentPortal, StudentSection } from './components/StudentPortal';
import { TeacherDashboard, TeacherSection } from './components/TeacherDashboard';

const ROLE_META: Record<
  Role,
  { label: string; personName: string; avatar: string }
> = {
  teacher: {
    label: 'Professor',
    personName: TEACHER_PROFILE.name,
    avatar: TEACHER_PROFILE.avatarUrl,
  },
  student: {
    label: 'Aluno',
    personName: 'Portal do Estudante',
    avatar: '/src/assets/images/avatar_student_lucas_1795111840207.jpg',
  },
  parent: {
    label: 'Pais',
    personName: PARENT_PROFILE.name,
    avatar: PARENT_PROFILE.avatarUrl,
  },
};

function SchoolWorkspace() {
  const {
    state,
    activeRole,
    setActiveRole,
    activeStudentId,
    toasts,
    dismissToast,
    isSyncFlash,
    resetDemoData,
  } = useSchool();

  const [teacherSection, setTeacherSection] = useState<TeacherSection>('overview');
  const [studentSection, setStudentSection] = useState<StudentSection>('overview');
  const [parentSection, setParentSection] = useState<ParentSection>('overview');

  const [previewTarget, setPreviewTarget] = useState<{
    file: SubmissionFileMeta;
    studentName: string;
  } | null>(null);

  const navLinks = useMemo(() => {
    if (activeRole === 'teacher') {
      return [
        { id: 'overview', label: 'Visão Geral', active: teacherSection === 'overview' },
        { id: 'grades', label: 'Diário de Notas', active: teacherSection === 'grades' },
        { id: 'assignments', label: 'Tarefas e Arquivos', active: teacherSection === 'assignments' },
        { id: 'messages', label: 'Mensagens', active: teacherSection === 'messages' },
      ];
    }
    if (activeRole === 'student') {
      return [
        { id: 'overview', label: 'Matérias', active: studentSection === 'overview' },
        { id: 'tasks', label: 'Minhas Tarefas', active: studentSection === 'tasks' },
        { id: 'grades', label: 'Meu Boletim', active: studentSection === 'grades' },
      ];
    }
    return [
      { id: 'overview', label: 'Resumo Familiar', active: parentSection === 'overview' },
      { id: 'grades', label: 'Boletim', active: parentSection === 'grades' },
      { id: 'tasks', label: 'Entregas', active: parentSection === 'tasks' },
      { id: 'messages', label: 'Comunicação', active: parentSection === 'messages' },
    ];
  }, [activeRole, teacherSection, studentSection, parentSection]);

  const handleNavClick = (sectionId: string) => {
    if (activeRole === 'teacher') {
      setTeacherSection(sectionId as TeacherSection);
    } else if (activeRole === 'student') {
      setStudentSection(sectionId as StudentSection);
    } else {
      setParentSection(sectionId as ParentSection);
    }
  };

  const handleExportCsv = () => {
    const header = [
      'Estudante',
      'Turma',
      'Disciplina',
      'Bimestre',
      'Prova 1',
      'Prova 2',
      'Tarefas',
      'Média',
      'Observação',
    ].join(';');

    const rows = state.grades
      .filter((g) => (activeRole === 'teacher' ? true : g.studentId === activeStudentId))
      .map((g) => {
        const student = state.students.find((s) => s.id === g.studentId);
        const subject = SUBJECT_MAP[g.subjectId];
        const avg = computeRecordAverage(g);
        return [
          student?.name ?? '',
          student?.classRoom ?? '',
          subject.name,
          `${g.bimestre}º Bimestre`,
          formatScore(g.exam1),
          formatScore(g.exam2),
          formatScore(g.homeworkAvg),
          formatScore(avg),
          `"${g.teacherNote.replace(/"/g, '""')}"`,
        ].join(';');
      });

    const csvContent = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerFileDownload(blob, `boletim_colegio_horizonte_${activeRole}.csv`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar: Strict 3-zone contract */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('overview');
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Colégio Horizonte
          </a>

          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNavClick(link.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                  link.active
                    ? 'text-slate-900 border-blue-600 font-semibold'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar boletim
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {navLinks.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => handleNavClick(link.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
              link.active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Workspace Role Switcher Toolbar */}
        <section
          aria-label="Seletor de perfil escolar"
          className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">
              Visualizar como:
            </span>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'teacher', label: 'Painel do Professor', Icon: GraduationCap },
                  { id: 'student', label: 'Portal do Aluno', Icon: BookOpen },
                  { id: 'parent', label: 'Painel dos Pais', Icon: Users },
                ] as const
              ).map(({ id, label, Icon }) => {
                const active = activeRole === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveRole(id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
              <Avatar
                name={ROLE_META[activeRole].personName}
                src={ROLE_META[activeRole].avatar}
                size="sm"
              />
              <span>
                {isSyncFlash ? 'Sincronizado agora' : 'Sincronizado às'}{' '}
                {new Date(state.lastSyncedAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>

            <button
              type="button"
              onClick={() => resetDemoData()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar exemplo
            </button>
          </div>
        </section>

        {/* Quick Sidebar + Workspace Split on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="hidden lg:block lg:col-span-2 bg-white border border-slate-200 rounded-xl p-3 sticky top-22">
            <p className="px-3 py-2 text-xs font-semibold text-slate-500">
              {ROLE_META[activeRole].label}
            </p>
            <div className="space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className={`w-full text-left px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer ${
                    link.active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {link.id === 'overview' && <LayoutDashboard className="w-4 h-4 shrink-0" />}
                  {link.id === 'grades' && <GraduationCap className="w-4 h-4 shrink-0" />}
                  {(link.id === 'assignments' || link.id === 'tasks') && (
                    <BookOpen className="w-4 h-4 shrink-0" />
                  )}
                  {link.id === 'messages' && <MessageSquare className="w-4 h-4 shrink-0" />}
                  <span className="truncate">{link.label}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="lg:col-span-10 min-w-0">
            {activeRole === 'teacher' && (
              <TeacherDashboard
                activeSection={teacherSection}
                onNavigateSection={setTeacherSection}
                onPreviewFile={(file, studentName) =>
                  setPreviewTarget({ file, studentName })
                }
              />
            )}

            {activeRole === 'student' && (
              <StudentPortal
                activeSection={studentSection}
                onNavigateSection={setStudentSection}
                onPreviewFile={(file, studentName) =>
                  setPreviewTarget({ file, studentName })
                }
              />
            )}

            {activeRole === 'parent' && (
              <ParentDashboard
                activeSection={parentSection}
                onNavigateSection={setParentSection}
                onPreviewFile={(file, studentName) =>
                  setPreviewTarget({ file, studentName })
                }
              />
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1360px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>Colégio Horizonte · Gestão Acadêmica, Notas e Tarefas</span>
          <span>Escala oficial de 0,0 a 10,0 · Sincronização local em tempo real</span>
        </div>
      </footer>

      {/* File Preview Modal */}
      <FilePreviewModal
        fileMeta={previewTarget?.file ?? null}
        studentName={previewTarget?.studentName}
        onClose={() => setPreviewTarget(null)}
      />

      {/* Real-time Toast Notifications */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-900 text-white rounded-xl p-4 shadow-lg border border-slate-800 flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold">{toast.title}</p>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">{toast.detail}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 cursor-pointer shrink-0"
              aria-label="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SchoolProvider>
      <SchoolWorkspace />
    </SchoolProvider>
  );
}
