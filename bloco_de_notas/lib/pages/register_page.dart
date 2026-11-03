import 'package:flutter/material.dart';

import '../app.dart';
import '../services/auth_service.dart';
import '../widgets/feedback.dart';

class RegisterPage extends StatefulWidget {
  final AuthService authService;

  const RegisterPage({super.key, required this.authService});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();

  bool loading = false;
  bool obscurePassword = true;

  Future<void> register() async {
    final email = emailController.text.trim();
    final password = passwordController.text;
    final confirm = confirmPasswordController.text;

    if (email.isEmpty || password.isEmpty || confirm.isEmpty) {
      showMessage(context, 'Preencha todos os campos.');
      return;
    }
    if (password != confirm) {
      showMessage(context, 'As senhas não são iguais.');
      return;
    }
    if (password.length < 6) {
      showMessage(context, 'A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setState(() => loading = true);
    try {
      // O Firebase já autentica o usuário após o cadastro; o AuthGate abre
      // a tela de notas. Esta página só precisa ser fechada.
      await widget.authService.register(email, password);
      if (mounted) {
        showMessage(context, 'Conta criada com sucesso!');
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) showMessage(context, AuthService.messageFor(e));
    }
    if (mounted) setState(() => loading = false);
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Criar conta')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Comece suas anotações',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: kText,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Crie sua conta para salvar suas notas na nuvem.',
              style: TextStyle(fontSize: 16, color: kMuted),
            ),
            const SizedBox(height: 30),
            const FieldLabel('E-mail'),
            TextField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                hintText: 'seu@email.com',
                prefixIcon: Icon(Icons.email_outlined),
              ),
            ),
            const SizedBox(height: 16),
            const FieldLabel('Senha'),
            TextField(
              controller: passwordController,
              obscureText: obscurePassword,
              decoration: InputDecoration(
                hintText: 'Mínimo de 6 caracteres',
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
            const SizedBox(height: 16),
            const FieldLabel('Confirmar senha'),
            TextField(
              controller: confirmPasswordController,
              obscureText: obscurePassword,
              onSubmitted: (_) => register(),
              decoration: const InputDecoration(
                hintText: 'Repita a senha',
                prefixIcon: Icon(Icons.lock_outline),
              ),
            ),
            const SizedBox(height: 30),
            ElevatedButton(
              onPressed: loading ? null : register,
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
                      'Criar conta',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
