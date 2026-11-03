import 'package:bloco_de_nota_turma_a/core/text_utils.dart';
import 'package:bloco_de_nota_turma_a/widgets/highlighted_text.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('normalizeForSearch remove acentos e maiúsculas', () {
    expect(
      normalizeForSearch('Reunião de CONTRATAÇÃO'),
      'reuniao de contratacao',
    );
  });

  test('searchTerms separa palavras e ignora espaços extras', () {
    expect(searchTerms('  Prova   Cálculo '), ['prova', 'calculo']);
    expect(searchTerms('   '), isEmpty);
  });

  test('formatDateTime usa dd/MM/yyyy HH:mm', () {
    final ms = DateTime(2026, 3, 7, 9, 5).millisecondsSinceEpoch;
    expect(formatDateTime(ms), '07/03/2026 09:05');
  });

  test('HighlightedText encontra os trechos ignorando acentos', () {
    expect(HighlightedText.matchRanges('Reunião às 10h', 'reuniao'), [(0, 7)]);
    expect(HighlightedText.matchRanges('abc abc', 'ABC'), [(0, 3), (4, 7)]);
    expect(HighlightedText.matchRanges('texto', ''), isEmpty);
  });
}
