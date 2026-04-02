class NoteModel {
  final int id;
  final int roomId;
  final String content;
  final String color;
  final dynamic createdBy;
  final String authorName;
  final DateTime createdAt;

  NoteModel({
    required this.id,
    required this.roomId,
    required this.content,
    this.color = 'yellow',
    required this.createdBy,
    required this.authorName,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
    'id': id,
    'room_id': roomId,
    'content': content,
    'color': color,
    'created_by': createdBy,
    'author_name': authorName,
    'created_at': createdAt.toIso8601String(),
  };

  factory NoteModel.fromJson(Map<String, dynamic> json) => NoteModel(
    id: json['id'] ?? 0,
    roomId: json['room_id'] ?? 0,
    content: json['content'] ?? '',
    color: json['color'] ?? 'yellow',
    createdBy: json['created_by'] ?? 0,
    authorName: json['author_name'] ?? '',
    createdAt: json['created_at'] != null
        ? DateTime.parse(json['created_at'])
        : DateTime.now(),
  );

  NoteModel copyWith({String? content, String? color}) => NoteModel(
    id: id,
    roomId: roomId,
    content: content ?? this.content,
    color: color ?? this.color,
    createdBy: createdBy,
    authorName: authorName,
    createdAt: createdAt,
  );
}
