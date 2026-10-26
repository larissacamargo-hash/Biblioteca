import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
  serverTimestamp,
  deleteField,
} from 'firebase/firestore';
import {
  Book,
  Student,
  Loan,
  Reservation,
  InterlibraryRequest,
  AuthUser,
} from '../types/library';
import {
  INITIAL_BOOKS,
  INITIAL_STUDENTS,
  INITIAL_LOANS,
  INITIAL_RESERVATIONS,
  INITIAL_INTERLIBRARY,
} from '../data/mockData';
import {
  auth,
  db,
  googleProvider,
  BOOTSTRAPPED_ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
  sanitizeId,
  sanitizeString,
  clampInt,
  stripUndefined,
} from '../lib/firebase';

interface StudentPublicDoc {
  id: string;
  ownerUid: string;
  nome: string;
  matricula: string;
  curso: string;
  livrosAtivos: number;
  limiteEmprestimos: number;
  statusConta: 'regular' | 'bloqueado_atraso';
  dataCadastro: string;
  totalHistoricoEmprestimos: number;
}

interface LoanFirestoreDoc {
  id: string;
  livroId: string;
  livroTitulo: string;
  livroIsbn: string;
  alunoId: string;
  ownerUid: string;
  alunoNome: string;
  alunoMatricula: string;
  dataEmprestimo: string;
  dataPrevistaDevolucao: string;
  dataDevolucao?: string;
  status: 'ativo' | 'atrasado' | 'devolvido';
  diasAtraso?: number;
  notificacaoEnviada?: boolean;
  observacoes?: string;
}

interface LibraryContextType {
  mode: 'librarian' | 'student';
  setMode: (mode: 'librarian' | 'student') => void;
  currentUser: AuthUser;
  currentStudent: Student | null;
  setCurrentStudent: (student: Student | null) => void;
  isAdminUser: boolean;
  authReady: boolean;
  isLoadingDb: boolean;
  isAuthenticating: boolean;

  // Auth actions
  signInWithGoogle: (
    preferredPortal: 'student' | 'librarian'
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;

  // Data
  books: Book[];
  students: Student[];
  loans: Loan[];
  reservations: Reservation[];
  requests: InterlibraryRequest[];

  // Stats
  totalLivrosAcervo: number;
  totalExemplaresFisicos: number;
  totalDisponiveis: number;
  totalEmprestados: number;
  totalAtrasados: number;
  totalChegandoEmBreve: number;
  totalReservasAtivas: number;

  // Actions
  createLoan: (bookId: string, studentId: string, days?: number) => { success: boolean; message: string };
  returnBook: (loanId: string) => { success: boolean; message: string };
  reserveBook: (bookId: string, studentId: string) => { success: boolean; message: string };
  fulfillReservation: (reservationId: string, days?: number) => { success: boolean; message: string };
  cancelReservation: (reservationId: string) => { success: boolean; message: string };
  cancelReservationByBookAndStudent: (bookId: string, studentId: string) => { success: boolean; message: string };
  notifyReservationReady: (reservationId: string) => void;
  addBook: (book: Omit<Book, 'id'>) => void;
  addStudent: (
    student: Omit<Student, 'id' | 'livrosAtivos' | 'dataCadastro' | 'totalHistoricoEmprestimos'>
  ) => void;
  createInterlibraryRequest: (
    req: Omit<InterlibraryRequest, 'id' | 'dataSolicitacao' | 'status'>
  ) => void;
  updateRequestStatus: (
    requestId: string,
    status: 'solicitado' | 'em_transito' | 'entregue'
  ) => void;
  sendOverdueNotice: (loanId: string) => void;
  resetDatabase: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const PORTAL_MODE_KEY = 'bibliotech_portal_mode_v1';

function buildBookFirestoreDoc(book: Book, createdByUid: string) {
  const total = clampInt(book.totalExemplares, 0, 500);
  const disp = clampInt(book.disponiveis, 0, total);
  return stripUndefined({
    id: sanitizeId(book.id, 'b'),
    isbn: sanitizeString(book.isbn, 40, '978-0000000000'),
    titulo: sanitizeString(book.titulo, 200, ' Obra Sem Título'),
    autor: sanitizeString(book.autor, 160, 'Autor Desconhecido'),
    categoria: book.categoria,
    ano: clampInt(book.ano, -1000, 2100),
    edicao: sanitizeString(book.edicao, 120, '1ª Edição'),
    localizacao: sanitizeString(book.localizacao, 160, 'Acervo Geral'),
    totalExemplares: total,
    disponiveis: disp,
    status: book.status,
    indicacaoFaixaEtaria: book.indicacaoFaixaEtaria
      ? sanitizeString(book.indicacaoFaixaEtaria, 40)
      : undefined,
    capaUrl: book.capaUrl ? sanitizeString(book.capaUrl, 500) : undefined,
    descricao: sanitizeString(book.descricao, 1000, 'Obra integrante do catálogo Bibliotech.'),
    sinopseDetalhada: book.sinopseDetalhada
      ? sanitizeString(book.sinopseDetalhada, 3000)
      : undefined,
    curiosidades: book.curiosidades ? sanitizeString(book.curiosidades, 1500) : undefined,
    dataPrevistaChegada: book.dataPrevistaChegada
      ? sanitizeString(book.dataPrevistaChegada, 30)
      : undefined,
    catalogPublished: true,
    createdByUid: sanitizeId(createdByUid, 'admin'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  const [mode, setModeState] = useState<'librarian' | 'student'>(() => {
    const saved = sessionStorage.getItem(PORTAL_MODE_KEY);
    return saved === 'student' || saved === 'librarian' ? saved : 'librarian';
  });

  const [books, setBooks] = useState<Book[]>([]);
  const [publicStudents, setPublicStudents] = useState<StudentPublicDoc[]>([]);
  const [privateContacts, setPrivateContacts] = useState<
    Record<string, { email: string; telefone: string }>
  >({});
  const [rawLoans, setRawLoans] = useState<LoanFirestoreDoc[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [requests, setRequests] = useState<InterlibraryRequest[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('s-1');

  const hasSeededRef = useRef(false);
  const hasOnboardedUidRef = useRef<string | null>(null);
  const fetchedPrivateIdsRef = useRef<Set<string>>(new Set());
  const rejectNonAdminSessionRef = useRef(false);

  // Surface fatal Firestore errors to ErrorBoundary
  if (fatalError) {
    throw fatalError;
  }

  const reportFirestoreFailure = useCallback(
    (err: unknown, op: OperationType, path: string | null) => {
      try {
        handleFirestoreError(err, op, path);
      } catch (thrown) {
        setFatalError(thrown instanceof Error ? thrown : new Error(String(thrown)));
      }
    },
    []
  );

  const isAdminUser = Boolean(
    firebaseUser?.emailVerified &&
      firebaseUser?.email &&
      firebaseUser.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
  );

  // Helper to seed sample catalog & circulation records into Cloud Firestore
  const seedInitialData = useCallback(
    async (adminUid: string) => {
      const batch = writeBatch(db);
      const localContactCache: Record<string, { email: string; telefone: string }> = {};

      for (const b of INITIAL_BOOKS) {
        const bId = sanitizeId(b.id, 'b');
        batch.set(doc(db, 'books', bId), buildBookFirestoreDoc(b, adminUid));
      }

      for (const st of INITIAL_STUDENTS) {
        const sId = sanitizeId(st.id, 's');
        const ownerUid = sanitizeId(`seed_${sId}`, 'seed');
        batch.set(doc(db, 'students', sId), {
          id: sId,
          ownerUid,
          nome: sanitizeString(st.nome, 160, 'Leitor Bibliotech'),
          matricula: sanitizeString(st.matricula, 40, '20260000'),
          curso: sanitizeString(st.curso, 120, 'Comunidade de Leitores'),
          livrosAtivos: clampInt(st.livrosAtivos, 0, 50),
          limiteEmprestimos: clampInt(st.limiteEmprestimos, 1, 20),
          statusConta: st.statusConta,
          dataCadastro: sanitizeString(st.dataCadastro, 30, '2026-01-01'),
          totalHistoricoEmprestimos: clampInt(st.totalHistoricoEmprestimos, 0, 10000),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const safeEmail = sanitizeString(st.email, 160, 'leitor@bibliotech.org.br');
        const safePhone = sanitizeString(st.telefone, 40, '');
        localContactCache[sId] = { email: safeEmail, telefone: safePhone };

        batch.set(doc(db, 'students', sId, 'private', 'info'), {
          studentId: sId,
          ownerUid,
          email: safeEmail.length >= 3 ? safeEmail : 'leitor@bibliotech.org.br',
          telefone: safePhone,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const ln of INITIAL_LOANS) {
        const lId = sanitizeId(ln.id, 'l');
        const sId = sanitizeId(ln.alunoId, 's');
        const ownerUid = sanitizeId(`seed_${sId}`, 'seed');
        batch.set(
          doc(db, 'loans', lId),
          stripUndefined({
            id: lId,
            livroId: sanitizeId(ln.livroId, 'b'),
            livroTitulo: sanitizeString(ln.livroTitulo, 200, 'Livro'),
            livroIsbn: sanitizeString(ln.livroIsbn, 40, '978-0000000000'),
            alunoId: sId,
            ownerUid,
            alunoNome: sanitizeString(ln.alunoNome, 160, 'Leitor'),
            alunoMatricula: sanitizeString(ln.alunoMatricula, 40, '20260000'),
            dataEmprestimo: sanitizeString(ln.dataEmprestimo, 30, '2026-10-01'),
            dataPrevistaDevolucao: sanitizeString(ln.dataPrevistaDevolucao, 30, '2026-10-15'),
            dataDevolucao: ln.dataDevolucao ? sanitizeString(ln.dataDevolucao, 30) : undefined,
            status: ln.status,
            diasAtraso:
              ln.diasAtraso !== undefined ? clampInt(ln.diasAtraso, 0, 3650) : undefined,
            notificacaoEnviada: ln.notificacaoEnviada,
            observacoes: ln.observacoes ? sanitizeString(ln.observacoes, 500) : undefined,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        );
      }

      for (const res of INITIAL_RESERVATIONS) {
        const rId = sanitizeId(res.id, 'r');
        const sId = sanitizeId(res.alunoId, 's');
        const ownerUid = sanitizeId(`seed_${sId}`, 'seed');
        batch.set(
          doc(db, 'reservations', rId),
          stripUndefined({
            id: rId,
            livroId: sanitizeId(res.livroId, 'b'),
            livroTitulo: sanitizeString(res.livroTitulo, 200, 'Livro'),
            livroIsbn: res.livroIsbn ? sanitizeString(res.livroIsbn, 40) : undefined,
            livroCapaUrl: res.livroCapaUrl ? sanitizeString(res.livroCapaUrl, 500) : undefined,
            alunoId: sId,
            ownerUid,
            alunoNome: sanitizeString(res.alunoNome, 160, 'Leitor'),
            alunoMatricula: sanitizeString(res.alunoMatricula, 40, '20260000'),
            alunoCurso: res.alunoCurso ? sanitizeString(res.alunoCurso, 120) : undefined,
            dataReserva: sanitizeString(res.dataReserva, 30, '2026-10-24'),
            validadeReserva: sanitizeString(res.validadeReserva, 30, '2026-10-31'),
            status: res.status,
            tipo: res.tipo,
            avisadoPronto: res.avisadoPronto,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        );
      }

      for (const req of INITIAL_INTERLIBRARY) {
        const reqId = sanitizeId(req.id, 'req');
        batch.set(
          doc(db, 'requests', reqId),
          stripUndefined({
            id: reqId,
            tipo: req.tipo,
            titulo: sanitizeString(req.titulo, 200, 'Título Solicitado'),
            autor: sanitizeString(req.autor, 160, 'Autor'),
            origemUnidade: sanitizeString(req.origemUnidade, 200, 'Unidade Parceira'),
            quantidade: clampInt(req.quantidade, 1, 200),
            dataSolicitacao: sanitizeString(req.dataSolicitacao, 30, '2026-10-20'),
            previsaoChegada: sanitizeString(req.previsaoChegada, 30, '2026-11-05'),
            status: req.status,
            solicitante: sanitizeString(req.solicitante, 160, 'Curadoria Bibliotech'),
            observacao: req.observacao ? sanitizeString(req.observacao, 500) : undefined,
            libraryScope: 'bibliotech',
            createdByUid: sanitizeId(adminUid, 'admin'),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        );
      }

      try {
        await batch.commit();
        setPrivateContacts((prev) => ({ ...prev, ...localContactCache }));
      } catch (err) {
        reportFirestoreFailure(err, OperationType.WRITE, 'seed_initial_data');
      }
    },
    [reportFirestoreFailure]
  );

  // Track Firebase Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (rejectNonAdminSessionRef.current && user) {
        const userIsAdmin = Boolean(
          user.emailVerified &&
            user.email &&
            user.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
        );
        if (!userIsAdmin) {
          return;
        }
      }

      setFirebaseUser(user);
      setAuthReady(true);

      if (!user) {
        setBooks([]);
        setPublicStudents([]);
        setPrivateContacts({});
        setRawLoans([]);
        setReservations([]);
        setRequests([]);
        fetchedPrivateIdsRef.current.clear();
        hasOnboardedUidRef.current = null;
        setIsLoadingDb(false);
      } else {
        const userIsAdmin = Boolean(
          user.emailVerified &&
            user.email &&
            user.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
        );
        if (!userIsAdmin) {
          setModeState('student');
          sessionStorage.setItem(PORTAL_MODE_KEY, 'student');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Attach real-time Firestore listeners ONLY when authReady && firebaseUser != null
  useEffect(() => {
    if (!authReady || !firebaseUser) {
      return;
    }

    const uid = firebaseUser.uid;
    const admin = Boolean(
      firebaseUser.emailVerified &&
        firebaseUser.email &&
        firebaseUser.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
    );

    setIsLoadingDb(true);
    let booksLoaded = false;
    let studentsLoaded = false;

    const markLoadedIfReady = () => {
      if (booksLoaded && studentsLoaded) {
        setIsLoadingDb(false);
      }
    };

    // 1. Books listener (published catalog)
    const booksQuery = query(collection(db, 'books'), where('catalogPublished', '==', true));
    const unsubBooks = onSnapshot(
      booksQuery,
      async (snap) => {
        if (snap.empty && admin && !hasSeededRef.current) {
          hasSeededRef.current = true;
          await seedInitialData(uid);
          booksLoaded = true;
          markLoadedIfReady();
          return;
        }

        const list: Book[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id,
            isbn: data.isbn,
            titulo: data.titulo,
            autor: data.autor,
            categoria: data.categoria,
            ano: data.ano,
            edicao: data.edicao,
            localizacao: data.localizacao,
            totalExemplares: data.totalExemplares,
            disponiveis: data.disponiveis,
            status: data.status,
            indicacaoFaixaEtaria: data.indicacaoFaixaEtaria,
            capaUrl: data.capaUrl,
            descricao: data.descricao,
            sinopseDetalhada: data.sinopseDetalhada,
            curiosidades: data.curiosidades,
            dataPrevistaChegada: data.dataPrevistaChegada,
          };
        });
        list.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        setBooks(list);
        booksLoaded = true;
        markLoadedIfReady();
      },
      (err) => reportFirestoreFailure(err, OperationType.LIST, 'books')
    );

    // 2. Students public listener (+ self-onboarding for new readers + private PII hydration)
    const studentsRef = admin
      ? collection(db, 'students')
      : query(collection(db, 'students'), where('ownerUid', '==', uid));

    const unsubStudents = onSnapshot(
      studentsRef,
      async (snap) => {
        if (snap.empty && !admin && hasOnboardedUidRef.current !== uid) {
          hasOnboardedUidRef.current = uid;
          const safeId = sanitizeId(uid, 'reader');
          const todayStr = new Date().toISOString().split('T')[0];
          const randomSuffix = String(Math.floor(1000 + Math.random() * 9000));
          const generatedMatricula = `2026${randomSuffix}`;
          const readerName = sanitizeString(
            firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            160,
            'Leitor Bibliotech'
          );
          const readerEmail = sanitizeString(
            firebaseUser.email,
            160,
            'leitor@bibliotech.org.br'
          );

          try {
            const batch = writeBatch(db);
            batch.set(doc(db, 'students', safeId), {
              id: safeId,
              ownerUid: safeId,
              nome: readerName,
              matricula: generatedMatricula,
              curso: 'Leitor Digital · Acervo Jovem',
              livrosAtivos: 0,
              limiteEmprestimos: 4,
              statusConta: 'regular',
              dataCadastro: todayStr,
              totalHistoricoEmprestimos: 0,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            batch.set(doc(db, 'students', safeId, 'private', 'info'), {
              studentId: safeId,
              ownerUid: safeId,
              email: readerEmail.length >= 3 ? readerEmail : 'leitor@bibliotech.org.br',
              telefone: '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            await batch.commit();
            setPrivateContacts((prev) => ({
              ...prev,
              [safeId]: { email: readerEmail, telefone: '' },
            }));
          } catch (err) {
            reportFirestoreFailure(err, OperationType.CREATE, `students/${safeId}`);
          }
          studentsLoaded = true;
          markLoadedIfReady();
          return;
        }

        const list: StudentPublicDoc[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id,
            ownerUid: data.ownerUid,
            nome: data.nome,
            matricula: data.matricula,
            curso: data.curso,
            livrosAtivos: data.livrosAtivos,
            limiteEmprestimos: data.limiteEmprestimos,
            statusConta: data.statusConta,
            dataCadastro: data.dataCadastro,
            totalHistoricoEmprestimos: data.totalHistoricoEmprestimos,
          };
        });
        list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        setPublicStudents(list);
        studentsLoaded = true;
        markLoadedIfReady();

        // Hydrate isolated PII documents (/students/{id}/private/info)
        for (const st of list) {
          if (!fetchedPrivateIdsRef.current.has(st.id)) {
            fetchedPrivateIdsRef.current.add(st.id);
            getDoc(doc(db, 'students', st.id, 'private', 'info'))
              .then((privSnap) => {
                if (privSnap.exists()) {
                  const pData = privSnap.data();
                  setPrivateContacts((prev) => ({
                    ...prev,
                    [st.id]: {
                      email: pData.email || '',
                      telefone: pData.telefone || '',
                    },
                  }));
                }
              })
              .catch((err) =>
                reportFirestoreFailure(
                  err,
                  OperationType.GET,
                  `students/${st.id}/private/info`
                )
              );
          }
        }
      },
      (err) => reportFirestoreFailure(err, OperationType.LIST, 'students')
    );

    // 3. Loans listener
    const loansRef = admin
      ? collection(db, 'loans')
      : query(collection(db, 'loans'), where('ownerUid', '==', uid));

    const unsubLoans = onSnapshot(
      loansRef,
      (snap) => {
        const list: LoanFirestoreDoc[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id,
            livroId: data.livroId,
            livroTitulo: data.livroTitulo,
            livroIsbn: data.livroIsbn,
            alunoId: data.alunoId,
            ownerUid: data.ownerUid,
            alunoNome: data.alunoNome,
            alunoMatricula: data.alunoMatricula,
            dataEmprestimo: data.dataEmprestimo,
            dataPrevistaDevolucao: data.dataPrevistaDevolucao,
            dataDevolucao: data.dataDevolucao,
            status: data.status,
            diasAtraso: data.diasAtraso,
            notificacaoEnviada: data.notificacaoEnviada,
            observacoes: data.observacoes,
          };
        });
        list.sort((a, b) => b.dataEmprestimo.localeCompare(a.dataEmprestimo));
        setRawLoans(list);
      },
      (err) => reportFirestoreFailure(err, OperationType.LIST, 'loans')
    );

    // 4. Reservations listener
    const reservationsRef = admin
      ? collection(db, 'reservations')
      : query(collection(db, 'reservations'), where('ownerUid', '==', uid));

    const unsubReservations = onSnapshot(
      reservationsRef,
      (snap) => {
        const list: Reservation[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id,
            livroId: data.livroId,
            livroTitulo: data.livroTitulo,
            livroIsbn: data.livroIsbn,
            livroCapaUrl: data.livroCapaUrl,
            alunoId: data.alunoId,
            alunoNome: data.alunoNome,
            alunoMatricula: data.alunoMatricula,
            alunoCurso: data.alunoCurso,
            dataReserva: data.dataReserva,
            validadeReserva: data.validadeReserva,
            status: data.status,
            tipo: data.tipo,
            avisadoPronto: data.avisadoPronto,
          };
        });
        list.sort((a, b) => b.dataReserva.localeCompare(a.dataReserva));
        setReservations(list);
      },
      (err) => reportFirestoreFailure(err, OperationType.LIST, 'reservations')
    );

    // 5. Interlibrary Requests listener (Librarian only)
    let unsubRequests: (() => void) | undefined;
    if (admin) {
      const reqQuery = query(
        collection(db, 'requests'),
        where('libraryScope', '==', 'bibliotech')
      );
      unsubRequests = onSnapshot(
        reqQuery,
        (snap) => {
          const list: InterlibraryRequest[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: data.id,
              tipo: data.tipo,
              titulo: data.titulo,
              autor: data.autor,
              origemUnidade: data.origemUnidade,
              quantidade: data.quantidade,
              dataSolicitacao: data.dataSolicitacao,
              previsaoChegada: data.previsaoChegada,
              status: data.status,
              solicitante: data.solicitante,
              observacao: data.observacao,
            };
          });
          list.sort((a, b) => b.dataSolicitacao.localeCompare(a.dataSolicitacao));
          setRequests(list);
        },
        (err) => reportFirestoreFailure(err, OperationType.LIST, 'requests')
      );
    } else {
      setRequests([]);
    }

    return () => {
      unsubBooks();
      unsubStudents();
      unsubLoans();
      unsubReservations();
      if (unsubRequests) unsubRequests();
    };
  }, [authReady, firebaseUser, seedInitialData, reportFirestoreFailure]);

  // Hydrate full Student[] and Loan[] objects in memory
  const studentOwnerMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of publicStudents) {
      map[s.id] = s.ownerUid;
    }
    return map;
  }, [publicStudents]);

  const students: Student[] = useMemo(() => {
    return publicStudents.map((s) => ({
      id: s.id,
      nome: s.nome,
      matricula: s.matricula,
      curso: s.curso,
      email: privateContacts[s.id]?.email || '',
      telefone: privateContacts[s.id]?.telefone || '',
      livrosAtivos: s.livrosAtivos,
      limiteEmprestimos: s.limiteEmprestimos,
      statusConta: s.statusConta,
      dataCadastro: s.dataCadastro,
      totalHistoricoEmprestimos: s.totalHistoricoEmprestimos,
    }));
  }, [publicStudents, privateContacts]);

  const loans: Loan[] = useMemo(() => {
    return rawLoans.map((l) => ({
      id: l.id,
      livroId: l.livroId,
      livroTitulo: l.livroTitulo,
      livroIsbn: l.livroIsbn,
      alunoId: l.alunoId,
      alunoNome: l.alunoNome,
      alunoMatricula: l.alunoMatricula,
      alunoEmail: privateContacts[l.alunoId]?.email || '',
      dataEmprestimo: l.dataEmprestimo,
      dataPrevistaDevolucao: l.dataPrevistaDevolucao,
      dataDevolucao: l.dataDevolucao,
      status: l.status,
      diasAtraso: l.diasAtraso,
      notificacaoEnviada: l.notificacaoEnviada,
      observacoes: l.observacoes,
    }));
  }, [rawLoans, privateContacts]);

  const currentStudent: Student | null = useMemo(() => {
    if (!firebaseUser) return null;
    if (!isAdminUser) {
      return (
        students.find((s) => s.id === firebaseUser.uid) ||
        students[0] || {
          id: firebaseUser.uid,
          nome: firebaseUser.displayName || 'Leitor Bibliotech',
          matricula: '20260001',
          curso: 'Leitor Digital · Acervo Jovem',
          email: firebaseUser.email || '',
          telefone: '',
          livrosAtivos: 0,
          limiteEmprestimos: 4,
          statusConta: 'regular',
          dataCadastro: new Date().toISOString().split('T')[0],
          totalHistoricoEmprestimos: 0,
        }
      );
    }
    return students.find((s) => s.id === selectedStudentId) || students[0] || null;
  }, [firebaseUser, isAdminUser, students, selectedStudentId]);

  const currentUser: AuthUser = useMemo(() => {
    if (!firebaseUser) return null;
    if (isAdminUser) {
      return {
        role: 'librarian',
        name: firebaseUser.displayName || 'Gestão Bibliotech',
        cargo: 'Curadoria & Administração do Acervo',
        email: firebaseUser.email || BOOTSTRAPPED_ADMIN_EMAIL,
      };
    }
    if (!currentStudent) return null;
    return {
      role: 'student',
      student: currentStudent,
    };
  }, [firebaseUser, isAdminUser, currentStudent]);

  const setMode = (newMode: 'librarian' | 'student') => {
    if (newMode === 'librarian' && !isAdminUser) return;
    setModeState(newMode);
    sessionStorage.setItem(PORTAL_MODE_KEY, newMode);
  };

  const setCurrentStudent = (st: Student | null) => {
    if (st) {
      setSelectedStudentId(st.id);
    }
  };

  const signInWithGoogle = async (
    preferredPortal: 'student' | 'librarian'
  ): Promise<{ success: boolean; message: string }> => {
    setIsAuthenticating(true);
    rejectNonAdminSessionRef.current = preferredPortal === 'librarian';
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;
      const admin = Boolean(
        user.emailVerified &&
          user.email &&
          user.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
      );

      if (preferredPortal === 'librarian' && !admin) {
        await signOut(auth);
        rejectNonAdminSessionRef.current = false;
        setFirebaseUser(null);
        return {
          success: false,
          message:
            'Esta conta Google não possui privilégio de Gestão da Biblioteca. Entre pela aba "Portal do Leitor" ou utilize a conta administradora.',
        };
      }

      rejectNonAdminSessionRef.current = false;
      const nextMode = admin ? preferredPortal : 'student';
      setModeState(nextMode);
      sessionStorage.setItem(PORTAL_MODE_KEY, nextMode);
      setFirebaseUser(user);

      return {
        success: true,
        message: `Autenticado com sucesso como ${user.displayName || user.email}!`,
      };
    } catch (err: unknown) {
      rejectNonAdminSessionRef.current = false;
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return {
          success: false,
          message: 'Janela de login fechada antes da conclusão. Tente novamente.',
        };
      }
      if (code === 'auth/popup-blocked') {
        return {
          success: false,
          message: 'O navegador bloqueou o pop-up do Google. Permita pop-ups para continuar.',
        };
      }
      return {
        success: false,
        message: 'Não foi possível concluir o login com Google. Tente novamente.',
      };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  // Calculations
  const totalLivrosAcervo = books.length;
  const totalExemplaresFisicos = books.reduce((acc, b) => acc + b.totalExemplares, 0);
  const totalDisponiveis = books.reduce((acc, b) => acc + b.disponiveis, 0);
  const totalEmprestados = loans.filter(
    (l) => l.status === 'ativo' || l.status === 'atrasado'
  ).length;
  const totalAtrasados = loans.filter((l) => l.status === 'atrasado').length;
  const totalChegandoEmBreve = requests
    .filter((r) => r.status !== 'entregue')
    .reduce((acc, r) => acc + r.quantidade, 0);
  const totalReservasAtivas = reservations.filter((r) => r.status === 'ativa').length;

  // Actions synchronized with Cloud Firestore
  const createLoan = (bookId: string, studentId: string, days = 14) => {
    const book = books.find((b) => b.id === bookId);
    const student = students.find((s) => s.id === studentId);

    if (!book) return { success: false, message: 'Livro não localizado.' };
    if (!student) return { success: false, message: 'Leitor não localizado.' };
    if (student.statusConta === 'bloqueado_atraso') {
      return {
        success: false,
        message: 'Leitor com empréstimos atrasados pendentes na biblioteca.',
      };
    }
    if (student.livrosAtivos >= student.limiteEmprestimos) {
      return {
        success: false,
        message: `Limite de ${student.limiteEmprestimos} livros atingido para este leitor.`,
      };
    }
    if (book.disponiveis <= 0) {
      return {
        success: false,
        message: 'Não há exemplares disponíveis deste título no momento.',
      };
    }

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + clampInt(days, 1, 90));
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const loanId = sanitizeId(`l-${Date.now()}-${Math.floor(Math.random() * 1000)}`, 'l');
    const ownerUid = studentOwnerMap[student.id] || sanitizeId(`seed_${student.id}`, 'seed');
    const newDisp = clampInt(book.disponiveis - 1, 0, book.totalExemplares);
    const nextBookStatus = newDisp === 0 ? 'emprestado' : book.status;

    const batch = writeBatch(db);

    batch.set(doc(db, 'loans', loanId), {
      id: loanId,
      livroId: book.id,
      livroTitulo: sanitizeString(book.titulo, 200, 'Livro'),
      livroIsbn: sanitizeString(book.isbn, 40, '978-0000000000'),
      alunoId: student.id,
      ownerUid,
      alunoNome: sanitizeString(student.nome, 160, 'Leitor'),
      alunoMatricula: sanitizeString(student.matricula, 40, '20260000'),
      dataEmprestimo: formatDate(today),
      dataPrevistaDevolucao: formatDate(dueDate),
      status: 'ativo',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.update(doc(db, 'books', book.id), {
      disponiveis: newDisp,
      status: nextBookStatus,
      updatedAt: serverTimestamp(),
    });

    batch.update(doc(db, 'students', student.id), {
      livrosAtivos: clampInt(student.livrosAtivos + 1, 0, 50),
      totalHistoricoEmprestimos: clampInt(student.totalHistoricoEmprestimos + 1, 0, 10000),
      updatedAt: serverTimestamp(),
    });

    const matchingReservations = reservations.filter(
      (r) => r.livroId === book.id && r.alunoId === student.id && r.status === 'ativa'
    );
    for (const r of matchingReservations) {
      batch.update(doc(db, 'reservations', r.id), {
        status: 'retirada',
        updatedAt: serverTimestamp(),
      });
    }

    batch.commit().catch((err) => reportFirestoreFailure(err, OperationType.WRITE, `loans/${loanId}`));

    return {
      success: true,
      message: `Empréstimo registrado com sucesso! Devolução até ${formatDate(dueDate)}.`,
    };
  };

  const returnBook = (loanId: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan || loan.status === 'devolvido') {
      return { success: false, message: 'Empréstimo não encontrado ou já devolvido.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const book = books.find((b) => b.id === loan.livroId);
    const student = students.find((s) => s.id === loan.alunoId);

    const batch = writeBatch(db);

    batch.update(doc(db, 'loans', loan.id), {
      status: 'devolvido',
      dataDevolucao: todayStr,
      updatedAt: serverTimestamp(),
    });

    if (book) {
      const newDisp = clampInt(book.disponiveis + 1, 0, book.totalExemplares);
      batch.update(doc(db, 'books', book.id), {
        disponiveis: newDisp,
        status: newDisp > 0 ? 'disponivel' : book.status,
        updatedAt: serverTimestamp(),
      });
    }

    if (student) {
      const remainingActive = clampInt(student.livrosAtivos - 1, 0, 50);
      const otherOverdues = loans.filter(
        (other) => other.id !== loanId && other.alunoId === student.id && other.status === 'atrasado'
      );
      batch.update(doc(db, 'students', student.id), {
        livrosAtivos: remainingActive,
        statusConta: otherOverdues.length > 0 ? 'bloqueado_atraso' : 'regular',
        updatedAt: serverTimestamp(),
      });
    }

    batch
      .commit()
      .catch((err) => reportFirestoreFailure(err, OperationType.UPDATE, `loans/${loanId}`));

    return {
      success: true,
      message: `Devolução de "${loan.livroTitulo}" confirmada na biblioteca!`,
    };
  };

  const reserveBook = (bookId: string, studentId: string) => {
    if (!firebaseUser) {
      return { success: false, message: 'Faça login para reservar um exemplar.' };
    }
    const book = books.find((b) => b.id === bookId);
    const student = students.find((s) => s.id === studentId);

    if (!book || !student) return { success: false, message: 'Dados inválidos para reserva.' };

    if (student.statusConta === 'bloqueado_atraso') {
      return {
        success: false,
        message: 'Conta bloqueada por devoluções em atraso. Regularize para reservar.',
      };
    }

    const existingReservation = reservations.find(
      (r) => r.livroId === bookId && r.alunoId === studentId && r.status === 'ativa'
    );
    if (existingReservation) {
      return { success: false, message: 'Você já possui uma reserva ativa para este título.' };
    }

    const today = new Date();
    const expiry = new Date();
    expiry.setDate(today.getDate() + 7);
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const isImmediate = book.disponiveis > 0;
    const resId = sanitizeId(`r-${Date.now()}-${Math.floor(Math.random() * 1000)}`, 'r');
    const ownerUid = isAdminUser
      ? studentOwnerMap[student.id] || sanitizeId(`seed_${student.id}`, 'seed')
      : firebaseUser.uid;

    const nextDisp = isImmediate ? Math.max(0, book.disponiveis - 1) : 0;
    const nextStatus = isImmediate
      ? nextDisp === 0
        ? 'reservado'
        : book.status
      : 'reservado';

    const batch = writeBatch(db);

    batch.set(
      doc(db, 'reservations', resId),
      stripUndefined({
        id: resId,
        livroId: book.id,
        livroTitulo: sanitizeString(book.titulo, 200, 'Livro'),
        livroIsbn: book.isbn ? sanitizeString(book.isbn, 40) : undefined,
        livroCapaUrl: book.capaUrl ? sanitizeString(book.capaUrl, 500) : undefined,
        alunoId: student.id,
        ownerUid,
        alunoNome: sanitizeString(student.nome, 160, 'Leitor'),
        alunoMatricula: sanitizeString(student.matricula, 40, '20260000'),
        alunoCurso: student.curso ? sanitizeString(student.curso, 120) : undefined,
        dataReserva: formatDate(today),
        validadeReserva: formatDate(expiry),
        status: 'ativa',
        tipo: isImmediate ? 'retirada_imediata' : 'fila_espera',
        avisadoPronto: isImmediate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    batch.update(doc(db, 'books', book.id), {
      disponiveis: nextDisp,
      status: nextStatus,
      lastSyncReservationId: resId,
      updatedAt: serverTimestamp(),
    });

    batch
      .commit()
      .catch((err) => reportFirestoreFailure(err, OperationType.WRITE, `reservations/${resId}`));

    return {
      success: true,
      message: isImmediate
        ? `Reserva confirmada! 1 exemplar foi separado e aguarda sua retirada no balcão da biblioteca até ${formatDate(expiry)}.`
        : `Reserva confirmada na fila de espera! Assim que o exemplar for devolvido, ele será reservado com prioridade para você.`,
    };
  };

  const fulfillReservation = (reservationId: string, days = 14) => {
    const res = reservations.find((r) => r.id === reservationId);
    if (!res || res.status !== 'ativa') {
      return { success: false, message: 'Reserva não encontrada ou já finalizada.' };
    }
    const book = books.find((b) => b.id === res.livroId);
    const student = students.find((s) => s.id === res.alunoId);

    if (!book || !student) {
      return { success: false, message: 'Dados de livro ou leitor inválidos.' };
    }
    if (student.statusConta === 'bloqueado_atraso') {
      return { success: false, message: 'Leitor com pendências de atraso na biblioteca.' };
    }
    if (student.livrosAtivos >= student.limiteEmprestimos) {
      return {
        success: false,
        message: `Leitor atingiu o limite de ${student.limiteEmprestimos} empréstimos simultâneos.`,
      };
    }

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + clampInt(days, 1, 90));
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const loanId = sanitizeId(`l-${Date.now()}-${Math.floor(Math.random() * 1000)}`, 'l');
    const ownerUid = studentOwnerMap[student.id] || sanitizeId(`seed_${student.id}`, 'seed');

    const batch = writeBatch(db);

    batch.set(doc(db, 'loans', loanId), {
      id: loanId,
      livroId: book.id,
      livroTitulo: sanitizeString(book.titulo, 200, 'Livro'),
      livroIsbn: sanitizeString(book.isbn, 40, '978-0000000000'),
      alunoId: student.id,
      ownerUid,
      alunoNome: sanitizeString(student.nome, 160, 'Leitor'),
      alunoMatricula: sanitizeString(student.matricula, 40, '20260000'),
      dataEmprestimo: formatDate(today),
      dataPrevistaDevolucao: formatDate(dueDate),
      status: 'ativo',
      observacoes: sanitizeString(
        `Retirada de reserva no balcão (Reserva cód. ${res.id})`,
        500
      ),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.update(doc(db, 'reservations', reservationId), {
      status: 'retirada',
      updatedAt: serverTimestamp(),
    });

    batch.update(doc(db, 'students', student.id), {
      livrosAtivos: clampInt(student.livrosAtivos + 1, 0, 50),
      totalHistoricoEmprestimos: clampInt(student.totalHistoricoEmprestimos + 1, 0, 10000),
      updatedAt: serverTimestamp(),
    });

    if (res.tipo === 'fila_espera' && book.disponiveis > 0) {
      const nextDisp = Math.max(0, book.disponiveis - 1);
      batch.update(doc(db, 'books', book.id), {
        disponiveis: nextDisp,
        status: nextDisp === 0 ? 'emprestado' : book.status,
        updatedAt: serverTimestamp(),
      });
    } else if (book.disponiveis === 0 && book.status === 'reservado') {
      const hasOtherActive = reservations.some(
        (other) =>
          other.id !== reservationId && other.livroId === book.id && other.status === 'ativa'
      );
      if (!hasOtherActive) {
        batch.update(doc(db, 'books', book.id), {
          status: 'emprestado',
          updatedAt: serverTimestamp(),
        });
      }
    }

    batch
      .commit()
      .catch((err) =>
        reportFirestoreFailure(err, OperationType.WRITE, `reservations/${reservationId}`)
      );

    return {
      success: true,
      message: `Empréstimo efetivado! Exemplar de "${book.titulo}" entregue a ${student.nome}. Devolução prevista para ${formatDate(dueDate)}.`,
    };
  };

  const cancelReservation = (reservationId: string) => {
    const res = reservations.find((r) => r.id === reservationId);
    if (!res) {
      return { success: false, message: 'Reserva não encontrada no sistema.' };
    }
    if (res.status === 'cancelada') {
      return { success: false, message: 'Esta reserva já se encontra cancelada.' };
    }

    const book = books.find((b) => b.id === res.livroId);
    const batch = writeBatch(db);

    batch.update(doc(db, 'reservations', reservationId), {
      status: 'cancelada',
      updatedAt: serverTimestamp(),
    });

    if (book) {
      let nextDisp = book.disponiveis;
      let nextStatus = book.status;

      if (res.tipo === 'retirada_imediata') {
        nextDisp = Math.min(book.totalExemplares, book.disponiveis + 1);
        nextStatus = nextDisp > 0 ? 'disponivel' : book.status;
      } else if (book.status === 'reservado') {
        const hasOtherActive = reservations.some(
          (other) =>
            other.id !== reservationId && other.livroId === res.livroId && other.status === 'ativa'
        );
        if (!hasOtherActive) {
          nextStatus = book.disponiveis > 0 ? 'disponivel' : 'emprestado';
        }
      }

      batch.update(doc(db, 'books', book.id), {
        disponiveis: nextDisp,
        status: nextStatus,
        lastSyncReservationId: reservationId,
        updatedAt: serverTimestamp(),
      });
    }

    batch
      .commit()
      .catch((err) =>
        reportFirestoreFailure(err, OperationType.UPDATE, `reservations/${reservationId}`)
      );

    return {
      success: true,
      message: `Reserva do livro "${res.livroTitulo}" cancelada com sucesso! O exemplar foi liberado.`,
    };
  };

  const cancelReservationByBookAndStudent = (bookId: string, studentId: string) => {
    const res = reservations.find(
      (r) => r.livroId === bookId && r.alunoId === studentId && r.status === 'ativa'
    );
    if (!res) {
      return {
        success: false,
        message: 'Nenhuma reserva ativa encontrada para este livro e leitor.',
      };
    }
    return cancelReservation(res.id);
  };

  const notifyReservationReady = (reservationId: string) => {
    const res = reservations.find((r) => r.id === reservationId);
    if (!res || res.status !== 'ativa' || res.avisadoPronto) return;

    updateDoc(doc(db, 'reservations', reservationId), {
      avisadoPronto: true,
      updatedAt: serverTimestamp(),
    }).catch((err) =>
      reportFirestoreFailure(err, OperationType.UPDATE, `reservations/${reservationId}`)
    );
  };

  const addBook = (bookData: Omit<Book, 'id'>) => {
    if (!firebaseUser) return;
    const newId = sanitizeId(`b-${Date.now()}`, 'b');
    const newBook: Book = {
      ...bookData,
      id: newId,
    };

    setDoc(doc(db, 'books', newId), buildBookFirestoreDoc(newBook, firebaseUser.uid)).catch((err) =>
      reportFirestoreFailure(err, OperationType.CREATE, `books/${newId}`)
    );
  };

  const addStudent = (
    studentData: Omit<Student, 'id' | 'livrosAtivos' | 'dataCadastro' | 'totalHistoricoEmprestimos'>
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newId = sanitizeId(`s-${Date.now()}`, 's');
    const ownerUid = sanitizeId(`managed_${newId}`, 'managed');
    const safeEmail = sanitizeString(studentData.email, 160, 'leitor@bibliotech.org.br');
    const safePhone = sanitizeString(studentData.telefone, 40, '');

    setPrivateContacts((prev) => ({
      ...prev,
      [newId]: { email: safeEmail, telefone: safePhone },
    }));
    fetchedPrivateIdsRef.current.add(newId);

    const batch = writeBatch(db);
    batch.set(doc(db, 'students', newId), {
      id: newId,
      ownerUid,
      nome: sanitizeString(studentData.nome, 160, 'Novo Leitor'),
      matricula: sanitizeString(studentData.matricula, 40, `2026${Math.floor(1000 + Math.random() * 9000)}`),
      curso: sanitizeString(studentData.curso, 120, 'Comunidade Jovem'),
      livrosAtivos: 0,
      limiteEmprestimos: clampInt(studentData.limiteEmprestimos, 1, 20),
      statusConta: 'regular',
      dataCadastro: todayStr,
      totalHistoricoEmprestimos: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'students', newId, 'private', 'info'), {
      studentId: newId,
      ownerUid,
      email: safeEmail.length >= 3 ? safeEmail : 'leitor@bibliotech.org.br',
      telefone: safePhone,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch
      .commit()
      .catch((err) => reportFirestoreFailure(err, OperationType.CREATE, `students/${newId}`));
  };

  const createInterlibraryRequest = (
    req: Omit<InterlibraryRequest, 'id' | 'dataSolicitacao' | 'status'>
  ) => {
    if (!firebaseUser) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const newId = sanitizeId(`req-${Date.now()}`, 'req');

    setDoc(
      doc(db, 'requests', newId),
      stripUndefined({
        id: newId,
        tipo: req.tipo,
        titulo: sanitizeString(req.titulo, 200, 'Título Solicitado'),
        autor: sanitizeString(req.autor, 160, 'Autor'),
        origemUnidade: sanitizeString(req.origemUnidade, 200, 'Unidade Parceira'),
        quantidade: clampInt(req.quantidade, 1, 200),
        dataSolicitacao: todayStr,
        previsaoChegada: sanitizeString(req.previsaoChegada, 30, todayStr),
        status: 'solicitado',
        solicitante: sanitizeString(req.solicitante, 160, 'Curadoria Bibliotech'),
        observacao: req.observacao ? sanitizeString(req.observacao, 500) : undefined,
        libraryScope: 'bibliotech',
        createdByUid: sanitizeId(firebaseUser.uid, 'admin'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    ).catch((err) => reportFirestoreFailure(err, OperationType.CREATE, `requests/${newId}`));
  };

  const updateRequestStatus = (
    requestId: string,
    status: 'solicitado' | 'em_transito' | 'entregue'
  ) => {
    if (!firebaseUser) return;
    const targetReq = requests.find((r) => r.id === requestId);
    if (!targetReq || targetReq.status === 'entregue') return;

    const batch = writeBatch(db);
    batch.update(doc(db, 'requests', requestId), {
      status,
      updatedAt: serverTimestamp(),
    });

    if (status === 'entregue') {
      const existing = books.find(
        (b) => b.titulo.toLowerCase().trim() === targetReq.titulo.toLowerCase().trim()
      );
      if (existing) {
        const nextTotal = clampInt(existing.totalExemplares + targetReq.quantidade, 0, 500);
        const nextDisp = clampInt(existing.disponiveis + targetReq.quantidade, 0, nextTotal);
        batch.update(doc(db, 'books', existing.id), {
          totalExemplares: nextTotal,
          disponiveis: nextDisp,
          status: 'disponivel',
          dataPrevistaChegada: deleteField(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const newBookId = sanitizeId(`b-${Date.now()}`, 'b');
        const newBook: Book = {
          id: newBookId,
          isbn: `978-85${Math.floor(10000000 + Math.random() * 90000000)}`,
          titulo: targetReq.titulo,
          autor: targetReq.autor,
          categoria: 'Fantasia e Aventura',
          ano: 2026,
          edicao: '1ª Edição Recebida',
          localizacao: 'Estante de Lançamentos',
          totalExemplares: targetReq.quantidade,
          disponiveis: targetReq.quantidade,
          status: 'disponivel',
          descricao: `Exemplar recebido via remessa entre unidades (${targetReq.origemUnidade}).`,
        };
        batch.set(doc(db, 'books', newBookId), buildBookFirestoreDoc(newBook, firebaseUser.uid));
      }
    }

    batch
      .commit()
      .catch((err) => reportFirestoreFailure(err, OperationType.UPDATE, `requests/${requestId}`));
  };

  const sendOverdueNotice = (loanId: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan || loan.status === 'devolvido' || loan.notificacaoEnviada) return;

    updateDoc(doc(db, 'loans', loanId), {
      notificacaoEnviada: true,
      updatedAt: serverTimestamp(),
    }).catch((err) => reportFirestoreFailure(err, OperationType.UPDATE, `loans/${loanId}`));
  };

  const resetDatabase = async () => {
    if (!firebaseUser || !isAdminUser) return;
    setIsLoadingDb(true);
    try {
      const [booksSnap, studentsSnap, loansSnap, resSnap, reqSnap] = await Promise.all([
        getDocs(query(collection(db, 'books'), where('catalogPublished', '==', true))),
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'loans')),
        getDocs(collection(db, 'reservations')),
        getDocs(query(collection(db, 'requests'), where('libraryScope', '==', 'bibliotech'))),
      ]);

      // Delete private subcollection docs first while parent student docs still exist
      const privDeleteBatch = writeBatch(db);
      for (const sDoc of studentsSnap.docs) {
        privDeleteBatch.delete(doc(db, 'students', sDoc.id, 'private', 'info'));
      }
      await privDeleteBatch.commit();

      const mainDeleteBatch = writeBatch(db);
      for (const d of booksSnap.docs) mainDeleteBatch.delete(d.ref);
      for (const d of studentsSnap.docs) mainDeleteBatch.delete(d.ref);
      for (const d of loansSnap.docs) mainDeleteBatch.delete(d.ref);
      for (const d of resSnap.docs) mainDeleteBatch.delete(d.ref);
      for (const d of reqSnap.docs) mainDeleteBatch.delete(d.ref);
      await mainDeleteBatch.commit();

      fetchedPrivateIdsRef.current.clear();
      setPrivateContacts({});
      await seedInitialData(firebaseUser.uid);
    } catch (err) {
      reportFirestoreFailure(err, OperationType.DELETE, 'reset_database');
    } finally {
      setIsLoadingDb(false);
    }
  };

  return (
    <LibraryContext.Provider
      value={{
        mode,
        setMode,
        currentUser,
        currentStudent,
        setCurrentStudent,
        isAdminUser,
        authReady,
        isLoadingDb,
        isAuthenticating,
        signInWithGoogle,
        logout,
        books,
        students,
        loans,
        reservations,
        requests,
        totalLivrosAcervo,
        totalExemplaresFisicos,
        totalDisponiveis,
        totalEmprestados,
        totalAtrasados,
        totalChegandoEmBreve,
        totalReservasAtivas,
        createLoan,
        returnBook,
        reserveBook,
        fulfillReservation,
        cancelReservation,
        cancelReservationByBookAndStudent,
        notifyReservationReady,
        addBook,
        addStudent,
        createInterlibraryRequest,
        updateRequestStatus,
        sendOverdueNotice,
        resetDatabase,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
