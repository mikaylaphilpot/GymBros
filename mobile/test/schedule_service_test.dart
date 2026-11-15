import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/auth/auth_service.dart';
import 'package:mobile/schedules/schedule_service.dart';

class _TokenStore implements TokenStore {
  @override
  Future<void> delete() async {}

  @override
  Future<String?> read() async => 'test-token';

  @override
  Future<void> write(String token) async {}
}

Map<String, Object?> _scheduleJson({
  String id = 'schedule-id',
  bool isCompletedToday = false,
}) => {
  '_id': id,
  'dayOfWeek': 'Monday',
  'startTime': '9:00 AM',
  'endTime': '10:00 AM',
  'activity': 'Tennis',
  'isCompletedToday': isCompletedToday,
};

void main() {
  test('uses authenticated schedule CRUD endpoints', () async {
    final requests = <http.Request>[];
    final service = ScheduleService(
      tokenStore: _TokenStore(),
      baseUrl: 'http://localhost:5001/api/auth/',
      client: MockClient((request) async {
        requests.add(request);
        if (request.method == 'GET') {
          return http.Response(jsonEncode([_scheduleJson()]), 200);
        }
        if (request.method == 'POST') {
          return http.Response(jsonEncode(_scheduleJson()), 201);
        }
        if (request.method == 'PATCH') {
          if (request.url.path.endsWith('/completion')) {
            return http.Response(
              jsonEncode(_scheduleJson(isCompletedToday: true)),
              200,
            );
          }
          return http.Response(jsonEncode(_scheduleJson()), 200);
        }
        return http.Response(
          jsonEncode({'message': 'Schedule entry deleted successfully'}),
          200,
        );
      }),
    );

    final schedules = await service.fetchSchedules();
    expect(schedules.single.activity, 'Tennis');

    final created = await service.createSchedule(
      dayOfWeek: 'Monday',
      startTime: '9:00 AM',
      endTime: '10:00 AM',
      activity: 'Tennis',
    );
    expect(created.id, 'schedule-id');

    final updated = await service.updateSchedule(
      id: 'schedule-id',
      dayOfWeek: 'Monday',
      startTime: '9:00 AM',
      endTime: '10:00 AM',
      activity: 'Tennis',
    );
    expect(updated.activity, 'Tennis');

    final completed = await service.setScheduleCompletion(
      id: 'schedule-id',
      isCompletedToday: true,
    );
    expect(completed.isCompletedToday, isTrue);

    await service.deleteSchedule('schedule-id');

    expect(requests.map((request) => request.method), [
      'GET',
      'POST',
      'PATCH',
      'PATCH',
      'DELETE',
    ]);
    expect(
      requests.every(
        (request) =>
            request.url.path == '/api/schedules/' ||
            request.url.path == '/api/schedules/schedule-id' ||
            request.url.path == '/api/schedules/schedule-id/completion',
      ),
      isTrue,
    );
    expect(
      requests.every(
        (request) => request.headers['authorization'] == 'Bearer test-token',
      ),
      isTrue,
    );
    expect(jsonDecode(requests[1].body), {
      'dayOfWeek': 'Monday',
      'startTime': '9:00 AM',
      'endTime': '10:00 AM',
      'activity': 'Tennis',
    });
    expect(requests[3].url.path, '/api/schedules/schedule-id/completion');
    expect(jsonDecode(requests[3].body), {'isCompletedToday': true});
  });
}
