import 'package:flutter/material.dart';

import '../auth/auth_service.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({
    super.key,
    required this.authService,
    required this.onLoggedIn,
    required this.onCreateAccount,
    this.initialMessage,
  });

  final AuthService authService;
  final ValueChanged<AuthUser> onLoggedIn;
  final VoidCallback onCreateAccount;
  final String? initialMessage;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isSubmitting = false;
  bool _obscurePassword = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _errorMessage = widget.initialMessage;
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final user = await widget.authService.logIn(
        username: _usernameController.text.trim(),
        password: _passwordController.text,
      );
      if (!mounted) return;
      widget.onLoggedIn(user);
    } on AuthException catch (error) {
      if (!mounted) return;
      setState(() => _errorMessage = error.message);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  String? _required(String? value, String message) {
    if (value == null || value.trim().isEmpty) return message;
    return null;
  }

  @override
  Widget build(BuildContext context) {
    const red = Color(0xFFB31517);
    const backgroundRed = Color(0xFFE9E4DF);

    return Scaffold(
      backgroundColor: backgroundRed,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 679),
              child: Container(
                padding: const EdgeInsets.fromLTRB(24, 36, 24, 28),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x40000000),
                      blurRadius: 25,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'Welcome Back Bro!',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 38,
                          fontWeight: FontWeight.bold,
                          decoration: TextDecoration.underline,
                          decorationColor: red,
                          decorationThickness: 4,
                        ),
                      ),
                      const SizedBox(height: 34),
                      if (_errorMessage != null) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: red.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: red.withValues(alpha: 0.5),
                            ),
                          ),
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(color: red),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      TextFormField(
                        controller: _usernameController,
                        style: const TextStyle(color: Colors.black),
                        validator: (value) =>
                            _required(value, 'Enter your username'),
                        textInputAction: TextInputAction.next,
                        textCapitalization: TextCapitalization.none,
                        autocorrect: false,
                        autofillHints: const [AutofillHints.username],
                        decoration: _inputDecoration('Username'),
                      ),
                      const SizedBox(height: 32),
                      TextFormField(
                        controller: _passwordController,
                        style: const TextStyle(color: Colors.black),
                        validator: (value) =>
                            _required(value, 'Enter your password'),
                        obscureText: _obscurePassword,
                        textInputAction: TextInputAction.done,
                        onFieldSubmitted: (_) => _submit(),
                        autofillHints: const [AutofillHints.password],
                        decoration: _inputDecoration('Password').copyWith(
                          suffixIcon: IconButton(
                            tooltip: _obscurePassword
                                ? 'Show password'
                                : 'Hide password',
                            onPressed: () => setState(
                              () => _obscurePassword = !_obscurePassword,
                            ),
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility
                                  : Icons.visibility_off,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: TextButton(
                          onPressed: _isSubmitting
                              ? null
                              : () => ScaffoldMessenger.of(context)
                                    .showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Password recovery is not available on mobile yet.',
                                        ),
                                      ),
                                    ),
                          child: const Text(
                            'Forget Password?',
                            style: TextStyle(color: Color(0xFF546AC0)),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 56,
                        child: ElevatedButton(
                          onPressed: _isSubmitting ? null : _submit,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: red,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                              side: const BorderSide(color: red),
                            ),
                          ),
                          child: _isSubmitting
                              ? const SizedBox(
                                  height: 22,
                                  width: 22,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text(
                                  'Sign In',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: _isSubmitting
                            ? null
                            : widget.onCreateAccount,
                        child: const Text(
                          'Not a Bro? Create Account',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Color(0xFF546AC0)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      filled: true,
      fillColor: const Color(0xFFD9D9D9),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: const BorderSide(color: Color(0xFF9E9E9E)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: const BorderSide(color: Color(0xFF9E9E9E)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: const BorderSide(color: Color(0xFFB31517), width: 2),
      ),
    );
  }
}
