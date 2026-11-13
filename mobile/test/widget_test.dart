import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/auth/auth_service.dart';
import 'package:mobile/main.dart';

class _MemoryTokenStore implements TokenStore {
  String? token;

  @override
  Future<void> delete() async {
    token = null;
  }

  @override
  Future<String?> read() async => token;

  @override
  Future<void> write(String value) async {
    token = value;
  }
}

void main() {
  testWidgets('shows sign in and opens the sign-up form', (tester) async {
    await tester.pumpWidget(
      GymBrosApp(
        authService: AuthService(
          tokenStore: _MemoryTokenStore(),
          client: MockClient((_) async => http.Response('{}', 200)),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.text('Sign in'), findsOneWidget);

    await tester.ensureVisible(find.text("Don't have an account? Sign up"));
    await tester.tap(find.text("Don't have an account? Sign up"));
    await tester.pumpAndSettle();

    expect(find.text('Create your account'), findsOneWidget);
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Confirm password'), findsOneWidget);
  });

  testWidgets('sign-up success prompts for email verification', (tester) async {
    var requestPath = '';
    final service = AuthService(
      tokenStore: _MemoryTokenStore(),
      client: MockClient((request) async {
        requestPath = request.url.path;
        return http.Response(
          jsonEncode({'message': 'User signed up successfully!'}),
          201,
          headers: {'content-type': 'application/json'},
        );
      }),
    );
    await tester.pumpWidget(GymBrosApp(authService: service));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text("Don't have an account? Sign up"));
    await tester.tap(find.text("Don't have an account? Sign up"));
    await tester.pumpAndSettle();

    final fields = find.byType(TextFormField);
    await tester.enterText(fields.at(0), 'gymbro');
    await tester.enterText(fields.at(1), 'gymbro@example.com');
    await tester.enterText(fields.at(2), 'Password1!');
    await tester.enterText(fields.at(3), 'Password1!');
    await tester.tap(find.text('Create account'));
    await tester.pumpAndSettle();

    expect(requestPath, '/api/auth/signup');
    expect(
      find.textContaining('Check your email to verify it'),
      findsOneWidget,
    );
    expect(find.text('Welcome back'), findsOneWidget);
  });

  testWidgets('requests and completes a password reset from the app', (
    tester,
  ) async {
    final requests = <http.Request>[];
    final service = AuthService(
      tokenStore: _MemoryTokenStore(),
      client: MockClient((request) async {
        requests.add(request);
        return http.Response(
          jsonEncode({'message': 'Password reset was successful'}),
          200,
          headers: {'content-type': 'application/json'},
        );
      }),
    );
    await tester.pumpWidget(GymBrosApp(authService: service));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Forgot password?'));
    await tester.tap(find.text('Forgot password?'));
    await tester.pumpAndSettle();

    await tester.enterText(
      find.byType(TextFormField).at(0),
      'gymbro@example.com',
    );
    await tester.tap(find.text('Send reset email'));
    await tester.pumpAndSettle();
    expect(find.textContaining('If an account exists'), findsOneWidget);

    await tester.enterText(
      find.byType(TextFormField).at(1),
      'https://example.com/reset?token=reset-token',
    );
    await tester.enterText(find.byType(TextFormField).at(2), 'Password1!');
    await tester.enterText(find.byType(TextFormField).at(3), 'Password1!');
    await tester.tap(find.widgetWithText(FilledButton, 'Reset password'));
    await tester.pumpAndSettle();

    expect(requests, hasLength(2));
    expect(requests[0].url.path, '/api/auth/forgot-password');
    expect(jsonDecode(requests[0].body), {'email': 'gymbro@example.com'});
    expect(requests[1].url.path, '/api/auth/reset-password');
    expect(jsonDecode(requests[1].body), {
      'token': 'reset-token',
      'password': 'Password1!',
    });
    expect(find.text('Welcome back'), findsOneWidget);
  });

  testWidgets('resends a verification email from sign in', (tester) async {
    var requestPath = '';
    final service = AuthService(
      tokenStore: _MemoryTokenStore(),
      client: MockClient((request) async {
        requestPath = request.url.path;
        return http.Response(
          jsonEncode({
            'message': 'If an unverified account exists, email sent.',
          }),
          404,
          headers: {'content-type': 'application/json'},
        );
      }),
    );
    await tester.pumpWidget(GymBrosApp(authService: service));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Resend verification email'));
    await tester.tap(find.text('Resend verification email'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.descendant(
        of: find.byType(AlertDialog),
        matching: find.byType(TextField),
      ),
      'gymbro@example.com',
    );
    await tester.tap(find.text('Send email'));
    await tester.pumpAndSettle();

    expect(requestPath, '/api/auth/resend-verification');
    expect(
      find.textContaining('If an unverified account exists'),
      findsOneWidget,
    );
  });
}
