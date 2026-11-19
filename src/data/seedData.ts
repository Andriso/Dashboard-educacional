import {
  ActivityEvent,
  Assignment,
  Bimestre,
  GradeRecord,
  SchoolMessage,
  SchoolState,
  Student,
  Subject,
  SubjectId,
  Submission,
} from '../types/school';
import { seedSampleFileIfMissing } from '../utils/fileStorage';

export const TEACHER_PROFILE = {
  name: 'Prof.ª Clara Mendes',
  roleTitle: 'Docente e Coordenação Acadêmica',
  avatarUrl: '/src/assets/images/avatar_teacher_clara_1795111839229.jpg',
};

export const PARENT_PROFILE = {
  name: 'Mariana Oliveira',
  roleTitle: 'Responsável por Lucas e Sofia',
  avatarUrl: '/src/assets/images/avatar_parent_mariana_1795111840544.jpg',
};

export const SUBJECTS: Subject[] = [
  {
    id: 'math',
    name: 'Matemática',
    shortName: 'MAT',
    teacherName: 'Prof.ª Clara Mendes',
    accentHex: '#2563EB',
    surfaceHex: '#EFF6FF',
    borderHex: '#BFDBFE',
    textHex: '#1D4ED8',
    weeklyHours: 5,
  },
  {
    id: 'portuguese',
    name: 'Língua Portuguesa',
    shortName: 'POR',
    teacherName: 'Prof. Rafael Souza',
    accentHex: '#E11D48',
    surfaceHex: '#FFF1F2',
    borderHex: '#FECDD3',
    textHex: '#BE123C',
    weeklyHours: 5,
  },
  {
    id: 'science',
    name: 'Ciências',
    shortName: 'CIE',
    teacherName: 'Prof.ª Beatriz Lima',
    accentHex: '#059669',
    surfaceHex: '#ECFDF5',
    borderHex: '#A7F3D0',
    textHex: '#047857',
    weeklyHours: 4,
  },
  {
    id: 'history',
    name: 'História',
    shortName: 'HIS',
    teacherName: 'Prof. Henrique Alves',
    accentHex: '#D97706',
    surfaceHex: '#FFFBEB',
    borderHex: '#FDE68A',
    textHex: '#B45309',
    weeklyHours: 3,
  },
  {
    id: 'english',
    name: 'Língua Inglesa',
    shortName: 'ING',
    teacherName: 'Prof.ª Camila Costa',
    accentHex: '#7C3AED',
    surfaceHex: '#F5F3FF',
    borderHex: '#DDD6FE',
    textHex: '#6D28D9',
    weeklyHours: 3,
  },
];

export const SUBJECT_MAP: Record<SubjectId, Subject> = SUBJECTS.reduce(
  (acc, subject) => {
    acc[subject.id] = subject;
    return acc;
  },
  {} as Record<SubjectId, Subject>
);

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stu-lucas',
    name: 'Lucas Oliveira',
    classRoom: '8º Ano A',
    registrationCode: '2026-0814',
    avatarUrl: '/src/assets/images/avatar_student_lucas_1795111840207.jpg',
    guardianName: 'Mariana Oliveira',
    attendancePct: 96,
  },
  {
    id: 'stu-sofia',
    name: 'Sofia Oliveira',
    classRoom: '6º Ano B',
    registrationCode: '2026-0629',
    avatarUrl: '/src/assets/images/avatar_student_sofia_1795111840502.jpg',
    guardianName: 'Mariana Oliveira',
    attendancePct: 98,
  },
  {
    id: 'stu-beatriz',
    name: 'Beatriz Santos',
    classRoom: '8º Ano A',
    registrationCode: '2026-0803',
    guardianName: 'Ricardo Santos',
    attendancePct: 94,
  },
  {
    id: 'stu-gabriel',
    name: 'Gabriel Ferreira',
    classRoom: '8º Ano A',
    registrationCode: '2026-0819',
    guardianName: 'Patrícia Ferreira',
    attendancePct: 91,
  },
  {
    id: 'stu-mateus',
    name: 'Mateus Almeida',
    classRoom: '6º Ano B',
    registrationCode: '2026-0611',
    guardianName: 'Fernanda Almeida',
    attendancePct: 93,
  },
];

function buildInitialGrades(): GradeRecord[] {
  const baseScores: Record<string, Record<SubjectId, Array<[number, number, number, string]>>> = {
    'stu-lucas': {
      math: [
        [7.5, 8.0, 8.5, 'Bom raciocínio algébrico nas listas semanais.'],
        [8.0, 8.5, 9.0, 'Evolução consistente em equações do 1º grau.'],
        [8.5, 9.0, 9.0, 'Excelente participação na resolução de problemas.'],
        [8.5, 8.8, 9.2, 'Pronto para o módulo de geometria analítica.'],
      ],
      portuguese: [
        [8.0, 7.5, 8.0, 'Boa interpretação textual; revisar pontuação.'],
        [8.5, 8.0, 8.5, 'Redação argumentativa bem estruturada.'],
        [9.0, 8.5, 9.0, 'Ótima clareza e coesão na resenha literária.'],
        [8.8, 9.0, 9.0, 'Desempenho sólido no bimestre final.'],
      ],
      science: [
        [8.5, 9.0, 9.0, 'Interesse ativo nas práticas de laboratório.'],
        [9.0, 8.5, 9.5, 'Relatório experimental completo e organizado.'],
        [9.5, 9.0, 9.5, 'Destaque na feira de energia renovável.'],
        [9.0, 9.5, 9.2, 'Domínio dos conceitos de física e química básica.'],
      ],
      history: [
        [6.5, 6.0, 7.0, 'Precisa entregar os fichamentos dentro do prazo.'],
        [7.0, 6.5, 7.5, 'Melhora perceptível na análise de fontes históricas.'],
        [6.5, 6.0, 6.5, 'Atenção à revisão para a avaliação bimestral.'],
        [7.5, 7.0, 7.5, 'Recuperou o ritmo com boa apresentação oral.'],
      ],
      english: [
        [8.5, 9.0, 8.5, 'Ótima pronúncia e vocabulário em sala.'],
        [9.0, 9.0, 9.0, 'Compreensão auditiva acima da média da turma.'],
        [9.0, 9.5, 9.0, 'Excelente diálogo em atividade em dupla.'],
        [9.2, 9.5, 9.5, 'Desempenho exemplar no projeto bilíngue.'],
      ],
    },
    'stu-sofia': {
      math: [
        [9.0, 9.5, 9.5, 'Agilidade e precisão com frações e porcentagens.'],
        [9.5, 9.0, 9.5, 'Ótima organização do caderno de exercícios.'],
        [9.0, 9.5, 10.0, 'Resolução criativa nos desafios olímpicos.'],
        [9.5, 9.5, 9.5, 'Mantém rendimento de excelência na disciplina.'],
      ],
      portuguese: [
        [9.0, 8.5, 9.0, 'Leitura expressiva e vocabulário rico.'],
        [9.0, 9.0, 9.5, 'Produção de texto criativa e bem revisada.'],
        [9.5, 9.0, 9.5, 'Excelente domínio ortográfico.'],
        [9.5, 9.2, 9.5, 'Participação exemplar nos debates de leitura.'],
      ],
      science: [
        [8.0, 8.5, 8.5, 'Curiosidade científica evidente nas aulas.'],
        [8.5, 8.5, 9.0, 'Bom desenho esquemático de ecossistemas.'],
        [9.0, 8.5, 9.0, 'Projeto sobre ciclo da água muito bem explicado.'],
        [8.8, 9.0, 9.0, 'Evolução contínua ao longo do ano.'],
      ],
      history: [
        [8.0, 8.0, 8.5, 'Boa compreensão das linhas do tempo antigas.'],
        [8.5, 8.0, 8.5, 'Participa com perguntas pertinentes.'],
        [8.5, 9.0, 8.5, 'Trabalho ilustrado com ótimas referências.'],
        [9.0, 8.5, 9.0, 'Fechamento consistente e organizado.'],
      ],
      english: [
        [7.5, 8.0, 8.0, 'Acompanha bem as músicas e diálogos curtos.'],
        [8.0, 8.0, 8.5, 'Ganhou confiança ao falar em voz alta.'],
        [8.5, 8.5, 8.5, 'Ótima evolução no vocabulário cotidiano.'],
        [8.5, 9.0, 8.8, 'Muito dedicada nas atividades de escuta.'],
      ],
    },
    'stu-beatriz': {
      math: [
        [9.0, 9.0, 9.5, 'Excelente consistência analítica.'],
        [9.5, 9.0, 9.5, 'Participação exemplar.'],
        [9.0, 9.5, 9.5, 'Alto desempenho em geometria.'],
        [9.5, 9.5, 9.5, 'Referência positiva na turma.'],
      ],
      portuguese: [
        [8.5, 8.5, 9.0, 'Boa argumentação escrita.'],
        [8.5, 9.0, 9.0, 'Leitura crítica apurada.'],
        [9.0, 9.0, 9.0, 'Ótimo repertório textual.'],
        [9.0, 9.0, 9.5, 'Consistência durante todo o ano.'],
      ],
      science: [
        [8.5, 8.0, 8.5, 'Relatórios bem detalhados.'],
        [8.5, 9.0, 8.5, 'Ótimo trabalho em grupo.'],
        [9.0, 8.5, 9.0, 'Boa fundamentação teórica.'],
        [9.0, 9.0, 9.0, 'Desempenho muito sólido.'],
      ],
      history: [
        [8.0, 8.5, 8.0, 'Participação constante.'],
        [8.5, 8.5, 8.5, 'Boa contextualização de eventos.'],
        [8.5, 8.5, 9.0, 'Seminário bem apresentado.'],
        [9.0, 8.5, 9.0, 'Excelente evolução.'],
      ],
      english: [
        [9.0, 9.5, 9.0, 'Fluência muito boa na leitura.'],
        [9.5, 9.0, 9.5, 'Escrita precisa.'],
        [9.5, 9.5, 9.5, 'Destaque nas apresentações.'],
        [9.5, 9.5, 9.5, 'Rendimento excelente.'],
      ],
    },
    'stu-gabriel': {
      math: [
        [6.0, 5.5, 6.5, 'Recomenda-se reforço em expressões algébricas.'],
        [6.5, 6.0, 6.5, 'Pequeno avanço nas atividades guiadas.'],
        [6.0, 6.5, 6.5, 'Manter rotina diária de exercícios.'],
        [6.5, 7.0, 7.0, 'Em recuperação progressiva.'],
      ],
      portuguese: [
        [7.0, 6.5, 7.0, 'Boa oralidade; atenção à ortografia.'],
        [7.0, 7.0, 7.5, 'Textos mais estruturados no 2º bimestre.'],
        [7.5, 7.0, 7.5, 'Evolução na interpretação de crônicas.'],
        [7.5, 7.5, 7.5, 'Cumprindo metas do bimestre.'],
      ],
      science: [
        [7.5, 7.0, 7.5, 'Gosta de experimentos práticos.'],
        [7.5, 7.5, 8.0, 'Boa participação em laboratório.'],
        [8.0, 7.5, 8.0, 'Apresentação clara no projeto em dupla.'],
        [8.0, 8.0, 8.0, 'Bom fechamento anual.'],
      ],
      history: [
        [6.5, 7.0, 6.5, 'Participa bem nos debates orais.'],
        [7.0, 6.5, 7.0, 'Precisa detalhar mais os resumos escritos.'],
        [7.0, 7.0, 7.0, 'Desempenho estável na média.'],
        [7.5, 7.0, 7.5, 'Boa entrega de pesquisa final.'],
      ],
      english: [
        [7.0, 7.5, 7.0, 'Vocabulário em expansão.'],
        [7.5, 7.0, 7.5, 'Boa compreensão de textos curtos.'],
        [7.5, 7.5, 8.0, 'Mais confiante nas atividades orais.'],
        [8.0, 7.5, 8.0, 'Evolução satisfatória.'],
      ],
    },
    'stu-mateus': {
      math: [
        [7.5, 8.0, 7.5, 'Bom entendimento de operações básicas.'],
        [8.0, 7.5, 8.0, 'Atento às correções em lousa.'],
        [8.0, 8.0, 8.5, 'Melhorou a organização dos cálculos.'],
        [8.5, 8.0, 8.5, 'Rendimento consistente.'],
      ],
      portuguese: [
        [7.5, 7.0, 7.5, 'Boa criatividade nas narrativas.'],
        [8.0, 7.5, 8.0, 'Revisão gramatical em progresso.'],
        [8.0, 8.0, 8.0, 'Cumpre todas as leituras indicadas.'],
        [8.5, 8.0, 8.5, 'Ótima evolução no 4º bimestre.'],
      ],
      science: [
        [8.5, 8.0, 8.5, 'Muito interessado em astronomia.'],
        [8.5, 8.5, 8.5, 'Relatórios caprichados.'],
        [9.0, 8.5, 9.0, 'Ótima maquete do sistema solar.'],
        [9.0, 9.0, 9.0, 'Excelente participação.'],
      ],
      history: [
        [7.5, 7.5, 7.5, 'Acompanha bem os conteúdos.'],
        [7.5, 8.0, 8.0, 'Boas perguntas em aula.'],
        [8.0, 8.0, 8.0, 'Entrega pontual de mapas.'],
        [8.0, 8.5, 8.5, 'Fechamento acima da média.'],
      ],
      english: [
        [8.0, 7.5, 8.0, 'Boa memória visual para vocabulário.'],
        [8.0, 8.0, 8.0, 'Participativo nos jogos didáticos.'],
        [8.5, 8.0, 8.5, 'Bom avanço na escrita.'],
        [8.5, 8.5, 8.5, 'Consistência exemplar.'],
      ],
    },
  };

  const records: GradeRecord[] = [];
  const bimestres: Bimestre[] = [1, 2, 3, 4];

  for (const student of INITIAL_STUDENTS) {
    const stuScores = baseScores[student.id];
    for (const subject of SUBJECTS) {
      const subjectRows = stuScores[subject.id];
      for (const b of bimestres) {
        const [exam1, exam2, homeworkAvg, teacherNote] = subjectRows[b - 1];
        records.push({
          id: `grd-${student.id}-${subject.id}-b${b}`,
          studentId: student.id,
          subjectId: subject.id,
          bimestre: b,
          exam1,
          exam2,
          homeworkAvg,
          teacherNote,
          updatedAt: '2026-11-18T14:30:00Z',
        });
      }
    }
  }
  return records;
}

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-math-eq',
    title: 'Lista de Sistemas Lineares e Gráficos',
    description:
      'Resolva os 6 exercícios do caderno de geometria analítica mostrando o passo a passo da substituição e envie a foto nítida ou PDF da resolução.',
    subjectId: 'math',
    classRoom: '8º Ano A',
    bimestre: 4,
    dueDate: '2026-11-25',
    maxScore: 10,
    createdAt: '2026-11-14T09:00:00Z',
    createdBy: 'Prof.ª Clara Mendes',
  },
  {
    id: 'asg-port-resenha',
    title: 'Resenha Crítica: Contos Contemporâneos',
    description:
      'Redija uma resenha de 25 a 35 linhas analisando o narrador e o conflito central do conto lido em sala. Envie em PDF ou documento de texto.',
    subjectId: 'portuguese',
    classRoom: '8º Ano A',
    bimestre: 4,
    dueDate: '2026-11-22',
    maxScore: 10,
    createdAt: '2026-11-12T10:30:00Z',
    createdBy: 'Prof. Rafael Souza',
  },
  {
    id: 'asg-sci-energia',
    title: 'Relatório de Circuito Elétrico Sustentável',
    description:
      'Anexe o relatório do experimento com célula fotovoltaica contendo hipótese, tabela de medições e conclusão sobre eficiência energética.',
    subjectId: 'science',
    classRoom: '8º Ano A',
    bimestre: 4,
    dueDate: '2026-11-20',
    maxScore: 10,
    createdAt: '2026-11-10T08:15:00Z',
    createdBy: 'Prof.ª Beatriz Lima',
  },
  {
    id: 'asg-hist-rev',
    title: 'Fichamento: Revolução Industrial e Urbanização',
    description:
      'Elabore um fichamento comparando as transformações sociais do século XIX com fontes primárias trabalhadas em aula.',
    subjectId: 'history',
    classRoom: '8º Ano A',
    bimestre: 4,
    dueDate: '2026-11-21',
    maxScore: 10,
    createdAt: '2026-11-11T11:00:00Z',
    createdBy: 'Prof. Henrique Alves',
  },
  {
    id: 'asg-eng-podcast',
    title: 'Roteiro Bilíngue: Daily Routines & Culture',
    description:
      'Envie o roteiro em inglês (mínimo 180 palavras) apresentando uma entrevista simulada sobre hábitos culturais e tecnologia.',
    subjectId: 'english',
    classRoom: '8º Ano A',
    bimestre: 4,
    dueDate: '2026-11-27',
    maxScore: 10,
    createdAt: '2026-11-15T13:20:00Z',
    createdBy: 'Prof.ª Camila Costa',
  },
  {
    id: 'asg-math-fracoes',
    title: 'Desafio de Frações e Proporções no Cotidiano',
    description:
      'Crie 3 problemas contextualizados com receitas ou medidas e resolva-os com representação visual em frações equivalentes.',
    subjectId: 'math',
    classRoom: '6º Ano B',
    bimestre: 4,
    dueDate: '2026-11-24',
    maxScore: 10,
    createdAt: '2026-11-14T09:10:00Z',
    createdBy: 'Prof.ª Clara Mendes',
  },
  {
    id: 'asg-sci-agua',
    title: 'Diário de Observação: Ciclo Hidrológico',
    description:
      'Registre os resultados do experimento de condensação feito em laboratório e envie o arquivo com suas conclusões.',
    subjectId: 'science',
    classRoom: '6º Ano B',
    bimestre: 4,
    dueDate: '2026-11-21',
    maxScore: 10,
    createdAt: '2026-11-12T15:00:00Z',
    createdBy: 'Prof.ª Beatriz Lima',
  },
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-lucas-math',
    assignmentId: 'asg-math-eq',
    studentId: 'stu-lucas',
    status: 'pending',
    updatedAt: '2026-11-14T09:00:00Z',
  },
  {
    id: 'sub-lucas-port',
    assignmentId: 'asg-port-resenha',
    studentId: 'stu-lucas',
    status: 'submitted',
    file: {
      fileId: 'seed-file-lucas-resenha',
      fileName: 'Resenha_Contos_Lucas_Oliveira.txt',
      fileType: 'text/plain',
      fileSize: 642,
      uploadedAt: '2026-11-18T16:40:00Z',
    },
    studentNote: 'Professores, segui a estrutura de introdução, análise do foco narrativo e conclusão.',
    updatedAt: '2026-11-18T16:40:00Z',
  },
  {
    id: 'sub-lucas-sci',
    assignmentId: 'asg-sci-energia',
    studentId: 'stu-lucas',
    status: 'graded',
    file: {
      fileId: 'seed-file-lucas-ciencias',
      fileName: 'Relatorio_Circuito_Solar_Lucas.txt',
      fileType: 'text/plain',
      fileSize: 718,
      uploadedAt: '2026-11-16T18:10:00Z',
    },
    studentNote: 'Incluí as três medições de tensão com ângulos diferentes da placa solar.',
    score: 9.5,
    feedback:
      'Excelente relatório, Lucas! Tabela comparativa muito clara e conclusão fundamentada nos dados coletados em bancada.',
    gradedAt: '2026-11-17T11:20:00Z',
    updatedAt: '2026-11-17T11:20:00Z',
  },
  {
    id: 'sub-lucas-hist',
    assignmentId: 'asg-hist-rev',
    studentId: 'stu-lucas',
    status: 'pending',
    updatedAt: '2026-11-11T11:00:00Z',
  },
  {
    id: 'sub-lucas-eng',
    assignmentId: 'asg-eng-podcast',
    studentId: 'stu-lucas',
    status: 'graded',
    file: {
      fileId: 'seed-file-lucas-ingles',
      fileName: 'Script_Daily_Routines_Lucas.txt',
      fileType: 'text/plain',
      fileSize: 589,
      uploadedAt: '2026-11-17T19:05:00Z',
    },
    studentNote: 'Roteiro revisado em dupla com o Gabriel.',
    score: 9.5,
    feedback: 'Vocabulário natural e excelente uso do Present Simple e conectores de rotina.',
    gradedAt: '2026-11-18T09:15:00Z',
    updatedAt: '2026-11-18T09:15:00Z',
  },
  {
    id: 'sub-beatriz-math',
    assignmentId: 'asg-math-eq',
    studentId: 'stu-beatriz',
    status: 'submitted',
    file: {
      fileId: 'seed-file-beatriz-math',
      fileName: 'Resolucao_Sistemas_Beatriz.txt',
      fileType: 'text/plain',
      fileSize: 524,
      uploadedAt: '2026-11-18T17:20:00Z',
    },
    studentNote: 'Lista completa com gráficos desenhados à mão digitalizados.',
    updatedAt: '2026-11-18T17:20:00Z',
  },
  {
    id: 'sub-gabriel-math',
    assignmentId: 'asg-math-eq',
    studentId: 'stu-gabriel',
    status: 'submitted',
    file: {
      fileId: 'seed-file-gabriel-math',
      fileName: 'Exercicios_Algebricos_Gabriel.txt',
      fileSize: 432,
      fileType: 'text/plain',
      uploadedAt: '2026-11-19T08:15:00Z',
    },
    studentNote: 'Fiquei com dúvida apenas na questão 5, mas tentei montar o sistema.',
    updatedAt: '2026-11-19T08:15:00Z',
  },
  {
    id: 'sub-sofia-math',
    assignmentId: 'asg-math-fracoes',
    studentId: 'stu-sofia',
    status: 'pending',
    updatedAt: '2026-11-14T09:10:00Z',
  },
  {
    id: 'sub-sofia-sci',
    assignmentId: 'asg-sci-agua',
    studentId: 'stu-sofia',
    status: 'graded',
    file: {
      fileId: 'seed-file-sofia-agua',
      fileName: 'Diario_Ciclo_Agua_Sofia.txt',
      fileType: 'text/plain',
      fileSize: 560,
      uploadedAt: '2026-11-17T15:30:00Z',
    },
    studentNote: 'Descrevi todas as etapas da evaporação e condensação.',
    score: 9.0,
    feedback: 'Muito bem observado, Sofia! Explicação clara e vocabulário científico adequado ao 6º ano.',
    gradedAt: '2026-11-18T10:40:00Z',
    updatedAt: '2026-11-18T10:40:00Z',
  },
  {
    id: 'sub-mateus-math',
    assignmentId: 'asg-math-fracoes',
    studentId: 'stu-mateus',
    status: 'submitted',
    file: {
      fileId: 'seed-file-mateus-fracoes',
      fileName: 'Desafios_Fracoes_Mateus.txt',
      fileType: 'text/plain',
      fileSize: 478,
      uploadedAt: '2026-11-18T20:10:00Z',
    },
    studentNote: 'Usei exemplos de receitas de bolo para calcular as frações.',
    updatedAt: '2026-11-18T20:10:00Z',
  },
];

export const INITIAL_MESSAGES: SchoolMessage[] = [
  {
    id: 'msg-1',
    studentId: 'stu-lucas',
    subjectId: 'history',
    senderRole: 'teacher',
    senderName: 'Prof.ª Clara Mendes',
    content:
      'Olá Mariana, tudo bem? Passando para avisar que o Lucas teve excelente evolução em Matemática e Ciências neste 4º bimestre. Em História, reforçamos o prazo do fichamento até sexta-feira (21/11).',
    createdAt: '2026-11-18T14:20:00Z',
  },
  {
    id: 'msg-2',
    studentId: 'stu-lucas',
    subjectId: 'history',
    senderRole: 'parent',
    senderName: 'Mariana Oliveira',
    content:
      'Obrigada pelo retorno, professora! Já conversei com o Lucas hoje pela manhã e vamos acompanhar o envio do fichamento de História pelo portal ainda hoje.',
    createdAt: '2026-11-18T15:05:00Z',
  },
  {
    id: 'msg-3',
    studentId: 'stu-sofia',
    subjectId: 'math',
    senderRole: 'teacher',
    senderName: 'Prof.ª Clara Mendes',
    content:
      'Mariana, a Sofia manteve média 9,5 em Matemática no 4º bimestre e ajudou os colegas durante a oficina de frações. Parabéns pelo acompanhamento!',
    createdAt: '2026-11-18T16:10:00Z',
  },
];

export const INITIAL_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act-1',
    timestamp: '2026-11-19T08:15:00Z',
    actorName: 'Gabriel Ferreira',
    actorRole: 'student',
    summary: 'enviou o arquivo Exercicios_Algebricos_Gabriel.txt em Matemática',
    subjectId: 'math',
    type: 'submission',
  },
  {
    id: 'act-2',
    timestamp: '2026-11-18T16:40:00Z',
    actorName: 'Lucas Oliveira',
    actorRole: 'student',
    summary: 'enviou Resenha_Contos_Lucas_Oliveira.txt em Língua Portuguesa',
    subjectId: 'portuguese',
    type: 'submission',
  },
  {
    id: 'act-3',
    timestamp: '2026-11-18T10:40:00Z',
    actorName: 'Prof.ª Clara Mendes',
    actorRole: 'teacher',
    summary: 'lançou nota 9,0 para Sofia Oliveira em Ciências (4º Bimestre)',
    subjectId: 'science',
    type: 'grade',
  },
  {
    id: 'act-4',
    timestamp: '2026-11-17T11:20:00Z',
    actorName: 'Prof.ª Clara Mendes',
    actorRole: 'teacher',
    summary: 'corrigiu o relatório de circuito elétrico de Lucas Oliveira (nota 9,5)',
    subjectId: 'science',
    type: 'grade',
  },
];

export function createInitialSchoolState(): SchoolState {
  return {
    students: INITIAL_STUDENTS,
    grades: buildInitialGrades(),
    assignments: INITIAL_ASSIGNMENTS,
    submissions: INITIAL_SUBMISSIONS,
    messages: INITIAL_MESSAGES,
    activities: INITIAL_ACTIVITIES,
    lastSyncedAt: new Date().toISOString(),
  };
}

export async function ensureSeededFilesExist(): Promise<void> {
  const sampleDocs: Array<[string, string, string]> = [
    [
      'seed-file-lucas-resenha',
      'Resenha_Contos_Lucas_Oliveira.txt',
      `RESENHA CRÍTICA — CONTOS CONTEMPORÂNEOS\nAluno: Lucas Oliveira (8º Ano A)\nDisciplina: Língua Portuguesa · 4º Bimestre\n\nO conto analisado constrói uma narrativa em primeira pessoa marcada pela tensão cotidiana. O narrador-personagem observa a rotina da cidade pela janela do ônibus e transforma pequenos gestos em metáforas sobre pertencimento.\n\nO ponto alto do texto está na economia de adjetivos e nos diálogos curtos, que aceleram o ritmo até o desfecho aberto. Recomenda-se a leitura para turmas de Ensino Fundamental II por estimular a interpretação além da superfície literal.`,
    ],
    [
      'seed-file-lucas-ciencias',
      'Relatorio_Circuito_Solar_Lucas.txt',
      `RELATÓRIO EXPERIMENTAL — CIRCUITO ELÉTRICO SUSTENTÁVEL\nAluno: Lucas Oliveira (8º Ano A)\nDisciplina: Ciências · 4º Bimestre\n\n1. Objetivo: Medir a tensão gerada por uma mini placa fotovoltaica sob diferentes ângulos de incidência luminosa.\n\n2. Resultados:\n- Ângulo 90° (incidência direta): 4,8 V — LED aceso com brilho máximo\n- Ângulo 45°: 3,4 V — LED aceso com brilho moderado\n- Ângulo 15°: 1,6 V — corrente insuficiente para acionamento contínuo\n\n3. Conclusão: A inclinação perpendicular à fonte de luz maximiza o aproveitamento energético da célula fotovoltaica.`,
    ],
    [
      'seed-file-lucas-ingles',
      'Script_Daily_Routines_Lucas.txt',
      `BILINGUAL INTERVIEW SCRIPT — DAILY ROUTINES\nStudent: Lucas Oliveira (8º Ano A)\n\nInterviewer: Good morning! What does a typical school day look like for you?\nLucas: I usually wake up at 6:30 a.m., have breakfast with my family, and ride my bike to school. My favorite classes are Science and Math because we do hands-on experiments.\nInterviewer: How do you organize your afternoon homework?\nLucas: Right after lunch I review my notes for forty minutes and upload my assignments to the school portal before soccer practice.`,
    ],
    [
      'seed-file-beatriz-math',
      'Resolucao_Sistemas_Beatriz.txt',
      `LISTA DE SISTEMAS LINEARES E GRÁFICOS\nAluna: Beatriz Santos (8º Ano A)\n\nQuestão 1: { x + y = 12 ; 2x - y = 6 }\nSomando as equações: 3x = 18 => x = 6. Substituindo: y = 6. Ponto de interseção: (6, 6).\n\nQuestão 2: { 3x + 2y = 19 ; x - y = 3 }\nIsolando x = 3 + y => 3(3 + y) + 2y = 19 => 5y = 10 => y = 2 e x = 5.`,
    ],
    [
      'seed-file-gabriel-math',
      'Exercicios_Algebricos_Gabriel.txt',
      `LISTA DE SISTEMAS LINEARES\nAluno: Gabriel Ferreira (8º Ano A)\n\nQuestão 1: 3x = 18 -> x = 6, y = 6.\nQuestão 2: x = 5, y = 2.\nQuestão 3: Reta crescente passando por (0, 2) e (4, 10).\nObservação: Na questão 5 encontrei sistema possível e indeterminado.`,
    ],
    [
      'seed-file-sofia-agua',
      'Diario_Ciclo_Agua_Sofia.txt',
      `DIÁRIO DE OBSERVAÇÃO — CICLO HIDROLÓGICO\nAluna: Sofia Oliveira (6º Ano B)\n\nExperimento com recipiente fechado aquecido pela luz solar:\n- Após 15 minutos, observamos vapor subindo das paredes internas (evaporação).\n- Na tampa fria formaram-se gotículas que aumentaram de tamanho (condensação).\n- Ao atingir peso suficiente, as gotas escorreram de volta para a água do fundo (precipitação).`,
    ],
    [
      'seed-file-mateus-fracoes',
      'Desafios_Fracoes_Mateus.txt',
      `DESAFIO DE FRAÇÕES E PROPORÇÕES\nAluno: Mateus Almeida (6º Ano B)\n\nProblema 1: Uma receita pede 3/4 de xícara de farinha para 1 bolo. Para fazer 2 bolos e meio, multiplicamos 3/4 × 5/2 = 15/8 = 1 inteiro e 7/8 de xícara.\nProblema 2: 2/5 de uma turma de 30 alunos corresponde a 12 alunos.`,
    ],
  ];

  await Promise.all(
    sampleDocs.map(([id, name, content]) =>
      seedSampleFileIfMissing(id, name, 'text/plain;charset=utf-8', content)
    )
  );
}

export function computeRecordAverage(record: GradeRecord): number {
  const avg = (record.exam1 + record.exam2 + record.homeworkAvg) / 3;
  return Math.round(avg * 10) / 10;
}

export function formatScore(score: number): string {
  return score.toFixed(1).replace('.', ',');
}

export function getScoreClassification(avg: number): {
  label: string;
  tone: 'excellent' | 'nominal' | 'attention';
} {
  if (avg >= 8.5) {
    return { label: 'Acima da média', tone: 'excellent' };
  }
  if (avg >= 7.0) {
    return { label: 'Na média', tone: 'nominal' };
  }
  return { label: 'Atenção', tone: 'attention' };
}
