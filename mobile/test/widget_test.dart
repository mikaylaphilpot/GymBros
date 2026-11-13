import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/auth/auth_service.dart';
import 'package:mobile/main.dart';
import 'package:mobile/schedule/schedule_service.dart';

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

    await tester.ensureVisible(find.text('Not a Bro? Create Account'));
    await tester.tap(find.text('Not a Bro? Create Account'));
    await tester.pumpAndSettle();

    expect(find.text('Become a Bro!'), findsOneWidget);
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
    await tester.ensureVisible(find.text('Not a Bro? Create Account'));
    await tester.tap(find.text('Not a Bro? Create Account'));
    await tester.pumpAndSettle();

    final fields = find.byType(TextFormField);
    await tester.enterText(fields.at(0), 'gymbro');
    await tester.enterText(fields.at(1), 'gymbro@example.com');
    await tester.enterText(fields.at(2), 'Password1!');
    await tester.enterText(fields.at(3), 'Password1!');
    await tester.tap(find.text('Sign Up'));
    await tester.pumpAndSettle();

    expect(requestPath, '/api/auth/signup');
    expect(
      find.textContaining('Check your email to verify it'),
      findsOneWidget,
    );
    expect(find.text('Welcome Back Bro!'), findsOneWidget);
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
    await tester.ensureVisible(
      find.widgetWithText(FilledButton, 'Reset password'),
    );
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
    expect(find.text('Welcome Back Bro!'), findsOneWidget);
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
    await tester.ensureVisible(
      find.textContaining('If an unverified account exists'),
    );

    expect(requestPath, '/api/auth/resend-verification');
    expect(
      find.textContaining('If an unverified account exists'),
      findsOneWidget,
    );
  });

  testWidgets('shows the signed-in workout schedule', (tester) async {
    final tokenStore = _MemoryTokenStore();
    final authService = AuthService(
      tokenStore: tokenStore,
      client: MockClient((request) async {
        if (request.url.path.endsWith('/login')) {
          return http.Response(
            jsonEncode({'token': 'signed.jwt.token'}),
            200,
            headers: {'content-type': 'application/json'},
          );
        }
        return http.Response(
          jsonEncode({
            'id': 'user-id',
            'username': 'gymbro',
            'email': 'gymbro@example.com',
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }),
    );
    final scheduleService = ScheduleService(
      tokenStore: tokenStore,
      client: MockClient(
        (_) async => http.Response(
          jsonEncode([
            {
              '_id': 'schedule-id',
              'dayOfWeek': 'Monday',
              'startTime': '6:00 PM',
              'endTime': '7:00 PM',
              'activity': 'Strength training',
              'isCompletedToday': false,
            },
          ]),
          200,
          headers: {'content-type': 'application/json'},
        ),
      ),
    );
    await tester.pumpWidget(
      GymBrosApp(authService: authService, scheduleService: scheduleService),
    );
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField).at(0), 'gymbro');
    await tester.enterText(find.byType(TextFormField).at(1), 'Password1!');
    await tester.tap(find.text('Sign In'));
    await tester.pumpAndSettle();

    expect(find.text('My schedule'), findsOneWidget);
    expect(find.text('Strength training'), findsOneWidget);
    expect(find.textContaining('Monday'), findsOneWidget);
  });
}
