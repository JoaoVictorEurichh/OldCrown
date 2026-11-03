import 'package:bloco_de_nota_turma_a/models/sync_status.dart';
import 'package:flutter_test/flutter_test.dart';

import 'helpers/fakes.dart';

/// Testes da comunicação SQLite <-> nuvem usando um Firestore falso em
/// memória. Cada [Device] é uma instalação diferente do app, com seu
/// próprio banco SQLite.
void main() {
  setUpAll(setUpSqfliteFfi);

  const uid = 'user-a';
  late FakeRemoteDataSource cloud;
  late Device phone;
  late int now;

  setUp(() async {
    now = 1000;
    cloud = FakeRemoteDataSource();
    phone = await Device.create(cloud, clock: () => now);
  });

  tearDown(() => phone.db.close());

  test(
    'envia notas e categorias pendentes e marca como sincronizadas',
    () async {
      await phone.repository.ensureDefaultCategories(uid);
      final note = await phone.repository.createNote(
        uid: uid,
        title: 'Nuvem',
        content: 'vai para o Firestore',
        categoryId: 'default-estudos',
      );

      final result = await phone.sync.sync(uid);

      expect(result.success, isTrue);
      expect(cloud.notes[uid]![note.id]!.title, 'Nuvem');
      expect(cloud.categories[uid]!.keys, contains('default-estudos'));
      expect(await phone.repository.pendingCount(uid), 0);
      final local = await phone.notesLocal.findById(uid, note.id);
      expect(local!.syncStatus, SyncStatus.synced);
    },
  );

  test('sem conexão: mantém tudo no SQLite e envia depois', () async {
    cloud.offline = true;
    final note = await phone.repository.createNote(
      uid: uid,
      title: 'Offline',
      content: 'escrita sem internet',
    );

    final failed = await phone.sync.sync(uid);
    expect(failed.success, isFalse);
    expect(failed.offline, isTrue);
    expect(await phone.repository.pendingCount(uid), 1);
    expect((await phone.repository.getNotes(uid)).single.title, 'Offline');

    cloud.offline = false;
    final ok = await phone.sync.sync(uid);
    expect(ok.success, isTrue);
    expect(cloud.notes[uid]!.containsKey(note.id), isTrue);
    expect(await phone.repository.pendingCount(uid), 0);
  });

  test(
    'outra instalação recupera as notas da nuvem e pesquisa nelas',
    () async {
      await phone.repository.ensureDefaultCategories(uid);
      await phone.repository.createNote(
        uid: uid,
        title: 'Prova de História',
        content: 'Capítulos 3 e 4',
        categoryId: 'default-estudos',
      );
      await phone.sync.sync(uid);

      final tablet = await Device.create(cloud, clock: () => now);
      await tablet.repository.ensureDefaultCategories(uid);
      final result = await tablet.sync.sync(uid);

      expect(result.success, isTrue);
      final notes = await tablet.repository.getNotes(uid, query: 'historia');
      expect(notes.single.title, 'Prova de História');
      expect(notes.single.categoryId, 'default-estudos');
      // As categorias padrão têm ID fixo: não duplicam entre aparelhos.
      expect((await tablet.repository.getCategories(uid)).length, 3);
      expect(cloud.categories[uid]!.length, 3);
      await tablet.db.close();
    },
  );

  test('edição feita em outro aparelho substitui a versão local', () async {
    final note = await phone.repository.createNote(
      uid: uid,
      title: 'v1',
      content: 'a',
    );
    await phone.sync.sync(uid);

    final tablet = await Device.create(cloud, clock: () => now);
    await tablet.sync.sync(uid);
    now += 100;
    final onTablet = await tablet.notesLocal.findById(uid, note.id);
    await tablet.repository.updateNote(onTablet!, title: 'v2', content: 'b');
    await tablet.sync.sync(uid);

    await phone.sync.sync(uid);
    expect((await phone.repository.getNotes(uid)).single.title, 'v2');
    await tablet.db.close();
  });

  test('conflito: vence a alteração mais recente (last write wins)', () async {
    final note = await phone.repository.createNote(
      uid: uid,
      title: 'original',
      content: '',
    );
    await phone.sync.sync(uid);
    final tablet = await Device.create(cloud, clock: () => now);
    await tablet.sync.sync(uid);

    // Os dois aparelhos editam offline; o tablet edita depois.
    cloud.offline = true;
    now += 10;
    await phone.repository.updateNote(note, title: 'do celular', content: '');
    now += 10;
    final t = (await tablet.notesLocal.findById(uid, note.id))!;
    await tablet.repository.updateNote(t, title: 'do tablet', content: '');
    cloud.offline = false;

    await tablet.sync.sync(uid); // envia "do tablet"
    await phone.sync.sync(uid); // envia "do celular" (mais antiga)
    await tablet.sync.sync(uid);

    // O celular tentou enviar uma versão mais antiga: a nuvem recusou
    // (transação) e o celular baixou a versão mais recente do tablet.
    expect(cloud.notes[uid]![note.id]!.title, 'do tablet');
    expect((await phone.repository.getNotes(uid)).single.title, 'do tablet');
    expect((await tablet.repository.getNotes(uid)).single.title, 'do tablet');
    expect(await phone.repository.pendingCount(uid), 0);
    await tablet.db.close();
  });

  test('lixeira e restauração são sincronizadas', () async {
    final note = await phone.repository.createNote(
      uid: uid,
      title: 'x',
      content: '',
    );
    now += 1;
    await phone.repository.moveToTrash(note);
    await phone.sync.sync(uid);
    expect(cloud.notes[uid]![note.id]!.isInTrash, isTrue);

    final tablet = await Device.create(cloud, clock: () => now);
    await tablet.sync.sync(uid);
    expect(await tablet.repository.getNotes(uid), isEmpty);
    expect((await tablet.repository.getTrash(uid)).single.id, note.id);
    await tablet.db.close();
  });

  test('exclusão definitiva apaga na nuvem e nos outros aparelhos', () async {
    final note = await phone.repository.createNote(
      uid: uid,
      title: 'apagar',
      content: '',
    );
    await phone.sync.sync(uid);
    final tablet = await Device.create(cloud, clock: () => now);
    await tablet.sync.sync(uid);
    expect((await tablet.repository.getNotes(uid)).length, 1);

    now += 1;
    final trashed = await phone.repository.moveToTrash(note);
    await phone.repository.deletePermanently(trashed);
    final result = await phone.sync.sync(uid);
    expect(result.success, isTrue);
    expect(cloud.notes[uid], isEmpty);
    expect(await phone.notesLocal.findById(uid, note.id), isNull);

    final tabletResult = await tablet.sync.sync(uid);
    expect(tabletResult.removedLocally, 1);
    expect(await tablet.notesLocal.findById(uid, note.id), isNull);
    await tablet.db.close();
  });

  test('exclusão de categoria é sincronizada', () async {
    final cat = await phone.repository.createCategory(
      uid: uid,
      name: 'Temporária',
      color: 1,
    );
    await phone.sync.sync(uid);
    expect(cloud.categories[uid]!.containsKey(cat.id), isTrue);

    await phone.repository.deleteCategory(uid, cat.id);
    await phone.sync.sync(uid);
    expect(cloud.categories[uid]!.containsKey(cat.id), isFalse);
    expect(await phone.categoriesLocal.all(uid), isEmpty);
  });

  test('acesso negado pelas regras é informado e nada é perdido', () async {
    cloud.signedInUid = 'user-b'; // outro usuário autenticado
    await phone.repository.createNote(uid: uid, title: 'minha', content: '');
    final result = await phone.sync.sync(uid);
    expect(result.success, isFalse);
    expect(result.permissionDenied, isTrue);
    expect(cloud.notes[uid], isNull);
    expect(await phone.repository.pendingCount(uid), 1);
  });

  test('cada usuário só recebe as próprias notas', () async {
    await phone.repository.createNote(uid: uid, title: 'de A', content: '');
    await phone.sync.sync(uid);
    final result = await phone.sync.sync('user-b');
    expect(result.success, isTrue);
    expect(await phone.repository.getNotes('user-b'), isEmpty);
  });

  test('reenviar a mesma nota não cria duplicatas (ID UUID)', () async {
    final note = await phone.repository.createNote(
      uid: uid,
      title: 'uma',
      content: '',
    );
    await cloud.upsertNote(note); // ex.: envio anterior que expirou
    await phone.sync.sync(uid);
    expect(cloud.notes[uid]!.length, 1);
  });
}
