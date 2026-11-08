//AI-assisted: Initial implementation suggested by Copilot (reviewed and modified)
import 'package:flutter/material.dart';

import '../auth/auth_service.dart';

const _red = Color(0xFFB31517);

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.user, required this.onLogOut});

  final AuthUser user;
  final VoidCallback onLogOut;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
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
      body: IndexedStack(
        index: _tab,
        children: [
          _HomePage(onShowFriends: () => setState(() => _tab = 1)),
          const _FriendsPage(),
          _ProfilePage(onLogOut: widget.onLogOut),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (index) => setState(() => _tab = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
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
    );
  }
}

class _HomePage extends StatelessWidget {
  const _HomePage({required this.onShowFriends});

  final VoidCallback onShowFriends;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          "Here's your schedule for the day.",
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        const SizedBox(height: 12),
        const _WorkoutCard(
          title: 'Tuesday: 12:00pm - 1:00pm, Swim',
          completed: false,
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
            TextButton(onPressed: onShowFriends, child: const Text('See all')),
          ],
        ),
        const Text(
          "Check in on your bros and make sure they're keeping up with their workouts!",
        ),
        const SizedBox(height: 12),
        const _FriendWorkoutCard(
          name: 'Mikayla',
          detail: '9:00am - 10:30am, Walk',
          overdue: true,
        ),
        const _FriendWorkoutCard(
          name: 'Katie',
          detail: '10:00am - 11:30am, Tennis',
          completed: true,
        ),
        const _FriendWorkoutCard(
          name: 'Melinda',
          detail: '11:30am - 12:30pm, Run',
        ),
      ],
    );
  }
}

class _WorkoutCard extends StatefulWidget {
  const _WorkoutCard({required this.title, required this.completed});

  final String title;
  final bool completed;

  @override
  State<_WorkoutCard> createState() => _WorkoutCardState();
}

class _WorkoutCardState extends State<_WorkoutCard> {
  late bool _checked = widget.completed;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: CheckboxListTile(
        value: _checked,
        onChanged: (value) => setState(() => _checked = value ?? false),
        title: Text(widget.title),
      ),
    );
  }
}

class _FriendWorkoutCard extends StatelessWidget {
  const _FriendWorkoutCard({
    required this.name,
    required this.detail,
    this.overdue = false,
    this.completed = false,
  });

  final String name;
  final String detail;
  final bool overdue;
  final bool completed;

  @override
  Widget build(BuildContext context) {
    final color = overdue
        ? const Color(0xFFFF9294)
        : completed
        ? const Color(0xFFC7F4AA)
        : Theme.of(context).cardColor;
    return Card(
      color: color,
      child: ListTile(
        title: Text('$name: $detail'),
        trailing: Icon(
          overdue
              ? Icons.bug_report_outlined
              : completed
              ? Icons.celebration_outlined
              : Icons.fitness_center,
        ),
      ),
    );
  }
}

class _FriendsPage extends StatelessWidget {
  const _FriendsPage();

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
                readOnly: true,
                onTap: () => _showAddFriends(context),
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.search),
                  hintText: 'Find your Bro',
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
        const _FriendSection(title: 'Best Bro', subtitle: 'Bugged the most'),
        const _FriendSection(title: 'Streak Bro', subtitle: 'Highest Streak'),
        const _FriendSection(title: 'Regular Bros'),
      ],
    );
  }
}

class _FriendSection extends StatelessWidget {
  const _FriendSection({required this.title, this.subtitle});

  final String title;
  final String? subtitle;

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
          const Divider(color: _red, thickness: 2),
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

class _ProfilePage extends StatelessWidget {
  const _ProfilePage({required this.onLogOut});

  final VoidCallback onLogOut;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _SectionTitle(
          title: 'Workout Schedule',
          onEdit: () => Navigator.of(context).push(
            MaterialPageRoute<void>(builder: (_) => const _EditSchedulePage()),
          ),
        ),
        const _ProfileWorkout(title: 'Monday: 10:00am - 11:00am, Tennis'),
        const _ProfileWorkout(title: 'Monday: 12:00pm - 1:00pm, Swim'),
        const _ProfileWorkout(title: 'Tuesday: 4:00pm - 5:00pm, Run'),
        const _ProfileWorkout(title: 'Thursday: 12:00pm - 1:00pm, Swim'),
        const SizedBox(height: 24),
        _SectionTitle(
          title: 'User Information',
          onEdit: () => Navigator.of(context).push(
            MaterialPageRoute<void>(builder: (_) => const _EditUserInfoPage()),
          ),
        ),
        const Card(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ProfileInfo(label: 'Name', value: 'John Gymborough'),
                _ProfileInfo(label: 'Username', value: 'Jymbro20'),
                _ProfileInfo(label: 'Email', value: 'johnGym@gmail.com'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        OutlinedButton(onPressed: onLogOut, child: const Text('Sign Out')),
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
  const _EditUserInfoPage();

  @override
  State<_EditUserInfoPage> createState() => _EditUserInfoPageState();
}

class _EditUserInfoPageState extends State<_EditUserInfoPage> {
  final _nameController = TextEditingController(text: 'John Gymborough');
  final _usernameController = TextEditingController(text: 'Jymbro20');
  final _emailController = TextEditingController(text: 'johnGym@gmail.com');
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit User Information')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(labelText: 'Name'),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _usernameController,
            decoration: const InputDecoration(labelText: 'Username'),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _emailController,
            decoration: const InputDecoration(labelText: 'Email'),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _passwordController,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Password'),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () => Navigator.pop(context),
            style: FilledButton.styleFrom(backgroundColor: _red),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

class _EditSchedulePage extends StatefulWidget {
  const _EditSchedulePage();

  @override
  State<_EditSchedulePage> createState() => _EditSchedulePageState();
}

class _EditSchedulePageState extends State<_EditSchedulePage> {
  static const _days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];

  final Set<String> _selectedDays = {};
  final Map<String, int> _itemCounts = {};

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Schedule')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Select your workout days and input times for each of your activities.',
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            children: _days
                .map(
                  (day) => FilterChip(
                    label: Text(day),
                    selected: _selectedDays.contains(day),
                    onSelected: (checked) => setState(() {
                      if (checked) {
                        _selectedDays.add(day);
                      } else {
                        _selectedDays.remove(day);
                      }
                    }),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 16),
          for (final day in _days)
            if (_selectedDays.contains(day)) ...[
              Row(
                children: [
                  Expanded(
                    child: Text(
                      day,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  IconButton(
                    tooltip: 'Add activity',
                    onPressed: () => setState(
                      () => _itemCounts[day] = (_itemCounts[day] ?? 0) + 1,
                    ),
                    icon: const Icon(Icons.add_circle_outline),
                  ),
                ],
              ),
              for (var index = 0; index < (_itemCounts[day] ?? 0); index++)
                const _ScheduleItemFields(),
            ],
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () => Navigator.pop(context),
            style: FilledButton.styleFrom(backgroundColor: _red),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

class _ScheduleItemFields extends StatelessWidget {
  const _ScheduleItemFields();

  @override
  Widget build(BuildContext context) {
    return const Card(
      child: Padding(
        padding: EdgeInsets.all(12),
        child: Column(
          children: [
            TextField(decoration: InputDecoration(labelText: 'Start Time')),
            TextField(decoration: InputDecoration(labelText: 'End Time')),
            TextField(decoration: InputDecoration(labelText: 'Activity')),
          ],
        ),
      ),
    );
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
      appBar: AppBar(title: const Text('Forgot Password?')),
      body: ListView(
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
    );
  }
}
