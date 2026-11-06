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

    expect(find.text('Welcome Back Bro!'), findsOneWidget);
    expect(find.text('Sign In'), findsOneWidget);

    await tester.tap(find.text('Not a Bro? Create Account'));
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
    await tester.tap(find.text('Not a Bro? Create Account'));
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
    expect(find.text('Welcome Back Bro!'), findsOneWidget);
  });
}
