import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/auth/auth_service.dart';
import 'package:mobile/schedule/schedule_service.dart';

class _MemoryTokenStore implements TokenStore {
  String? token = 'signed.jwt.token';

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

Map<String, Object?> _entry({
  String id = 'schedule-id',
  String dayOfWeek = 'Monday',
  String startTime = '6:00 PM',
  String endTime = '7:00 PM',
  String activity = 'Strength training',
}) => {
  '_id': id,
  'dayOfWeek': dayOfWeek,
  'startTime': startTime,
  'endTime': endTime,
  'activity': activity,
  'isCompletedToday': false,
};

http.Response _jsonResponse(int status, Object body) => http.Response(
  jsonEncode(body),
  status,
  headers: {'content-type': 'application/json'},
);

void main() {
  group('ScheduleService', () {
    test('loads the signed-in user schedule with a bearer token', () async {
      late http.Request received;
      final service = ScheduleService(
        tokenStore: _MemoryTokenStore(),
        baseUrl: 'http://localhost:5001/api/schedules',
        client: MockClient((request) async {
          received = request;
          return _jsonResponse(200, [_entry()]);
        }),
      );

      final entries = await service.getSchedules();

      expect(received.method, 'GET');
      expect(received.url.path, '/api/schedules/');
      expect(received.headers['Authorization'], 'Bearer signed.jwt.token');
      expect(entries.single.activity, 'Strength training');
      expect(entries.single.isCompletedToday, isFalse);
    });

    test('creates, partially updates, and deletes schedule entries', () async {
      final requests = <http.Request>[];
      final service = ScheduleService(
        tokenStore: _MemoryTokenStore(),
        baseUrl: 'http://localhost:5001/api/schedules/',
        client: MockClient((request) async {
          requests.add(request);
          if (request.method == 'DELETE') {
            return _jsonResponse(200, {
              'message': 'Schedule entry deleted successfully',
            });
          }
          if (request.method == 'POST') {
            return _jsonResponse(201, _entry());
          }
          return _jsonResponse(
            200,
            _entry(dayOfWeek: 'Tuesday', activity: 'Cardio'),
          );
        }),
      );

      final created = await service.createSchedule(
        dayOfWeek: 'Monday',
        startTime: '6:00 PM',
        endTime: '7:00 PM',
        activity: 'Strength training',
      );
      final updated = await service.updateSchedule(
        created.id,
        dayOfWeek: 'Tuesday',
        activity: 'Cardio',
      );
      await service.deleteSchedule(created.id);

      expect(requests.map((request) => request.method), [
        'POST',
        'PATCH',
        'DELETE',
      ]);
      expect(requests[0].url.path, '/api/schedules/');
      expect(jsonDecode(requests[0].body), {
        'dayOfWeek': 'Monday',
        'startTime': '6:00 PM',
        'endTime': '7:00 PM',
        'activity': 'Strength training',
      });
      expect(requests[1].url.path, '/api/schedules/schedule-id');
      expect(jsonDecode(requests[1].body), {
        'dayOfWeek': 'Tuesday',
        'activity': 'Cardio',
      });
      expect(requests[2].url.path, '/api/schedules/schedule-id');
      expect(updated.dayOfWeek, 'Tuesday');
      expect(updated.activity, 'Cardio');
    });

    test(
      'surfaces backend errors and refuses requests without a token',
      () async {
        final service = ScheduleService(
          tokenStore: _MemoryTokenStore(),
          baseUrl: 'http://localhost:5001/api/schedules/',
          client: MockClient(
            (_) async =>
                _jsonResponse(404, {'message': 'Schedule entry not found'}),
          ),
        );
        await expectLater(
          service.deleteSchedule('missing-id'),
          throwsA(
            isA<ScheduleException>()
                .having(
                  (error) => error.message,
                  'message',
                  'Schedule entry not found',
                )
                .having((error) => error.statusCode, 'statusCode', 404),
          ),
        );

        await expectLater(
          ScheduleService(
            tokenStore: _MemoryTokenStore()..token = null,
            baseUrl: 'http://localhost:5001/api/schedules/',
            client: MockClient((_) async => fail('Should not send a request')),
          ).getSchedules(),
          throwsA(
            isA<ScheduleException>().having(
              (error) => error.statusCode,
              'statusCode',
              401,
            ),
          ),
        );
      },
    );

    test('validates schedule values using the backend formats', () {
      expect(validateScheduleDay('Sunday'), isNull);
      expect(validateScheduleDay('Funday'), isNotNull);
      expect(validateScheduleTime('6:30 PM'), isNull);
      expect(validateScheduleTime('18:30'), isNotNull);
    });
  });
}
