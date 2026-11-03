import 'package:flutter/material.dart';

import '../app.dart';
import '../core/text_utils.dart';
import '../models/category.dart';
import '../models/note.dart';
import '../models/sync_status.dart';
import 'highlighted_text.dart';

class NoteCard extends StatelessWidget {
  final Note note;
  final NoteCategory? category;
  final String highlight;
  final VoidCallback onTap;
  final List<Widget> actions;
  final String? dateLabel;

  const NoteCard({
    super.key,
    required this.note,
    required this.onTap,
    this.category,
    this.highlight = '',
    this.actions = const [],
    this.dateLabel,
  });

  @override
  Widget build(BuildContext context) {
    final color = Color(category?.color ?? 0xFF6C4AB6);
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 8, 18),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(Icons.notes_rounded, color: color),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    HighlightedText(
                      note.title.isEmpty ? 'Sem título' : note.title,
                      highlight: highlight,
                      maxLines: 1,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: kText,
                      ),
                    ),
                    if (note.content.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      HighlightedText(
                        _snippet(note.content, highlight),
                        highlight: highlight,
                        maxLines: 2,
                        style: const TextStyle(color: kMuted, height: 1.4),
                      ),
                    ],
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        if (category != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: color.withValues(alpha: 0.14),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              category!.name,
                              style: TextStyle(
                                fontSize: 11,
                                color: color,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        Text(
                          dateLabel ?? formatDateTime(note.updatedAt),
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFF9A94A1),
                          ),
                        ),
                        if (note.syncStatus != SyncStatus.synced)
                          const Tooltip(
                            message: 'Aguardando envio para a nuvem',
                            child: Icon(
                              Icons.cloud_upload_outlined,
                              size: 14,
                              color: Color(0xFF9A94A1),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              ...actions,
            ],
          ),
        ),
      ),
    );
  }

  /// Quando há pesquisa, mostra o trecho do conteúdo que contém o termo.
  static String _snippet(String content, String highlight) {
    final terms = searchTerms(highlight);
    if (terms.isEmpty) return content;
    final index = normalizeForSearch(content).indexOf(terms.first);
    if (index <= 40) return content;
    return '…${content.substring(index - 30)}';
  }
}
