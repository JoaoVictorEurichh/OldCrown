import 'package:flutter/material.dart';

import '../app.dart';
import '../controllers/notes_controller.dart';

/// Linha de status que informa se as notas estão salvas na nuvem, se há
/// pendências ou se o Firebase está inacessível.
class SyncStatusBar extends StatelessWidget {
  final NotesController controller;
  final VoidCallback onRetry;

  const SyncStatusBar({
    super.key,
    required this.controller,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final (icon, color, text) = switch (controller.syncState) {
      SyncState.syncing => (
        Icons.sync_rounded,
        kPrimary,
        'Sincronizando com a nuvem…',
      ),
      SyncState.offline => (
        Icons.cloud_off_rounded,
        const Color(0xFFB7791F),
        '${controller.syncMessage ?? 'Sem conexão.'} '
            '${controller.pendingCount} alteração(ões) pendente(s).',
      ),
      SyncState.error => (
        Icons.error_outline_rounded,
        const Color(0xFFB45F6C),
        controller.syncMessage ?? 'Erro ao sincronizar.',
      ),
      SyncState.ok when controller.pendingCount > 0 => (
        Icons.cloud_upload_outlined,
        kMuted,
        '${controller.pendingCount} alteração(ões) aguardando envio.',
      ),
      SyncState.ok => (
        Icons.cloud_done_rounded,
        const Color(0xFF2E9E6A),
        'Notas salvas na nuvem.',
      ),
      SyncState.idle => (
        Icons.cloud_queue_rounded,
        kMuted,
        'Notas salvas no aparelho.',
      ),
    };
    final canRetry =
        controller.syncState == SyncState.offline ||
        controller.syncState == SyncState.error;

    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              text,
              key: const Key('sync_status_text'),
              style: TextStyle(fontSize: 12, color: color),
            ),
          ),
          if (canRetry)
            TextButton(
              onPressed: onRetry,
              child: const Text('Tentar novamente'),
            ),
        ],
      ),
    );
  }
}
