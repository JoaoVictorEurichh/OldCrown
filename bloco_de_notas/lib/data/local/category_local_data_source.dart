import 'package:sqflite/sqflite.dart';

import '../../models/category.dart';
import '../../models/sync_status.dart';
import 'app_database.dart';

/// Operações SQL da tabela `categories` (padrão **DAO / Data Source**).
class CategoryLocalDataSource {
  final AppDatabase _appDatabase;

  CategoryLocalDataSource(this._appDatabase);

  Future<Database> get _db => _appDatabase.database;

  Future<void> upsert(NoteCategory category) async {
    final db = await _db;
    await db.insert(
      'categories',
      category.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Categorias visíveis (ignora as que aguardam exclusão na nuvem).
  Future<List<NoteCategory>> visible(String uid) async {
    final db = await _db;
    final rows = await db.query(
      'categories',
      where: 'uid = ? AND sync_status != ?',
      whereArgs: [uid, SyncStatus.pendingDelete.name],
      orderBy: 'name COLLATE NOCASE ASC',
    );
    return rows.map(NoteCategory.fromMap).toList();
  }

  Future<List<NoteCategory>> all(String uid) async {
    final db = await _db;
    final rows = await db.query(
      'categories',
      where: 'uid = ?',
      whereArgs: [uid],
    );
    return rows.map(NoteCategory.fromMap).toList();
  }

  Future<List<NoteCategory>> pending(String uid) async {
    final db = await _db;
    final rows = await db.query(
      'categories',
      where: 'uid = ? AND sync_status != ?',
      whereArgs: [uid, SyncStatus.synced.name],
    );
    return rows.map(NoteCategory.fromMap).toList();
  }

  Future<bool> isEmpty(String uid) async {
    final db = await _db;
    final result = await db.rawQuery(
      'SELECT COUNT(*) AS total FROM categories WHERE uid = ?',
      [uid],
    );
    return (result.first['total'] as int) == 0;
  }

  Future<void> markSynced(String uid, String id, int updatedAt) async {
    final db = await _db;
    await db.update(
      'categories',
      {'sync_status': SyncStatus.synced.name},
      where: 'uid = ? AND id = ? AND updated_at = ? AND sync_status = ?',
      whereArgs: [uid, id, updatedAt, SyncStatus.pendingUpsert.name],
    );
  }

  Future<void> markPendingDelete(String uid, String id) async {
    final db = await _db;
    await db.update(
      'categories',
      {'sync_status': SyncStatus.pendingDelete.name},
      where: 'uid = ? AND id = ?',
      whereArgs: [uid, id],
    );
  }

  Future<void> hardDelete(String uid, String id) async {
    final db = await _db;
    await db.delete(
      'categories',
      where: 'uid = ? AND id = ?',
      whereArgs: [uid, id],
    );
  }
}
