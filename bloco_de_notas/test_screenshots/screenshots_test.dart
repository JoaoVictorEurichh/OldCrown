// Gera as capturas de tela da interface usadas no README.
//
//   flutter test test_screenshots --update-goldens
//
// As imagens são salvas em docs/screenshots/. Os dados vêm do SQLite real
// (via FFI) e de uma nuvem falsa em memória, então estas imagens mostram a
// interface, mas NÃO são evidência do Firebase. As evidências do console
// do Firebase devem ser capturadas manualmente (veja o README).
import 'dart:io';

import 'package:bloco_de_nota_turma_a/app.dart';
import 'package:bloco_de_nota_turma_a/controllers/notes_controller.dart';
import 'package:bloco_de_nota_turma_a/pages/categories_page.dart';
import 'package:bloco_de_nota_turma_a/pages/login_page.dart';
import 'package:bloco_de_nota_turma_a/pages/note_form_page.dart';
import 'package:bloco_de_nota_turma_a/pages/notes_page.dart';
import 'package:bloco_de_nota_turma_a/pages/trash_page.dart';
import 'package:bloco_de_nota_turma_a/services/auth_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import '../test/helpers/fakes.dart';

Future<void> _loadFonts() async {
  final root = Platform.environment['FLUTTER_ROOT']!;
  final dir = '$root/bin/cache/artifacts/material_fonts';
  Future<ByteData> load(String file) async =>
      ByteData.sublistView(await File('$dir/$file').readAsBytes());

  final roboto = FontLoader('Roboto')
    ..addFont(load('Roboto-Regular.ttf'))
    ..addFont(load('Roboto-Medium.ttf'))
    ..addFont(load('Roboto-Bold.ttf'));
  await roboto.load();
  final icons = FontLoader('MaterialIcons')
    ..addFont(load('MaterialIcons-Regular.otf'));
  await icons.load();
}

void main() {
  setUpAll(() async {
    setUpSqfliteFfi();
    await _loadFonts();
  });

  const uid = 'aluno';
  late FakeRemoteDataSource cloud;
  late Device device;
  late NotesController controller;
  late int now;

  Future<void> seed(WidgetTester tester) async {
    await tester.runAsync(() async {
      now = DateTime(2026, 11, 3, 8, 15).millisecondsSinceEpoch;
      cloud = FakeRemoteDataSource()..signedInUid = uid;
      device = await Device.create(cloud, clock: () => now);
      final r = device.repository;
      await r.ensureDefaultCategories(uid);
      await r.createCategory(uid: uid, name: 'Faculdade', color: 0xFFC2418C);
      Future<void> add(String t, String c, String? cat, int minutes) async {
        now += Duration(minutes: minutes).inMilliseconds;
        await r.createNote(uid: uid, title: t, content: c, categoryId: cat);
      }

      await add(
        'Prova de Cálculo II',
        'Estudar integrais por partes e séries. Prova na sexta às 19h.',
        'default-estudos',
        5,
      );
      await add(
        'Reunião com o cliente',
        'Levar o protótipo do app e a planilha de custos.',
        'default-trabalho',
        40,
      );
      await add(
        'Lista do mercado',
        'Arroz, feijão, café, frutas e pão integral.',
        'default-pessoal',
        30,
      );
      await add(
        'Trabalho de Banco de Dados',
        'Modelar o diagrama ER e entregar no Classroom até segunda.',
        null,
        90,
      );
      final trashed = await r.createNote(
        uid: uid,
        title: 'Ideias antigas',
        content: 'Rascunho que não preciso mais.',
      );
      now += 60000;
      await r.moveToTrash(trashed);

      controller = NotesController(
        uid: uid,
        repository: r,
        syncService: device.sync,
      );
      await controller.init();
    });
  }

  Future<void> setSize(WidgetTester tester) async {
    tester.view.physicalSize = const Size(1170, 2532);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
  }

  Widget wrap(Widget child) => MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: buildTheme(),
    home: child,
  );

  Future<void> shot(WidgetTester tester, String name) async {
    await tester.pumpAndSettle();
    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile('../docs/screenshots/$name.png'),
    );
  }

  NotesPage notesPage() => NotesPage(
    controller: controller,
    email: 'aluno@exemplo.com',
    onLogout: () async {},
  );

  tearDown(() async {
    controller.dispose();
  });

  testWidgets('01 login', (tester) async {
    await setSize(tester);
    await seed(tester);
    await tester.pumpWidget(wrap(LoginPage(authService: AuthService())));
    await shot(tester, '01_login');
  });

  testWidgets('02 lista de notas', (tester) async {
    await setSize(tester);
    await seed(tester);
    await tester.pumpWidget(wrap(notesPage()));
    await shot(tester, '02_lista_notas');
  });

  testWidgets('03 pesquisa', (tester) async {
    await setSize(tester);
    await seed(tester);
    await tester.pumpWidget(wrap(notesPage()));
    await tester.runAsync(() async {
      await tester.enterText(find.byKey(const Key('search_field')), 'entregar');
      await Future<void>.delayed(const Duration(milliseconds: 400));
    });
    await shot(tester, '03_pesquisa');
  });

  testWidgets('04 filtro por categoria', (tester) async {
    await setSize(tester);
    await seed(tester);
    await tester.runAsync(
      () => controller.setCategoryFilter('default-estudos'),
    );
    await tester.pumpWidget(wrap(notesPage()));
    await shot(tester, '04_filtro_categoria');
  });

  testWidgets('05 editar nota', (tester) async {
    await setSize(tester);
    await seed(tester);
    final note = controller.notes.firstWhere(
      (n) => n.title.startsWith('Prova'),
    );
    await tester.pumpWidget(
      wrap(NoteFormPage(controller: controller, note: note)),
    );
    await shot(tester, '05_editar_nota');
  });

  testWidgets('06 categorias', (tester) async {
    await setSize(tester);
    await seed(tester);
    await tester.pumpWidget(wrap(CategoriesPage(controller: controller)));
    await shot(tester, '06_categorias');
  });

  testWidgets('07 lixeira', (tester) async {
    await setSize(tester);
    await seed(tester);
    await tester.pumpWidget(wrap(TrashPage(controller: controller)));
    await shot(tester, '07_lixeira');
  });

  testWidgets('08 sem conexao', (tester) async {
    await setSize(tester);
    await seed(tester);
    await tester.runAsync(() async {
      cloud.offline = true;
      now += 60000;
      await controller.saveNote(
        title: 'Anotação offline',
        content: 'Criada sem internet: fica no SQLite e é enviada depois.',
      );
      // Espera a tentativa de envio (disparada pelo save) falhar.
      await Future<void>.delayed(const Duration(milliseconds: 300));
    });
    await tester.pumpWidget(wrap(notesPage()));
    await shot(tester, '08_sem_conexao');
  });
}
