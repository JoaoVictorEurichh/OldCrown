import '../core/text_utils.dart';
import 'sync_status.dart';

/// Nota do usuário.
///
/// O mesmo objeto é convertido para dois formatos:
/// - [toMap] / [Note.fromMap]: linha da tabela `notes` do SQLite;
/// - [toFirestore] / [Note.fromFirestore]: documento em
///   `users/{uid}/notes/{id}` no Cloud Firestore.
///
/// O [id] é um UUID gerado no aparelho. Assim a nota tem o mesmo
/// identificador no SQLite e no Firestore, o que torna o envio idempotente
/// (enviar duas vezes sobrescreve o mesmo documento, sem duplicar).
class Note {
  final String id;
  final String uid;
  final String title;
  final String content;
  final String? categoryId;
  final int createdAt;
  final int updatedAt;

  /// Quando diferente de `null`, a nota está na lixeira desde esse instante.
  final int? deletedAt;

  final SyncStatus syncStatus;

  const Note({
    required this.id,
    required this.uid,
    required this.title,
    required this.content,
    required this.createdAt,
    required this.updatedAt,
    this.categoryId,
    this.deletedAt,
    this.syncStatus = SyncStatus.pendingUpsert,
  });

  bool get isInTrash => deletedAt != null;

  /// Texto normalizado (minúsculo e sem acentos) usado na pesquisa.
  String get searchIndex => normalizeForSearch('$title\n$content');

  Note copyWith({
    String? title,
    String? content,
    String? categoryId,
    bool clearCategory = false,
    int? updatedAt,
    int? deletedAt,
    bool clearDeletedAt = false,
    SyncStatus? syncStatus,
  }) {
    return Note(
      id: id,
      uid: uid,
      title: title ?? this.title,
      content: content ?? this.content,
      categoryId: clearCategory ? null : (categoryId ?? this.categoryId),
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      deletedAt: clearDeletedAt ? null : (deletedAt ?? this.deletedAt),
      syncStatus: syncStatus ?? this.syncStatus,
    );
  }

  Map<String, Object?> toMap() => {
    'id': id,
    'uid': uid,
    'title': title,
    'content': content,
    'category_id': categoryId,
    'created_at': createdAt,
    'updated_at': updatedAt,
    'deleted_at': deletedAt,
    'sync_status': syncStatus.name,
    'search_index': searchIndex,
  };

  factory Note.fromMap(Map<String, Object?> map) => Note(
    id: map['id'] as String,
    uid: map['uid'] as String,
    title: map['title'] as String? ?? '',
    content: map['content'] as String? ?? '',
    categoryId: map['category_id'] as String?,
    createdAt: map['created_at'] as int,
    updatedAt: map['updated_at'] as int,
    deletedAt: map['deleted_at'] as int?,
    syncStatus: SyncStatus.fromName(map['sync_status'] as String?),
  );

  /// Campos gravados no Firestore. O estado de sincronização e o índice de
  /// pesquisa são informações apenas locais e não são enviados.
  Map<String, Object?> toFirestore() => {
    'uid': uid,
    'title': title,
    'content': content,
    'categoryId': categoryId,
    'createdAt': createdAt,
    'updatedAt': updatedAt,
    'deletedAt': deletedAt,
  };

  factory Note.fromFirestore(String id, Map<String, dynamic> data) => Note(
    id: id,
    uid: data['uid'] as String,
    title: data['title'] as String? ?? '',
    content: data['content'] as String? ?? '',
    categoryId: data['categoryId'] as String?,
    createdAt: (data['createdAt'] as num).toInt(),
    updatedAt: (data['updatedAt'] as num).toInt(),
    deletedAt: (data['deletedAt'] as num?)?.toInt(),
    syncStatus: SyncStatus.synced,
  );
}
