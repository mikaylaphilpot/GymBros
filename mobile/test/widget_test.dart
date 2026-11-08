//AI-assisted: Initial implementation suggested by Copilot (reviewed and modified)
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

  testWidgets('signed-in users can open the translated profile page', (
    tester,
  ) async {
    final authService = AuthService(
      tokenStore: _MemoryTokenStore(),
      client: MockClient((request) async {
        if (request.url.path.endsWith('/login')) {
          return http.Response(jsonEncode({'token': 'signed.jwt.token'}), 200);
        }
        return http.Response(
          jsonEncode({
            'id': 'user-id',
            'username': 'gymbro',
            'email': 'gymbro@example.com',
          }),
          200,
        );
      }),
    );
    await tester.pumpWidget(GymBrosApp(authService: authService));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField).at(0), 'gymbro');
    await tester.enterText(find.byType(TextFormField).at(1), 'Password1!');
    await tester.tap(find.text('Sign in'));
    await tester.pumpAndSettle();

    expect(find.text('Tuesday: 12:00pm - 1:00pm, Swim'), findsOneWidget);
    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();

    expect(find.text('Workout Schedule'), findsOneWidget);
  });
}
