// Testes das regras de segurança (../firestore.rules) no emulador do
// Firestore. Executar com: npm install && npm test
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

let env;

const note = (uid, extra = {}) => ({
  uid,
  title: 'Minha nota',
  content: 'conteúdo',
  categoryId: null,
  createdAt: 1,
  updatedAt: 2,
  deletedAt: null,
  serverUpdatedAt: serverTimestamp(),
  ...extra,
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-bloco-de-notas',
    firestore: { rules: readFileSync('../firestore.rules', 'utf8') },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  // Nota existente da Ana, criada sem passar pelas regras.
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users/ana/notes/n1'), {
      ...note('ana'),
      serverUpdatedAt: new Date(),
    });
  });
});

after(() => env.cleanup());

test('dono lê, cria, edita e exclui as próprias notas', async () => {
  const db = env.authenticatedContext('ana').firestore();
  await assertSucceeds(getDoc(doc(db, 'users/ana/notes/n1')));
  await assertSucceeds(getDocs(collection(db, 'users/ana/notes')));
  await assertSucceeds(setDoc(doc(db, 'users/ana/notes/n2'), note('ana')));
  await assertSucceeds(
    setDoc(doc(db, 'users/ana/notes/n1'), note('ana', { title: 'editada' })),
  );
  await assertSucceeds(deleteDoc(doc(db, 'users/ana/notes/n1')));
});

test('outro usuário não lê, não altera e não exclui', async () => {
  const db = env.authenticatedContext('bruno').firestore();
  await assertFails(getDoc(doc(db, 'users/ana/notes/n1')));
  await assertFails(getDocs(collection(db, 'users/ana/notes')));
  await assertFails(setDoc(doc(db, 'users/ana/notes/n1'), note('ana')));
  await assertFails(setDoc(doc(db, 'users/ana/notes/n9'), note('bruno')));
  await assertFails(deleteDoc(doc(db, 'users/ana/notes/n1')));
});

test('usuário não autenticado não acessa nada', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'users/ana/notes/n1')));
  await assertFails(setDoc(doc(db, 'users/ana/notes/n3'), note('ana')));
});

test('campo uid precisa ser o do dono', async () => {
  const db = env.authenticatedContext('ana').firestore();
  await assertFails(setDoc(doc(db, 'users/ana/notes/n4'), note('bruno')));
});

test('dados inválidos são recusados', async () => {
  const db = env.authenticatedContext('ana').firestore();
  await assertFails(
    setDoc(doc(db, 'users/ana/notes/n5'), note('ana', { title: 123 })),
  );
  await assertFails(
    setDoc(doc(db, 'users/ana/notes/n5'), note('ana', { title: 'x'.repeat(201) })),
  );
  await assertFails(
    setDoc(doc(db, 'users/ana/notes/n5'), note('ana', { admin: true })),
  );
  await assertFails(
    setDoc(doc(db, 'users/ana/notes/n5'), note('ana', { serverUpdatedAt: new Date(0) })),
  );
});

test('categorias seguem as mesmas regras', async () => {
  const category = (uid, extra = {}) => ({
    uid,
    name: 'Estudos',
    color: 0xff3d7bd9,
    updatedAt: 1,
    serverUpdatedAt: serverTimestamp(),
    ...extra,
  });
  const ana = env.authenticatedContext('ana').firestore();
  const bruno = env.authenticatedContext('bruno').firestore();
  await assertSucceeds(setDoc(doc(ana, 'users/ana/categories/c1'), category('ana')));
  await assertSucceeds(getDoc(doc(ana, 'users/ana/categories/c1')));
  await assertFails(getDoc(doc(bruno, 'users/ana/categories/c1')));
  await assertFails(setDoc(doc(bruno, 'users/ana/categories/c2'), category('ana')));
  await assertFails(setDoc(doc(ana, 'users/ana/categories/c3'), category('ana', { name: '' })));
});

test('caminhos fora de users/{uid} são bloqueados', async () => {
  const db = env.authenticatedContext('ana').firestore();
  await assertFails(setDoc(doc(db, 'notes/global'), { a: 1 }));
  await assertFails(getDoc(doc(db, 'users/ana')));
});
