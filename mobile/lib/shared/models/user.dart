class User {
  final int id;
  final String name;
  final String phone;
  final String? email;
  final String role; // 'client' | 'salon_owner'
  final String? avatar;
  final String? bio;
  final String? createdAt;

  const User({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    required this.role,
    this.avatar,
    this.bio,
    this.createdAt,
  });

  bool get isSalonOwner => role == 'salon_owner';

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as int,
        name: json['name'] as String,
        phone: json['phone'] as String,
        email: json['email'] as String?,
        role: json['role'] as String? ?? 'client',
        avatar: json['avatar'] as String?,
        bio: json['bio'] as String?,
        createdAt: json['created_at'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
        'email': email,
        'role': role,
        'avatar': avatar,
        'bio': bio,
        'created_at': createdAt,
      };

  User copyWith({
    int? id,
    String? name,
    String? phone,
    String? email,
    String? role,
    String? avatar,
    String? bio,
    String? createdAt,
  }) =>
      User(
        id: id ?? this.id,
        name: name ?? this.name,
        phone: phone ?? this.phone,
        email: email ?? this.email,
        role: role ?? this.role,
        avatar: avatar ?? this.avatar,
        bio: bio ?? this.bio,
        createdAt: createdAt ?? this.createdAt,
      );
}
