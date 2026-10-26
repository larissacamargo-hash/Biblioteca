import { readFileSync } from 'node:fs';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const ADMIN_UID = 'admin-uid-1';
const ADMIN_EMAIL = 'mariaeduardaxs091@gmail.com';
const STUDENT_A_UID = 'student-a';
const STUDENT_B_UID = 'student-b';

describe('Bibliotech Firestore Security Rules — Dirty Dozen Red Team Suite', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-bibliotech-security',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      const now = Timestamp.now();

      await setDoc(doc(db, 'books', 'b-1'), {
        id: 'b-1',
        isbn: '978-6555122640',
        titulo: 'Jujutsu Kaisen Vol. 1',
        autor: 'Gege Akutami',
        categoria: 'Mangás e HQs',
        ano: 2020,
        edicao: '1ª Edição',
        localizacao: 'Estante M-01',
        totalExemplares: 5,
        disponiveis: 4,
        status: 'disponivel',
        descricao: 'Mangá de ação sobrenatural.',
        catalogPublished: true,
        createdByUid: ADMIN_UID,
        createdAt: now,
        updatedAt: now,
      });

      await setDoc(doc(db, 'students', STUDENT_A_UID), {
        id: STUDENT_A_UID,
        ownerUid: STUDENT_A_UID,
        nome: 'Beatriz Oliveira',
        matricula: '20260182',
        curso: 'Clube Jovem',
        livrosAtivos: 0,
        limiteEmprestimos: 4,
        statusConta: 'regular',
        dataCadastro: '2026-02-10',
        totalHistoricoEmprestimos: 2,
        createdAt: now,
        updatedAt: now,
      });

      await setDoc(doc(db, 'students', STUDENT_A_UID, 'private', 'info'), {
        studentId: STUDENT_A_UID,
        ownerUid: STUDENT_A_UID,
        email: 'beatriz@email.com',
        telefone: '(11) 98888-7777',
        createdAt: now,
        updatedAt: now,
      });

      await setDoc(doc(db, 'students', STUDENT_B_UID), {
        id: STUDENT_B_UID,
        ownerUid: STUDENT_B_UID,
        nome: 'Mariana Silva',
        matricula: '20260319',
        curso: 'Clube Fantasia',
        livrosAtivos: 1,
        limiteEmprestimos: 4,
        statusConta: 'bloqueado_atraso',
        dataCadastro: '2026-02-12',
        totalHistoricoEmprestimos: 5,
        createdAt: now,
        updatedAt: now,
      });

      await setDoc(doc(db, 'loans', 'l-1'), {
        id: 'l-1',
        livroId: 'b-1',
        livroTitulo: 'Jujutsu Kaisen Vol. 1',
        livroIsbn: '978-6555122640',
        alunoId: STUDENT_A_UID,
        ownerUid: STUDENT_A_UID,
        alunoNome: 'Beatriz Oliveira',
        alunoMatricula: '20260182',
        dataEmprestimo: '2026-10-18',
        dataPrevistaDevolucao: '2026-11-01',
        status: 'ativo',
        createdAt: now,
        updatedAt: now,
      });

      await setDoc(doc(db, 'reservations', 'r-cancelled'), {
        id: 'r-cancelled',
        livroId: 'b-1',
        livroTitulo: 'Jujutsu Kaisen Vol. 1',
        alunoId: STUDENT_A_UID,
        ownerUid: STUDENT_A_UID,
        alunoNome: 'Beatriz Oliveira',
        alunoMatricula: '20260182',
        dataReserva: '2026-10-20',
        validadeReserva: '2026-10-27',
        status: 'cancelada',
        tipo: 'retirada_imediata',
        createdAt: now,
        updatedAt: now,
      });
    });
  });

  it('1. Rejects Shadow Field injection on Book creation', async () => {
    const adminDb = testEnv.authenticatedContext(ADMIN_UID, {
      email: ADMIN_EMAIL,
      email_verified: true,
    }).firestore();

    await assertFails(
      setDoc(doc(adminDb, 'books', 'b-shadow'), {
        id: 'b-shadow',
        isbn: '978-6555122640',
        titulo: 'Livro Teste',
        autor: 'Autor',
        categoria: 'Romance',
        ano: 2024,
        edicao: '1ª',
        localizacao: 'Estante R-1',
        totalExemplares: 3,
        disponiveis: 3,
        status: 'disponivel',
        descricao: 'Resumo curto.',
        catalogPublished: true,
        createdByUid: ADMIN_UID,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isVerifiedHack: true,
      })
    );
  });

  it('2. Rejects Email Spoofing when email_verified is false', async () => {
    const spoofedAdminDb = testEnv.authenticatedContext('spoof-uid', {
      email: ADMIN_EMAIL,
      email_verified: false,
    }).firestore();

    await assertFails(
      setDoc(doc(spoofedAdminDb, 'books', 'b-spoof'), {
        id: 'b-spoof',
        isbn: '978-6555122640',
        titulo: 'Livro Spoof',
        autor: 'Autor',
        categoria: 'Romance',
        ano: 2024,
        edicao: '1ª',
        localizacao: 'Estante R-1',
        totalExemplares: 3,
        disponiveis: 3,
        status: 'disponivel',
        descricao: 'Resumo.',
        catalogPublished: true,
        createdByUid: 'spoof-uid',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('3. Rejects Self-Assigned Admin privilege escalation', async () => {
    const attackerDb = testEnv.authenticatedContext(STUDENT_B_UID, {
      email: 'attacker@gmail.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      setDoc(doc(attackerDb, 'admins', STUDENT_B_UID), {
        uid: STUDENT_B_UID,
        name: 'Hacker',
        cargo: 'Super Admin',
        createdAt: serverTimestamp(),
      })
    );
  });

  it('4. Rejects Cross-User PII theft on student private subcollection', async () => {
    const studentBDb = testEnv.authenticatedContext(STUDENT_B_UID, {
      email: 'mariana@email.com',
      email_verified: true,
    }).firestore();

    await assertFails(getDoc(doc(studentBDb, 'students', STUDENT_A_UID, 'private', 'info')));
  });

  it('5. Rejects Unauthorized Query Scraping on unfiltered Loans list', async () => {
    const studentBDb = testEnv.authenticatedContext(STUDENT_B_UID, {
      email: 'mariana@email.com',
      email_verified: true,
    }).firestore();

    await assertFails(getDocs(collection(studentBDb, 'loans')));
  });

  it('6. Rejects Identity Spoofing on Reservation creation', async () => {
    const studentBDb = testEnv.authenticatedContext(STUDENT_B_UID, {
      email: 'mariana@email.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      setDoc(doc(studentBDb, 'reservations', 'r-spoof'), {
        id: 'r-spoof',
        livroId: 'b-1',
        livroTitulo: 'Jujutsu Kaisen Vol. 1',
        alunoId: STUDENT_A_UID,
        ownerUid: STUDENT_A_UID,
        alunoNome: 'Beatriz Oliveira',
        alunoMatricula: '20260182',
        dataReserva: '2026-10-26',
        validadeReserva: '2026-11-02',
        status: 'ativa',
        tipo: 'retirada_imediata',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('7. Rejects Orphaned Reservation write without atomic Book sync', async () => {
    const studentADb = testEnv.authenticatedContext(STUDENT_A_UID, {
      email: 'beatriz@email.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      setDoc(doc(studentADb, 'reservations', 'r-orphan'), {
        id: 'r-orphan',
        livroId: 'b-1',
        livroTitulo: 'Jujutsu Kaisen Vol. 1',
        alunoId: STUDENT_A_UID,
        ownerUid: STUDENT_A_UID,
        alunoNome: 'Beatriz Oliveira',
        alunoMatricula: '20260182',
        dataReserva: '2026-10-26',
        validadeReserva: '2026-11-02',
        status: 'ativa',
        tipo: 'retirada_imediata',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('8. Rejects Unpaired Book stock manipulation by a student', async () => {
    const studentADb = testEnv.authenticatedContext(STUDENT_A_UID, {
      email: 'beatriz@email.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      updateDoc(doc(studentADb, 'books', 'b-1'), {
        disponiveis: 0,
        status: 'reservado',
        lastSyncReservationId: 'non-existent',
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('9. Rejects Student self-unblocking account status or raising loan limits', async () => {
    const studentBDb = testEnv.authenticatedContext(STUDENT_B_UID, {
      email: 'mariana@email.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      updateDoc(doc(studentBDb, 'students', STUDENT_B_UID), {
        statusConta: 'regular',
        limiteEmprestimos: 20,
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('10. Rejects Terminal State reversal on a cancelled reservation', async () => {
    const studentADb = testEnv.authenticatedContext(STUDENT_A_UID, {
      email: 'beatriz@email.com',
      email_verified: true,
    }).firestore();

    await assertFails(
      updateDoc(doc(studentADb, 'reservations', 'r-cancelled'), {
        status: 'ativa',
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('11. Rejects Oversized String payload (Denial of Wallet protection)', async () => {
    const adminDb = testEnv.authenticatedContext(ADMIN_UID, {
      email: ADMIN_EMAIL,
      email_verified: true,
    }).firestore();

    await assertFails(
      setDoc(doc(adminDb, 'books', 'b-huge'), {
        id: 'b-huge',
        isbn: '978-6555122640',
        titulo: 'Livro',
        autor: 'Autor',
        categoria: 'Romance',
        ano: 2024,
        edicao: '1ª',
        localizacao: 'Estante',
        totalExemplares: 1,
        disponiveis: 1,
        status: 'disponivel',
        descricao: 'X'.repeat(1500),
        catalogPublished: true,
        createdByUid: ADMIN_UID,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('12. Rejects Forged Client Timestamp instead of serverTimestamp()', async () => {
    const adminDb = testEnv.authenticatedContext(ADMIN_UID, {
      email: ADMIN_EMAIL,
      email_verified: true,
    }).firestore();

    await assertFails(
      setDoc(doc(adminDb, 'books', 'b-forged-time'), {
        id: 'b-forged-time',
        isbn: '978-6555122640',
        titulo: 'Livro',
        autor: 'Autor',
        categoria: 'Romance',
        ano: 2024,
        edicao: '1ª',
        localizacao: 'Estante',
        totalExemplares: 1,
        disponiveis: 1,
        status: 'disponivel',
        descricao: 'Resumo.',
        catalogPublished: true,
        createdByUid: ADMIN_UID,
        createdAt: Timestamp.fromMillis(1000000),
        updatedAt: Timestamp.fromMillis(1000000),
      })
    );
  });

  it('Allows valid atomic Reservation + Book stock hold by a regular student', async () => {
    const studentADb = testEnv.authenticatedContext(STUDENT_A_UID, {
      email: 'beatriz@email.com',
      email_verified: true,
    }).firestore();

    const batch = writeBatch(studentADb);
    batch.set(doc(studentADb, 'reservations', 'r-valid-1'), {
      id: 'r-valid-1',
      livroId: 'b-1',
      livroTitulo: 'Jujutsu Kaisen Vol. 1',
      alunoId: STUDENT_A_UID,
      ownerUid: STUDENT_A_UID,
      alunoNome: 'Beatriz Oliveira',
      alunoMatricula: '20260182',
      dataReserva: '2026-10-26',
      validadeReserva: '2026-11-02',
      status: 'ativa',
      tipo: 'retirada_imediata',
      avisadoPronto: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(studentADb, 'books', 'b-1'), {
      disponiveis: 3,
      status: 'disponivel',
      lastSyncReservationId: 'r-valid-1',
      updatedAt: serverTimestamp(),
    });

    await assertSucceeds(batch.commit());
  });
});
