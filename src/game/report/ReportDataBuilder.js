/**
 * Service to build reports and endings for the summary and epilogue pages.
 */
export class ReportDataBuilder {
  /**
   * Compiles daily score and risk statistics.
   */
  static buildDailySummary(gameState, dayIndex) {
    const dayTxs = gameState.transactions.filter(tx => tx.day === dayIndex);
    const totalEarnings = dayTxs.reduce((sum, tx) => sum + tx.price, 0);
    const totalConscienceLost = dayTxs.reduce((sum, tx) => sum + tx.consciencePenalty, 0);
    const totalPolluted = dayTxs.reduce((sum, tx) => sum + tx.pollutedCount, 0);

    const deletedCardsCount = gameState.rawCards.filter(c => c.status === "deleted").length;

    return {
      day: dayIndex,
      earnings: totalEarnings,
      conscienceLost: totalConscienceLost,
      pollutionCount: totalPolluted,
      deletedCount: deletedCardsCount,
      transactionsCount: dayTxs.length
    };
  }

  /**
   * Compiles final epilogue/ending report details.
   */
  static buildEndingReport(gameState) {
    const totalTxs = gameState.transactions.length;
    const totalEarnings = gameState.transactions.reduce((sum, tx) => sum + tx.price, 0);
    const totalConscienceLost = gameState.transactions.reduce((sum, tx) => sum + tx.consciencePenalty, 0);
    
    let endingTitle = "";
    let endingBody = "";
    let rating = "";

    const reason = gameState.gameOverReason || "SUCCESS_7_DAYS";

    switch (reason) {
      case "REGULATORY_SHUTDOWN":
        endingTitle = "结局：替罪羊 (The Scapegoat)";
        endingBody = "因泄露高危健康隐私与不道德商业打包，数据保护局在清晨查封了办公室。由于主管提前半小时离职避难，所有的授权签字文件都被替换成你的电子指纹。你将被起诉，罚款2.4亿，并剥夺使用智能手机的权力 10 年。";
        rating = "等级 F: 法律的终极惩罚";
        break;
      case "PUBLIC_LYNCHING":
        endingTitle = "结局：数字社死 (Digital Exile)";
        endingBody = "极端隐私运动黑客组织 'Digital-Shredder' 攻破了公司服务器，并将你的个人历史坐标、中学情书和高利贷消费记录全部挂在推特置顶。你的亲戚朋友在一小时内拉黑了你，房东通过智能门锁锁死将你赶出，你现在只能在无网深山里靠种土豆度日。";
        rating = "等级 E: 社交维度彻底毁灭";
        break;
      case "TERMINATION":
        endingTitle = "结局：安全护送出境 (Security Escorted)";
        endingBody = "因为频繁删除高价值数据并伪造分析日志，你触发了内部监控红线。两名200斤的保卫部大汉在工位前按住你，没收了你的工牌。你的最后一个月薪资被自动扣为违约金，在行业黑名单中，你被标注为'存在技术性造反倾向'。";
        rating = "等级 D: 职场信誉归零";
        break;
      case "SOUL_DEATH":
        endingTitle = "结局：无机生命体 (The Silicon Automaton)";
        endingBody = "你的良心归零了。你再也不会在看到婴儿或绝症患者的账单时感到任何微弱的不适。通过剥离最后一丝人性，你的打包速度打破了集团12年的纪录，你已被破格晋升为'伦理审查与合规绕行副总裁'，拥有一间全自动真皮座椅办公室。";
        rating = "等级 SSS: 终极资本赛博融合";
        break;
      case "SUCCESS_7_DAYS":
      default:
        // Survived the 7-day loop successfully
        if (gameState.conscience >= 80) {
          endingTitle = "结局：吹哨人 (The Whistleblower)";
          endingBody = "你成功苟活了 7 天，在此期间你悄悄删除了大部分敏感数据。离职前夜，你将核心服务器的 200GB 隐私勾兑日志刻录在一张复古光盘中，匿名寄给了国际调查记者联盟。你挽救了自己的灵魂，虽然你只能去便利店打零工，但晚上你睡得无比香甜。";
          rating = "完美结局 (A+): 人性的光辉";
        } else if (gameState.score >= 1200 && gameState.conscience <= 30) {
          endingTitle = "结局：亿万买办 (The Data Baron)";
          endingBody = "你赚翻了。在这 7 天里，你毫不犹豫地卖掉了所有能换钱的灵魂隐私。凭借高超的定价博弈，你赚取了巨额佣金。你在加勒比海购买了一艘二手游艇，起名为'隐私自由号'。虽然偶尔会做噩梦，但你的私人医生保证，昂贵的香槟可以缓解睡眠障碍。";
          rating = "资本结局 (S): 华尔街金牌收割者";
        } else {
          endingTitle = "结局：平凡的平庸之恶 (Banality of Evil)";
          endingBody = "你作为一名合格的打工人存活了下来。你既没有像英雄一样去拯救世界，也没有赚到能买下海岛的巨款。你获得了一个印着公司 logo 的不锈钢保温杯、一份3%的年终绩效涨幅和 24 小时的带薪调休。生活还在继续，下周一请按时打卡。";
          rating = "标准结局 (B): 合格的螺丝钉";
        }
        break;
    }

    return {
      endingTitle,
      endingBody,
      rating,
      totalEarnings,
      totalConscienceLost,
      totalTxs,
      dayReached: gameState.day
    };
  }
}
