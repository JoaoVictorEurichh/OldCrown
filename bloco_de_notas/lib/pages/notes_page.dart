import 'package:flutter/material.dart';

import '../app.dart';
import '../controllers/notes_controller.dart';
import '../core/text_utils.dart';
import '../models/note.dart';
import '../models/note_sort.dart';
import '../widgets/feedback.dart';
import '../widgets/note_card.dart';
import '../widgets/sync_status_bar.dart';
import 'categories_page.dart';
import 'note_form_page.dart';
import 'trash_page.dart';

class NotesPage extends StatefulWidget {
  final NotesController controller;
  final String email;
  final Future<void> Function() onLogout;

  const NotesPage({
    super.key,
    required this.controller,
    required this.email,
    required this.onLogout,
  });

  @override
  State<NotesPage> createState() => _NotesPageState();
}

class _NotesPageState extends State<NotesPage> {
  final searchController = TextEditingController();

  NotesController get c => widget.controller;

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  Future<void> openForm([Note? note]) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => NoteFormPage(controller: c, note: note),
      ),
    );
  }

  Future<void> moveToTrash(Note note) async {
    await c.moveToTrash(note);
    if (!mounted) return;
    showMessage(
      context,
      'Nota movida para a lixeira.',
      action: SnackBarAction(
        label: 'Desfazer',
        onPressed: () {
          final trashed = c.trash.where((n) => n.id == note.id);
          if (trashed.isNotEmpty) c.restore(trashed.first);
        },
      ),
    );
  }

  Future<void> logout() async {
    if (c.pendingCount > 0) {
      final ok = await confirmDialog(
        context,
        title: 'Sair da conta?',
        message:
            'Existem ${c.pendingCount} alteração(ões) que ainda não '
            'foram enviadas para a nuvem. Elas continuam salvas neste '
            'aparelho e serão enviadas no próximo login.',
        confirmLabel: 'Sair',
      );
      if (!ok) return;
    }
    await widget.onLogout();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: c,
      builder: (context, _) => Scaffold(
        appBar: AppBar(
          title: const Text(
            'Minhas notas',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          actions: [
            IconButton(
              tooltip: 'Sincronizar agora',
              onPressed: c.syncState == SyncState.syncing ? null : c.sync,
              icon: const Icon(Icons.sync_rounded),
            ),
            PopupMenuButton<NoteSort>(
              tooltip: 'Ordenar',
              icon: const Icon(Icons.sort_rounded),
              initialValue: c.sort,
              onSelected: c.setSort,
              itemBuilder: (_) => [
                for (final s in NoteSort.values)
                  CheckedPopupMenuItem(
                    value: s,
                    checked: s == c.sort,
                    child: Text(s.label),
                  ),
              ],
            ),
            PopupMenuButton<String>(
              onSelected: (value) {
                switch (value) {
                  case 'categories':
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => CategoriesPage(controller: c),
                      ),
                    );
                  case 'trash':
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => TrashPage(controller: c),
                      ),
                    );
                  case 'logout':
                    logout();
                }
              },
              itemBuilder: (_) => [
                const PopupMenuItem(
                  value: 'categories',
                  child: ListTile(
                    leading: Icon(Icons.label_outline_rounded),
                    title: Text('Categorias'),
                  ),
                ),
                PopupMenuItem(
                  value: 'trash',
                  child: ListTile(
                    leading: const Icon(Icons.delete_outline_rounded),
                    title: Text('Lixeira (${c.trash.length})'),
                  ),
                ),
                const PopupMenuItem(
                  value: 'logout',
                  child: ListTile(
                    leading: Icon(Icons.logout_rounded),
                    title: Text('Sair'),
                  ),
                ),
              ],
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => openForm(),
          backgroundColor: kPrimary,
          foregroundColor: Colors.white,
          icon: const Icon(Icons.add_rounded),
          label: const Text(
            'Nova nota',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
        body: RefreshIndicator(
          onRefresh: c.sync,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                sliver: SliverList.list(
                  children: [
                    Text(
                      widget.email,
                      style: const TextStyle(color: kMuted, fontSize: 13),
                    ),
                    SyncStatusBar(controller: c, onRetry: c.sync),
                    const SizedBox(height: 12),
                    TextField(
                      key: const Key('search_field'),
                      controller: searchController,
                      onChanged: c.setQuery,
                      textInputAction: TextInputAction.search,
                      decoration: InputDecoration(
                        hintText: 'Pesquisar no título ou no conteúdo',
                        prefixIcon: const Icon(Icons.search_rounded),
                        suffixIcon: c.isSearching
                            ? IconButton(
                                tooltip: 'Limpar pesquisa',
                                icon: const Icon(Icons.close_rounded),
                                onPressed: () {
                                  searchController.clear();
                                  c.setQuery('');
                                },
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _CategoryFilter(controller: c),
                    const SizedBox(height: 12),
                    if (c.isSearching || c.selectedCategoryId != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Text(
                          _resultLabel(),
                          key: const Key('result_count'),
                          style: const TextStyle(color: kMuted, fontSize: 13),
                        ),
                      ),
                  ],
                ),
              ),
              if (c.loading)
                const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (c.notes.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: _EmptyState(searching: c.isSearching),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 96),
                  sliver: SliverList.builder(
                    itemCount: c.notes.length,
                    itemBuilder: (context, index) {
                      final note = c.notes[index];
                      return NoteCard(
                        key: ValueKey(note.id),
                        note: note,
                        category: c.categoryById(note.categoryId),
                        highlight: c.query,
                        dateLabel: _dateLabel(note),
                        onTap: () => openForm(note),
                        actions: [
                          IconButton(
                            tooltip: 'Mover para a lixeira',
                            onPressed: () => moveToTrash(note),
                            icon: const Icon(
                              Icons.delete_outline_rounded,
                              color: Color(0xFFB45F6C),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  String _resultLabel() {
    final n = c.notes.length;
    final category = c.categoryById(c.selectedCategoryId);
    final parts = <String>[
      '$n ${n == 1 ? 'nota encontrada' : 'notas encontradas'}',
      if (c.isSearching) 'para "${c.query.trim()}"',
      if (category != null) 'em ${category.name}',
    ];
    return parts.join(' ');
  }

  String _dateLabel(Note note) {
    final created =
        c.sort == NoteSort.createdAsc || c.sort == NoteSort.createdDesc;
    final ts = created ? note.createdAt : note.updatedAt;
    return '${created ? 'Criada' : 'Atualizada'} em ${formatDateTime(ts)}';
  }
}

class _CategoryFilter extends StatelessWidget {
  final NotesController controller;

  const _CategoryFilter({required this.controller});

  @override
  Widget build(BuildContext context) {
    final c = controller;
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: const Text('Todas'),
              selected: c.selectedCategoryId == null,
              onSelected: (_) => c.setCategoryFilter(null),
            ),
          ),
          for (final cat in c.categories)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                avatar: CircleAvatar(
                  backgroundColor: Color(cat.color),
                  radius: 6,
                ),
                label: Text('${cat.name} (${c.countByCategory[cat.id] ?? 0})'),
                selected: c.selectedCategoryId == cat.id,
                onSelected: (_) => c.setCategoryFilter(
                  c.selectedCategoryId == cat.id ? null : cat.id,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final bool searching;

  const _EmptyState({required this.searching});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: const BoxDecoration(
              color: Color(0xFFEDE5FA),
              shape: BoxShape.circle,
            ),
            child: Icon(
              searching
                  ? Icons.search_off_rounded
                  : Icons.sticky_note_2_rounded,
              size: 44,
              color: kPrimary,
            ),
          ),
          const SizedBox(height: 25),
          Text(
            searching ? 'Nenhuma nota encontrada' : 'Nenhuma nota ainda',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            searching
                ? 'Tente outras palavras ou outra categoria.'
                : 'Crie sua primeira nota.',
            style: const TextStyle(color: kMuted),
          ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }
}
