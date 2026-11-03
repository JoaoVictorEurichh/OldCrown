import 'sync_status.dart';

/// Categoria usada para organizar as notas (ex.: Estudos, Trabalho).
///
/// Fica em `categories` no SQLite e em `users/{uid}/categories/{id}` no
/// Firestore.
class NoteCategory {
  final String id;
  final String uid;
  final String name;

  /// Cor no formato ARGB (ex.: 0xFF6C4AB6).
  final int color;
  final int updatedAt;
  final SyncStatus syncStatus;

  const NoteCategory({
    required this.id,
    required this.uid,
    required this.name,
    required this.color,
    required this.updatedAt,
    this.syncStatus = SyncStatus.pendingUpsert,
  });

  /// Categorias criadas automaticamente para todo usuário.
  ///
  /// Os IDs são fixos (`default-...`) para que dois aparelhos do mesmo
  /// usuário gerem o mesmo documento no Firestore em vez de duplicá-lo.
  static List<NoteCategory> defaults(String uid, int now) => [
    NoteCategory(
      id: 'default-estudos',
      uid: uid,
      name: 'Estudos',
      color: 0xFF3D7BD9,
      updatedAt: now,
    ),
    NoteCategory(
      id: 'default-trabalho',
      uid: uid,
      name: 'Trabalho',
      color: 0xFFE08A1E,
      updatedAt: now,
    ),
    NoteCategory(
      id: 'default-pessoal',
      uid: uid,
      name: 'Pessoal',
      color: 0xFF2E9E6A,
      updatedAt: now,
    ),
  ];

  NoteCategory copyWith({SyncStatus? syncStatus, int? updatedAt}) =>
      NoteCategory(
        id: id,
        uid: uid,
        name: name,
        color: color,
        updatedAt: updatedAt ?? this.updatedAt,
        syncStatus: syncStatus ?? this.syncStatus,
      );

  Map<String, Object?> toMap() => {
    'id': id,
    'uid': uid,
    'name': name,
    'color': color,
    'updated_at': updatedAt,
    'sync_status': syncStatus.name,
  };

  factory NoteCategory.fromMap(Map<String, Object?> map) => NoteCategory(
    id: map['id'] as String,
    uid: map['uid'] as String,
    name: map['name'] as String,
    color: map['color'] as int,
    updatedAt: map['updated_at'] as int,
    syncStatus: SyncStatus.fromName(map['sync_status'] as String?),
  );

  Map<String, Object?> toFirestore() => {
    'uid': uid,
    'name': name,
    'color': color,
    'updatedAt': updatedAt,
  };

  factory NoteCategory.fromFirestore(String id, Map<String, dynamic> data) =>
      NoteCategory(
        id: id,
        uid: data['uid'] as String,
        name: data['name'] as String,
        color: (data['color'] as num).toInt(),
        updatedAt: (data['updatedAt'] as num).toInt(),
        syncStatus: SyncStatus.synced,
      );
}
