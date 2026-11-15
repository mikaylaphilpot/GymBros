//AI-assisted: Initial implementation suggested by Copilot (reviewed and modified)
import 'package:flutter/material.dart';

import '../auth/auth_service.dart';
import '../friends/friends_service.dart';
import '../schedules/schedule_service.dart';

const _red = Color(0xFFB31517);
const _pageBackground = Color(0xFFE9E4DF);
const _green = Color(0xFF61B315);
const _yellow = Color(0xFFFFD84D);
const _overdueFill = Color(0xFFFF9294);
const _completedFill = Color(0xFFC7F4AA);
const _upcomingFill = Color(0xFFFFF2B2);

enum _FriendWorkoutStatus { completed, overdue, upcoming }

_FriendWorkoutStatus _friendWorkoutStatus(FriendWorkoutItem workout) {
  if (workout.isCompletedToday) return _FriendWorkoutStatus.completed;

  final match = RegExp(r'^(\d{1,2}):(\d{2})\s*(AM|PM)$', caseSensitive: false)
    .firstMatch(workout.endTime.trim());
  if (match == null) return _FriendWorkoutStatus.upcoming;

  var hours = int.parse(match.group(1)!);
  final minutes = int.parse(match.group(2)!);
  final period = match.group(3)!.toUpperCase();
  if (period == 'PM' && hours != 12) hours += 12;
  if (period == 'AM' && hours == 12) hours = 0;
  final endMinutes = hours * 60 + minutes;
  final now = DateTime.now();
  final currentMinutes = now.hour * 60 + now.minute;
  return currentMinutes >= endMinutes
    ? _FriendWorkoutStatus.overdue
    : _FriendWorkoutStatus.upcoming;
}

ThemeData _screenTheme(BuildContext context) {
  return Theme.of(context).copyWith(
    brightness: Brightness.light,
    colorScheme: ColorScheme.fromSeed(
      seedColor: _red,
      brightness: Brightness.light,
    ),
    scaffoldBackgroundColor: _pageBackground,
    textTheme: Theme.of(context).textTheme
        .apply(bodyColor: Colors.black, displayColor: Colors.black),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: Colors.black,
      elevation: 0,
    ),
    navigationBarTheme: const NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: _pageBackground,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFFD9D9D9),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: const BorderSide(color: Color(0xFF9E9E9E)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: const BorderSide(color: Color(0xFF9E9E9E)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: const BorderSide(color: _red, width: 2),
      ),
    ),
  );
}

Widget _screenTitle(String title) {
  return Text(
    title,
    style: const TextStyle(
      color: Colors.black,
      fontSize: 30,
      fontWeight: FontWeight.bold,
      decoration: TextDecoration.underline,
      decorationColor: _red,
      decorationThickness: 4,
    ),
  );
}

class _ContentPanel extends StatelessWidget {
  const _ContentPanel({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 679),
        child: Container(
          width: double.infinity,
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: const [
              BoxShadow(
                color: Color(0x40000000),
                blurRadius: 16,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    required this.user,
    required this.onLogOut,
    this.friendsService,
    this.authService,
    this.scheduleService,
  });

  final AuthUser user;
  final VoidCallback onLogOut;
  final FriendsService? friendsService;
  final AuthService? authService;
  final ScheduleService? scheduleService;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tab = 0;
  int _scheduleRevision = 0;
  late final FriendsService _friendsService =
      widget.friendsService ??
      FriendsService(tokenStore: const SecureTokenStore());
  late final AuthService _authService =
      widget.authService ?? AuthService(tokenStore: const SecureTokenStore());
  late final ScheduleService _scheduleService =
      widget.scheduleService ??
      ScheduleService(tokenStore: const SecureTokenStore());

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: _screenTheme(context),
      child: Scaffold(
        appBar: AppBar(
          title: _screenTitle(
            _tab == 0
                ? 'Hey, Bro!'
                : _tab == 1
                ? 'Your Bros'
                : 'Profile',
          ),
          actions: [
            if (_tab == 0)
              IconButton(
                tooltip: 'Profile',
                onPressed: () => setState(() => _tab = 2),
                icon: const Icon(Icons.person_outline),
              ),
          ],
        ),
        body: _ContentPanel(
          child: IndexedStack(
            index: _tab,
            children: [
              _HomePage(
                currentUserId: widget.user.id,
                friendsService: _friendsService,
                scheduleService: _scheduleService,
                scheduleRevision: _scheduleRevision,
                onShowFriends: () => setState(() => _tab = 1),
              ),
              _FriendsPage(
                currentUserId: widget.user.id,
                friendsService: _friendsService,
              ),
              _ProfilePage(
                user: widget.user,
                authService: _authService,
                scheduleService: _scheduleService,
                onScheduleChanged: () => setState(() => _scheduleRevision++),
                onLogOut: widget.onLogOut,
              ),
            ],
          ),
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _tab,
          onDestinationSelected: (index) => setState(() => _tab = index),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              label: 'Home',
            ),
            NavigationDestination(
              icon: Icon(Icons.people_outline),
              label: 'Bros',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}

class _HomePage extends StatefulWidget {
  const _HomePage({
    required this.currentUserId,
    required this.friendsService,
    required this.scheduleService,
    required this.scheduleRevision,
    required this.onShowFriends,
  });

  final String currentUserId;
  final FriendsService friendsService;
  final ScheduleService scheduleService;
  final int scheduleRevision;
  final VoidCallback onShowFriends;

  @override
  State<_HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<_HomePage> {
  static const _days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  List<WorkoutSchedule> _schedules = [];
  List<FriendWorkout> _friendsWorkouts = [];
  bool _isLoadingSchedule = true;
  bool _isLoadingFriends = true;
  String? _scheduleError;
  String? _completionError;
  String? _friendsError;
  String? _friendActionError;
  String? _friendActionSuccess;
  final Set<String> _updatingScheduleIds = {};
  final Set<String> _sendingFriendActionKeys = {};

  @override
  void initState() {
    super.initState();
    _loadSchedules();
    _loadFriends();
  }

  @override
  void didUpdateWidget(covariant _HomePage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.scheduleRevision != widget.scheduleRevision) {
      setState(() {
        _isLoadingSchedule = true;
        _scheduleError = null;
      });
      _loadSchedules();
    }
  }

  Future<void> _loadSchedules() async {
    try {
      final schedules = await widget.scheduleService.fetchSchedules();
      if (mounted) setState(() => _schedules = schedules);
    } on ScheduleException catch (error) {
      if (mounted) setState(() => _scheduleError = error.message);
    } catch (_) {
      if (mounted) {
        setState(() => _scheduleError = 'Unable to load today\'s schedule.');
      }
    } finally {
      if (mounted) setState(() => _isLoadingSchedule = false);
    }
  }

  Future<void> _setWorkoutCompletion(
    WorkoutSchedule schedule,
    bool isCompletedToday,
  ) async {
    if (!_updatingScheduleIds.add(schedule.id)) return;
    setState(() => _completionError = null);
    try {
      final updatedSchedule = await widget.scheduleService
          .setScheduleCompletion(
            id: schedule.id,
            isCompletedToday: isCompletedToday,
          );
      if (mounted) {
        setState(() {
          _schedules = _schedules
              .map((item) => item.id == schedule.id ? updatedSchedule : item)
              .toList();
        });
      }
    } on ScheduleException catch (error) {
      if (mounted) setState(() => _completionError = error.message);
    } catch (_) {
      if (mounted) {
        setState(
          () => _completionError = 'Unable to update workout completion.',
        );
      }
    } finally {
      _updatingScheduleIds.remove(schedule.id);
      if (mounted) setState(() {});
    }
  }

  Future<void> _loadFriends() async {
    try {
      final workouts = await widget.friendsService.fetchTodayWorkouts(
        currentUserId: widget.currentUserId,
      );
      if (mounted) setState(() => _friendsWorkouts = workouts);
    } on FriendsException catch (error) {
      if (mounted) setState(() => _friendsError = error.message);
    } catch (_) {
      if (mounted) setState(() => _friendsError = 'Unable to load your bros.');
    } finally {
      if (mounted) setState(() => _isLoadingFriends = false);
    }
  }

  Future<void> _sendFriendWorkoutAction(
    FriendWorkout friend,
    FriendWorkoutItem workout,
    String action,
  ) async {
    final actionKey = '${friend.friendId}-${workout.scheduleId}';
    if (!_sendingFriendActionKeys.add(actionKey)) return;
    setState(() {
      _friendActionError = null;
      _friendActionSuccess = null;
    });
    try {
      await widget.friendsService.sendWorkoutNotification(
        friendId: friend.friendId,
        action: action,
      );
      if (mounted) {
        setState(() {
          _friendActionSuccess = action == 'bug'
              ? 'Workout reminder sent!'
              : 'Congratulations sent!';
        });
      }
    } on FriendsException catch (error) {
      if (mounted) setState(() => _friendActionError = error.message);
    } catch (_) {
      if (mounted) {
        setState(() => _friendActionError = 'Unable to send notification.');
      }
    } finally {
      _sendingFriendActionKeys.remove(actionKey);
      if (mounted) setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final today = _days[DateTime.now().weekday - 1];
    final todaySchedules = _schedules
        .where((item) => item.dayOfWeek == today)
        .toList();
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          'Here\'s your schedule for today.',
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        const SizedBox(height: 12),
        if (_completionError != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(_completionError!, style: const TextStyle(color: _red)),
          ),
        if (_isLoadingSchedule)
          const Center(child: CircularProgressIndicator(color: _red))
        else if (_scheduleError != null)
          Text(_scheduleError!, style: const TextStyle(color: _red))
        else if (todaySchedules.isEmpty)
          const Text('No workouts scheduled for today.')
        else
          for (final schedule in todaySchedules)
            Card(
              color: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: _red, width: 2),
              ),
              child: ListTile(
                title: Text(
                  '${schedule.startTime} - ${schedule.endTime}, ${schedule.activity}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                trailing: Checkbox(
                  value: schedule.isCompletedToday,
                  activeColor: _red,
                  onChanged: _updatingScheduleIds.contains(schedule.id)
                      ? null
                      : (checked) {
                          if (checked != null) {
                            _setWorkoutCompletion(schedule, checked);
                          }
                        },
                ),
              ),
            ),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: Text(
                'Your Bros',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
            ),
            TextButton(
              onPressed: widget.onShowFriends,
              child: const Text('See all'),
            ),
          ],
        ),
        const Text('Keep up with your bros’ workout streaks.'),
        const SizedBox(height: 12),
        if (_isLoadingFriends)
          const Center(child: CircularProgressIndicator(color: _red))
        else if (_friendsError != null)
          Text(_friendsError!, style: const TextStyle(color: _red))
        else if (_friendsWorkouts.isEmpty)
          const Text('None of your bros have workouts scheduled today.')
        else
          for (final friend in _friendsWorkouts)
            for (final workout in friend.workouts)
              Builder(
                builder: (context) {
                  final status = _friendWorkoutStatus(workout);
                  final isCompleted = status == _FriendWorkoutStatus.completed;
                  final isOverdue = status == _FriendWorkoutStatus.overdue;
                  final actionKey = '${friend.friendId}-${workout.scheduleId}';
                  return Card(
                    color: isCompleted
                        ? _completedFill
                        : isOverdue
                        ? _overdueFill
                        : _upcomingFill,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide(
                        color: isCompleted
                            ? _green
                            : isOverdue
                            ? _red
                            : _yellow,
                        width: 2,
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              '${friend.username}: ${workout.startTime} - ${workout.endTime}, ${workout.activity}',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          IconButton(
                            tooltip: isCompleted
                                ? 'Congratulate ${friend.username}'
                                : 'Bug ${friend.username}',
                            onPressed: _sendingFriendActionKeys.contains(
                                  actionKey,
                                )
                                ? null
                                : () => _sendFriendWorkoutAction(
                                    friend,
                                    workout,
                                    isCompleted ? 'congratulate' : 'bug',
                                  ),
                            icon: _sendingFriendActionKeys.contains(actionKey)
                                ? const SizedBox.square(
                                    dimension: 22,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : Icon(
                                    isCompleted
                                        ? Icons.celebration_outlined
                                        : Icons.bug_report_outlined,
                                    color: isCompleted ? _green : _red,
                                    size: 32,
                                  ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
        if (_friendActionError != null)
          Text(_friendActionError!, style: const TextStyle(color: _red)),
        if (_friendActionSuccess != null) Text(_friendActionSuccess!),
      ],
    );
  }
}

class _FriendsPage extends StatefulWidget {
  const _FriendsPage({
    required this.currentUserId,
    required this.friendsService,
  });

  final String currentUserId;
  final FriendsService friendsService;

  @override
  State<_FriendsPage> createState() => _FriendsPageState();
}

class _FriendsPageState extends State<_FriendsPage> {
  final _searchController = TextEditingController();
  List<SearchUser> _results = [];
  FriendsStats? _friendsStats;
  final Set<String> _friendIds = {};
  final Set<String> _addingFriendIds = {};
  final Set<String> _deletingFriendIds = {};
  final Set<String> _buggingFriendIds = {};
  final Map<String, String> _addErrors = {};
  final Map<String, String> _deleteErrors = {};
  final Map<String, String> _bugErrors = {};
  bool _isSearching = false;
  bool _isLoadingFriends = true;
  bool _friendsLoadFailed = false;
  String? _friendsError;
  String? _searchError;
  int _searchGeneration = 0;

  @override
  void initState() {
    super.initState();
    _loadFriends();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _searchUsers(String value) async {
    final generation = ++_searchGeneration;
    if (value.trim().isEmpty) {
      setState(() {
        _results = [];
        _isSearching = false;
        _searchError = null;
      });
      return;
    }

    setState(() {
      _results = [];
      _isSearching = true;
      _searchError = null;
    });

    try {
      final results = await widget.friendsService.searchUsers(value);
      if (!mounted || generation != _searchGeneration) return;
      setState(() => _results = results);
    } on FriendsException catch (error) {
      if (!mounted || generation != _searchGeneration) return;
      setState(() => _searchError = error.message);
    } catch (_) {
      if (!mounted || generation != _searchGeneration) return;
      setState(() => _searchError = 'Unable to search for bros.');
    } finally {
      if (mounted && generation == _searchGeneration) {
        setState(() => _isSearching = false);
      }
    }
  }

  Future<void> _loadFriends() async {
    try {
      final stats = await widget.friendsService.fetchStats(
        currentUserId: widget.currentUserId,
      );
      if (!mounted) return;
      setState(() => _updateFriendIds(stats));
    } on FriendsException catch (error) {
      if (!mounted) return;
      setState(() {
        _friendsLoadFailed = true;
        _friendsError = error.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _friendsLoadFailed = true;
        _friendsError = 'Unable to load your bros.';
      });
    } finally {
      if (mounted) setState(() => _isLoadingFriends = false);
    }
  }

  void _updateFriendIds(FriendsStats stats) {
    _friendsStats = stats;
    _friendIds
      ..clear()
      ..addAll([
        ...stats.otherFriends.map((friend) => friend.friendId),
        if (stats.highestStreakFriend != null)
          stats.highestStreakFriend!.friendId,
        if (stats.mostBuggedFriend != null) stats.mostBuggedFriend!.friendId,
      ]);
  }

  Future<void> _deleteFriend(FriendDetails friend) async {
    if (_deletingFriendIds.contains(friend.friendId)) return;
    setState(() {
      _deletingFriendIds.add(friend.friendId);
      _deleteErrors.remove(friend.friendId);
    });

    try {
      final result = await widget.friendsService.deleteFriend(
        currentUserId: widget.currentUserId,
        friendId: friend.friendId,
      );
      if (!mounted) return;
      if (!result.deleted) {
        setState(() => _deleteErrors[friend.friendId] = result.message);
        return;
      }

      final currentStats = _friendsStats;
      if (currentStats != null) {
        setState(() {
          _updateFriendIds(
            FriendsStats(
              otherFriends: currentStats.otherFriends
                  .where((item) => item.friendId != friend.friendId)
                  .toList(),
              highestStreakFriend:
                  currentStats.highestStreakFriend?.friendId == friend.friendId
                  ? null
                  : currentStats.highestStreakFriend,
              mostBuggedFriend:
                  currentStats.mostBuggedFriend?.friendId == friend.friendId
                  ? null
                  : currentStats.mostBuggedFriend,
            ),
          );
        });
      }

      try {
        final refreshedStats = await widget.friendsService.fetchStats(
          currentUserId: widget.currentUserId,
        );
        if (!mounted) return;
        setState(() => _updateFriendIds(refreshedStats));
      } on FriendsException catch (error) {
        if (!mounted) return;
        setState(() => _deleteErrors[friend.friendId] = error.message);
      }
    } on FriendsException catch (error) {
      if (!mounted) return;
      setState(() => _deleteErrors[friend.friendId] = error.message);
    } catch (_) {
      if (!mounted) return;
      setState(
        () => _deleteErrors[friend.friendId] = 'Unable to delete this bro.',
      );
    } finally {
      if (mounted) {
        setState(() => _deletingFriendIds.remove(friend.friendId));
      }
    }
  }

  Future<void> _bugFriend(FriendDetails friend) async {
    final friendId = friend.friendId;
    if (!_buggingFriendIds.add(friendId)) return;
    setState(() => _bugErrors.remove(friendId));

    try {
      await widget.friendsService.sendWorkoutNotification(
        friendId: friendId,
        action: 'bug',
      );
    } on FriendsException catch (error) {
      if (mounted) setState(() => _bugErrors[friendId] = error.message);
    } catch (_) {
      if (mounted) {
        setState(() => _bugErrors[friendId] = 'Unable to send bug notification.');
      }
    } finally {
      _buggingFriendIds.remove(friendId);
      if (mounted) setState(() {});
    }
  }

  Future<void> _addFriend(SearchUser user) async {
    if (_friendIds.contains(user.id) ||
        _addingFriendIds.contains(user.id) ||
        _isLoadingFriends) {
      return;
    }

    setState(() {
      _addingFriendIds.add(user.id);
      _addErrors.remove(user.id);
    });
    try {
      await widget.friendsService.addFriend(
        currentUserId: widget.currentUserId,
        friendId: user.id,
      );
      if (!mounted) return;
      setState(() => _friendIds.add(user.id));
    } on FriendsException catch (error) {
      if (!mounted) return;
      setState(() => _addErrors[user.id] = error.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _addErrors[user.id] = 'Unable to add this bro.');
    } finally {
      if (mounted) setState(() => _addingFriendIds.remove(user.id));
    }
  }

  Future<void> _showAddFriends(BuildContext context) async {
    await showDialog<void>(
      context: context,
      builder: (context) => const _AddFriendsDialog(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _searchController,
                onChanged: _searchUsers,
                textCapitalization: TextCapitalization.none,
                autocorrect: false,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.search),
                  hintText: 'Find your Bro',
                  isDense: true,
                ),
              ),
            ),
            const SizedBox(width: 12),
            FilledButton(
              onPressed: () => _showAddFriends(context),
              style: FilledButton.styleFrom(
                backgroundColor: _red,
                minimumSize: const Size(0, 54),
                padding: const EdgeInsets.symmetric(horizontal: 12),
              ),
              child: const Text('Add Bros'),
            ),
          ],
        ),
        const SizedBox(height: 24),
        if (_searchController.text.trim().isNotEmpty) ...[
          if (_isSearching) const LinearProgressIndicator(color: _red),
          if (_searchError != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(_searchError!, style: const TextStyle(color: _red)),
            ),
          if (_searchError == null && !_isSearching && _results.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text('No matching bros found.'),
            )
          else if (_searchError == null)
            for (final user in _results)
              Card(
                color: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                  side: const BorderSide(color: Color(0xFFDDDDDD)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Material(
                      color: Colors.transparent,
                      child: ListTile(
                        title: Text(
                          user.username,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        subtitle: Text(user.email),
                        trailing: _isLoadingFriends
                            ? const SizedBox.square(
                                dimension: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : _friendsLoadFailed
                            ? const Icon(Icons.error_outline, color: _red)
                            : _friendIds.contains(user.id)
                            ? const Icon(Icons.check, color: _green)
                            : IconButton(
                                tooltip: _addingFriendIds.contains(user.id)
                                    ? 'Adding bro'
                                    : 'Add bro',
                                onPressed: _addingFriendIds.contains(user.id)
                                    ? null
                                    : () => _addFriend(user),
                                icon: _addingFriendIds.contains(user.id)
                                    ? const SizedBox.square(
                                        dimension: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                        ),
                                      )
                                    : const Icon(Icons.add, color: _red),
                              ),
                      ),
                    ),
                    if (_addErrors[user.id] != null)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            _addErrors[user.id]!,
                            style: const TextStyle(color: _red, fontSize: 12),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
        ] else ...[
          if (_isLoadingFriends)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Center(child: CircularProgressIndicator(color: _red)),
            )
          else if (_friendsError != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(_friendsError!, style: const TextStyle(color: _red)),
            )
          else ...[
            _FriendSection(
              title: 'Best Bro',
              subtitle: 'Bugged the most',
              friends: [?_friendsStats?.mostBuggedFriend],
              emptyMessage: 'No best bro yet.',
              deletingFriendIds: _deletingFriendIds,
              buggingFriendIds: _buggingFriendIds,
              deleteErrors: _deleteErrors,
              bugErrors: _bugErrors,
              onDelete: _deleteFriend,
              onBug: _bugFriend,
            ),
            _FriendSection(
              title: 'Streak Bro',
              subtitle: 'Highest streak',
              friends: [?_friendsStats?.highestStreakFriend],
              emptyMessage: 'No streak bro yet.',
              deletingFriendIds: _deletingFriendIds,
              buggingFriendIds: _buggingFriendIds,
              deleteErrors: _deleteErrors,
              bugErrors: _bugErrors,
              onDelete: _deleteFriend,
              onBug: _bugFriend,
            ),
            _FriendSection(
              title: 'Regular Bros',
              friends: _friendsStats?.otherFriends ?? const [],
              emptyMessage: 'No regular bros yet.',
              deletingFriendIds: _deletingFriendIds,
              buggingFriendIds: _buggingFriendIds,
              deleteErrors: _deleteErrors,
              bugErrors: _bugErrors,
              onDelete: _deleteFriend,
              onBug: _bugFriend,
            ),
          ],
        ],
      ],
    );
  }
}

class _FriendSection extends StatelessWidget {
  const _FriendSection({
    required this.title,
    required this.friends,
    required this.emptyMessage,
    required this.deletingFriendIds,
    required this.buggingFriendIds,
    required this.deleteErrors,
    required this.bugErrors,
    required this.onDelete,
    required this.onBug,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final List<FriendDetails> friends;
  final String emptyMessage;
  final Set<String> deletingFriendIds;
  final Set<String> buggingFriendIds;
  final Map<String, String> deleteErrors;
  final Map<String, String> bugErrors;
  final ValueChanged<FriendDetails> onDelete;
  final ValueChanged<FriendDetails> onBug;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          if (subtitle != null) Text(subtitle!),
          const Divider(color: Color(0x8C000000), thickness: 1),
          if (friends.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(
                emptyMessage,
                style: const TextStyle(color: Color(0xFF666666), fontSize: 14),
              ),
            )
          else
            for (final friend in friends)
              _FriendStatRow(
                friend: friend,
                isDeleting: deletingFriendIds.contains(friend.friendId),
                isBugging: buggingFriendIds.contains(friend.friendId),
                error: deleteErrors[friend.friendId],
                bugError: bugErrors[friend.friendId],
                onDelete: () => onDelete(friend),
                onBug: () => onBug(friend),
              ),
        ],
      ),
    );
  }
}

class _FriendStatRow extends StatelessWidget {
  const _FriendStatRow({
    required this.friend,
    required this.isDeleting,
    required this.isBugging,
    required this.onDelete,
    required this.onBug,
    this.error,
    this.bugError,
  });

  final FriendDetails friend;
  final bool isDeleting;
  final bool isBugging;
  final String? error;
  final String? bugError;
  final VoidCallback onDelete;
  final VoidCallback onBug;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  friend.username,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                tooltip: 'Bug ${friend.username}',
                onPressed: isBugging || isDeleting ? null : onBug,
                icon: isBugging
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.bug_report_outlined, color: _red),
              ),
              if (isDeleting)
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                )
              else
                PopupMenuButton<String>(
                  tooltip: 'Bro options',
                  padding: EdgeInsets.zero,
                  onSelected: (value) {
                    if (value == 'delete') onDelete();
                  },
                  itemBuilder: (context) => const [
                    PopupMenuItem<String>(
                      value: 'delete',
                      child: Text('Delete Bro', style: TextStyle(color: _red)),
                    ),
                  ],
                  icon: const Icon(Icons.more_vert, color: Color(0xFF757575)),
                ),
            ],
          ),
          if (error != null)
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                error!,
                style: const TextStyle(color: _red, fontSize: 12),
              ),
            ),
          if (bugError != null)
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                bugError!,
                style: const TextStyle(color: _red, fontSize: 12),
              ),
            ),
        ],
      ),
    );
  }
}

class _AddFriendsDialog extends StatelessWidget {
  const _AddFriendsDialog();

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Add Bros'),
      content: const Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Add a bro using their username.'),
          SizedBox(height: 16),
          TextField(
            decoration: InputDecoration(
              prefixIcon: Icon(Icons.search),
              hintText: 'Find your Bro',
            ),
          ),
        ],
      ),
      actions: [
        FilledButton(
          onPressed: () => Navigator.pop(context),
          style: FilledButton.styleFrom(backgroundColor: _red),
          child: const Text('Close'),
        ),
      ],
    );
  }
}

class _ProfilePage extends StatefulWidget {
  const _ProfilePage({
    required this.user,
    required this.authService,
    required this.scheduleService,
    required this.onScheduleChanged,
    required this.onLogOut,
  });

  final AuthUser user;
  final AuthService authService;
  final ScheduleService scheduleService;
  final VoidCallback onScheduleChanged;
  final VoidCallback onLogOut;

  @override
  State<_ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<_ProfilePage> {
  late AuthUser _profile;
  List<WorkoutSchedule> _schedules = [];
  bool _isLoadingSchedule = true;
  String? _scheduleError;

  @override
  void initState() {
    super.initState();
    _profile = widget.user;
    _loadSchedules();
  }

  Future<void> _loadSchedules() async {
    setState(() {
      _isLoadingSchedule = true;
      _scheduleError = null;
    });
    try {
      final schedules = await widget.scheduleService.fetchSchedules();
      if (!mounted) return;
      setState(() => _schedules = schedules);
    } on ScheduleException catch (error) {
      if (!mounted) return;
      setState(() => _scheduleError = error.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _scheduleError = 'Unable to load your workout schedule.');
    } finally {
      if (mounted) setState(() => _isLoadingSchedule = false);
    }
  }

  Future<void> _editSchedule() async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(
        builder: (_) => _EditSchedulePage(
          service: widget.scheduleService,
          schedules: _schedules,
        ),
      ),
    );
    if (saved == true) {
      widget.onScheduleChanged();
      await _loadSchedules();
    }
  }

  Future<void> _editProfile() async {
    final updatedProfile = await Navigator.of(context).push<AuthUser>(
      MaterialPageRoute<AuthUser>(
        builder: (_) =>
            _EditUserInfoPage(user: _profile, authService: widget.authService),
      ),
    );
    if (updatedProfile != null && mounted) {
      setState(() => _profile = updatedProfile);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _SectionTitle(title: 'Workout Schedule', onEdit: _editSchedule),
        if (_isLoadingSchedule)
          const Padding(
            padding: EdgeInsets.all(16),
            child: Center(child: CircularProgressIndicator(color: _red)),
          )
        else if (_scheduleError != null)
          Padding(
            padding: const EdgeInsets.all(12),
            child: Text(_scheduleError!, style: const TextStyle(color: _red)),
          )
        else if (_schedules.isEmpty)
          const Padding(
            padding: EdgeInsets.all(12),
            child: Text('No workouts scheduled yet.'),
          )
        else
          for (final schedule in _schedules)
            _ProfileWorkout(
              title:
                  '${schedule.dayOfWeek}: ${schedule.startTime} - ${schedule.endTime}, ${schedule.activity}',
            ),
        const SizedBox(height: 24),
        _SectionTitle(title: 'User Information', onEdit: _editProfile),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ProfileInfo(
                  label: 'Name',
                  value: _profile.name.isEmpty ? 'Not set' : _profile.name,
                ),
                _ProfileInfo(label: 'Username', value: _profile.username),
                _ProfileInfo(label: 'Email', value: _profile.email),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        OutlinedButton(
          onPressed: widget.onLogOut,
          child: const Text('Sign Out'),
        ),
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, required this.onEdit});

  final String title;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
        TextButton.icon(
          onPressed: onEdit,
          icon: const Icon(Icons.edit_outlined),
          label: const Text('Edit'),
        ),
      ],
    );
  }
}

class _ProfileWorkout extends StatelessWidget {
  const _ProfileWorkout({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Card(child: ListTile(title: Text(title)));
  }
}

class _ProfileInfo extends StatelessWidget {
  const _ProfileInfo({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Text('$label: $value'),
    );
  }
}

class _EditUserInfoPage extends StatefulWidget {
  const _EditUserInfoPage({required this.user, required this.authService});

  final AuthUser user;
  final AuthService authService;

  @override
  State<_EditUserInfoPage> createState() => _EditUserInfoPageState();
}

class _EditUserInfoPageState extends State<_EditUserInfoPage> {
  final _formKey = GlobalKey<FormState>();
  late final _nameController = TextEditingController(text: widget.user.name);
  late final _usernameController = TextEditingController(
    text: widget.user.username,
  );
  late final _emailController = TextEditingController(text: widget.user.email);
  final _currentPasswordController = TextEditingController();
  final _passwordController = TextEditingController();
  String? _errorMessage;
  bool _isSaving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _currentPasswordController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: _screenTitle('Edit User Information')),
      body: _ContentPanel(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Form(
              key: _formKey,
              child: Column(
                children: [
                  TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(labelText: 'Name'),
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Enter your name.'
                        : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _usernameController,
                    decoration: const InputDecoration(labelText: 'Username'),
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Enter your username.'
                        : null,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _emailController,
                    readOnly: true,
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      helperText: 'Email cannot be changed here.',
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _currentPasswordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Current password',
                    ),
                    validator: (value) => value == null || value.isEmpty
                        ? 'Enter your current password to save changes.'
                        : null,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'New password (optional)',
                    ),
                  ),
                  if (_errorMessage != null) ...[
                    const SizedBox(height: 16),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: _red),
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: _isSaving ? null : _save,
                    style: FilledButton.styleFrom(backgroundColor: _red),
                    child: _isSaving
                        ? const SizedBox.square(
                            dimension: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Save'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });
    try {
      final user = await widget.authService.updateProfile(
        name: _nameController.text.trim(),
        username: _usernameController.text.trim(),
        currentPassword: _currentPasswordController.text,
        newPassword: _passwordController.text,
      );
      if (mounted) Navigator.pop(context, user);
    } on AuthException catch (error) {
      if (mounted) setState(() => _errorMessage = error.message);
    } catch (_) {
      if (mounted) {
        setState(() => _errorMessage = 'Unable to save your profile.');
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }
}

class _EditSchedulePage extends StatefulWidget {
  const _EditSchedulePage({required this.service, required this.schedules});

  final ScheduleService service;
  final List<WorkoutSchedule> schedules;

  @override
  State<_EditSchedulePage> createState() => _EditSchedulePageState();
}

class _EditSchedulePageState extends State<_EditSchedulePage> {
  static const _days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  final _formKey = GlobalKey<FormState>();
  late final List<_ScheduleDraft> _drafts;
  String? _errorMessage;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _drafts = widget.schedules.map(_ScheduleDraft.fromSchedule).toList();
  }

  @override
  void dispose() {
    for (final draft in _drafts) {
      draft.dispose();
    }
    super.dispose();
  }

  void _addDraft() => setState(() => _drafts.add(_ScheduleDraft.empty()));

  Future<void> _removeDraft(_ScheduleDraft draft) async {
    if (draft.id != null) {
      setState(() => _isSaving = true);
      try {
        await widget.service.deleteSchedule(draft.id!);
      } on ScheduleException catch (error) {
        if (mounted) setState(() => _errorMessage = error.message);
        return;
      } finally {
        if (mounted) setState(() => _isSaving = false);
      }
    }
    if (!mounted) return;
    setState(() => _drafts.remove(draft));
    draft.dispose();
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });
    try {
      for (final draft in _drafts) {
        final values = {
          'dayOfWeek': draft.dayOfWeek,
          'startTime': draft.startTimeController.text.trim(),
          'endTime': draft.endTimeController.text.trim(),
          'activity': draft.activityController.text.trim(),
        };
        if (draft.id == null) {
          final created = await widget.service.createSchedule(
            dayOfWeek: values['dayOfWeek']!,
            startTime: values['startTime']!,
            endTime: values['endTime']!,
            activity: values['activity']!,
          );
          draft.id = created.id;
        } else {
          await widget.service.updateSchedule(
            id: draft.id!,
            dayOfWeek: values['dayOfWeek']!,
            startTime: values['startTime']!,
            endTime: values['endTime']!,
            activity: values['activity']!,
          );
        }
      }
      if (mounted) Navigator.pop(context, true);
    } on ScheduleException catch (error) {
      if (mounted) setState(() => _errorMessage = error.message);
    } catch (_) {
      if (mounted) {
        setState(() => _errorMessage = 'Unable to save your workout schedule.');
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: _screenTitle('Edit Schedule')),
      body: _ContentPanel(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text('Edit your workout days and activities.'),
            const SizedBox(height: 16),
            Form(
              key: _formKey,
              child: Column(
                children: [
                  for (final draft in _drafts)
                    _ScheduleDraftFields(
                      draft: draft,
                      days: _days,
                      enabled: !_isSaving,
                      onDelete: () => _removeDraft(draft),
                    ),
                ],
              ),
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: _isSaving ? null : _addDraft,
                icon: const Icon(Icons.add),
                label: const Text('Add workout'),
              ),
            ),
            if (_errorMessage != null)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  _errorMessage!,
                  style: const TextStyle(color: _red),
                ),
              ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _isSaving ? null : _save,
              style: FilledButton.styleFrom(backgroundColor: _red),
              child: _isSaving
                  ? const SizedBox.square(
                      dimension: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ScheduleDraft {
  _ScheduleDraft({
    this.id,
    required this.dayOfWeek,
    required String startTime,
    required String endTime,
    required String activity,
  }) : startTimeController = TextEditingController(text: startTime),
       endTimeController = TextEditingController(text: endTime),
       activityController = TextEditingController(text: activity);

  factory _ScheduleDraft.fromSchedule(WorkoutSchedule schedule) =>
      _ScheduleDraft(
        id: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        activity: schedule.activity,
      );

  factory _ScheduleDraft.empty() => _ScheduleDraft(
    dayOfWeek: 'Monday',
    startTime: '',
    endTime: '',
    activity: '',
  );

  String? id;
  String dayOfWeek;
  final TextEditingController startTimeController;
  final TextEditingController endTimeController;
  final TextEditingController activityController;

  void dispose() {
    startTimeController.dispose();
    endTimeController.dispose();
    activityController.dispose();
  }
}

class _ScheduleDraftFields extends StatelessWidget {
  const _ScheduleDraftFields({
    required this.draft,
    required this.days,
    required this.enabled,
    required this.onDelete,
  });

  final _ScheduleDraft draft;
  final List<String> days;
  final bool enabled;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: const BorderSide(color: Color(0xFFCCCCCC)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: draft.dayOfWeek,
                    decoration: const InputDecoration(labelText: 'Day'),
                    items: days
                        .map(
                          (day) =>
                              DropdownMenuItem(value: day, child: Text(day)),
                        )
                        .toList(),
                    onChanged: enabled
                        ? (day) {
                            if (day != null) draft.dayOfWeek = day;
                          }
                        : null,
                  ),
                ),
                IconButton(
                  tooltip: 'Delete workout',
                  onPressed: enabled ? onDelete : null,
                  icon: const Icon(Icons.delete_outline, color: _red),
                ),
              ],
            ),
            TextFormField(
              controller: draft.startTimeController,
              enabled: enabled,
              decoration: const InputDecoration(labelText: 'Start Time'),
              validator: _validateTime,
            ),
            TextFormField(
              controller: draft.endTimeController,
              enabled: enabled,
              decoration: const InputDecoration(labelText: 'End Time'),
              validator: _validateTime,
            ),
            TextFormField(
              controller: draft.activityController,
              enabled: enabled,
              decoration: const InputDecoration(labelText: 'Activity'),
              validator: (value) => value == null || value.trim().isEmpty
                  ? 'Enter an activity.'
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  String? _validateTime(String? value) {
    if (value == null ||
        !RegExp(
          r'^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$',
          caseSensitive: false,
        ).hasMatch(value.trim())) {
      return 'Use a time like 9:30 AM.';
    }
    return null;
  }
}

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: _screenTitle('Forgot Password?')),
      body: _ContentPanel(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const Text(
              "Enter email below and we'll send you a password reset link.",
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () {},
              style: FilledButton.styleFrom(backgroundColor: _red),
              child: const Text('Send'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Back'),
            ),
          ],
        ),
      ),
    );
  }
}
