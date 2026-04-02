class UserModel {
  final dynamic id;
  final String name;
  final String email;
  final String? password;
  final String? phone;
  final String? avatarUrl;
  final String role;
  final int? roomId;
  final DateTime createdAt;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.password,
    this.phone,
    this.avatarUrl,
    this.role = 'member',
    this.roomId,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'password': password,
    'phone': phone,
    'avatar_url': avatarUrl,
    'role': role,
    'room_id': roomId,
    'created_at': createdAt.toIso8601String(),
  };

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
    id: json['id'] ?? 0,
    name: json['name'] ?? '',
    email: json['email'] ?? '',
    password: json['password'],
    phone: json['phone'],
    avatarUrl: json['avatar_url'],
    role: json['role'] ?? 'member',
    roomId: json['room_id'],
    createdAt: json['created_at'] != null
        ? DateTime.parse(json['created_at'])
        : DateTime.now(),
  );

  UserModel copyWith({
    dynamic id,
    String? name,
    String? email,
    String? password,
    String? phone,
    String? avatarUrl,
    String? role,
    int? roomId,
  }) => UserModel(
    id: id ?? this.id,
    name: name ?? this.name,
    email: email ?? this.email,
    password: password ?? this.password,
    phone: phone ?? this.phone,
    avatarUrl: avatarUrl ?? this.avatarUrl,
    role: role ?? this.role,
    roomId: roomId ?? this.roomId,
    createdAt: createdAt,
  );
}
