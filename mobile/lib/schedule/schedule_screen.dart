import 'package:flutter/material.dart';

import 'schedule_service.dart';

const _daysOfWeek = <String>[
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({
    super.key,
    required this.username,
    required this.scheduleService,
    required this.onLogOut,
  });

  final String username;
  final ScheduleService scheduleService;
  final VoidCallback onLogOut;

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  List<ScheduleEntry> _schedules = [];
  bool _isLoading = true;
  bool _isSaving = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadSchedules();
  }

  Future<void> _loadSchedules({bool showLoading = true}) async {
    if (showLoading) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    try {
      final schedules = await widget.scheduleService.getSchedules();
      if (!mounted) return;
      schedules.sort(_compareSchedules);
      setState(() {
        _schedules = schedules;
        _errorMessage = null;
        _isLoading = false;
      });
    } on ScheduleException catch (error) {
      if (!mounted) return;
      setState(() {
        _errorMessage = error.message;
        _isLoading = false;
      });
    }
  }

  int _compareSchedules(ScheduleEntry first, ScheduleEntry second) {
    final dayComparison = _daysOfWeek
        .indexOf(first.dayOfWeek)
        .compareTo(_daysOfWeek.indexOf(second.dayOfWeek));
    return dayComparison != 0
        ? dayComparison
        : first.startTime.compareTo(second.startTime);
  }

  Future<void> _createSchedule() async {
    final data = await _showEditor();
    if (data == null || !mounted) return;

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });
    try {
      final created = await widget.scheduleService.createSchedule(
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        activity: data.activity,
      );
      if (!mounted) return;
      setState(() {
        _schedules = [..._schedules, created]..sort(_compareSchedules);
      });
      _showMessage('Workout added to your schedule.');
    } on ScheduleException catch (error) {
      if (mounted) setState(() => _errorMessage = error.message);
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _editSchedule(ScheduleEntry entry) async {
    final data = await _showEditor(entry: entry);
    if (data == null || !mounted) return;

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });
    try {
      final updated = await widget.scheduleService.updateSchedule(
        entry.id,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        activity: data.activity,
      );
      if (!mounted) return;
      setState(() {
        _schedules = [
          for (final schedule in _schedules)
            if (schedule.id == updated.id) updated else schedule,
        ]..sort(_compareSchedules);
      });
      _showMessage('Workout updated.');
    } on ScheduleException catch (error) {
      if (mounted) setState(() => _errorMessage = error.message);
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _deleteSchedule(ScheduleEntry entry) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete workout?'),
        content: Text('Remove "${entry.activity}" from your schedule?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });
    try {
      await widget.scheduleService.deleteSchedule(entry.id);
      if (!mounted) return;
      setState(() {
        _schedules = _schedules
            .where((schedule) => schedule.id != entry.id)
            .toList();
      });
      _showMessage('Workout deleted.');
    } on ScheduleException catch (error) {
      if (mounted) setState(() => _errorMessage = error.message);
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<_ScheduleFormData?> _showEditor({ScheduleEntry? entry}) {
    return showDialog<_ScheduleFormData>(
      context: context,
      builder: (context) => _ScheduleEditorDialog(entry: entry),
    );
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My schedule'),
        actions: [
          IconButton(
            tooltip: 'Sign out',
            onPressed: widget.onLogOut,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _isSaving ? null : _createSchedule,
        icon: const Icon(Icons.add),
        label: const Text('Add workout'),
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: Text(
                'Plan your week, ${widget.username}.',
                style: Theme.of(context).textTheme.titleLarge
                    ?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
            if (_errorMessage != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _ScheduleError(
                  message: _errorMessage!,
                  onRetry: _isLoading ? null : () => _loadSchedules(),
                ),
              ),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : RefreshIndicator(
                      onRefresh: () => _loadSchedules(showLoading: false),
                      child: _schedules.isEmpty
                          ? ListView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              children: const [
                                SizedBox(height: 100),
                                Icon(
                                  Icons.event_note,
                                  size: 52,
                                  color: Colors.white54,
                                ),
                                SizedBox(height: 16),
                                Center(
                                  child: Text(
                                    'No workouts yet. Add one to plan your week.',
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                              ],
                            )
                          : ListView.separated(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
                              physics: const AlwaysScrollableScrollPhysics(),
                              itemCount: _schedules.length,
                              separatorBuilder: (_, _) =>
                                  const SizedBox(height: 10),
                              itemBuilder: (context, index) {
                                final entry = _schedules[index];
                                return _ScheduleCard(
                                  entry: entry,
                                  enabled: !_isSaving,
                                  onEdit: () => _editSchedule(entry),
                                  onDelete: () => _deleteSchedule(entry),
                                );
                              },
                            ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ScheduleCard extends StatelessWidget {
  const _ScheduleCard({
    required this.entry,
    required this.enabled,
    required this.onEdit,
    required this.onDelete,
  });

  final ScheduleEntry entry;
  final bool enabled;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
        leading: const CircleAvatar(
          backgroundColor: Color(0xFF293324),
          child: Icon(Icons.fitness_center, color: Color(0xFFB6F36A)),
        ),
        title: Text(
          entry.activity,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          '${entry.dayOfWeek}  •  ${entry.startTime} – ${entry.endTime}',
        ),
        trailing: PopupMenuButton<String>(
          enabled: enabled,
          tooltip: 'Workout actions',
          onSelected: (action) {
            if (action == 'edit') onEdit();
            if (action == 'delete') onDelete();
          },
          itemBuilder: (context) => const [
            PopupMenuItem(value: 'edit', child: Text('Edit')),
            PopupMenuItem(value: 'delete', child: Text('Delete')),
          ],
        ),
      ),
    );
  }
}

class _ScheduleError extends StatelessWidget {
  const _ScheduleError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).colorScheme.errorContainer,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message),
            if (onRetry != null)
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: onRetry,
                  child: const Text('Retry'),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ScheduleFormData {
  const _ScheduleFormData({
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    required this.activity,
  });

  final String dayOfWeek;
  final String startTime;
  final String endTime;
  final String activity;
}

class _ScheduleEditorDialog extends StatefulWidget {
  const _ScheduleEditorDialog({this.entry});

  final ScheduleEntry? entry;

  @override
  State<_ScheduleEditorDialog> createState() => _ScheduleEditorDialogState();
}

class _ScheduleEditorDialogState extends State<_ScheduleEditorDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _startTimeController;
  late final TextEditingController _endTimeController;
  late final TextEditingController _activityController;
  late String _dayOfWeek;

  @override
  void initState() {
    super.initState();
    final entry = widget.entry;
    _dayOfWeek = entry?.dayOfWeek ?? _daysOfWeek.first;
    _startTimeController = TextEditingController(text: entry?.startTime ?? '');
    _endTimeController = TextEditingController(text: entry?.endTime ?? '');
    _activityController = TextEditingController(text: entry?.activity ?? '');
  }

  @override
  void dispose() {
    _startTimeController.dispose();
    _endTimeController.dispose();
    _activityController.dispose();
    super.dispose();
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    Navigator.pop(
      context,
      _ScheduleFormData(
        dayOfWeek: _dayOfWeek,
        startTime: _startTimeController.text.trim(),
        endTime: _endTimeController.text.trim(),
        activity: _activityController.text.trim(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.entry != null;
    return AlertDialog(
      title: Text(isEditing ? 'Edit workout' : 'Add workout'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                initialValue: _dayOfWeek,
                decoration: const InputDecoration(labelText: 'Day'),
                items: [
                  for (final day in _daysOfWeek)
                    DropdownMenuItem(value: day, child: Text(day)),
                ],
                onChanged: (day) {
                  if (day != null) setState(() => _dayOfWeek = day);
                },
                validator: validateScheduleDay,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _startTimeController,
                decoration: const InputDecoration(
                  labelText: 'Start time',
                  hintText: '6:30 PM',
                ),
                textCapitalization: TextCapitalization.characters,
                validator: validateScheduleTime,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _endTimeController,
                decoration: const InputDecoration(
                  labelText: 'End time',
                  hintText: '7:30 PM',
                ),
                textCapitalization: TextCapitalization.characters,
                validator: validateScheduleTime,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _activityController,
                decoration: const InputDecoration(
                  labelText: 'Workout',
                  hintText: 'Strength training',
                ),
                textCapitalization: TextCapitalization.sentences,
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Enter a workout'
                    : null,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _save,
          child: Text(isEditing ? 'Save changes' : 'Add workout'),
        ),
      ],
    );
  }
}
