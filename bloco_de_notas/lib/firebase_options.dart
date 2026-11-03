// ARQUIVO DE EXEMPLO — NÃO CONTÉM CREDENCIAIS.
//
// Este arquivo é substituído automaticamente ao executar, na pasta do
// projeto:
//
//     flutterfire configure
//
// O FlutterFire CLI gera aqui as configurações do SEU projeto Firebase.
// Depois de gerar, não faça commit dele (veja a seção "Configurar o
// Firebase" do README):
//
//     git update-index --skip-worktree lib/firebase_options.dart
//
// Enquanto este arquivo de exemplo estiver em uso, o app abre uma tela
// explicando como configurar o Firebase.
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    throw UnsupportedError(
      'Firebase não configurado. Execute "flutterfire configure" na pasta '
      'do projeto para gerar lib/firebase_options.dart.',
    );
  }
}
