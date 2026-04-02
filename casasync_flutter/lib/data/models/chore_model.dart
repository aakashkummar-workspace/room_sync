class ChoreModel {
  final int id;
  final int roomId;
  final String title;
  final dynamic assignedTo;
  final String assignedToName;
  final dynamic createdBy;
  final DateTime dueDate;
  final String status;
  final DateTime createdAt;

  ChoreModel({
    required this.id,
    required this.roomId,
    required this.title,
    required this.assignedTo,
    required this.assignedToName,
    required this.createdBy,
    required this.dueDate,
    this.status = 'pending',
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
    'id': id,
    'room_id': roomId,
    'title': title,
    'assigned_to': assignedTo,
    'assigned_to_name': assignedToName,
    'created_by': createdBy,
    'due_date': dueDate.toIso8601String(),
    'status': status,
    'created_at': createdAt.toIso8601String(),
  };

  factory ChoreModel.fromJson(Map<String, dynamic> json) => ChoreModel(
    id: json['id'] ?? 0,
    roomId: json['room_id'] ?? 0,
    title: json['title'] ?? '',
    assignedTo: json['assigned_to'] ?? 0,
    assignedToName: json['assigned_to_name'] ?? '',
    createdBy: json['created_by'] ?? 0,
    dueDate: json['due_date'] != null
        ? DateTime.parse(json['due_date'])
        : DateTime.now(),
    status: json['status'] ?? 'pending',
    createdAt: json['created_at'] != null
        ? DateTime.parse(json['created_at'])
        : DateTime.now(),
  );

  ChoreModel copyWith({String? status}) => ChoreModel(
    id: id,
    roomId: roomId,
    title: title,
    assignedTo: assignedTo,
    assignedToName: assignedToName,
    createdBy: createdBy,
    dueDate: dueDate,
    status: status ?? this.status,
    createdAt: createdAt,
  );

  bool get isPending => status == 'pending';
  bool get isCompleted => status == 'completed';
}
