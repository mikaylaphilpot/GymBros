//AI-assisted: Initial implementation suggested by Copilot (reviewed and modified)
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/auth/auth_service.dart';
import 'package:mobile/friends/friends_service.dart';
import 'package:mobile/main.dart';
import 'package:mobile/schedules/schedule_service.dart';
import 'package:mobile/screens/app_screens.dart';

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

ScheduleService _emptyScheduleService(TokenStore tokenStore) => ScheduleService(
  tokenStore: tokenStore,
  baseUrl: 'http://localhost:5001/api/auth/',
  client: MockClient((_) async => http.Response('[]', 200)),
);

FriendsService _emptyFriendsService(TokenStore tokenStore) => FriendsService(
  tokenStore: tokenStore,
  baseUrl: 'http://localhost:5001/api/auth/',
  client: MockClient(
    (request) async => http.Response(
      request.url.path.endsWith('/friends/workouts/today')
          ? '[]'
          : jsonEncode({
              'otherFriends': [],
              'highestStreakFriend': null,
              'mostBuggedFriend': null,
            }),
      200,
    ),
  ),
);

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

  testWidgets('signed-in users can open the translated profile page', (
    tester,
  ) async {
    final tokenStore = _MemoryTokenStore();
    final authService = AuthService(
      tokenStore: tokenStore,
      client: MockClient((request) async {
        if (request.url.path.endsWith('/login')) {
          return http.Response(jsonEncode({'token': 'signed.jwt.token'}), 200);
        }
        return http.Response(
          jsonEncode({
            'id': 'user-id',
            'name': 'Gym Bro',
            'username': 'gymbro',
            'email': 'gymbro@example.com',
          }),
          200,
        );
      }),
    );
    await tester.pumpWidget(
      GymBrosApp(
        authService: authService,
        scheduleService: _emptyScheduleService(tokenStore),
        friendsService: _emptyFriendsService(tokenStore),
      ),
    );
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField).at(0), 'gymbro');
    await tester.enterText(find.byType(TextFormField).at(1), 'Password1!');
    await tester.tap(find.text('Sign In'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();

    expect(find.text('Workout Schedule'), findsOneWidget);
    expect(find.text('No workouts scheduled yet.'), findsOneWidget);
  });

  testWidgets('home shows friend workout status cards and correct actions', (
    tester,
  ) async {
    final tokenStore = _MemoryTokenStore()..token = 'test-token';
    final requests = <http.Request>[];
    final friendsService = FriendsService(
      tokenStore: tokenStore,
      baseUrl: 'http://localhost:5001/api/auth/',
      client: MockClient((request) async {
        requests.add(request);
        if (request.url.path.endsWith('/friends/workouts/today')) {
          return http.Response(
            jsonEncode([
              {
                'friendId': 'bro-id',
                'username': 'WorkoutBro',
                'streakCount': 3,
                'bugCount': 1,
                'lastBuggedAt': null,
                'workouts': [
                  {
                    'scheduleId': 'overdue-id',
                    'activity': 'Past workout',
                    'startTime': '11:00 PM',
                    'endTime': '12:00 AM',
                    'isCompletedToday': false,
                  },
                  {
                    'scheduleId': 'upcoming-id',
                    'activity': 'Future workout',
                    'startTime': '10:00 PM',
                    'endTime': '11:59 PM',
                    'isCompletedToday': false,
                  },
                  {
                    'scheduleId': 'completed-id',
                    'activity': 'Finished workout',
                    'startTime': '11:00 PM',
                    'endTime': '12:00 AM',
                    'isCompletedToday': true,
                  },
                ],
              },
            ]),
            200,
          );
        }
        if (request.method == 'POST') {
          return http.Response(jsonEncode({'notification': {}}), 201);
        }
        return http.Response('{}', 404);
      }),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: HomeScreen(
          user: const AuthUser(
            id: 'current-user',
            name: 'John Gymborough',
            username: 'Jymbro20',
            email: 'current@example.com',
          ),
          onLogOut: () {},
          friendsService: friendsService,
          scheduleService: _emptyScheduleService(tokenStore),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining('Past workout'), findsOneWidget);
    expect(find.textContaining('Future workout'), findsOneWidget);
    expect(find.textContaining('Finished workout'), findsOneWidget);
    expect(
      find.byWidgetPredicate(
        (widget) => widget is Card && widget.color == const Color(0xFFFF9294),
      ),
      findsOneWidget,
    );
    expect(
      find.byWidgetPredicate(
        (widget) => widget is Card && widget.color == const Color(0xFFFFF2B2),
      ),
      findsOneWidget,
    );
    expect(
      find.byWidgetPredicate(
        (widget) => widget is Card && widget.color == const Color(0xFFC7F4AA),
      ),
      findsOneWidget,
    );
    expect(find.byTooltip('Bug WorkoutBro'), findsNWidgets(2));
    expect(find.byTooltip('Congratulate WorkoutBro'), findsOneWidget);

    await tester.tap(find.byTooltip('Bug WorkoutBro').first);
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Congratulate WorkoutBro'));
    await tester.pumpAndSettle();

    expect(
      requests.any(
        (request) =>
            request.method == 'POST' &&
            request.url.path.endsWith('/friends/bro-id/bug'),
      ),
      isTrue,
    );
    expect(
      requests.any(
        (request) =>
            request.method == 'POST' &&
            request.url.path.endsWith('/friends/bro-id/congratulate'),
      ),
      isTrue,
    );
  });

  testWidgets('search results show friend status and add searched users', (
    tester,
  ) async {
    final requests = <http.Request>[];
    final tokenStore = _MemoryTokenStore()..token = 'test-token';
    var friendAdded = false;
    var friendDeleted = false;
    final friendsService = FriendsService(
      tokenStore: tokenStore,
      baseUrl: 'http://localhost:5001/api/auth/',
      client: MockClient((request) async {
        requests.add(request);
        if (request.url.path.endsWith('/friends/stats')) {
          return http.Response(
            jsonEncode({
              'otherFriends': [
                if (!friendDeleted)
                  {
                    'friendId': 'existing-friend',
                    'username': 'AlreadyBro',
                    'streakCount': 0,
                    'bugCount': 0,
                    'lastBuggedAt': null,
                  },
                for (final friend in [
                  ('friend-two', 'BroTwo'),
                  ('friend-three', 'BroThree'),
                  ('friend-four', 'BroFour'),
                ])
                  {
                    'friendId': friend.$1,
                    'username': friend.$2,
                    'streakCount': 4,
                    'bugCount': 2,
                    'lastBuggedAt': null,
                  },
                if (friendAdded)
                  {
                    'friendId': 'new-friend',
                    'username': 'NewBro',
                    'streakCount': 1,
                    'bugCount': 0,
                    'lastBuggedAt': null,
                  },
              ],
              'highestStreakFriend': {
                'friendId': 'streak-friend',
                'username': 'StreakBro',
                'streakCount': 7,
                'bugCount': 1,
                'lastBuggedAt': null,
              },
              'mostBuggedFriend': {
                'friendId': 'bugged-friend',
                'username': 'BestBro',
                'streakCount': 2,
                'bugCount': 5,
                'lastBuggedAt': null,
              },
            }),
            200,
          );
        }
        if (request.url.path.endsWith('/search')) {
          final query = request.url.queryParameters['q']!.toLowerCase();
          final users = [
            {
              '_id': 'existing-friend',
              'username': 'AlreadyBro',
              'email': 'already@example.com',
              'isVerified': true,
            },
            {
              '_id': 'new-friend',
              'username': 'NewBro',
              'email': 'new@example.com',
              'isVerified': true,
            },
            {
              '_id': 'friend-two',
              'username': 'BroTwo',
              'email': 'two@example.com',
              'isVerified': true,
            },
            {
              '_id': 'friend-three',
              'username': 'BroThree',
              'email': 'three@example.com',
              'isVerified': true,
            },
            {
              '_id': 'friend-four',
              'username': 'BroFour',
              'email': 'four@example.com',
              'isVerified': true,
            },
          ];
          return http.Response(
            jsonEncode(
              users
                  .where(
                    (user) => (user['username'] as String)
                        .toLowerCase()
                        .contains(query),
                  )
                  .toList(),
            ),
            200,
          );
        }
        if (request.method == 'POST') {
          if (request.url.path.endsWith('/friends/new-friend')) {
            friendAdded = true;
          }
          return http.Response(
            jsonEncode({
              'added': true,
              'message': 'Friend added successfully.',
            }),
            201,
          );
        }
        if (request.method == 'DELETE') {
          friendDeleted = true;
          return http.Response(
            jsonEncode({
              'deleted': true,
              'message': 'Friend deleted successfully.',
            }),
            200,
          );
        }
        return http.Response('{}', 404);
      }),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: HomeScreen(
          user: const AuthUser(
            id: 'current-user',
            username: 'CurrentBro',
            email: 'current@example.com',
          ),
          onLogOut: () {},
          friendsService: friendsService,
          scheduleService: _emptyScheduleService(tokenStore),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byType(NavigationDestination).at(1));
    await tester.pumpAndSettle();
    expect(find.text('Add Bros'), findsOneWidget);
    expect(find.text('Best Bro'), findsOneWidget);
    expect(find.text('BestBro'), findsOneWidget);
    expect(find.text('2 day streak · 5 bugs'), findsOneWidget);
    expect(find.text('Streak Bro'), findsOneWidget);
    expect(find.text('StreakBro'), findsOneWidget);
    expect(find.text('7 day streak · 1 bugs'), findsOneWidget);
    expect(find.text('Regular Bros'), findsOneWidget);
    expect(find.text('AlreadyBro'), findsOneWidget);

    await tester.tap(find.byTooltip('Bug BestBro'));
    await tester.pumpAndSettle();
    expect(
      requests.any(
        (request) =>
            request.method == 'POST' &&
            request.url.path.endsWith('/friends/bugged-friend/bug'),
      ),
      isTrue,
    );

    final searchField = find.byType(TextField).first;
    for (final query in ['B', 'Br', 'Bro']) {
      await tester.enterText(searchField, query);
      await tester.pumpAndSettle();
    }

    expect(find.text('AlreadyBro'), findsOneWidget);
    expect(find.text('already@example.com'), findsOneWidget);
    expect(find.text('0 day streak · 0 bugs'), findsOneWidget);
    expect(find.text('NewBro'), findsNothing);
    expect(find.text('BroTwo'), findsOneWidget);
    expect(find.text('BroThree'), findsOneWidget);
    expect(find.text('BroFour'), findsNothing);
    expect(find.byIcon(Icons.add), findsNothing);
    expect(find.byTooltip('Bug AlreadyBro'), findsOneWidget);
    expect(find.byTooltip('Bro options'), findsNWidgets(3));

    await tester.tap(find.byTooltip('Bug AlreadyBro'));
    await tester.pumpAndSettle();
    expect(
      requests.any(
        (request) =>
            request.method == 'POST' &&
            request.url.path.endsWith('/friends/existing-friend/bug'),
      ),
      isTrue,
    );

    await tester.tap(find.byTooltip('Bro options').first);
    await tester.pumpAndSettle();
    expect(find.text('Delete Bro'), findsOneWidget);
    await tester.tap(find.text('Delete Bro'));
    await tester.pumpAndSettle();
    expect(find.text('AlreadyBro'), findsNothing);
    expect(
      requests.any(
        (request) =>
            request.method == 'DELETE' &&
            request.url.path.endsWith(
              '/users/current-user/friends/existing-friend',
            ),
      ),
      isTrue,
    );

    final searchQueries = requests
        .where((request) => request.url.path.endsWith('/search'))
        .map((request) => request.url.queryParameters['q'])
        .toList();
    expect(searchQueries, ['B', 'Br', 'Bro']);
    await tester.tap(find.text('Add Bros'));
    await tester.pumpAndSettle();
    final addSearchField = find.byType(TextField).last;
    await tester.enterText(addSearchField, 'New');
    await tester.pumpAndSettle();

    final addDialog = find.byType(AlertDialog);
    expect(
      find.descendant(of: addDialog, matching: find.text('NewBro')),
      findsOneWidget,
    );
    expect(
      find.descendant(of: addDialog, matching: find.text('AlreadyBro')),
      findsNothing,
    );
    expect(
      find.descendant(of: addDialog, matching: find.text('BroTwo')),
      findsNothing,
    );
    expect(find.byTooltip('Add NewBro'), findsOneWidget);

    await tester.tap(find.byTooltip('Add NewBro'));
    await tester.pumpAndSettle();

    expect(
      find.descendant(of: addDialog, matching: find.text('NewBro')),
      findsNothing,
    );

    expect(
      requests.any(
        (request) =>
            request.method == 'POST' &&
            request.url.path.endsWith('/users/current-user/friends/new-friend'),
      ),
      isTrue,
    );
    await tester.tap(find.text('Close'));
    await tester.pumpAndSettle();
    expect(find.text('NewBro'), findsOneWidget);
    expect(find.byIcon(Icons.add), findsNothing);
  });

  testWidgets('deletes a friend from the overflow menu', (tester) async {
    final requests = <http.Request>[];
    final tokenStore = _MemoryTokenStore()..token = 'test-token';
    var friendDeleted = false;
    final friendsService = FriendsService(
      tokenStore: tokenStore,
      baseUrl: 'http://localhost:5001/api/auth/',
      client: MockClient((request) async {
        requests.add(request);
        if (request.url.path.endsWith('/friends/stats')) {
          return http.Response(
            jsonEncode({
              'otherFriends': [],
              'highestStreakFriend': null,
              'mostBuggedFriend': friendDeleted
                  ? null
                  : {
                      'friendId': 'best-friend',
                      'username': 'BestBro',
                      'streakCount': 2,
                      'bugCount': 5,
                      'lastBuggedAt': null,
                    },
            }),
            200,
          );
        }
        if (request.method == 'DELETE') {
          friendDeleted = true;
          return http.Response(
            jsonEncode({'deleted': true, 'message': 'Friend deleted.'}),
            200,
          );
        }
        return http.Response('{}', 404);
      }),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: HomeScreen(
          user: const AuthUser(
            id: 'current-user',
            username: 'CurrentBro',
            email: 'current@example.com',
          ),
          onLogOut: () {},
          friendsService: friendsService,
          scheduleService: _emptyScheduleService(tokenStore),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byType(NavigationDestination).at(1));
    await tester.pumpAndSettle();

    expect(find.text('BestBro'), findsOneWidget);
    await tester.tap(find.byTooltip('Bro options').first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Delete Bro'));
    await tester.pumpAndSettle();

    expect(
      requests.any(
        (request) =>
            request.method == 'DELETE' &&
            request.url.path.endsWith(
              '/users/current-user/friends/best-friend',
            ),
      ),
      isTrue,
    );
    expect(find.text('BestBro'), findsNothing);
    expect(find.text('No best bro yet.'), findsOneWidget);
  });

  testWidgets('profile loads and saves current profile and schedule data', (
    tester,
  ) async {
    final tokenStore = _MemoryTokenStore()..token = 'test-token';
    final profileRequests = <http.Request>[];
    final scheduleRequests = <http.Request>[];
    final today = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ][DateTime.now().weekday - 1];
    var activity = 'Tennis';

    final authService = AuthService(
      tokenStore: tokenStore,
      baseUrl: 'http://localhost:5001/api/auth/',
      client: MockClient((request) async {
        profileRequests.add(request);
        final body = jsonDecode(request.body) as Map<String, dynamic>;
        return http.Response(
          jsonEncode({
            'message': 'Profile updated successfully.',
            'user': {
              'id': 'current-user',
              'name': body['name'],
              'username': body['username'],
              'email': 'current@example.com',
            },
          }),
          200,
        );
      }),
    );
    final scheduleService = ScheduleService(
      tokenStore: tokenStore,
      baseUrl: 'http://localhost:5001/api/auth/',
      client: MockClient((request) async {
        scheduleRequests.add(request);
        if (request.method == 'GET') {
          return http.Response(
            jsonEncode([
              {
                '_id': 'schedule-id',
                'dayOfWeek': today,
                'startTime': '9:00 AM',
                'endTime': '10:00 AM',
                'activity': activity,
                'isCompletedToday': false,
              },
            ]),
            200,
          );
        }
        if (request.method == 'PATCH') {
          final body = jsonDecode(request.body) as Map<String, dynamic>;
          activity = body['activity'] as String;
          return http.Response(
            jsonEncode({
              '_id': 'schedule-id',
              ...body,
              'isCompletedToday': false,
            }),
            200,
          );
        }
        return http.Response('{}', 404);
      }),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: HomeScreen(
          user: const AuthUser(
            id: 'current-user',
            name: 'John Gymborough',
            username: 'Jymbro20',
            email: 'current@example.com',
          ),
          onLogOut: () {},
          friendsService: FriendsService(
            tokenStore: tokenStore,
            baseUrl: 'http://localhost:5001/api/auth/',
            client: MockClient((_) async => http.Response('{}', 404)),
          ),
          authService: authService,
          scheduleService: scheduleService,
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('9:00 AM - 10:00 AM, Tennis'), findsOneWidget);
    await tester.tap(find.byType(NavigationDestination).at(2));
    await tester.pumpAndSettle();

    expect(find.text('Name: John Gymborough'), findsOneWidget);
    expect(find.text('$today: 9:00 AM - 10:00 AM, Tennis'), findsOneWidget);

    await tester.tap(find.widgetWithText(TextButton, 'Edit').first);
    await tester.pumpAndSettle();
    expect(
      Theme.of(tester.element(find.byType(TextFormField).first))
          .inputDecorationTheme
          .fillColor,
      const Color(0xFFD9D9D9),
    );
    await tester.enterText(find.byType(TextFormField).at(2), 'Swimming');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(
      scheduleRequests.any(
        (request) =>
            request.method == 'PATCH' &&
            request.url.path.endsWith('/schedules/schedule-id'),
      ),
      isTrue,
    );
    expect(find.text('$today: 9:00 AM - 10:00 AM, Swimming'), findsOneWidget);

    await tester.tap(find.byType(NavigationDestination).at(0));
    await tester.pumpAndSettle();
    expect(find.text('9:00 AM - 10:00 AM, Swimming'), findsOneWidget);
    expect(
      scheduleRequests.where((request) => request.method == 'GET').length,
      4,
    );

    await tester.tap(find.byType(NavigationDestination).at(2));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('User Information'));
    await tester.tap(find.widgetWithText(TextButton, 'Edit').last);
    await tester.pumpAndSettle();
    expect(
      Theme.of(tester.element(find.byType(TextFormField).first))
          .inputDecorationTheme
          .fillColor,
      const Color(0xFFD9D9D9),
    );
    await tester.enterText(find.byType(TextFormField).at(0), 'Jane Gymbro');
    await tester.enterText(find.byType(TextFormField).at(2), 'Password1!');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(profileRequests.single.url.path, '/api/auth/me');
    expect(profileRequests.single.method, 'PATCH');
    expect(find.text('Name: Jane Gymbro'), findsOneWidget);
  });
}
