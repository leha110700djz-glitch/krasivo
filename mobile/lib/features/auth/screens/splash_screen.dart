import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/storage/secure_storage.dart';
import '../providers/auth_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _scaleAnimation = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );
    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.6, curve: Curves.easeIn),
      ),
    );
    _controller.forward();
    _checkAndNavigate();
  }

  Future<void> _checkAndNavigate() async {
    await Future.delayed(const Duration(milliseconds: 1800));
    if (!mounted) return;

    final authState = ref.read(authProvider);
    if (authState.isLoading) {
      // Wait for auth to resolve
      await Future.delayed(const Duration(milliseconds: 500));
    }

    if (!mounted) return;
    final currentAuthState = ref.read(authProvider);

    currentAuthState.when(
      loading: () async {
        await Future.delayed(const Duration(milliseconds: 800));
        if (mounted) _navigate();
      },
      error: (_, __) => _navigateToAuth(),
      data: (user) {
        if (user != null) {
          if (user.isSalonOwner) {
            context.go('/owner/dashboard');
          } else {
            context.go('/home/discover');
          }
        } else {
          _navigateToAuth();
        }
      },
    );
  }

  Future<void> _navigate() async {
    final auth = ref.read(authProvider);
    auth.when(
      loading: () => _navigateToAuth(),
      error: (_, __) => _navigateToAuth(),
      data: (user) {
        if (user != null) {
          if (user.isSalonOwner) {
            context.go('/owner/dashboard');
          } else {
            context.go('/home/discover');
          }
        } else {
          _navigateToAuth();
        }
      },
    );
  }

  Future<void> _navigateToAuth() async {
    final storage = ref.read(secureStorageProvider);
    final isOnboarded = await storage.isOnboarded();
    if (!mounted) return;
    if (isOnboarded) {
      context.go('/auth/login');
    } else {
      context.go('/onboarding');
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: heroGradient),
        child: Center(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (_, __) {
              return FadeTransition(
                opacity: _fadeAnimation,
                child: ScaleTransition(
                  scale: _scaleAnimation,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Center(
                          child: Text(
                            '✨',
                            style: TextStyle(fontSize: 48),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Красиво',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 38,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Записи в салоны красоты',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 16,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
