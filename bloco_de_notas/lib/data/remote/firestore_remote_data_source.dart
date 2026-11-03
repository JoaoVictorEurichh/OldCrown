import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';

import '../../models/category.dart';
import '../../models/note.dart';
import 'remote_data_source.dart';

/// Implementação de [RemoteDataSource] usando o Cloud Firestore.
///
/// Estrutura no Firestore:
/// ```
/// users/{uid}/notes/{noteId}
/// users/{uid}/categories/{categoryId}
/// ```
/// As regras em `firestore.rules` só permitem que o usuário autenticado
/// com aquele `uid` leia ou escreva dentro de `users/{uid}`.
class FirestoreRemoteDataSource implements RemoteDataSource {
  /// Tempo máximo de espera por uma operação antes de considerá-la falha
  /// de conexão.
  static const Duration timeout = Duration(seconds: 10);

  final FirebaseFirestore _firestore;

  FirestoreRemoteDataSource([FirebaseFirestore? firestore])
    : _firestore = firestore ?? FirebaseFirestore.instance;

  CollectionReference<Map<String, dynamic>> _notes(String uid) =>
      _firestore.collection('users').doc(uid).collection('notes');

  CollectionReference<Map<String, dynamic>> _categories(String uid) =>
      _firestore.collection('users').doc(uid).collection('categories');

  @override
  Future<List<Note>> fetchNotes(String uid) => _guard(() async {
    // Source.server: queremos o estado real da nuvem, não um cache.
    final snap = await _notes(uid).get(const GetOptions(source: Source.server));
    return snap.docs.map((d) => Note.fromFirestore(d.id, d.data())).toList();
  });

  /// Usa uma transação: lê o documento atual e só grava se a versão local
  /// for igual ou mais nova. Isso evita que um aparelho que ficou offline
  /// sobrescreva uma edição mais recente feita em outro aparelho.
  @override
  Future<bool> upsertNote(Note note) => _guard(
    () => _firestore.runTransaction<bool>((tx) async {
      final ref = _notes(note.uid).doc(note.id);
      final current = await tx.get(ref);
      final remoteUpdatedAt = (current.data()?['updatedAt'] as num?)?.toInt();
      if (remoteUpdatedAt != null && remoteUpdatedAt > note.updatedAt) {
        return false;
      }
      tx.set(ref, {
        ...note.toFirestore(),
        'serverUpdatedAt': FieldValue.serverTimestamp(),
      });
      return true;
    }),
  );

  @override
  Future<void> deleteNote(String uid, String id) =>
      _guard(() => _notes(uid).doc(id).delete());

  @override
  Future<List<NoteCategory>> fetchCategories(String uid) => _guard(() async {
    final snap = await _categories(
      uid,
    ).get(const GetOptions(source: Source.server));
    return snap.docs
        .map((d) => NoteCategory.fromFirestore(d.id, d.data()))
        .toList();
  });

  @override
  Future<void> upsertCategory(NoteCategory category) => _guard(
    () => _categories(category.uid).doc(category.id).set({
      ...category.toFirestore(),
      'serverUpdatedAt': FieldValue.serverTimestamp(),
    }),
  );

  @override
  Future<void> deleteCategory(String uid, String id) =>
      _guard(() => _categories(uid).doc(id).delete());

  /// Converte exceções do Firebase/tempo esgotado em [RemoteException].
  Future<T> _guard<T>(Future<T> Function() action) async {
    try {
      return await action().timeout(timeout);
    } on TimeoutException {
      throw const RemoteException(
        'Tempo esgotado ao acessar a nuvem. Verifique sua conexão.',
        offline: true,
      );
    } on FirebaseException catch (e) {
      switch (e.code) {
        case 'unavailable':
        case 'deadline-exceeded':
        case 'network-request-failed':
          throw const RemoteException(
            'Sem conexão com o Firebase. As notas ficam salvas no aparelho.',
            offline: true,
          );
        case 'permission-denied':
        case 'unauthenticated':
          throw const RemoteException(
            'Acesso negado pelo Firebase. Entre novamente na sua conta.',
            permissionDenied: true,
          );
        default:
          throw RemoteException(
            'Erro no Firebase (${e.code}): ${e.message ?? ''}',
          );
      }
    }
  }
}
