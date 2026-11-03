import 'dart:async';

import 'package:flutter/foundation.dart';

import '../models/category.dart';
import '../models/note.dart';
import '../models/note_sort.dart';
import '../repositories/note_repository.dart';
import '../services/sync_service.dart';

enum SyncState { idle, syncing, ok, offline, error }

/// Estado e regras da tela de notas (padrão **Observer** via
/// [ChangeNotifier]).
///
/// As telas escutam este objeto com `ListenableBuilder` e são redesenhadas
/// quando [notifyListeners] é chamado. As páginas não acessam banco nem
/// Firebase diretamente: chamam métodos daqui, que usam o
/// [NoteRepository] (SQLite) e o [SyncService] (Firestore).
class NotesController extends ChangeNotifier {
  final String uid;
  final NoteRepository _repository;
  final SyncService _sync;

  NotesController({
    required this.uid,
    required NoteRepository repository,
    required SyncService syncService,
  }) : _repository = repository,
       _sync = syncService;

  List<Note> notes = [];
  List<Note> trash = [];
  List<NoteCategory> categories = [];
  Map<String, int> countByCategory = {};

  String query = '';
  String? selectedCategoryId;
  NoteSort sort = NoteSort.updatedDesc;

  bool loading = true;
  SyncState syncState = SyncState.idle;
  String? syncMessage;
  DateTime? lastSyncAt;
  int pendingCount = 0;

  bool _disposed = false;
  bool _syncAgain = false;
  Timer? _searchDebounce;

  bool get isSearching => query.trim().isNotEmpty;

  NoteCategory? categoryById(String? id) {
    if (id == null) return null;
    for (final c in categories) {
      if (c.id == id) return c;
    }
    return null;
  }

  /// Chamado ao abrir a tela: mostra imediatamente o que está no SQLite e
  /// depois busca a versão da nuvem.
  Future<void> init() async {
    await _repository.ensureDefaultCategories(uid);
    await _repository.purgeExpiredTrash(uid);
    await reload();
    loading = false;
    _notify();
    await sync();
  }

  /// Recarrega as listas a partir do SQLite.
  Future<void> reload() async {
    if (_disposed) return;
    categories = await _repository.getCategories(uid);
    if (selectedCategoryId != null &&
        categoryById(selectedCategoryId) == null) {
      selectedCategoryId = null;
    }
    notes = await _repository.getNotes(
      uid,
      query: query,
      categoryId: selectedCategoryId,
      sort: sort,
    );
    trash = await _repository.getTrash(uid);
    countByCategory = await _repository.countByCategory(uid);
    pendingCount = await _repository.pendingCount(uid);
    _notify();
  }

  // --------------------------------------------------- pesquisa e filtros

  void setQuery(String value) {
    query = value;
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 250), reload);
  }

  Future<void> setCategoryFilter(String? categoryId) async {
    selectedCategoryId = categoryId;
    await reload();
  }

  Future<void> setSort(NoteSort value) async {
    sort = value;
    await reload();
  }

  // ------------------------------------------------------------ escrita

  Future<Note> saveNote({
    Note? existing,
    required String title,
    required String content,
    String? categoryId,
  }) async {
    final note = existing == null
        ? await _repository.createNote(
            uid: uid,
            title: title,
            content: content,
            categoryId: categoryId,
          )
        : await _repository.updateNote(
            existing,
            title: title,
            content: content,
            categoryId: categoryId,
          );
    await _afterLocalChange();
    return note;
  }

  Future<void> moveToTrash(Note note) async {
    await _repository.moveToTrash(note);
    await _afterLocalChange();
  }

  Future<void> restore(Note note) async {
    await _repository.restoreFromTrash(note);
    await _afterLocalChange();
  }

  Future<void> deletePermanently(Note note) async {
    await _repository.deletePermanently(note);
    await _afterLocalChange();
  }

  Future<void> emptyTrash() async {
    await _repository.emptyTrash(uid);
    await _afterLocalChange();
  }

  Future<NoteCategory> createCategory(String name, int color) async {
    final c = await _repository.createCategory(
      uid: uid,
      name: name,
      color: color,
    );
    await _afterLocalChange();
    return c;
  }

  Future<void> deleteCategory(String categoryId) async {
    await _repository.deleteCategory(uid, categoryId);
    await _afterLocalChange();
  }

  /// Toda alteração: atualiza a tela com o SQLite e dispara o envio para a
  /// nuvem em segundo plano (a interface não espera a rede).
  Future<void> _afterLocalChange() async {
    await reload();
    unawaited(sync());
  }

  // ----------------------------------------------------- sincronização

  Future<void> sync() async {
    if (syncState == SyncState.syncing) {
      // Já existe uma rodada em andamento: agenda outra para o final, para
      // incluir as alterações feitas enquanto ela rodava.
      _syncAgain = true;
      return;
    }
    syncState = SyncState.syncing;
    _notify();

    SyncResult result;
    do {
      _syncAgain = false;
      result = await _sync.sync(uid);
    } while (_syncAgain && result.success && !_disposed);

    if (_disposed) return;
    if (result.success) {
      syncState = SyncState.ok;
      syncMessage = null;
      lastSyncAt = DateTime.now();
    } else {
      syncState = result.offline ? SyncState.offline : SyncState.error;
      syncMessage = result.errorMessage;
    }
    await reload();
  }

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _searchDebounce?.cancel();
    super.dispose();
  }
}
