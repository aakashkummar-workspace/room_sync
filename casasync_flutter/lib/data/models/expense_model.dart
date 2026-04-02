class ExpenseSplit {
  final int id;
  final dynamic userId;
  final String userName;
  final double amount;
  final bool isPaid;

  ExpenseSplit({
    required this.id,
    required this.userId,
    required this.userName,
    required this.amount,
    this.isPaid = false,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'user_id': userId,
    'user_name': userName,
    'amount': amount,
    'is_paid': isPaid,
  };

  factory ExpenseSplit.fromJson(Map<String, dynamic> json) => ExpenseSplit(
    id: json['id'] ?? 0,
    userId: json['user_id'] ?? 0,
    userName: json['user_name'] ?? '',
    amount: (json['amount'] ?? 0).toDouble(),
    isPaid: json['is_paid'] ?? false,
  );

  ExpenseSplit copyWith({bool? isPaid}) => ExpenseSplit(
    id: id,
    userId: userId,
    userName: userName,
    amount: amount,
    isPaid: isPaid ?? this.isPaid,
  );
}

class ExpenseModel {
  final int id;
  final int roomId;
  final String title;
  final double amount;
  final String category;
  final dynamic paidBy;
  final String paidByName;
  final DateTime createdAt;
  final List<ExpenseSplit> splits;

  ExpenseModel({
    required this.id,
    required this.roomId,
    required this.title,
    required this.amount,
    this.category = 'General',
    required this.paidBy,
    required this.paidByName,
    DateTime? createdAt,
    this.splits = const [],
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
    'id': id,
    'room_id': roomId,
    'title': title,
    'amount': amount,
    'category': category,
    'paid_by': paidBy,
    'paid_by_name': paidByName,
    'created_at': createdAt.toIso8601String(),
    'splits': splits.map((s) => s.toJson()).toList(),
  };

  factory ExpenseModel.fromJson(Map<String, dynamic> json) => ExpenseModel(
    id: json['id'] ?? 0,
    roomId: json['room_id'] ?? 0,
    title: json['title'] ?? '',
    amount: (json['amount'] ?? 0).toDouble(),
    category: json['category'] ?? 'General',
    paidBy: json['paid_by'] ?? 0,
    paidByName: json['paid_by_name'] ?? '',
    createdAt: json['created_at'] != null
        ? DateTime.parse(json['created_at'])
        : DateTime.now(),
    splits: (json['splits'] as List?)
        ?.map((s) => ExpenseSplit.fromJson(s))
        .toList() ?? [],
  );
}
