import 'package:flutter/material.dart';

import '../app.dart';
import '../controllers/notes_controller.dart';
import '../core/text_utils.dart';
import '../models/note.dart';
import '../repositories/note_repository.dart';
import '../widgets/feedback.dart';
import '../widgets/note_card.dart';

/// Lixeira com recuperação (funcionalidade adicional).
///
/// Notas excluídas na tela principal vêm para cá. Daqui é possível
/// restaurá-las ou excluí-las definitivamente. Itens com mais de 30 dias na
/// lixeira são apagados automaticamente ao abrir o app.
class TrashPage extends StatelessWidget {
  final NotesController controller;

  const TrashPage({super.key, required this.controller});

  Future<void> _deleteForever(BuildContext context, Note note) async {
    final ok = await confirmDialog(
      context,
      title: 'Excluir definitivamente?',
      message:
          'A nota será apagada do aparelho e da nuvem. '
          'Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
    );
    if (ok) await controller.deletePermanently(note);
  }

  Future<void> _emptyTrash(BuildContext context) async {
    final ok = await confirmDialog(
      context,
      title: 'Esvaziar lixeira?',
      message:
          'Todas as ${controller.trash.length} nota(s) serão apagadas '
          'definitivamente do aparelho e da nuvem.',
      confirmLabel: 'Esvaziar',
    );
    if (ok) await controller.emptyTrash();
  }

  String _remaining(Note note) {
    final expires = DateTime.fromMillisecondsSinceEpoch(
      note.deletedAt!,
    ).add(NoteRepository.trashRetention);
    final days = expires.difference(DateTime.now()).inDays;
    return 'Na lixeira desde ${formatDateTime(note.deletedAt!)} · '
        '${days <= 0 ? 'será excluída hoje' : 'excluída em $days dia(s)'}';
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) {
        final trash = controller.trash;
        return Scaffold(
          appBar: AppBar(
            title: const Text(
              'Lixeira',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            actions: [
              if (trash.isNotEmpty)
                TextButton.icon(
                  onPressed: () => _emptyTrash(context),
                  icon: const Icon(Icons.delete_forever_rounded),
                  label: const Text('Esvaziar'),
                ),
            ],
          ),
          body: trash.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.delete_outline_rounded,
                        size: 64,
                        color: kMuted,
                      ),
                      SizedBox(height: 12),
                      Text('A lixeira está vazia.'),
                    ],
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    const Text(
                      'Notas na lixeira são excluídas definitivamente após 30 dias.',
                      style: TextStyle(color: kMuted, fontSize: 13),
                    ),
                    const SizedBox(height: 14),
                    for (final note in trash)
                      NoteCard(
                        key: ValueKey(note.id),
                        note: note,
                        category: controller.categoryById(note.categoryId),
                        dateLabel: _remaining(note),
                        onTap: () {},
                        actions: [
                          IconButton(
                            tooltip: 'Restaurar',
                            icon: const Icon(
                              Icons.restore_rounded,
                              color: kPrimary,
                            ),
                            onPressed: () async {
                              await controller.restore(note);
                              if (context.mounted) {
                                showMessage(context, 'Nota restaurada.');
                              }
                            },
                          ),
                          IconButton(
                            tooltip: 'Excluir definitivamente',
                            icon: const Icon(
                              Icons.delete_forever_rounded,
                              color: Color(0xFFB45F6C),
                            ),
                            onPressed: () => _deleteForever(context, note),
                          ),
                        ],
                      ),
                  ],
                ),
        );
      },
    );
  }
}
