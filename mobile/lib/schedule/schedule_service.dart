import 'dart:async';
import 'dart:convert';

import 'package:flutter/services.dart' show PlatformException;
import 'package:http/http.dart' as http;

import '../auth/auth_service.dart';

const _defaultAuthUrl = 'http://10.0.2.2:5001/api/auth/';
const _daysOfWeek = <String>[
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
final _timePattern = RegExp(
  r'^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$',
  caseSensitive: false,
);

class ScheduleEntry {
  const ScheduleEntry({
    required this.id,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    required this.activity,
    required this.isCompletedToday,
  });

  final String id;
  final String dayOfWeek;
  final String startTime;
  final String endTime;
  final String activity;
  final bool isCompletedToday;

  factory ScheduleEntry.fromJson(Map<String, Object?> json) {
    final id = json['_id'];
    final dayOfWeek = json['dayOfWeek'];
    final startTime = json['startTime'];
    final endTime = json['endTime'];
    final activity = json['activity'];
    final isCompletedToday = json['isCompletedToday'];

    if (id is! String ||
        !_daysOfWeek.contains(dayOfWeek) ||
        startTime is! String ||
        endTime is! String ||
        activity is! String ||
        (isCompletedToday != null && isCompletedToday is! bool)) {
      throw const ScheduleException(
        'The server returned an invalid schedule entry.',
      );
    }

    return ScheduleEntry(
      id: id,
      dayOfWeek: dayOfWeek as String,
      startTime: startTime,
      endTime: endTime,
      activity: activity,
      isCompletedToday: isCompletedToday as bool? ?? false,
    );
  }
}

class ScheduleException implements Exception {
  const ScheduleException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ScheduleService {
  ScheduleService({
    required this._tokenStore,
    http.Client? client,
    String? baseUrl,
  }) : _client = client ?? http.Client(),
       _baseUri = _scheduleBaseUri(baseUrl);

  final TokenStore _tokenStore;
  final http.Client _client;
  final Uri _baseUri;

  Future<List<ScheduleEntry>> getSchedules() async {
    final response = await _request('');
    if (response is! List<Object?>) {
      throw const ScheduleException(
        'The server returned an invalid schedule list.',
      );
    }
    return response.map((entry) {
      if (entry is! Map<String, Object?>) {
        throw const ScheduleException(
          'The server returned an invalid schedule entry.',
        );
      }
      return ScheduleEntry.fromJson(entry);
    }).toList();
  }

  Future<ScheduleEntry> createSchedule({
    required String dayOfWeek,
    required String startTime,
    required String endTime,
    required String activity,
  }) async {
    final response = await _request(
      '',
      method: 'POST',
      body: {
        'dayOfWeek': dayOfWeek,
        'startTime': startTime.trim(),
        'endTime': endTime.trim(),
        'activity': activity.trim(),
      },
      expectedStatus: 201,
    );
    return _entryFromResponse(response);
  }

  Future<ScheduleEntry> updateSchedule(
    String id, {
    String? dayOfWeek,
    String? startTime,
    String? endTime,
    String? activity,
  }) async {
    final body = <String, Object?>{
      ...?dayOfWeek == null ? null : {'dayOfWeek': dayOfWeek},
      ...?startTime == null ? null : {'startTime': startTime.trim()},
      ...?endTime == null ? null : {'endTime': endTime.trim()},
      ...?activity == null ? null : {'activity': activity.trim()},
    };
    final response = await _request(id, method: 'PATCH', body: body);
    return _entryFromResponse(response);
  }

  Future<void> deleteSchedule(String id) async {
    await _request(id, method: 'DELETE');
  }

  Future<Object?> _request(
    String path, {
    String method = 'GET',
    Map<String, Object?>? body,
    int expectedStatus = 200,
  }) async {
    late final String? token;
    try {
      token = await _tokenStore.read();
    } on PlatformException {
      throw const ScheduleException(
        'Could not securely access your saved sign-in. Please sign in again.',
      );
    }
    if (token == null || token.isEmpty) {
      throw const ScheduleException(
        'Your sign-in has expired. Please sign in again.',
        statusCode: 401,
      );
    }

    final headers = <String, String>{
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
      if (body != null) 'Content-Type': 'application/json',
    };

    late final http.Response response;
    try {
      final request = http.Request(method, _baseUri.resolve(path))
        ..headers.addAll(headers)
        ..body = body == null ? '' : jsonEncode(body);
      final streamed = await _client
          .send(request)
          .timeout(const Duration(seconds: 20));
      response = await http.Response.fromStream(streamed)
          .timeout(const Duration(seconds: 20));
    } on http.ClientException {
      throw const ScheduleException(
        'Could not reach the GymBros server. Check the API address and your connection.',
      );
    } on TimeoutException {
      throw const ScheduleException(
        'The server took too long to respond. Please try again.',
      );
    }

    final decoded = _decodeResponse(response.body);
    if (response.statusCode != expectedStatus) {
      final message = decoded is Map<String, Object?>
          ? decoded['message']
          : null;
      throw ScheduleException(
        message is String ? message : 'Request failed. Please try again.',
        statusCode: response.statusCode,
      );
    }
    return decoded;
  }

  Object? _decodeResponse(String body) {
    try {
      return jsonDecode(body);
    } on FormatException {
      throw const ScheduleException('The server returned an invalid response.');
    }
  }

  ScheduleEntry _entryFromResponse(Object? response) {
    if (response is! Map<String, Object?>) {
      throw const ScheduleException(
        'The server returned an invalid schedule entry.',
      );
    }
    return ScheduleEntry.fromJson(response);
  }

  static Uri _scheduleBaseUri(String? baseUrl) {
    final uri = Uri.parse(
      baseUrl ??
          const String.fromEnvironment(
            'API_BASE_URL',
            defaultValue: _defaultAuthUrl,
          ),
    );
    final segments = [
      ...uri.pathSegments.where((segment) => segment.isNotEmpty),
    ];
    if (baseUrl != null) {
      if (segments.isEmpty) {
        throw ArgumentError.value(
          baseUrl,
          'baseUrl',
          'Must include an API path.',
        );
      }
      return uri.replace(
        path: '/${segments.join('/')}/',
        query: null,
        fragment: null,
      );
    }
    if (segments.isEmpty || segments.last != 'auth') {
      throw ArgumentError.value(
        uri.toString(),
        'API_BASE_URL',
        'Must point to the /api/auth endpoint.',
      );
    }
    segments[segments.length - 1] = 'schedules';
    return uri.replace(
      path: '/${segments.join('/')}/',
      query: null,
      fragment: null,
    );
  }
}

String? validateScheduleDay(String? value) =>
    value != null && _daysOfWeek.contains(value) ? null : 'Choose a day';

String? validateScheduleTime(String? value) {
  if (value == null || !_timePattern.hasMatch(value.trim())) {
    return 'Use a time like 6:30 PM';
  }
  return null;
}
