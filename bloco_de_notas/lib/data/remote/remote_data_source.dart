import '../../models/category.dart';
import '../../models/note.dart';

/// Erro de comunicação com a nuvem, independente do SDK usado.
///
/// [offline] indica falhas de rede/indisponibilidade (o app deve continuar
/// funcionando com o SQLite e tentar de novo depois). [permissionDenied]
/// indica bloqueio pelas regras de segurança do Firestore.
class RemoteException implements Exception {
  final String message;
  final bool offline;
  final bool permissionDenied;

  const RemoteException(
    this.message, {
    this.offline = false,
    this.permissionDenied = false,
  });

  @override
  String toString() => 'RemoteException: $message';
}

/// Contrato do armazenamento em nuvem.
///
/// A sincronização depende desta abstração, e não do Firestore diretamente
/// (inversão de dependência). Isso permite testar o [SyncService] com uma
/// implementação falsa em memória.
abstract class RemoteDataSource {
  Future<List<Note>> fetchNotes(String uid);

  /// Grava a nota **somente se** a versão da nuvem não for mais recente
  /// (`updatedAt` maior). Retorna `false` quando a nuvem tem uma versão
  /// mais nova; nesse caso a versão da nuvem será baixada no pull.
  Future<bool> upsertNote(Note note);
  Future<void> deleteNote(String uid, String id);

  Future<List<NoteCategory>> fetchCategories(String uid);
  Future<void> upsertCategory(NoteCategory category);
  Future<void> deleteCategory(String uid, String id);
}
