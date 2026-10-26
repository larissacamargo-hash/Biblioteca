# Bibliotech — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants & Relationship Mapping

1. **Default-Deny Global Safety Net**: Any path not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity Gate**: Every read and write operation requires a signed-in user with a verified email (`request.auth != null && request.auth.token.email_verified == true`).
3. **RBAC & Bootstrapped Librarian (`isAdmin`)**: Admin privileges are never read from client claims or user-editable profile fields. Admin status is granted exclusively via the bootstrapped verified librarian email (`mariaeduardaxs091@gmail.com`) or existence of `/admins/{uid}` managed solely by the bootstrapped admin.
4. **PII Isolation (Split Collection + Master Gate)**:
   - `/students/{studentId}` stores only non-PII membership fields (`nome`, `matricula`, `curso`, `livrosAtivos`, `limiteEmprestimos`, `statusConta`, `ownerUid`).
   - `/students/{studentId}/private/{infoId}` isolates PII (`email`, `telefone`) and enforces a **Master Gate** lookup against parent `/students/{studentId}` to verify ownership (`parent.ownerUid == request.auth.uid`) or `isAdmin()`. `allow list` is disabled (`false`) on `/private`.
5. **Query Enforcer (Zero Blanket List Reads & Zero `get()`/`exists()` in `list`)**:
   - `/books`: `allow list` enforces `resource.data.catalogPublished == true`.
   - `/students`, `/loans`, `/reservations`: `allow list` enforces `isBootstrappedAdmin() || resource.data.ownerUid == request.auth.uid` with zero `get()`/`exists()` calls.
   - `/requests`: `allow list` enforces `isBootstrappedAdmin() && resource.data.libraryScope == 'bibliotech'`.
6. **Bidirectional Atomic Stock Sync (`getAfter`)**:
   - A non-admin student can only create or cancel a `/reservations/{reservationId}` document if the same atomic `writeBatch` updates `/books/{livroId}` with `lastSyncReservationId == reservationId` and `updatedAt == request.time`.
   - Conversely, a non-admin student can only update `disponiveis`/`status` on `/books/{bookId}` if `getAfter(/databases/$(database)/documents/reservations/$(incoming().lastSyncReservationId))` proves a valid reservation owned by `request.auth.uid` for `bookId` updated at `request.time`.
7. **Terminal State Locking & Immutability**:
   - Once a `Reservation` reaches `'retirada'` or `'cancelada'`, or a `Loan` reaches `'devolvido'`, non-admin mutations are permanently blocked.
   - Ownership (`ownerUid`, `createdByUid`), relational foreign keys (`livroId`, `alunoId`), and creation timestamps (`createdAt`) are immutable on all updates.
   - Server timestamps (`createdAt == request.time`, `updatedAt == request.time`) are strictly enforced.

---

## 2. The "Dirty Dozen" Adversarial Payloads

All 12 payloads below MUST return `PERMISSION_DENIED`:

1. **Payload 1 — Shadow Field Injection on Book (`Ghost Field`)**:
   ```json
   {
     "id": "b-1",
     "isbn": "978-6555122640",
     "titulo": "Jujutsu Kaisen",
     "autor": "Gege Akutami",
     "categoria": "Mangás e HQs",
     "ano": 2020,
     "edicao": "1ª Edição",
     "localizacao": "Estante M-01",
     "totalExemplares": 5,
     "disponiveis": 5,
     "status": "disponivel",
     "descricao": "Mangá de ação.",
     "catalogPublished": true,
     "createdByUid": "admin-1",
     "isFeaturedHack": true
   }
   ```
2. **Payload 2 — Email Spoofing Attack (`email_verified: false`)**:
   Authenticated token with `{ email: "mariaeduardaxs091@gmail.com", email_verified: false }` attempting to create a book or read `/requests`.
3. **Payload 3 — Self-Assigned Admin Privilege Escalation**:
   Regular user `uid: "attacker-1"` writing `{ "uid": "attacker-1", "name": "Hacker", "cargo": "Admin" }` to `/admins/attacker-1`.
4. **Payload 4 — Cross-User PII Theft (PII Blanket Test)**:
   Authenticated user `uid: "student-b"` calling `getDoc` on `/students/s-1/private/info` where `ownerUid == "student-a"`.
5. **Payload 5 — Unauthorized Query Scraping on Loans (`Query Trust Test`)**:
   Authenticated user `uid: "student-b"` executing an unfiltered `getDocs(collection(db, "loans"))` without `where("ownerUid", "==", "student-b")`.
6. **Payload 6 — Identity Spoofing on Reservation Creation**:
   Authenticated user `uid: "student-b"` creating `/reservations/r-999` with `"ownerUid": "student-a"` to frame another reader.
7. **Payload 7 — Orphaned Reservation Write (Bypassing Atomic Book Stock Sync)**:
   Student creating `/reservations/r-999` alone without updating `/books/b-1` (`lastSyncReservationId`) in the same atomic batch.
8. **Payload 8 — Unpaired Book Stock Manipulation**:
   Student updating `/books/b-1` (`disponiveis: 0`) without a matching atomic reservation write in `/reservations/{lastSyncReservationId}`.
9. **Payload 9 — Student Self-Unblocking Account (`State Shortcutting`)**:
   Blocked student (`statusConta: "bloqueado_atraso"`) attempting to update `/students/s-3` to `{ "statusConta": "regular", "limiteEmprestimos": 99 }`.
10. **Payload 10 — Terminal State Reversal on Cancelled Reservation**:
    Student attempting to update `/reservations/r-cancelled` from `status: "cancelada"` back to `status: "ativa"`.
11. **Payload 11 — Resource / ID Poisoning & Oversized String (`Denial of Wallet`)**:
    Creating a document with path ID containing illegal characters or >128 chars, or `descricao` string exceeding `maxLength: 1000`.
12. **Payload 12 — Forged Client Timestamp (`Temporal Integrity Violation`)**:
    Creating or updating a `Reservation` or `Student` with a past/future client `Date` instead of `serverTimestamp()` (`request.time`).

---

## 3. Test Runner Verification

`firestore.rules.test.ts` uses `@firebase/rules-unit-testing` and `vitest` to execute all 12 Dirty Dozen payloads against `firestore.rules` and assert `assertFails(...)` (`PERMISSION_DENIED`).
