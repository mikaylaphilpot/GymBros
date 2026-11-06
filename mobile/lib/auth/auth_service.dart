import 'dart:async';
import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/services.dart' show PlatformException;
import 'package:http/http.dart' as http;

const _defaultAuthUrl = 'http://10.0.2.2:5001/api/auth/';
const _tokenKey = 'auth_token';

abstract interface class TokenStore {
  Future<String?> read();
  Future<void> write(String token);
  Future<void> delete();
}

class SecureTokenStore implements TokenStore {
  const SecureTokenStore();

  static const _storage = FlutterSecureStorage();

  @override
  Future<void> delete() => _storage.delete(key: _tokenKey);

  @override
  Future<String?> read() => _storage.read(key: _tokenKey);

  @override
  Future<void> write(String token) =>
      _storage.write(key: _tokenKey, value: token);
}

class AuthUser {
  const AuthUser({
    required this.id,
    required this.username,
    required this.email,
  });

  final String id;
  final String username;
  final String email;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    final username = json['username'];
    final email = json['email'];
    if (id is! String || username is! String || email is! String) {
      throw const AuthException('The server returned an invalid user profile.');
    }
    return AuthUser(id: id, username: username, email: email);
  }
}

class AuthException implements Exception {
  const AuthException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class AuthService {
  AuthService({http.Client? client, TokenStore? tokenStore, String? baseUrl})
    : _client = client ?? http.Client(),
      _tokenStore = tokenStore ?? const SecureTokenStore(),
      _baseUri = _withTrailingSlash(
        baseUrl ??
            const String.fromEnvironment(
              'API_BASE_URL',
              defaultValue: _defaultAuthUrl,
            ),
      );

  final http.Client _client;
  final TokenStore _tokenStore;
  final Uri _baseUri;

  static Uri _withTrailingSlash(String value) {
    final uri = Uri.parse(value);
    return uri.path.endsWith('/') ? uri : uri.replace(path: '${uri.path}/');
  }

  Future<void> signUp({
    required String username,
    required String email,
    required String password,
  }) async {
    await _request(
      'signup',
      method: 'POST',
      body: {'username': username, 'email': email, 'password': password},
      expectedStatus: 201,
    );
  }

  Future<AuthUser> logIn({
    required String username,
    required String password,
  }) async {
    final response = await _request(
      'login',
      method: 'POST',
      body: {'username': username, 'password': password},
      expectedStatus: 200,
    );
    final token = response['token'];
    if (token is! String || token.isEmpty) {
      throw const AuthException(
        'The server did not return an authentication token.',
      );
    }
    await _writeToken(token);
    return _loadUser(token);
  }

  Future<AuthUser?> restoreSession() async {
    final token = await _readToken();
    if (token == null || token.isEmpty) return null;

    try {
      return await _loadUser(token);
    } on AuthException catch (error) {
      if (error.statusCode == 401) {
        await _deleteToken();
        return null;
      }
      rethrow;
    }
  }

  Future<void> logOut() => _deleteToken();

  Future<String?> _readToken() => _secureStorageOperation(_tokenStore.read);

  Future<void> _writeToken(String token) =>
      _secureStorageOperation(() => _tokenStore.write(token));

  Future<void> _deleteToken() => _secureStorageOperation(_tokenStore.delete);

  Future<T> _secureStorageOperation<T>(Future<T> Function() operation) async {
    try {
      return await operation();
    } on PlatformException {
      throw const AuthException(
        'Could not securely access your saved sign-in. Please try again.',
      );
    }
  }

  Future<AuthUser> _loadUser(String token) async {
    final response = await _request(
      'me',
      method: 'GET',
      headers: {'Authorization': 'Bearer $token'},
      expectedStatus: 200,
    );
    return AuthUser.fromJson(response);
  }

  Future<Map<String, dynamic>> _request(
    String path, {
    required String method,
    Map<String, String> headers = const {},
    Map<String, Object?>? body,
    required int expectedStatus,
  }) async {
    final uri = _baseUri.resolve(path);
    final requestHeaders = <String, String>{
      'Accept': 'application/json',
      if (body != null) 'Content-Type': 'application/json',
      ...headers,
    };

    late final http.Response response;
    try {
      final request = http.Request(method, uri)
        ..headers.addAll(requestHeaders)
        ..body = body == null ? '' : jsonEncode(body);
      final streamed = await _client
          .send(request)
          .timeout(const Duration(seconds: 20));
      response = await http.Response.fromStream(streamed)
          .timeout(const Duration(seconds: 20));
    } on http.ClientException {
      throw const AuthException(
        'Could not reach the GymBros server. Check the API address and your connection.',
      );
    } on TimeoutException {
      throw const AuthException(
        'The server took too long to respond. Please try again.',
      );
    }

    final decoded = _decodeResponse(response.body);
    if (response.statusCode != expectedStatus) {
      final message = decoded['message'];
      throw AuthException(
        message is String ? message : 'Request failed. Please try again.',
        statusCode: response.statusCode,
      );
    }
    return decoded;
  }

  Map<String, dynamic> _decodeResponse(String body) {
    try {
      final value = jsonDecode(body);
      if (value is Map<String, dynamic>) return value;
    } on FormatException {
      throw const AuthException('The server returned an invalid response.');
    }
    throw const AuthException('The server returned an invalid response.');
  }
}
