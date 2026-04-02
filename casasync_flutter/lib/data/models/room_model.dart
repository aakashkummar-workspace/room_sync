class RoomModel {
  final int id;
  final String name;
  final String inviteCode;
  final dynamic createdBy;
  final DateTime createdAt;

  RoomModel({
    required this.id,
    required this.name,
    required this.inviteCode,
    required this.createdBy,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'invite_code': inviteCode,
    'created_by': createdBy,
    'created_at': createdAt.toIso8601String(),
  };

  factory RoomModel.fromJson(Map<String, dynamic> json) => RoomModel(
    id: json['id'] ?? 0,
    name: json['name'] ?? '',
    inviteCode: json['invite_code'] ?? '',
    createdBy: json['created_by'] ?? 0,
    createdAt: json['created_at'] != null
        ? DateTime.parse(json['created_at'])
        : DateTime.now(),
  );
}
