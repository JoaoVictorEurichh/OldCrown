import 'package:flutter/material.dart';

import '../controllers/notes_controller.dart';
import '../models/category.dart';
import '../repositories/note_repository.dart';

const List<int> kCategoryColors = [
  0xFF6C4AB6,
  0xFF3D7BD9,
  0xFF2E9E6A,
  0xFFE08A1E,
  0xFFD64545,
  0xFFC2418C,
  0xFF1F9AA8,
  0xFF6B7280,
];

/// Diálogo para criar uma categoria. Retorna a categoria criada ou `null`.
Future<NoteCategory?> showCreateCategoryDialog(
  BuildContext context,
  NotesController controller,
) {
  return showDialog<NoteCategory>(
    context: context,
    builder: (_) => _CreateCategoryDialog(controller: controller),
  );
}

class _CreateCategoryDialog extends StatefulWidget {
  final NotesController controller;

  const _CreateCategoryDialog({required this.controller});

  @override
  State<_CreateCategoryDialog> createState() => _CreateCategoryDialogState();
}

class _CreateCategoryDialogState extends State<_CreateCategoryDialog> {
  final nameController = TextEditingController();
  int color = kCategoryColors.first;
  String? error;

  @override
  void dispose() {
    nameController.dispose();
    super.dispose();
  }

  Future<void> save() async {
    try {
      final category = await widget.controller.createCategory(
        nameController.text,
        color,
      );
      if (mounted) Navigator.pop(context, category);
    } on ValidationException catch (e) {
      setState(() => error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Nova categoria'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            key: const Key('category_name'),
            controller: nameController,
            autofocus: true,
            maxLength: 40,
            textCapitalization: TextCapitalization.sentences,
            onSubmitted: (_) => save(),
            decoration: InputDecoration(
              hintText: 'Ex.: Faculdade, Receitas…',
              errorText: error,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              for (final c in kCategoryColors)
                GestureDetector(
                  onTap: () => setState(() => color = c),
                  child: CircleAvatar(
                    radius: 16,
                    backgroundColor: Color(c),
                    child: c == color
                        ? const Icon(Icons.check, size: 18, color: Colors.white)
                        : null,
                  ),
                ),
            ],
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        FilledButton(onPressed: save, child: const Text('Criar')),
      ],
    );
  }
}
