import 'package:sqflite/sqflite.dart';

import '../../core/text_utils.dart';
import '../../models/note.dart';
import '../../models/note_sort.dart';
import '../../models/sync_status.dart';
import 'app_database.dart';

/// Operações SQL da tabela `notes` (padrão **DAO / Data Source**).
///
/// Nenhuma outra classe escreve SQL de notas: a camada de repositório usa
/// apenas estes métodos.
class NoteLocalDataSource {
  final AppDatabase _appDatabase;

  NoteLocalDataSource(this._appDatabase);

  Future<Database> get _db => _appDatabase.database;

  Future<void> upsert(Note note) async {
    final db = await _db;
    await db.insert(
      'notes',
      note.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<Note?> findById(String uid, String id) async {
    final db = await _db;
    final rows = await db.query(
      'notes',
      where: 'uid = ? AND id = ?',
      whereArgs: [uid, id],
      limit: 1,
    );
    return rows.isEmpty ? null : Note.fromMap(rows.first);
  }

  /// Todas as notas do usuário, inclusive lixeira e exclusões pendentes.
  /// Usado pela sincronização.
  Future<List<Note>> all(String uid) async {
    final db = await _db;
    final rows = await db.query('notes', where: 'uid = ?', whereArgs: [uid]);
    return rows.map(Note.fromMap).toList();
  }

  Future<List<Note>> pending(String uid) async {
    final db = await _db;
    final rows = await db.query(
      'notes',
      where: 'uid = ? AND sync_status != ?',
      whereArgs: [uid, SyncStatus.synced.name],
    );
    return rows.map(Note.fromMap).toList();
  }

  /// Consulta usada pela tela principal, pela pesquisa e pela lixeira.
  ///
  /// - [query]: cada palavra precisa aparecer no título **ou** no conteúdo
  ///   (busca em `search_index`, que é minúsculo e sem acentos);
  /// - [categoryId]: filtra por categoria (`null` = todas);
  /// - [trashed]: `false` lista notas ativas, `true` lista a lixeira.
  Future<List<Note>> query(
    String uid, {
    String query = '',
    String? categoryId,
    bool trashed = false,
    NoteSort sort = NoteSort.updatedDesc,
  }) async {
    final db = await _db;
    final where = <String>[
      'uid = ?',
      'sync_status != ?',
      trashed ? 'deleted_at IS NOT NULL' : 'deleted_at IS NULL',
    ];
    final args = <Object?>[uid, SyncStatus.pendingDelete.name];

    if (categoryId != null) {
      where.add('category_id = ?');
      args.add(categoryId);
    }
    for (final term in searchTerms(query)) {
      where.add(r"search_index LIKE ? ESCAPE '\'");
      args.add('%${_escapeLike(term)}%');
    }

    final rows = await db.query(
      'notes',
      where: where.join(' AND '),
      whereArgs: args,
      orderBy: trashed ? 'deleted_at DESC' : sort.sql,
    );
    return rows.map(Note.fromMap).toList();
  }

  Future<void> markSynced(String uid, String id, int updatedAt) async {
    final db = await _db;
    // Só marca como sincronizada se a nota não foi alterada durante o envio.
    await db.update(
      'notes',
      {'sync_status': SyncStatus.synced.name},
      where: 'uid = ? AND id = ? AND updated_at = ? AND sync_status = ?',
      whereArgs: [uid, id, updatedAt, SyncStatus.pendingUpsert.name],
    );
  }

  Future<void> hardDelete(String uid, String id) async {
    final db = await _db;
    await db.delete('notes', where: 'uid = ? AND id = ?', whereArgs: [uid, id]);
  }

  /// Remove a categoria das notas que a utilizavam.
  Future<List<Note>> clearCategory(
    String uid,
    String categoryId,
    int now,
  ) async {
    final db = await _db;
    final rows = await db.query(
      'notes',
      where: 'uid = ? AND category_id = ?',
      whereArgs: [uid, categoryId],
    );
    final changed = <Note>[];
    for (final row in rows) {
      final note = Note.fromMap(row).copyWith(
        clearCategory: true,
        updatedAt: now,
        syncStatus: SyncStatus.pendingUpsert,
      );
      await upsert(note);
      changed.add(note);
    }
    return changed;
  }

  Future<Map<String, int>> countByCategory(String uid) async {
    final db = await _db;
    final rows = await db.rawQuery(
      'SELECT category_id, COUNT(*) AS total FROM notes '
      'WHERE uid = ? AND deleted_at IS NULL AND sync_status != ? '
      'AND category_id IS NOT NULL GROUP BY category_id',
      [uid, SyncStatus.pendingDelete.name],
    );
    return {
      for (final r in rows) r['category_id'] as String: r['total'] as int,
    };
  }

  static String _escapeLike(String input) => input
      .replaceAll(r'\', r'\\')
      .replaceAll('%', r'\%')
      .replaceAll('_', r'\_');
}
