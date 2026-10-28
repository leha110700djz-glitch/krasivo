class Master {
  final int id;
  final String name;
  final String? bio;
  final List<String> specializations;
  final int? experienceYears;
  final double rating;
  final int reviewsCount;
  final String? avatar;
  final List<String> portfolio;
  final int? salonId;
  final String? salonName;

  const Master({
    required this.id,
    required this.name,
    this.bio,
    required this.specializations,
    this.experienceYears,
    required this.rating,
    required this.reviewsCount,
    this.avatar,
    required this.portfolio,
    this.salonId,
    this.salonName,
  });

  factory Master.fromJson(Map<String, dynamic> json) => Master(
        id: json['id'] as int,
        name: json['name'] as String,
        bio: json['bio'] as String?,
        specializations: (json['specializations'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        experienceYears: json['experience_years'] as int?,
        rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
        reviewsCount: json['reviews_count'] as int? ?? 0,
        avatar: json['avatar'] as String?,
        portfolio: (json['portfolio'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        salonId: json['salon_id'] as int?,
        salonName: json['salon_name'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'bio': bio,
        'specializations': specializations,
        'experience_years': experienceYears,
        'rating': rating,
        'reviews_count': reviewsCount,
        'avatar': avatar,
        'portfolio': portfolio,
        'salon_id': salonId,
        'salon_name': salonName,
      };
}

class TimeSlot {
  final String time;
  final bool isAvailable;

  const TimeSlot({required this.time, required this.isAvailable});

  factory TimeSlot.fromJson(Map<String, dynamic> json) => TimeSlot(
        time: json['time'] as String,
        isAvailable: json['is_available'] as bool? ?? true,
      );
}
