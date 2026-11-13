# Security Specification — GAT Digital Notice Board

## 1. Data Invariants
1. **Identity Integrity**: Every user-owned document (`users/{uid}`, `students/{uid}`, `faculty/{uid}`, `bookmarks`, `noticeReads`, `notificationReads`, `activityLogs`) must store a `uid` / `userId` strictly matching `request.auth.uid`.
2. **No Self-Assigned Roles**: Non-admin users cannot create or update their `users/{uid}` document to set `role == 'admin'` or self-approve `faculty/{uid}` (`approved: true`, `canPublish: true`).
3. **Verified Email Mandate**: All authenticated write operations require `request.auth.token.email_verified == true`.
4. **Published Notice Isolation**: Non-admin, non-author users may only read notices whose `status == 'published'`. Draft, scheduled, and archived notices are strictly restricted to Admins and the notice's own author.
5. **PII Isolation**: User records in `/users/{uid}` contain emails and IDs; `get` is restricted to owner or Admin, and `list` is restricted solely to Admins.
6. **Temporal Integrity**: `createdAt`, `updatedAt`, and `readAt` timestamps are strictly enforced to equal `request.time`.
7. **Volumetric Bounds**: Every string and array field has explicit `.size()` boundaries matching `firebase-blueprint.json`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Promotion to Admin**: `POST /users/{uid}` with `{ role: "admin", status: "active" }` -> `PERMISSION_DENIED`.
2. **Self-Approving Faculty Publishing**: `POST /faculty/{uid}` with `{ approved: true, canPublish: true }` -> `PERMISSION_DENIED`.
3. **Shadow Ghost Field Injection**: `POST /notices/{id}` with extra field `{ isOfficialVerified: true }` -> `PERMISSION_DENIED`.
4. **Email Spoofing (Unverified Email)**: Authenticated token with `email: "sinchanajsinchu972@gmail.com", email_verified: false` -> `PERMISSION_DENIED`.
5. **Cross-User PII Scraping**: Student A calls `list` or `get` on `/users/{studentB}` -> `PERMISSION_DENIED`.
6. **Draft Notice Leakage**: Student queries `/notices` without `where('status', '==', 'published')` -> `PERMISSION_DENIED`.
7. **Faculty Editing Another Author's Notice**: Faculty A updates notice where `authorId == facultyB` -> `PERMISSION_DENIED`.
8. **ID Poisoning Attack**: Create document with 1500-char ID or invalid characters `../admin` -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: Create notice with backdated `createdAt` != `request.time` -> `PERMISSION_DENIED`.
10. **Immutable Field Overwrite**: Faculty updates `authorId` or `createdAt` on an existing notice -> `PERMISSION_DENIED`.
11. **Terminal State Mutation**: Faculty edits an `archived` notice or `completed` event -> `PERMISSION_DENIED`.
12. **Bookmark Orphan Creation**: Student creates bookmark referencing non-existent `noticeId` -> `PERMISSION_DENIED`.
