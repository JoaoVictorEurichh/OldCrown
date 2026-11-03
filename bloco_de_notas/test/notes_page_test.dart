import 'package:bloco_de_nota_turma_a/app.dart';
import 'package:bloco_de_nota_turma_a/controllers/notes_controller.dart';
import 'package:bloco_de_nota_turma_a/pages/notes_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'helpers/fakes.dart';

/// Teste de interface: cria uma nota pela tela, escolhe a categoria,
/// pesquisa e confere que ela foi enviada para a "nuvem" falsa.
void main() {
  setUpAll(setUpSqfliteFfi);

  testWidgets('criar nota com categoria, pesquisar e sincronizar', (
    tester,
  ) async {
    final cloud = FakeRemoteDataSource();
    late Device device;
    late NotesController controller;

    await tester.runAsync(() async {
      device = await Device.create(cloud);
      controller = NotesController(
        uid: 'user-a',
        repository: device.repository,
        syncService: device.sync,
      );
      await controller.init();
    });

    await tester.pumpWidget(
      MaterialApp(
        theme: buildTheme(),
        home: NotesPage(
          controller: controller,
          email: 'aluno@teste.com',
          onLogout: () async {},
        ),
      ),
    );
    await tester.pump();

    expect(find.text('Nenhuma nota ainda'), findsOneWidget);
    expect(find.text('Notas salvas na nuvem.'), findsOneWidget);

    // Abre o formulário.
    await tester.tap(find.text('Nova nota'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const Key('note_title')),
      'Trabalho de Física',
    );
    await tester.enterText(
      find.byKey(const Key('note_content')),
      'Entregar relatório',
    );

    // Seleciona a categoria "Estudos".
    await tester.tap(find.text('Sem categoria'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Estudos').last);
    await tester.pumpAndSettle();

    await tester.runAsync(() async {
      await tester.tap(find.byKey(const Key('save_note')));
      await Future<void>.delayed(const Duration(milliseconds: 300));
    });
    await tester.pumpAndSettle();

    expect(find.text('Trabalho de Física'), findsOneWidget);
    expect(find.text('Estudos'), findsWidgets);

    // Pesquisa sem acento pelo conteúdo.
    await tester.runAsync(() async {
      await tester.enterText(
        find.byKey(const Key('search_field')),
        'relatorio',
      );
      await Future<void>.delayed(const Duration(milliseconds: 400));
    });
    await tester.pump();
    expect(find.text('1 nota encontrada para "relatorio"'), findsOneWidget);

    await tester.runAsync(() async {
      await tester.enterText(find.byKey(const Key('search_field')), 'química');
      await Future<void>.delayed(const Duration(milliseconds: 400));
    });
    await tester.pump();
    expect(find.text('Nenhuma nota encontrada'), findsOneWidget);

    // A nota foi enviada para a nuvem.
    final remote = cloud.notes['user-a']!.values.single;
    expect(remote.title, 'Trabalho de Física');
    expect(remote.categoryId, 'default-estudos');

    controller.dispose();
    await tester.runAsync(device.db.close);
  });
}
