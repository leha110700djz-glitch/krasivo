class Service {
  final int id;
  final String name;
  final String? description;
  final double price;
  final int durationMinutes;
  final String? category;
  final int? salonId;
  final int? masterId;

  const Service({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.durationMinutes,
    this.category,
    this.salonId,
    this.masterId,
  });

  String get priceFormatted => '${price.toStringAsFixed(0)} ₽';

  String get durationFormatted {
    if (durationMinutes < 60) return '$durationMinutes мин';
    final hours = durationMinutes ~/ 60;
    final minutes = durationMinutes % 60;
    if (minutes == 0) return '$hours ч';
    return '$hours ч $minutes мин';
  }

  factory Service.fromJson(Map<String, dynamic> json) => Service(
        id: json['id'] as int,
        name: json['name'] as String,
        description: json['description'] as String?,
        price: (json['price'] as num?)?.toDouble() ?? 0.0,
        durationMinutes: json['duration_minutes'] as int? ?? 60,
        category: json['category'] as String?,
        salonId: json['salon_id'] as int?,
        masterId: json['master_id'] as int?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'price': price,
        'duration_minutes': durationMinutes,
        'category': category,
        'salon_id': salonId,
        'master_id': masterId,
      };
}
