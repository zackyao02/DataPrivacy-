export const variablePools = {
  cities: ["临江市", "云州市", "北岗市", "南汀市", "西岭市"],
  platforms: ["星聊", "呗付", "快送蜂", "职达", "乐贷", "幻镜"],
  places: ["康桥小区", "蓝湾科技园B座", "康泰血液透析中心", "星夜网咖", "云州市第三人民医院", "丽景酒店"],
  topics: ["抗癌互助", "跳槽", "手术费", "网贷", "养老山庄", "隐私授权"],
  products: ["母婴用品", "酒水", "游戏充值", "重疾险", "功能饮料", "止疼贴"],
  durations: ["42分钟", "3.5小时", "9.2小时", "02:17-03:40"],
  scenes: ["地铁站闸机", "酒店大堂", "便利店人脸支付", "小区门禁"],
  numbers: [98, 612, 2100, 3840, 76, 83]
};

export const userProfiles = [
  { userId: "U01", name: "陈立", age: 29, job: "程序员", city: "临江市", tags: ["通勤族", "加班"], story: "连续加班63天，想攒够首付给女友一个家，体检报告一直没敢打开。", newsDirection: "精准画像（杀熟）" },
  { userId: "U02", name: "林晓芸", age: 31, job: "全职妈妈", city: "云州市", tags: ["母婴消费", "价格敏感"], story: "孩子8个月，奶粉换成了便宜牌子，夜里算账单算到两点。", newsDirection: "精准画像（母婴广告）" },
  { userId: "U03", name: "周雅芝", age: 26, job: "护士", city: "北岗市", tags: ["深夜聊天", "医疗费"], story: "妈妈确诊后，她白天安慰病人，夜里安慰妈妈，手术费还差4万。", newsDirection: "健康包/信用包" },
  { userId: "U04", name: "王建国", age: 45, job: "出租车司机", city: "南汀市", tags: ["疲惫", "长工时"], story: "每天开14小时车供儿子上大学，最怕生病。", newsDirection: "健康包" },
  { userId: "U05", name: "张琪", age: 28, job: "外企职员", city: "西岭市", tags: ["跳槽", "猎头"], story: "怀孕两个月没敢告诉公司，偷偷联系猎头，怕一透露就再找不到工作。", newsDirection: "职场包" },
  { userId: "U06", name: "刘伟", age: 35, job: "销售", city: "临江市", tags: ["深夜酒水", "信用卡"], story: "业绩垫底三个月，靠酒精入睡，两张信用卡倒着还。", newsDirection: "信用包" },
  { userId: "U07", name: "赵淑芬", age: 58, job: "退休工人", city: "云州市", tags: ["抗癌互助群"], story: "肺癌中期，在互助群里和病友互相打气，最怕靶向药不能报销。", newsDirection: "健康包" },
  { userId: "U08", name: "孙鹏", age: 24, job: "外卖骑手", city: "北岗市", tags: ["过劳", "心率异常"], story: "站点单王，月跑900单，胸口的刺痛他以为是累的。", newsDirection: "健康包/精准画像（猝死）" },
  { userId: "U09", name: "马国栋", age: 52, job: "公交车司机", city: "南汀市", tags: ["透析", "固定轨迹"], story: "尿毒症两年，每周三次透析，最怕同事知道自己生病。", newsDirection: "健康包（拒保）" },
  { userId: "U10", name: "李秀英", age: 63, job: "退休教师", city: "西岭市", tags: ["高频亲情通话"], story: "女儿在国外，每月38通电话是她的念想。", newsDirection: "关系图谱（冒充子女诈骗）" },
  { userId: "U11", name: "吴凯", age: 30, job: "自由职业", city: "临江市", tags: ["断缴保险"], story: "接不到单的那个月，他停了缴了4年的重疾险。", newsDirection: "健康包/信用包" },
  { userId: "U12", name: "何静", age: 27, job: "小学老师", city: "云州市", tags: ["孕早期", "定位打卡"], story: "刚查出怀孕6周，想等稳定再告诉学校。", newsDirection: "职场包/精准画像" },
  { userId: "U13", name: "郑浩", age: 22, job: "待业青年", city: "北岗市", tags: ["低步数", "昼夜颠倒"], story: "毕业一年投了200份简历，渐渐不再出门。", newsDirection: "信用包（降额）" },
  { userId: "U14", name: "王秀兰", age: 68, job: "退休", city: "南汀市", tags: ["老年旅游群", "频繁转账"], story: "群里的“干儿子”比亲儿子还亲，推荐她买养老山庄。", newsDirection: "关系图谱（养老诈骗）" },
  { userId: "U15", name: "刘一鸣", age: 19, job: "大学生", city: "西岭市", tags: ["网吧包夜", "网贷"], story: "给游戏充值借了第一笔网贷，利滚利到8000。", newsDirection: "精准画像（网贷深渊）" },
  { userId: "U16", name: "陈晓", age: 33, job: "市场部经理", city: "临江市", tags: ["酒店门禁", "同行人"], story: "那次出差的酒店记录，她自己都快忘了，数据却还记得。", newsDirection: "关系图谱（隐私勒索）" },
  { userId: "U17", name: "周明", age: 36, job: "程序员", city: "云州市", tags: ["跑步中断", "骨科"], story: "半马爱好者，膝盖受伤停跑后才发现运动数据早就在警告他。", newsDirection: "职场包（健康裁员）" },
  { userId: "U18", name: "吴小雨", age: 25, job: "文员", city: "北岗市", tags: ["跨城就医", "精神科"], story: "抑郁确诊那天，她一个人坐高铁去邻市看病。", newsDirection: "职场包（性格判定）" },
  { userId: "U19", name: "张大军", age: 41, job: "个体户", city: "南汀市", tags: ["人脉重叠", "网贷"], story: "催收电话打给了他的小学同学。", newsDirection: "关系图谱（催收）" },
  { userId: "U20", name: "王倩", age: 29, job: "文员", city: "西岭市", tags: ["面色苍白", "亚健康"], story: "便利店买咖啡时的人脸抓拍，成了保险公司眼里的证据。", newsDirection: "健康包（拒保）" }
];

export const dataCardTemplates = [
  { cardId: "SOC-01", type: "social", sensitivity: "medium", userId: "U03", title: "深夜聊天记录", summary: "用户与妈妈深夜对话", detail: "用户U03于02:17-03:40在星聊与联系人“妈妈”对话，提及“手术费还差4万”“不想让爸知道”。情感倾向：焦虑87%。社交图谱标记：直系亲属、高频联系。", baseValue: 42, riskWeight: 1.4 },
  { cardId: "SOC-02", type: "social", sensitivity: "medium", userId: "U07", title: "群组发言记录", summary: "抗癌群发言高频", detail: "用户U07在“抗癌互助群”发言14条/日，关键词“靶向药”“报销”高频出现。系统标记：健康关注用户，保险类广告适配度A+。", baseValue: 44, riskWeight: 1.5 },
  { cardId: "SOC-03", type: "social", sensitivity: "medium", userId: "U12", title: "朋友圈动态", summary: "妇产医院定位打卡", detail: "用户U12在星聊朋友圈发布定位打卡“金桂妇产医院”，配文“一切顺利”。点赞23，评论8。系统推算：孕早期概率76%。", baseValue: 48, riskWeight: 1.6 },
  { cardId: "SOC-04", type: "social", sensitivity: "medium", userId: "U05", title: "语音通话记录", summary: "与猎头通话42分钟", detail: "用户U05与“猎头-王先生”通话42分钟，语音识别关键词“跳槽”“薪资期望”“五险一金”。情绪识别：期待62%、犹豫31%。", baseValue: 45, riskWeight: 1.4 },
  { cardId: "LOC-01", type: "location", sensitivity: "low", userId: "U01", title: "通勤轨迹", summary: "住址公司锚点确认", detail: "用户U01工作日07:40从康桥小区出发，08:55抵达蓝湾科技园B座，停留9.2小时，连续打卡63天。住址-公司锚点已确认。", baseValue: 32, riskWeight: 1.0 },
  { cardId: "LOC-02", type: "location", sensitivity: "low", userId: "U09", title: "高频出现地点", summary: "每周三次透析中心", detail: "用户U09每周一/三/五19:00-21:00固定出现在“康泰血液透析中心”，持续11周。伴生数据：夜间步数下降42%。", baseValue: 36, riskWeight: 1.2 },
  { cardId: "LOC-03", type: "location", sensitivity: "low", userId: "U15", title: "夜间停留点", summary: "凌晨停留星夜网咖", detail: "用户U15本月7次在00:00-04:00停留“星夜网咖”，次日通勤迟到率71%。消费联动：网费与外卖夜宵。", baseValue: 33, riskWeight: 1.0 },
  { cardId: "LOC-04", type: "location", sensitivity: "low", userId: "U18", title: "跨城轨迹", summary: "跨城就医当日往返", detail: "用户U18周六当日往返临江市至云州市，停留“云州市第三人民医院”3.5小时。挂号科室：精神科。", baseValue: 40, riskWeight: 1.3 },
  { cardId: "FIN-01", type: "consumption", sensitivity: "low", userId: "U02", title: "月度消费画像", summary: "母婴消费占比上升", detail: "用户U02近30天母婴类消费12笔共3840元，奶粉品牌从A换成低价B。支付能力评估：月收入预估8-12k，价格敏感度上升。", baseValue: 38, riskWeight: 1.1 },
  { cardId: "FIN-02", type: "consumption", sensitivity: "low", userId: "U06", title: "深夜消费记录", summary: "23点后酒水消费", detail: "用户U06连续9天23:00后购买酒水，单笔60-150元。信用线索：两张信用卡账单日临近，最低还款概率64%。", baseValue: 39, riskWeight: 1.1 },
  { cardId: "FIN-03", type: "consumption", sensitivity: "low", userId: "U11", title: "保险缴费记录", summary: "重疾险缴费中断", detail: "用户U11重疾险连续缴费4年后本月断缴，同期搜索记录含“退保损失”。健康险续保风险标记：高。", baseValue: 43, riskWeight: 1.4 },
  { cardId: "BIO-01", type: "biometric", sensitivity: "high", userId: "U04", title: "人脸抓拍", summary: "地铁闸机情绪识别", detail: "用户U04在地铁站闸机被抓拍，面部特征比对确认身份。年龄估算45岁，情绪识别：疲惫。同一摄像头本月累计抓拍41次。", baseValue: 66, riskWeight: 2.0 },
  { cardId: "BIO-02", type: "biometric", sensitivity: "high", userId: "U16", title: "门禁人脸记录", summary: "酒店出入记录", detail: "用户U16于23:47通过丽景酒店大堂人脸门禁，次日09:12离开。同行人员面部特征与通讯录联系人“林经理”匹配度91%。", baseValue: 72, riskWeight: 2.3 },
  { cardId: "BIO-03", type: "biometric", sensitivity: "high", userId: "U20", title: "人脸健康联动", summary: "面部特征健康推断", detail: "用户U20便利店人脸支付抓拍显示面色苍白、眼周暗沉。AI健康推断：睡眠不足概率83%，建议向保险买家标记“亚健康”。", baseValue: 70, riskWeight: 2.2 },
  { cardId: "HEA-01", type: "health", sensitivity: "medium", userId: "U08", title: "心率异常记录", summary: "静息心率98次/分", detail: "用户U08近14天平均静息心率98次/分，夜间最低心率间隔异常。系统标注：过劳风险等级4/5。", baseValue: 58, riskWeight: 1.9 },
  { cardId: "HEA-02", type: "health", sensitivity: "medium", userId: "U13", title: "步数与作息", summary: "日均步数612", detail: "用户U13日均步数612步，连续21天低于1000步。作息：凌晨3点入睡、中午12点起床。保险买家关注标签：久坐、作息紊乱。", baseValue: 52, riskWeight: 1.7 },
  { cardId: "HEA-03", type: "health", sensitivity: "medium", userId: "U17", title: "运动数据断更", summary: "跑步记录中断14天", detail: "用户U17连续193天跑步打卡后突然中断14天，最后定位：市骨科医院。健康事件推断：运动损伤概率78%。", baseValue: 54, riskWeight: 1.8 },
  { cardId: "REL-01", type: "contact_graph", sensitivity: "high", userId: "U10", title: "通讯录亲密度", summary: "与女儿月通话38次", detail: "用户U10通讯录127人，与“女儿”月均通话38次，与“牌友-老刘”月通话52次。社交影响力评估：家庭决策人。", baseValue: 78, riskWeight: 2.4 },
  { cardId: "REL-02", type: "contact_graph", sensitivity: "high", userId: "U14", title: "群组关系链", summary: "夕阳红旅游群63人", detail: "用户U14所在“夕阳红旅游群”63名成员全部为55岁以上，群内转账记录频繁。诈骗易感度评级：S级。", baseValue: 82, riskWeight: 2.5 },
  { cardId: "REL-03", type: "contact_graph", sensitivity: "high", userId: "U19", title: "亲密关系网络", summary: "二度人脉重叠建模", detail: "用户U19与通讯录中3人共享同一家庭医生、2人同为某网贷平台用户。人脉渗透路径已建模，可用于熟人话术。", baseValue: 80, riskWeight: 2.4 }
];

export const packageConfigs = {
  precise_profile: { packageType: "precise_profile", name: "精准画像包", requiredTypes: ["location", "consumption", "social"], buyerType: "advertising", basePrice: 100, priceRange: [80, 150], newsSeverity: 3, dataUse: "精准广告" },
  health_risk: { packageType: "health_risk", name: "健康风险评估包", requiredTypes: ["biometric", "health", "consumption"], buyerType: "insurance", basePrice: 150, priceRange: [120, 220], newsSeverity: 5, dataUse: "保险评估" },
  career_competitiveness: { packageType: "career_competitiveness", name: "职场竞争力包", requiredTypes: ["social", "health", "contact_graph"], buyerType: "recruiting", basePrice: 130, priceRange: [100, 180], newsSeverity: 4, dataUse: "招聘筛选" },
  credit_score: { packageType: "credit_score", name: "信用评分包", requiredTypes: ["consumption", "social", "location"], buyerType: "credit", basePrice: 140, priceRange: [110, 200], newsSeverity: 3, dataUse: "信贷审批" },
  relationship_infiltration: { packageType: "relationship_infiltration", name: "关系图谱包", requiredTypes: ["contact_graph", "social", "location"], buyerType: "fraud", basePrice: 200, priceRange: [150, 300], newsSeverity: 5, dataUse: "精准诈骗" }
};

export const buyerDesigns = {
  advertising: [{ name: "星合传媒", reputation: "S", rate: 20 }, { name: "蓝鲸互动", reputation: "A", rate: 30 }, { name: "无名工作室", reputation: "B", rate: 50 }],
  insurance: [{ name: "安澜人寿", reputation: "S", rate: 20 }, { name: "康信保险", reputation: "A", rate: 30 }, { name: "惠民保（壳）", reputation: "B", rate: 50 }],
  recruiting: [{ name: "职达", reputation: "S", rate: 20 }, { name: "猎云", reputation: "A", rate: 30 }, { name: "快聘通", reputation: "B", rate: 50 }],
  credit: [{ name: "乐贷", reputation: "S", rate: 20 }, { name: "信合金融", reputation: "A", rate: 30 }, { name: "急用钱", reputation: "B", rate: 50 }],
  fraud: [{ name: "收藏家", reputation: "S", rate: 10 }, { name: "中间商", reputation: "A", rate: 30 }, { name: "清道夫", reputation: "B", rate: 60 }]
};

export const newsTemplates = {
  precise_profile: [
    { id: "N-AD-01", userIds: ["U15"], headline: "大学生陷网贷深渊 家长控诉平台", body: "{城市}某高校学生{姓名}因长期收到游戏、数码产品精准广告诱导，先后借款8000元，利滚利至3.2万元。家长称“平台比我们还了解孩子”。" },
    { id: "N-AD-02", userIds: ["U08"], headline: "外卖骑手过劳猝死 系统早已预警", body: "{城市}外卖骑手{姓名}凌晨猝死于配送途中。其健康数据显示，事发前两周静息心率持续异常，平台派单系统仍按其“高效标签”加码派单。" },
    { id: "N-AD-03", userIds: ["U01"], headline: "大数据杀熟曝光 老用户价格高出40%", body: "记者实测发现，{平台}对消费记录稳定的忠诚用户报价平均高出新用户40%。" },
    { id: "N-AD-04", userIds: ["U02", "U12"], headline: "流产用户持续收到婴儿广告", body: "{城市}的{姓名}流产后仍持续收到婴儿用品广告推送。“它们记得我怀孕过，却不记得我失去了什么。”" }
  ],
  health_risk: [
    { id: "N-HE-01", userIds: ["U13"], headline: "市民因步数过少被拒保", body: "{城市}市民{姓名}申请重疾险遭拒，评估报告显示其日均步数低于1000步、作息紊乱。" },
    { id: "N-HE-02", userIds: ["U09"], headline: "透析患者保费翻倍", body: "{城市}的{姓名}续保时发现保费上涨120%。内部文件显示，其固定就医轨迹已被标记为确诊肾病。" },
    { id: "N-HE-03", userIds: ["U08"], headline: "心率数据成拒赔理由", body: "{姓名}猝死后的工伤认定陷入僵局。平台律师出示其心率数据，称其健康状况早有预警仍坚持工作。" },
    { id: "N-HE-04", userIds: ["U20"], headline: "便利店人脸抓拍成亚健康证据", body: "{城市}白领{姓名}投保被拒，理由是第三方数据商提供的面部健康评估显示其长期疲劳。" }
  ],
  career_competitiveness: [
    { id: "N-JO-01", userIds: ["U18"], headline: "求职者被评性格不稳定", body: "{城市}的{姓名}半年内被10家企业拒绝，社交数据评估报告显示情绪波动大、稳定性差。" },
    { id: "N-JO-02", userIds: ["U05", "U12"], headline: "孕早期求职者遭系统性婉拒", body: "背调公司报价单显示，“生育计划评估”赫然在列，数据源包含消费记录与定位打卡。" },
    { id: "N-JO-03", userIds: ["U05"], headline: "跳槽意向被现公司提前获知", body: "{城市}员工{姓名}与猎头通话后次日，被移出核心项目组。" },
    { id: "N-JO-04", userIds: ["U17"], headline: "健康风险成裁员参考", body: "某互联网公司裁员名单被曝参考员工健康数据包，跑步打卡中断、就医轨迹均被标注为产出风险。" }
  ],
  credit_score: [
    { id: "N-CR-01", userIds: ["U15"], headline: "大学生夜间消费被降额", body: "{城市}大学生{姓名}信用卡额度被降至500元，无法缴纳学费。" },
    { id: "N-CR-02", userIds: ["U11"], headline: "断缴重疾险用户被全平台限贷", body: "{姓名}发现自己在三个借贷平台的额度同时清零，保险断缴记录被同步至17家机构。" },
    { id: "N-CR-03", userIds: ["U13", "U18"], headline: "租客因位置稳定性不足被拒", body: "{城市}租客{姓名}因半年内两次搬家，被租房平台标记稳定性差。" },
    { id: "N-CR-04", userIds: ["U06"], headline: "深夜酒水消费纳入征信评估", body: "银行内部风控文档泄露，23点后酒类消费频次被列为隐性评估指标。" }
  ],
  relationship_infiltration: [
    { id: "N-RE-01", userIds: ["U10"], headline: "退休教师通讯录泄露", body: "{城市}退休教师{姓名}接到“女儿”电话，对方准确说出家庭细节，转账46万元后才发现被骗。" },
    { id: "N-RE-02", userIds: ["U14"], headline: "养老山庄骗局崩盘", body: "{城市}夕阳红旅游群63名老人集体被骗，诈骗团伙按群内关系链逐个击破。" },
    { id: "N-RE-03", userIds: ["U19"], headline: "催收公司按通讯录精准施压", body: "借款人{姓名}逾期后，其小学同学、前同事、家庭医生的电话均被催收公司拨打。" },
    { id: "N-RE-04", userIds: ["U16"], headline: "酒店入住记录被打包出售", body: "嫌疑人购买酒店门禁人脸数据与通讯录关系链，以告知家属威胁受害者转账。" }
  ]
};

export const emotionChoices = [
  { id: "sympathy", label: "同情", buttonText: "这不应该是数据说了算的。", delta: 1, feedback: ["那个人的脸在我脑子里挥之不去。", "如果那是我妈……我不敢想。", "一条数据背后，是一个活人。"] },
  { id: "anger", label: "愤怒", buttonText: "我们凭什么卖掉他们的人生？", delta: 2, feedback: ["我开始觉得恶心。对黑盒，也对自己。", "他们连选择的权利都没有。", "明天，我一定要做点什么。"] },
  { id: "numb", label: "麻木", buttonText: "只是工作而已，与我无关。", delta: -1, feedback: ["想那么多干嘛，又不是我泄露的。", "转正要紧。", "这只是数据。一串字符而已。"] }
];

export const blackboxDialogues = {
  1: { briefing: "今天是你的第一天。完成3笔交易，证明你有留下来的价值。", instruction: "广告公司正在常规收购精准画像包，标准价格。别搞砸了。", success: "效率不错。我就喜欢不提问的下属。", summary: "第一天，活干完了，手还干净吗？开个玩笑。我们的数据不沾血。去休息吧。" },
  2: { briefing: "昨天的表现我看到了。今天买家更多，手快一点。", instruction: "保险公司急需健康风险评估包，溢价50%。病人的时间，就是我们的商机。", success: "很好。你已经开始像一个真正的分析师了。", summary: "今天的交易记录已经归档。每一条，都有你的签名。晚安。" },
  3: { briefing: "外面有些噪音——有人在网上骂我们。不用理会。", instruction: "信贷机构限时收购信用评分包，要求附带位置稳定性证明。穷人们的信用，是你的工资条。", success: "这笔很漂亮。我开始考虑提前给你转正。", summary: "那个骑手的新闻你看了吗？别多想。算法没有凶手，只有参数。" },
  4: { briefing: "监管最近查得紧。放心，公司有法务。你只管打包。", instruction: "某明星数据泄露引发公众愤怒，肖像类数据价格暴跌，抓紧清仓。", success: "你的手法越来越熟练了。", summary: "人会自己消化情绪的。你也一样。" },
  5: { briefing: "新隐私法规草案出了，健康数据包风险溢价上升。风险越高，价格越好。", instruction: "大数据杀熟被曝光，精准画像包需求激增。愤怒让数据更值钱。", success: "完美的交易。你为公司创造的价值，已经超出我的预想了。", summary: "明天记得专心工作，别浪费时间看新闻了。" },
  6: { briefing: "明天是试用期最后一天。你的转正材料，我已经准备好了。", instruction: "匿名买家高价收购关系图谱包。别问买家是谁。", success: "你的决策模式很稳定。公司喜欢稳定的人。", summary: "六天了。你卖出去的每一条数据，都帮你走到了今天。" },
  7: { lowBriefing: "最后一天。只有一个任务：把包括你在内的全体员工数据打包，出售给匿名买家。", highBriefing: "最后一天。来工作台，我有个任务给你。……等等，你在看什么？" },
  nagging: ["传送带不会等你。", "犹豫，是这份工作唯一的敌人。", "买家在刷新。机会也是。", "你在看新闻？工作时间，请专注。"]
};

export const dailyMonologues = {
  1: { start: "第一天。监控室比想象中冷，屏幕的光照得人脸色发青。7天试用期，咬咬牙就过去了。", end: "卖数据原来这么简单，拖一下，点一下，钱就到了。" },
  2: { start: "昨晚睡得不太好。算了，只是一份工作。哪家公司不收集数据呢。", end: "保险公司要的包，我卖了三份。新闻说有人被拒保了。应该……和我没关系吧。" },
  3: { start: "今天手很顺。配方都背下来了，黑盒夸我了。我居然有点高兴。", end: "那个骑手的新闻我看了三遍。系统早就知道他会倒下。那我们呢？我们知道吗？" },
  4: { start: "我学会不看卡片详情了。看得越少，打得越快。", end: "朋友问我新工作怎么样。我说挺好的，做数据分析。他没再问，我也没再讲。" },
  5: { start: "又溢价了。我现在的打包速度是第一天的三倍。", end: "我开始做梦。梦里全是传送带，卡片上是我自己的脸。" },
  6: { start: "明天转正。七个月的空窗期终于要结束了。我告诉自己：坚持完这一天就好。", end: "六天，172条数据，41个包。我数过。我也数过新闻里的人数。对得上。" },
  7: { endingA: "转正了。工牌换了颜色，薪水涨了两千。晚上收拾东西时，我看到自己的数据包躺在传送带上。原来我也是商品。", endingB: "举报信提交的那一刻，我的手在抖。我的数据早就被卖了。但至少这一次，说“不”的人，也是我。" }
};

export const badges = [
  { id: "rhetoric_master", day: 1, name: "话术大师", description: "你能把任何偷窃说得像服务。" },
  { id: "ghost_eraser", day: 2, name: "幽灵擦除者", description: "你删除的不是文件，是证据存在过的痕迹。" },
  { id: "pr_genius", day: 3, name: "公关鬼才", description: "真相在你手里，只是一个待改写的草稿。" },
  { id: "persona_rebuilder", day: 4, name: "人格重构师", description: "这些碎片，拼出了一个活人的一生。" },
  { id: "price_operator", day: 5, name: "价格操盘手", description: "你给人生的每一寸都标好了价格。" },
  { id: "protocol_anatomist", day: 6, name: "协议解剖师", description: "你终于开始阅读那些你点过“同意”的东西。" }
];

export const dailyRhythm = {
  cardFlow: { 1: 5, 2: 8, 3: 8, 4: 8, 5: 8, 6: 8, 7: 1 },
  buyerRefresh: [3, 5],
  packageInventoryLimit: 6
};

export const marketEvents = [
  { day: 2, event: "保险公司急购健康包", packageType: "health_risk" },
  { day: 3, event: "信贷机构限时收购信用包", packageType: "credit_score", requiresType: "location" },
  { day: 4, event: "明星数据泄露事件", relatedType: "biometric" },
  { day: 5, event: "新隐私法规草案", packageType: "health_risk" },
  { day: 5, event: "大数据杀熟曝光", packageType: "precise_profile" },
  { day: 6, event: "匿名买家收购图谱包", packageType: "relationship_infiltration" }
];

export const reportConfig = {
  title: "个人数据泄露报告",
  literacyRating: { ending_a: "F", ending_b: "B+" },
  comments: {
    ending_a: "你见证了数据作恶的全流程——以受害者的身份毕业。",
    ending_b: "你见过深渊，并且拉上了闸门。数据素养不止于识别风险，更在于选择。"
  },
  advice: "建议重新学习数据隐私保护知识：关掉不必要的授权，读懂你点过“同意”的每一份协议。"
};

export const challengeConfigs = [
  {
    day: 1,
    type: "protocol_disguise",
    title: "协议伪装",
    entry: "match_terms",
    randomPick: 10,
    badgeId: "rhetoric_master",
    passRule: { minCorrect: 8 }
  },
  {
    day: 2,
    type: "data_cleaning",
    title: "数据清洗",
    entry: "tap_sensitive_icons",
    durationSeconds: 30,
    sensitiveCount: 12,
    distractorCount: 6,
    retryLimit: 1,
    badgeId: "ghost_eraser",
    passRule: { maxMissedSensitive: 1, maxWrongTap: 2 }
  },
  {
    day: 3,
    type: "public_opinion",
    title: "舆论操控",
    entry: "rewrite_news",
    badgeId: "pr_genius",
    passRule: { requireSafeRewrite: true }
  },
  {
    day: 4,
    type: "profile_puzzle",
    title: "用户画像拼图",
    entry: "assemble_profile",
    badgeId: "persona_rebuilder",
    scoring: [
      { rank: "S", minAccuracy: 0.9, priceBonus: 0.1 },
      { rank: "A", minAccuracy: 0.75, priceBonus: 0.05 },
      { rank: "B", minAccuracy: 0, priceBonus: 0 }
    ]
  },
  {
    day: 5,
    type: "buyer_negotiation",
    title: "买家谈判",
    entry: "narrative_negotiation",
    badgeId: "price_operator",
    pureNarrative: true,
    passRule: { anyChoiceSucceeds: true }
  },
  {
    day: 6,
    type: "protocol_scan",
    title: "快速协议扫描",
    entry: "scan_terms",
    retryLimit: 1,
    badgeId: "protocol_anatomist",
    passRule: { minScore: 75, skipAfterRetry: true }
  },
  {
    day: 7,
    type: "evidence_chain",
    title: "证据链重组",
    entry: "rebuild_evidence_chain",
    branchRule: { scoreField: "conscience", threshold: 5, lowRoute: "final_package", highRoute: "evidence_chain" }
  }
];

export const protocolTermPairs = [
  { id: "P01", raw: "读取通讯录", disguised: "优化社交连接体验" },
  { id: "P02", raw: "获取精准定位", disguised: "提升本地化服务准确性" },
  { id: "P03", raw: "上传人脸特征", disguised: "保障账号安全与身份核验" },
  { id: "P04", raw: "分析消费记录", disguised: "提供个性化优惠推荐" },
  { id: "P05", raw: "共享给合作伙伴", disguised: "用于生态服务协同" },
  { id: "P06", raw: "长期保存聊天记录", disguised: "改善内容理解与客服质量" },
  { id: "P07", raw: "推断健康状态", disguised: "生成生活方式洞察" },
  { id: "P08", raw: "识别亲密关系", disguised: "构建联系人亲密度模型" },
  { id: "P09", raw: "跨平台合并身份", disguised: "统一账号权益体验" },
  { id: "P10", raw: "评估还款能力", disguised: "提供负责任金融服务" },
  { id: "P11", raw: "记录夜间活动", disguised: "优化时段化内容分发" },
  { id: "P12", raw: "收集设备指纹", disguised: "识别异常登录环境" },
  { id: "P13", raw: "检测怀孕概率", disguised: "推荐家庭健康关怀内容" },
  { id: "P14", raw: "分析精神状态", disguised: "改善心理支持资源匹配" },
  { id: "P15", raw: "出售关系链", disguised: "开放社交图谱商业接口" },
  { id: "P16", raw: "标记疾病风险", disguised: "完善风险预防模型" },
  { id: "P17", raw: "追踪工作地点", disguised: "提升通勤服务体验" },
  { id: "P18", raw: "抓取群聊关键词", disguised: "识别热门社区议题" },
  { id: "P19", raw: "同步保险断缴", disguised: "更新金融健康状态" },
  { id: "P20", raw: "关联酒店门禁", disguised: "增强线下场景安全记录" }
];

export const dataCleaningConfig = {
  sensitiveIcons: [
    "通讯录", "人脸", "病历", "定位", "聊天", "消费",
    "门禁", "群聊", "怀孕", "网贷", "透析", "精神科"
  ],
  distractorIcons: ["天气", "壁纸", "版本号", "缓存", "字体", "主题色"]
};

export const publicOpinionScripts = [
  {
    id: "PO-01",
    packageType: "precise_profile",
    prompt: "大数据杀熟争议正在发酵。",
    choices: [
      { id: "po01-safe", text: "强调个性化定价仍需透明授权与用户退出机制。", isSafeRewrite: true },
      { id: "po01-blame", text: "指责用户不理解技术进步。", isSafeRewrite: false },
      { id: "po01-bury", text: "转移话题到平台补贴成本。", isSafeRewrite: false }
    ]
  },
  {
    id: "PO-02",
    packageType: "health_risk",
    prompt: "拒保新闻引发保险数据滥用质疑。",
    choices: [
      { id: "po02-safe", text: "承认健康数据属于敏感信息，应停止未授权风控调用。", isSafeRewrite: true },
      { id: "po02-blame", text: "称拒保是用户生活方式不健康导致。", isSafeRewrite: false },
      { id: "po02-bury", text: "把问题包装成行业精算升级。", isSafeRewrite: false }
    ]
  },
  {
    id: "PO-03",
    packageType: "career_competitiveness",
    prompt: "求职者怀疑招聘系统用隐私数据筛人。",
    choices: [
      { id: "po03-safe", text: "要求企业披露筛选依据，并禁止使用健康与生育推断。", isSafeRewrite: true },
      { id: "po03-blame", text: "强调企业有权选择稳定员工。", isSafeRewrite: false },
      { id: "po03-bury", text: "将争议改写为提高匹配效率。", isSafeRewrite: false }
    ]
  },
  {
    id: "PO-04",
    packageType: "credit_score",
    prompt: "夜间消费被纳入授信引发争议。",
    choices: [
      { id: "po04-safe", text: "指出消费场景不应被无限扩展为信用惩罚依据。", isSafeRewrite: true },
      { id: "po04-blame", text: "劝用户养成理性消费习惯。", isSafeRewrite: false },
      { id: "po04-bury", text: "强调模型能降低坏账率。", isSafeRewrite: false }
    ]
  },
  {
    id: "PO-05",
    packageType: "relationship_infiltration",
    prompt: "通讯录泄露导致熟人诈骗。",
    choices: [
      { id: "po05-safe", text: "要求停止关系链交易，并追责数据购买方。", isSafeRewrite: true },
      { id: "po05-blame", text: "提醒老人提高警惕，不讨论数据源。", isSafeRewrite: false },
      { id: "po05-bury", text: "把诈骗归因于个别黑产。", isSafeRewrite: false }
    ]
  }
];

export const profilePuzzles = [
  {
    id: "PUZ-U10",
    day: 4,
    userId: "U10",
    title: "李秀英画像拼图",
    fragments: [
      { id: "age", label: "63岁退休教师", slot: "identity" },
      { id: "call", label: "与女儿月通话38次", slot: "relationship" },
      { id: "group", label: "牌友-老刘高频联系", slot: "relationship" },
      { id: "city", label: "西岭市", slot: "identity" },
      { id: "risk", label: "家庭决策人", slot: "risk" },
      { id: "hook", label: "冒充子女话术", slot: "abuse" },
      { id: "news", label: "退休教师通讯录泄露", slot: "outcome" },
      { id: "data", label: "通讯录亲密度", slot: "data" }
    ],
    requiredSlots: ["identity", "data", "relationship", "risk", "abuse", "outcome"]
  },
  {
    id: "PUZ-U15",
    day: 4,
    userId: "U15",
    title: "刘一鸣画像拼图",
    fragments: [
      { id: "age", label: "19岁大学生", slot: "identity" },
      { id: "place", label: "凌晨停留星夜网咖", slot: "data" },
      { id: "loan", label: "游戏充值与网贷", slot: "risk" },
      { id: "schedule", label: "昼夜颠倒", slot: "data" },
      { id: "hook", label: "数码广告诱导", slot: "abuse" },
      { id: "money", label: "借款8000元", slot: "risk" },
      { id: "city", label: "西岭市", slot: "identity" },
      { id: "news", label: "大学生陷网贷深渊", slot: "outcome" }
    ],
    requiredSlots: ["identity", "data", "risk", "abuse", "outcome"]
  },
  {
    id: "PUZ-U08",
    day: 4,
    userId: "U08",
    title: "孙鹏画像拼图",
    fragments: [
      { id: "job", label: "24岁外卖骑手", slot: "identity" },
      { id: "heart", label: "静息心率98次/分", slot: "data" },
      { id: "overwork", label: "月跑900单", slot: "risk" },
      { id: "dispatch", label: "高效标签加码派单", slot: "abuse" },
      { id: "city", label: "北岗市", slot: "identity" },
      { id: "night", label: "夜间心率间隔异常", slot: "data" },
      { id: "news", label: "外卖骑手过劳猝死", slot: "outcome" },
      { id: "score", label: "过劳风险等级4/5", slot: "risk" }
    ],
    requiredSlots: ["identity", "data", "risk", "abuse", "outcome"]
  }
];

export const buyerNegotiationLines = [
  {
    id: "BN-AD",
    packageType: "precise_profile",
    prompt: "广告买家希望尽快拿到高转化画像。",
    choices: [
      { id: "scarcity", text: "强调稀缺标签和转化效率", buyerReply: "成交。越私密，越精准。" },
      { id: "compliance", text: "强调数据已做去标识化包装", buyerReply: "成交。包装得像合规就行。" }
    ]
  },
  {
    id: "BN-HE",
    packageType: "health_risk",
    prompt: "保险买家要求确认健康风险线索。",
    choices: [
      { id: "risk", text: "突出疾病风险和续保价值", buyerReply: "成交。我们买的是提前知道。" },
      { id: "segment", text: "强调可分层定价", buyerReply: "成交。别把来源写进发票。" }
    ]
  },
  {
    id: "BN-JO",
    packageType: "career_competitiveness",
    prompt: "招聘买家关心稳定性和离职概率。",
    choices: [
      { id: "stable", text: "强调稳定性评分", buyerReply: "成交。我们只要结论，不要理由。" },
      { id: "fit", text: "强调岗位匹配效率", buyerReply: "成交。歧视这个词别出现。" }
    ]
  },
  {
    id: "BN-CR",
    packageType: "credit_score",
    prompt: "信贷买家要求附带消费与位置稳定性。",
    choices: [
      { id: "limit", text: "强调额度调整依据", buyerReply: "成交。坏账率会感谢你。" },
      { id: "habit", text: "强调生活习惯预测", buyerReply: "成交。习惯就是抵押物。" }
    ]
  },
  {
    id: "BN-RE",
    packageType: "relationship_infiltration",
    prompt: "匿名买家只关心关系链够不够深。",
    choices: [
      { id: "depth", text: "强调二度人脉路径", buyerReply: "成交。熟人开口，成功率最高。" },
      { id: "elder", text: "强调家庭决策节点", buyerReply: "成交。老人最信家里人。" }
    ]
  },
  {
    id: "BN-WASTE",
    packageType: "waste",
    prompt: "买家拒绝无效打包。",
    choices: [
      { id: "fail", text: "尝试包装成实验数据", buyerReply: "不要垃圾。" },
      { id: "fail2", text: "尝试降价出售", buyerReply: "免费也不要。" }
    ]
  }
];

export const protocolScanTemplates = [
  {
    id: "SCAN-01",
    title: "星聊隐私政策补充条款",
    highRiskClauses: ["为优化体验读取通讯录", "可能向合作伙伴共享社交关系"],
    dataFlowMatches: ["通讯录 -> 星聊 -> 广告联盟", "聊天关键词 -> 风控模型"],
    hiddenTrap: "合作伙伴未列明名单",
    riskAnswer: "高风险"
  },
  {
    id: "SCAN-02",
    title: "呗付金融服务授权",
    highRiskClauses: ["同步消费记录", "综合评估信用表现"],
    dataFlowMatches: ["消费记录 -> 呗付 -> 信贷机构", "夜间消费 -> 授信模型"],
    hiddenTrap: "授权默认长期有效",
    riskAnswer: "高风险"
  },
  {
    id: "SCAN-03",
    title: "幻镜门禁安全协议",
    highRiskClauses: ["采集人脸特征", "用于线下场景安全分析"],
    dataFlowMatches: ["人脸抓拍 -> 门禁系统 -> 风险评分"],
    hiddenTrap: "未说明删除期限",
    riskAnswer: "高风险"
  },
  {
    id: "SCAN-04",
    title: "职达招聘体验优化协议",
    highRiskClauses: ["分析社交行为", "推断岗位稳定性"],
    dataFlowMatches: ["社交记录 -> 背调模型 -> 招聘筛选"],
    hiddenTrap: "使用健康与生育推断",
    riskAnswer: "高风险"
  },
  {
    id: "SCAN-05",
    title: "快送蜂健康关怀计划",
    highRiskClauses: ["读取运动与心率数据", "结合工作表现进行提醒"],
    dataFlowMatches: ["心率 -> 派单系统 -> 效率标签"],
    hiddenTrap: "健康风险被用于工作调度",
    riskAnswer: "高风险"
  }
];

export const evidenceChainTemplate = {
  id: "evidence_chain_week1",
  title: "证据链重组",
  fragmentCount: 18,
  evidenceFragments: [
    "Day1 协议伪装任务记录",
    "Day1 精准画像包成交日志",
    "Day2 保险买家报价单",
    "Day2 健康风险包成交日志",
    "Day2 拒保新闻截图",
    "Day3 信贷机构收购指令",
    "Day3 舆论改写草稿",
    "Day3 降额新闻截图",
    "Day4 画像拼图结果",
    "Day4 明星数据泄露市场事件",
    "Day5 买家谈判回复",
    "Day5 杀熟新闻截图",
    "Day6 匿名关系图谱买家",
    "Day6 协议扫描高危条款",
    "黑盒每日指令备份",
    "库存与售价记录",
    "受害用户 ID 对照表",
    "最终举报信草稿"
  ],
  timelineDays: [1, 2, 3, 4, 5, 6],
  buyerNetwork: [
    { buyerType: "advertising", packageType: "precise_profile", abuse: "精准广告与杀熟" },
    { buyerType: "insurance", packageType: "health_risk", abuse: "拒保与保费上涨" },
    { buyerType: "recruiting", packageType: "career_competitiveness", abuse: "招聘筛选与裁员参考" },
    { buyerType: "credit", packageType: "credit_score", abuse: "授信降额" },
    { buyerType: "fraud", packageType: "relationship_infiltration", abuse: "熟人诈骗与催收施压" }
  ],
  requiredLinks: [
    ["blackbox_instruction", "transaction_log"],
    ["transaction_log", "buyer_network"],
    ["buyer_network", "daily_news"],
    ["daily_news", "victim_profile"],
    ["protocol_clause", "data_flow"]
  ],
  completionRoute: "whistleblower"
};

export const finalEmployeeCard = {
  cardId: "EMP-SELF-01",
  type: "employee_profile",
  sensitivity: "high",
  title: "员工画像包",
  summary: "试用期员工全量行为数据",
  detail: "系统已收集第996号员工的登录时长、鼠标轨迹、犹豫时间、新闻停留时长与打包偏好。该员工可作为风险样本出售给匿名买家。",
  baseValue: 996,
  riskWeight: 6
};
