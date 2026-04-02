import '../models/models.dart';
import 'supabase_db_service.dart';

class HouseRulesService {
  Future<List<HouseRuleModel>> getRules(int roomId) async {
    final rules = await SupabaseDB.getRules(roomId);
    return rules.map((r) => HouseRuleModel.fromJson(r)).toList();
  }

  Future<HouseRuleModel> addRule(int roomId, String ruleText) async {
    final rule = await SupabaseDB.addRule({
      'room_id': roomId,
      'rule_text': ruleText,
    });
    return HouseRuleModel.fromJson(rule);
  }

  Future<void> updateRule(int ruleId, String ruleText) async {
    await SupabaseDB.updateRule(ruleId, ruleText);
  }

  Future<void> deleteRule(int ruleId) async {
    await SupabaseDB.deleteRule(ruleId);
  }
}
