import 'package:flutter/material.dart';

import '../core/text_utils.dart';

/// Texto que destaca os termos pesquisados (ignorando acentos e
/// maiúsculas), para o usuário localizar o resultado dentro da nota.
class HighlightedText extends StatelessWidget {
  final String text;
  final String highlight;
  final TextStyle style;
  final int maxLines;

  const HighlightedText(
    this.text, {
    super.key,
    required this.highlight,
    required this.style,
    this.maxLines = 1,
  });

  /// Intervalos [início, fim) de [text] que correspondem a algum termo.
  static List<(int, int)> matchRanges(String text, String highlight) {
    final terms = searchTerms(highlight);
    if (terms.isEmpty) return const [];
    // normalizeForSearch troca um caractere por um caractere, então os
    // índices do texto normalizado valem para o original (se o tamanho
    // mudar, por segurança, não destacamos nada).
    final normalized = normalizeForSearch(text);
    if (normalized.length != text.length) return const [];
    final ranges = <(int, int)>[];
    for (final term in terms) {
      var start = normalized.indexOf(term);
      while (start >= 0) {
        ranges.add((start, start + term.length));
        start = normalized.indexOf(term, start + term.length);
      }
    }
    ranges.sort((a, b) => a.$1.compareTo(b.$1));
    final merged = <(int, int)>[];
    for (final r in ranges) {
      if (merged.isNotEmpty && r.$1 <= merged.last.$2) {
        final last = merged.removeLast();
        merged.add((last.$1, r.$2 > last.$2 ? r.$2 : last.$2));
      } else {
        merged.add(r);
      }
    }
    return merged;
  }

  @override
  Widget build(BuildContext context) {
    final ranges = matchRanges(text, highlight);
    if (ranges.isEmpty) {
      return Text(
        text,
        maxLines: maxLines,
        overflow: TextOverflow.ellipsis,
        style: style,
      );
    }
    final spans = <TextSpan>[];
    var cursor = 0;
    for (final (start, end) in ranges) {
      if (start > cursor) {
        spans.add(TextSpan(text: text.substring(cursor, start)));
      }
      spans.add(
        TextSpan(
          text: text.substring(start, end),
          style: const TextStyle(
            backgroundColor: Color(0xFFFFE58F),
            color: Color(0xFF292333),
          ),
        ),
      );
      cursor = end;
    }
    if (cursor < text.length) spans.add(TextSpan(text: text.substring(cursor)));
    return Text.rich(
      TextSpan(style: style, children: spans),
      maxLines: maxLines,
      overflow: TextOverflow.ellipsis,
    );
  }
}
