class InventoryModel {
  final int id;
  final int roomId;
  final String name;
  final int quantity;
  final int minQuantity;
  final String category;
  final dynamic addedBy;
  final String addedByName;
  final DateTime createdAt;

  InventoryModel({
    required this.id,
    required this.roomId,
    required this.name,
    this.quantity = 1,
    this.minQuantity = 3,
    this.category = 'General',
    required this.addedBy,
    required this.addedByName,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
    'id': id,
    'room_id': roomId,
    'name': name,
    'quantity': quantity,
    'min_quantity': minQuantity,
    'category': category,
    'added_by': addedBy,
    'added_by_name': addedByName,
    'created_at': createdAt.toIso8601String(),
  };

  factory InventoryModel.fromJson(Map<String, dynamic> json) => InventoryModel(
    id: json['id'] ?? 0,
    roomId: json['room_id'] ?? 0,
    name: json['name'] ?? '',
    quantity: json['quantity'] ?? 1,
    minQuantity: json['min_quantity'] ?? 3,
    category: json['category'] ?? 'General',
    addedBy: json['added_by'] ?? 0,
    addedByName: json['added_by_name'] ?? '',
    createdAt: json['created_at'] != null
        ? DateTime.parse(json['created_at'])
        : DateTime.now(),
  );

  InventoryModel copyWith({int? quantity, int? minQuantity, String? name, String? category}) =>
      InventoryModel(
        id: id,
        roomId: roomId,
        name: name ?? this.name,
        quantity: quantity ?? this.quantity,
        minQuantity: minQuantity ?? this.minQuantity,
        category: category ?? this.category,
        addedBy: addedBy,
        addedByName: addedByName,
        createdAt: createdAt,
      );

  String get stockStatus {
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= minQuantity) return 'Low Stock';
    return 'In Stock';
  }
}
