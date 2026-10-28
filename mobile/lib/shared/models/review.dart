class Review {
  final int id;
  final int? bookingId;
  final int? userId;
  final String userName;
  final String? userAvatar;
  final int rating;
  final String? text;
  final List<String> photos;
  final String? createdAt;

  const Review({
    required this.id,
    this.bookingId,
    this.userId,
    required this.userName,
    this.userAvatar,
    required this.rating,
    this.text,
    required this.photos,
    this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) => Review(
        id: json['id'] as int,
        bookingId: json['booking_id'] as int?,
        userId: json['user_id'] as int?,
        userName: json['user_name'] as String? ?? 'Аноним',
        userAvatar: json['user_avatar'] as String?,
        rating: json['rating'] as int? ?? 5,
        text: json['text'] as String?,
        photos: (json['photos'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        createdAt: json['created_at'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'booking_id': bookingId,
        'user_id': userId,
        'user_name': userName,
        'user_avatar': userAvatar,
        'rating': rating,
        'text': text,
        'photos': photos,
        'created_at': createdAt,
      };
}

class AppNotification {
  final int id;
  final String type;
  final String title;
  final String body;
  final bool isRead;
  final String? createdAt;

  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.isRead,
    this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: json['id'] as int,
        type: json['type'] as String? ?? '',
        title: json['title'] as String? ?? '',
        body: json['body'] as String? ?? '',
        isRead: json['is_read'] as bool? ?? false,
        createdAt: json['created_at'] as String?,
      );
}
