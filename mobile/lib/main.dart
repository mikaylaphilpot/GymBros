import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';

import 'auth/auth_service.dart';
import 'schedule/schedule_screen.dart';
import 'schedule/schedule_service.dart';
import 'pages/login_page.dart';
import 'notifications/notification_service.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  const tokenStore = SecureTokenStore();
  runApp(
    GymBrosApp(
      authService: AuthService(tokenStore: tokenStore),
      notificationService: NotificationService(tokenStore: tokenStore),
    ),
  );
}

class GymBrosApp extends StatefulWidget {
  const GymBrosApp({
    super.key,
    required this.authService,
    this.scheduleService,
    this.notificationService,
  });

  final AuthService authService;
  final ScheduleService? scheduleService;
  final NotificationService? notificationService;

  @override
  State<GymBrosApp> createState() => _GymBrosAppState();
}

class _GymBrosAppState extends State<GymBrosApp> {
  AuthUser? _user;
  String? _restoreError;
  bool _isRestoring = true;
  late final ScheduleService _scheduleService;
  bool _showSignUp = false;

  @override
  void initState() {
    super.initState();
    _scheduleService =
        widget.scheduleService ??
        ScheduleService(tokenStore: widget.authService.tokenStore);
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
      if (user != null) await _registerNotifications();
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
    _registerNotifications();
  }

  Future<void> _logOut() async {
    try {
      await widget.notificationService?.unregisterCurrentDevice();
    } on NotificationException catch (error) {
      debugPrint('Could not unregister notification token: $error');
    }
    await widget.authService.logOut();
    if (!mounted) return;
    setState(() => _user = null);
  }

  Future<void> _registerNotifications() async {
    try {
      await widget.notificationService?.registerCurrentDevice();
    } on NotificationException catch (error) {
      debugPrint('Could not register notification token: $error');
    }
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
          seedColor: const Color(0xFFB31517),
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: const Color(0xFFE9E4DF),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFFD9D9D9),
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
                    onForgotPassword: (context) =>
                        Navigator.of(context).push<void>(
                          MaterialPageRoute<void>(
                            builder: (_) => ForgotPasswordScreen(
                              authService: widget.authService,
                            ),
                          ),
                        ),
                    onVerifyEmail: (context) =>
                        Navigator.of(context).push<void>(
                          MaterialPageRoute<void>(
                            builder: (_) => EmailVerificationScreen(
                              authService: widget.authService,
                            ),
                          ),
                        ),
                  )
          : ScheduleScreen(
              username: _user!.username,
              scheduleService: _scheduleService,
              onLogOut: _logOut,
              notificationService: widget.notificationService,
            ),
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
