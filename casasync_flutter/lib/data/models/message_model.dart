class MessageModel {
  final int id;
  final int roomId;
  final dynamic senderId;
  final String senderName;
  final String content;
  final String? fileUrl;
  final String? fileName;
  final DateTime createdAt;

  MessageModel({
    required this.id,
    required this.roomId,
    required this.senderId,
    required this.senderName,
    required this.content,
    this.fileUrl,
    this.fileName,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
    'id': id,
    'room_id': roomId,
    'sender_id': senderId,
    'sender_name': senderName,
    'content': content,
    'file_url': fileUrl,
    'file_name': fileName,
    'created_at': createdAt.toIso8601String(),
  };

  factory MessageModel.fromJson(Map<String, dynamic> json) => MessageModel(
    id: json['id'] ?? 0,
    roomId: json['room_id'] ?? 0,
    senderId: json['sender_id'] ?? 0,
    senderName: json['sender_name'] ?? '',
    content: json['content'] ?? '',
    fileUrl: json['file_url'],
    fileName: json['file_name'],
    createdAt: json['created_at'] != null
        ? DateTime.parse(json['created_at'])
        : DateTime.now(),
  );

  bool get hasFile => fileUrl != null && fileUrl!.isNotEmpty;
  bool get isImage => hasFile && (fileUrl!.contains('image') || fileUrl!.endsWith('.png') || fileUrl!.endsWith('.jpg'));
}
