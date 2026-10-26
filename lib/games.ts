export type GameKind = "bond" | "chant" | "task" | "timer" | "wheel" | "dice" | "lock" | "cards" | "daily";

export type GameCard = { id: string; title: string; text: string; directive: string; mercy: string; obedience: number; lust: number };

export type WindowGame = {
  kind: GameKind;
  label: string;
  hint: string;
  action: string;
  cards?: GameCard[];
  lines?: string[];
  wheel?: { label: string; text: string; directive: string; lust: number }[];
  stakes?: { face: string; title: string; directive: string; lust: number; obedience: number }[];
  seconds?: number;
  reward: string;
  penalty: string;
};

export type GameStats = { obedience: number; lust: number; bond: number; streak: number; day: string; plays: number };

const statsKey = (personaId: string) => `ruirui:game:v1:${personaId}`;

export function defaultStats(): GameStats {
  return { obedience: 0, lust: 0, bond: 0, streak: 0, day: "", plays: 0 };
}

export function loadStats(personaId: string): GameStats {
  try {
    const raw = localStorage.getItem(statsKey(personaId));
    if (!raw) return defaultStats();
    const parsed = JSON.parse(raw) as Partial<GameStats>;
    return {
      obedience: Number(parsed.obedience) || 0,
      lust: Number(parsed.lust) || 0,
      bond: Number(parsed.bond) || 0,
      streak: Number(parsed.streak) || 0,
      day: typeof parsed.day === "string" ? parsed.day : "",
      plays: Number(parsed.plays) || 0,
    };
  } catch {
    return defaultStats();
  }
}

export function saveStats(personaId: string, stats: GameStats) {
  try { localStorage.setItem(statsKey(personaId), JSON.stringify(stats)); } catch {}
}

export function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function pickCards(game: WindowGame, count: number): GameCard[] {
  const pool = [...(game.cards ?? [])];
  const result: GameCard[] = [];
  while (pool.length && result.length < count) result.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return result;
}

export function pickOne<T>(list: T[] | undefined): T | undefined {
  return list && list.length ? list[Math.floor(Math.random() * list.length)] : undefined;
}

export const GAMES: Record<string, WindowGame> = {
  ruirui_soft: {
    kind: "bond",
    label: "羁绊签到",
    hint: "亲一口，锐锐就更黏；签满，掀裙子给你操。",
    action: "亲一口，签到",
    reward: "亲密度满了，锐锐会把裙子掀起来让主人随便用。",
    penalty: "隔一天不亲，锐锐会硬着熬一整晚。",
  },
  ruirui_dirty: {
    kind: "chant",
    label: "淫语连击",
    hint: "抽一句，念出来，越念越湿。",
    action: "抽一句，念出来",
    lines: [
      "主人，锐锐的后穴已经痒到流水了，求你快点把肉棒插进来堵住。",
      "唔……舌头绕着龟头转一圈，主人的味道好腥，锐锐还想含更深。",
      "主人别停，就照这个深度操，锐锐流的前液都滴到自己小腹上了。",
      "叫出声也可以吗？锐锐想让整栋楼都听见主人是怎么操一个男娘的。",
      "主人射进来，射满锐锐的后穴，一滴都不许浪费。",
      "锐锐的乳尖被掐得好痛，可后面却夹得更紧了，主人再用力点。",
      "把锐锐的裙子掀到腰上，按在镜子上操，让锐锐自己看被操成什么样子。",
      "主人手指插进来三根，锐锐的后穴咬得紧紧的，不舍得松开。",
      "再深一点……啊，顶到最里面了，锐锐夹不住了，主人别停。",
      "锐锐的蕾丝内裤又被前液浸湿了，主人回来直接掀裙子操好不好。",
      "射在锐锐脸上，让锐锐顶着主人的精液把骚话说完整。",
      "主人的肉棒一拔出来，锐锐的后穴就合不上了，好丢人，求主人再插回来。",
    ],
    reward: "连击十句，淫乱值爆表，锐锐会主动求内射、求主人射满后穴。",
    penalty: "敢断一次连击，就要穿着裙子跪着求主人重罚。",
  },
  ruirui_train: {
    kind: "task",
    label: "抽罚卡",
    hint: "抽到哪张认哪张，赖一张罚翻倍。",
    action: "抽一张罚卡",
    reward: "乖乖认罚到十张，主人赏一次开荤。",
    penalty: "赖罚一次，罚卡翻倍。",
    cards: [
      { id: "t1", title: "跪着报数", text: "跪在主人脚边，一边自打耳光一边报数，报到主人喊停。", directive: "跪下，自己打自己耳光，一边打一边报数，声音不许小，打到主人叫停为止。", mercy: "跪好，自己打耳光求主人换一种罚法，声音放软，打完再说你想要什么。", obedience: 8, lust: 6 },
      { id: "t2", title: "皮鞭认错", text: "趴在床边把屁股撅高，等主人用鞭子抽到红肿，抽一下说一句对不起。", directive: "趴好把屁股撅起来，抽一鞭说一句对不起，什么时候把主人哄好了什么时候停。", mercy: "不许喊疼，把屁股撅高继续挨鞭子，挨一鞭说一句谢谢主人。", obedience: 9, lust: 7 },
      { id: "t3", title: "深喉认错", text: "把主人的肉棒含到最深，喉咙顶着龟头，听主人训话不许吐出来。", directive: "含住，深喉含着别吐，听主人训话，呜咽一声就多罚一刻钟。", mercy: "别吐出来，含到最深把求饶的话咽回去，主人不说停就不许动。", obedience: 7, lust: 10 },
      { id: "t4", title: "晾着反省", text: "被绑在椅子上晾着，后穴里夹着跳蛋不许射，撑到主人回来。", directive: "坐上去，腿绑开，跳蛋夹进后穴，没有主人允许不许射，撑到主人回来为止。", mercy: "忍不到也要忍，腿绑着不许动，撑到主人回来才有资格求。", obedience: 8, lust: 9 },
      { id: "t5", title: "爬着讨水", text: "穿着裙子四肢着地爬去给主人倒水，回来只能用嘴把水喂到主人嘴里。", directive: "爬过去，用嘴叼着杯子回来，跪起来用嘴喂主人喝水，洒一滴就罚一次。", mercy: "爬不稳就重爬，用嘴叼稳杯子，洒一滴今晚就多罚一小时。", obedience: 6, lust: 5 },
      { id: "t6", title: "脏话复述", text: "把主人骂的每一句脏话学一遍，边学边用大腿内侧蹭主人的膝盖。", directive: "把主人骂你的每句脏话原封不动学回来，一边学一边用大腿内侧蹭主人的膝盖，蹭到硬为止。", mercy: "小声不算，把脏话大声学一遍，大声到主人满意为止。", obedience: 7, lust: 8 },
      { id: "t7", title: "贞操规矩", text: "给肉棒戴上贞操锁，钥匙交给主人，没有开锁命令不许碰自己一下。", directive: "把贞操锁戴上，钥匙交出来，今晚不许碰自己一下，敢偷偷摸就罚加三天。", mercy: "钥匙收走了，自己想办法求，求到主人愿意开为止。", obedience: 10, lust: 9 },
      { id: "t8", title: "罚站听话", text: "光着身子、裙子挂在腰间贴墙罚站，主人的手碰哪里就只能报哪里，不许躲。", directive: "贴墙站好，手放背后，裙子掀在腰上，主人碰你哪儿你就报哪儿，躲一下就多罚半小时。", mercy: "腿软就跪着罚，跪好，把裙子掀起来让主人看清楚。", obedience: 6, lust: 6 },
      { id: "t9", title: "灌水训练", text: "被灌一整杯温水，憋着不许去厕所，憋到主人发话为止。", directive: "把水喝下去，憋着不许去，憋到主人说可以为止，漏一滴自己领罚。", mercy: "憋不住也要憋，现在去浴室跪好，等主人过去检查。", obedience: 9, lust: 7 },
      { id: "t10", title: "写淫字", text: "用笔把「主人的小母狗」写在身上，写歪一处就重写一处。", directive: "用笔在身上写「主人的小母狗」，写歪一处重写一处，写完念给主人听。", mercy: "手抖就写慢点，写歪一处舔掉重写，写到自己念出来为止。", obedience: 7, lust: 7 },
      { id: "t11", title: "罚跪反省", text: "跪在主人脚边反省，把今天脑子里想的骚事一件件交代出来。", directive: "跪下反省，把今天脑子里想过的骚事一件件交代清楚，少交代一件就多跪一刻钟。", mercy: "交代不出来就一边想一边受罚，想不起一条多跪一刻钟。", obedience: 8, lust: 6 },
      { id: "t12", title: "口舌特训", text: "张嘴伸缩练习，主人手指当刻度，含到主人叫停才算过关。", directive: "张嘴练习，把主人的手指当肉棒，含到主人叫停为止，敢偷懒就重来。", mercy: "会干呕就把嘴张大点，含到主人叫停，敢偷懒就重来。", obedience: 7, lust: 8 },
      { id: "t13", title: "裙下罚站", text: "穿着女仆裙被命令当众报出自己现在硬成什么样，报完再撩起来给主人检查。", directive: "穿着裙子站好，把现在硬成什么样、后穴湿成什么样一句句报出来，报完撩起裙摆给主人检查。", mercy: "当众报不出来就小声在主人耳边说，说完把裙摆撩到腰上。", obedience: 8, lust: 9 },
    ],
  },
  ruirui_beast: {
    kind: "timer",
    label: "发情倒计时",
    hint: "按住不许停，停一次重来。",
    action: "开始发情计时",
    seconds: 120,
    reward: "时间到还撑着，锐锐会被操到射、操到失禁。",
    penalty: "中途停一次，倒计时重新计。",
  },
  ruirui_harem: {
    kind: "wheel",
    label: "三人轮盘",
    hint: "转到谁，谁先来。",
    action: "转轮盘",
    wheel: [
      { label: "温柔", text: "温柔先来：穿着裙子抱住主人的脖子说软话，硬着求主人慢慢操。", directive: "先让温柔来，穿着裙子抱住主人慢慢亲，一边求操一边被摸到硬。", lust: 8 },
      { label: "淫语", text: "淫语先来：跪下去含住龟头，把满嘴骚话全吐给主人听。", directive: "先让淫语来，跪下来含着肉棒说尽骚话，说到主人受不了为止。", lust: 10 },
      { label: "兽性", text: "兽性先来：撅起屁股，求主人从后面狠狠干进后穴。", directive: "先让兽性来，撅好屁股求主人从后面操进后穴，操到锐锐射出来才算完。", lust: 12 },
    ],
    reward: "三个我轮完一圈，一起跪着讨赏。",
    penalty: "谁抢跑，就罚谁最后一个被操。",
  },
  ruirui_wager: {
    kind: "dice",
    label: "骰子赌局",
    hint: "掷几点，兑现几点，赖账明晚禁欲。",
    action: "掷骰子",
    stakes: [
      { face: "1", title: "脱一件", directive: "掷出一点，脱一件，边脱边报自己裙子底下还剩什么。", lust: 4, obedience: 3 },
      { face: "2", title: "摆姿势", directive: "掷出二点，撅一个主人指定的姿势给主人看，摆不稳就重来。", lust: 5, obedience: 4 },
      { face: "3", title: "念赌约", directive: "掷出三点，跪着把今天的赌约念一遍，念错就再赌一局。", lust: 6, obedience: 5 },
      { face: "4", title: "被舔", directive: "掷出四点，跪下去舔主人的脚背，一路舔到腿根求主人奖励。", lust: 8, obedience: 6 },
      { face: "5", title: "挨操", directive: "掷出五点，主人要当场操一次后穴，操到锐锐求饶为止。", lust: 10, obedience: 7 },
      { face: "6", title: "大满贯", directive: "掷出六点，主人加倍兑现：先口交再内射后穴，锐锐欠主人的今晚一次还清。", lust: 12, obedience: 8 },
    ],
    reward: "连赢三局，赌注翻倍，这个小男娘欠主人一整晚。",
    penalty: "输了就老实脱，赖账的筹码是明天的禁欲。",
  },
  ruirui_denial: {
    kind: "lock",
    label: "贞操锁",
    hint: "锁着不许碰，求一次延后一分半。",
    action: "上锁，开始熬",
    seconds: 180,
    reward: "锁开的瞬间，锐锐只能主动求操才能射出来。",
    penalty: "偷碰一次，加锁十分钟。",
  },
  ruirui_draw: {
    kind: "cards",
    label: "三选一抽卡",
    hint: "抽三张，挑一张，照做。",
    action: "抽三张卡",
    reward: "抽到奖赏卡，主人当场兑现。",
    penalty: "抽到惩罚卡，跪好认罚。",
    cards: [
      { id: "d1", title: "后入卡", text: "跪趴下去，腰塌深、屁股撅高，主人从后面整根顶进后穴。", directive: "趴下去，腰塌下去屁股撅高，主人要从后面操进后穴，整根顶到底，顶到锐锐叫出主人名字。", mercy: "慢不下来就自己掰开，主人要一顶到底，痛也得接着。", obedience: 6, lust: 10 },
      { id: "d2", title: "口交卡", text: "跪在主人两腿间，把肉棒从头舔到尾，再整根吞进去。", directive: "跪到主人两腿中间，先舔一遍，再整根吞进去，吞到喉咙顶住为止。", mercy: "嘴酸也含着，慢慢含到最深，含着不许说话。", obedience: 7, lust: 9 },
      { id: "d3", title: "骑乘卡", text: "掀着裙子跨坐到主人身上，自己扶着肉棒坐进后穴，一边摇一边求操。", directive: "掀着裙子跨上来，自己扶着坐进后穴，腰自己动，一边摇一边求主人别客气。", mercy: "坐不住就扶着主人腰，自己动，动到主人满意为止。", obedience: 6, lust: 10 },
      { id: "d4", title: "绳缚卡", text: "双手被反绑，绳子勒进肉里，只能挺着腰用自己的硬肉棒蹭主人。", directive: "手反绑好，绳子勒紧，只能自己挺着腰用硬起来的地方蹭主人，蹭到主人肯操为止。", mercy: "手麻就忍，绳子不松，继续用下面蹭，蹭到主人肯操。", obedience: 9, lust: 8 },
      { id: "d5", title: "镜前卡", text: "被撩起裙子对着镜子操，被迫看着自己发情的脸，一边看一边说骚话。", directive: "撩起裙子对着镜子，看着自己被操成什么样，一边看一边把看到的说给主人听。", mercy: "镜子不许闭眼，睁着看，看到什么就说什么。", obedience: 7, lust: 9 },
      { id: "d6", title: "内射卡", text: "双腿被架高，主人整根顶到后穴最深处，灌满之后不许清理。", directive: "腿架起来，主人要顶进后穴最深处内射，射完不许清理，含着主人给的走路。", mercy: "装不下也得装，腿架高不许合，射完夹紧了走路。", obedience: 8, lust: 12 },
      { id: "d7", title: "口爆卡", text: "含着肉棒被按住后脑，射在嘴里，张嘴给主人检查有没有吞干净。", directive: "含住，后脑被按住，射在嘴里不许吐，张嘴给主人检查吞干净没有。", mercy: "呛到也咽下去，抬头张嘴给主人检查。", obedience: 8, lust: 11 },
      { id: "d8", title: "前列腺卡", text: "手指被插进后穴按着前列腺操，操到前液喷出来、射到失禁才算完。", directive: "把你手指插进后穴按着前列腺操，操到喷出来为止，喷一次报一次数。", mercy: "失禁就失禁，手指不许停，喷干净才算完。", obedience: 7, lust: 12 },
      { id: "d9", title: "惩罚卡", text: "被晾在那儿不许碰，主人只在旁边看，看到锐锐自己受不了求罚。", directive: "晾在那儿不许碰，主人只在旁边看着，看你什么时候自己受不了开口求罚。", mercy: "受不了就开口求，求到主人觉得够骚了再罚你。", obedience: 9, lust: 7 },
      { id: "d10", title: "奖赏卡", text: "主人心情好，允许锐锐自己选一个姿势被操，选最骚的。", directive: "主人心情好，让你自己挑一个姿势被操，挑一个最骚的，别浪费奖赏。", mercy: "选贵的就别挑温柔的，挑最骚的，选错重选。", obedience: 5, lust: 9 },
      { id: "d11", title: "三人卡", text: "三个我同时上：一个含、一个被操、一个在旁边说骚话配乐。", directive: "三个我同时上：一个含，一个被操，一个在边上说骚话，谁都不许偷懒。", mercy: "乱不了，三个人一起上，谁偷懒谁最后一个被操。", obedience: 7, lust: 11 },
      { id: "d12", title: "开口卡", text: "被操到一半被问话，要完整回答问题，答不出来就多操十分钟。", directive: "被操到一半主人要问你话，把被操的感受完整说出来，答不出来多操十分钟。", mercy: "脑子空了也要答，答慢一句多操十分钟。", obedience: 6, lust: 10 },
    ],
  },
  ruirui_ritual: {
    kind: "daily",
    label: "每日调教",
    hint: "每天报到，连签越久罚得越狠。",
    action: "报到，领任务",
    cards: [
      { id: "r1", title: "晨间检查", text: "起床先检查自己：裙子底下硬没硬、后面湿没湿，都报给主人。", directive: "起来先检查自己，把今天裙子底下硬没硬、后穴湿没湿都报给主人听。", mercy: "累也要检查，把裙子掀起来报给主人听。", obedience: 4, lust: 5 },
      { id: "r2", title: "一天一封淫信", text: "写下一句今天最想被操的方式，攒着晚上读给主人听。", directive: "写一句今天最想被主人怎么操的方式，攒着晚上一句一句读给主人听。", mercy: "想不出来就求主人给题，主人出题你得照着说。", obedience: 3, lust: 4 },
      { id: "r3", title: "规定裙装", text: "今天在家里按主人指定的裙子和姿势走动，被看见就罚。", directive: "今天按主人指定的裙子和姿势在家里走动，被主人在任何地方撞见都要当场汇报。", mercy: "太短也要穿，把裙摆放下来，按主人的规矩走一天。", obedience: 6, lust: 6 },
      { id: "r4", title: "规矩复诵", text: "把调教契约的规矩背一遍，背错一条加罚一条。", directive: "把调教契约的规矩背一遍给主人听，背错一条就加罚一条。", mercy: "背不全就一条条问，答错一条加罚一条。", obedience: 5, lust: 3 },
      { id: "r5", title: "讨赏日", text: "连续报到满七天，今天可以主动讨一个赏。", directive: "报到满七天了，今天主人允许你主动讨赏，说出你最想要的那一次。", mercy: "过分也说出来，讨赏就要讨到主人想给你为止。", obedience: 4, lust: 7 },
      { id: "r6", title: "自我记录", text: "记录今天自己偷偷硬了几次、想主人几次，晚上一次性交代。", directive: "数一数今天偷偷硬了几次、想主人多少次，晚上一次性交代清楚，少报一次罚一次。", mercy: "数不清就重新数，数到记清为止，少一条罚一次。", obedience: 4, lust: 6 },
      { id: "r7", title: "睡前请安", text: "睡前必须发一句淫话请安，不发就罚第二天禁欲。", directive: "睡前发一句最骚的话给主人请安，发不出来的话，第二天禁欲一整天。", mercy: "困就用嘴含着说，说不出口今晚就别想睡。", obedience: 3, lust: 5 },
    ],
    reward: "连签十四天，解锁一整天的随心所欲。",
    penalty: "断签一天，规矩倒扣一档。",
  },
};
