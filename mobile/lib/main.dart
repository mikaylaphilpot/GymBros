import 'package:flutter/material.dart';

import 'auth/auth_service.dart';
import 'pages/login_page.dart';

void main() {
  runApp(GymBrosApp(authService: AuthService()));
}

class GymBrosApp extends StatefulWidget {
  const GymBrosApp({super.key, required this.authService});

  final AuthService authService;

  @override
  State<GymBrosApp> createState() => _GymBrosAppState();
}

class _GymBrosAppState extends State<GymBrosApp> {
  AuthUser? _user;
  String? _restoreError;
  bool _isRestoring = true;
  bool _showSignUp = false;

  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    try {
      final user = await widget.authService.restoreSession();
      if (!mounted) return;
      setState(() {
        _user = user;
        _restoreError = null;
        _isRestoring = false;
      });
    } on AuthException catch (error) {
      if (!mounted) return;
      setState(() {
        _restoreError = error.message;
        _isRestoring = false;
      });
    }
  }

  void _onLoggedIn(AuthUser user) {
    setState(() {
      _user = user;
      _restoreError = null;
    });
  }

  Future<void> _logOut() async {
    await widget.authService.logOut();
    if (!mounted) return;
    setState(() => _user = null);
  }

  void _toggleSignUp() {
    setState(() {
      _showSignUp = !_showSignUp;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GymBros',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFB6F36A),
          brightness: Brightness.dark,
          surface: const Color(0xFF151914),
        ),
        scaffoldBackgroundColor: const Color(0xFF10130F),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF1A2019),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFF30382D)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFB6F36A), width: 1.5),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            minimumSize: const Size.fromHeight(54),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
        ),
        useMaterial3: true,
      ),
      home: _isRestoring
          ? const _LoadingScreen()
          : _user == null
          ? _showSignUp
                ? AuthScreen(
                    key: const ValueKey('signup'),
                    authService: widget.authService,
                    initialMessage: _restoreError,
                    onLoggedIn: _onLoggedIn,
                    onBackToLogin: _toggleSignUp,
                  )
                : LoginPage(
                    key: const ValueKey('login'),
                    authService: widget.authService,
                    initialMessage: _restoreError,
                    onLoggedIn: _onLoggedIn,
                    onCreateAccount: _toggleSignUp,
                  )
          : HomeScreen(user: _user!, onLogOut: _logOut),
    );
  }
}

class _LoadingScreen extends StatelessWidget {
  const _LoadingScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}

class AuthScreen extends StatefulWidget {
  const AuthScreen({
    super.key,
    required this.authService,
    required this.onLoggedIn,
    this.initialMessage,
    this.onBackToLogin,
  });

  final AuthService authService;
  final ValueChanged<AuthUser> onLoggedIn;
  final String? initialMessage;
  final VoidCallback? onBackToLogin;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isSignUp = false;
  bool _isSubmitting = false;
  bool _obscurePassword = true;
  String? _errorMessage;
  String? _successMessage;

  @override
  void initState() {
    super.initState();
    _isSignUp = widget.onBackToLogin != null;
    _errorMessage = widget.initialMessage;
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  String? _validateUsername(String? value) {
    if (value == null || value.trim().isEmpty) return 'Enter your username';
    return null;
  }

  String? _validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) return 'Enter your email';
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value.trim())) {
      return 'Enter a valid email address';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) return 'Enter your password';
    if (_isSignUp &&
        !RegExp(
          r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$',
        ).hasMatch(value)) {
      return 'Use 8+ characters with uppercase, lowercase, a number, and a symbol (@\$!%*?&)';
    }
    return null;
  }

  String? _validateConfirmation(String? value) {
    if (value != _passwordController.text) return 'Passwords do not match';
    return null;
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      if (_isSignUp) {
        await widget.authService.signUp(
          username: _usernameController.text.trim(),
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
        if (!mounted) return;
        widget.onBackToLogin?.call();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Account created. Check your email to verify it, then sign in.',
            ),
          ),
        );
      } else {
        final user = await widget.authService.logIn(
          username: _usernameController.text.trim(),
          password: _passwordController.text,
        );
        if (!mounted) return;
        widget.onLoggedIn(user);
      }
    } on AuthException catch (error) {
      if (!mounted) return;
      setState(() => _errorMessage = error.message);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _switchMode() {
    if (widget.onBackToLogin != null) {
      widget.onBackToLogin!();
      return;
    }

    setState(() {
      _isSignUp = !_isSignUp;
      _errorMessage = null;
      _successMessage = null;
      _formKey.currentState?.reset();
    });
  }

  @override
  Widget build(BuildContext context) {
    const red = Color(0xFFB31517);
    const backgroundRed = Color(0xFFE9E4DF);

    InputDecoration signupInput(String label) {
      return InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Colors.black54),
        filled: true,
        fillColor: const Color(0xFFD9D9D9),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 18,
        ),
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
          borderSide: const BorderSide(color: red, width: 2),
        ),
      );
    }

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
                        'Become a Bro!',
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
                      if (_successMessage != null) ...[
                        _MessageBanner(
                          message: _successMessage!,
                          isSuccess: true,
                        ),
                        const SizedBox(height: 16),
                      ],
                      if (_errorMessage != null) ...[
                        _MessageBanner(
                          message: _errorMessage!,
                          isSuccess: false,
                        ),
                        const SizedBox(height: 16),
                      ],
                      TextFormField(
                        controller: _usernameController,
                        style: const TextStyle(color: Colors.black),
                        validator: _validateUsername,
                        textInputAction: TextInputAction.next,
                        textCapitalization: TextCapitalization.none,
                        autocorrect: false,
                        autofillHints: const [AutofillHints.username],
                        decoration: signupInput('Username'),
                      ),
                      if (_isSignUp) ...[
                        const SizedBox(height: 25),
                        TextFormField(
                          controller: _emailController,
                          style: const TextStyle(color: Colors.black),
                          validator: _validateEmail,
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.next,
                          autocorrect: false,
                          autofillHints: const [AutofillHints.email],
                          decoration: signupInput('Email'),
                        ),
                      ],
                      const SizedBox(height: 25),
                      TextFormField(
                        controller: _passwordController,
                        style: const TextStyle(color: Colors.black),
                        validator: _validatePassword,
                        obscureText: _obscurePassword,
                        textInputAction: _isSignUp
                            ? TextInputAction.next
                            : TextInputAction.done,
                        autofillHints: [
                          _isSignUp
                              ? AutofillHints.newPassword
                              : AutofillHints.password,
                        ],
                        onFieldSubmitted: _isSignUp ? null : (_) => _submit(),
                        decoration: signupInput('Password').copyWith(
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
                              color: Colors.black54,
                            ),
                          ),
                        ),
                      ),
                      if (_isSignUp) ...[
                        const SizedBox(height: 25),
                        TextFormField(
                          controller: _confirmPasswordController,
                          style: const TextStyle(color: Colors.black),
                          validator: _validateConfirmation,
                          obscureText: _obscurePassword,
                          textInputAction: TextInputAction.done,
                          onFieldSubmitted: (_) => _submit(),
                          decoration: signupInput('Confirm password'),
                        ),
                      ],
                      const SizedBox(height: 23),
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
                                  'Sign Up',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: _isSubmitting ? null : _switchMode,
                        child: const Text(
                          'Already a Bro? Sign In',
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
}

class _BrandMark extends StatelessWidget {
  const _BrandMark();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.fitness_center, color: Color(0xFFB6F36A), size: 30),
        const SizedBox(width: 10),
        Text(
          'GYMBROS',
          style: Theme.of(context).textTheme.titleLarge
              ?.copyWith(letterSpacing: 3, fontWeight: FontWeight.w900),
        ),
      ],
    );
  }
}

class _MessageBanner extends StatelessWidget {
  const _MessageBanner({required this.message, required this.isSuccess});

  final String message;
  final bool isSuccess;

  @override
  Widget build(BuildContext context) {
    final color = isSuccess
        ? const Color(0xFFB6F36A)
        : Theme.of(context).colorScheme.error;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Text(message, style: TextStyle(color: color)),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key, required this.user, required this.onLogOut});

  final AuthUser user;
  final VoidCallback onLogOut;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('GymBros'),
        actions: [
          IconButton(
            tooltip: 'Sign out',
            onPressed: onLogOut,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.fitness_center,
                size: 52,
                color: Color(0xFFB6F36A),
              ),
              const SizedBox(height: 20),
              Text(
                'You’re in, ${user.username}!',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(user.email, style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: onLogOut,
                icon: const Icon(Icons.logout),
                label: const Text('Sign out'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
