/// Funções utilitárias de texto e data usadas na pesquisa e na interface.
library;

const Map<String, String> _accentMap = {
  'á': 'a',
  'à': 'a',
  'â': 'a',
  'ã': 'a',
  'ä': 'a',
  'é': 'e',
  'è': 'e',
  'ê': 'e',
  'ë': 'e',
  'í': 'i',
  'ì': 'i',
  'î': 'i',
  'ï': 'i',
  'ó': 'o',
  'ò': 'o',
  'ô': 'o',
  'õ': 'o',
  'ö': 'o',
  'ú': 'u',
  'ù': 'u',
  'û': 'u',
  'ü': 'u',
  'ç': 'c',
  'ñ': 'n',
};

/// Converte o texto para minúsculas e remove acentos.
///
/// É usado para montar o índice de pesquisa salvo no SQLite e para
/// normalizar o termo digitado pelo usuário. Assim, pesquisar "reuniao"
/// encontra "Reunião".
String normalizeForSearch(String input) {
  final lower = input.toLowerCase();
  final buffer = StringBuffer();
  for (final rune in lower.runes) {
    final char = String.fromCharCode(rune);
    buffer.write(_accentMap[char] ?? char);
  }
  return buffer.toString();
}

/// Divide a pesquisa em termos (palavras) já normalizados.
List<String> searchTerms(String query) => normalizeForSearch(
  query,
).split(RegExp(r'\s+')).where((t) => t.isNotEmpty).toList();

String _two(int v) => v.toString().padLeft(2, '0');

/// Formata um timestamp (ms desde epoch) como `dd/MM/yyyy HH:mm`.
String formatDateTime(int millis) {
  final d = DateTime.fromMillisecondsSinceEpoch(millis);
  return '${_two(d.day)}/${_two(d.month)}/${d.year} '
      '${_two(d.hour)}:${_two(d.minute)}';
}
