import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import 'package:flutter/services.dart';
import '../../../core/utils/helpers.dart';
import '../../../data/services/services.dart';
import '../../../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  // Pages: login, signup, choose, createRoom, joinRoom, joinWait, joinApproved, joinRejected
  String _page = 'login';
  bool _showPwd = false;
  String _error = '';
  bool _loading = false;

  // Join room state
  Map<String, dynamic>? _joinRoom;
  int? _joinRequestId;
  Timer? _pollTimer;

  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _pwdCtrl = TextEditingController();
  final _roomNameCtrl = TextEditingController();
  final _roomCodeCtrl = TextEditingController();

  void _go(String page) => setState(() { _page = page; _error = ''; });

  // ─── LOGIN ───
  Future<void> _login() async {
    if (_emailCtrl.text.trim().isEmpty || _pwdCtrl.text.isEmpty) {
      setState(() => _error = 'Please fill all fields'); return;
    }
    setState(() { _error = ''; _loading = true; });
    try {
      await ref.read(authProvider.notifier).login(_emailCtrl.text.trim(), _pwdCtrl.text);
      if (!mounted) return;
      final s = ref.read(authProvider);
      if (s.hasError) setState(() { _error = s.error.toString().replaceFirst('Exception: ', ''); _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  // ─── SIGNUP → CHOOSE ───
  void _signupNext() {
    final name = _nameCtrl.text.trim();
    final email = _emailCtrl.text.trim();
    final pwd = _pwdCtrl.text;
    if (name.isEmpty || email.isEmpty || pwd.isEmpty) { setState(() => _error = 'Please fill all fields'); return; }
    if (pwd.length < 6) { setState(() => _error = 'Password must be at least 6 characters'); return; }
    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email)) { setState(() => _error = 'Enter a valid email'); return; }
    _go('choose');
  }

  // ─── CREATE ROOM ───
  Future<void> _createRoom() async {
    if (_roomNameCtrl.text.trim().isEmpty) { setState(() => _error = 'Enter a room name'); return; }
    setState(() { _error = ''; _loading = true; });
    try {
      final name = _nameCtrl.text.trim();
      final email = _emailCtrl.text.trim();
      final pwd = _pwdCtrl.text;
      final roomName = _roomNameCtrl.text.trim();
      final roomCode = _roomCodeCtrl.text.trim().isNotEmpty
          ? _roomCodeCtrl.text.trim().toUpperCase()
          : Helpers.generateInviteCode(roomName);

      // Signup
      await ref.read(authProvider.notifier).signup(name, email, pwd);
      // Create room
      await RoomService().createRoom(roomName, code: roomCode);
      await ref.read(authProvider.notifier).refresh();
    } catch (e) {
      if (mounted) setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  // ─── JOIN ROOM: verify code ───
  Future<void> _verifyCode() async {
    final code = _roomCodeCtrl.text.trim().toUpperCase();
    if (code.isEmpty) { setState(() => _error = 'Enter a room code'); return; }
    if (code.length < 4) { setState(() => _error = 'Code must be at least 4 characters'); return; }
    setState(() { _error = ''; _loading = true; });
    try {
      final rooms = await SupabaseDB.client.from('rooms').select().ilike('invite_code', code);
      if (rooms.isEmpty) { setState(() { _error = 'No room found with this code'; _loading = false; }); return; }
      setState(() { _joinRoom = rooms.first; _loading = false; });
      // Send join request
      await _sendJoinRequest();
    } catch (e) {
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  Future<void> _sendJoinRequest() async {
    setState(() { _error = ''; _loading = true; });
    try {
      final req = await SupabaseDB.createJoinRequest({
        'room_id': _joinRoom!['id'] as int,
        'name': _nameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'status': 'pending',
      });
      _joinRequestId = req['id'] as int;
      setState(() { _page = 'joinWait'; _loading = false; });
      _startPolling();
    } catch (e) {
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) => _checkStatus());
  }

  Future<void> _checkStatus() async {
    if (_joinRoom == null) return;
    try {
      final r = await SupabaseDB.getJoinRequestByEmail(_emailCtrl.text.trim(), _joinRoom!['id'] as int);
      if (r == null) return;
      if (r['status'] == 'approved' && mounted) { _pollTimer?.cancel(); _go('joinApproved'); }
      if (r['status'] == 'rejected' && mounted) { _pollTimer?.cancel(); _go('joinRejected'); }
    } catch (_) {}
  }

  Future<void> _completeJoin() async {
    setState(() { _loading = true; _error = ''; });
    try {
      final res = await SupabaseDB.client.auth.signUp(
        email: _emailCtrl.text.trim(), password: _pwdCtrl.text, data: {'name': _nameCtrl.text.trim()},
      );
      if (res.user == null) throw Exception('Signup failed');
      await SupabaseDB.client.from('profiles').upsert({
        'id': res.user!.id, 'name': _nameCtrl.text.trim(), 'email': _emailCtrl.text.trim(), 'role': 'member',
      });
      await RoomService().joinRoom(_roomCodeCtrl.text.trim());
      await ref.read(authProvider.notifier).refresh();
      if (mounted) setState(() => _loading = false);
    } catch (e) {
      if (mounted) setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  @override
  void dispose() { _pollTimer?.cancel(); _nameCtrl.dispose(); _emailCtrl.dispose(); _pwdCtrl.dispose(); _roomNameCtrl.dispose(); _roomCodeCtrl.dispose(); super.dispose(); }

  // ═══════════════════════════════════════════
  //                    BUILD
  // ═══════════════════════════════════════════
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(child: Center(child: SingleChildScrollView(
        padding: const EdgeInsets.all(28),
        child: Column(children: [
          // Logo
          ClipRRect(borderRadius: BorderRadius.circular(22), child: Image.asset('assets/images/logo.png.jpeg', width: 80, height: 80, fit: BoxFit.cover)),
          const SizedBox(height: 16),
          Text('RoomSync', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          Text('SMART HOSTEL AUTOMATION', style: TextStyle(fontSize: 10, letterSpacing: 2, color: AppColors.textMuted)),
          const SizedBox(height: 28),

          // Card
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.cardBg, borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.border),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 4))],
            ),
            child: _buildPage(),
          ),

          const SizedBox(height: 24),
          Text('Built for the way roommates actually live.', style: TextStyle(color: AppColors.textLight, fontSize: 11, fontStyle: FontStyle.italic)),
        ]),
      ))),
    );
  }

  Widget _buildPage() {
    switch (_page) {
      case 'login': return _loginPage();
      case 'signup': return _signupPage();
      case 'choose': return _choosePage();
      case 'createRoom': return _createRoomPage();
      case 'joinRoom': return _joinRoomPage();
      case 'joinWait': return _joinWaitPage();
      case 'joinApproved': return _joinApprovedPage();
      case 'joinRejected': return _joinRejectedPage();
      default: return _loginPage();
    }
  }

  // ═══════════════ LOGIN PAGE ═══════════════
  Widget _loginPage() => Column(children: [
    const Text('Welcome Back', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
    const SizedBox(height: 4),
    Text('Sign in to your account', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
    const SizedBox(height: 24),
    _field(_emailCtrl, 'Email address', Icons.mail_outline),
    const SizedBox(height: 14),
    _field(_pwdCtrl, 'Password', Icons.lock_outline, obscure: !_showPwd, suffix: _eyeBtn()),
    _errWidget(),
    const SizedBox(height: 24),
    _actionBtn('Login', _login),
    const SizedBox(height: 20),
    Row(mainAxisAlignment: MainAxisAlignment.center, children: [
      Text("Don't have an account? ", style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
      GestureDetector(
        onTap: () { _emailCtrl.clear(); _pwdCtrl.clear(); _nameCtrl.clear(); _go('signup'); },
        child: const Text('Sign Up', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.primary)),
      ),
    ]),
  ]);

  // ═══════════════ SIGNUP PAGE ═══════════════
  Widget _signupPage() => Column(children: [
    const Text('Create Account', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
    const SizedBox(height: 4),
    Text('Fill in your details', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
    const SizedBox(height: 24),
    _field(_nameCtrl, 'Full Name', Icons.person_outline),
    const SizedBox(height: 14),
    _field(_emailCtrl, 'Email address', Icons.mail_outline),
    const SizedBox(height: 14),
    _field(_pwdCtrl, 'Password', Icons.lock_outline, obscure: !_showPwd, suffix: _eyeBtn()),
    _errWidget(),
    const SizedBox(height: 24),
    _actionBtn('Next', _signupNext),
    const SizedBox(height: 20),
    Row(mainAxisAlignment: MainAxisAlignment.center, children: [
      Text('Already have an account? ', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
      GestureDetector(
        onTap: () { _emailCtrl.clear(); _pwdCtrl.clear(); _nameCtrl.clear(); _go('login'); },
        child: const Text('Login', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.primary)),
      ),
    ]),
  ]);

  // ═══════════════ CHOOSE: CREATE OR JOIN ═══════════════
  Widget _choosePage() => Column(children: [
    // User info badge
    Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.pastelGreen, borderRadius: BorderRadius.circular(14)),
      child: Row(children: [
        const Icon(Icons.check_circle, color: AppColors.success, size: 20),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(_nameCtrl.text.trim(), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          Text(_emailCtrl.text.trim(), style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
        ])),
      ]),
    ),
    const SizedBox(height: 24),
    const Text('What would you like to do?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
    const SizedBox(height: 6),
    Text('Create a new room or join an existing one', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
    const SizedBox(height: 28),

    // Create Room card
    GestureDetector(
      onTap: () => _go('createRoom'),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: AppColors.pastelTeal, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.primary.withOpacity(0.3))),
        child: Row(children: [
          Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.add_home_outlined, color: AppColors.primary, size: 24)),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Create a Room', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('Start your own hostel room', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
          ])),
          Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.textMuted),
        ]),
      ),
    ),
    const SizedBox(height: 16),

    // Join Room card
    GestureDetector(
      onTap: () => _go('joinRoom'),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: AppColors.pastelBlue, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.info.withOpacity(0.3))),
        child: Row(children: [
          Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: AppColors.info.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.group_add_outlined, color: AppColors.info, size: 24)),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Join a Room', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('Enter an invite code', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
          ])),
          Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.textMuted),
        ]),
      ),
    ),

    const SizedBox(height: 20),
    TextButton(onPressed: () => _go('signup'), child: Text('Back', style: TextStyle(color: AppColors.textMuted))),
  ]);

  // ═══════════════ CREATE ROOM ═══════════════
  Widget _createRoomPage() => Column(children: [
    const Icon(Icons.add_home_outlined, size: 32, color: AppColors.primary),
    const SizedBox(height: 12),
    const Text('Create Your Room', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
    const SizedBox(height: 4),
    Text('Set up your hostel room', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
    const SizedBox(height: 24),
    _field(_roomNameCtrl, 'Room Name (e.g. The Printing House)', Icons.meeting_room_outlined),
    const SizedBox(height: 14),
    _field(_roomCodeCtrl, 'Invite Code (optional, auto-generated)', Icons.vpn_key_outlined),
    _errWidget(),
    const SizedBox(height: 24),
    _actionBtn('Create Room', _createRoom),
    const SizedBox(height: 12),
    TextButton(onPressed: () => _go('choose'), child: Text('Back', style: TextStyle(color: AppColors.textMuted))),
  ]);

  // ═══════════════ JOIN ROOM ═══════════════
  Widget _joinRoomPage() => Column(children: [
    const Icon(Icons.vpn_key_outlined, size: 32, color: AppColors.info),
    const SizedBox(height: 12),
    const Text('Join a Room', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
    const SizedBox(height: 4),
    Text('Enter the invite code from your roommate', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
    const SizedBox(height: 24),
    TextField(
      controller: _roomCodeCtrl,
      textCapitalization: TextCapitalization.characters,
      textAlign: TextAlign.center,
      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: 4, color: AppColors.textPrimary),
      decoration: InputDecoration(
        hintText: 'ENTER CODE', hintStyle: TextStyle(fontSize: 18, color: AppColors.textLight, letterSpacing: 4),
        filled: true, fillColor: AppColors.inputBg,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: AppColors.border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: AppColors.border)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
        contentPadding: const EdgeInsets.symmetric(vertical: 20),
      ),
    ),
    _errWidget(),
    const SizedBox(height: 24),
    _actionBtn('Join Room', _verifyCode),
    const SizedBox(height: 12),
    TextButton(onPressed: () => _go('choose'), child: Text('Back', style: TextStyle(color: AppColors.textMuted))),
  ]);

  // ═══════════════ WAITING ═══════════════
  Widget _joinWaitPage() => Column(children: [
    Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: AppColors.pastelBlue, shape: BoxShape.circle),
      child: const Icon(Icons.hourglass_top_rounded, size: 40, color: AppColors.info)),
    const SizedBox(height: 20),
    const Text('Request Sent!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
    const SizedBox(height: 8),
    Text('Waiting for admin approval...', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
    const SizedBox(height: 24),
    Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppColors.inputBg, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _infoRow('Room', _joinRoom?['name'] ?? ''),
        const SizedBox(height: 8),
        _infoRow('Name', _nameCtrl.text.trim()),
        const SizedBox(height: 8),
        _infoRow('Email', _emailCtrl.text.trim()),
      ]),
    ),
    const SizedBox(height: 24),
    SizedBox(height: 40, child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
      SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
      const SizedBox(width: 12),
      Text('Checking status...', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
    ])),
    const SizedBox(height: 16),
    TextButton(onPressed: () { _pollTimer?.cancel(); _go('joinRoom'); },
      child: Text('Cancel', style: TextStyle(color: AppColors.error, fontSize: 13))),
  ]);

  // ═══════════════ APPROVED ═══════════════
  Widget _joinApprovedPage() => Column(children: [
    Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: AppColors.pastelGreen, shape: BoxShape.circle),
      child: const Icon(Icons.check_circle_outline, size: 48, color: AppColors.success)),
    const SizedBox(height: 20),
    const Text('Approved!', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.success)),
    const SizedBox(height: 8),
    Text('Welcome to ${_joinRoom?['name'] ?? 'the room'}!', style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
    _errWidget(),
    const SizedBox(height: 24),
    _actionBtn('Join Now', _completeJoin),
  ]);

  // ═══════════════ REJECTED ═══════════════
  Widget _joinRejectedPage() => Column(children: [
    Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: AppColors.pastelPink, shape: BoxShape.circle),
      child: const Icon(Icons.cancel_outlined, size: 48, color: AppColors.error)),
    const SizedBox(height: 20),
    const Text('Request Rejected', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.error)),
    const SizedBox(height: 8),
    Text('The room admin rejected your request.', style: TextStyle(fontSize: 13, color: AppColors.textMuted), textAlign: TextAlign.center),
    const SizedBox(height: 24),
    _actionBtn('Try Again', () => _go('joinRoom')),
  ]);

  // ═══════════════ SHARED WIDGETS ═══════════════
  Widget _infoRow(String label, String value) => Row(children: [
    SizedBox(width: 60, child: Text(label, style: TextStyle(fontSize: 12, color: AppColors.textMuted))),
    Expanded(child: Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary))),
  ]);

  Widget _errWidget() {
    if (_error.isEmpty) return const SizedBox.shrink();
    return Padding(padding: const EdgeInsets.only(top: 12), child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: AppColors.pastelPink, borderRadius: BorderRadius.circular(10)),
      child: Row(children: [
        const Icon(Icons.error_outline, size: 16, color: AppColors.error), const SizedBox(width: 8),
        Expanded(child: Text(_error, style: const TextStyle(color: AppColors.error, fontSize: 12))),
      ]),
    ));
  }

  Widget _actionBtn(String label, VoidCallback onTap) => SizedBox(
    width: double.infinity, height: 50,
    child: ElevatedButton(
      onPressed: _loading ? null : onTap,
      style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
      child: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
    ),
  );

  Widget _eyeBtn() => IconButton(icon: Icon(_showPwd ? Icons.visibility_off : Icons.visibility, color: AppColors.textMuted, size: 18), onPressed: () => setState(() => _showPwd = !_showPwd));

  Widget _field(TextEditingController c, String hint, IconData icon, {bool obscure = false, Widget? suffix}) => TextField(
    controller: c, obscureText: obscure,
    style: TextStyle(color: AppColors.textPrimary, fontSize: 13),
    decoration: InputDecoration(
      hintText: hint, hintStyle: TextStyle(color: AppColors.textLight, fontSize: 13),
      prefixIcon: Icon(icon, color: AppColors.textMuted, size: 18), suffixIcon: suffix,
      filled: true, fillColor: AppColors.inputBg,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppColors.border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppColors.border)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
    ),
  );
}
