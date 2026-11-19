import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityEvent,
  Assignment,
  Bimestre,
  GradeRecord,
  Role,
  SchoolMessage,
  SchoolState,
  SubjectId,
  Submission,
  ToastNotice,
} from '../types/school';
import {
  createInitialSchoolState,
  ensureSeededFilesExist,
  formatScore,
  SUBJECT_MAP,
  TEACHER_PROFILE,
} from '../data/seedData';
import { clearAllStoredFiles, saveFileBlob } from '../utils/fileStorage';

const STORAGE_KEY = 'colegio-horizonte-state-v1';
const CHANNEL_NAME = 'colegio-horizonte-sync';

interface CreateAssignmentInput {
  title: string;
  description: string;
  subjectId: SubjectId;
  classRoom: '8º Ano A' | '6º Ano B';
  bimestre: Bimestre;
  dueDate: string;
}

interface SchoolContextValue {
  state: SchoolState;
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  activeStudentId: string;
  setActiveStudentId: (studentId: string) => void;
  toasts: ToastNotice[];
  dismissToast: (id: string) => void;
  isSyncFlash: boolean;
  updateGrade: (
    recordId: string,
    patch: Partial<Pick<GradeRecord, 'exam1' | 'exam2' | 'homeworkAvg' | 'teacherNote'>>
  ) => void;
  createAssignment: (input: CreateAssignmentInput) => void;
  submitAssignmentFile: (
    assignmentId: string,
    studentId: string,
    file: File,
    studentNote: string
  ) => Promise<void>;
  gradeSubmission: (submissionId: string, score: number, feedback: string) => void;
  sendMessage: (
    studentId: string,
    subjectId: SubjectId,
    senderRole: 'teacher' | 'parent',
    senderName: string,
    content: string
  ) => void;
  resetDemoData: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextValue | null>(null);

function loadStateFromStorage(): SchoolState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialSchoolState();
    }
    const parsed = JSON.parse(raw) as SchoolState;
    if (!parsed.students || !parsed.grades || !parsed.assignments || !parsed.submissions) {
      return createInitialSchoolState();
    }
    return parsed;
  } catch {
    return createInitialSchoolState();
  }
}

function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.round(Math.min(10, Math.max(0, value)) * 10) / 10;
}

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SchoolState>(() => loadStateFromStorage());
  const [activeRole, setActiveRole] = useState<Role>('teacher');
  const [activeStudentId, setActiveStudentId] = useState<string>('stu-lucas');
  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  const [isSyncFlash, setIsSyncFlash] = useState(false);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const tabIdRef = useRef<string>(`tab-${Math.random().toString(36).slice(2, 9)}`);

  const pushToast = useCallback((title: string, detail: string, tone: ToastNotice['tone'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, title, detail, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const triggerSyncPulse = useCallback(() => {
    setIsSyncFlash(true);
    setTimeout(() => setIsSyncFlash(false), 1200);
  }, []);

  useEffect(() => {
    ensureSeededFilesExist().catch(() => {
      // IndexedDB unavailable fallback silently ignored
    });
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<{ senderTabId: string; state: SchoolState; notice?: string }>) => {
      if (event.data?.senderTabId === tabIdRef.current) return;
      if (event.data?.state) {
        setState(event.data.state);
        triggerSyncPulse();
        if (event.data.notice) {
          pushToast('Atualização em tempo real', event.data.notice, 'info');
        }
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const next = JSON.parse(event.newValue) as SchoolState;
          setState(next);
          triggerSyncPulse();
        } catch {
          // ignore malformed storage
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [pushToast, triggerSyncPulse]);

  const commitState = useCallback(
    (updater: (prev: SchoolState) => SchoolState, syncNotice?: string) => {
      setState((prev) => {
        const next = {
          ...updater(prev),
          lastSyncedAt: new Date().toISOString(),
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore quota error
        }
        channelRef.current?.postMessage({
          senderTabId: tabIdRef.current,
          state: next,
          notice: syncNotice,
        });
        return next;
      });
      triggerSyncPulse();
    },
    [triggerSyncPulse]
  );

  const updateGrade = useCallback(
    (
      recordId: string,
      patch: Partial<Pick<GradeRecord, 'exam1' | 'exam2' | 'homeworkAvg' | 'teacherNote'>>
    ) => {
      let summaryMsg = '';
      commitState((prev) => {
        const target = prev.grades.find((g) => g.id === recordId);
        if (!target) return prev;
        const student = prev.students.find((s) => s.id === target.studentId);
        const subject = SUBJECT_MAP[target.subjectId];

        const nextGrade: GradeRecord = {
          ...target,
          exam1: patch.exam1 !== undefined ? clampScore(patch.exam1) : target.exam1,
          exam2: patch.exam2 !== undefined ? clampScore(patch.exam2) : target.exam2,
          homeworkAvg:
            patch.homeworkAvg !== undefined ? clampScore(patch.homeworkAvg) : target.homeworkAvg,
          teacherNote: patch.teacherNote !== undefined ? patch.teacherNote : target.teacherNote,
          updatedAt: new Date().toISOString(),
        };

        const avg = (nextGrade.exam1 + nextGrade.exam2 + nextGrade.homeworkAvg) / 3;
        summaryMsg = `atualizou notas de ${student?.name ?? 'estudante'} em ${subject.name} (${target.bimestre}º Bim · média ${formatScore(avg)})`;

        const newActivity: ActivityEvent = {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorName: TEACHER_PROFILE.name,
          actorRole: 'teacher',
          summary: summaryMsg,
          subjectId: target.subjectId,
          type: 'grade',
        };

        return {
          ...prev,
          grades: prev.grades.map((g) => (g.id === recordId ? nextGrade : g)),
          activities: [newActivity, ...prev.activities].slice(0, 24),
        };
      }, summaryMsg);
      pushToast('Nota salva e sincronizada', 'O boletim foi atualizado em tempo real.');
    },
    [commitState, pushToast]
  );

  const createAssignment = useCallback(
    (input: CreateAssignmentInput) => {
      const subject = SUBJECT_MAP[input.subjectId];
      const assignmentId = `asg-${Date.now()}`;
      const now = new Date().toISOString();

      commitState((prev) => {
        const newAssignment: Assignment = {
          id: assignmentId,
          title: input.title.trim(),
          description: input.description.trim(),
          subjectId: input.subjectId,
          classRoom: input.classRoom,
          bimestre: input.bimestre,
          dueDate: input.dueDate,
          maxScore: 10,
          createdAt: now,
          createdBy: TEACHER_PROFILE.name,
        };

        const targetStudents = prev.students.filter((s) => s.classRoom === input.classRoom);
        const newSubmissions: Submission[] = targetStudents.map((stu) => ({
          id: `sub-${assignmentId}-${stu.id}`,
          assignmentId,
          studentId: stu.id,
          status: 'pending',
          updatedAt: now,
        }));

        const newActivity: ActivityEvent = {
          id: `act-${Date.now()}`,
          timestamp: now,
          actorName: TEACHER_PROFILE.name,
          actorRole: 'teacher',
          summary: `publicou a tarefa "${newAssignment.title}" em ${subject.name} (${input.classRoom})`,
          subjectId: input.subjectId,
          type: 'assignment',
        };

        return {
          ...prev,
          assignments: [newAssignment, ...prev.assignments],
          submissions: [...newSubmissions, ...prev.submissions],
          activities: [newActivity, ...prev.activities].slice(0, 24),
        };
      }, `Nova tarefa publicada em ${subject.name}: ${input.title}`);

      pushToast('Tarefa publicada', `${input.title} já está disponível para ${input.classRoom}.`);
    },
    [commitState, pushToast]
  );

  const submitAssignmentFile = useCallback(
    async (assignmentId: string, studentId: string, file: File, studentNote: string) => {
      const fileId = `file-${assignmentId}-${studentId}-${Date.now()}`;
      await saveFileBlob(fileId, file.name, file.type || 'application/octet-stream', file);
      const now = new Date().toISOString();

      commitState((prev) => {
        const assignment = prev.assignments.find((a) => a.id === assignmentId);
        const student = prev.students.find((s) => s.id === studentId);
        const subject = assignment ? SUBJECT_MAP[assignment.subjectId] : SUBJECT_MAP.math;

        const existingSub = prev.submissions.find(
          (s) => s.assignmentId === assignmentId && s.studentId === studentId
        );

        const nextSub: Submission = {
          id: existingSub?.id ?? `sub-${assignmentId}-${studentId}`,
          assignmentId,
          studentId,
          status: 'submitted',
          file: {
            fileId,
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
            uploadedAt: now,
          },
          studentNote: studentNote.trim() || undefined,
          updatedAt: now,
        };

        const nextSubmissions = existingSub
          ? prev.submissions.map((s) => (s.id === existingSub.id ? nextSub : s))
          : [nextSub, ...prev.submissions];

        const newActivity: ActivityEvent = {
          id: `act-${Date.now()}`,
          timestamp: now,
          actorName: student?.name ?? 'Estudante',
          actorRole: 'student',
          summary: `enviou o arquivo ${file.name} para "${assignment?.title ?? 'Tarefa'}"`,
          subjectId: subject.id,
          type: 'submission',
        };

        return {
          ...prev,
          submissions: nextSubmissions,
          activities: [newActivity, ...prev.activities].slice(0, 24),
        };
      }, `Arquivo enviado: ${file.name}`);

      pushToast('Arquivo enviado com sucesso', `${file.name} foi entregue para correção.`);
    },
    [commitState, pushToast]
  );

  const gradeSubmission = useCallback(
    (submissionId: string, score: number, feedback: string) => {
      const clamped = clampScore(score);
      const now = new Date().toISOString();

      commitState((prev) => {
        const targetSub = prev.submissions.find((s) => s.id === submissionId);
        if (!targetSub) return prev;
        const assignment = prev.assignments.find((a) => a.id === targetSub.assignmentId);
        if (!assignment) return prev;
        const student = prev.students.find((s) => s.id === targetSub.studentId);
        const subject = SUBJECT_MAP[assignment.subjectId];

        const updatedSub: Submission = {
          ...targetSub,
          status: 'graded',
          score: clamped,
          feedback: feedback.trim(),
          gradedAt: now,
          updatedAt: now,
        };

        const nextSubmissions = prev.submissions.map((s) =>
          s.id === submissionId ? updatedSub : s
        );

        // Recalculate homeworkAvg for matching (studentId, subjectId, bimestre)
        const matchingAssignmentIds = new Set(
          prev.assignments
            .filter(
              (a) =>
                a.subjectId === assignment.subjectId &&
                a.bimestre === assignment.bimestre &&
                a.classRoom === student?.classRoom
            )
            .map((a) => a.id)
        );

        const gradedScores = nextSubmissions
          .filter(
            (s) =>
              s.studentId === targetSub.studentId &&
              matchingAssignmentIds.has(s.assignmentId) &&
              s.status === 'graded' &&
              typeof s.score === 'number'
          )
          .map((s) => s.score as number);

        const nextHomeworkAvg =
          gradedScores.length > 0
            ? Math.round(
                (gradedScores.reduce((sum, val) => sum + val, 0) / gradedScores.length) * 10
              ) / 10
            : clamped;

        const nextGrades = prev.grades.map((g) => {
          if (
            g.studentId === targetSub.studentId &&
            g.subjectId === assignment.subjectId &&
            g.bimestre === assignment.bimestre
          ) {
            return {
              ...g,
              homeworkAvg: nextHomeworkAvg,
              updatedAt: now,
            };
          }
          return g;
        });

        const newActivity: ActivityEvent = {
          id: `act-${Date.now()}`,
          timestamp: now,
          actorName: TEACHER_PROFILE.name,
          actorRole: 'teacher',
          summary: `corrigiu "${assignment.title}" de ${student?.name ?? 'estudante'} com nota ${formatScore(clamped)}`,
          subjectId: subject.id,
          type: 'grade',
        };

        return {
          ...prev,
          submissions: nextSubmissions,
          grades: nextGrades,
          activities: [newActivity, ...prev.activities].slice(0, 24),
        };
      }, `Tarefa corrigida com nota ${formatScore(clamped)}`);

      pushToast(
        'Correção publicada',
        `Nota ${formatScore(clamped)} aplicada ao boletim em tempo real.`
      );
    },
    [commitState, pushToast]
  );

  const sendMessage = useCallback(
    (
      studentId: string,
      subjectId: SubjectId,
      senderRole: 'teacher' | 'parent',
      senderName: string,
      content: string
    ) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const now = new Date().toISOString();

      commitState((prev) => {
        const student = prev.students.find((s) => s.id === studentId);
        const newMsg: SchoolMessage = {
          id: `msg-${Date.now()}`,
          studentId,
          subjectId,
          senderRole,
          senderName,
          content: trimmed,
          createdAt: now,
        };
        const newActivity: ActivityEvent = {
          id: `act-${Date.now()}`,
          timestamp: now,
          actorName: senderName,
          actorRole: senderRole,
          summary: `enviou um recado sobre ${student?.name ?? 'estudante'}`,
          subjectId,
          type: 'message',
        };
        return {
          ...prev,
          messages: [...prev.messages, newMsg],
          activities: [newActivity, ...prev.activities].slice(0, 24),
        };
      }, `Nova mensagem de ${senderName}`);

      pushToast('Mensagem enviada', 'O comunicado já aparece para a outra parte.');
    },
    [commitState, pushToast]
  );

  const resetDemoData = useCallback(async () => {
    await clearAllStoredFiles();
    await ensureSeededFilesExist();
    const fresh = createInitialSchoolState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    setState(fresh);
    channelRef.current?.postMessage({
      senderTabId: tabIdRef.current,
      state: fresh,
      notice: 'Dados de demonstração restaurados',
    });
    pushToast('Dados restaurados', 'O ambiente escolar voltou ao estado inicial.', 'info');
  }, [pushToast]);

  return (
    <SchoolContext.Provider
      value={{
        state,
        activeRole,
        setActiveRole,
        activeStudentId,
        setActiveStudentId,
        toasts,
        dismissToast,
        isSyncFlash,
        updateGrade,
        createAssignment,
        submitAssignmentFile,
        gradeSubmission,
        sendMessage,
        resetDemoData,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export function useSchool(): SchoolContextValue {
  const ctx = useContext(SchoolContext);
  if (!ctx) {
    throw new Error('useSchool must be used within SchoolProvider');
  }
  return ctx;
}
