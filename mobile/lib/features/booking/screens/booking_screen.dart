import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../features/booking/providers/booking_provider.dart';
import '../../../features/masters/providers/masters_provider.dart';
import '../../../shared/models/service.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/loading_widget.dart';

class BookingScreen extends ConsumerStatefulWidget {
  final int masterId;
  const BookingScreen({super.key, required this.masterId});

  @override
  ConsumerState<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends ConsumerState<BookingScreen> {
  int _step = 0; // 0: service, 1: datetime, 2: confirm
  final _notesController = TextEditingController();

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_step < 2) setState(() => _step++);
  }

  void _prevStep() {
    if (_step > 0) setState(() => _step--);
  }

  Future<void> _confirm() async {
    final notifier = ref.read(bookingProvider(widget.masterId).notifier);
    notifier.setNotes(_notesController.text.trim());
    final bookingId = await notifier.submit();
    if (bookingId != null && mounted) {
      context.go('/booking-success?bookingId=$bookingId');
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookingState = ref.watch(bookingProvider(widget.masterId));
    final masterAsync = ref.watch(masterDetailProvider(widget.masterId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Запись к мастеру'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: _step > 0 ? _prevStep : () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          // Stepper indicator
          _StepIndicator(currentStep: _step),
          Expanded(
            child: IndexedStack(
              index: _step,
              children: [
                // Step 1: Service selection
                _ServiceStep(masterId: widget.masterId),
                // Step 2: Date & time
                _DateTimeStep(masterId: widget.masterId),
                // Step 3: Confirm (promo + notes)
                _ConfirmStep(
                  masterId: widget.masterId,
                  notesController: _notesController,
                ),
              ],
            ),
          ),
          // Bottom action button
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (bookingState.error != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: errorColor.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        bookingState.error!,
                        style: const TextStyle(color: errorColor, fontSize: 13),
                      ),
                    ),
                  AppButton(
                    label: _step < 2 ? AppStrings.next : AppStrings.confirm,
                    isLoading: bookingState.isSubmitting,
                    onPressed: () {
                      if (_step == 0) {
                        if (bookingState.selectedService == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Выберите услугу'),
                              backgroundColor: errorColor,
                            ),
                          );
                          return;
                        }
                        _nextStep();
                      } else if (_step == 1) {
                        if (bookingState.selectedDate == null ||
                            bookingState.selectedTime == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Выберите дату и время'),
                              backgroundColor: errorColor,
                            ),
                          );
                          return;
                        }
                        _nextStep();
                      } else {
                        _confirm();
                      }
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StepIndicator extends StatelessWidget {
  final int currentStep;
  final _labels = const ['Услуга', 'Дата и время', 'Подтверждение'];

  const _StepIndicator({required this.currentStep});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: surfaceColor,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: List.generate(_labels.length * 2 - 1, (index) {
          if (index.isOdd) {
            // Line connector
            final stepIndex = index ~/ 2;
            final isCompleted = currentStep > stepIndex;
            return Expanded(
              child: Container(
                height: 2,
                color: isCompleted ? primaryColor : dividerColor,
              ),
            );
          }
          final stepIndex = index ~/ 2;
          final isActive = currentStep == stepIndex;
          final isCompleted = currentStep > stepIndex;

          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isCompleted
                      ? primaryColor
                      : isActive
                          ? primaryColor
                          : dividerColor,
                ),
                child: Center(
                  child: isCompleted
                      ? const Icon(Icons.check, size: 16, color: Colors.white)
                      : Text(
                          '${stepIndex + 1}',
                          style: TextStyle(
                            color: isActive ? Colors.white : textSecondary,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _labels[stepIndex],
                style: TextStyle(
                  fontSize: 10,
                  color: isActive ? primaryColor : textSecondary,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ],
          );
        }),
      ),
    );
  }
}

class _ServiceStep extends ConsumerWidget {
  final int masterId;
  const _ServiceStep({required this.masterId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final servicesAsync = ref.watch(masterServicesProvider(masterId));
    final bookingState = ref.watch(bookingProvider(masterId));

    return servicesAsync.when(
      loading: () => const LoadingWidget(),
      error: (e, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Не удалось загрузить услуги',
                style: TextStyle(color: textSecondary),
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: () => ref.invalidate(masterServicesProvider(masterId)),
                child: const Text('Повторить'),
              ),
            ],
          ),
        ),
      ),
      data: (services) {
        if (services.isEmpty) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                'Мастер пока не добавил услуги',
                style: TextStyle(color: textSecondary),
                textAlign: TextAlign.center,
              ),
            ),
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: services.length,
          itemBuilder: (_, index) {
            final service = services[index];
            final isSelected = bookingState.selectedService?.id == service.id;

            return GestureDetector(
              onTap: () {
                ref
                    .read(bookingProvider(masterId).notifier)
                    .selectService(service);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSelected
                      ? primaryColor.withOpacity(0.06)
                      : surfaceColor,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSelected ? primaryColor : dividerColor,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isSelected ? primaryColor : textSecondary,
                          width: 2,
                        ),
                        color: isSelected ? primaryColor : Colors.transparent,
                      ),
                      child: isSelected
                          ? const Icon(Icons.check, size: 12, color: Colors.white)
                          : null,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            service.name,
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                              color: isSelected ? primaryColor : textPrimary,
                            ),
                          ),
                          if (service.description != null &&
                              service.description!.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              service.description!,
                              style: const TextStyle(
                                fontSize: 12,
                                color: textSecondary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                          const SizedBox(height: 4),
                          Text(
                            service.durationFormatted,
                            style: const TextStyle(
                              fontSize: 12,
                              color: textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      service.priceFormatted,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: isSelected ? primaryColor : textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _DateTimeStep extends ConsumerStatefulWidget {
  final int masterId;
  const _DateTimeStep({required this.masterId});

  @override
  ConsumerState<_DateTimeStep> createState() => _DateTimeStepState();
}

class _DateTimeStepState extends ConsumerState<_DateTimeStep> {
  DateTime _focusedDay = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final bookingState = ref.watch(bookingProvider(widget.masterId));
    final selectedDate = bookingState.selectedDate ?? DateTime.now();
    final dateStr =
        '${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}';

    final slotsAsync = ref.watch(
      masterSlotsProvider(
        MasterSlotsQuery(masterId: widget.masterId, date: dateStr),
      ),
    );

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Calendar
          Container(
            decoration: BoxDecoration(
              color: surfaceColor,
              borderRadius: BorderRadius.circular(16),
              boxShadow: cardShadow,
            ),
            child: TableCalendar(
              firstDay: DateTime.now(),
              lastDay: DateTime.now().add(const Duration(days: 90)),
              focusedDay: _focusedDay,
              selectedDayPredicate: (day) =>
                  bookingState.selectedDate != null &&
                  isSameDay(day, bookingState.selectedDate),
              onDaySelected: (selected, focused) {
                setState(() => _focusedDay = focused);
                ref
                    .read(bookingProvider(widget.masterId).notifier)
                    .selectDate(selected);
              },
              calendarStyle: CalendarStyle(
                selectedDecoration: const BoxDecoration(
                  color: primaryColor,
                  shape: BoxShape.circle,
                ),
                todayDecoration: BoxDecoration(
                  color: primaryColor.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                todayTextStyle: const TextStyle(color: primaryColor, fontWeight: FontWeight.w700),
                selectedTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                weekendTextStyle: const TextStyle(color: errorColor),
                outsideDaysVisible: false,
              ),
              headerStyle: const HeaderStyle(
                formatButtonVisible: false,
                titleCentered: true,
                titleTextStyle: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                  color: textPrimary,
                ),
                leftChevronIcon: Icon(Icons.chevron_left, color: primaryColor),
                rightChevronIcon: Icon(Icons.chevron_right, color: primaryColor),
              ),
              locale: 'ru_RU',
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Выберите время',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          slotsAsync.when(
            loading: () => const LoadingWidget(),
            error: (e, _) => const Text(
              'Не удалось загрузить слоты',
              style: TextStyle(color: textSecondary),
            ),
            data: (slots) {
              if (slots.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text(
                    'Нет доступного времени на эту дату',
                    style: TextStyle(color: textSecondary),
                    textAlign: TextAlign.center,
                  ),
                );
              }
              return GridView.builder(
                physics: const NeverScrollableScrollPhysics(),
                shrinkWrap: true,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                  childAspectRatio: 2.2,
                ),
                itemCount: slots.length,
                itemBuilder: (_, index) {
                  final slot = slots[index];
                  final isSelected = bookingState.selectedTime == slot.time;
                  final isAvailable = slot.isAvailable;

                  return GestureDetector(
                    onTap: isAvailable
                        ? () => ref
                            .read(bookingProvider(widget.masterId).notifier)
                            .selectTime(slot.time)
                        : null,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? primaryColor
                            : isAvailable
                                ? surfaceColor
                                : backgroundColor,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isSelected
                              ? primaryColor
                              : isAvailable
                                  ? dividerColor
                                  : backgroundColor,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          slot.time,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: isSelected
                                ? FontWeight.w700
                                : FontWeight.w500,
                            color: isSelected
                                ? Colors.white
                                : isAvailable
                                    ? textPrimary
                                    : textHint,
                            decoration: isAvailable
                                ? null
                                : TextDecoration.lineThrough,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }
}

class _ConfirmStep extends ConsumerStatefulWidget {
  final int masterId;
  final TextEditingController notesController;

  const _ConfirmStep({
    required this.masterId,
    required this.notesController,
  });

  @override
  ConsumerState<_ConfirmStep> createState() => _ConfirmStepState();
}

class _ConfirmStepState extends ConsumerState<_ConfirmStep> {
  final _promoController = TextEditingController();

  @override
  void dispose() {
    _promoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bookingState = ref.watch(bookingProvider(widget.masterId));
    final masterAsync = ref.watch(masterDetailProvider(widget.masterId));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [primaryColor, primaryLight],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Детали записи',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 16),
                masterAsync.when(
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (master) => _InfoRow(
                    label: 'Мастер',
                    value: master.name,
                    icon: Icons.person_outline,
                  ),
                ),
                if (bookingState.selectedService != null) ...[
                  _InfoRow(
                    label: 'Услуга',
                    value: bookingState.selectedService!.name,
                    icon: Icons.content_cut_outlined,
                  ),
                  _InfoRow(
                    label: 'Стоимость',
                    value: bookingState.discountPercent != null
                        ? '${bookingState.selectedService!.priceFormatted} → ${bookingState.finalPriceFormatted}'
                        : bookingState.selectedService!.priceFormatted,
                    icon: Icons.payments_outlined,
                  ),
                  _InfoRow(
                    label: 'Длительность',
                    value: bookingState.selectedService!.durationFormatted,
                    icon: Icons.timer_outlined,
                  ),
                ],
                if (bookingState.selectedDate != null)
                  _InfoRow(
                    label: 'Дата',
                    value: DateFormat('d MMMM yyyy', 'ru')
                        .format(bookingState.selectedDate!),
                    icon: Icons.calendar_today_outlined,
                  ),
                if (bookingState.selectedTime != null)
                  _InfoRow(
                    label: 'Время',
                    value: bookingState.selectedTime!,
                    icon: Icons.access_time,
                  ),
                if (bookingState.promoCode != null &&
                    bookingState.discountPercent != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.local_offer_outlined,
                            color: Colors.white, size: 14),
                        const SizedBox(width: 6),
                        Text(
                          '${bookingState.promoCode}: −${bookingState.discountPercent!.toStringAsFixed(0)}%',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Promo code section
          const Text(
            'Промокод',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TextField(
                  controller: _promoController,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    hintText: 'Введите промокод',
                    hintStyle: const TextStyle(color: textHint, fontSize: 14),
                    filled: true,
                    fillColor: surfaceColor,
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: dividerColor),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(
                        color: bookingState.promoCode != null
                            ? successColor
                            : dividerColor,
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide:
                          const BorderSide(color: primaryColor, width: 2),
                    ),
                    suffixIcon: bookingState.promoCode != null
                        ? IconButton(
                            icon: const Icon(Icons.close,
                                color: textSecondary, size: 18),
                            onPressed: () {
                              _promoController.clear();
                              ref
                                  .read(bookingProvider(widget.masterId)
                                      .notifier)
                                  .removePromoCode();
                            },
                          )
                        : null,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              SizedBox(
                height: 50,
                child: ElevatedButton(
                  onPressed: bookingState.isCheckingPromo
                      ? null
                      : () {
                          FocusScope.of(context).unfocus();
                          ref
                              .read(bookingProvider(widget.masterId).notifier)
                              .applyPromoCode(_promoController.text);
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  child: bookingState.isCheckingPromo
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2),
                        )
                      : const Text(
                          'Применить',
                          style: TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w600),
                        ),
                ),
              ),
            ],
          ),
          if (bookingState.promoError != null) ...[
            const SizedBox(height: 6),
            Text(
              bookingState.promoError!,
              style: const TextStyle(color: errorColor, fontSize: 13),
            ),
          ],
          if (bookingState.promoCode != null &&
              bookingState.discountPercent != null) ...[
            const SizedBox(height: 6),
            Text(
              'Промокод применён: скидка ${bookingState.discountPercent!.toStringAsFixed(0)}%',
              style: const TextStyle(color: successColor, fontSize: 13),
            ),
          ],
          const SizedBox(height: 20),
          // Notes field
          const Text(
            AppStrings.notes,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: widget.notesController,
            maxLines: 4,
            decoration: InputDecoration(
              hintText: AppStrings.notesHint,
              hintStyle: const TextStyle(color: textHint, fontSize: 14),
              filled: true,
              fillColor: surfaceColor,
              contentPadding: const EdgeInsets.all(16),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: dividerColor),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: dividerColor),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: primaryColor, width: 2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: accentColor.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: accentColor.withOpacity(0.3)),
            ),
            child: const Row(
              children: [
                Icon(Icons.info_outline, color: accentColor, size: 18),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'После создания записи мастер подтвердит её в течение нескольких часов',
                    style: TextStyle(
                      fontSize: 13,
                      color: textPrimary,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _InfoRow({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.white70),
          const SizedBox(width: 10),
          Text(
            '$label: ',
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 13,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
