import 'dart:async';
import 'dart:convert';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../auth/auth_service.dart';

class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.read,
    required this.createdAt,
    this.url,
  });

  final String id;
  final String title;
  final String message;
  final bool read;
  final DateTime createdAt;
  final String? url;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    final title = json['title'];
    final message = json['message'];
    final read = json['read'];
    final createdAt = json['createdAt'];
    if (id is! String ||
        title is! String ||
        message is! String ||
        read is! bool ||
        createdAt is! String) {
      throw const NotificationException(
        'The server returned an invalid notification.',
      );
    }
    return AppNotification(
      id: id,
      title: title,
      message: message,
      read: read,
      createdAt: DateTime.parse(createdAt),
      url: json['url'] is String ? json['url'] as String : null,
    );
  }
}

class NotificationException implements Exception {
  const NotificationException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class NotificationService {
  NotificationService({
    http.Client? client,
    required this._tokenStore,
    this._messaging,
    String? baseUrl,
  }) : _client = client ?? http.Client(),
       _baseUri = _apiBaseUri(
         baseUrl ??
             const String.fromEnvironment(
               'API_BASE_URL',
               defaultValue: 'http://10.0.2.2:5001/api/auth/',
             ),
       );

  final http.Client _client;
  final TokenStore _tokenStore;
  final FirebaseMessaging? _messaging;
  final Uri _baseUri;
  String? _registeredToken;
  StreamSubscription<String>? _tokenRefreshSubscription;

  FirebaseMessaging get _firebaseMessaging =>
      _messaging ?? FirebaseMessaging.instance;

  Future<void> registerCurrentDevice() async {
    final settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    if (settings.authorizationStatus == AuthorizationStatus.denied) return;

    final token = await _firebaseMessaging.getToken();
    if (token == null || token.isEmpty) return;
    await registerDeviceToken(token);
    _registeredToken = token;

    await _tokenRefreshSubscription?.cancel();
    _tokenRefreshSubscription = _firebaseMessaging.onTokenRefresh.listen((
      refreshedToken,
    ) async {
      try {
        await registerDeviceToken(refreshedToken);
        _registeredToken = refreshedToken;
      } on NotificationException catch (error) {
        debugPrint('Could not register refreshed notification token: $error');
      }
    });
  }

  Future<void> unregisterCurrentDevice() async {
    final token = _registeredToken;
    if (token == null) return;
    await unregisterDeviceToken(token);
    _registeredToken = null;
    await _tokenRefreshSubscription?.cancel();
    _tokenRefreshSubscription = null;
  }

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

  Future<List<AppNotification>> fetchNotifications({
    bool unreadOnly = false,
  }) async {
    final response = await _request(
      'notifications/inbox?unreadOnly=$unreadOnly',
      method: 'GET',
    );
    final values = response['notifications'];
    if (values is! List) {
      throw const NotificationException(
        'The server returned an invalid notification list.',
      );
    }
    return values
        .map((value) => AppNotification.fromJson(value as Map<String, dynamic>))
        .toList();
  }

  Future<void> markRead(String notificationId) async {
    await _request(
      'notifications/inbox/$notificationId/read',
      method: 'PATCH',
      expectedStatus: 204,
    );
  }

  Future<void> registerDeviceToken(String token) async {
    await _request(
      'notifications/device-token',
      method: 'POST',
      body: {'token': token, 'platform': 'android'},
      expectedStatus: 204,
    );
  }

  Future<void> unregisterDeviceToken(String token) async {
    await _request(
      'notifications/device-token',
      method: 'DELETE',
      body: {'token': token},
      expectedStatus: 204,
    );
  }

  Future<Map<String, dynamic>> _request(
    String path, {
    required String method,
    Map<String, Object?>? body,
    int expectedStatus = 200,
  }) async {
    final token = await _tokenStore.read();
    if (token == null || token.isEmpty) {
      throw const NotificationException('Authentication is required.');
    }
    final request = http.Request(method, _baseUri.resolve(path))
      ..headers.addAll({
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
        if (body != null) 'Content-Type': 'application/json',
      })
      ..body = body == null ? '' : jsonEncode(body);
    try {
      final response = await _client
          .send(request)
          .timeout(const Duration(seconds: 20));
      final text = await response.stream.bytesToString();
      if (response.statusCode != expectedStatus) {
        Map<String, dynamic> decoded = {};
        try {
          final value = jsonDecode(text);
          if (value is Map<String, dynamic>) decoded = value;
        } on FormatException {
          // Use the status-based message below for non-JSON errors.
        }
        final message = decoded['message'];
        throw NotificationException(
          message is String ? message : 'Notification request failed.',
          statusCode: response.statusCode,
        );
      }
      if (text.isEmpty) return {};
      final value = jsonDecode(text);
      if (value is Map<String, dynamic>) return value;
      throw const NotificationException(
        'The server returned an invalid response.',
      );
    } on http.ClientException {
      throw const NotificationException(
        'Could not reach the GymBros server. Check the API address and connection.',
      );
    } on TimeoutException {
      throw const NotificationException(
        'The server took too long to respond. Please try again.',
      );
    }
  }
}
