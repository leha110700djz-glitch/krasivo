class Booking {
  final int id;
  final int? salonId;
  final String? salonName;
  final String? salonPhoto;
  final int? masterId;
  final String? masterName;
  final String? masterAvatar;
  final int? serviceId;
  final String? serviceName;
  final String date;
  final String time;
  final int? durationMinutes;
  final double price;
  final String status; // pending | confirmed | completed | cancelled
  final String? notes;
  final String? createdAt;

  const Booking({
    required this.id,
    this.salonId,
    this.salonName,
    this.salonPhoto,
    this.masterId,
    this.masterName,
    this.masterAvatar,
    this.serviceId,
    this.serviceName,
    required this.date,
    required this.time,
    this.durationMinutes,
    required this.price,
    required this.status,
    this.notes,
    this.createdAt,
  });

  bool get isPending => status == 'pending';
  bool get isConfirmed => status == 'confirmed';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
  bool get canCancel => isPending || isConfirmed;
  bool get canReview => isCompleted;

  String get priceFormatted => '${price.toStringAsFixed(0)} ₽';

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'Ожидает';
      case 'confirmed':
        return 'Подтверждено';
      case 'completed':
        return 'Завершено';
      case 'cancelled':
        return 'Отменено';
      default:
        return status;
    }
  }

  factory Booking.fromJson(Map<String, dynamic> json) => Booking(
        id: json['id'] as int,
        salonId: json['salon_id'] as int?,
        salonName: json['salon_name'] as String?,
        salonPhoto: json['salon_photo'] as String?,
        masterId: json['master_id'] as int?,
        masterName: json['master_name'] as String?,
        masterAvatar: json['master_avatar'] as String?,
        serviceId: json['service_id'] as int?,
        serviceName: json['service_name'] as String?,
        date: json['date'] as String? ?? '',
        time: json['time'] as String? ?? '',
        durationMinutes: json['duration_minutes'] as int?,
        price: (json['price'] as num?)?.toDouble() ?? 0.0,
        status: json['status'] as String? ?? 'pending',
        notes: json['notes'] as String?,
        createdAt: json['created_at'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'salon_id': salonId,
        'salon_name': salonName,
        'salon_photo': salonPhoto,
        'master_id': masterId,
        'master_name': masterName,
        'master_avatar': masterAvatar,
        'service_id': serviceId,
        'service_name': serviceName,
        'date': date,
        'time': time,
        'duration_minutes': durationMinutes,
        'price': price,
        'status': status,
        'notes': notes,
        'created_at': createdAt,
      };
}
