import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import 'controllers/notes_controller.dart';
import 'data/local/app_database.dart';
import 'data/local/category_local_data_source.dart';
import 'data/local/note_local_data_source.dart';
import 'data/remote/firestore_remote_data_source.dart';
import 'pages/login_page.dart';
import 'pages/notes_page.dart';
import 'repositories/note_repository.dart';
import 'services/auth_service.dart';
import 'services/sync_service.dart';

const Color kPrimary = Color(0xFF6C4AB6);
const Color kBackground = Color(0xFFF7F5FC);
const Color kText = Color(0xFF292333);
const Color kMuted = Color(0xFF77717F);

ThemeData buildTheme() => ThemeData(
  useMaterial3: true,
  scaffoldBackgroundColor: kBackground,
  colorScheme: ColorScheme.fromSeed(seedColor: kPrimary),
  appBarTheme: const AppBarTheme(
    backgroundColor: kBackground,
    foregroundColor: kText,
    elevation: 0,
    centerTitle: false,
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 17),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: BorderSide.none,
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: BorderSide.none,
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: const BorderSide(color: kPrimary, width: 2),
    ),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: kPrimary,
      foregroundColor: Colors.white,
      minimumSize: const Size.fromHeight(54),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
    ),
  ),
);

class BlocoDeNotasApp extends StatelessWidget {
  const BlocoDeNotasApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Bloco de Notas',
      theme: buildTheme(),
      home: AuthGate(authService: AuthService()),
    );
  }
}

/// Decide qual tela mostrar de acordo com o estado da autenticação.
///
/// Como o Firebase Auth guarda a sessão, ao reabrir o app o usuário vai
/// direto para as notas, e a sincronização baixa os dados da nuvem.
class AuthGate extends StatelessWidget {
  final AuthService authService;

  const AuthGate({super.key, required this.authService});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: authService.authStateChanges,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        final user = snapshot.data;
        if (user == null) {
          return LoginPage(authService: authService);
        }
        return NotesHome(
          key: ValueKey(user.uid),
          user: user,
          authService: authService,
        );
      },
    );
  }
}

/// Monta as dependências (injeção de dependência manual) para o usuário
/// autenticado e entrega o controller para a tela de notas.
class NotesHome extends StatefulWidget {
  final User user;
  final AuthService authService;

  const NotesHome({super.key, required this.user, required this.authService});

  @override
  State<NotesHome> createState() => _NotesHomeState();
}

class _NotesHomeState extends State<NotesHome> {
  late final NotesController controller;

  @override
  void initState() {
    super.initState();
    final db = AppDatabase.instance;
    final notesLocal = NoteLocalDataSource(db);
    final categoriesLocal = CategoryLocalDataSource(db);
    controller = NotesController(
      uid: widget.user.uid,
      repository: NoteRepository(
        notes: notesLocal,
        categories: categoriesLocal,
      ),
      syncService: SyncService(
        notes: notesLocal,
        categories: categoriesLocal,
        remote: FirestoreRemoteDataSource(),
      ),
    )..init();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return NotesPage(
      controller: controller,
      email: widget.user.email ?? '',
      onLogout: widget.authService.logout,
    );
  }
}

/// Exibida quando o Firebase ainda não foi configurado (`flutterfire
/// configure` não foi executado) ou falhou ao inicializar.
class FirebaseSetupErrorApp extends StatelessWidget {
  final Object error;

  const FirebaseSetupErrorApp({super.key, required this.error});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      home: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.cloud_off_rounded, size: 56, color: kPrimary),
                const SizedBox(height: 20),
                const Text(
                  'Firebase não configurado',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Execute "flutterfire configure" na pasta do projeto e '
                  'rode o app novamente. Veja o README para o passo a passo.',
                ),
                const SizedBox(height: 16),
                Text(
                  '$error',
                  style: const TextStyle(color: kMuted, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
