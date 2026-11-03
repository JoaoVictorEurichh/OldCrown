import 'package:flutter/material.dart';

import '../app.dart';
import '../services/auth_service.dart';
import '../widgets/feedback.dart';
import 'register_page.dart';

class LoginPage extends StatefulWidget {
  final AuthService authService;

  const LoginPage({super.key, required this.authService});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  bool loading = false;
  bool obscurePassword = true;

  Future<void> login() async {
    final email = emailController.text.trim();
    final password = passwordController.text;
    if (email.isEmpty || password.isEmpty) {
      showMessage(context, 'Preencha todos os campos.');
      return;
    }
    setState(() => loading = true);
    try {
      // Não é preciso navegar: o AuthGate percebe o login e abre as notas.
      await widget.authService.login(email, password);
    } catch (e) {
      if (mounted) showMessage(context, AuthService.messageFor(e));
    }
    if (mounted) setState(() => loading = false);
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 82,
                    height: 82,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8DDF8),
                      borderRadius: BorderRadius.circular(26),
                    ),
                    child: const Icon(
                      Icons.edit_note_rounded,
                      size: 45,
                      color: kPrimary,
                    ),
                  ),
                ),
                const SizedBox(height: 35),
                const Text(
                  'Olá!',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: kText,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Entre para acessar suas notas.',
                  style: TextStyle(fontSize: 16, color: kMuted),
                ),
                const SizedBox(height: 35),
                const FieldLabel('E-mail'),
                TextField(
                  key: const Key('login_email'),
                  controller: emailController,
                  keyboardType: TextInputType.emailAddress,
                  autofillHints: const [AutofillHints.email],
                  decoration: const InputDecoration(
                    hintText: 'seu@email.com',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                ),
                const SizedBox(height: 16),
                const FieldLabel('Senha'),
                TextField(
                  key: const Key('login_password'),
                  controller: passwordController,
                  obscureText: obscurePassword,
                  onSubmitted: (_) => login(),
                  decoration: InputDecoration(
                    hintText: 'Digite sua senha',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      onPressed: () =>
                          setState(() => obscurePassword = !obscurePassword),
                      icon: Icon(
                        obscurePassword
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 30),
                ElevatedButton(
                  onPressed: loading ? null : login,
                  child: loading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'Entrar',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
                const SizedBox(height: 20),
                Center(
                  child: TextButton(
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) =>
                            RegisterPage(authService: widget.authService),
                      ),
                    ),
                    child: const Text(
                      'Ainda não possui uma conta? Cadastre-se',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
