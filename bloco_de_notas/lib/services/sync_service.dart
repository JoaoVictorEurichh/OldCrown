import '../data/local/category_local_data_source.dart';
import '../data/local/note_local_data_source.dart';
import '../data/remote/remote_data_source.dart';
import '../models/sync_status.dart';

/// Resultado de uma rodada de sincronização.
class SyncResult {
  final bool success;
  final bool offline;
  final bool permissionDenied;
  final String? errorMessage;
  final int pushed;
  final int pulled;
  final int removedLocally;

  const SyncResult.ok({
    this.pushed = 0,
    this.pulled = 0,
    this.removedLocally = 0,
  }) : success = true,
       offline = false,
       permissionDenied = false,
       errorMessage = null;

  SyncResult.failure(RemoteException e, {this.pushed = 0})
    : success = false,
      offline = e.offline,
      permissionDenied = e.permissionDenied,
      errorMessage = e.message,
      pulled = 0,
      removedLocally = 0;
}

/// Sincroniza o SQLite com o Firestore.
///
/// Cada rodada tem duas etapas:
///
/// 1. **Envio (push)** — registros locais com `pendingUpsert` são gravados
///    no Firestore (`set` no documento de mesmo ID) e marcados `synced`;
///    registros `pendingDelete` são apagados no Firestore e depois no
///    SQLite.
/// 2. **Recebimento (pull)** — todos os documentos do usuário são lidos do
///    Firestore e mesclados no SQLite:
///    - documento que não existe localmente → é inserido;
///    - documento com `updatedAt` diferente de um registro local já
///      sincronizado → a versão da nuvem substitui a local;
///    - registro local ainda pendente → vence o que tiver o maior
///      `updatedAt` (*last write wins*);
///    - registro local `synced` que não existe mais na nuvem → foi
///      excluído em outro aparelho, então é removido do SQLite.
///
/// Se ocorrer erro de conexão em qualquer etapa, a rodada é interrompida e
/// os registros continuam pendentes no SQLite para a próxima tentativa.
class SyncService {
  final NoteLocalDataSource _notes;
  final CategoryLocalDataSource _categories;
  final RemoteDataSource _remote;

  SyncService({
    required NoteLocalDataSource notes,
    required CategoryLocalDataSource categories,
    required RemoteDataSource remote,
  }) : _notes = notes,
       _categories = categories,
       _remote = remote;

  Future<SyncResult> sync(String uid) async {
    var pushed = 0;
    try {
      pushed = await _push(uid);
      final (pulled, removed) = await _pull(uid);
      return SyncResult.ok(
        pushed: pushed,
        pulled: pulled,
        removedLocally: removed,
      );
    } on RemoteException catch (e) {
      return SyncResult.failure(e, pushed: pushed);
    } catch (e) {
      return SyncResult.failure(
        RemoteException('Falha inesperada na sincronização: $e'),
        pushed: pushed,
      );
    }
  }

  Future<int> _push(String uid) async {
    var count = 0;
    // Categorias primeiro, para que as notas não referenciem categorias
    // inexistentes na nuvem.
    for (final c in await _categories.pending(uid)) {
      if (c.syncStatus == SyncStatus.pendingDelete) {
        await _remote.deleteCategory(uid, c.id);
        await _categories.hardDelete(uid, c.id);
      } else {
        await _remote.upsertCategory(c);
        await _categories.markSynced(uid, c.id, c.updatedAt);
      }
      count++;
    }
    for (final n in await _notes.pending(uid)) {
      if (n.syncStatus == SyncStatus.pendingDelete) {
        await _remote.deleteNote(uid, n.id);
        await _notes.hardDelete(uid, n.id);
      } else {
        final written = await _remote.upsertNote(n);
        // Se a nuvem tinha uma versão mais nova, a nota local continua
        // pendente e será substituída na etapa de recebimento (pull).
        if (written) await _notes.markSynced(uid, n.id, n.updatedAt);
      }
      count++;
    }
    return count;
  }

  Future<(int, int)> _pull(String uid) async {
    var pulled = 0;
    var removed = 0;

    // ---- categorias
    final remoteCategories = await _remote.fetchCategories(uid);
    final localCategories = {
      for (final c in await _categories.all(uid)) c.id: c,
    };
    for (final r in remoteCategories) {
      final l = localCategories[r.id];
      if (_remoteWins(l?.syncStatus, l?.updatedAt, r.updatedAt)) {
        await _categories.upsert(r);
        pulled++;
      }
    }
    final remoteCategoryIds = remoteCategories.map((c) => c.id).toSet();
    for (final l in localCategories.values) {
      if (l.syncStatus == SyncStatus.synced &&
          !remoteCategoryIds.contains(l.id)) {
        await _categories.hardDelete(uid, l.id);
        removed++;
      }
    }

    // ---- notas
    final remoteNotes = await _remote.fetchNotes(uid);
    final localNotes = {for (final n in await _notes.all(uid)) n.id: n};
    for (final r in remoteNotes) {
      final l = localNotes[r.id];
      if (_remoteWins(l?.syncStatus, l?.updatedAt, r.updatedAt)) {
        await _notes.upsert(r);
        pulled++;
      }
    }
    final remoteNoteIds = remoteNotes.map((n) => n.id).toSet();
    for (final l in localNotes.values) {
      if (l.syncStatus == SyncStatus.synced && !remoteNoteIds.contains(l.id)) {
        await _notes.hardDelete(uid, l.id);
        removed++;
      }
    }
    return (pulled, removed);
  }

  /// Regra de resolução de conflitos entre a versão local e a da nuvem.
  static bool _remoteWins(
    SyncStatus? localStatus,
    int? localUpdatedAt,
    int remoteUpdatedAt,
  ) {
    if (localStatus == null) return true; // não existe no aparelho
    switch (localStatus) {
      case SyncStatus.synced:
        return remoteUpdatedAt != localUpdatedAt;
      case SyncStatus.pendingUpsert:
        return remoteUpdatedAt > localUpdatedAt!;
      case SyncStatus.pendingDelete:
        return false; // a exclusão local ainda será enviada
    }
  }
}
