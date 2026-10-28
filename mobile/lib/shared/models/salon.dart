class Salon {
  final int id;
  final String name;
  final String? description;
  final String address;
  final String city;
  final String? phone;
  final double rating;
  final int reviewsCount;
  final List<String> categories;
  final List<String> photos;
  final String? workingHours;
  final double? latitude;
  final double? longitude;
  final int? ownerId;

  const Salon({
    required this.id,
    required this.name,
    this.description,
    required this.address,
    required this.city,
    this.phone,
    required this.rating,
    required this.reviewsCount,
    required this.categories,
    required this.photos,
    this.workingHours,
    this.latitude,
    this.longitude,
    this.ownerId,
  });

  String? get mainPhoto => photos.isNotEmpty ? photos.first : null;

  factory Salon.fromJson(Map<String, dynamic> json) => Salon(
        id: json['id'] as int,
        name: json['name'] as String,
        description: json['description'] as String?,
        address: json['address'] as String? ?? '',
        city: json['city'] as String? ?? '',
        phone: json['phone'] as String?,
        rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
        reviewsCount: json['reviews_count'] as int? ?? 0,
        categories: (json['categories'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        photos: (json['photos'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        workingHours: json['working_hours'] as String?,
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        ownerId: json['owner_id'] as int?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'address': address,
        'city': city,
        'phone': phone,
        'rating': rating,
        'reviews_count': reviewsCount,
        'categories': categories,
        'photos': photos,
        'working_hours': workingHours,
        'latitude': latitude,
        'longitude': longitude,
        'owner_id': ownerId,
      };
}
