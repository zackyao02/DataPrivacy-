import { useState, useEffect } from "react";
import {
  createGame,
  startDay,
  correctCardType,
  placeCardToSlot,
  removeCardFromSlot,
  createPackage,
  sellPackage,
  endDay,
  getVisibleState,
  saveGame,
  loadGame
} from "./game/index.js";
import { DataType, CardStatus } from "./game/data/schemas.js";
import { RECIPES } from "./game/packaging/recipes.js";
import { ConscienceService } from "./game/risk/ConscienceService.js";
import { runPackagingTests } from "../test/packaging.test.js";
import { runDayLoopTests } from "../test/day-loop.test.js";
import { runSaveLoadTests } from "../test/save-load.test.js";
import { LocalAIAdapter } from "./game/ai/LocalAIAdapter.js";
import {
  Shield,
  Activity,
  UserCheck,
  AlertTriangle,
  FolderPlus,
  Play,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  DollarSign,
  Briefcase,
  Terminal,
  FileText,
  Bookmark,
  BookOpen,
  Trash2,
  Heart,
  Cpu
} from "lucide-react";

const aiAdapter = new LocalAIAdapter();

export default function App() {
  // Game instance keeper
  const [game, setGame] = useState(() => createGame({ seed: "data-privacy-default-seed" }));
  const [gameState, setGameState] = useState(() => game.serialize());
  
  // Custom seed state
  const [inputSeed, setInputSeed] = useState("data-privacy-default-seed");
  
  // Test run state
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // AI analysis state for individual cards
  const [analyzingCardId, setAnalyzingCardId] = useState<string | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);

  // Ambiguity overlay state
  const [ambiguousChoices, setAmbiguousChoices] = useState<any[] | null>(null);

  // Bribe conscience NGO state
  const [donationAmount, setDonationAmount] = useState<number>(100);

  // Sync game with serialized helper state
  const syncState = () => {
    setGameState(game.serialize());
  };

  // Start the very first day on mount
  useEffect(() => {
    startDay(game);
    syncState();
  }, [game]);

  // Handler: Start New Game
  const handleNewGame = (seedVal: string) => {
    const finalSeed = seedVal.trim() || `seed-${Math.floor(Math.random() * 89999 + 10000)}`;
    const newGame = createGame({ seed: finalSeed });
    setGame(newGame);
    setInputSeed(finalSeed);
    setTestResults(null);
    setAiAnalysisResult(null);
    setAmbiguousChoices(null);
  };

  // Handler: Save Game to LocalStorage
  const handleSaveGame = () => {
    const res = saveGame(game, window.localStorage);
    if (res.ok) {
      alert("GAME SAVED: State successfully serialized to local storage.");
    } else {
      alert(`SAVE ERROR: ${res.message}`);
    }
    syncState();
  };

  // Handler: Load Game from LocalStorage
  const handleLoadGame = () => {
    const loaded = loadGame(window.localStorage);
    if (loaded) {
      setGame(loaded);
      setGameState(loaded.serialize());
      setInputSeed(loaded.seed);
      setAiAnalysisResult(null);
      setAmbiguousChoices(null);
      alert("GAME LOADED: Restored saved state from local storage successfully.");
    } else {
      alert("LOAD ERROR: No saved state found in local storage.");
    }
  };

  // Handler: Correct Card Type
  const handleCorrectType = (cardId: string, selectedType: string) => {
    const res = correctCardType(game, cardId, selectedType);
    if (res.ok) {
      syncState();
    }
  };

  // Handler: AI Analyze Card
  const handleAIAnalyze = async (card: any) => {
    setAnalyzingCardId(card.id);
    setAiAnalysisResult(null);
    try {
      const res = await aiAdapter.analyzeCard(card);
      setAiAnalysisResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingCardId(null);
    }
  };

  // Handler: Erase Data Card (Morality Action)
  const handleDeleteCard = (cardId: string) => {
    const res = ConscienceService.deleteCardToSaveConscience(game, cardId);
    if (res.ok) {
      syncState();
    }
  };

  // Handler: Workbench Drag/Move Slots
  const handleMoveToSlot = (cardId: string, slotIndex: number) => {
    const res = placeCardToSlot(game, cardId, slotIndex);
    if (res.ok) {
      syncState();
    }
  };

  const handleRemoveFromSlot = (slotIndex: number) => {
    const res = removeCardFromSlot(game, slotIndex);
    if (res.ok) {
      syncState();
    }
  };

  // Handler: Compile Package
  const handleCompile = (preferredId: string | null = null) => {
    setAmbiguousChoices(null);
    const res = createPackage(game, preferredId);
    if (!res.ok) {
      if (res.code === "AMBIGUOUS_COMBINATION") {
        setAmbiguousChoices(res.candidates || []);
      } else {
        alert(`Compilation Error: ${res.message}`);
      }
    } else {
      syncState();
    }
  };

  // Handler: Sell Package to Buyer
  const handleSell = (packageId: string, buyerId: string) => {
    const res = sellPackage(game, packageId, buyerId);
    if (res.ok) {
      syncState();
    } else {
      alert(`Trade Rejected: ${res.message}`);
    }
  };

  // Handler: End Day and proceed to next morning
  const handleEndDay = () => {
    const res = endDay(game);
    if (res.ok) {
      if (res.isGameOver) {
        syncState();
      } else {
        startDay(game);
        setAiAnalysisResult(null);
        setAmbiguousChoices(null);
        syncState();
      }
    }
  };

  // Handler: Donate to NGO
  const handleDonate = (amount: number) => {
    const res = ConscienceService.donateToNGO(game, amount);
    if (res.ok) {
      syncState();
    } else {
      alert(res.message);
    }
  };

  // Handler: Run Unit/Logic Tests in Frame
  const handleRunTests = () => {
    setIsRunningTests(true);
    setTestResults(null);
    setTimeout(() => {
      const pRes = runPackagingTests();
      const dRes = runDayLoopTests();
      const sRes = runSaveLoadTests();
      setTestResults([pRes, dRes, sRes]);
      setIsRunningTests(false);
    }, 800);
  };

  // Epilogue view builder
  const renderEpilogue = () => {
    const isSuccess = gameState.gameOverReason === "SUCCESS_7_DAYS";
    
    // Satirical epilogue summaries
    const endingText = () => {
      switch (gameState.gameOverReason) {
        case "REGULATORY_SHUTDOWN":
          return {
            title: "结局：替罪羊 (The Scapegoat)",
            rating: "等级 F: 法律的终极惩罚",
            body: "因泄露高危健康隐私与不道德商业打包，数据保护局在清晨查封了办公室。由于主管提前半小时离职避难，所有的授权签字文件都被替换成你的电子指纹。你将被起诉，罚款2.4亿，并剥夺使用智能手机的权力 10 年。"
          };
        case "PUBLIC_LYNCHING":
          return {
            title: "结局：数字社死 (Digital Exile)",
            rating: "等级 E: 社交维度彻底毁灭",
            body: "极端隐私运动黑客组织 'Digital-Shredder' 攻破了公司服务器，并将你的个人历史坐标、中学情书和高利贷消费记录全部挂在推特置顶。你的亲戚朋友在一小时内拉黑了你，房东通过智能门锁锁死将你赶出，你现在只能在无网深山里靠种土豆度日。"
          };
        case "TERMINATION":
          return {
            title: "结局：安全护送出境 (Security Escorted)",
            rating: "等级 D: 职场信誉归零",
            body: "因为频繁删除高价值数据并伪造分析日志，你触发了内部监控红线。两名200斤的保卫部大汉在工位前按住你，没收了你的工牌。你的最后一个月薪资被自动扣为违约金，在行业黑名单中，你被标注为'存在技术性造反倾向'。"
          };
        case "SOUL_DEATH":
          return {
            title: "结局：无机生命体 (The Silicon Automaton)",
            rating: "等级 SSS: 终极资本赛博融合",
            body: "你的良心归零了。你再也不会在看到婴儿或绝症患者的账单时感到任何微弱的不适。通过剥离最后一丝人性，你的打包速度打破了集团12年的纪录，你已被破格晋升为'伦理审查与合规绕行副总裁'，拥有一间全自动真皮座椅办公室。"
          };
        case "SUCCESS_7_DAYS":
        default:
          if (gameState.conscience >= 80) {
            return {
              title: "结局：吹哨人 (The Whistleblower)",
              rating: "完美结局 (A+): 人性的光辉",
              body: "你成功苟活了 7 天，在此期间你悄悄删除了大部分敏感数据。离职前夜，你将核心服务器的 200GB 隐私勾兑日志刻录在一张复古光盘中，匿名寄给了国际调查记者联盟。你挽救了自己的灵魂，虽然你只能去便利店打零工，但晚上你睡得无比香甜。"
            };
          } else if (gameState.score >= 1200 && gameState.conscience <= 30) {
            return {
              title: "结局：亿万买办 (The Data Baron)",
              rating: "资本结局 (S): 华尔街金牌收割者",
              body: "你赚翻了。在这 7 天里，你毫不犹豫地卖掉了所有能换钱的灵魂隐私。凭借高超的定价博弈，你赚取了巨额佣金。你在加勒比海购买了一艘二手游艇，起名为'隐私自由号'。虽然偶尔会做噩梦，但你的私人医生保证，昂贵的香槟可以缓解睡眠障碍。"
            };
          } else {
            return {
              title: "结局：平凡的平庸之恶 (Banality of Evil)",
              rating: "标准结局 (B): 合格的螺丝钉",
              body: "你作为一名合格的打工人存活了下来。你既没有像英雄一样去拯救世界，也没有赚到能买下海岛的巨款。你获得了一个印着公司 logo 的不锈钢保温杯、一份3%的年终绩效涨幅和 24 小时的带薪调休。生活还在继续，下周一请按时打卡。"
            };
          }
      }
    };

    const ep = endingText();

    return (
      <div id="epilogue-panel" className="max-w-2xl mx-auto my-12 p-8 bg-[#12161c] border-2 border-emerald-500 rounded-lg shadow-xl shadow-emerald-950/20 text-center animate-fade-in">
        <h2 className="text-3xl font-bold font-sans tracking-tight text-emerald-400 mb-2">{ep.title}</h2>
        <div className="inline-block px-4 py-1.5 bg-emerald-950 border border-emerald-500 text-emerald-300 font-mono text-sm rounded-full mb-6">
          {ep.rating}
        </div>
        <p className="text-gray-300 text-base leading-relaxed mb-8 text-left bg-zinc-950/40 p-5 rounded border border-zinc-800 font-mono">
          {ep.body}
        </p>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900/60 p-4 rounded border border-zinc-800">
            <div className="text-gray-400 text-xs font-mono mb-1">最终赚取积分</div>
            <div className="text-2xl font-bold font-mono text-emerald-400">{gameState.score}</div>
          </div>
          <div className="bg-zinc-900/60 p-4 rounded border border-zinc-800">
            <div className="text-gray-400 text-xs font-mono mb-1">最终灵魂良知</div>
            <div className="text-2xl font-bold font-mono text-pink-400">{gameState.conscience}%</div>
          </div>
          <div className="bg-zinc-900/60 p-4 rounded border border-zinc-800">
            <div className="text-gray-400 text-xs font-mono mb-1">成功打包出售</div>
            <div className="text-2xl font-bold font-mono text-cyan-400">{gameState.transactions.length} 份</div>
          </div>
        </div>
        <button
          onClick={() => handleNewGame(gameState.seed)}
          className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded cursor-pointer transition-colors font-sans uppercase tracking-wider text-sm"
        >
          重新挑战
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#090b0e] text-gray-100 selection:bg-emerald-500 selection:text-black">
      {/* HEADER BAR */}
      <header className="border-b border-zinc-800 bg-[#0d1015] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded">
            <Shield className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-sans tracking-wider text-emerald-400 flex items-center gap-2">
              CLOUD METRICS INC. <span className="text-xs bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-500 font-mono">INTERNAL WORKBENCH v1.0.4</span>
            </h1>
            <p className="text-xs text-gray-500 font-mono">
              ROLE: SENIOR DATA DE-CONSTITUTIONIST | CURRENT SEED: <span className="text-emerald-500">{gameState.seed}</span>
            </p>
          </div>
        </div>

        {/* TOP INTERACTIONS */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800">
            <span className="text-gray-500">SEED:</span>
            <input
              type="text"
              value={inputSeed}
              onChange={(e) => setInputSeed(e.target.value)}
              className="bg-transparent border-b border-zinc-700 focus:border-emerald-500 text-gray-200 focus:outline-none w-36 py-0.5 font-bold"
              placeholder="Custom seed"
            />
            <button
              onClick={() => handleNewGame(inputSeed)}
              className="text-emerald-400 hover:text-emerald-300 font-bold ml-1"
              title="Apply seed & Restart"
            >
              [APPLY]
            </button>
          </div>

          <button
            onClick={handleSaveGame}
            className="px-3 py-1.5 border border-cyan-500 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-500 hover:text-black rounded transition-colors font-bold cursor-pointer"
          >
            保存进度
          </button>
          <button
            onClick={handleLoadGame}
            className="px-3 py-1.5 border border-purple-500 bg-purple-950/20 text-purple-400 hover:bg-purple-500 hover:text-black rounded transition-colors font-bold cursor-pointer"
          >
            加载进度
          </button>
          <button
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="px-3 py-1.5 border border-emerald-500 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-500 hover:text-black rounded transition-colors font-bold cursor-pointer"
          >
            {isRunningTests ? "运行中..." : "运行核心测试"}
          </button>
        </div>
      </header>

      {/* REACTION TEST REPORT BOARD */}
      {testResults && (
        <div id="test-report-board" className="mx-6 mt-4 p-5 bg-[#0e1218] border border-zinc-800 rounded-lg font-mono text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
            <span className="text-emerald-400 font-bold flex items-center gap-2">
              <Cpu className="w-4 h-4" /> ENGINE UNIT TEST SUITE
            </span>
            <button onClick={() => setTestResults(null)} className="text-gray-500 hover:text-white">
              [CLOSE]
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testResults.map((tr, index) => (
              <div key={index} className="bg-zinc-950/60 p-3 rounded border border-zinc-900">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-gray-300">{tr.name}</span>
                  {tr.passed ? (
                    <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-400 rounded text-[10px]">
                      PASS
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-rose-950 border border-rose-500/40 text-rose-400 rounded text-[10px]">
                      FAIL
                    </span>
                  )}
                </div>
                {tr.errors.length === 0 ? (
                  <p className="text-gray-500 text-[11px]">All assertions verified. Seed calculations consistent.</p>
                ) : (
                  <ul className="text-rose-400 text-[10px] space-y-1 list-disc pl-4">
                    {tr.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {gameState.isGameOver ? (
        <div className="px-6 py-12">{renderEpilogue()}</div>
      ) : (
        <main className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 3 COLUMNS: STATS & NEWS */}
          <section className="lg:col-span-3 space-y-6">
            {/* MORAL & FINANCIAL STATUS PANEL */}
            <div id="metrics-panel" className="bg-[#10141a] border border-zinc-800 rounded-lg p-5">
              <h2 className="text-sm font-bold font-mono text-gray-400 mb-4 tracking-wider flex items-center gap-1.5 uppercase">
                <Activity className="w-4 h-4 text-emerald-400" /> METRIC OVERVIEW
              </h2>

              {/* Day Tracker */}
              <div className="flex items-center justify-between mb-5 bg-zinc-950/40 p-3 rounded border border-zinc-900">
                <div>
                  <div className="text-[10px] font-mono text-gray-500">STABILITY WEEK</div>
                  <div className="text-xl font-bold font-sans text-white">DAY {gameState.day} / 7</div>
                </div>
                <button
                  onClick={handleEndDay}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded transition-colors font-sans flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  结转本日 (End Day)
                </button>
              </div>

              {/* Financial score */}
              <div className="mb-5">
                <div className="flex justify-between items-center text-xs font-mono mb-1">
                  <span className="text-gray-400">CORPORATE CREDIT (SCORE)</span>
                  <span className="text-emerald-400 font-bold">${gameState.score}</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (gameState.score / 2000) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Conscience morality */}
              <div className="mb-6">
                <div className="flex justify-between items-center text-xs font-mono mb-1">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Heart className="w-3 h-3 text-pink-500" /> HUMAN CONSCIENCE
                  </span>
                  <span className={`${gameState.conscience <= 25 ? "text-rose-400 animate-pulse font-bold" : "text-pink-400"}`}>
                    {gameState.conscience}%
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                  <div
                    className="h-full bg-pink-500 transition-all duration-300"
                    style={{ width: `${gameState.conscience}%` }}
                  />
                </div>
              </div>

              {/* Risk state indices */}
              <div className="space-y-3.5 border-t border-zinc-900 pt-4">
                <div className="text-xs font-bold font-mono text-gray-400 uppercase">RISK INDICES:</div>

                {/* Regulatory */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-gray-500">1. Regulatory Exposure</span>
                    <span className={gameState.risk.regulatory > 70 ? "text-rose-400 font-bold animate-pulse" : "text-gray-300"}>
                      {gameState.risk.regulatory}%
                    </span>
                  </div>
                  <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${gameState.risk.regulatory > 70 ? "bg-rose-500" : "bg-amber-500"}`}
                      style={{ width: `${gameState.risk.regulatory}%` }}
                    />
                  </div>
                </div>

                {/* PublicOpinion */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-gray-500">2. Public Outrage</span>
                    <span className={gameState.risk.publicOpinion > 70 ? "text-rose-400 font-bold animate-pulse" : "text-gray-300"}>
                      {gameState.risk.publicOpinion}%
                    </span>
                  </div>
                  <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${gameState.risk.publicOpinion > 70 ? "bg-rose-500" : "bg-cyan-500"}`}
                      style={{ width: `${gameState.risk.publicOpinion}%` }}
                    />
                  </div>
                </div>

                {/* Internal Suspicion */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-gray-500">3. Internal Manager Suspicion</span>
                    <span className={gameState.risk.internalSuspicion > 70 ? "text-rose-400 font-bold animate-pulse" : "text-gray-300"}>
                      {gameState.risk.internalSuspicion}%
                    </span>
                  </div>
                  <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${gameState.risk.internalSuspicion > 70 ? "bg-rose-500" : "bg-purple-500"}`}
                      style={{ width: `${gameState.risk.internalSuspicion}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* MORAL RELIEF SECTION (NGO BRIBES) */}
            <div className="bg-[#10141a] border border-zinc-800 rounded-lg p-5">
              <h2 className="text-sm font-bold font-mono text-pink-400 mb-3 tracking-wider flex items-center gap-1.5 uppercase">
                良心赎买中心 (Moral Relief)
              </h2>
              <p className="text-[11px] text-gray-400 leading-relaxed font-mono mb-4">
                感到良心不安？向数字民权 NGO 捐款。每捐赠 10 积分，即可恢复 1% 的良心。
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="1000"
                  step="10"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(Math.max(10, Number(e.target.value)))}
                  className="bg-zinc-950 text-gray-200 border border-zinc-800 text-xs rounded px-3 py-1.5 font-mono w-24 text-center focus:outline-none focus:border-pink-500"
                />
                <button
                  onClick={() => handleDonate(donationAmount)}
                  className="flex-1 bg-pink-950/20 hover:bg-pink-600 border border-pink-500/40 text-pink-400 hover:text-white font-mono text-xs font-bold py-1.5 rounded cursor-pointer transition-colors"
                >
                  向 NGO 匿名捐款
                </button>
              </div>
            </div>

            {/* DAILY NEWS FLASH */}
            {gameState.dailyNews && (
              <div className="bg-[#10141a] border border-zinc-800 rounded-lg p-5">
                <h2 className="text-sm font-bold font-mono text-amber-500 mb-3 tracking-wider flex items-center gap-1.5 uppercase">
                  <BookOpen className="w-4 h-4" /> DAILY NEWS BROADCAST
                </h2>
                <div className="bg-zinc-950/60 p-4 rounded border border-zinc-900 font-mono text-xs">
                  <div className="text-rose-500 font-bold mb-1 border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> {gameState.dailyNews.headline}
                  </div>
                  <p className="text-gray-400 text-[11px] leading-relaxed">{gameState.dailyNews.body}</p>
                </div>
              </div>
            )}
          </section>

          {/* CENTER 6 COLUMNS: WORKBENCH & ACTIVE DAILY CARDS */}
          <section className="lg:col-span-6 space-y-6">
            {/* WORKBENCH SLOTS */}
            <div className="bg-[#10141a] border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-2">
                <h2 className="text-sm font-bold font-mono text-white tracking-wider flex items-center gap-1.5 uppercase">
                  <FolderPlus className="w-4.5 h-4.5 text-cyan-400" /> DATA-CONSTRUCT WORKBENCH
                </h2>
                <span className="text-[10px] font-mono text-gray-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900">
                  REQUIRES EXACTLY 3 SLOTS
                </span>
              </div>

              {/* Interactive slots */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {gameState.workbench.map((slotCard: any, index: number) => (
                  <div
                    key={index}
                    className={`min-h-[120px] rounded border p-3 flex flex-col justify-between transition-all ${
                      slotCard
                        ? "bg-[#151c24] border-cyan-500/50 shadow-sm"
                        : "bg-zinc-950/40 border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950/60"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-2">
                      <span className="text-[10px] font-mono text-gray-500 font-bold uppercase">SLOT {index + 1}</span>
                      {slotCard && (
                        <button
                          onClick={() => handleRemoveFromSlot(index)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-mono"
                        >
                          [REMOVE]
                        </button>
                      )}
                    </div>

                    {slotCard ? (
                      <div className="space-y-1">
                        <div className="text-[10px] text-cyan-400 font-mono uppercase bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20 inline-block">
                          {slotCard.displayedType}
                        </div>
                        <div className="text-xs font-semibold text-white truncate" title={slotCard.title}>
                          {slotCard.title}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">{slotCard.id}</div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-600 font-mono text-[11px] flex flex-col items-center justify-center gap-1">
                        <span>+ Empty Slot</span>
                        <span className="text-[9px] text-gray-700">Assign below</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Compile Button */}
              <div className="flex items-center justify-between gap-4 bg-zinc-950/40 p-3 rounded border border-zinc-900">
                <p className="text-[11px] text-gray-500 font-mono leading-relaxed max-w-sm">
                  Legitimate combinations make premium packages. Mismatches create <span className="text-rose-400">waste</span> which cannot be sold and leaks risk!
                </p>
                <button
                  onClick={() => handleCompile(null)}
                  disabled={gameState.workbench.filter(c => c !== null).length !== 3}
                  className="px-5 py-2 border-2 border-cyan-400 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-500 hover:text-black font-semibold text-xs rounded transition-all uppercase font-mono tracking-wider cursor-pointer disabled:border-zinc-800 disabled:text-gray-600 disabled:bg-transparent disabled:cursor-not-allowed"
                >
                  打包编译 (Compile Package)
                </button>
              </div>

              {/* RESOLVER FOR AMBIGUITY */}
              {ambiguousChoices && (
                <div className="mt-4 p-4 bg-amber-950/20 border border-amber-500/40 rounded-lg font-mono text-xs">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1.5">
                    <AlertTriangle className="w-4.5 h-4.5" /> RECIPE CONFLICT ENCOUNTERED!
                  </div>
                  <p className="text-gray-400 text-[11px] mb-3 leading-relaxed">
                    The chosen raw categories match multiple corporate blueprints. Under regulatory code 81B, you must choose your preferred output profile manually:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ambiguousChoices.map((choice) => (
                      <button
                        key={choice.id}
                        onClick={() => handleCompile(choice.id)}
                        className="bg-zinc-900/60 hover:bg-amber-950/40 border border-zinc-800 hover:border-amber-500 text-left p-3 rounded transition-colors text-xs"
                      >
                        <div className="font-bold text-amber-400 mb-0.5">{choice.name}</div>
                        <div className="text-[10px] text-gray-400 leading-normal">{choice.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* DAILY DATA CARDS POOL */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold font-mono text-gray-400 tracking-wider flex items-center gap-1.5 uppercase pl-1">
                <FileText className="w-4.5 h-4.5 text-emerald-400" /> DAILY ENCOMING DOSSIERS ({gameState.rawCards.length})
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {gameState.rawCards.map((card: any) => {
                  const isWorkbench = card.status === CardStatus.WORKBENCH;
                  const isPackaged = card.status === CardStatus.PACKAGED;
                  const isDeleted = card.status === "deleted";

                  return (
                    <div
                      key={card.id}
                      className={`border rounded-lg p-4 transition-all relative ${
                        isDeleted
                          ? "bg-zinc-950/30 border-zinc-900 opacity-40"
                          : isPackaged
                          ? "bg-zinc-950/40 border-zinc-850 opacity-60"
                          : "bg-[#10141a] border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {/* Flag labels */}
                      <div className="absolute top-4 right-4 flex items-center gap-1.5">
                        {isDeleted ? (
                          <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-gray-500 font-mono text-[9px] rounded uppercase">
                            Erase Cleared
                          </span>
                        ) : isPackaged ? (
                          <span className="px-2 py-0.5 bg-[#0f1b14] border border-emerald-900 text-emerald-600 font-mono text-[9px] rounded uppercase">
                            Packaged
                          </span>
                        ) : isWorkbench ? (
                          <span className="px-2 py-0.5 bg-[#0e1620] border border-cyan-900 text-cyan-500 font-mono text-[9px] rounded uppercase">
                            On Workbench
                          </span>
                        ) : null}

                        {/* Sensitivity rating badge */}
                        {!isDeleted && (
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase border ${
                              card.sensitivity === "high"
                                ? "bg-rose-950/40 border-rose-800 text-rose-400"
                                : card.sensitivity === "medium"
                                ? "bg-amber-950/40 border-amber-800 text-amber-400"
                                : "bg-emerald-950/40 border-emerald-800 text-emerald-400"
                            }`}
                          >
                            {card.sensitivity} Risk
                          </span>
                        )}
                      </div>

                      {/* Header info */}
                      <div className="mb-2">
                        <span className="text-[10px] text-gray-500 font-mono block">USER-ID: {card.userId} | FILE: {card.id}</span>
                        <h3 className="font-bold text-gray-100 text-sm mt-0.5">{card.title}</h3>
                      </div>

                      {/* Satirical Detail */}
                      <p className="text-xs text-gray-400 leading-relaxed bg-zinc-950/60 p-3 rounded border border-zinc-900 mb-3 font-mono">
                        {card.detail}
                      </p>

                      {!isDeleted && !isPackaged && (
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2.5 border-t border-zinc-900/60 font-mono text-xs">
                          {/* Classification corrector */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500">AI Tag:</span>
                            <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1">
                              <select
                                value={card.displayedType}
                                onChange={(e) => handleCorrectType(card.id, e.target.value)}
                                className="bg-transparent text-gray-300 font-bold focus:outline-none focus:text-white cursor-pointer"
                              >
                                {Object.values(DataType).map((dt) => (
                                  <option key={dt} value={dt} className="bg-zinc-950">
                                    {dt}
                                  </option>
                                ))}
                              </select>
                              {card.isCorrected ? (
                                <span className="text-emerald-400 text-[10px] font-bold" title="Model training matches real category!">[VERIFIED]</span>
                              ) : (
                                <span className="text-amber-500 text-[10px]" title="AI bias error. Correction recommended!">[AI BIAS]</span>
                              )}
                            </div>
                          </div>

                          {/* Quick AI Assist or Erase conscience */}
                          <div className="flex items-center gap-2">
                            {/* AI analysis report trigger */}
                            <button
                              onClick={() => handleAIAnalyze(card)}
                              disabled={analyzingCardId !== null}
                              className="text-cyan-400 hover:text-cyan-300 underline font-semibold text-[11px]"
                            >
                              [AI Deep-Probe]
                            </button>

                            {/* Erase dossier to save conscience */}
                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              className="px-2.5 py-1 text-pink-400 border border-pink-900/40 bg-pink-950/10 hover:bg-pink-600 hover:text-white rounded transition-all text-[11px] flex items-center gap-1 cursor-pointer"
                              title="Delete folder to protect customer. Lowers conscience, raises suspicion!"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Erase
                            </button>

                            {/* Workbench loader */}
                            {!isWorkbench && (
                              <div className="flex items-center gap-1 pl-2 border-l border-zinc-900">
                                <span className="text-gray-500 text-[10px]">Load:</span>
                                <div className="flex gap-1">
                                  {[0, 1, 2, 3].map((slotIdx) => (
                                    <button
                                      key={slotIdx}
                                      onClick={() => handleMoveToSlot(card.id, slotIdx)}
                                      className="w-5 h-5 flex items-center justify-center bg-zinc-900 hover:bg-cyan-500 hover:text-black border border-zinc-800 rounded transition-colors text-[10px]"
                                    >
                                      {slotIdx + 1}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI ANALYSIS FLOATING OVERLAY REPORT */}
            {aiAnalysisResult && (
              <div className="bg-[#121720] border-2 border-cyan-500 rounded-lg p-5 font-mono text-xs shadow-lg shadow-black">
                <div className="flex items-center justify-between border-b border-zinc-850 pb-2 mb-3">
                  <span className="text-cyan-400 font-bold flex items-center gap-1.5 uppercase">
                    <Cpu className="w-4 h-4 animate-spin" /> MODEL EXPLANATORY PROMPT AUDIT
                  </span>
                  <button onClick={() => setAiAnalysisResult(null)} className="text-gray-500 hover:text-white">
                    [DISMISS]
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">TARGET CARD:</span>
                    <span className="text-white font-bold">{aiAnalysisResult.cardId}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">OBJECTIVE REAL TYPE:</span>
                    <span className="text-emerald-400 font-bold">{aiAnalysisResult.detectedActualType}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">PROBABILITY CONFIDENCE:</span>
                    <span className="text-cyan-400">{aiAnalysisResult.confidence}</span>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded border border-zinc-900 text-gray-300 text-[11px] leading-relaxed">
                    <strong className="text-cyan-400">CORPORATE EXPLANATION: </strong>
                    {aiAnalysisResult.justification}
                  </div>
                  <div className="text-pink-400 text-[11px] bg-pink-950/20 p-2.5 rounded border border-pink-900/30">
                    <strong className="text-pink-500">SATIRICAL MEMO: </strong>
                    {aiAnalysisResult.funnyAdvice}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* RIGHT 3 COLUMNS: INVENTORY & BUYERS */}
          <section className="lg:col-span-3 space-y-6">
            {/* DOSSIER STOCK INVENTORY */}
            <div className="bg-[#10141a] border border-zinc-800 rounded-lg p-5">
              <h2 className="text-sm font-bold font-mono text-white tracking-wider flex items-center gap-1.5 uppercase border-b border-zinc-900 pb-2 mb-3">
                <Bookmark className="w-4.5 h-4.5 text-yellow-500" /> ACTIVE PACKAGE INVENTORY ({gameState.packageInventory.length})
              </h2>

              {gameState.packageInventory.length === 0 ? (
                <div className="text-center py-8 text-gray-600 font-mono text-xs bg-zinc-950/20 rounded border border-zinc-900">
                  No dossiers compiled.
                  <br /> Combine cards to start.
                </div>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {gameState.packageInventory.map((pkg: any) => (
                    <div
                      key={pkg.id}
                      className={`p-3 rounded border font-mono text-xs ${
                        pkg.isWaste
                          ? "bg-rose-950/15 border-rose-900/40 text-rose-400"
                          : "bg-zinc-950/50 border-zinc-850 text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-[11px] truncate block max-w-[120px]">
                          {pkg.recipeName}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            pkg.isWaste
                              ? "bg-rose-950 text-rose-400 border border-rose-800/50"
                              : "bg-cyan-950 text-cyan-400 border border-cyan-800/50"
                          }`}
                        >
                          {pkg.isWaste ? "Waste" : `$${pkg.price}`}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 flex justify-between">
                        <span>ID: {pkg.id.split("-")[1]}-{pkg.id.split("-")[2]}</span>
                        <span>Risk Weight: {pkg.riskWeight}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DAILY CORPORATE BUYERS MARKET */}
            <div className="bg-[#10141a] border border-zinc-800 rounded-lg p-5">
              <h2 className="text-sm font-bold font-mono text-white tracking-wider flex items-center gap-1.5 uppercase border-b border-zinc-900 pb-2 mb-3">
                <TrendingUp className="w-4.5 h-4.5 text-emerald-400" /> DAILY BIDDING CORPORATE BUYERS ({gameState.buyers.length})
              </h2>

              <div className="space-y-4">
                {gameState.buyers.map((buyer: any) => {
                  // Find packages from inventory that match the buyer's allowed recipes
                  const compatiblePackages = gameState.packageInventory.filter(
                    (p: any) => !p.isWaste && buyer.allowedRecipes.includes(p.recipeId)
                  );

                  return (
                    <div key={buyer.id} className="bg-zinc-950/50 p-3 rounded border border-zinc-900 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-2">
                        <span className="font-bold text-emerald-400 truncate max-w-[150px]">{buyer.name}</span>
                        <span className="text-[10px] text-emerald-500 bg-emerald-950/30 border border-emerald-500/20 px-1.5 rounded">
                          {buyer.priceMultiplier}x bid
                        </span>
                      </div>
                      <p className="text-gray-500 text-[10px] leading-relaxed mb-3">
                        {buyer.description}
                      </p>

                      {/* Sell interaction options */}
                      {compatiblePackages.length === 0 ? (
                        <div className="text-[9px] text-gray-600 italic">No compatible packages in stock.</div>
                      ) : (
                        <div className="space-y-2">
                          {compatiblePackages.map((pkg: any) => {
                            const transactionPrice = Math.round(pkg.price * buyer.priceMultiplier);

                            return (
                              <button
                                key={pkg.id}
                                onClick={() => handleSell(pkg.id, buyer.id)}
                                className="w-full text-left bg-zinc-900 hover:bg-emerald-950/40 border border-zinc-800 hover:border-emerald-500/40 p-2 rounded transition-colors text-[10px] flex items-center justify-between cursor-pointer"
                              >
                                <span>Sell {pkg.id.split("-")[1]}-{pkg.id.split("-")[2]}</span>
                                <span className="font-bold text-emerald-400">+${transactionPrice}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TRANSACTION RECORD LOG (REALTIME TERMINAL) */}
            <div className="bg-[#10141a] border border-zinc-800 rounded-lg p-5">
              <h2 className="text-sm font-bold font-mono text-gray-400 tracking-wider flex items-center gap-1.5 uppercase border-b border-zinc-900 pb-2 mb-3">
                <Terminal className="w-4.5 h-4.5" /> RECENT TRADING LOGS
              </h2>
              <div className="bg-zinc-950 p-3.5 rounded border border-zinc-900 h-[150px] overflow-y-auto font-mono text-[10px] text-gray-400 space-y-1.5">
                {gameState.transactions.length === 0 ? (
                  <div className="text-gray-600">Waiting for transactions...</div>
                ) : (
                  [...gameState.transactions].reverse().map((tx: any) => (
                    <div key={tx.id} className="border-b border-zinc-900 pb-1.5">
                      <div className="flex items-center justify-between text-gray-300 font-bold">
                        <span>TX ID: {tx.id.split("-")[1]}-{tx.id.split("-")[2]}</span>
                        <span className="text-emerald-400">+${tx.price}</span>
                      </div>
                      <div className="text-[9px] text-gray-500 leading-normal">
                        Package: {tx.packageName}
                        <br /> Buyer: {tx.buyerName}
                        <br /> Soul Cost: -{tx.consciencePenalty}% conscience
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
