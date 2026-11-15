import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../auth/auth_service.dart';
import '../config/app_config.dart';

class AddFriendResult {
  const AddFriendResult({required this.added, required this.message});

  final bool added;
  final String message;

  factory AddFriendResult.fromJson(Map<String, dynamic> json) {
    final added = json['added'];
    final message = json['message'];
    if (added is! bool || message is! String) {
      throw const FriendsException('The server returned an invalid response.');
    }
    return AddFriendResult(added: added, message: message);
  }
}

class DeleteFriendResult {
  const DeleteFriendResult({required this.deleted, required this.message});

  final bool deleted;
  final String message;

  factory DeleteFriendResult.fromJson(Map<String, dynamic> json) {
    final deleted = json['deleted'];
    final message = json['message'];
    if (deleted is! bool || message is! String) {
      throw const FriendsException('The server returned an invalid response.');
    }
    return DeleteFriendResult(deleted: deleted, message: message);
  }
}

class FriendDetails {
  const FriendDetails({
    required this.friendId,
    required this.username,
    required this.streakCount,
    required this.bugCount,
    required this.lastBuggedAt,
  });

  final String friendId;
  final String username;
  final int streakCount;
  final int bugCount;
  final DateTime? lastBuggedAt;

  factory FriendDetails.fromJson(Map<String, dynamic> json) {
    final friendId = json['friendId'];
    final username = json['username'];
    final streakCount = json['streakCount'];
    final bugCount = json['bugCount'];
    final lastBuggedAt = json['lastBuggedAt'];
    if (friendId is! String ||
        username is! String ||
        streakCount is! int ||
        bugCount is! int ||
        (lastBuggedAt != null && lastBuggedAt is! String)) {
      throw const FriendsException('The server returned an invalid friend.');
    }
    return FriendDetails(
      friendId: friendId,
      username: username,
      streakCount: streakCount,
      bugCount: bugCount,
      lastBuggedAt: lastBuggedAt == null
          ? null
          : DateTime.tryParse(lastBuggedAt as String),
    );
  }
}

class FriendsStats {
  const FriendsStats({
    required this.otherFriends,
    required this.highestStreakFriend,
    required this.mostBuggedFriend,
  });

  final List<FriendDetails> otherFriends;
  final FriendDetails? highestStreakFriend;
  final FriendDetails? mostBuggedFriend;

  factory FriendsStats.fromJson(Map<String, dynamic> json) {
    final otherFriends = json['otherFriends'];
    if (otherFriends is! List) {
      throw const FriendsException('The server returned invalid friend stats.');
    }
    return FriendsStats(
      otherFriends: otherFriends
          .map((friend) => FriendDetails.fromJson(_asJsonMap(friend)))
          .toList(),
      highestStreakFriend: _optionalFriend(json['highestStreakFriend']),
      mostBuggedFriend: _optionalFriend(json['mostBuggedFriend']),
    );
  }
}

class FriendWorkout {
  const FriendWorkout({
    required this.friendId,
    required this.username,
    required this.streakCount,
    required this.bugCount,
    required this.lastBuggedAt,
    required this.workouts,
  });

  final String friendId;
  final String username;
  final int streakCount;
  final int bugCount;
  final DateTime? lastBuggedAt;
  final List<FriendWorkoutItem> workouts;

  factory FriendWorkout.fromJson(Map<String, dynamic> json) {
    final friendId = json['friendId'];
    final username = json['username'];
    final streakCount = json['streakCount'];
    final bugCount = json['bugCount'];
    final lastBuggedAt = json['lastBuggedAt'];
    final workouts = json['workouts'];
    if (friendId is! String ||
        username is! String ||
        streakCount is! int ||
        bugCount is! int ||
        (lastBuggedAt != null && lastBuggedAt is! String) ||
        workouts is! List) {
      throw const FriendsException(
        'The server returned invalid friend workout data.',
      );
    }
    return FriendWorkout(
      friendId: friendId,
      username: username,
      streakCount: streakCount,
      bugCount: bugCount,
      lastBuggedAt: lastBuggedAt == null
          ? null
          : DateTime.tryParse(lastBuggedAt as String),
      workouts: workouts
          .map((workout) => FriendWorkoutItem.fromJson(_asJsonMap(workout)))
          .toList(),
    );
  }
}

class FriendWorkoutItem {
  const FriendWorkoutItem({
    required this.scheduleId,
    required this.activity,
    required this.startTime,
    required this.endTime,
    required this.isCompletedToday,
  });

  final String scheduleId;
  final String activity;
  final String startTime;
  final String endTime;
  final bool isCompletedToday;

  factory FriendWorkoutItem.fromJson(Map<String, dynamic> json) {
    final scheduleId = json['scheduleId'];
    final activity = json['activity'];
    final startTime = json['startTime'];
    final endTime = json['endTime'];
    final isCompletedToday = json['isCompletedToday'];
    if (scheduleId is! String ||
        activity is! String ||
        startTime is! String ||
        endTime is! String ||
        isCompletedToday is! bool) {
      throw const FriendsException(
        'The server returned invalid friend workout data.',
      );
    }
    return FriendWorkoutItem(
      scheduleId: scheduleId,
      activity: activity,
      startTime: startTime,
      endTime: endTime,
      isCompletedToday: isCompletedToday,
    );
  }
}

class SearchUser {
  const SearchUser({
    required this.id,
    required this.username,
    required this.email,
    required this.isVerified,
  });

  final String id;
  final String username;
  final String email;
  final bool isVerified;

  factory SearchUser.fromJson(Map<String, dynamic> json) {
    final id = json['_id'];
    final username = json['username'];
    final email = json['email'];
    final isVerified = json['isVerified'];
    if (id is! String ||
        username is! String ||
        email is! String ||
        isVerified is! bool) {
      throw const FriendsException('The server returned an invalid user.');
    }
    return SearchUser(
      id: id,
      username: username,
      email: email,
      isVerified: isVerified,
    );
  }
}

class FriendsException implements Exception {
  const FriendsException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

Map<String, dynamic> _asJsonMap(Object? value) {
  if (value is Map<String, dynamic>) return value;
  throw const FriendsException('The server returned an invalid response.');
}

FriendDetails? _optionalFriend(Object? value) =>
    value == null ? null : FriendDetails.fromJson(_asJsonMap(value));

class FriendsService {
  FriendsService({
    http.Client? client,
    required this._tokenStore,
    String? baseUrl,
  }) : _client = client ?? http.Client(),
       _baseUri = _apiBaseUri(baseUrl ?? apiBaseUrl);

  final http.Client _client;
  final TokenStore _tokenStore;
  final Uri _baseUri;

  static Uri _apiBaseUri(String value) {
    final uri = Uri.parse(value);
    final path = uri.path.endsWith('/auth/')
        ? uri.path.substring(0, uri.path.length - 'auth/'.length)
        : uri.path.endsWith('/auth')
        ? uri.path.substring(0, uri.path.length - 'auth'.length)
        : uri.path.endsWith('/')
        ? uri.path
        : '${uri.path}/';
    return uri.replace(path: path.endsWith('/') ? path : '$path/');
  }

  Future<AddFriendResult> addFriend({
    required String currentUserId,
    required String friendId,
  }) async {
    final path =
        'users/${Uri.encodeComponent(currentUserId)}/friends/${Uri.encodeComponent(friendId)}';
    final response = await _request(
      path,
      method: 'POST',
      acceptedStatuses: {200, 201},
    );
    return AddFriendResult.fromJson(_asJsonMap(response));
  }

  Future<DeleteFriendResult> deleteFriend({
    required String currentUserId,
    required String friendId,
  }) async {
    final path =
        'users/${Uri.encodeComponent(currentUserId)}/friends/${Uri.encodeComponent(friendId)}';
    final response = await _request(
      path,
      method: 'DELETE',
      acceptedStatuses: {200, 404},
    );
    return DeleteFriendResult.fromJson(_asJsonMap(response));
  }

  Future<FriendsStats> fetchStats({required String currentUserId}) async {
    final path = 'users/${Uri.encodeComponent(currentUserId)}/friends/stats';
    final response = await _request(path, method: 'GET');
    return FriendsStats.fromJson(_asJsonMap(response));
  }

  Future<List<FriendWorkout>> fetchTodayWorkouts({
    required String currentUserId,
  }) async {
    final path =
        'users/${Uri.encodeComponent(currentUserId)}/friends/workouts/today';
    final response = await _request(path, method: 'GET');
    if (response is! List) {
      throw const FriendsException(
        'The server returned invalid friend workout data.',
      );
    }
    return response
        .map((friend) => FriendWorkout.fromJson(_asJsonMap(friend)))
        .toList();
  }

  Future<void> sendWorkoutNotification({
    required String friendId,
    required String action,
  }) async {
    if (action != 'bug' && action != 'congratulate') {
      throw ArgumentError.value(action, 'action');
    }
    await _request(
      'notifications/friends/${Uri.encodeComponent(friendId)}/$action',
      method: 'POST',
      acceptedStatuses: {201},
    );
  }

  Future<List<SearchUser>> searchUsers(String query) async {
    final response = await _request(
      'users/search',
      method: 'GET',
      queryParameters: {'q': query},
    );
    if (response is! List) {
      throw const FriendsException('The server returned an invalid user list.');
    }
    return response
        .map((user) => SearchUser.fromJson(_asJsonMap(user)))
        .toList();
  }

  Future<Object?> _request(
    String path, {
    required String method,
    Set<int> acceptedStatuses = const {200},
    Map<String, String>? queryParameters,
  }) async {
    final token = await _tokenStore.read();
    if (token == null || token.isEmpty) {
      throw const FriendsException('Authentication is required.');
    }

    final resolvedUri = _baseUri.resolve(path);
    final uri = queryParameters == null
        ? resolvedUri
        : resolvedUri.replace(queryParameters: queryParameters);
    final request = http.Request(method, uri)
      ..headers.addAll({
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
      });

    late final http.Response response;
    try {
      final streamed = await _client
          .send(request)
          .timeout(const Duration(seconds: 20));
      response = await http.Response.fromStream(streamed)
          .timeout(const Duration(seconds: 20));
    } on http.ClientException {
      throw const FriendsException(
        'Could not reach the GymBros server. Check the API address and connection.',
      );
    } on TimeoutException {
      throw const FriendsException(
        'The server took too long to respond. Please try again.',
      );
    }

    final decoded = _decodeResponse(response.body);
    if (!acceptedStatuses.contains(response.statusCode)) {
      final message = decoded is Map<String, dynamic>
          ? decoded['message']
          : null;
      throw FriendsException(
        message is String ? message : 'Friend request failed.',
        statusCode: response.statusCode,
      );
    }
    return decoded;
  }

  Object? _decodeResponse(String body) {
    try {
      return jsonDecode(body);
    } on FormatException {
      throw const FriendsException('The server returned an invalid response.');
    }
  }
}
