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
  // Modes: 'login', 'signup', 'join'
  String mode = 'login';
  bool showPassword = false;
  String error = '';
  bool loading = false;
  String? joinRoomName;
  String? generatedPassword; // Auto-generated password shown after join

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _roomCodeController = TextEditingController();

  Future<void> _login() async {
    if (_emailController.text.trim().isEmpty || _passwordController.text.isEmpty) {
      setState(() => error = 'Please fill all fields');
      return;
    }
    setState(() { error = ''; loading = true; });
    try {
      await ref.read(authProvider.notifier).login(
        _emailController.text.trim(),
        _passwordController.text,
      );
      if (!mounted) return;
      final authState = ref.read(authProvider);
      if (authState.hasError) {
        setState(() { error = authState.error.toString().replaceFirst('Exception: ', ''); loading = false; });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() { error = e.toString().replaceFirst('Exception: ', ''); loading = false; });
    }
  }

  Future<void> _signup() async {
    if (_nameController.text.trim().isEmpty || _emailController.text.trim().isEmpty || _passwordController.text.isEmpty) {
      setState(() => error = 'Please fill all fields');
      return;
    }
    setState(() { error = ''; loading = true; });
    try {
      await ref.read(authProvider.notifier).signup(
        _nameController.text.trim(),
        _emailController.text.trim(),
        _passwordController.text,
      );
    } catch (e) {
      if (!mounted) return;
      setState(() { error = e.toString().replaceFirst('Exception: ', ''); loading = false; });
    }
  }

  Future<void> _verifyRoomCode() async {
    if (_roomCodeController.text.trim().isEmpty) {
      setState(() => error = 'Please enter a room code');
      return;
    }
    setState(() { error = ''; loading = true; });
    try {
      final code = _roomCodeController.text.trim().toUpperCase();
      // Accept the code if it looks valid (4+ chars). Actual validation happens on join.
      if (code.length < 4) {
        throw Exception('Room code must be at least 4 characters');
      }
      setState(() => joinRoomName = 'Room ($code)');
    } catch (e) {
      setState(() => error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _signupAndJoin() async {
    if (_nameController.text.trim().isEmpty || _emailController.text.trim().isEmpty) {
      setState(() => error = 'Please fill name and email');
      return;
    }
    setState(() { error = ''; loading = true; });
    try {
      // Auto-generate password
      final password = Helpers.generatePassword(length: 8);

      // 1. Create account
      await ref.read(authProvider.notifier).signup(
        _nameController.text.trim(),
        _emailController.text.trim(),
        password,
      );
      // 2. Join room
      await RoomService().joinRoom(_roomCodeController.text.trim());
      await ref.read(authProvider.notifier).refresh();

      // 3. Show credentials before proceeding
      if (mounted) {
        setState(() { generatedPassword = password; loading = false; });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() { error = e.toString().replaceFirst('Exception: ', ''); loading = false; });
    }
  }

  void _switchMode(String newMode) {
    setState(() {
      mode = newMode;
      error = '';
      joinRoomName = null;
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _roomCodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: Column(
              children: [
                // Logo
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 8))],
                  ),
                  child: const Icon(Icons.home_rounded, color: Colors.white, size: 34),
                ),
                const SizedBox(height: 20),
                const Text('CasaSync', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                const Text('SMART HOSTEL AUTOMATION', style: TextStyle(fontSize: 10, letterSpacing: 2, color: AppColors.textMuted)),
                const SizedBox(height: 28),

                // Mode selector tabs
                Container(
                  decoration: BoxDecoration(color: AppColors.inputBg, borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.all(4),
                  child: Row(children: [
                    _modeTab('Login', 'login'),
                    _modeTab('Sign Up', 'signup'),
                    _modeTab('Join Room', 'join'),
                  ]),
                ),
                const SizedBox(height: 24),

                // Card
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppColors.border),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 4))],
                  ),
                  child: _buildForm(),
                ),

                const SizedBox(height: 30),
                const Text('Built for the way roommates actually live.', style: TextStyle(color: AppColors.textLight, fontSize: 11, fontStyle: FontStyle.italic)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _modeTab(String label, String tabMode) {
    final isActive = mode == tabMode;
    return Expanded(
      child: GestureDetector(
        onTap: () => _switchMode(tabMode),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isActive ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(label, textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: isActive ? Colors.white : AppColors.textMuted)),
        ),
      ),
    );
  }

  Widget _buildForm() {
    switch (mode) {
      case 'login':
        return _buildLoginForm();
      case 'signup':
        return _buildSignupForm();
      case 'join':
        return _buildJoinForm();
      default:
        return _buildLoginForm();
    }
  }

  Widget _buildLoginForm() {
    return Column(children: [
      const Text('Welcome Back', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
      const SizedBox(height: 4),
      const Text('Sign in to continue', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
      const SizedBox(height: 24),
      _buildField(_emailController, 'Email address', Icons.mail_outline),
      const SizedBox(height: 14),
      _buildField(_passwordController, 'Password', Icons.lock_outline, obscure: !showPassword, suffix: _eyeButton()),
      _errorWidget(),
      const SizedBox(height: 24),
      _submitButton('Login', _login),
    ]);
  }

  Widget _buildSignupForm() {
    return Column(children: [
      const Text('Create Account', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
      const SizedBox(height: 4),
      const Text('Fill in your details to get started', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
      const SizedBox(height: 24),
      _buildField(_nameController, 'Full Name', Icons.person_outline),
      const SizedBox(height: 14),
      _buildField(_emailController, 'Email address', Icons.mail_outline),
      const SizedBox(height: 14),
      _buildField(_passwordController, 'Password', Icons.lock_outline, obscure: !showPassword, suffix: _eyeButton()),
      _errorWidget(),
      const SizedBox(height: 24),
      _submitButton('Sign Up', _signup),
    ]);
  }

  Widget _buildJoinForm() {
    // Step 1: Enter room code
    if (joinRoomName == null) {
      return Column(children: [
        const Icon(Icons.vpn_key_outlined, size: 32, color: AppColors.primary),
        const SizedBox(height: 12),
        const Text('Join a Room', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        const Text('Enter the invite code from your roommate', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
        const SizedBox(height: 24),
        TextField(
          controller: _roomCodeController,
          textCapitalization: TextCapitalization.characters,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: 4, color: AppColors.textPrimary),
          decoration: InputDecoration(
            hintText: 'ENTER CODE',
            hintStyle: TextStyle(fontSize: 18, color: AppColors.textLight, letterSpacing: 4),
            filled: true,
            fillColor: AppColors.inputBg,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: AppColors.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: AppColors.border)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
            contentPadding: const EdgeInsets.symmetric(vertical: 20),
          ),
        ),
        _errorWidget(),
        const SizedBox(height: 24),
        _submitButton('Verify Code', _verifyRoomCode),
      ]);
    }

    // Step 3: Account created — show credentials
    if (generatedPassword != null) {
      return Column(children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppColors.pastelGreen, shape: BoxShape.circle),
          child: const Icon(Icons.check, size: 40, color: AppColors.success),
        ),
        const SizedBox(height: 16),
        const Text('Account Created!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.success)),
        const SizedBox(height: 4),
        Text('You joined $joinRoomName', style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
        const SizedBox(height: 24),

        // Credentials box
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.pastelYellow,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.orange.withOpacity(0.3)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Row(children: [
              Icon(Icons.key, size: 16, color: Colors.orange),
              SizedBox(width: 8),
              Text('Your Login Credentials', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.orange)),
            ]),
            const SizedBox(height: 14),
            _credentialRow('Email', _emailController.text.trim()),
            const SizedBox(height: 10),
            _credentialRow('Password', generatedPassword!),
          ]),
        ),
        const SizedBox(height: 12),

        // Copy button
        SizedBox(width: double.infinity, child: OutlinedButton.icon(
          onPressed: () {
            Clipboard.setData(ClipboardData(text: 'Email: ${_emailController.text.trim()}\nPassword: $generatedPassword'));
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Credentials copied!'), duration: Duration(seconds: 2)));
          },
          icon: const Icon(Icons.copy, size: 16),
          label: const Text('Copy Credentials', style: TextStyle(fontSize: 12)),
          style: OutlinedButton.styleFrom(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            padding: const EdgeInsets.symmetric(vertical: 12),
          ),
        )),
        const SizedBox(height: 20),

        const Text('Save these credentials! You will need them to login.', style: TextStyle(fontSize: 11, color: AppColors.error, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
        const SizedBox(height: 20),

        _submitButton('Go to Dashboard', () {
          // Already logged in from _signupAndJoin, just refresh
          ref.invalidate(authProvider);
        }),
      ]);
    }

    // Step 2: Room found — ask for name + email only (password auto-generated)
    return Column(children: [
      Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: AppColors.pastelGreen, borderRadius: BorderRadius.circular(14)),
        child: Row(children: [
          const Icon(Icons.check_circle, color: AppColors.success, size: 22),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Room Found!', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.success)),
            Text(joinRoomName!, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          ])),
          GestureDetector(
            onTap: () => setState(() { joinRoomName = null; _roomCodeController.clear(); }),
            child: const Icon(Icons.close, size: 18, color: AppColors.textMuted),
          ),
        ]),
      ),
      const SizedBox(height: 20),
      const Text('Create your account', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      const SizedBox(height: 4),
      const Text('A password will be auto-generated for you', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
      const SizedBox(height: 20),
      _buildField(_nameController, 'Full Name', Icons.person_outline),
      const SizedBox(height: 14),
      _buildField(_emailController, 'Email address', Icons.mail_outline),
      _errorWidget(),
      const SizedBox(height: 24),
      _submitButton('Sign Up & Join Room', _signupAndJoin),
    ]);
  }

  Widget _credentialRow(String label, String value) {
    return Row(children: [
      SizedBox(width: 70, child: Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textMuted))),
      Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
          child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, fontFamily: 'monospace')),
        ),
      ),
    ]);
  }

  Widget _errorWidget() {
    if (error.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(color: AppColors.pastelPink, borderRadius: BorderRadius.circular(10)),
        child: Row(children: [
          const Icon(Icons.error_outline, size: 16, color: AppColors.error),
          const SizedBox(width: 8),
          Expanded(child: Text(error, style: const TextStyle(color: AppColors.error, fontSize: 12))),
        ]),
      ),
    );
  }

  Widget _submitButton(String label, VoidCallback onPressed) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: loading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        child: loading
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _eyeButton() {
    return IconButton(
      icon: Icon(showPassword ? Icons.visibility_off : Icons.visibility, color: AppColors.textMuted, size: 18),
      onPressed: () => setState(() => showPassword = !showPassword),
    );
  }

  Widget _buildField(TextEditingController ctrl, String hint, IconData icon, {bool obscure = false, Widget? suffix}) {
    return TextField(
      controller: ctrl,
      obscureText: obscure,
      style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.textLight, fontSize: 13),
        prefixIcon: Icon(icon, color: AppColors.textMuted, size: 18),
        suffixIcon: suffix,
        filled: true,
        fillColor: AppColors.inputBg,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppColors.border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: AppColors.border)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
      ),
    );
  }
}
