import 'dart:io';

import 'package:bloco_de_nota_turma_a/data/local/app_database.dart';
import 'package:bloco_de_nota_turma_a/data/local/category_local_data_source.dart';
import 'package:bloco_de_nota_turma_a/data/local/note_local_data_source.dart';
import 'package:bloco_de_nota_turma_a/data/remote/remote_data_source.dart';
import 'package:bloco_de_nota_turma_a/models/category.dart';
import 'package:bloco_de_nota_turma_a/models/note.dart';
import 'package:bloco_de_nota_turma_a/models/sync_status.dart';
import 'package:bloco_de_nota_turma_a/repositories/note_repository.dart';
import 'package:bloco_de_nota_turma_a/services/sync_service.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

/// Inicializa o sqflite em modo FFI (SQLite nativo do computador) para os
/// testes rodarem sem emulador.
void setUpSqfliteFfi() {
  sqfliteFfiInit();
  databaseFactory = databaseFactoryFfi;
}

/// "Firestore" em memória: um mapa por usuário, simulando
/// `users/{uid}/notes` e `users/{uid}/categories`.
///
/// Também simula as regras de segurança: só o usuário autenticado
/// ([signedInUid]) acessa os próprios dados.
class FakeRemoteDataSource implements RemoteDataSource {
  final Map<String, Map<String, Note>> notes = {};
  final Map<String, Map<String, NoteCategory>> categories = {};

  bool offline = false;
  String? signedInUid;

  int writes = 0;

  void _check(String uid) {
    if (offline) {
      throw const RemoteException('Sem conexão', offline: true);
    }
    if (signedInUid != null && signedInUid != uid) {
      throw const RemoteException('Acesso negado', permissionDenied: true);
    }
  }

  @override
  Future<List<Note>> fetchNotes(String uid) async {
    _check(uid);
    return (notes[uid] ?? {}).values.toList();
  }

  @override
  Future<bool> upsertNote(Note note) async {
    _check(note.uid);
    final current = notes[note.uid]?[note.id];
    if (current != null && current.updatedAt > note.updatedAt) return false;
    writes++;
    (notes[note.uid] ??= {})[note.id] = note.copyWith(
      syncStatus: SyncStatus.synced,
    );
    return true;
  }

  @override
  Future<void> deleteNote(String uid, String id) async {
    _check(uid);
    notes[uid]?.remove(id);
  }

  @override
  Future<List<NoteCategory>> fetchCategories(String uid) async {
    _check(uid);
    return (categories[uid] ?? {}).values.toList();
  }

  @override
  Future<void> upsertCategory(NoteCategory category) async {
    _check(category.uid);
    writes++;
    (categories[category.uid] ??= {})[category.id] = category.copyWith(
      syncStatus: SyncStatus.synced,
    );
  }

  @override
  Future<void> deleteCategory(String uid, String id) async {
    _check(uid);
    categories[uid]?.remove(id);
  }
}

/// Uma "instalação" do app: banco SQLite próprio + repositório + sync.
class Device {
  final AppDatabase db;
  final NoteLocalDataSource notesLocal;
  final CategoryLocalDataSource categoriesLocal;
  final NoteRepository repository;
  final SyncService sync;

  Device._(
    this.db,
    this.notesLocal,
    this.categoriesLocal,
    this.repository,
    this.sync,
  );

  static int _counter = 0;

  static Future<Device> create(
    RemoteDataSource remote, {
    int Function()? clock,
  }) async {
    final dir = await Directory.systemTemp.createTemp('notes_test');
    final db = AppDatabase(path: '${dir.path}/notes_${_counter++}.db');
    final notesLocal = NoteLocalDataSource(db);
    final categoriesLocal = CategoryLocalDataSource(db);
    return Device._(
      db,
      notesLocal,
      categoriesLocal,
      NoteRepository(
        notes: notesLocal,
        categories: categoriesLocal,
        clock: clock,
      ),
      SyncService(
        notes: notesLocal,
        categories: categoriesLocal,
        remote: remote,
      ),
    );
  }
}
