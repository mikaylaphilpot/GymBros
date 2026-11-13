import 'package:flutter/material.dart';

import 'auth/auth_service.dart';

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
          ? AuthScreen(
              key: const ValueKey('auth'),
              authService: widget.authService,
              initialMessage: _restoreError,
              onLoggedIn: _onLoggedIn,
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
  });

  final AuthService authService;
  final ValueChanged<AuthUser> onLoggedIn;
  final String? initialMessage;

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
        setState(() {
          _isSignUp = false;
          _successMessage =
              'Account created. Check your email to verify it, then sign in.';
          _passwordController.clear();
          _confirmPasswordController.clear();
        });
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
    setState(() {
      _isSignUp = !_isSignUp;
      _errorMessage = null;
      _successMessage = null;
      _formKey.currentState?.reset();
    });
  }

  Future<void> _resendVerificationEmail() async {
    final controller = TextEditingController();
    final email = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Resend verification email'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.emailAddress,
          autofillHints: const [AutofillHints.email],
          decoration: const InputDecoration(labelText: 'Email'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Send email'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (email == null || email.isEmpty || !mounted) return;

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
      _successMessage = null;
    });
    try {
      await widget.authService.resendVerificationEmail(email: email);
      if (!mounted) return;
      setState(() {
        _successMessage = 'If an unverified account exists for that email, a verification email will be sent.';
      });
    } on AuthException catch (error) {
      if (!mounted) return;
      setState(() => _errorMessage = error.message);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _openPasswordReset() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (context) =>
            ForgotPasswordScreen(authService: widget.authService),
      ),
    );
  }

  void _openEmailVerification() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (context) =>
            EmailVerificationScreen(authService: widget.authService),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const _BrandMark(),
                    const SizedBox(height: 32),
                    Text(
                      _isSignUp ? 'Create your account' : 'Welcome back',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _isSignUp
                          ? 'Join your crew. Show up, get stronger, stay accountable.'
                          : 'Sign in and get back to your crew.',
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 28),
                    if (_successMessage != null) ...[
                      _MessageBanner(
                        message: _successMessage!,
                        isSuccess: true,
                      ),
                      const SizedBox(height: 16),
                    ],
                    if (_errorMessage != null) ...[
                      _MessageBanner(message: _errorMessage!, isSuccess: false),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      controller: _usernameController,
                      validator: _validateUsername,
                      textInputAction: _isSignUp
                          ? TextInputAction.next
                          : TextInputAction.next,
                      textCapitalization: TextCapitalization.none,
                      autocorrect: false,
                      autofillHints: const [AutofillHints.username],
                      decoration: const InputDecoration(
                        labelText: 'Username',
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                    ),
                    if (_isSignUp) ...[
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _emailController,
                        validator: _validateEmail,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        autocorrect: false,
                        autofillHints: const [AutofillHints.email],
                        decoration: const InputDecoration(
                          labelText: 'Email',
                          prefixIcon: Icon(Icons.mail_outline),
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _passwordController,
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
                      decoration: InputDecoration(
                        labelText: 'Password',
                        prefixIcon: const Icon(Icons.lock_outline),
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
                    if (_isSignUp) ...[
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _confirmPasswordController,
                        validator: _validateConfirmation,
                        obscureText: _obscurePassword,
                        textInputAction: TextInputAction.done,
                        onFieldSubmitted: (_) => _submit(),
                        decoration: const InputDecoration(
                          labelText: 'Confirm password',
                          prefixIcon: Icon(Icons.lock_outline),
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _isSubmitting ? null : _submit,
                      child: _isSubmitting
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(_isSignUp ? 'Create account' : 'Sign in'),
                    ),
                    if (!_isSignUp) ...[
                      TextButton(
                        onPressed: _isSubmitting ? null : _openPasswordReset,
                        child: const Text('Forgot password?'),
                      ),
                      TextButton(
                        onPressed: _isSubmitting
                            ? null
                            : _resendVerificationEmail,
                        child: const Text('Resend verification email'),
                      ),
                      TextButton(
                        onPressed: _isSubmitting
                            ? null
                            : _openEmailVerification,
                        child: const Text('I have a verification link'),
                      ),
                    ],
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: _isSubmitting ? null : _switchMode,
                      child: Text(
                        _isSignUp
                            ? 'Already have an account? Sign in'
                            : "Don't have an account? Sign up",
                      ),
                    ),
                  ],
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

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key, required this.authService});

  final AuthService authService;

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _tokenController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _resetRequested = false;
  bool _isSubmitting = false;
  String? _errorMessage;
  String? _successMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _tokenController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  String? _validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) return 'Enter your email';
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value.trim())) {
      return 'Enter a valid email address';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) return 'Enter your new password';
    if (!RegExp(
      r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$',
    ).hasMatch(value)) {
      return 'Use 8+ characters with uppercase, lowercase, a number, and a symbol (@\$!%*?&)';
    }
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
      if (!_resetRequested) {
        await widget.authService.requestPasswordReset(
          email: _emailController.text.trim(),
        );
        if (!mounted) return;
        setState(() {
          _resetRequested = true;
          _successMessage = 'If an account exists for that email, a password reset email will be sent. Paste the reset link or token below.';
        });
      } else {
        if (_passwordController.text != _confirmPasswordController.text) {
          setState(() => _errorMessage = 'Passwords do not match');
          return;
        }
        await widget.authService.resetPassword(
          token: _tokenController.text,
          password: _passwordController.text,
        );
        if (!mounted) return;
        setState(() {
          _successMessage = 'Password reset. You can now sign in.';
        });
        await Future<void>.delayed(const Duration(milliseconds: 900));
        if (mounted) Navigator.of(context).pop();
      }
    } on AuthException catch (error) {
      if (!mounted) return;
      setState(() => _errorMessage = error.message);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Reset password')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const _BrandMark(),
                    const SizedBox(height: 28),
                    Text(
                      _resetRequested
                          ? 'Choose a new password'
                          : 'Forgot your password?',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _resetRequested
                          ? 'Paste the reset link or token from your email, then choose a new password.'
                          : 'Enter your account email and we will send a reset link if it matches an account.',
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (_successMessage != null) ...[
                      _MessageBanner(
                        message: _successMessage!,
                        isSuccess: true,
                      ),
                      const SizedBox(height: 16),
                    ],
                    if (_errorMessage != null) ...[
                      _MessageBanner(message: _errorMessage!, isSuccess: false),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      controller: _emailController,
                      validator: _validateEmail,
                      readOnly: _resetRequested,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        prefixIcon: Icon(Icons.mail_outline),
                      ),
                    ),
                    if (_resetRequested) ...[
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _tokenController,
                        validator: (value) =>
                            value == null || value.trim().isEmpty
                            ? 'Paste the reset link or token from your email'
                            : null,
                        keyboardType: TextInputType.url,
                        decoration: const InputDecoration(
                          labelText: 'Reset link or token',
                          prefixIcon: Icon(Icons.link),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _passwordController,
                        validator: _validatePassword,
                        obscureText: true,
                        autofillHints: const [AutofillHints.newPassword],
                        decoration: const InputDecoration(
                          labelText: 'New password',
                          prefixIcon: Icon(Icons.lock_outline),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _confirmPasswordController,
                        validator: (value) => value != _passwordController.text
                            ? 'Passwords do not match'
                            : null,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Confirm new password',
                          prefixIcon: Icon(Icons.lock_outline),
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _isSubmitting ? null : _submit,
                      child: _isSubmitting
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(
                              _resetRequested
                                  ? 'Reset password'
                                  : 'Send reset email',
                            ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class EmailVerificationScreen extends StatefulWidget {
  const EmailVerificationScreen({super.key, required this.authService});

  final AuthService authService;

  @override
  State<EmailVerificationScreen> createState() =>
      _EmailVerificationScreenState();
}

class _EmailVerificationScreenState extends State<EmailVerificationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _tokenController = TextEditingController();
  bool _isSubmitting = false;
  String? _errorMessage;
  String? _successMessage;

  @override
  void dispose() {
    _tokenController.dispose();
    super.dispose();
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
      await widget.authService.verifyEmail(token: _tokenController.text);
      if (!mounted) return;
      setState(() {
        _successMessage = 'Email verified. You can now sign in.';
      });
    } on AuthException catch (error) {
      if (!mounted) return;
      setState(() => _errorMessage = error.message);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verify email')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const _BrandMark(),
                    const SizedBox(height: 28),
                    Text(
                      'Verify your email',
                      style: Theme.of(context).textTheme.headlineSmall
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Paste the verification link or token from your email.',
                    ),
                    const SizedBox(height: 24),
                    if (_successMessage != null) ...[
                      _MessageBanner(
                        message: _successMessage!,
                        isSuccess: true,
                      ),
                      const SizedBox(height: 16),
                    ],
                    if (_errorMessage != null) ...[
                      _MessageBanner(message: _errorMessage!, isSuccess: false),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      controller: _tokenController,
                      validator: (value) =>
                          value == null || value.trim().isEmpty
                          ? 'Paste the verification link or token from your email'
                          : null,
                      keyboardType: TextInputType.url,
                      decoration: const InputDecoration(
                        labelText: 'Verification link or token',
                        prefixIcon: Icon(Icons.link),
                      ),
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _isSubmitting ? null : _submit,
                      child: _isSubmitting
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Verify email'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
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
