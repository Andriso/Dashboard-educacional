export type Role = 'teacher' | 'student' | 'parent';

export type Bimestre = 1 | 2 | 3 | 4;

export type SubjectId = 'math' | 'portuguese' | 'science' | 'history' | 'english';

export type SubmissionStatus = 'pending' | 'submitted' | 'graded';

export interface Subject {
  id: SubjectId;
  name: string;
  shortName: string;
  teacherName: string;
  accentHex: string;
  surfaceHex: string;
  borderHex: string;
  textHex: string;
  weeklyHours: number;
}

export interface Student {
  id: string;
  name: string;
  classRoom: '8º Ano A' | '6º Ano B';
  registrationCode: string;
  avatarUrl?: string;
  guardianName: string;
  attendancePct: number;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  subjectId: SubjectId;
  bimestre: Bimestre;
  exam1: number;
  exam2: number;
  homeworkAvg: number;
  teacherNote: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: SubjectId;
  classRoom: '8º Ano A' | '6º Ano B';
  bimestre: Bimestre;
  dueDate: string;
  maxScore: number;
  createdAt: string;
  createdBy: string;
}

export interface SubmissionFileMeta {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  file?: SubmissionFileMeta;
  studentNote?: string;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  updatedAt: string;
}

export interface SchoolMessage {
  id: string;
  studentId: string;
  subjectId: SubjectId;
  senderRole: 'teacher' | 'parent';
  senderName: string;
  content: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: Role;
  summary: string;
  subjectId: SubjectId;
  type: 'grade' | 'submission' | 'assignment' | 'message';
}

export interface SchoolState {
  students: Student[];
  grades: GradeRecord[];
  assignments: Assignment[];
  submissions: Submission[];
  messages: SchoolMessage[];
  activities: ActivityEvent[];
  lastSyncedAt: string;
}

export interface ToastNotice {
  id: string;
  title: string;
  detail: string;
  tone: 'info' | 'success' | 'warning';
}
