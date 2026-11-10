import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/testing.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/auth/auth_service.dart';
import 'package:mobile/notifications/notification_service.dart';

class _TokenStore implements TokenStore {
  @override
  Future<void> delete() async {}

  @override
  Future<String?> read() async => 'test-token';

  @override
  Future<void> write(String token) async {}
}

void main() {
  test('fetches the authenticated notification inbox', () async {
    late http.Request request;
    final service = NotificationService(
      tokenStore: _TokenStore(),
      baseUrl: 'http://localhost:5001/api/auth/',
      client: MockClient((received) async {
        request = received;
        return http.Response(
          jsonEncode({
            'notifications': [
              {
                'id': 'notification-1',
                'title': 'Welcome',
                'message': 'Time to train!',
                'read': false,
                'createdAt': '2026-11-10T12:00:00.000Z',
              },
            ],
          }),
          200,
        );
      }),
    );

    final notifications = await service.fetchNotifications();

    expect(request.url.path, '/api/notifications/inbox');
    expect(request.headers['authorization'], 'Bearer test-token');
    expect(notifications.single.message, 'Time to train!');
  });
}
