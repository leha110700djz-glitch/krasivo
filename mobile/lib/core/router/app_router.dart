import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/auth/screens/onboarding_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/home/screens/explore_screen.dart';
import '../../features/salons/screens/salon_detail_screen.dart';
import '../../features/masters/screens/master_detail_screen.dart';
import '../../features/booking/screens/booking_screen.dart';
import '../../features/booking/screens/booking_success_screen.dart';
import '../../features/bookings/screens/bookings_screen.dart';
import '../../features/bookings/screens/review_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/profile/screens/settings_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/owner/screens/owner_dashboard_screen.dart';
import '../../features/owner/screens/owner_bookings_screen.dart';
import '../../features/owner/screens/owner_masters_screen.dart';
import '../../features/owner/screens/owner_services_screen.dart';
import '../../features/owner/screens/manage_salon_screen.dart';
import '../../features/profile/screens/loyalty_screen.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';

class RouterNotifier extends ChangeNotifier {
  final Ref _ref;
  RouterNotifier(this._ref) {
    _ref.listen(authProvider, (_, __) => notifyListeners());
  }

  String? redirect(BuildContext context, GoRouterState state) {
    final authState = _ref.read(authProvider);
    final loc = state.matchedLocation;

    return authState.when(
      loading: () => null,
      error: (_, __) {
        if (loc.startsWith('/auth') || loc == '/' || loc == '/onboarding') {
          return null;
        }
        return '/auth/login';
      },
      data: (user) {
        if (user == null) {
          if (loc.startsWith('/auth') || loc == '/' || loc == '/onboarding') {
            return null;
          }
          return '/auth/login';
        }
        // Logged in - redirect from auth pages
        if (loc.startsWith('/auth') || loc == '/onboarding') {
          if (user.isSalonOwner) return '/owner/dashboard';
          return '/home/discover';
        }
        return null;
      },
    );
  }
}

final routerNotifierProvider = ChangeNotifierProvider<RouterNotifier>((ref) {
  return RouterNotifier(ref);
});

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = ref.read(routerNotifierProvider);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: notifier,
    redirect: notifier.redirect,
    routes: [
      GoRoute(
        path: '/',
        builder: (_, __) => const SplashScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (_, __) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/auth/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/auth/register',
        builder: (_, __) => const RegisterScreen(),
      ),
      // Main shell with bottom nav
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => MainShell(shell: shell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/home/discover',
              builder: (_, __) => const HomeScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/home/explore',
              builder: (_, __) => const ExploreScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/home/bookings',
              builder: (_, __) => const BookingsScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/home/profile',
              builder: (_, __) => const ProfileScreen(),
            ),
          ]),
        ],
      ),
      // Owner shell
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => OwnerShell(shell: shell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/owner/dashboard',
              builder: (_, __) => const OwnerDashboardScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/owner/bookings',
              builder: (_, __) => const OwnerBookingsScreen(),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/owner/profile',
              builder: (_, __) => const ProfileScreen(),
            ),
          ]),
        ],
      ),
      // Detail routes (no shell)
      GoRoute(
        path: '/salons/:id',
        builder: (_, state) => SalonDetailScreen(
          salonId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/masters/:id',
        builder: (_, state) => MasterDetailScreen(
          masterId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/booking-success',
        builder: (_, state) => BookingSuccessScreen(
          bookingId: int.tryParse(state.uri.queryParameters['bookingId'] ?? ''),
        ),
      ),
      GoRoute(
        path: '/booking/:masterId',
        builder: (_, state) => BookingScreen(
          masterId: int.parse(state.pathParameters['masterId']!),
        ),
      ),
      GoRoute(
        path: '/review/:bookingId',
        builder: (_, state) => ReviewScreen(
          bookingId: int.parse(state.pathParameters['bookingId']!),
        ),
      ),
      GoRoute(
        path: '/notifications',
        builder: (_, __) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/settings',
        builder: (_, __) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/loyalty',
        builder: (_, __) => const LoyaltyScreen(),
      ),
      GoRoute(
        path: '/owner/salon',
        builder: (_, __) => const ManageSalonScreen(),
      ),
      GoRoute(
        path: '/owner/masters',
        builder: (_, __) => const OwnerMastersScreen(),
      ),
      GoRoute(
        path: '/owner/services',
        builder: (_, __) => const OwnerServicesScreen(),
      ),
    ],
  );
});

class MainShell extends ConsumerWidget {
  final StatefulNavigationShell shell;
  const MainShell({super.key, required this.shell});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: shell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: shell.currentIndex,
        onDestinationSelected: (index) {
          shell.goBranch(
            index,
            initialLocation: index == shell.currentIndex,
          );
        },
        indicatorColor: primaryColor.withOpacity(0.15),
        backgroundColor: surfaceColor,
        elevation: 0,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded, color: primaryColor),
            label: AppStrings.home,
          ),
          NavigationDestination(
            icon: Icon(Icons.search_outlined),
            selectedIcon: Icon(Icons.search_rounded, color: primaryColor),
            label: AppStrings.explore,
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_today_outlined),
            selectedIcon:
                Icon(Icons.calendar_today_rounded, color: primaryColor),
            label: AppStrings.bookings,
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person_rounded, color: primaryColor),
            label: AppStrings.profile,
          ),
        ],
      ),
    );
  }
}

class OwnerShell extends ConsumerWidget {
  final StatefulNavigationShell shell;
  const OwnerShell({super.key, required this.shell});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: shell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: shell.currentIndex,
        onDestinationSelected: (index) {
          shell.goBranch(
            index,
            initialLocation: index == shell.currentIndex,
          );
        },
        indicatorColor: primaryColor.withOpacity(0.15),
        backgroundColor: surfaceColor,
        elevation: 0,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard_rounded, color: primaryColor),
            label: 'Панель',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon:
                Icon(Icons.calendar_month_rounded, color: primaryColor),
            label: 'Записи',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person_rounded, color: primaryColor),
            label: AppStrings.profile,
          ),
        ],
      ),
    );
  }
}
