import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

import 'app.dart';
import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    // O cache offline do próprio Firestore é desativado: o SQLite é a única
    // fonte de dados offline do app, e a sincronização entre os dois é
    // feita explicitamente pelo SyncService.
    FirebaseFirestore.instance.settings = const Settings(
      persistenceEnabled: false,
    );
  } catch (e) {
    runApp(FirebaseSetupErrorApp(error: e));
    return;
  }

  runApp(const BlocoDeNotasApp());
}
