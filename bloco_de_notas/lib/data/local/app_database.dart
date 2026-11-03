import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';

import '../../core/text_utils.dart';

/// Acesso ao banco SQLite local (padrão **Singleton**).
///
/// Uma única conexão é aberta e reaproveitada por todo o app através de
/// [AppDatabase.instance]. Nos testes é criada uma instância separada com
/// [AppDatabase.new] apontando para um banco em memória.
class AppDatabase {
  static const int schemaVersion = 2;
  static const String fileName = 'notes.db';

  static final AppDatabase instance = AppDatabase();

  /// Caminho do arquivo. Quando `null`, usa a pasta padrão do sqflite.
  final String? path;

  AppDatabase({this.path});

  Database? _database;

  Future<Database> get database async {
    return _database ??= await _open();
  }

  Future<Database> _open() async {
    final dbPath = path ?? join(await getDatabasesPath(), fileName);
    return openDatabase(
      dbPath,
      version: schemaVersion,
      onConfigure: (db) => db.execute('PRAGMA foreign_keys = OFF'),
      onCreate: (db, version) => _createSchema(db),
      onUpgrade: _upgrade,
    );
  }

  Future<void> close() async {
    await _database?.close();
    _database = null;
  }

  static Future<void> _createSchema(DatabaseExecutor db) async {
    await db.execute('''
      CREATE TABLE notes(
        id TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT NOT NULL,
        search_index TEXT NOT NULL
      )
    ''');
    await db.execute('CREATE INDEX idx_notes_uid ON notes(uid)');
    await db.execute('''
      CREATE TABLE categories(
        id TEXT NOT NULL,
        uid TEXT NOT NULL,
        name TEXT NOT NULL,
        color INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        sync_status TEXT NOT NULL,
        PRIMARY KEY (uid, id)
      )
    ''');
  }

  /// Migração da versão 1 (projeto base: `id INTEGER`, `date TEXT`) para a
  /// versão 2 (UUID, categorias, lixeira e controle de sincronização).
  /// As notas antigas são preservadas e marcadas como pendentes de envio.
  static Future<void> _upgrade(
    Database db,
    int oldVersion,
    int newVersion,
  ) async {
    if (oldVersion < 2) {
      final hasOld = (await db.rawQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='notes'",
      )).isNotEmpty;
      List<Map<String, Object?>> oldRows = [];
      if (hasOld) {
        oldRows = await db.query('notes');
        await db.execute('DROP TABLE notes');
      }
      await _createSchema(db);
      final now = DateTime.now().millisecondsSinceEpoch;
      const uuid = Uuid();
      for (final row in oldRows) {
        final title = row['title'] as String? ?? '';
        final content = row['content'] as String? ?? '';
        await db.insert('notes', {
          'id': uuid.v4(),
          'uid': row['uid'],
          'title': title,
          'content': content,
          'category_id': null,
          'created_at': now,
          'updated_at': now,
          'deleted_at': null,
          'sync_status': 'pendingUpsert',
          'search_index': normalizeForSearch('$title\n$content'),
        });
      }
    }
  }
}
