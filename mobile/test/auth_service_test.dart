import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/auth/auth_service.dart';

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

http.Response _jsonResponse(int status, Map<String, Object?> body) {
  return http.Response(
    jsonEncode(body),
    status,
    headers: {'content-type': 'application/json'},
  );
}

void main() {
  group('AuthService', () {
    test('signs up using the backend request shape', () async {
      late http.Request received;
      final service = AuthService(
        baseUrl: 'http://localhost:5001/api/auth',
        tokenStore: _MemoryTokenStore(),
        client: MockClient((request) async {
          received = request;
          return _jsonResponse(201, {
            'message': 'User signed up successfully!',
          });
        }),
      );

      await service.signUp(
        username: 'gymbro',
        email: 'gymbro@example.com',
        password: 'Password1!',
      );

      expect(received.method, 'POST');
      expect(received.url.path, '/api/auth/signup');
      expect(jsonDecode(received.body), {
        'username': 'gymbro',
        'email': 'gymbro@example.com',
        'password': 'Password1!',
      });
    });

    test('logs in, stores the token, and loads the profile', () async {
      final tokenStore = _MemoryTokenStore();
      final requests = <http.Request>[];
      final service = AuthService(
        baseUrl: 'http://localhost:5001/api/auth/',
        tokenStore: tokenStore,
        client: MockClient((request) async {
          requests.add(request);
          if (request.url.path.endsWith('/login')) {
            return _jsonResponse(200, {'token': 'signed.jwt.token'});
          }
          return _jsonResponse(200, {
            'id': 'user-id',
            'username': 'gymbro',
            'email': 'gymbro@example.com',
          });
        }),
      );

      final user = await service.logIn(
        username: 'gymbro',
        password: 'Password1!',
      );

      expect(user.username, 'gymbro');
      expect(user.email, 'gymbro@example.com');
      expect(tokenStore.token, 'signed.jwt.token');
      expect(requests, hasLength(2));
      expect(requests.first.url.path, '/api/auth/login');
      expect(jsonDecode(requests.first.body), {
        'username': 'gymbro',
        'password': 'Password1!',
      });
      expect(requests.last.url.path, '/api/auth/me');
      expect(requests.last.headers['Authorization'], 'Bearer signed.jwt.token');
    });

    test('surfaces the backend error message', () async {
      final service = AuthService(
        tokenStore: _MemoryTokenStore(),
        client: MockClient(
          (_) async => _jsonResponse(403, {
            'message': 'Please verify your email before logging in.',
          }),
        ),
      );

      await expectLater(
        service.logIn(username: 'gymbro', password: 'Password1!'),
        throwsA(
          isA<AuthException>()
              .having(
                (error) => error.message,
                'message',
                'Please verify your email before logging in.',
              )
              .having((error) => error.statusCode, 'statusCode', 403),
        ),
      );
    });

    test('clears an expired session token', () async {
      final tokenStore = _MemoryTokenStore()..token = 'expired.token';
      final service = AuthService(
        tokenStore: tokenStore,
        client: MockClient(
          (_) async => _jsonResponse(401, {'message': 'Invalid token'}),
        ),
      );

      expect(await service.restoreSession(), isNull);
      expect(tokenStore.token, isNull);
    });
  });
}
