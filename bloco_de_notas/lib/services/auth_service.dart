import 'package:firebase_auth/firebase_auth.dart';

/// Encapsula o Firebase Authentication (e-mail e senha).
class AuthService {
  final FirebaseAuth? _authOverride;

  AuthService([FirebaseAuth? auth]) : _authOverride = auth;

  // Obtido sob demanda, para que criar o serviço não exija o Firebase já
  // inicializado (útil em testes de interface).
  FirebaseAuth get _auth => _authOverride ?? FirebaseAuth.instance;

  /// Emite o usuário atual sempre que ele entra ou sai. O Firebase mantém a
  /// sessão salva, então ao reabrir o app o usuário continua logado.
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  User? get currentUser => _auth.currentUser;

  Future<User?> login(String email, String password) async {
    final result = await _auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
    return result.user;
  }

  Future<User?> register(String email, String password) async {
    final result = await _auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
    return result.user;
  }

  Future<void> logout() => _auth.signOut();

  /// Traduz os códigos de erro do Firebase Auth para mensagens amigáveis.
  static String messageFor(Object error) {
    if (error is FirebaseAuthException) {
      switch (error.code) {
        case 'invalid-email':
          return 'E-mail inválido.';
        case 'user-not-found':
        case 'wrong-password':
        case 'invalid-credential':
          return 'E-mail ou senha incorretos.';
        case 'email-already-in-use':
          return 'Este e-mail já está cadastrado.';
        case 'weak-password':
          return 'A senha precisa ter pelo menos 6 caracteres.';
        case 'network-request-failed':
          return 'Sem conexão com a internet. Tente novamente.';
        case 'too-many-requests':
          return 'Muitas tentativas. Aguarde alguns minutos.';
      }
      return 'Erro de autenticação (${error.code}).';
    }
    return 'Não foi possível completar a operação.';
  }
}
