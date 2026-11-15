// AI-assisted: Initial Implementation suggested by Copilot
import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../auth/auth_service.dart';
import '../config/app_config.dart';

class WorkoutSchedule {
  const WorkoutSchedule({
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

  factory WorkoutSchedule.fromJson(Map<String, dynamic> json) {
    final id = json['_id'];
    final dayOfWeek = json['dayOfWeek'];
    final startTime = json['startTime'];
    final endTime = json['endTime'];
    final activity = json['activity'];
    final isCompletedToday = json['isCompletedToday'];
    if (id is! String ||
        dayOfWeek is! String ||
        startTime is! String ||
        endTime is! String ||
        activity is! String ||
        isCompletedToday is! bool) {
      throw const ScheduleException('The server returned an invalid schedule.');
    }
    return WorkoutSchedule(
      id: id,
      dayOfWeek: dayOfWeek,
      startTime: startTime,
      endTime: endTime,
      activity: activity,
      isCompletedToday: isCompletedToday,
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
    http.Client? client,
    required this.tokenStore,
    String? baseUrl,
  }) : _client = client ?? http.Client(),
       _baseUri = _schedulesBaseUri(baseUrl ?? apiBaseUrl);

  final http.Client _client;
  final TokenStore tokenStore;
  final Uri _baseUri;

  static Uri _schedulesBaseUri(String value) {
    final uri = Uri.parse(value);
    final path = uri.path.replaceFirst(RegExp(r'/auth/?$'), '/schedules/');
    final schedulesPath = path.endsWith('/schedules/')
        ? path
        : path.endsWith('/schedules')
        ? '$path/'
        : '${path.endsWith('/') ? path : '$path/'}schedules/';
    return uri.replace(path: schedulesPath);
  }

  Future<List<WorkoutSchedule>> fetchSchedules() async {
    final payload = await _request('', method: 'GET');
    if (payload is! List) {
      throw const ScheduleException('The server returned invalid schedules.');
    }
    return payload
        .map((item) => WorkoutSchedule.fromJson(_asJsonMap(item)))
        .toList();
  }

  Future<WorkoutSchedule> createSchedule({
    required String dayOfWeek,
    required String startTime,
    required String endTime,
    required String activity,
  }) async {
    final payload = await _request(
      '',
      method: 'POST',
      body: {
        'dayOfWeek': dayOfWeek,
        'startTime': startTime,
        'endTime': endTime,
        'activity': activity,
      },
      acceptedStatuses: {201},
    );
    return WorkoutSchedule.fromJson(_asJsonMap(payload));
  }

  Future<WorkoutSchedule> updateSchedule({
    required String id,
    required String dayOfWeek,
    required String startTime,
    required String endTime,
    required String activity,
  }) async {
    final payload = await _request(
      Uri.encodeComponent(id),
      method: 'PATCH',
      body: {
        'dayOfWeek': dayOfWeek,
        'startTime': startTime,
        'endTime': endTime,
        'activity': activity,
      },
    );
    return WorkoutSchedule.fromJson(_asJsonMap(payload));
  }

  Future<void> deleteSchedule(String id) async {
    await _request(Uri.encodeComponent(id), method: 'DELETE');
  }

  Future<WorkoutSchedule> setScheduleCompletion({
    required String id,
    required bool isCompletedToday,
  }) async {
    final payload = await _request(
      '${Uri.encodeComponent(id)}/completion',
      method: 'PATCH',
      body: {'isCompletedToday': isCompletedToday},
    );
    return WorkoutSchedule.fromJson(_asJsonMap(payload));
  }

  Future<Object?> _request(
    String path, {
    required String method,
    Map<String, Object?>? body,
    Set<int> acceptedStatuses = const {200},
  }) async {
    final token = await tokenStore.read();
    if (token == null || token.isEmpty) {
      throw const ScheduleException('Authentication is required.');
    }

    final request = http.Request(method, _baseUri.resolve(path))
      ..headers.addAll({
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
        if (body != null) 'Content-Type': 'application/json',
      })
      ..body = body == null ? '' : jsonEncode(body);

    late final http.Response response;
    try {
      final streamed = await _client
          .send(request)
          .timeout(const Duration(seconds: 20));
      response = await http.Response.fromStream(streamed)
          .timeout(const Duration(seconds: 20));
    } on http.ClientException {
      throw const ScheduleException(
        'Could not reach the GymBros server. Check the API address and connection.',
      );
    } on TimeoutException {
      throw const ScheduleException(
        'The server took too long to respond. Please try again.',
      );
    }

    final payload = _decodeResponse(response.body);
    if (!acceptedStatuses.contains(response.statusCode)) {
      final message = payload is Map<String, dynamic>
          ? payload['message']
          : null;
      throw ScheduleException(
        message is String ? message : 'Schedule request failed.',
        statusCode: response.statusCode,
      );
    }
    return payload;
  }

  Object? _decodeResponse(String body) {
    try {
      return jsonDecode(body);
    } on FormatException {
      throw const ScheduleException('The server returned an invalid response.');
    }
  }

  Map<String, dynamic> _asJsonMap(Object? value) {
    if (value is Map<String, dynamic>) return value;
    throw const ScheduleException('The server returned an invalid response.');
  }
}
