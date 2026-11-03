import 'package:uuid/uuid.dart';

import '../core/text_utils.dart';
import '../data/local/category_local_data_source.dart';
import '../data/local/note_local_data_source.dart';
import '../models/category.dart';
import '../models/note.dart';
import '../models/note_sort.dart';
import '../models/sync_status.dart';

/// Erro de validação exibido diretamente ao usuário.
class ValidationException implements Exception {
  final String message;
  const ValidationException(this.message);
  @override
  String toString() => message;
}

/// Ponto único de acesso aos dados de notas e categorias
/// (padrão **Repository**).
///
/// Estratégia *offline-first*: toda operação da interface grava primeiro
/// no SQLite e marca o registro como pendente ([SyncStatus.pendingUpsert]
/// ou [SyncStatus.pendingDelete]). O envio para o Firestore é feito depois
/// pelo `SyncService`. Assim o app funciona sem internet e nada se perde
/// se o Firebase estiver indisponível.
class NoteRepository {
  /// Notas na lixeira há mais tempo que isso são excluídas definitivamente.
  static const Duration trashRetention = Duration(days: 30);

  final NoteLocalDataSource _notes;
  final CategoryLocalDataSource _categories;
  final Uuid _uuid;
  final int Function() _clock;

  NoteRepository({
    required NoteLocalDataSource notes,
    required CategoryLocalDataSource categories,
    Uuid? uuid,
    int Function()? clock,
  }) : _notes = notes,
       _categories = categories,
       _uuid = uuid ?? const Uuid(),
       _clock = clock ?? (() => DateTime.now().millisecondsSinceEpoch);

  /// Garante que o novo `updatedAt` seja sempre maior que o anterior,
  /// mesmo que duas alterações ocorram no mesmo milissegundo.
  int _nextTimestamp(int previous) {
    final now = _clock();
    return now > previous ? now : previous + 1;
  }

  // ---------------------------------------------------------------- notas

  Future<List<Note>> getNotes(
    String uid, {
    String query = '',
    String? categoryId,
    NoteSort sort = NoteSort.updatedDesc,
  }) => _notes.query(uid, query: query, categoryId: categoryId, sort: sort);

  Future<List<Note>> getTrash(String uid) => _notes.query(uid, trashed: true);

  Future<Note> createNote({
    required String uid,
    required String title,
    required String content,
    String? categoryId,
  }) async {
    _validate(title, content);
    final now = _clock();
    final note = Note(
      id: _uuid.v4(),
      uid: uid,
      title: title.trim(),
      content: content.trim(),
      categoryId: categoryId,
      createdAt: now,
      updatedAt: now,
    );
    await _notes.upsert(note);
    return note;
  }

  Future<Note> updateNote(
    Note note, {
    required String title,
    required String content,
    String? categoryId,
  }) async {
    _validate(title, content);
    final updated = note.copyWith(
      title: title.trim(),
      content: content.trim(),
      categoryId: categoryId,
      clearCategory: categoryId == null,
      updatedAt: _nextTimestamp(note.updatedAt),
      syncStatus: SyncStatus.pendingUpsert,
    );
    await _notes.upsert(updated);
    return updated;
  }

  /// Lixeira: a nota continua existindo (local e na nuvem) com `deletedAt`
  /// preenchido e pode ser restaurada.
  Future<Note> moveToTrash(Note note) async {
    final ts = _nextTimestamp(note.updatedAt);
    final trashed = note.copyWith(
      deletedAt: ts,
      updatedAt: ts,
      syncStatus: SyncStatus.pendingUpsert,
    );
    await _notes.upsert(trashed);
    return trashed;
  }

  Future<Note> restoreFromTrash(Note note) async {
    final restored = note.copyWith(
      clearDeletedAt: true,
      updatedAt: _nextTimestamp(note.updatedAt),
      syncStatus: SyncStatus.pendingUpsert,
    );
    await _notes.upsert(restored);
    return restored;
  }

  /// Exclusão definitiva: marca como `pendingDelete`. O registro some da
  /// interface imediatamente e é apagado do SQLite depois que o Firestore
  /// confirmar a exclusão.
  Future<void> deletePermanently(Note note) async {
    await _notes.upsert(note.copyWith(syncStatus: SyncStatus.pendingDelete));
  }

  Future<int> emptyTrash(String uid) async {
    final trash = await getTrash(uid);
    for (final note in trash) {
      await deletePermanently(note);
    }
    return trash.length;
  }

  /// Exclui definitivamente as notas que estão na lixeira há mais de
  /// [trashRetention].
  Future<int> purgeExpiredTrash(String uid) async {
    final limit = _clock() - trashRetention.inMilliseconds;
    final expired = (await getTrash(
      uid,
    )).where((n) => n.deletedAt! < limit).toList();
    for (final note in expired) {
      await deletePermanently(note);
    }
    return expired.length;
  }

  Future<int> pendingCount(String uid) async =>
      (await _notes.pending(uid)).length +
      (await _categories.pending(uid)).length;

  void _validate(String title, String content) {
    if (title.trim().isEmpty && content.trim().isEmpty) {
      throw const ValidationException('Escreva um título ou um conteúdo.');
    }
    if (title.trim().length > 200) {
      throw const ValidationException(
        'O título pode ter no máximo 200 caracteres.',
      );
    }
  }

  // ----------------------------------------------------------- categorias

  Future<List<NoteCategory>> getCategories(String uid) =>
      _categories.visible(uid);

  Future<Map<String, int>> countByCategory(String uid) =>
      _notes.countByCategory(uid);

  /// Cria Estudos/Trabalho/Pessoal na primeira vez que o usuário usa o app
  /// neste aparelho.
  Future<void> ensureDefaultCategories(String uid) async {
    if (await _categories.isEmpty(uid)) {
      for (final c in NoteCategory.defaults(uid, _clock())) {
        await _categories.upsert(c);
      }
    }
  }

  Future<NoteCategory> createCategory({
    required String uid,
    required String name,
    required int color,
  }) async {
    final clean = name.trim();
    if (clean.isEmpty) {
      throw const ValidationException('Informe o nome da categoria.');
    }
    if (clean.length > 40) {
      throw const ValidationException(
        'O nome pode ter no máximo 40 caracteres.',
      );
    }
    final existing = await _categories.visible(uid);
    if (existing.any(
      (c) => normalizeForSearch(c.name) == normalizeForSearch(clean),
    )) {
      throw const ValidationException('Já existe uma categoria com esse nome.');
    }
    final category = NoteCategory(
      id: _uuid.v4(),
      uid: uid,
      name: clean,
      color: color,
      updatedAt: _clock(),
    );
    await _categories.upsert(category);
    return category;
  }

  /// Exclui a categoria. As notas que a usavam ficam "Sem categoria".
  Future<void> deleteCategory(String uid, String categoryId) async {
    await _notes.clearCategory(uid, categoryId, _clock());
    await _categories.markPendingDelete(uid, categoryId);
  }
}
