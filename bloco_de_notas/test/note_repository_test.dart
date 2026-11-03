import 'package:bloco_de_nota_turma_a/models/note_sort.dart';
import 'package:bloco_de_nota_turma_a/models/sync_status.dart';
import 'package:bloco_de_nota_turma_a/repositories/note_repository.dart';
import 'package:flutter_test/flutter_test.dart';

import 'helpers/fakes.dart';

void main() {
  setUpAll(setUpSqfliteFfi);

  const uid = 'user-a';
  late Device device;
  late int now;

  setUp(() async {
    now = 1000000;
    device = await Device.create(FakeRemoteDataSource(), clock: () => now);
  });

  tearDown(() => device.db.close());

  NoteRepository repo() => device.repository;

  group('CRUD local', () {
    test('cria, consulta, edita e marca como pendente', () async {
      final note = await repo().createNote(
        uid: uid,
        title: 'Lista',
        content: 'Comprar pão',
      );
      expect(note.syncStatus, SyncStatus.pendingUpsert);
      expect((await repo().getNotes(uid)).single.title, 'Lista');

      now += 10;
      final edited = await repo().updateNote(
        note,
        title: 'Lista de compras',
        content: 'Pão e leite',
      );
      expect(edited.updatedAt, greaterThan(note.updatedAt));
      expect(edited.createdAt, note.createdAt);
      final stored = (await repo().getNotes(uid)).single;
      expect(stored.title, 'Lista de compras');
      expect(stored.content, 'Pão e leite');
    });

    test('não aceita nota vazia', () async {
      expect(
        () => repo().createNote(uid: uid, title: '  ', content: ''),
        throwsA(isA<ValidationException>()),
      );
    });

    test('notas de outro usuário não aparecem', () async {
      await repo().createNote(uid: 'outro', title: 'Secreta', content: 'x');
      expect(await repo().getNotes(uid), isEmpty);
    });
  });

  group('Pesquisa', () {
    setUp(() async {
      await repo().createNote(
        uid: uid,
        title: 'Reunião de equipe',
        content: 'Pauta: orçamento',
      );
      await repo().createNote(
        uid: uid,
        title: 'Estudar',
        content: 'Prova de cálculo na sexta',
      );
      await repo().createNote(
        uid: uid,
        title: 'Receita',
        content: 'Bolo 100% integral',
      );
    });

    Future<List<String>> search(String q, {String? categoryId}) async =>
        (await repo().getNotes(
          uid,
          query: q,
          categoryId: categoryId,
        )).map((n) => n.title).toList();

    test('pesquisa pelo título', () async {
      expect(await search('reuniao'), ['Reunião de equipe']);
    });

    test(
      'pesquisa pelo conteúdo, sem diferenciar acentos/maiúsculas',
      () async {
        expect(await search('CALCULO'), ['Estudar']);
        expect(await search('orçamento'), ['Reunião de equipe']);
      },
    );

    test('várias palavras precisam aparecer (título ou conteúdo)', () async {
      expect(await search('estudar sexta'), ['Estudar']);
      expect(await search('estudar bolo'), isEmpty);
    });

    test('caracteres especiais do LIKE são tratados literalmente', () async {
      expect(await search('100%'), ['Receita']);
      expect(await search('%'), ['Receita']);
      expect(await search('_'), isEmpty);
    });

    test('pesquisa não retorna notas da lixeira', () async {
      final note = (await repo().getNotes(uid, query: 'receita')).single;
      await repo().moveToTrash(note);
      expect(await search('receita'), isEmpty);
    });
  });

  group('Categorias', () {
    test('cria categorias padrão uma única vez', () async {
      await repo().ensureDefaultCategories(uid);
      await repo().ensureDefaultCategories(uid);
      final names = (await repo().getCategories(uid)).map((c) => c.name);
      expect(names, ['Estudos', 'Pessoal', 'Trabalho']);
    });

    test('cria categoria do usuário e impede nome duplicado', () async {
      await repo().createCategory(uid: uid, name: 'Faculdade', color: 1);
      expect(
        () => repo().createCategory(uid: uid, name: ' faculdade ', color: 2),
        throwsA(isA<ValidationException>()),
      );
    });

    test('filtra notas por categoria e combina com a pesquisa', () async {
      final work = await repo().createCategory(
        uid: uid,
        name: 'Trabalho',
        color: 1,
      );
      await repo().createNote(
        uid: uid,
        title: 'Relatório',
        content: 'entregar',
        categoryId: work.id,
      );
      await repo().createNote(uid: uid, title: 'Mercado', content: 'entregar');

      final filtered = await repo().getNotes(uid, categoryId: work.id);
      expect(filtered.map((n) => n.title), ['Relatório']);
      final both = await repo().getNotes(
        uid,
        categoryId: work.id,
        query: 'entregar',
      );
      expect(both.length, 1);
      expect((await repo().countByCategory(uid))[work.id], 1);
    });

    test('excluir categoria mantém as notas, sem categoria', () async {
      final cat = await repo().createCategory(uid: uid, name: 'X', color: 1);
      await repo().createNote(
        uid: uid,
        title: 'n',
        content: 'c',
        categoryId: cat.id,
      );
      await repo().deleteCategory(uid, cat.id);
      expect(await repo().getCategories(uid), isEmpty);
      final note = (await repo().getNotes(uid)).single;
      expect(note.categoryId, isNull);
      expect(note.syncStatus, SyncStatus.pendingUpsert);
    });
  });

  group('Ordenação', () {
    test('por criação e por última atualização', () async {
      final a = await repo().createNote(uid: uid, title: 'A', content: '');
      now += 10;
      await repo().createNote(uid: uid, title: 'B', content: '');
      now += 10;
      await repo().updateNote(a, title: 'A', content: 'editada');

      Future<List<String>> order(NoteSort s) async =>
          (await repo().getNotes(uid, sort: s)).map((n) => n.title).toList();

      expect(await order(NoteSort.updatedDesc), ['A', 'B']);
      expect(await order(NoteSort.createdDesc), ['B', 'A']);
      expect(await order(NoteSort.createdAsc), ['A', 'B']);
    });
  });

  group('Lixeira', () {
    test('mover, restaurar e excluir definitivamente', () async {
      final note = await repo().createNote(uid: uid, title: 'T', content: 'c');
      now += 1;
      final trashed = await repo().moveToTrash(note);
      expect(await repo().getNotes(uid), isEmpty);
      expect((await repo().getTrash(uid)).single.id, note.id);

      now += 1;
      await repo().restoreFromTrash(trashed);
      expect((await repo().getNotes(uid)).single.isInTrash, isFalse);

      final again = await repo().moveToTrash(
        (await repo().getNotes(uid)).single,
      );
      await repo().deletePermanently(again);
      expect(await repo().getTrash(uid), isEmpty);
      // Continua no SQLite como pendingDelete até a nuvem confirmar.
      final raw = await device.notesLocal.findById(uid, note.id);
      expect(raw!.syncStatus, SyncStatus.pendingDelete);
    });

    test('exclui automaticamente itens com mais de 30 dias', () async {
      final old = await repo().createNote(uid: uid, title: 'v', content: '');
      await repo().moveToTrash(old);
      now += const Duration(days: 31).inMilliseconds;
      final recent = await repo().createNote(uid: uid, title: 'r', content: '');
      await repo().moveToTrash(recent);

      expect(await repo().purgeExpiredTrash(uid), 1);
      expect((await repo().getTrash(uid)).single.title, 'r');
    });
  });
}
