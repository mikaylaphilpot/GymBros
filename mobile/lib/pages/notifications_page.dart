import 'package:flutter/material.dart';

import '../notifications/notification_service.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key, required this.service});

  final NotificationService service;

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  late Future<List<AppNotification>> _notifications;

  @override
  void initState() {
    super.initState();
    _notifications = widget.service.fetchNotifications();
  }

  Future<void> _refresh() async {
    setState(() {
      _notifications = widget.service.fetchNotifications();
    });
    await _notifications;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: FutureBuilder<List<AppNotification>>(
        future: _notifications,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Text(
                snapshot.error is NotificationException
                    ? (snapshot.error! as NotificationException).message
                    : 'Could not load notifications.',
                textAlign: TextAlign.center,
              ),
            );
          }
          final notifications = snapshot.data ?? [];
          if (notifications.isEmpty) {
            return RefreshIndicator(
              onRefresh: _refresh,
              child: ListView(
                children: const [
                  SizedBox(height: 180),
                  Center(child: Text('You have no notifications.')),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: notifications.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final notification = notifications[index];
                return Card(
                  child: ListTile(
                    leading: Icon(
                      notification.read
                          ? Icons.notifications_none
                          : Icons.notifications_active,
                    ),
                    title: Text(notification.title),
                    subtitle: Text(notification.message),
                    onTap: notification.read
                        ? null
                        : () async {
                            await widget.service.markRead(notification.id);
                            if (mounted) {
                              setState(
                                () => _notifications = widget.service
                                    .fetchNotifications(),
                              );
                            }
                          },
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
