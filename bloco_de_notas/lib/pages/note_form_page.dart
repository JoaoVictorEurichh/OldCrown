import 'package:flutter/material.dart';

import '../app.dart';
import '../controllers/notes_controller.dart';
import '../core/text_utils.dart';
import '../models/note.dart';
import '../repositories/note_repository.dart';
import '../widgets/category_dialog.dart';
import '../widgets/feedback.dart';

/// Tela de criação e edição de nota, com seleção de categoria.
class NoteFormPage extends StatefulWidget {
  final NotesController controller;
  final Note? note;

  const NoteFormPage({super.key, required this.controller, this.note});

  @override
  State<NoteFormPage> createState() => _NoteFormPageState();
}

class _NoteFormPageState extends State<NoteFormPage> {
  static const String _newCategoryValue = '__new__';

  final titleController = TextEditingController();
  final contentController = TextEditingController();
  String? categoryId;
  bool saving = false;

  /// Recria o dropdown quando a seleção muda por código (ex.: ao cancelar
  /// "Nova categoria…"), para que ele volte a mostrar [categoryId].
  int _dropdownVersion = 0;

  bool get isEditing => widget.note != null;
  NotesController get c => widget.controller;

  @override
  void initState() {
    super.initState();
    final note = widget.note;
    if (note != null) {
      titleController.text = note.title;
      contentController.text = note.content;
      categoryId = c.categoryById(note.categoryId)?.id;
    } else {
      // Nova nota já vem com a categoria que está filtrada na lista.
      categoryId = c.selectedCategoryId;
    }
  }

  @override
  void dispose() {
    titleController.dispose();
    contentController.dispose();
    super.dispose();
  }

  Future<void> save() async {
    setState(() => saving = true);
    try {
      await c.saveNote(
        existing: widget.note,
        title: titleController.text,
        content: contentController.text,
        categoryId: categoryId,
      );
      if (mounted) Navigator.pop(context);
    } on ValidationException catch (e) {
      if (mounted) showMessage(context, e.message);
    }
    if (mounted) setState(() => saving = false);
  }

  Future<void> moveToTrash() async {
    await c.moveToTrash(widget.note!);
    if (mounted) {
      Navigator.pop(context);
      showMessage(context, 'Nota movida para a lixeira.');
    }
  }

  Future<void> onCategoryChanged(String? value) async {
    if (value == _newCategoryValue) {
      final created = await showCreateCategoryDialog(context, c);
      setState(() {
        if (created != null) categoryId = created.id;
        _dropdownVersion++;
      });
      return;
    }
    setState(() => categoryId = value);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          isEditing ? 'Editar nota' : 'Nova nota',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          if (isEditing)
            IconButton(
              tooltip: 'Mover para a lixeira',
              onPressed: moveToTrash,
              icon: const Icon(Icons.delete_outline_rounded),
            ),
          IconButton(
            key: const Key('save_note'),
            tooltip: 'Salvar',
            onPressed: saving ? null : save,
            icon: const Icon(Icons.check_rounded),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.fromLTRB(22, 8, 22, 22),
        child: ListenableBuilder(
          listenable: c,
          builder: (context, _) => Column(
            children: [
              DropdownButtonFormField<String?>(
                key: ValueKey('category_dropdown_$_dropdownVersion'),
                initialValue: categoryId,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.label_outline_rounded),
                  labelText: 'Categoria',
                ),
                items: [
                  const DropdownMenuItem(
                    value: null,
                    child: Text('Sem categoria'),
                  ),
                  for (final cat in c.categories)
                    DropdownMenuItem(
                      value: cat.id,
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 6,
                            backgroundColor: Color(cat.color),
                          ),
                          const SizedBox(width: 10),
                          Text(cat.name),
                        ],
                      ),
                    ),
                  const DropdownMenuItem(
                    value: _newCategoryValue,
                    child: Row(
                      children: [
                        Icon(Icons.add_rounded, size: 18, color: kPrimary),
                        SizedBox(width: 6),
                        Text(
                          'Nova categoria…',
                          style: TextStyle(color: kPrimary),
                        ),
                      ],
                    ),
                  ),
                ],
                onChanged: onCategoryChanged,
              ),
              TextField(
                key: const Key('note_title'),
                controller: titleController,
                maxLength: 200,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: kText,
                ),
                decoration: const InputDecoration(
                  hintText: 'Título',
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  filled: false,
                  counterText: '',
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 4,
                    vertical: 16,
                  ),
                ),
              ),
              const Divider(color: Color(0xFFE4DFEA)),
              Expanded(
                child: TextField(
                  key: const Key('note_content'),
                  controller: contentController,
                  maxLines: null,
                  expands: true,
                  textAlignVertical: TextAlignVertical.top,
                  style: const TextStyle(
                    fontSize: 17,
                    height: 1.5,
                    color: Color(0xFF40394A),
                  ),
                  decoration: const InputDecoration(
                    hintText: 'Comece a escrever...',
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    filled: false,
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 4,
                      vertical: 15,
                    ),
                  ),
                ),
              ),
              if (widget.note != null)
                Text(
                  'Criada em ${formatDateTime(widget.note!.createdAt)} · '
                  'Atualizada em ${formatDateTime(widget.note!.updatedAt)}',
                  style: const TextStyle(fontSize: 12, color: kMuted),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
