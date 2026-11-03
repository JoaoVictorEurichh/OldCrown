/// Ordenações disponíveis na lista de notas (funcionalidade adicional).
enum NoteSort {
  updatedDesc('Última atualização (recentes)', 'updated_at DESC'),
  updatedAsc('Última atualização (antigas)', 'updated_at ASC'),
  createdDesc('Data de criação (recentes)', 'created_at DESC'),
  createdAsc('Data de criação (antigas)', 'created_at ASC'),
  titleAsc('Título (A–Z)', 'title COLLATE NOCASE ASC');

  final String label;

  /// Trecho `ORDER BY` usado na consulta SQLite.
  final String sql;

  const NoteSort(this.label, this.sql);

  static NoteSort fromName(String? name) => NoteSort.values.firstWhere(
    (s) => s.name == name,
    orElse: () => NoteSort.updatedDesc,
  );
}
