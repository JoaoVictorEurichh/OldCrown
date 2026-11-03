/// Estado de sincronização de um registro local em relação ao Firestore.
enum SyncStatus {
  /// O registro local é igual ao que está na nuvem.
  synced,

  /// O registro foi criado ou alterado localmente e ainda precisa ser
  /// enviado para o Firestore.
  pendingUpsert,

  /// O registro foi excluído definitivamente no aparelho e a exclusão
  /// ainda precisa ser enviada para o Firestore.
  pendingDelete;

  static SyncStatus fromName(String? name) => SyncStatus.values.firstWhere(
    (s) => s.name == name,
    orElse: () => SyncStatus.pendingUpsert,
  );
}
