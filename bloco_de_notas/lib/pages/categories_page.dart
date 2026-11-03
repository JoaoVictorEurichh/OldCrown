import 'package:flutter/material.dart';

import '../app.dart';
import '../controllers/notes_controller.dart';
import '../models/category.dart';
import '../widgets/category_dialog.dart';
import '../widgets/feedback.dart';

/// Gerenciamento das categorias do usuário.
class CategoriesPage extends StatelessWidget {
  final NotesController controller;

  const CategoriesPage({super.key, required this.controller});

  Future<void> _delete(BuildContext context, NoteCategory category) async {
    final count = controller.countByCategory[category.id] ?? 0;
    final ok = await confirmDialog(
      context,
      title: 'Excluir "${category.name}"?',
      message: count == 0
          ? 'A categoria será removida.'
          : 'As $count nota(s) desta categoria não serão apagadas: '
                'elas ficarão "Sem categoria".',
      confirmLabel: 'Excluir',
    );
    if (ok) await controller.deleteCategory(category.id);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Categorias',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showCreateCategoryDialog(context, controller),
        backgroundColor: kPrimary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Nova categoria'),
      ),
      body: ListenableBuilder(
        listenable: controller,
        builder: (context, _) {
          final categories = controller.categories;
          if (categories.isEmpty) {
            return const Center(child: Text('Nenhuma categoria cadastrada.'));
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
            itemCount: categories.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final cat = categories[index];
              final count = controller.countByCategory[cat.id] ?? 0;
              return Card(
                elevation: 0,
                color: Colors.white,
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Color(cat.color).withValues(alpha: 0.15),
                    child: Icon(Icons.label_rounded, color: Color(cat.color)),
                  ),
                  title: Text(
                    cat.name,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text('$count nota(s)'),
                  trailing: IconButton(
                    tooltip: 'Excluir categoria',
                    icon: const Icon(Icons.delete_outline_rounded),
                    onPressed: () => _delete(context, cat),
                  ),
                  onTap: () async {
                    await controller.setCategoryFilter(cat.id);
                    if (context.mounted) Navigator.pop(context);
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
