// AI-assisted: Initial Implementation suggested by Copilot
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/testing.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/auth/auth_service.dart';
import 'package:mobile/friends/friends_service.dart';

class _TokenStore implements TokenStore {
  @override
  Future<void> delete() async {}

  @override
  Future<String?> read() async => 'test-token';

  @override
  Future<void> write(String token) async {}
}

void main() {
  test('posts an authenticated add-friend request', () async {
    late http.Request request;
    final service = FriendsService(
      tokenStore: _TokenStore(),
      baseUrl: 'http://localhost:5001/api/auth/',
      client: MockClient((received) async {
        request = received;
        return http.Response(
          jsonEncode({'added': true, 'message': 'Friend added successfully.'}),
          201,
        );
      }),
    );

    final result = await service.addFriend(
      currentUserId: 'current-user-id',
      friendId: 'friend-id',
    );

    expect(request.method, 'POST');
    expect(request.url.path, '/api/users/current-user-id/friends/friend-id');
    expect(request.headers['authorization'], 'Bearer test-token');
    expect(result.added, isTrue);
    expect(result.message, 'Friend added successfully.');
  });

  test('accepts the duplicate-friend response', () async {
    final service = FriendsService(
      tokenStore: _TokenStore(),
      baseUrl: 'http://localhost:5001/api/auth/',
      client: MockClient(
        (_) async => http.Response(
          jsonEncode({'added': false, 'message': 'Friend is already added.'}),
          200,
        ),
      ),
    );

    final result = await service.addFriend(
      currentUserId: 'current-user-id',
      friendId: 'friend-id',
    );

    expect(result.added, isFalse);
    expect(result.message, 'Friend is already added.');
  });

  test('deletes a friend and decodes the result', () async {
    late http.Request request;
    final service = FriendsService(
      tokenStore: _TokenStore(),
      baseUrl: 'http://localhost:5001/api/auth/',
      client: MockClient((received) async {
        request = received;
        return http.Response(
          jsonEncode({
            'deleted': true,
            'message': 'Friend deleted successfully.',
          }),
          200,
        );
      }),
    );

    final result = await service.deleteFriend(
      currentUserId: 'current-user-id',
      friendId: 'friend-id',
    );

    expect(request.method, 'DELETE');
    expect(request.url.path, '/api/users/current-user-id/friends/friend-id');
    expect(request.headers['authorization'], 'Bearer test-token');
    expect(result.deleted, isTrue);
  });

  test(
    'returns a not-in-list result for the structured 404 response',
    () async {
      final service = FriendsService(
        tokenStore: _TokenStore(),
        baseUrl: 'http://localhost:5001/api/auth/',
        client: MockClient(
          (_) async => http.Response(
            jsonEncode({
              'deleted': false,
              'message': "Friend is not in the user's friend list.",
            }),
            404,
          ),
        ),
      );

      final result = await service.deleteFriend(
        currentUserId: 'current-user-id',
        friendId: 'friend-id',
      );

      expect(result.deleted, isFalse);
    },
  );

  test('fetches and decodes friend stats', () async {
    late http.Request request;
    final service = FriendsService(
      tokenStore: _TokenStore(),
      baseUrl: 'http://localhost:5001/api/auth/',
      client: MockClient((received) async {
        request = received;
        return http.Response(
          jsonEncode({
            'otherFriends': [
              {
                'friendId': 'other-id',
                'username': 'OtherBro',
                'streakCount': 3,
                'bugCount': 1,
                'lastBuggedAt': null,
              },
            ],
            'highestStreakFriend': {
              'friendId': 'streak-id',
              'username': 'StreakBro',
              'streakCount': 12,
              'bugCount': 2,
              'lastBuggedAt': '2026-11-09T12:00:00.000Z',
            },
            'mostBuggedFriend': null,
          }),
          200,
        );
      }),
    );

    final stats = await service.fetchStats(currentUserId: 'current-user-id');

    expect(request.url.path, '/api/users/current-user-id/friends/stats');
    expect(request.headers['authorization'], 'Bearer test-token');
    expect(stats.otherFriends.single.username, 'OtherBro');
    expect(stats.highestStreakFriend?.streakCount, 12);
    expect(stats.highestStreakFriend?.lastBuggedAt, isNotNull);
    expect(stats.mostBuggedFriend, isNull);
  });

  test('searches users with an encoded query and decodes the list', () async {
    late http.Request request;
    final service = FriendsService(
      tokenStore: _TokenStore(),
      baseUrl: 'http://localhost:5001/api/auth/',
      client: MockClient((received) async {
        request = received;
        return http.Response(
          jsonEncode([
            {
              '_id': 'user-id',
              'username': 'GymBro',
              'email': 'gym@example.com',
              'isVerified': true,
            },
          ]),
          200,
        );
      }),
    );

    final users = await service.searchUsers('gym bro & friends');

    expect(request.url.path, '/api/users/search');
    expect(request.url.queryParameters['q'], 'gym bro & friends');
    expect(request.headers['authorization'], 'Bearer test-token');
    expect(users.single.id, 'user-id');
    expect(users.single.isVerified, isTrue);
  });
}
