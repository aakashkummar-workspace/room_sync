class HouseRuleModel {
  final int id;
  final int roomId;
  final String ruleText;
  final DateTime createdAt;

  HouseRuleModel({
    required this.id,
    required this.roomId,
    required this.ruleText,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
    'id': id,
    'room_id': roomId,
    'rule_text': ruleText,
    'created_at': createdAt.toIso8601String(),
  };

  factory HouseRuleModel.fromJson(Map<String, dynamic> json) => HouseRuleModel(
    id: json['id'] ?? 0,
    roomId: json['room_id'] ?? 0,
    ruleText: json['rule_text'] ?? '',
    createdAt: json['created_at'] != null
        ? DateTime.parse(json['created_at'])
        : DateTime.now(),
  );
}
