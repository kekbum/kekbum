const VERSION = 30;
    const SAVE_KEY = "ash_hunter_demo_v1";
    const SAVE_SLOT_PREFIX = "ash_loot_manual_slot_";
    const SAVE_EXPORT_FORMAT = "ash-loot-save";

    const attributeInfo = {
      str: { name:"힘", short:"힘", desc:"공격력" },
      vit: { name:"생명", short:"생명", desc:"체력·방어" },
      int: { name:"지능", short:"지능", desc:"공격 안정성" },
      spi: { name:"정신", short:"정신", desc:"방어·회복" },
      luck:{ name:"행운", short:"행운", desc:"치명타·골드·장비 발견" },
      spd: { name:"속도", short:"속도", desc:"연속공격·회피" }
    };

    const classes = {
      vanguard: {
        name:"검투사", line:"검술 계열", main:"str", secondary:"vit",
        desc:"묵직한 한 방과 높은 치명타 피해를 노리는 직업입니다.",
        passive:"치명타 피해 +35% · 첫 공격 피해 +25%",
        start:{str:6,vit:3}, critDamage:.35, firstStrike:.25
      },
      arcanist: {
        name:"원소술사", line:"마술 계열", main:"int", secondary:"spi",
        desc:"피해 편차가 작고 3턴마다 강한 주문 폭발을 일으킵니다.",
        passive:"최소 피해 상승 · 매 3턴 주문 폭발 70% 추가 피해",
        start:{int:6,spi:3}, stableDamage:true, spellBurst:.70
      },
      oracle: {
        name:"성직자", line:"신술 계열", main:"spi", secondary:"int",
        desc:"위기에서 스스로 회복하며 긴 사냥을 안정적으로 이어갑니다.",
        passive:"전투 중 1회 긴급 회복 · 승리 후 체력 추가 회복",
        start:{spi:6,int:3}, emergencyHeal:.25, postHeal:.15
      },
      ironfist: {
        name:"권사", line:"체술 계열", main:"vit", secondary:"str",
        desc:"높은 체력과 방어력으로 버티며 일정 확률로 반격합니다.",
        passive:"최대 체력 +18% · 방어력 +12% · 피격 시 반격",
        start:{vit:6,str:3}, hpMult:.18, defenseMult:.12, counter:.24
      },
      marksman: {
        name:"사냥꾼", line:"궁술 계열", main:"luck", secondary:"spd",
        desc:"치명타와 고급 장비 획득에 특화된 파밍형 직업입니다.",
        passive:"치명타 +7% · 고급 장비 발견 +8% · 정예 피해 +15%",
        start:{luck:6,spd:3}, crit:7, itemFind:8, eliteDamage:.15
      },
      shadow: {
        name:"그림자", line:"인술 계열", main:"spd", secondary:"luck",
        desc:"연속 공격과 회피, 희귀 지도 탐색에 강합니다.",
        passive:"연속 공격 확률 30% · 회피 +12% · 지도 발견 +0.6%",
        start:{spd:6,luck:3}, doubleHit:.30, dodge:.12, mapFind:.6
      }
    };


    const STAMINA_MAX = 60;
    const STAMINA_RECOVERY_MS = 10 * 60 * 1000;
    const AUTO_HUNT_INTERVAL_MS = 5000;
    const BASEBALL_DAILY_REWARD_GAMES = 5;
    const BASEBALL_PRACTICE_REWARD_RATE = .10;

    const classCombatText = {
      vanguard: { action:"검격", damageType:"physical" },
      arcanist: { action:"마력탄", damageType:"magic" },
      oracle: { action:"성광탄", damageType:"magic" },
      ironfist: { action:"정권지르기", damageType:"physical" },
      marksman: { action:"속사", damageType:"physical" },
      shadow: { action:"단검 베기", damageType:"physical" }
    };

    const recoveryItems = {
      health: { id:"health", name:"붉은 치유약", desc:"최대 체력의 42%를 회복합니다.", hpRate:.42, sell:24, color:"positive" },
      mana: { id:"mana", name:"푸른 마나약", desc:"최대 마나의 48%를 회복합니다.", mpRate:.48, sell:26, color:"rarity-rare" },
      stamina: { id:"stamina", name:"녹빛 활력 물약", desc:"활력을 12 회복합니다.", staminaFlat:12, sell:38, color:"rarity-set" },
      elixir: { id:"elixir", name:"보랏빛 혼합 영약", desc:"체력과 마나를 각각 34% 회복합니다.", hpRate:.34, mpRate:.34, sell:48, color:"rarity-epic" }
    };


    const enemyMutations = [
      { id:"golden", name:"황금빛", desc:"골드 보상 증가", hp:1.12, attack:1.04, xp:1.05, gold:3.0, item:1.08, map:1.0 },
      { id:"giant", name:"거대한", desc:"높은 체력과 경험치", hp:1.85, attack:1.18, xp:1.85, gold:1.35, item:1.25, map:1.0 },
      { id:"frenzied", name:"광폭한", desc:"높은 공격력과 빠른 보상", hp:.92, attack:1.58, xp:1.45, gold:1.45, item:1.25, map:1.0 },
      { id:"treasure", name:"보물에 홀린", desc:"장비·지도 확률 증가", hp:1.30, attack:1.12, xp:1.20, gold:1.25, item:2.15, map:1.75 }
    ];

    const bountyTemplates = [
      { type:"kills", name:"사냥터 청소", desc:"몬스터를 처치하세요.", min:8, max:15, gold:170, dust:3 },
      { type:"eliteKills", name:"정예 토벌", desc:"정예 이상의 몬스터를 처치하세요.", min:2, max:5, gold:240, dust:5 },
      { type:"items", name:"전리품 수집", desc:"장비를 획득하세요.", min:3, max:7, gold:190, dust:4 },
      { type:"recoveryDrops", name:"보급품 확보", desc:"회복품을 발견하세요.", min:2, max:5, gold:160, dust:3 },
      { type:"mutatedKills", name:"변이 개체 연구", desc:"변이 몬스터를 처치하세요.", min:1, max:3, gold:300, dust:7 },
      { type:"itemsSalvaged", name:"대장간 재료", desc:"장비를 분해하세요.", min:2, max:5, gold:150, dust:5 },
      { type:"marketTrades", name:"주화상과 거래", desc:"검은 주화를 거래하세요.", min:1, max:3, gold:140, dust:2 }
    ];


    const skillCatalog = {
      vanguard: [
        { id:"whirlwind", name:"회전 베기", cost:8, every:3, mult:1.42, growth:.09, desc:"주변을 크게 베는 안정적인 주력기입니다." },
        { id:"execute", name:"처형", cost:14, every:5, mult:2.00, growth:.13, critBonus:15, desc:"강한 일격과 추가 치명타 확률을 얻습니다." },
        { id:"bloodthirst", name:"피의 갈증", cost:11, every:4, mult:1.28, growth:.07, healRate:.07, desc:"피해를 주고 최대 체력 일부를 회복합니다." }
      ],
      arcanist: [
        { id:"fireburst", name:"화염 폭발", cost:14, every:2, mult:1.62, growth:.10, desc:"자주 사용하는 고화력 마법입니다." },
        { id:"chainlightning", name:"연쇄 번개", cost:18, every:4, mult:1.38, growth:.08, extraHit:.52, desc:"본 피해 뒤에 추가 번개 피해가 발생합니다." },
        { id:"manasurge", name:"마나 분출", cost:12, every:5, mult:1.46, growth:.08, manaRestore:7, desc:"공격 후 마나를 일부 되찾습니다." }
      ],
      oracle: [
        { id:"judgment", name:"심판의 빛", cost:12, every:2, mult:1.48, growth:.09, desc:"신성력을 응축해 적을 공격합니다." },
        { id:"lifewave", name:"생명의 파동", cost:15, every:4, mult:1.12, growth:.06, healRate:.13, desc:"공격과 동시에 체력을 크게 회복합니다." },
        { id:"purge", name:"정화의 불꽃", cost:17, every:5, mult:1.82, growth:.11, defensePierce:.25, desc:"적 방어력 일부를 무시하는 신성 공격입니다." }
      ],
      ironfist: [
        { id:"qiblast", name:"기공파", cost:9, every:3, mult:1.39, growth:.08, desc:"기운을 뿜어내는 안정적인 기술입니다." },
        { id:"crushingfist", name:"붕권", cost:13, every:5, mult:1.88, growth:.12, critBonus:12, desc:"치명타 가능성이 높은 일격입니다." },
        { id:"ironbreath", name:"철산고", cost:10, every:4, mult:1.31, growth:.07, healRate:.05, defensePierce:.15, desc:"방어를 뚫고 자신의 호흡을 회복합니다." }
      ],
      marksman: [
        { id:"piercingshot", name:"관통 사격", cost:10, every:3, mult:1.48, growth:.09, defensePierce:.30, desc:"방어력을 크게 무시하는 화살입니다." },
        { id:"multishot", name:"연발 사격", cost:15, every:4, mult:1.22, growth:.07, extraHit:.68, desc:"추가 화살이 한 번 더 적중합니다." },
        { id:"weakpoint", name:"약점 저격", cost:17, every:5, mult:1.76, growth:.11, critBonus:22, desc:"높은 치명타 확률로 약점을 노립니다." }
      ],
      shadow: [
        { id:"shadowstrike", name:"그림자 습격", cost:11, every:3, mult:1.55, growth:.09, desc:"그림자 속에서 빠르게 파고듭니다." },
        { id:"twinblade", name:"쌍날 난무", cost:16, every:4, mult:1.18, growth:.07, extraHit:.82, desc:"추가 공격 비율이 매우 높은 기술입니다." },
        { id:"lifesteal", name:"흡혈 칼날", cost:14, every:5, mult:1.52, growth:.09, healRate:.10, desc:"적의 생명력을 빼앗아 체력을 회복합니다." }
      ]
    };

    function defaultSkillState() {
      return Object.fromEntries(
        Object.entries(skillCatalog).map(([classId, skills]) => [
          classId,
          Object.fromEntries(skills.map(skill => [skill.id, 1]))
        ])
      );
    }

    const questDefinitions = [
      { id:"first_hunt", name:"사냥꾼의 첫걸음", type:"kills", target:20, reward:{gold:180,dust:3}, desc:"몬스터 20마리 처치" },
      { id:"road_trip", name:"잿빛 순례", type:"zones", target:5, reward:{gold:260,dust:5}, desc:"서로 다른 사냥터 5곳 방문" },
      { id:"collector", name:"전리품 수집가", type:"items", target:20, reward:{gold:300,dust:6}, desc:"장비 20개 획득" },
      { id:"scholar", name:"괴물 연구가", type:"codex", target:10, reward:{gold:320,skill:1}, desc:"몬스터 도감 10종 발견" },
      { id:"riftwalker", name:"균열을 걷는 자", type:"rareMaps", target:3, reward:{gold:420,dust:10}, desc:"희귀 지도 3회 발견" },
      { id:"daily_guard", name:"매일의 시험", type:"dailyClears", target:3, reward:{gold:500,skill:1}, desc:"일일 던전 3회 클리어" },
      { id:"arena_rookie", name:"투기장의 신인", type:"arenaWins", target:5, reward:{gold:450,dust:12}, desc:"아레나 5승" },
      { id:"legend", name:"주황빛 전리품", type:"legendary", target:1, reward:{gold:700,skill:2}, desc:"전설 장비 1개 획득" },
      { id:"mastery", name:"기술 연마", type:"skillUpgrades", target:8, reward:{gold:520,dust:15}, desc:"스킬 강화 8회" },
      { id:"long_hunt", name:"백전의 사냥꾼", type:"kills", target:200, reward:{gold:1000,skill:2}, desc:"몬스터 200마리 처치" }
    ];


    const skillBookGrades = [
      { id:"worn", name:"낡은 스킬북", className:"rarity-uncommon", weight:74, maxLevel:5, sell:65 },
      { id:"complete", name:"온전한 스킬북", className:"rarity-rare", weight:22, maxLevel:8, sell:150 },
      { id:"forbidden", name:"금단의 스킬북", className:"rarity-epic", weight:4, maxLevel:10, sell:380 }
    ];

    const guideMissions = [
      { id:"guide_hunt", name:"첫 번째 사냥", desc:"몬스터를 한 마리 처치한다.", type:"kills", target:1, page:"hunt", reward:{gold:100} },
      { id:"guide_loot", name:"전리품의 주인", desc:"장비를 한 개 획득한다.", type:"items", target:1, page:"hunt", reward:{health:1,gold:80} },
      { id:"guide_equip", name:"장비를 걸치다", desc:"전리품 가방에서 장비를 한 번 착용한다.", type:"itemsEquipped", target:1, page:"inventory", reward:{dust:5} },
      { id:"guide_stats", name:"힘의 방향", desc:"능력치 포인트를 한 개 이상 배분한다.", type:"statPointsSpent", target:1, page:"hunt", reward:{gold:150} },
      { id:"guide_skill", name:"첫 기술 훈련", desc:"기술을 한 번 훈련한다.", type:"skillUpgrades", target:1, page:"skills", reward:{book:1} },
      { id:"guide_codex", name:"괴물을 기록하다", desc:"몬스터 도감에서 세 종류를 발견한다.", type:"codex", target:3, page:"codex", reward:{dust:8,skill:1} },
      { id:"guide_quest", name:"첫 의뢰 완수", desc:"모험 의뢰 보상을 한 번 받는다.", type:"questsClaimed", target:1, page:"quests", reward:{gold:280} },
      { id:"guide_camp", name:"야영지의 숫자 봉인", desc:"활력 야영지의 숫자 봉인을 한 번 시작한다.", type:"numberBaseballGames", target:1, page:"staminacamp", reward:{staminaPotion:2} },
      { id:"guide_daily", name:"오늘의 균열", desc:"오늘의 균열을 한 번 클리어한다.", type:"dailyClears", target:1, page:"daily", reward:{tierStone:2,skill:1} },
      { id:"guide_save", name:"여정을 보관하다", desc:"기록 보관소에서 수동 저장하거나 세이브 파일을 내보낸다.", type:"manualSaves", target:1, page:"savevault", reward:{gold:500,dust:15} }
    ];


    const dailyBossCatalog = [
      {day:1,id:"morgan",name:"철갑의 모르간",trait:"높은 방어력과 묵직한 일격",reward:"방어·생존형 전리품"},
      {day:2,id:"velka",name:"굶주린 벨카",trait:"강한 공격력과 흡혈성 회복",reward:"체력·흡혈형 전리품"},
      {day:3,id:"lahad",name:"비전술사 라하드",trait:"마나를 말리는 비전 공격",reward:"마나·기술형 전리품"},
      {day:4,id:"graum",name:"쌍두수 그라움",trait:"연속 공격과 높은 체력",reward:"속도·연속 공격형 전리품"},
      {day:5,id:"devourer",name:"황금 탐식자",trait:"골드를 삼키는 탐욕의 괴수",reward:"대량 골드"},
      {day:6,id:"nameless",name:"이름 없는 왕",trait:"세트 전리품을 지키는 왕",reward:"세트 확률 증가"},
      {day:0,id:"star_eater_boss",name:"별을 먹는 자",trait:"유물의 힘을 집어삼키는 존재",reward:"유니크 확률 증가"}
    ];

    const dailyBossDifficulties = [
      {id:"hunt",name:"추적",mult:.88,reward:1.0},
      {id:"raid",name:"토벌",mult:1.10,reward:1.7},
      {id:"annihilation",name:"멸살",mult:1.42,reward:2.8}
    ];

    const rareMonsterCatalog = [
      {id:"goldrunner",name:"황금 도망자",label:"3막 안에 잡아야 하는 보물 운반자",turnLimit:3,attack:.72,defense:.82,hp:.74,gold:9,drop:1},
      {id:"bookeater",name:"책을 먹는 악마",label:"처치하면 스킬북을 확정적으로 남긴다",turnLimit:8,attack:1.08,defense:.92,hp:1.15,gold:1.4,drop:.55},
      {id:"reliccarrier",name:"유물 운반자",label:"세트·유니크 판정이 크게 상승한다",turnLimit:10,attack:1.15,defense:1.15,hp:1.35,gold:1.7,drop:1},
      {id:"greenwisp",name:"녹빛 원령",label:"활력의 기운을 응축한 희귀종",turnLimit:7,attack:.90,defense:.82,hp:.92,gold:1.2,drop:.30}
    ];

    const collectionMilestones = [
      {count:3,name:"낯선 유물의 흔적",reward:{gold:400},stats:{maxHpMult:.02}},
      {count:6,name:"작은 수집 서고",reward:{dust:15},stats:{itemFind:1}},
      {count:10,name:"유물 연구자",reward:{gold:900,skill:1},stats:{attackMult:.03,magicPowerMult:.03}},
      {count:15,name:"잿빛 박물관",reward:{dust:30,tierStone:3},stats:{damageReduction:.02}},
      {count:20,name:"세계의 수집가",reward:{gold:1800,skill:2},stats:{maxHpMult:.03,itemFind:2}}
    ];

    const achievementDefs = [
      {id:"first_steps",name:"첫 백 걸음",desc:"몬스터 100마리 처치",metric:"kills",target:100,title:"백인참",reward:{gold:500},titleStats:{attackMult:.01}},
      {id:"six_seals",name:"여섯 봉인의 장비",desc:"6접사 전설 장비 획득",metric:"sixAffixItems",target:1,title:"육중각인",reward:{dust:20},titleStats:{itemFind:1}},
      {id:"relic_finder",name:"이름 있는 유물",desc:"유니크 아이템 획득",metric:"uniqueItems",target:1,title:"유물 발견자",reward:{gold:700},titleStats:{maxHpMult:.02}},
      {id:"abyss_walker",name:"심연을 걷는 자",desc:"끝없는 심연 10층 도달",metric:"abyssBestFloor",target:10,title:"심연 답파자",reward:{dust:25},titleStats:{skillDamageBonus:.03}},
      {id:"weekday_hunter",name:"요일의 대적자",desc:"일일 보스 첫 승리",metric:"dailyBossWins",target:1,title:"요일 토벌자",reward:{gold:800},titleStats:{eliteDamage:.05}},
      {id:"rare_tracker",name:"낯선 그림자",desc:"희귀 몬스터 5마리 처치",metric:"rareMonsterKills",target:5,title:"희귀종 추적자",reward:{dust:18},titleStats:{mapFind:.3}},
      {id:"museum",name:"수집 서고의 주인",desc:"세트·유니크 10종 발견",metric:"collectionCount",target:10,title:"유물 수집가",reward:{gold:1000},titleStats:{itemFind:1}},
      {id:"war_sponsor",name:"야전의 후원자",desc:"야전 정비에 1,000골드 사용",metric:"fieldCareGoldSpent",target:1000,title:"야전 후원자",reward:{dust:15},titleStats:{goldFind:3}},
      {id:"blind_bettor",name:"눈먼 선택",desc:"도박 상점에서 100회 구매",metric:"gambleCount",target:100,title:"봉인품 중독자",reward:{dust:25},titleStats:{goldFind:4}}
    ];

    const mercenaryCatalog = [
      {id:"adel",name:"잿빛 사제 아델",role:"치료",cost:500,condition:"처음부터 고용 가능",check:()=>true,effect:"3막마다 최대 체력의 4% 회복",stats:{companionHealEvery:3,companionHealRate:.04}},
      {id:"baron",name:"묘지 도굴꾼 바론",role:"파밍",cost:1600,condition:"몬스터 50마리 처치",check:()=>state.records.kills>=50,effect:"장비 발견 +2%, 희귀 지도 발견 +0.2%",stats:{itemFind:2,mapFind:.2}},
      {id:"kain",name:"철갑 용병 카인",role:"방어",cost:2600,condition:"정예 20마리 처치",check:()=>state.records.eliteKills>=20,effect:"받는 피해 -5%, 반격 +3%",stats:{damageReduction:.05,counter:.03}},
      {id:"rin",name:"칼바람 린",role:"공격",cost:3500,condition:"레벨 15 달성",check:()=>state.level>=15,effect:"기술 피해 +8%, 4막마다 지원 공격",stats:{skillDamageBonus:.08,companionStrikeEvery:4,companionStrikeRate:.55}},
      {id:"mora",name:"검은 상단의 모라",role:"보물",cost:6000,condition:"희귀 몬스터 5마리 처치",check:()=>state.records.rareMonsterKills>=5,effect:"골드 +5%, 장비 발견 +1.5%, 추가 전리품 +1%",stats:{goldFind:5,itemFind:1.5,extraDropChance:.01}}
    ];

    const dailyDungeonThemes = [
      { id:"gold", name:"황금 금고", desc:"황금 수호자들이 지키는 금고입니다. 골드 보상이 두 배입니다.", gold:2.0, dust:1.0, skill:0, items:1 },
      { id:"arcane", name:"비전 도서관", desc:"마력으로 뒤틀린 서고입니다. 스킬 포인트와 별가루 보상이 증가합니다.", gold:1.0, dust:1.5, skill:1, items:1 },
      { id:"supply", name:"붉은 보급창", desc:"전쟁 보급품이 쌓인 창고입니다. 회복품을 대량으로 획득합니다.", gold:1.2, dust:1.0, skill:0, items:0 },
      { id:"rift", name:"뒤틀린 균열핵", desc:"강한 적이 출현하지만 장비 보상이 풍부합니다.", gold:1.3, dust:1.2, skill:0, items:2 }
    ];

    const dailyDifficulties = [
      { id:"normal", name:"보통", mult:.82, rewardMult:1.0, recText:"현재 전투력의 약 80%" },
      { id:"hard", name:"어려움", mult:1.12, rewardMult:1.55, recText:"현재 전투력의 약 110%" },
      { id:"nightmare", name:"악몽", mult:1.48, rewardMult:2.3, recText:"현재 전투력의 약 150%" }
    ];

    const arenaNames = [
      "붉은 까마귀", "잠들지 않는 창", "은빛 고양이", "돌주먹 바렌",
      "망각의 사제", "남쪽의 궁수", "검은 가면", "유리검 리안",
      "고요한 폭풍", "재의 수집가", "푸른 불꽃", "무명의 결투가"
    ];


    const setCatalog = {
      ashwarden: {
        name:"잿빛 파수꾼",
        lore:"불이 모두 꺼진 뒤에도 성문을 지킨 자들의 장비.",
        pieces:{
          weapon:{name:"재를 가르는 파수검", factors:{attack:5.4, defense:1.0}},
          armor:{name:"꺼지지 않는 성벽", factors:{defense:3.7, maxHp:9.0}},
          ring:{name:"파수의 맹세", factors:{defense:1.5, maxHp:4.5, crit:1.1}},
          amulet:{name:"최후의 봉화", factors:{maxHp:6.0, maxMp:2.0, defense:1.2}}
        },
        bonuses:[
          {pieces:2,label:"2세트 · 성벽의 숨결: 최대 체력 +15%, 방어력 +12%", stats:{maxHpMult:.15,defenseMult:.12}},
          {pieces:3,label:"3세트 · 끝나지 않은 경계: 반격 +8%, 전투 후 회복 +5%", powers:{counter:.08,postHeal:.05}},
          {pieces:4,label:"4세트 · 불굴의 성채: 받는 피해 -10%, 모든 기술 레벨 +1", powers:{damageReduction:.10,allSkillLevels:1}}
        ]
      },
      astral: {
        name:"별무리 서약",
        lore:"하늘에서 떨어진 파편을 엮어 만든 마도구.",
        pieces:{
          weapon:{name:"유성의 끝", factors:{magicPower:5.7,maxMp:3.0}},
          armor:{name:"별무리 예복", factors:{defense:2.7,maxMp:7.0,magicPower:1.5}},
          ring:{name:"공전의 고리", factors:{magicPower:2.8,crit:1.6,maxMp:2.0}},
          amulet:{name:"새벽별의 핵", factors:{magicPower:3.1,maxMp:5.5}}
        },
        bonuses:[
          {pieces:2,label:"2세트 · 별의 맥동: 마법력 +15%, 최대 마나 +15%", stats:{magicPowerMult:.15,maxMpMult:.15}},
          {pieces:3,label:"3세트 · 고요한 궤도: 기술 마나 소모 -15%", powers:{skillManaReduction:.15}},
          {pieces:4,label:"4세트 · 유성우: 기술 피해 +24%, 기술 사용 시 25% 확률로 잔향", powers:{skillDamageBonus:.24,skillEcho:.25}}
        ]
      },
      bloodhunt: {
        name:"붉은 사냥",
        lore:"사냥감의 피가 마르기 전에 다음 표적을 찾는 자들의 유물.",
        pieces:{
          weapon:{name:"붉은 추적자의 창", factors:{attack:5.8,crit:1.5}},
          armor:{name:"핏자국 망토", factors:{defense:2.4,maxHp:5.8,attack:1.5}},
          ring:{name:"사냥감의 눈", factors:{attack:2.7,crit:2.0,itemFind:.35}},
          amulet:{name:"목 없는 사냥꾼의 표식", factors:{attack:2.2,crit:1.4,mapFind:.12}}
        },
        bonuses:[
          {pieces:2,label:"2세트 · 피 냄새: 공격력 +15%, 치명타 +6%", stats:{attackMult:.15,crit:6}},
          {pieces:3,label:"3세트 · 큰 사냥감: 정예 피해 +15%, 장비 발견 +2%", stats:{itemFind:2},powers:{eliteDamage:.15}},
          {pieces:4,label:"4세트 · 목을 노려라: 체력 15% 이하 적 처형, 빈사 상태 피해 +30%", powers:{executeThreshold:.15,lowHpDamageBonus:.30}}
        ]
      },
      ragmerchant: {
        name:"누더기 행상단",
        lore:"강한 물건은 없지만 주머니와 눈썰미만큼은 누구에게도 지지 않던 행상단.",
        pieces:{
          weapon:{name:"값싼 흥정용 단검", factors:{attack:2.4,goldFind:1.2}},
          armor:{name:"주머니 많은 누더기", factors:{defense:1.8,maxHp:3.5,itemFind:.24}},
          ring:{name:"닳아빠진 동전 고리", factors:{crit:.8,goldFind:1.5,itemFind:.18}},
          amulet:{name:"길 잃은 상인의 나침반", factors:{mapFind:.12,itemFind:.22,maxHp:2.2}}
        },
        bonuses:[
          {pieces:2,label:"2세트 · 싼 게 비지떡: 골드 획득 +6%, 장비 발견 +1%", stats:{goldFind:6,itemFind:1}},
          {pieces:3,label:"3세트 · 떨이 행운: 희귀 지도 발견 +0.3%, 추가 전리품 확률 +1%", stats:{mapFind:.3},powers:{extraDropChance:.01}},
          {pieces:4,label:"4세트 · 행상단의 비밀창고: 기술 피해 -5%, 전투 후 회복 +2%", powers:{skillDamageBonus:-.05,postHeal:.02}}
        ]
      }
    };

    const uniqueCatalog = [
      {
        id:"gravash", name:"그라바쉬, 파멸을 울리는 종", slot:"weapon",
        classIds:["vanguard","ironfist"],
        lore:"종은 한 번도 울린 적이 없다. 들은 자가 남지 않았기 때문이다.",
        factors:{attack:7.2,crit:2.1,defense:1.1},
        skillBoosts:{execute:2,crushingfist:2},
        powerLabel:"첫 번째 기술의 피해가 65% 증가한다.",
        powers:{firstSkillDamage:.65}
      },
      {
        id:"arcana_zero", name:"아르카나 제0장", slot:"weapon",
        classIds:["arcanist","oracle"],
        lore:"존재하지 않는 첫 장. 읽은 문장은 다시 마나가 된다.",
        factors:{magicPower:7.4,maxMp:7.0,crit:1.5},
        skillBoosts:{fireburst:2,judgment:2,manasurge:1},
        powerLabel:"기술 피해 +8%. 기술 사용 시 마나 2 회복.",
        powers:{skillDamageBonus:.08,manaOnSkill:2}
      },
      {
        id:"eclipse", name:"월식, 검은 태양의 칼날", slot:"weapon",
        classIds:["marksman","shadow"],
        lore:"빛이 사라진 한순간에만 칼날의 진짜 길이가 보인다.",
        factors:{attack:7.0,crit:2.8,spd:1.2},
        skillBoosts:{weakpoint:2,shadowstrike:2,twinblade:1},
        powerLabel:"체력 12% 이하의 적을 즉시 처형한다.",
        powers:{executeThreshold:.12}
      },
      {
        id:"last_night", name:"죽지 않는 자의 마지막 밤", slot:"armor",
        lore:"주인은 죽었다. 갑옷은 그 사실을 아직 모른다.",
        factors:{maxHp:11.0,defense:4.3},
        skillBoosts:{lifewave:1,bloodthirst:1},
        powerLabel:"전투당 한 번, 쓰러질 때 최대 체력의 35%로 일어난다.",
        powers:{reviveRate:.35}
      },
      {
        id:"star_scale", name:"천 겹의 별비늘", slot:"armor",
        lore:"별 하나가 부서질 때마다 비늘 한 장이 생겨났다.",
        factors:{defense:4.0,maxMp:7.5,magicPower:2.4},
        powerLabel:"받는 피해 -10%. 모든 기술 레벨 +1.",
        powers:{damageReduction:.10,allSkillLevels:1}
      },
      {
        id:"empty_armor", name:"바람이 남긴 빈 갑옷", slot:"armor",
        lore:"안에는 아무도 없다. 하지만 공격은 늘 빗나간다.",
        factors:{defense:3.4,maxHp:6.0,dodge:.018,doubleHit:.018},
        skillBoosts:{multishot:1,twinblade:1},
        powerLabel:"회피 +6%, 연속 공격 +5%.",
        powers:{dodge:.06,doubleHit:.05}
      },
      {
        id:"seventh_luck", name:"일곱 번째 행운", slot:"ring",
        lore:"여섯 번의 불운을 견딘 자에게만 일곱 번째가 온다.",
        factors:{crit:3.2,itemFind:.72,mapFind:.20,luck:1.2},
        powerLabel:"장비가 떨어질 때 8% 확률로 전리품이 하나 더 떨어진다.",
        powers:{extraDropChance:.08}
      },
      {
        id:"eternal_loop", name:"무한회귀의 고리", slot:"ring",
        lore:"끝난 주문이 다시 첫 음절로 되돌아간다.",
        factors:{maxMp:5.0,crit:2.0,magicPower:2.2},
        skillBoosts:{manasurge:2,judgment:1,qiblast:1},
        powerLabel:"모든 기술의 발동 주기가 1턴 짧아지고 기술 사용 시 마나 1 회복.",
        powers:{skillEveryReduction:1,manaOnSkill:1}
      },
      {
        id:"bloody_king", name:"피묻은 왕의 인장", slot:"ring",
        lore:"왕은 죽었지만 인장은 아직 복종을 요구한다.",
        factors:{attack:3.8,crit:2.7,maxHp:2.5},
        skillBoosts:{execute:1,weakpoint:1},
        powerLabel:"정예와 보스에게 주는 피해 +22%.",
        powers:{eliteDamage:.22}
      },
      {
        id:"last_breath", name:"마지막 숨의 유리병", slot:"amulet",
        lore:"누군가의 마지막 숨이 아직 병 안쪽을 흐리고 있다.",
        factors:{maxHp:7.0,maxMp:6.0,defense:1.5},
        skillBoosts:{lifewave:2,lifesteal:1},
        powerLabel:"마나가 20% 아래로 내려가면 전투당 한 번 최대 마나의 35% 회복.",
        powers:{emergencyManaRate:.35}
      },
      {
        id:"star_eater", name:"별을 삼킨 목걸이", slot:"amulet",
        lore:"밤하늘에서 별 하나가 사라질 때마다 더 무거워진다.",
        factors:{magicPower:4.4,maxMp:7.2,crit:1.4},
        powerLabel:"모든 기술 레벨 +2, 기술 피해 +12%.",
        powers:{allSkillLevels:2,skillDamageBonus:.12}
      },
      {
        id:"second_key", name:"묘지기의 두 번째 열쇠", slot:"amulet",
        lore:"첫 번째 열쇠는 무덤을 연다. 두 번째는 돌아갈 길을 연다.",
        factors:{defense:1.9,mapFind:.34,itemFind:.55,luck:.8},
        skillBoosts:{shadowstrike:1,purge:1},
        powerLabel:"희귀 지도 발견 확률이 크게 증가한다.",
        powers:{mapFind:1.2}
      },
      {
        id:"blunt_kings_knife", name:"무딘 왕의 식칼", slot:"weapon",
        lore:"왕실 주방에서 버려진 칼. 왕의 이름만 남고 날은 사라졌다.",
        factors:{attack:3.0,goldFind:1.6,maxHp:1.8},
        powerLabel:"골드는 조금 더 얻지만 첫 기술 피해가 12% 감소한다.",
        powers:{firstSkillDamage:-.12},
        valueTier:"dud",
        dropWeight:2.2
      },
      {
        id:"cracked_hourglass", name:"금 간 모래시계", slot:"amulet",
        lore:"시간은 흐르지만 모래는 자꾸 틈새로 새어 나간다.",
        factors:{maxMp:3.8,itemFind:.22,spd:.45},
        powerLabel:"장비 발견이 오르지만 기술 발동 주기가 1턴 늦어진다.",
        powers:{skillEveryReduction:-1},
        valueTier:"dud",
        dropWeight:2.0
      }
    ];




    const specialQualityTable = [
      { id:"cracked", name:"금이 간 결함품", short:"결함품", weight:22, statMult:.70, powerMult:.55, skillDelta:-1, className:"quality-cracked" },
      { id:"faded", name:"빛바랜 불완전품", short:"불완전", weight:34, statMult:.87, powerMult:.80, skillDelta:0, className:"quality-faded" },
      { id:"intact", name:"온전한 유물", short:"온전", weight:29, statMult:1.00, powerMult:1.00, skillDelta:0, className:"quality-intact" },
      { id:"perfect", name:"완벽한 유물", short:"완벽", weight:13, statMult:1.15, powerMult:1.18, skillDelta:0, className:"quality-perfect" },
      { id:"awakened", name:"각성한 유물", short:"각성", weight:2, statMult:1.34, powerMult:1.42, skillDelta:1, className:"quality-awakened" }
    ];

    const setPieceSpecialCatalog = {
      ashwarden:{
        weapon:{label:"파수검이 정예에게 주는 피해를 높인다.",powers:{eliteDamage:.06}},
        armor:{label:"성벽이 받는 피해를 줄인다.",powers:{damageReduction:.04}},
        ring:{label:"맹세가 반격 확률을 높인다.",powers:{counter:.03}},
        amulet:{label:"봉화가 전투 후 체력을 회복한다.",powers:{postHeal:.03}}
      },
      astral:{
        weapon:{label:"유성이 기술 사용 시 마나를 되돌린다.",powers:{manaOnSkill:1}},
        armor:{label:"예복이 기술의 마나 소모를 줄인다.",powers:{skillManaReduction:.05}},
        ring:{label:"공전의 고리가 별의 잔향을 일으킨다.",powers:{skillEcho:.05}},
        amulet:{label:"핵이 모든 기술 피해를 높인다.",powers:{skillDamageBonus:.05}}
      },
      bloodhunt:{
        weapon:{label:"창끝이 빈사 상태의 적을 처형한다.",powers:{executeThreshold:.04}},
        armor:{label:"망토가 빈사 상태에서 받는 피해를 줄인다.",powers:{lowHpDamageReduction:.08}},
        ring:{label:"눈이 추가 전리품을 찾아낸다.",powers:{extraDropChance:.02}},
        amulet:{label:"표식이 희귀 지도 발견을 높인다.",powers:{mapFind:.25}}
      },
      ragmerchant:{
        weapon:{label:"값싼 칼은 첫 기술의 위력을 떨어뜨린다.",powers:{firstSkillDamage:-.06}},
        armor:{label:"누더기 주머니가 장비 발견을 조금 높인다.",powers:{}},
        ring:{label:"닳은 고리가 아주 낮은 확률로 전리품을 복제한다.",powers:{extraDropChance:.006}},
        amulet:{label:"고장 난 나침반이 희귀 지도 발견을 조금 높인다.",powers:{mapFind:.10}}
      }
    };

    function weightedChoice(entries) {
      const total = entries.reduce((sum,entry) => sum + Math.max(0,Number(entry.weight || 0)),0);
      if (total <= 0) return entries[0]?.value;
      let roll = Math.random()*total;
      for (const entry of entries) {
        roll -= Math.max(0,Number(entry.weight || 0));
        if (roll <= 0) return entry.value;
      }
      return entries.at(-1)?.value;
    }

    function rollSpecialQuality() {
      return weightedChoice(specialQualityTable.map(quality => ({value:quality,weight:quality.weight}))) || specialQualityTable[2];
    }

    function uniqueBaseValueTier(template) {
      if (template.valueTier) return template.valueTier;
      if (["gravash","eclipse","last_night","star_eater","seventh_luck"].includes(template.id)) return "jackpot";
      return "solid";
    }

    function setBaseValueTier(setId) {
      return setId === "ragmerchant" ? "dud" : "solid";
    }

    function specialVerdict(baseTier,quality) {
      const baseScore = {dud:0,solid:1,jackpot:2}[baseTier] ?? 1;
      const qualityScore = {cracked:-1,faded:0,intact:1,perfect:2,awakened:3}[quality?.id] ?? 1;
      const score = baseScore+qualityScore;
      if (score <= 0) return {id:"dud",name:"꽝",className:"verdict-dud"};
      if (score >= 4) return {id:"jackpot",name:"대박",className:"verdict-jackpot"};
      return {id:"solid",name:"준수",className:"verdict-solid"};
    }

    function scaleSpecialPowers(powers,quality) {
      const result = {};
      const discrete = new Set(["allSkillLevels","skillEveryReduction","manaOnSkill"]);
      Object.entries(powers || {}).forEach(([key,value]) => {
        if (typeof value !== "number") return;
        if (discrete.has(key)) {
          if (value < 0) {
            result[key] = -Math.max(1,Math.round(Math.abs(value)*(2-quality.powerMult)));
          } else {
            const bonus = quality.id === "awakened" ? 1 : 0;
            result[key] = Math.max(0,Math.round(value)+bonus);
          }
        } else if (value < 0) {
          result[key] = value*(2-quality.powerMult);
        } else {
          result[key] = value*quality.powerMult;
        }
      });
      return result;
    }

    function scaleSkillBoosts(boosts,quality) {
      const result = {};
      Object.entries(boosts || {}).forEach(([skillId,value]) => {
        const scaled = Math.max(0,Number(value)+(quality.skillDelta || 0));
        if (scaled > 0) result[skillId] = scaled;
      });
      return result;
    }

    function specialPowerScore(powers,skillBoosts) {
      const powerScore = Object.entries(powers || {}).reduce((sum,[key,value]) => {
        const multiplier = ["allSkillLevels","skillEveryReduction","manaOnSkill"].includes(key) ? 55 : 350;
        return sum+Math.abs(Number(value || 0))*multiplier;
      },0);
      const skillScore = Object.values(skillBoosts || {}).reduce((sum,value) => sum+Number(value || 0)*48,0);
      return powerScore+skillScore;
    }

    const attendanceRewards = [
      { day:1, icon:"◆", name:"첫 번째 흔적", text:"골드 250", reward:{gold:250} },
      { day:2, icon:"✚", name:"붉고 푸른 보급", text:"치유약 2 · 마나약 2", reward:{health:2,mana:2} },
      { day:3, icon:"✦", name:"대장간의 먼지", text:"별가루 10", reward:{dust:10} },
      { day:4, icon:"◈", name:"긴 사냥의 숨", text:"활력 20 · 골드 180", reward:{stamina:20,gold:180} },
      { day:5, icon:"⌁", name:"낡은 기술서", text:"스킬 포인트 1", reward:{skill:1} },
      { day:6, icon:"✧", name:"보랏빛 보급", text:"혼합 영약 2 · 별가루 16", reward:{elixir:2,dust:16} },
      { day:7, icon:"⬟", name:"봉인된 전리품", text:"희귀한 장비 상자 1개", reward:{lootBox:1} }
    ];

    const affixBandTables = {
      damage:[
        {min:1,max:9},{min:10,max:19},{min:20,max:39},{min:40,max:69},
        {min:70,max:109},{min:110,max:169},{min:170,max:259},{min:260,max:999999}
      ],
      defense:[
        {min:1,max:5},{min:6,max:11},{min:12,max:23},{min:24,max:39},
        {min:40,max:64},{min:65,max:99},{min:100,max:159},{min:160,max:999999}
      ],
      health:[
        {min:1,max:29},{min:30,max:69},{min:70,max:139},{min:140,max:249},
        {min:250,max:399},{min:400,max:649},{min:650,max:999},{min:1000,max:999999}
      ],
      percent:[
        {min:.1,max:.9},{min:1,max:1.9},{min:2,max:3.9},{min:4,max:6.9},
        {min:7,max:10.9},{min:11,max:15.9},{min:16,max:24.9},{min:25,max:9999}
      ],
      attribute:[
        {min:1,max:2},{min:3,max:5},{min:6,max:9},{min:10,max:14},
        {min:15,max:21},{min:22,max:30},{min:31,max:44},{min:45,max:999999}
      ]
    };

    const prefixDefs = [
      { id:"attack_prefix", stat:"attack", label:"공격력", factor:1.85, band:"damage", slots:["weapon","armor","ring","amulet"],
        tierNames:["거친","강인한","강력한","파괴적인","잔혹한","멸망의","재앙의","종말의"] },
      { id:"magic_prefix", stat:"magicPower", label:"마법력", factor:1.85, band:"damage", slots:["weapon","ring","amulet"],
        tierNames:["희미한","비전의","심오한","대마도의","초월의","성운의","천공의","우주의"] },
      { id:"mana_prefix", stat:"maxMp", label:"최대 마나", factor:3.9, band:"health", slots:["weapon","armor","ring","amulet"],
        tierNames:["메마른","마력의","충만한","넘실대는","심연의","무한한","원천의","영원의"] },
      { id:"defense_prefix", stat:"defense", label:"방어력", factor:1.25, band:"defense", slots:["armor","ring","amulet"],
        tierNames:["덧댄","단단한","철벽의","요새의","불굴의","성채의","난공의","불멸의"] },
      { id:"health_prefix", stat:"maxHp", label:"최대 체력", factor:5.8, band:"health", slots:["weapon","armor","ring","amulet"],
        tierNames:["질긴","생명의","왕성한","거인의","고대의","태고의","무궁한","영생의"] },
      { id:"crit_prefix", stat:"crit", label:"치명타 확률", factor:.78, band:"percent", percent:true, slots:["weapon","ring"],
        tierNames:["벼린","예리한","날카로운","치명적인","필살의","사신의","운명의","절명의"] },
      { id:"gold_prefix", stat:"goldFind", label:"골드 획득량", factor:3.1, band:"percent", percent:true, slots:["weapon","armor","ring","amulet"],
        tierNames:["동전의","탐욕의","부유한","황금의","대부호의","왕실의","제왕의","미다스의"] },
      { id:"item_prefix", stat:"itemFind", label:"장비 발견", factor:.62, band:"percent", percent:true, slots:["weapon","armor","ring","amulet"],
        tierNames:["뒤지는","발견자의","탐색자의","보물찾기의","유물사냥의","고고학자의","전설추적의","운명발견의"] },
      { id:"speed_prefix", stat:"spd", label:"속도", factor:.82, band:"attribute", slots:["weapon","armor","ring","amulet"],
        tierNames:["가벼운","신속한","재빠른","질풍의","번개의","섬광의","순간의","시간을 가르는"] }
    ];

    const suffixDefs = [
      { id:"attack_suffix", stat:"attack", label:"공격력", factor:1.55, band:"damage", slots:["weapon","armor","ring","amulet"],
        tierNames:["투사","강자","학살자","파괴자","도살왕","멸망자","재앙","종말"] },
      { id:"magic_suffix", stat:"magicPower", label:"마법력", factor:1.55, band:"damage", slots:["weapon","ring","amulet"],
        tierNames:["견습술사","마도사","대마도사","현자","별의 술사","차원술사","천공술사","우주술사"] },
      { id:"mana_suffix", stat:"maxMp", label:"최대 마나", factor:3.4, band:"health", slots:["weapon","armor","ring","amulet"],
        tierNames:["수습생","현자","마력샘","마나해","심연","원천","무한","영원"] },
      { id:"defense_suffix", stat:"defense", label:"방어력", factor:1.08, band:"defense", slots:["armor","ring","amulet"],
        tierNames:["호위병","수호자","철벽","성문지기","요새지기","불굴자","난공성","불멸수호"] },
      { id:"health_suffix", stat:"maxHp", label:"최대 체력", factor:4.9, band:"health", slots:["weapon","armor","ring","amulet"],
        tierNames:["생존자","불사자","거인","고대인","태고인","영생자","무궁자","불멸자"] },
      { id:"crit_suffix", stat:"crit", label:"치명타 확률", factor:.66, band:"percent", percent:true, slots:["weapon","ring"],
        tierNames:["매의 눈","독수리의 눈","사냥꾼의 눈","암살자의 눈","사신의 눈","운명의 눈","필멸의 눈","절명의 눈"] },
      { id:"item_suffix", stat:"itemFind", label:"장비 발견", factor:.55, band:"percent", percent:true, slots:["weapon","armor","ring","amulet"],
        tierNames:["수집가","보물사냥꾼","탐험가","유물추적자","전설사냥꾼","고대탐색자","운명추적자","세계수집가"] },
      { id:"map_suffix", stat:"mapFind", label:"희귀 지도 발견", factor:.23, band:"percent", percent:true, slots:["weapon","armor","ring","amulet"],
        tierNames:["길잡이","탐로자","균열추적자","차원길잡이","공허항해자","별길잡이","세계유랑자","경계초월자"] },
      { id:"luck_suffix", stat:"luck", label:"행운", factor:.78, band:"attribute", slots:["weapon","armor","ring","amulet"],
        tierNames:["운 좋은 자","행운아","복 받은 자","천운의 자","기적의 자","운명아","별의 총아","신의 총아"] }
    ];

    const slots = [
      { key: "weapon", label: "무기" },
      { key: "armor", label: "갑옷" },
      { key: "ring", label: "반지" },
      { key: "amulet", label: "부적" }
    ];

    const zones = [
      { id:"field", name:"버려진 들판", tier:1, rec:20, enemies:["굶주린 들쥐","떠돌이 약탈자","썩은 들개"], mult:1.0 },
      { id:"camp", name:"도적 야영지", tier:2, rec:65, enemies:["도적 척후병","도적 투사","불량 용병"], mult:1.30 },
      { id:"grave", name:"망자의 공동묘지", tier:3, rec:150, enemies:["해골 병사","울부짖는 망령","묘지 도굴꾼"], mult:1.75 },
      { id:"mine", name:"악마의 광산", tier:4, rec:330, enemies:["광산 악마","쇠사슬 노예","검댕 골렘"], mult:2.35 },
      { id:"citadel", name:"용암 성채", tier:5, rec:700, enemies:["화염 기사","용암 사냥개","뿔난 집행자"], mult:3.10 },
      { id:"frost", name:"빙결 협곡", tier:6, rec:1400, enemies:["얼음 송곳니","서리 마녀","빙결 골렘"], mult:4.10 },
      { id:"sunken", name:"침몰한 신전", tier:7, rec:2700, enemies:["심해 신관","익사한 기사","산호 괴수"], mult:5.50 },
      { id:"spire", name:"별빛 첨탑", tier:8, rec:5000, enemies:["별의 파수꾼","공허 점성술사","수정 용"], mult:7.30 },
      { id:"garden", name:"심연의 정원", tier:9, rec:9000, enemies:["심연 포식자","검은 꽃술사","타락한 수호목"], mult:9.80 },
      { id:"throne", name:"재의 왕좌", tier:10, rec:16000, enemies:["재의 군주","종말의 기사","왕좌의 감시자"], mult:13.0 }
    ];

    const rarityTable = [
      { key:"common", name:"일반", className:"rarity-common", weight:72.0, prefixCount:0, suffixCount:0, mult:1.0, sell:1 },
      { key:"uncommon", name:"고급", className:"rarity-uncommon", weight:22.5, prefixCount:1, suffixCount:0, mult:1.18, sell:2 },
      { key:"rare", name:"희귀", className:"rarity-rare", weight:4.6, prefixCount:1, suffixCount:1, mult:1.48, sell:4 },
      { key:"epic", name:"영웅", className:"rarity-epic", weight:.82, prefixCount:2, suffixCount:2, mult:1.88, sell:8 },
      { key:"legendary", name:"전설", className:"rarity-legendary", weight:.08, prefixCount:3, suffixCount:3, mult:2.5, sell:20 }
    ];

    const itemNames = {
      weapon: ["녹슨 장검", "무거운 도끼", "사냥꾼의 창", "금 간 철퇴", "잿빛 대검"],
      armor: ["가죽 흉갑", "쇠사슬 갑옷", "용병의 철갑", "핏빛 외투", "잿빛 판금"],
      ring: ["붉은 돌 반지", "녹슨 인장", "까마귀 반지", "뼈 장식 고리", "금이 간 옥반지"],
      amulet: ["짐승 이빨 부적", "망자의 목걸이", "검은 실 부적", "광부의 수호석", "불꽃 문양 부적"]
    };

    const defaultState = () => ({
      version: VERSION,
      nickname: "",
      classId: null,
      attributes: { str:5, vit:5, int:5, spi:5, luck:5, spd:5 },
      statPoints: 0,
      statResetCount: 0,
      skillPoints: 0,
      skills: defaultSkillState(),
      skillBooks: [],
      lastSkillBook: null,
      guide: { claimed:{} },
      mastery: { vanguard:0, arcanist:0, oracle:0, ironfist:0, marksman:0, shadow:0 },
      level: 1,
      xp: 0,
      gold: 120,
      hp: 100,
      mp: 60,
      stamina: STAMINA_MAX,
      staminaUpdatedAt: Date.now(),
      currentZone: "field",
      streak: 0,
      heat: Object.fromEntries(zones.map(z => [z.id, 0])),
      zonesVisited: { field:true },
      heatUpdatedAt: Date.now(),
      equipment: { weapon:null, armor:null, ring:null, amulet:null },
      inventory: [],
      inventoryCapacity: 40,
      consumables: { health:1, mana:1, stamina:0, elixir:0 },
      fieldCare: {
        enabled:false,
        budget:25,
        priority:"balanced"
      },
      autoProcess: {
        enabled:false,
        common:"keep",
        uncommon:"keep",
        rare:"keep",
        epic:"keep",
        legendary:"keep",
        keepSpecial:true,
        keepSixAffix:true
      },
      affixEssences: [],
      collection: { uniqueIds:{}, setPieces:{}, claimed:{} },
      achievements: { claimed:{}, titles:{}, activeTitle:"" },
      mercenaries: { owned:{}, activeId:"" },
      abyss: { active:false, floor:1, bestFloor:0, hp:0, mp:0, history:[], weeklyKey:"", weeklyBest:0 },
      dailyBoss: { date:"", attempted:false, won:false, lockedPower:0, history:[] },
      gamble: { selectedSlot:"weapon", lastResult:null, history:[] },
      staminaGame: {
        date:"",
        tickets:BASEBALL_DAILY_REWARD_GAMES,
        active:false,
        practice:false,
        secret:"",
        attempts:0,
        maxAttempts:8,
        history:[],
        winsToday:0,
        streak:0,
        bestAttempts:null
      },
      pendingRecovery: null,
      lastLoot: null,
      rareMap: null,
      codex: {},
      dust: 0,
      materials: { sameTierRunes:0 },
      attendance: { lastClaimDate:"", cycleIndex:0, totalClaims:0, streak:0 },
      fever: 0,
      feverBattles: 0,
      bounties: { createdAt:0, missions:[] },
      quests: { claimed:{} },
      dailyDungeon: {
        date:"",
        attempts:3,
        cleared:false,
        best:null,
        history:[],
        runLog:[],
        running:false,
        currentWave:0,
        lastResult:""
      },
      arena: { date:"", tickets:5, rating:1000, wins:0, losses:0, opponents:[], history:[] },
      market: {
        tokens: 0,
        price: 95,
        lastTick: Date.now(),
        history: [95],
        avgCost: 0,
        realized: 0,
        trades: 0,
        ledger: []
      },
      records: {
        kills: 0,
        wins: 0,
        defeats: 0,
        highestDamage: 0,
        items: 0,
        rareMaps: 0,
        totalGold: 0,
        bestStreak: 0,
        legendary: 0,
        itemsSold: 0,
        marketTrades: 0,
        recoveryDrops: 0,
        recoveryUsed: 0,
        eliteKills: 0,
        mutatedKills: 0,
        itemsSalvaged: 0,
        reforges: 0,
        feverActivations: 0,
        bountiesClaimed: 0,
        dailyClears: 0,
        arenaWins: 0,
        arenaLosses: 0,
        questsClaimed: 0,
        skillUpgrades: 0,
        setItems: 0,
        uniqueItems: 0,
        attendanceClaims: 0,
        tierRerolls: 0,
        sixAffixItems: 0,
        specialDuds: 0,
        specialJackpots: 0,
        staminaPotionDrops: 0,
        staminaPotionsUsed: 0,
        numberBaseballGames: 0,
        numberBaseballWins: 0,
        numberBaseballBest: 0,
        numberBaseballPracticeGames: 0,
        numberBaseballPracticeWins: 0,
        staminaEarnedFromGames: 0,
        skillBooksDropped: 0,
        skillBooksUsed: 0,
        skillBooksSold: 0,
        itemsEquipped: 0,
        statPointsSpent: 0,
        manualSaves: 0,
        guideMissionsClaimed: 0,
        fieldCareBattles: 0,
        fieldCareGoldSpent: 0,
        fieldCareHpRestored: 0,
        fieldCareMpRestored: 0,
        autoSoldItems: 0,
        autoSalvagedItems: 0,
        affixExtractionAttempts: 0,
        affixExtractionSuccesses: 0,
        affixInheritances: 0,
        abyssBestFloor: 0,
        abyssWins: 0,
        dailyBossWins: 0,
        dailyBossAttempts: 0,
        rareMonsterKills: 0,
        rareMonsterEscapes: 0,
        achievementsClaimed: 0,
        mercenariesHired: 0,
        uniqueEvolutions: 0,
        gambleCount: 0,
        gambleGoldSpent: 0,
        gambleEpicPlus: 0,
        gambleSpecialItems: 0,
        statResets: 0,
        statResetGoldSpent: 0
      },
      logs: ["《잿빛 전리품》에 입장했습니다. 사냥터를 선택하고 첫 전투를 시작하세요."]
    });

    let state = loadState();
    synchronizeRetroactiveGuideRecords();
    synchronizeExpansionState();
    let autoTimer = null;
    let autoNextAt = 0;
    let isBusy = false;

    const els = {
      heroTitle: document.getElementById("heroTitle"),
      classLine: document.getElementById("classLine"),
      levelBadge: document.getElementById("levelBadge"),
      classPassiveTitle: document.getElementById("classPassiveTitle"),
      classPassive: document.getElementById("classPassive"),
      masteryText: document.getElementById("masteryText"),
      statPoints: document.getElementById("statPoints"),
      attributes: document.getElementById("attributes"),
      recommendedStatsBtn: document.getElementById("recommendedStatsBtn"),
      balancedStatsBtn: document.getElementById("balancedStatsBtn"),
      statResetBtn: document.getElementById("statResetBtn"),
      statResetHint: document.getElementById("statResetHint"),
      changeClassBtn: document.getElementById("changeClassBtn"),
      classModal: document.getElementById("classModal"),
      classOptions: document.getElementById("classOptions"),
      defeatModal: document.getElementById("defeatModal"),
      defeatSummary: document.getElementById("defeatSummary"),
      defeatEnemy: document.getElementById("defeatEnemy"),
      defeatTurns: document.getElementById("defeatTurns"),
      defeatHp: document.getElementById("defeatHp"),
      defeatMp: document.getElementById("defeatMp"),
      defeatAutoStop: document.getElementById("defeatAutoStop"),
      defeatInventoryBtn: document.getElementById("defeatInventoryBtn"),
      defeatConfirmBtn: document.getElementById("defeatConfirmBtn"),
      nicknameModal: document.getElementById("nicknameModal"),
      nicknameModalInput: document.getElementById("nicknameModalInput"),
      nicknameConfirmBtn: document.getElementById("nicknameConfirmBtn"),
      nicknameError: document.getElementById("nicknameError"),
      power: document.getElementById("power"),
      gold: document.getElementById("gold"),
      attack: document.getElementById("attack"),
      defense: document.getElementById("defense"),
      crit: document.getElementById("crit"),
      streak: document.getElementById("streak"),
      xpText: document.getElementById("xpText"),
      xpBar: document.getElementById("xpBar"),
      focusText: document.getElementById("focusText"),
      focusBar: document.getElementById("focusBar"),
      equipment: document.getElementById("equipment"),
      equipmentTooltip: document.getElementById("equipmentTooltip"),
      zoneSelect: document.getElementById("zoneSelect"),
      zoneSelectSummary: document.getElementById("zoneSelectSummary"),
      currentZoneName: document.getElementById("currentZoneName"),
      enemyName: document.getElementById("enemyName"),
      enemyMeta: document.getElementById("enemyMeta"),
      hpText: document.getElementById("hpText"),
      hpBar: document.getElementById("hpBar"),
      mpText: document.getElementById("mpText"),
      mpBar: document.getElementById("mpBar"),
      heatText: document.getElementById("heatText"),
      heatBar: document.getElementById("heatBar"),
      feverText: document.getElementById("feverText"),
      feverBar: document.getElementById("feverBar"),
      huntBtn: document.getElementById("huntBtn"),
      autoBtn: document.getElementById("autoBtn"),
      potionBtn: document.getElementById("potionBtn"),
      manaPotionBtn: document.getElementById("manaPotionBtn"),
      elixirBtn: document.getElementById("elixirBtn"),
      staminaPotionBtn: document.getElementById("staminaPotionBtn"),
      fieldCareToggle: document.getElementById("fieldCareToggle"),
      fieldCareBudget: document.getElementById("fieldCareBudget"),
      fieldCarePriority: document.getElementById("fieldCarePriority"),
      fieldCareStatus: document.getElementById("fieldCareStatus"),
      fieldCarePreview: document.getElementById("fieldCarePreview"),
      focusBonusText: document.getElementById("focusBonusText"),
      rareMapCard: document.getElementById("rareMapCard"),
      recoveryCard: document.getElementById("recoveryCard"),
      skillBookDropCard: document.getElementById("skillBookDropCard"),
      lootCard: document.getElementById("lootCard"),
      combatLog: document.getElementById("combatLog"),
      saveState: document.getElementById("saveState"),
      resetBtn: document.getElementById("resetBtn"),
      toast: document.getElementById("toast"),
      inventoryNavCount: document.getElementById("inventoryNavCount"),
      inventoryCount: document.getElementById("inventoryCount"),
      dustCount: document.getElementById("dustCount"),
      tierStoneCount: document.getElementById("tierStoneCount"),
      inventoryGrid: document.getElementById("inventoryGrid"),
      consumableGrid: document.getElementById("consumableGrid"),
      inventoryFilter: document.getElementById("inventoryFilter"),
      inventorySort: document.getElementById("inventorySort"),
      sellJunkBtn: document.getElementById("sellJunkBtn"),
      autoProcessEnabled: document.getElementById("autoProcessEnabled"),
      autoProcessCommon: document.getElementById("autoProcessCommon"),
      autoProcessUncommon: document.getElementById("autoProcessUncommon"),
      autoProcessRare: document.getElementById("autoProcessRare"),
      autoProcessEpic: document.getElementById("autoProcessEpic"),
      autoProcessLegendary: document.getElementById("autoProcessLegendary"),
      keepSpecialItems: document.getElementById("keepSpecialItems"),
      keepSixAffixItems: document.getElementById("keepSixAffixItems"),
      processExistingBtn: document.getElementById("processExistingBtn"),
      affixEssenceCount: document.getElementById("affixEssenceCount"),
      affixEssenceGrid: document.getElementById("affixEssenceGrid"),
      characterClassBadge: document.getElementById("characterClassBadge"),
      nicknameEditInput: document.getElementById("nicknameEditInput"),
      nicknameSaveBtn: document.getElementById("nicknameSaveBtn"),
      detailStats: document.getElementById("detailStats"),
      detailEquipment: document.getElementById("detailEquipment"),
      infoContent: document.getElementById("infoContent"),
      gambleGoldBadge: document.getElementById("gambleGoldBadge"),
      gambleCountBadge: document.getElementById("gambleCountBadge"),
      gambleSlotGrid: document.getElementById("gambleSlotGrid"),
      gambleSelectedSlot: document.getElementById("gambleSelectedSlot"),
      gamblePrice: document.getElementById("gamblePrice"),
      gambleTenPrice: document.getElementById("gambleTenPrice"),
      gambleOnceBtn: document.getElementById("gambleOnceBtn"),
      gambleTenBtn: document.getElementById("gambleTenBtn"),
      gambleResult: document.getElementById("gambleResult"),
      gambleHistory: document.getElementById("gambleHistory"),
      marketPrice: document.getElementById("marketPrice"),
      marketSellPrice: document.getElementById("marketSellPrice"),
      marketHistoryAvg: document.getElementById("marketHistoryAvg"),
      marketGold: document.getElementById("marketGold"),
      marketTokens: document.getElementById("marketTokens"),
      marketAvg: document.getElementById("marketAvg"),
      marketPositionValue: document.getElementById("marketPositionValue"),
      marketUnrealized: document.getElementById("marketUnrealized"),
      marketReturn: document.getElementById("marketReturn"),
      marketProfit: document.getElementById("marketProfit"),
      marketTradeCount: document.getElementById("marketTradeCount"),
      marketBuyQty: document.getElementById("marketBuyQty"),
      marketSellQty: document.getElementById("marketSellQty"),
      marketBuyUnit: document.getElementById("marketBuyUnit"),
      marketSellUnit: document.getElementById("marketSellUnit"),
      marketBuyAvailable: document.getElementById("marketBuyAvailable"),
      marketSellAvailable: document.getElementById("marketSellAvailable"),
      marketBuyTotal: document.getElementById("marketBuyTotal"),
      marketSellTotal: document.getElementById("marketSellTotal"),
      marketSellProfitPreview: document.getElementById("marketSellProfitPreview"),
      marketBuyBtn: document.getElementById("marketBuyBtn"),
      marketSellBtn: document.getElementById("marketSellBtn"),
      marketHistory: document.getElementById("marketHistory"),
      marketLedger: document.getElementById("marketLedger"),
      refillStaminaBtn: document.getElementById("refillStaminaBtn"),
      consumableSummary: document.getElementById("consumableSummary"),
      codexNavCount: document.getElementById("codexNavCount"),
      codexScore: document.getElementById("codexScore"),
      codexSummary: document.getElementById("codexSummary"),
      codexGrid: document.getElementById("codexGrid"),
      bountyNavCount: document.getElementById("bountyNavCount"),
      bountyDust: document.getElementById("bountyDust"),
      refreshBountiesBtn: document.getElementById("refreshBountiesBtn"),
      bountyGrid: document.getElementById("bountyGrid"),
      skillNavCount: document.getElementById("skillNavCount"),
      skillPointBadge: document.getElementById("skillPointBadge"),
      skillBookCountBadge: document.getElementById("skillBookCountBadge"),
      skillBookGrid: document.getElementById("skillBookGrid"),
      skillGrid: document.getElementById("skillGrid"),
      guideNavMark: document.getElementById("guideNavMark"),
      guideSummaryBadge: document.getElementById("guideSummaryBadge"),
      guideCurrentBanner: document.getElementById("guideCurrentBanner"),
      guideMissionGrid: document.getElementById("guideMissionGrid"),
      guideMiniTracker: document.getElementById("guideMiniTracker"),
      questNavCount: document.getElementById("questNavCount"),
      questSummaryBadge: document.getElementById("questSummaryBadge"),
      questGrid: document.getElementById("questGrid"),
      attendanceNavMark: document.getElementById("attendanceNavMark"),
      attendanceStreakBadge: document.getElementById("attendanceStreakBadge"),
      attendanceTotalBadge: document.getElementById("attendanceTotalBadge"),
      attendanceBanner: document.getElementById("attendanceBanner"),
      attendanceGrid: document.getElementById("attendanceGrid"),
      attendanceClaimBtn: document.getElementById("attendanceClaimBtn"),
      staminaCampNavMark: document.getElementById("staminaCampNavMark"),
      baseballTicketBadge: document.getElementById("baseballTicketBadge"),
      campStaminaBadge: document.getElementById("campStaminaBadge"),
      campPotionBadge: document.getElementById("campPotionBadge"),
      baseballTitle: document.getElementById("baseballTitle"),
      baseballStatus: document.getElementById("baseballStatus"),
      baseballStartBtn: document.getElementById("baseballStartBtn"),
      baseballGuessInput: document.getElementById("baseballGuessInput"),
      baseballGuessBtn: document.getElementById("baseballGuessBtn"),
      baseballGiveUpBtn: document.getElementById("baseballGiveUpBtn"),
      baseballResetBtn: document.getElementById("baseballResetBtn"),
      baseballSeal: document.getElementById("baseballSeal"),
      baseballHistory: document.getElementById("baseballHistory"),
      campPotionCount: document.getElementById("campPotionCount"),
      campUsePotionBtn: document.getElementById("campUsePotionBtn"),
      baseballRecord: document.getElementById("baseballRecord"),
      dailyTicketBadge: document.getElementById("dailyTicketBadge"),
      dailyTierStoneBadge: document.getElementById("dailyTierStoneBadge"),
      dailyResetBtn: document.getElementById("dailyResetBtn"),
      dailyTheme: document.getElementById("dailyTheme"),
      dailyGrid: document.getElementById("dailyGrid"),
      dailyRunPanel: document.getElementById("dailyRunPanel"),
      dailyRunStatus: document.getElementById("dailyRunStatus"),
      dailyRunProgress: document.getElementById("dailyRunProgress"),
      dailyRunLog: document.getElementById("dailyRunLog"),
      dailyHistory: document.getElementById("dailyHistory"),
      dailyBossNavMark: document.getElementById("dailyBossNavMark"),
      dailyBossNavBadge: document.getElementById("dailyBossNavBadge"),
      dailyBossCard: document.getElementById("dailyBossCard"),
      dailyBossDifficultyGrid: document.getElementById("dailyBossDifficultyGrid"),
      dailyBossHistory: document.getElementById("dailyBossHistory"),
      abyssFloorBadge: document.getElementById("abyssFloorBadge"),
      abyssBestBadge: document.getElementById("abyssBestBadge"),
      abyssSummary: document.getElementById("abyssSummary"),
      abyssBattleCard: document.getElementById("abyssBattleCard"),
      abyssStartBtn: document.getElementById("abyssStartBtn"),
      abyssFightBtn: document.getElementById("abyssFightBtn"),
      abyssRetreatBtn: document.getElementById("abyssRetreatBtn"),
      abyssHistory: document.getElementById("abyssHistory"),
      achievementNavMark: document.getElementById("achievementNavMark"),
      collectionCountBadge: document.getElementById("collectionCountBadge"),
      activeTitleBadge: document.getElementById("activeTitleBadge"),
      collectionBonusPanel: document.getElementById("collectionBonusPanel"),
      collectionRewardGrid: document.getElementById("collectionRewardGrid"),
      collectionGrid: document.getElementById("collectionGrid"),
      achievementGrid: document.getElementById("achievementGrid"),
      titleGrid: document.getElementById("titleGrid"),
      mercenaryActiveBadge: document.getElementById("mercenaryActiveBadge"),
      mercenarySummary: document.getElementById("mercenarySummary"),
      mercenaryGrid: document.getElementById("mercenaryGrid"),
      arenaNavCount: document.getElementById("arenaNavCount"),
      arenaRatingBadge: document.getElementById("arenaRatingBadge"),
      arenaRefreshBtn: document.getElementById("arenaRefreshBtn"),
      arenaSummary: document.getElementById("arenaSummary"),
      arenaGrid: document.getElementById("arenaGrid"),
      arenaLog: document.getElementById("arenaLog"),
      saveVaultHero: document.getElementById("saveVaultHero"),
      saveSlotGrid: document.getElementById("saveSlotGrid"),
      shareSaveBtn: document.getElementById("shareSaveBtn"),
      exportSaveBtn: document.getElementById("exportSaveBtn"),
      importSaveBtn: document.getElementById("importSaveBtn"),
      importSaveInput: document.getElementById("importSaveInput")
    };

    let activeInfoTab = "records";

    function loadState() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return defaultState();
        const loaded = JSON.parse(raw);
        const fresh = defaultState();
        const migratedInventory = Array.isArray(loaded.inventory)
          ? loaded.inventory
          : (loaded.lastLoot ? [loaded.lastLoot] : []);
        return {
          ...fresh,
          ...loaded,
          version:VERSION,
          attributes: { ...fresh.attributes, ...(loaded.attributes || {}) },
          skills: Object.fromEntries(
            Object.keys(fresh.skills).map(classId => [
              classId,
              { ...fresh.skills[classId], ...((loaded.skills && loaded.skills[classId]) || {}) }
            ])
          ),
          skillPoints: Number.isFinite(loaded.skillPoints) ? loaded.skillPoints : 0,
          skillBooks: Array.isArray(loaded.skillBooks) ? loaded.skillBooks : [],
          lastSkillBook: loaded.lastSkillBook || null,
          guide: { claimed:{ ...fresh.guide.claimed, ...((loaded.guide && loaded.guide.claimed) || {}) } },
          mastery: { ...fresh.mastery, ...(loaded.mastery || {}) },
          heat: { ...fresh.heat, ...(loaded.heat || {}) },
          zonesVisited: { ...fresh.zonesVisited, ...(loaded.zonesVisited || {}) },
          equipment: { ...fresh.equipment, ...(loaded.equipment || {}) },
          inventory: migratedInventory,
          mp: Number.isFinite(loaded.mp) ? loaded.mp : fresh.mp,
          consumables: { ...fresh.consumables, ...(loaded.consumables || {}) },
          fieldCare: { ...fresh.fieldCare, ...(loaded.fieldCare || {}) },
          autoProcess: { ...fresh.autoProcess, ...(loaded.autoProcess || {}) },
          affixEssences: Array.isArray(loaded.affixEssences) ? loaded.affixEssences : [],
          collection: {
            ...fresh.collection,
            ...(loaded.collection || {}),
            uniqueIds:{...fresh.collection.uniqueIds,...((loaded.collection && loaded.collection.uniqueIds) || {})},
            setPieces:{...fresh.collection.setPieces,...((loaded.collection && loaded.collection.setPieces) || {})},
            claimed:{...fresh.collection.claimed,...((loaded.collection && loaded.collection.claimed) || {})}
          },
          achievements: {
            ...fresh.achievements,
            ...(loaded.achievements || {}),
            claimed:{...fresh.achievements.claimed,...((loaded.achievements && loaded.achievements.claimed) || {})},
            titles:{...fresh.achievements.titles,...((loaded.achievements && loaded.achievements.titles) || {})}
          },
          mercenaries: {
            ...fresh.mercenaries,
            ...(loaded.mercenaries || {}),
            owned:{...fresh.mercenaries.owned,...((loaded.mercenaries && loaded.mercenaries.owned) || {})}
          },
          abyss:{...fresh.abyss,...(loaded.abyss || {}),history:[...((loaded.abyss && loaded.abyss.history) || [])]},
          dailyBoss:{...fresh.dailyBoss,...(loaded.dailyBoss || {}),history:[...((loaded.dailyBoss && loaded.dailyBoss.history) || [])]},
          gamble:{
            ...fresh.gamble,
            ...(loaded.gamble || {}),
            lastResult:(loaded.gamble && loaded.gamble.lastResult) || null,
            history:[...((loaded.gamble && loaded.gamble.history) || [])]
          },
          staminaGame: {
            ...fresh.staminaGame,
            ...(loaded.staminaGame || {}),
            ...(
              Number(loaded.version || 0) < 28 &&
              loaded.staminaGame?.date === localDateKey()
                ? {
                    tickets:Math.min(
                      BASEBALL_DAILY_REWARD_GAMES,
                      Math.max(0,Number(loaded.staminaGame?.tickets ?? 3))+2
                    ),
                    practice:false
                  }
                : {}
            ),
            history:[...((loaded.staminaGame && loaded.staminaGame.history) || [])]
          },
          pendingRecovery: loaded.pendingRecovery || null,
          codex: { ...fresh.codex, ...(loaded.codex || {}) },
          dust: Number.isFinite(loaded.dust) ? loaded.dust : 0,
          materials: { ...fresh.materials, ...(loaded.materials || {}) },
          attendance: { ...fresh.attendance, ...(loaded.attendance || {}) },
          fever: Number.isFinite(loaded.fever) ? loaded.fever : 0,
          feverBattles: Number.isFinite(loaded.feverBattles) ? loaded.feverBattles : 0,
          bounties: loaded.bounties && Array.isArray(loaded.bounties.missions) ? loaded.bounties : fresh.bounties,
          quests: { claimed:{ ...fresh.quests.claimed, ...((loaded.quests && loaded.quests.claimed) || {}) } },
          dailyDungeon: {
            ...fresh.dailyDungeon,
            ...(loaded.dailyDungeon || {}),
            history:[...((loaded.dailyDungeon && loaded.dailyDungeon.history) || [])],
            runLog:[...((loaded.dailyDungeon && loaded.dailyDungeon.runLog) || [])],
            running:false
          },
          arena: { ...fresh.arena, ...(loaded.arena || {}), opponents:[...((loaded.arena && loaded.arena.opponents) || [])], history:[...((loaded.arena && loaded.arena.history) || [])] },
          stamina: Number.isFinite(loaded.stamina) ? loaded.stamina : Math.min(STAMINA_MAX, Number.isFinite(loaded.focus) ? loaded.focus : STAMINA_MAX),
          staminaUpdatedAt: loaded.staminaUpdatedAt || loaded.focusUpdatedAt || Date.now(),
          market: { ...fresh.market, ...(loaded.market || {}), history: [...((loaded.market && loaded.market.history) || fresh.market.history)], ledger: [...((loaded.market && loaded.market.ledger) || [])] },
          records: { ...fresh.records, ...(loaded.records || {}) }
        };
      } catch (e) {
        return defaultState();
      }
    }

    function saveState() {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
        els.saveState.textContent = "방금 저장됨";
        setTimeout(() => els.saveState.textContent = "자동 저장", 1000);
      } catch (e) {
        els.saveState.textContent = "저장 불가";
      }
    }

    function cleanNickname(value) {
      return String(value || "")
        .replace(/[<>]/g,"")
        .replace(/\s+/g," ")
        .trim()
        .slice(0,12);
    }

    function nicknameIsValid(value) {
      const name = cleanNickname(value);
      return name.length >= 2 && name.length <= 12;
    }

    function showNicknameModal() {
      els.nicknameModalInput.value = state.nickname || "";
      els.nicknameError.textContent = "";
      els.nicknameModal.classList.remove("hidden");
      setTimeout(() => els.nicknameModalInput.focus(),50);
    }

    function confirmNickname() {
      const nickname = cleanNickname(els.nicknameModalInput.value);
      if (!nicknameIsValid(nickname)) {
        els.nicknameError.textContent = "닉네임은 공백을 제외하고 2~12자로 정해 주세요.";
        return;
      }
      state.nickname = nickname;
      els.nicknameModal.classList.add("hidden");
      log(`${nickname}, 잿빛 균열에 이름을 새겼다.`, "rarity-epic");
      saveState();
      renderAll();
      if (!state.classId) showClassModal();
    }

    function updateNickname() {
      const nickname = cleanNickname(els.nicknameEditInput.value);
      if (!nicknameIsValid(nickname)) return toast("닉네임은 2~12자로 정해 주세요.");
      const before = state.nickname || "무명의 사냥꾼";
      state.nickname = nickname;
      log(`${before}의 이름이 ${nickname}(으)로 다시 새겨졌다.`, "neutral");
      saveState();
      renderAll();
      toast("이름을 새겼습니다.");
    }

    function saveSlotKey(slot) {
      return `${SAVE_SLOT_PREFIX}${slot}`;
    }

    function saveSnapshot() {
      return {
        format:SAVE_EXPORT_FORMAT,
        version:VERSION,
        savedAt:new Date().toISOString(),
        state:JSON.parse(JSON.stringify(state))
      };
    }

    function readManualSlot(slot) {
      try {
        const raw = localStorage.getItem(saveSlotKey(slot));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && parsed.state ? parsed : null;
      } catch (error) {
        return null;
      }
    }

    function writeManualSlot(slot) {
      try {
        state.records.manualSaves = (state.records.manualSaves || 0)+1;
        const snapshot = saveSnapshot();
        localStorage.setItem(saveSlotKey(slot),JSON.stringify(snapshot));
        log(`기록 슬롯 ${slot}에 현재 여정을 새겼다.`, "neutral");
        toast(`슬롯 ${slot} 저장 완료`);
        saveState();
        renderAll();
      } catch (error) {
        toast("슬롯 저장에 실패했습니다.");
      }
    }

    function loadSnapshot(snapshot, sourceLabel="세이브") {
      if (!snapshot || snapshot.format !== SAVE_EXPORT_FORMAT || !snapshot.state) {
        throw new Error("올바른 잿빛 전리품 세이브가 아닙니다.");
      }
      if (autoTimer) toggleAuto();
      localStorage.setItem(SAVE_KEY,JSON.stringify(snapshot.state));
      state = loadState();
      isBusy = false;
      log(`${sourceLabel}에서 기록을 불러왔다.`, "rarity-epic");
      saveState();
      renderAll();
      if (!state.nickname) showNicknameModal();
      else if (!state.classId) showClassModal();
    }

    function loadManualSlot(slot) {
      const snapshot = readManualSlot(slot);
      if (!snapshot) return toast("비어 있는 슬롯입니다.");
      if (!confirm(`슬롯 ${slot}의 기록을 불러올까요? 현재 진행은 덮어씌워집니다.`)) return;
      try {
        loadSnapshot(snapshot,`슬롯 ${slot}`);
        toast(`슬롯 ${slot} 불러오기 완료`);
      } catch (error) {
        toast(error.message || "불러오기에 실패했습니다.");
      }
    }

    function deleteManualSlot(slot) {
      if (!readManualSlot(slot)) return;
      if (!confirm(`슬롯 ${slot}의 수동 저장을 지울까요?`)) return;
      localStorage.removeItem(saveSlotKey(slot));
      renderSaveVault();
      toast(`슬롯 ${slot} 삭제 완료`);
    }

    function saveTransferFilename() {
      const safeName = cleanNickname(state.nickname || "hunter")
        .replace(/\s+/g,"_")
        .replace(/[^0-9A-Za-z가-힣_-]/g,"");
      const date = new Date().toISOString().slice(0,10);
      return `ash_loot_${safeName || "hunter"}_${date}.json`;
    }

    function createSaveTransferFile() {
      saveState();
      const snapshot = saveSnapshot();
      const contents = JSON.stringify(snapshot,null,2);
      const filename = saveTransferFilename();
      const blob = new Blob([contents],{type:"application/json"});
      const file = typeof File === "function"
        ? new File([blob],filename,{type:"application/json",lastModified:Date.now()})
        : null;
      return {snapshot,contents,filename,blob,file};
    }

    function countSaveTransfer() {
      state.records.manualSaves = (state.records.manualSaves || 0)+1;
      saveState();
    }

    function downloadSaveTransferFile(transfer=createSaveTransferFile()) {
      const url = URL.createObjectURL(transfer.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = transfer.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      countSaveTransfer();
      setTimeout(() => URL.revokeObjectURL(url),1000);
      return transfer.filename;
    }

    function exportSaveFile() {
      downloadSaveTransferFile();
      toast("세이브 파일을 다운로드했습니다.");
    }

    async function shareSaveFile() {
      const transfer = createSaveTransferFile();
      const shareData = transfer.file
        ? {
            title:"잿빛 전리품 세이브",
            text:`${state.nickname || "무명의 사냥꾼"}의 세이브 파일입니다. 받은 기기에서 ‘세이브 파일 불러오기’를 눌러 주세요.`,
            files:[transfer.file]
          }
        : null;

      const fileSharingSupported = !!(
        shareData &&
        navigator.share &&
        (!navigator.canShare || navigator.canShare({files:shareData.files}))
      );

      if (fileSharingSupported) {
        try {
          await navigator.share(shareData);
          countSaveTransfer();
          toast("공유가 완료되었습니다.");
          return;
        } catch (error) {
          if (error && error.name === "AbortError") {
            toast("공유를 취소했습니다.");
            return;
          }
        }
      }

      downloadSaveTransferFile(transfer);
      toast("공유 기능이 없어 파일을 다운로드했습니다. 카카오톡에 첨부해 주세요.");
    }

    function importSaveFile(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const snapshot = JSON.parse(String(reader.result || ""));
          if (!confirm("이 세이브 파일을 불러올까요? 현재 진행은 덮어씌워집니다.")) return;
          loadSnapshot(snapshot,"세이브 파일");
          toast("세이브 파일을 불러왔습니다.");
        } catch (error) {
          toast(error.message || "세이브 파일을 읽지 못했습니다.");
        } finally {
          els.importSaveInput.value = "";
        }
      };
      reader.onerror = () => toast("세이브 파일을 읽지 못했습니다.");
      reader.readAsText(file,"utf-8");
    }

    function renderSaveVault() {
      els.saveVaultHero.textContent = `${state.nickname || "무명의 사냥꾼"} · Lv.${state.level}`;
      els.saveSlotGrid.innerHTML = [1,2,3].map(slot => {
        const snapshot = readManualSlot(slot);
        if (!snapshot) {
          return `
            <article class="save-slot-card">
              <div class="save-slot-number">RECORD SLOT ${slot}</div>
              <div class="save-slot-name">비어 있음</div>
              <div class="save-slot-meta">현재 여정을 이 슬롯에 수동으로 저장할 수 있다.</div>
              <div class="save-slot-actions">
                <button data-slot-save="${slot}">현재 기록 저장</button>
              </div>
            </article>`;
        }
        const saved = snapshot.state || {};
        const date = snapshot.savedAt ? new Date(snapshot.savedAt).toLocaleString("ko-KR") : "시간 불명";
        const cls = classes[saved.classId]?.name || "직업 미선택";
        return `
          <article class="save-slot-card has-save">
            <div class="save-slot-number">RECORD SLOT ${slot}</div>
            <div class="save-slot-name">${cleanNickname(saved.nickname) || "무명의 사냥꾼"}</div>
            <div class="save-slot-meta">
              Lv.${fmt(saved.level || 1)} · ${cls}<br>
              전투력 ${fmt(snapshotPower(saved))}<br>
              저장 시각 ${date}
            </div>
            <div class="save-slot-actions">
              <button data-slot-save="${slot}">덮어쓰기</button>
              <button data-slot-load="${slot}">불러오기</button>
              <button class="danger-slot" data-slot-delete="${slot}">삭제</button>
            </div>
          </article>`;
      }).join("");

      els.saveSlotGrid.querySelectorAll("[data-slot-save]").forEach(btn => btn.onclick = () => writeManualSlot(btn.dataset.slotSave));
      els.saveSlotGrid.querySelectorAll("[data-slot-load]").forEach(btn => btn.onclick = () => loadManualSlot(btn.dataset.slotLoad));
      els.saveSlotGrid.querySelectorAll("[data-slot-delete]").forEach(btn => btn.onclick = () => deleteManualSlot(btn.dataset.slotDelete));
    }

    function snapshotPower(saved) {
      if (!saved || typeof saved !== "object") return 0;
      const equipmentScore = Object.values(saved.equipment || {}).reduce((sum,item) => sum + Number(item?.score || 0),0);
      return Math.max(0,Math.round((saved.level || 1)*18 + equipmentScore*.55));
    }

    function zone() { return zones.find(z => z.id === state.currentZone); }
    function xpNeeded() { return Math.floor(180 * Math.pow(state.level, 1.55)); }

    function currentClass() { return state.classId ? classes[state.classId] : null; }

    function itemKind(item) {
      return item?.itemKind || (item?.rarity === "set" ? "set" : item?.rarity === "unique" ? "unique" : "normal");
    }

    function itemKindClass(item) {
      return `kind-${itemKind(item)}`;
    }

    function equippedSetCounts() {
      const counts = {};
      Object.values(state.equipment).forEach(item => {
        if (!item?.setId) return;
        counts[item.setId] = (counts[item.setId] || 0) + 1;
      });
      return counts;
    }

    function activeSetBonuses() {
      const counts = equippedSetCounts();
      const active = [];
      Object.entries(counts).forEach(([setId,count]) => {
        const set = setCatalog[setId];
        if (!set) return;
        set.bonuses.forEach(bonus => {
          if (count >= bonus.pieces) active.push({setId,count,...bonus});
        });
      });
      return active;
    }

    function equippedSkillBonus(classId, skillId) {
      let bonus = 0;
      Object.values(state.equipment).forEach(item => {
        if (!item) return;
        bonus += Number(item.skillBoosts?.[skillId] || 0);
        bonus += Number(item.uniquePowers?.allSkillLevels || 0);
      });
      activeSetBonuses().forEach(bonusDef => {
        bonus += Number(bonusDef.powers?.allSkillLevels || 0);
      });
      return bonus;
    }

    function baseSkillLevel(classId, skillId) {
      return Math.max(1, Number(state.skills?.[classId]?.[skillId] || 1));
    }

    function skillNameById(skillId) {
      for (const skills of Object.values(skillCatalog)) {
        const found = skills.find(skill => skill.id === skillId);
        if (found) return found.name;
      }
      return skillId;
    }

    function aggregateSpecialPowers() {
      const result = {};
      const add = (key,value) => {
        if (typeof value !== "number") return;
        result[key] = (result[key] || 0) + value;
      };
      Object.values(state.equipment).forEach(item => {
        Object.entries(item?.uniquePowers || {}).forEach(([key,value]) => add(key,value));
      });
      activeSetBonuses().forEach(bonus => {
        Object.entries(bonus.powers || {}).forEach(([key,value]) => add(key,value));
      });
      return result;
    }

    function equippedSetText() {
      const counts = equippedSetCounts();
      const lines = Object.entries(counts)
        .map(([id,count]) => `${setCatalog[id]?.name || id} ${count}/4`)
        .filter(Boolean);
      return lines.length ? lines.join(" · ") : "활성 세트 없음";
    }

    function totalAttributes() {
      const a = { ...state.attributes };
      Object.values(state.equipment).forEach(item => {
        if (!item) return;
        Object.keys(attributeInfo).forEach(k => a[k] += item.stats[k] || 0);
      });
      return a;
    }

    function baseStats() {
      const a = totalAttributes();
      const cls = currentClass();
      const mastery = cls ? (state.mastery[state.classId] || 0) : 0;
      const masteryMult = 1 + Math.min(.25, mastery * .001);
      const mainValue = cls ? a[cls.main] : 0;
      const mainBonus = 1 + mainValue * .006;

      const s = {
        ...a,
        maxHp: 55 + state.level * 7 + a.vit * 8 + a.spi * 2,
        maxMp: 24 + state.level * 3 + a.int * 5.4 + a.spi * 4.2,
        attack: 3 + state.level * 1.45 + a.str * 1.48 + a.int * .16 + a.spd * .28,
        magicPower: 2 + state.level * 1.35 + a.int * 1.58 + a.spi * .56,
        defense: 1 + state.level * .65 + a.vit * .62 + a.spi * .78,
        crit: 2.5 + a.luck * .33 + a.spd * .09,
        critDamage: 1.70,
        goldFind: a.luck * .12,
        mapFind: a.spd * .018,
        itemFind: a.luck * .11,
        doubleHit: Math.min(.20, a.spd * .0025),
        dodge: Math.min(.15, a.spd * .0016),
        firstStrike:0, spellBurst:0, emergencyHeal:0, postHeal:0, counter:0, eliteDamage:0,
        stableDamage:false,
        skillDamageBonus:0, skillManaReduction:0, skillEveryReduction:0, skillEcho:0,
        damageReduction:0, lowHpDamageReduction:0, lowHpDamageBonus:0,
        executeThreshold:0, reviveRate:0, firstSkillDamage:0, manaOnSkill:0,
        emergencyManaRate:0, extraDropChance:0,
        companionHealEvery:0, companionHealRate:0,
        companionStrikeEvery:0, companionStrikeRate:0
      };

      if (cls) {
        if (classCombatText[state.classId]?.damageType === "magic") s.magicPower *= mainBonus * masteryMult;
        else s.attack *= mainBonus * masteryMult;
        s.crit += cls.crit || 0;
        s.critDamage += cls.critDamage || 0;
        s.firstStrike += cls.firstStrike || 0;
        s.spellBurst += cls.spellBurst || 0;
        s.emergencyHeal += cls.emergencyHeal || 0;
        s.postHeal += cls.postHeal || 0;
        s.counter += cls.counter || 0;
        s.eliteDamage += cls.eliteDamage || 0;
        s.doubleHit += cls.doubleHit || 0;
        s.dodge += cls.dodge || 0;
        s.mapFind += cls.mapFind || 0;
        s.itemFind += cls.itemFind || 0;
        s.stableDamage = !!cls.stableDamage;
        s.maxHp *= 1 + (cls.hpMult || 0);
        s.defense *= 1 + (cls.defenseMult || 0);
      }

      Object.values(state.equipment).forEach(item => {
        if (!item) return;
        s.maxHp += item.stats.maxHp || 0;
        s.maxMp += item.stats.maxMp || 0;
        s.attack += item.stats.attack || 0;
        s.magicPower += item.stats.magicPower || 0;
        s.defense += item.stats.defense || 0;
        s.crit += item.stats.crit || 0;
        s.goldFind += item.stats.goldFind || 0;
        s.mapFind += item.stats.mapFind || 0;
        s.itemFind += item.stats.itemFind || 0;
        s.dodge += item.stats.dodge || 0;
        s.doubleHit += item.stats.doubleHit || 0;
      });

      activeSetBonuses().forEach(bonus => {
        const stats = bonus.stats || {};
        s.maxHp *= 1 + (stats.maxHpMult || 0);
        s.maxMp *= 1 + (stats.maxMpMult || 0);
        s.attack *= 1 + (stats.attackMult || 0);
        s.magicPower *= 1 + (stats.magicPowerMult || 0);
        s.defense *= 1 + (stats.defenseMult || 0);
        s.crit += stats.crit || 0;
        s.itemFind += stats.itemFind || 0;
        s.mapFind += stats.mapFind || 0;
      });

      const specialPowers = aggregateSpecialPowers();
      Object.entries(specialPowers).forEach(([key,value]) => {
        if (key in s && typeof s[key] === "number") s[key] += value;
      });

      applyMetaProgressionStats(s);

      s.maxHp = Math.round(s.maxHp);
      s.maxMp = Math.round(s.maxMp);
      s.attack = +s.attack.toFixed(1);
      s.magicPower = +s.magicPower.toFixed(1);
      s.defense = +s.defense.toFixed(1);
      s.crit = Math.min(70, s.crit);
      s.doubleHit = Math.min(.55, s.doubleHit);
      s.dodge = Math.min(.35, s.dodge);
      return s;
    }

    function totalStats() { return baseStats(); }

    function powerOfStats(s) {
      return Math.floor(
        (s.attack || 0) * 4.0 + (s.magicPower || 0) * 4.0 + (s.defense || 0) * 2.5 + (s.maxHp || 0) * .34 + (s.maxMp || 0) * .30 +
        (s.crit || 0) * 4 + (s.goldFind || 0) + (s.mapFind || 0) * 3 + (s.itemFind || 0) * 2 +
        (s.str || 0) * 5.5 + (s.vit || 0) * 5.5 + (s.int || 0) * 5.5 +
        (s.spi || 0) * 5.5 + (s.luck || 0) * 5.5 + (s.spd || 0) * 5.5 +
        (s.doubleHit || 0) * 280 + (s.dodge || 0) * 220 + (s.postHeal || 0) * 150 +
        (s.skillDamageBonus || 0) * 420 + (s.damageReduction || 0) * 520 +
        (s.executeThreshold || 0) * 380 + (s.reviveRate || 0) * 420 +
        (s.companionHealRate || 0) * 360 + (s.companionStrikeRate || 0) * 180
      );
    }

    function power() { return powerOfStats(totalStats()); }

    function recoverOffline() {
      const now = Date.now();
      const staminaTicks = Math.floor((now - state.staminaUpdatedAt) / STAMINA_RECOVERY_MS);
      if (staminaTicks > 0) {
        state.stamina = Math.min(STAMINA_MAX, state.stamina + staminaTicks);
        state.staminaUpdatedAt += staminaTicks * STAMINA_RECOVERY_MS;
        if (state.stamina >= STAMINA_MAX) state.staminaUpdatedAt = now;
      }

      const heatMinutes = Math.floor((now - state.heatUpdatedAt) / 60000);
      if (heatMinutes > 0) {
        Object.keys(state.heat).forEach(k => state.heat[k] = Math.max(0, state.heat[k] - heatMinutes));
        state.heatUpdatedAt += heatMinutes * 60000;
      }

      const s = totalStats();
      state.hp = Math.min(s.maxHp, state.hp);
      state.mp = Math.min(s.maxMp, state.mp);
    }

    function staminaCost(inRareMap=false) { return inRareMap ? 3 : 1; }

    function staminaRecoveryLabel() {
      if (state.stamina >= STAMINA_MAX) return "가득 참";
      const elapsed = Date.now() - state.staminaUpdatedAt;
      const remain = Math.max(0, STAMINA_RECOVERY_MS - (elapsed % STAMINA_RECOVERY_MS));
      const minutes = Math.floor(remain / 60000);
      const seconds = Math.floor((remain % 60000) / 1000);
      return `다음 +1 ${minutes}:${String(seconds).padStart(2,"0")}`;
    }

    function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
    function fmt(n) { return Math.floor(n).toLocaleString("ko-KR"); }

    function fmtStamina(n) {
      const value = Math.round((Number(n) || 0)*10)/10;
      return Number.isInteger(value)
        ? value.toLocaleString("ko-KR")
        : value.toLocaleString("ko-KR",{minimumFractionDigits:1,maximumFractionDigits:1});
    }

    function chooseRarity(bonus=0) {
      const adjusted = rarityTable.map((r, i) => ({
        ...r,
        weight: i === 0 ? Math.max(30, r.weight - bonus * 1.9) : r.weight + bonus * (i * .34)
      }));
      const total = adjusted.reduce((sum, r) => sum + r.weight, 0);
      let roll = Math.random() * total;
      for (const r of adjusted) {
        roll -= r.weight;
        if (roll <= 0) return r;
      }
      return adjusted[0];
    }

    function addItemStat(stats, key, value) {
      const decimal = ["crit","goldFind","mapFind","itemFind"].includes(key);
      stats[key] = decimal
        ? +((stats[key] || 0) + value).toFixed(1)
        : (stats[key] || 0) + Math.round(value);
    }

    function affixDefinition(kind, stat, familyId=null) {
      const pool = kind === "suffix" ? suffixDefs : prefixDefs;
      return pool.find(def => def.id === familyId) || pool.find(def => def.stat === stat) || null;
    }

    function affixBandForValue(def, value) {
      const bands = affixBandTables[def?.band || (def?.percent ? "percent" : "attribute")] || affixBandTables.attribute;
      let index = bands.findIndex(band => value >= band.min && value <= band.max);
      if (index < 0) index = value < bands[0].min ? 0 : bands.length - 1;
      const band = bands[index];
      const tierName = def?.tierNames?.[index] || def?.tierNames?.at(-1) || def?.label || "각인";
      return { index, min:band.min, max:band.max, name:tierName };
    }

    function applyAffixTierMetadata(affix) {
      const def = affixDefinition(affix.kind,affix.stat,affix.familyId);
      if (!def) return affix;
      const tier = affixBandForValue(def,Number(affix.value || 0));
      affix.familyId = def.id;
      affix.name = tier.name;
      affix.tierIndex = tier.index;
      affix.rangeMin = tier.min;
      affix.rangeMax = tier.max;
      affix.tierLabel = `${tier.min}${affix.percent ? "%" : ""}~${tier.max >= 9999 ? "∞" : tier.max}${affix.percent ? "%" : ""}`;
      return affix;
    }

    function normalizeItemAffixes(item) {
      if (!item || itemKind(item) !== "normal" || !Array.isArray(item.affixes)) return item;
      item.affixes.forEach(applyAffixTierMetadata);
      return item;
    }

    function strongestAffix(item,kind) {
      return [...(item.affixes || [])]
        .filter(affix => affix.kind === kind)
        .map(affix => applyAffixTierMetadata(affix))
        .sort((a,b) => (b.tierIndex || 0)-(a.tierIndex || 0) || Number(b.value || 0)-Number(a.value || 0))[0] || null;
    }

    function rebuildStandardItemName(item) {
      if (!item || itemKind(item) !== "normal" || !item.baseItemName) return;
      const prefix = strongestAffix(item,"prefix");
      const suffix = strongestAffix(item,"suffix");
      item.name = `${prefix ? prefix.name+" " : ""}${item.baseItemName}${suffix ? " · "+suffix.name : ""}`;
    }

    function normalAffixCapacityText(item) {
      if (itemKind(item) !== "normal") return "";
      const prefixes = (item.affixes || []).filter(affix => affix.kind === "prefix").length;
      const suffixes = (item.affixes || []).filter(affix => affix.kind === "suffix").length;
      return `접두 ${prefixes}/${item.prefixCapacity ?? prefixes} · 접미 ${suffixes}/${item.suffixCapacity ?? suffixes}`;
    }

    function rollAffix(def, base, rarity, kind) {
      const tierBonus = kind === "suffix" ? .92 : 1;
      const quality = .82 + Math.random() * .36;
      let value = def.factor * base * Math.sqrt(rarity.mult) * tierBonus * quality;
      if (def.percent) value = Math.max(.1,+value.toFixed(1));
      else value = Math.max(1,Math.round(value));
      const affix = {
        kind,
        familyId:def.id,
        name:"",
        stat:def.stat,
        label:def.label,
        value,
        baseValue:value,
        percent:!!def.percent
      };
      return applyAffixTierMetadata(affix);
    }

    function affixPool(defs, slot) {
      return defs.filter(def => !def.slots || def.slots.includes(slot));
    }

    function scaledSpecialStats(factors, base) {
      const stats = {};
      const percentageKeys = new Set(["crit","itemFind","mapFind","dodge","doubleHit"]);
      Object.entries(factors || {}).forEach(([key,factor]) => {
        const quality = .90 + Math.random() * .20;
        if (percentageKeys.has(key)) {
          stats[key] = +(Math.max(.1, factor * Math.sqrt(base) * quality)).toFixed(2);
        } else {
          stats[key] = Math.max(1, Math.round(factor * base * quality));
        }
      });
      return stats;
    }

    function itemScoreFromStats(stats, specialScore=0) {
      return powerOfStats({
        maxHp:stats.maxHp || 0, maxMp:stats.maxMp || 0,
        attack:stats.attack || 0, magicPower:stats.magicPower || 0,
        defense:stats.defense || 0, crit:stats.crit || 0,
        goldFind:stats.goldFind || 0, mapFind:stats.mapFind || 0,
        itemFind:stats.itemFind || 0, dodge:stats.dodge || 0,
        doubleHit:stats.doubleHit || 0,
        str:stats.str || 0, vit:stats.vit || 0, int:stats.int || 0,
        spi:stats.spi || 0, luck:stats.luck || 0, spd:stats.spd || 0
      }) + Math.round(specialScore);
    }

    function generateSetItem(base,slot) {
      const classPreferred = state.classId === "arcanist" || state.classId === "oracle"
        ? "astral"
        : state.classId === "marksman" || state.classId === "shadow"
          ? "bloodhunt"
          : "ashwarden";

      const setEntry = weightedChoice(Object.entries(setCatalog).map(([id,set]) => ({
        value:{id,set},
        weight:(id === classPreferred ? 1.8 : 1)*(id === "ragmerchant" ? 1.8 : 1)
      })));
      const setId = setEntry.id;
      const set = setEntry.set;
      const piece = set.pieces[slot];
      const quality = rollSpecialQuality();
      const pieceSpecial = setPieceSpecialCatalog[setId]?.[slot] || {label:"",powers:{}};
      const uniquePowers = scaleSpecialPowers(pieceSpecial.powers,quality);
      const skillBoosts = scaleSkillBoosts(pieceSpecial.skillBoosts,quality);
      const stats = scaledSpecialStats(piece.factors,base*1.72*quality.statMult);
      const verdict = specialVerdict(setBaseValueTier(setId),quality);
      const score = itemScoreFromStats(stats,base*38+specialPowerScore(uniquePowers,skillBoosts));

      return {
        id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()),
        slot,
        name:piece.name,
        rarity:"set",
        rarityName:"세트",
        rarityClass:"rarity-set",
        raritySell:12,
        itemKind:"set",
        setId,
        setName:set.name,
        lore:set.lore,
        intrinsic:{...stats},
        affixes:[],
        stats,
        skillBoosts,
        uniquePowers,
        uniquePowerLabel:pieceSpecial.label,
        specialQuality:{...quality},
        specialVerdict:{...verdict},
        specialBaseTier:setBaseValueTier(setId),
        score,
        sellPrice:Math.max(40,Math.round(score*.72*12))
      };
    }

    function generateUniqueItem(base,slot) {
      let pool = uniqueCatalog.filter(item => item.slot === slot);
      const weightedPool = pool.map(template => {
        const preferred = !template.classIds || template.classIds.includes(state.classId);
        const baseWeight = Number(template.dropWeight || (uniqueBaseValueTier(template) === "jackpot" ? .72 : 1));
        return {value:template,weight:baseWeight*(preferred ? 1.65 : .72)};
      });
      const template = weightedChoice(weightedPool) || randomChoice(pool);
      const quality = rollSpecialQuality();
      const uniquePowers = scaleSpecialPowers(template.powers,quality);
      const skillBoosts = scaleSkillBoosts(template.skillBoosts,quality);
      const stats = scaledSpecialStats(template.factors,base*1.95*quality.statMult);
      const verdict = specialVerdict(uniqueBaseValueTier(template),quality);
      const score = itemScoreFromStats(stats,base*74+specialPowerScore(uniquePowers,skillBoosts));

      return {
        id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()),
        slot,
        name:template.name,
        rarity:"unique",
        rarityName:"유니크",
        rarityClass:"rarity-unique",
        raritySell:30,
        itemKind:"unique",
        uniqueId:template.id,
        lore:template.lore,
        intrinsic:{...stats},
        affixes:[],
        stats,
        skillBoosts,
        uniquePowerLabel:template.powerLabel,
        uniquePowers,
        specialQuality:{...quality},
        specialVerdict:{...verdict},
        specialBaseTier:uniqueBaseValueTier(template),
        score,
        sellPrice:Math.max(100,Math.round(score*.84*30))
      };
    }

    function shuffledCopy(list) {
      const copy = [...list];
      for (let i=copy.length-1;i>0;i--) {
        const j = Math.floor(Math.random()*(i+1));
        [copy[i],copy[j]] = [copy[j],copy[i]];
      }
      return copy;
    }

    function generateStandardItem(zoneMult,rareMapBonus=0,forcedSlot=null,forcedRarityKey=null) {
      const slot = forcedSlot || randomChoice(slots).key;
      const intrinsic = {};
      const playerFactor = 1+(state.level-1)*.08;
      const base = playerFactor*zoneMult*(.85+Math.random()*.32);
      const rarity = forcedRarityKey
        ? (rarityTable.find(entry => entry.key === forcedRarityKey) || chooseRarity(rareMapBonus+totalStats().itemFind/18))
        : chooseRarity(rareMapBonus+totalStats().itemFind/18);

      if (slot === "weapon") intrinsic.attack = Math.max(2,Math.round(5.5*base*rarity.mult));
      if (slot === "armor") {
        intrinsic.defense = Math.max(1,Math.round(3.2*base*rarity.mult));
        intrinsic.maxHp = Math.max(4,Math.round(8*base*rarity.mult));
      }
      if (slot === "ring") {
        intrinsic.attack = Math.max(1,Math.round(1.55*base*rarity.mult));
        intrinsic.magicPower = Math.max(1,Math.round(1.55*base*rarity.mult));
        intrinsic.crit = +(.8*rarity.mult+Math.random()*1.2).toFixed(1);
      }
      if (slot === "amulet") {
        intrinsic.maxHp = Math.max(3,Math.round(5.5*base*rarity.mult));
        intrinsic.defense = Math.max(1,Math.round(1.2*base*rarity.mult));
      }

      const stats = {...intrinsic};
      const affixes = [];
      const prefixDefsForItem = shuffledCopy(affixPool(prefixDefs,slot)).slice(0,rarity.prefixCount);
      const suffixDefsForItem = shuffledCopy(affixPool(suffixDefs,slot)).slice(0,rarity.suffixCount);

      prefixDefsForItem.forEach(def => {
        const affix = rollAffix(def,base,rarity,"prefix");
        affixes.push(affix);
        addItemStat(stats,affix.stat,affix.value);
      });
      suffixDefsForItem.forEach(def => {
        const affix = rollAffix(def,base,rarity,"suffix");
        affixes.push(affix);
        addItemStat(stats,affix.stat,affix.value);
      });

      if (rarity.key === "epic" || rarity.key === "legendary") {
        const bonusRate = rarity.key === "legendary" ? .24 : .12;
        affixes.forEach(affix => {
          const bonus = affix.percent
            ? +(affix.value*bonusRate).toFixed(1)
            : Math.max(1,Math.round(affix.value*bonusRate));
          affix.value = affix.percent ? +(affix.value+bonus).toFixed(1) : affix.value+bonus;
          affix.baseValue = affix.value;
          applyAffixTierMetadata(affix);
          addItemStat(stats,affix.stat,bonus);
        });
      }

      const rawName = randomChoice(itemNames[slot]);
      const score = itemScoreFromStats(stats);
      const item = {
        id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()),
        slot,
        name:rawName,
        baseItemName:rawName,
        rarity:rarity.key,
        rarityName:rarity.name,
        rarityClass:rarity.className,
        raritySell:rarity.sell,
        itemKind:"normal",
        prefixCapacity:rarity.prefixCount,
        suffixCapacity:rarity.suffixCount,
        intrinsic,
        affixes,
        stats,
        score,
        sellPrice:Math.max(5,Math.round(score*.48*rarity.sell))
      };
      rebuildStandardItemName(item);
      return item;
    }

    function generateItem(zoneMult, rareMapBonus=0) {
      const slot = randomChoice(slots).key;
      const playerFactor = 1 + (state.level - 1) * .08;
      const base = playerFactor * zoneMult * (0.88 + Math.random() * .25);
      const developerMult = 1;
      const specialFind = Math.min(.012, (totalStats().itemFind || 0) * .00003);
      const uniqueChance = (.003 + rareMapBonus * .00055 + specialFind * .22) * developerMult;
      const setChance = (.018 + rareMapBonus * .0012 + specialFind) * developerMult;
      const roll = Math.random();

      if (roll < Math.min(.18,uniqueChance)) return generateUniqueItem(base,slot);
      if (roll < Math.min(.42,uniqueChance+setChance)) return generateSetItem(base,slot);
      return generateStandardItem(zoneMult,rareMapBonus,slot);
    }

    function itemStatLines(item) {
      const labels = {
        attack:"공격력",
        magicPower:"마법력",
        defense:"방어력",
        maxHp:"최대 체력",
        maxMp:"최대 마나",
        crit:"치명타 확률",
        goldFind:"골드 획득량",
        mapFind:"희귀 지도 발견",
        itemFind:"장비 발견",
        dodge:"회피",
        doubleHit:"연속 공격",
        str:"힘", vit:"생명", int:"지능", spi:"정신", luck:"행운", spd:"속도"
      };
      const percentStats = ["crit","goldFind","mapFind","itemFind","dodge","doubleHit"];

      if (Array.isArray(item.affixes) && item.affixes.length) {
        const rows = [];
        Object.entries(item.intrinsic || {}).filter(([,v]) => v).forEach(([k,v]) => {
          rows.push(`<span class="affix-source">기본</span>${labels[k] || k} +${v}${percentStats.includes(k) ? "%" : ""}`);
        });
        item.affixes.forEach(affix => {
          applyAffixTierMetadata(affix);
          rows.push(`<span class="affix-source">${affix.kind === "prefix" ? "접두사" : "접미사"}</span>[${affix.name}] ${affix.label} +${affix.value}${affix.percent ? "%" : ""}<span class="affix-tier-tag">${affix.tierLabel}</span>`);
        });
        return rows;
      }

      // 이전 버전에서 저장된 장비 호환
      return Object.entries(item.stats || {}).filter(([,v]) => v).map(([k,v]) =>
        `${labels[k] || k} +${v}${percentStats.includes(k) ? "%" : ""}`
      );
    }


    function specialItemLines(item) {
      const lines = [];
      const kind = itemKind(item);

      if (kind === "unique" || kind === "set") {
        const quality = item.specialQuality || specialQualityTable[2];
        const verdict = item.specialVerdict || specialVerdict(item.specialBaseTier || "solid",quality);
        lines.push(`
          <div class="special-appraisal">
            <span class="special-quality-badge ${quality.className || "quality-intact"}">완성도 · ${quality.short || quality.name || "온전"}</span>
            <span class="special-verdict-badge ${verdict.className || "verdict-solid"}">감정 · ${verdict.name || "준수"}</span>
          </div>
          <div class="special-output">기본 능력 ${Math.round((quality.statMult || 1)*100)}% · 고유 효과 출력 ${Math.round((quality.powerMult || 1)*100)}%</div>
        `);
      }

      if (kind === "unique") {
        if (item.lore) lines.push(`<div class="unique-lore">“${item.lore}”</div>`);
        if (item.uniquePowerLabel) lines.push(`<div class="unique-power"><strong>유니크 전용 효과</strong><br>${item.uniquePowerLabel}</div>`);
        const boosts = Object.entries(item.skillBoosts || {});
        if (boosts.length) {
          lines.push(`<div class="set-piece-line">기술 레벨 · ${boosts.map(([id,value]) => `${skillNameById(id)} +${value}`).join(" · ")}</div>`);
        }
      }

      if (kind === "set") {
        const count = equippedSetCounts()[item.setId] || 0;
        const set = setCatalog[item.setId];
        lines.push(`<div class="unique-lore">“${item.lore || set?.lore || ""}”</div>`);
        if (item.uniquePowerLabel) {
          lines.push(`<div class="special-piece-power"><strong>세트 부위 전용 효과</strong><br>${item.uniquePowerLabel}</div>`);
        }
        const boosts = Object.entries(item.skillBoosts || {});
        if (boosts.length) {
          lines.push(`<div class="set-piece-line">기술 레벨 · ${boosts.map(([id,value]) => `${skillNameById(id)} +${value}`).join(" · ")}</div>`);
        }
        lines.push(`<div class="set-piece-line"><strong>${item.setName}</strong> · 현재 ${count}/4부위 장착</div>`);
        (set?.bonuses || []).forEach(bonus => {
          lines.push(`<div class="${count >= bonus.pieces ? "set-bonus-active" : "set-bonus-inactive"}">${bonus.label}</div>`);
        });
      }

      return lines.join("");
    }


    function synchronizeExpansionState() {
      state.autoProcess = {...defaultState().autoProcess,...(state.autoProcess || {})};
      state.affixEssences = Array.isArray(state.affixEssences) ? state.affixEssences : [];
      state.collection = state.collection || {uniqueIds:{},setPieces:{},claimed:{}};
      state.collection.uniqueIds = state.collection.uniqueIds || {};
      state.collection.setPieces = state.collection.setPieces || {};
      state.collection.claimed = state.collection.claimed || {};
      state.achievements = state.achievements || {claimed:{},titles:{},activeTitle:""};
      state.achievements.claimed = state.achievements.claimed || {};
      state.achievements.titles = state.achievements.titles || {};
      state.mercenaries = state.mercenaries || {owned:{},activeId:""};
      state.mercenaries.owned = state.mercenaries.owned || {};
      state.abyss = {...defaultState().abyss,...(state.abyss || {}),history:[...((state.abyss && state.abyss.history) || [])]};
      state.dailyBoss = {...defaultState().dailyBoss,...(state.dailyBoss || {}),history:[...((state.dailyBoss && state.dailyBoss.history) || [])]};
      [...state.inventory,...Object.values(state.equipment || {}).filter(Boolean)].forEach(item => {
        item.locked = !!item.locked;
        registerCollectionItem(item,false);
      });
      ensureDailyBoss();
      ensureAbyssWeek();
    }

    function registerCollectionItem(item,increment=true) {
      if (!item) return;
      if (itemKind(item) === "unique" && item.uniqueId) {
        const before = Number(state.collection.uniqueIds[item.uniqueId] || 0);
        state.collection.uniqueIds[item.uniqueId] = increment ? before+1 : Math.max(before,1);
      }
      if (itemKind(item) === "set" && item.setId && item.slot) {
        const key = `${item.setId}:${item.slot}`;
        const before = Number(state.collection.setPieces[key] || 0);
        state.collection.setPieces[key] = increment ? before+1 : Math.max(before,1);
      }
    }

    function collectionCount() {
      return Object.keys(state.collection.uniqueIds || {}).length+Object.keys(state.collection.setPieces || {}).length;
    }

    function collectionStats() {
      const total = collectionCount();
      const stats = {};
      collectionMilestones.forEach(milestone => {
        if (total < milestone.count) return;
        Object.entries(milestone.stats || {}).forEach(([key,value]) => stats[key]=(stats[key] || 0)+value);
      });
      return stats;
    }

    function titleStats() {
      const title = state.achievements.activeTitle;
      const achievement = achievementDefs.find(def => def.title === title);
      return achievement?.titleStats || {};
    }

    function activeMercenaryDefinition() {
      return mercenaryCatalog.find(mercenary => mercenary.id === state.mercenaries.activeId) || null;
    }

    function applyBonusStatsToSheet(s,bonus={}) {
      s.maxHp *= 1+(bonus.maxHpMult || 0);
      s.maxMp *= 1+(bonus.maxMpMult || 0);
      s.attack *= 1+(bonus.attackMult || 0);
      s.magicPower *= 1+(bonus.magicPowerMult || 0);
      s.defense *= 1+(bonus.defenseMult || 0);
      Object.entries(bonus).forEach(([key,value]) => {
        if (["maxHpMult","maxMpMult","attackMult","magicPowerMult","defenseMult"].includes(key)) return;
        if (key in s && typeof s[key] === "number") s[key] += Number(value || 0);
      });
    }

    function applyMetaProgressionStats(s) {
      applyBonusStatsToSheet(s,collectionStats());
      applyBonusStatsToSheet(s,titleStats());
      const mercenary = activeMercenaryDefinition();
      if (mercenary) applyBonusStatsToSheet(s,mercenary.stats);
    }

    function achievementMetric(metric) {
      if (metric === "collectionCount") return collectionCount();
      if (metric === "abyssBestFloor") return Math.max(state.abyss.bestFloor || 0,state.records.abyssBestFloor || 0);
      return Number(state.records[metric] || 0);
    }

    function grantSimpleReward(reward={}) {
      if (reward.gold) {
        state.gold += reward.gold;
        state.records.totalGold += reward.gold;
      }
      if (reward.dust) state.dust += reward.dust;
      if (reward.skill) state.skillPoints += reward.skill;
      if (reward.tierStone) state.materials.sameTierRunes += reward.tierStone;
    }

    function claimCollectionMilestone(count) {
      const milestone = collectionMilestones.find(entry => entry.count === Number(count));
      if (!milestone || collectionCount() < milestone.count || state.collection.claimed[milestone.count]) return;
      state.collection.claimed[milestone.count] = true;
      grantSimpleReward(milestone.reward);
      log(`수집 보상 · ${milestone.name} · ${rewardTextSimple(milestone.reward)}`, "rarity-set");
      saveState();
      renderAll();
    }

    function rewardTextSimple(reward={}) {
      return [
        reward.gold ? `골드 ${fmt(reward.gold)}` : "",
        reward.dust ? `별가루 ${fmt(reward.dust)}` : "",
        reward.skill ? `스킬 포인트 ${fmt(reward.skill)}` : "",
        reward.tierStone ? `동급 각인석 ${fmt(reward.tierStone)}` : ""
      ].filter(Boolean).join(" · ");
    }

    function claimAchievement(id) {
      const achievement = achievementDefs.find(def => def.id === id);
      if (!achievement || state.achievements.claimed[id]) return;
      if (achievementMetric(achievement.metric) < achievement.target) return toast("업적 조건을 아직 달성하지 못했습니다.");
      state.achievements.claimed[id] = true;
      state.achievements.titles[achievement.title] = true;
      state.records.achievementsClaimed = (state.records.achievementsClaimed || 0)+1;
      grantSimpleReward(achievement.reward);
      log(`업적 완료 · ${achievement.name} · 칭호 [${achievement.title}] 개방`, "rarity-legendary");
      toast(`칭호 획득 · ${achievement.title}`);
      saveState();
      renderAll();
    }

    function equipTitle(title) {
      if (title && !state.achievements.titles[title]) return;
      state.achievements.activeTitle = title || "";
      saveState();
      renderAll();
    }

    function renderCollectionHall() {
      const total = collectionCount();
      const readyAchievements = achievementDefs.filter(def => !state.achievements.claimed[def.id] && achievementMetric(def.metric) >= def.target).length;
      els.achievementNavMark.textContent = readyAchievements ? `(${readyAchievements})` : "";
      els.collectionCountBadge.textContent = `수집 ${total}종`;
      els.activeTitleBadge.textContent = state.achievements.activeTitle ? `칭호 · ${state.achievements.activeTitle}` : "칭호 없음";

      const bonuses = collectionStats();
      const bonusLines = [
        bonuses.maxHpMult ? `최대 체력 +${Math.round(bonuses.maxHpMult*100)}%` : "",
        bonuses.attackMult ? `공격·마법력 +${Math.round(bonuses.attackMult*100)}%` : "",
        bonuses.itemFind ? `장비 발견 +${bonuses.itemFind}%` : "",
        bonuses.damageReduction ? `받는 피해 -${Math.round(bonuses.damageReduction*100)}%` : ""
      ].filter(Boolean);
      els.collectionBonusPanel.innerHTML = `<h3>수집 능력치</h3><p>${bonusLines.length ? bonusLines.join(" · ") : "아직 활성화된 수집 능력치가 없다."}</p>`;

      els.collectionRewardGrid.innerHTML = collectionMilestones.map(milestone => {
        const reached = total >= milestone.count;
        const claimed = !!state.collection.claimed[milestone.count];
        return `<article class="collection-reward-card ${claimed ? "claimed" : ""}">
          <h3>${milestone.count}종 · ${milestone.name}</h3>
          <p>영구 능력치와 별도의 수집 보상</p>
          <div class="title-effect">${rewardTextSimple(milestone.reward)}</div>
          <button data-claim-collection="${milestone.count}" ${!reached || claimed ? "disabled" : ""}>${claimed ? "✓ 수령 완료" : reached ? "수집 보상 받기" : `${total}/${milestone.count}`}</button>
        </article>`;
      }).join("");

      const uniqueCards = uniqueCatalog.map(template => {
        const count = Number(state.collection.uniqueIds[template.id] || 0);
        return `<article class="collection-card ${count ? "" : "unknown"}">
          <strong>${count ? template.name : "알 수 없는 유니크"}</strong>
          <p>${count ? template.lore : "아직 발견하지 못했다."}</p>
          <div class="collection-progress">${count ? `발견 ${count}회` : "미발견"}</div>
        </article>`;
      });
      const setCards = Object.entries(setCatalog).flatMap(([setId,set]) => slots.map(slot => {
        const key = `${setId}:${slot.key}`;
        const count = Number(state.collection.setPieces[key] || 0);
        return `<article class="collection-card ${count ? "" : "unknown"}">
          <strong>${count ? set.pieces[slot.key].name : `${set.name} · ???`}</strong>
          <p>${count ? `${set.name} ${slot.label}` : "아직 발견하지 못했다."}</p>
          <div class="collection-progress">${count ? `발견 ${count}회` : "미발견"}</div>
        </article>`;
      }));
      els.collectionGrid.innerHTML = [...uniqueCards,...setCards].join("");

      els.achievementGrid.innerHTML = achievementDefs.map(def => {
        const progress = Math.min(def.target,achievementMetric(def.metric));
        const claimed = !!state.achievements.claimed[def.id];
        const ready = progress >= def.target;
        return `<article class="achievement-card ${claimed ? "claimed" : ""}">
          <div class="achievement-state ${claimed ? "done" : ready ? "ready" : ""}">${claimed ? "완료됨" : ready ? "보상 대기" : "진행 중"}</div>
          <h3>${def.name}</h3>
          <p>${def.desc} · ${fmt(progress)}/${fmt(def.target)}</p>
          <div class="title-effect">칭호 [${def.title}] · ${bonusDescription(def.titleStats)}</div>
          <button data-claim-achievement="${def.id}" ${!ready || claimed ? "disabled" : ""}>${claimed ? "✓ 완료됨" : ready ? "업적 보상 받기" : "진행 중"}</button>
        </article>`;
      }).join("");

      const unlockedTitles = achievementDefs.filter(def => state.achievements.titles[def.title]);
      els.titleGrid.innerHTML = `<article class="title-card ${!state.achievements.activeTitle ? "active" : ""}">
        <h3>칭호 없음</h3><p>기본 이름만 표시한다.</p><button data-equip-title="">${!state.achievements.activeTitle ? "장착 중" : "장착"}</button>
      </article>`+unlockedTitles.map(def => `<article class="title-card ${state.achievements.activeTitle === def.title ? "active" : ""}">
        <h3>${def.title}</h3><p>${def.name} 업적 칭호</p><div class="title-effect">${bonusDescription(def.titleStats)}</div>
        <button data-equip-title="${def.title}">${state.achievements.activeTitle === def.title ? "장착 중" : "장착"}</button>
      </article>`).join("");

      els.collectionRewardGrid.querySelectorAll("[data-claim-collection]").forEach(btn => btn.onclick = () => claimCollectionMilestone(btn.dataset.claimCollection));
      els.achievementGrid.querySelectorAll("[data-claim-achievement]").forEach(btn => btn.onclick = () => claimAchievement(btn.dataset.claimAchievement));
      els.titleGrid.querySelectorAll("[data-equip-title]").forEach(btn => btn.onclick = () => equipTitle(btn.dataset.equipTitle));
    }

    function bonusDescription(stats={}) {
      return Object.entries(stats).map(([key,value]) => {
        const names = {maxHpMult:"최대 체력",attackMult:"공격력",magicPowerMult:"마법력",itemFind:"장비 발견",mapFind:"지도 발견",skillDamageBonus:"기술 피해",eliteDamage:"정예 피해",goldFind:"골드 발견"};
        const percent = ["maxHpMult","attackMult","magicPowerMult","skillDamageBonus","eliteDamage"].includes(key);
        return `${names[key] || key} +${percent ? Math.round(value*100) : value}${percent || ["itemFind","mapFind","goldFind"].includes(key) ? "%" : ""}`;
      }).join(" · ");
    }

    function hireMercenary(id) {
      const mercenary = mercenaryCatalog.find(entry => entry.id === id);
      if (!mercenary || state.mercenaries.owned[id]) return;
      if (!mercenary.check()) return toast(`고용 조건: ${mercenary.condition}`);
      if (state.gold < mercenary.cost) return toast(`골드가 부족합니다. 필요 ${fmt(mercenary.cost)}G`);
      state.gold -= mercenary.cost;
      state.mercenaries.owned[id] = true;
      state.mercenaries.activeId = id;
      state.records.mercenariesHired = (state.records.mercenariesHired || 0)+1;
      log(`용병 고용 · ${mercenary.name} · ${fmt(mercenary.cost)}G`, "rarity-set");
      saveState();
      renderAll();
    }

    function activateMercenary(id) {
      if (id && !state.mercenaries.owned[id]) return;
      state.mercenaries.activeId = id || "";
      saveState();
      renderAll();
    }

    function renderMercenaries() {
      const active = activeMercenaryDefinition();
      els.mercenaryActiveBadge.textContent = active ? `동행 · ${active.name}` : "동행 용병 없음";
      els.mercenarySummary.innerHTML = active
        ? `<h3>${active.name}</h3><p>${active.role} 담당 · ${active.effect}</p>`
        : `<h3>빈 동행 자리</h3><p>용병을 고용하면 한 명을 선택해 일반 사냥·심연·일일 보스에 데려갈 수 있다.</p>`;

      els.mercenaryGrid.innerHTML = mercenaryCatalog.map(mercenary => {
        const owned = !!state.mercenaries.owned[mercenary.id];
        const activeNow = state.mercenaries.activeId === mercenary.id;
        const unlocked = mercenary.check();
        return `<article class="mercenary-card ${activeNow ? "active" : ""}">
          <div class="mercenary-state ${owned ? "owned" : ""}">${activeNow ? "동행 중" : owned ? "고용 완료" : unlocked ? "고용 가능" : "조건 미달"}</div>
          <h3>${mercenary.name}</h3>
          <p>${mercenary.role} · ${mercenary.condition}</p>
          <div class="mercenary-effect">${mercenary.effect}</div>
          ${owned
            ? `<button data-activate-mercenary="${activeNow ? "" : mercenary.id}">${activeNow ? "동행 해제" : "동행 선택"}</button>`
            : `<button data-hire-mercenary="${mercenary.id}" ${unlocked ? "" : "disabled"}>고용 · ${fmt(mercenary.cost)}G</button>`}
        </article>`;
      }).join("");

      els.mercenaryGrid.querySelectorAll("[data-hire-mercenary]").forEach(btn => btn.onclick = () => hireMercenary(btn.dataset.hireMercenary));
      els.mercenaryGrid.querySelectorAll("[data-activate-mercenary]").forEach(btn => btn.onclick = () => activateMercenary(btn.dataset.activateMercenary));
    }

    function autoSalvageGain(item) {
      return Math.max(1,Math.round(rarityRank(item)*2+item.score/95));
    }

    function autoProcessNewItem(item) {
      const settings = state.autoProcess;
      if (!settings.enabled || item.locked) return false;
      if (settings.keepSpecial && ["set","unique"].includes(itemKind(item))) return false;
      if (settings.keepSixAffix && itemKind(item) === "normal" && (item.affixes || []).length >= 6) return false;
      if (itemKind(item) !== "normal") return false;
      const action = settings[item.rarity] || "keep";
      if (action === "sell") {
        state.gold += item.sellPrice;
        state.records.totalGold += item.sellPrice;
        state.records.itemsSold = (state.records.itemsSold || 0)+1;
        state.records.autoSoldItems = (state.records.autoSoldItems || 0)+1;
        log(`자동 판매 · ${item.name} · 골드 +${fmt(item.sellPrice)}`, "neutral");
        return true;
      }
      if (action === "salvage") {
        const gain = autoSalvageGain(item);
        state.dust += gain;
        state.records.itemsSalvaged = (state.records.itemsSalvaged || 0)+1;
        state.records.autoSalvagedItems = (state.records.autoSalvagedItems || 0)+1;
        log(`자동 분해 · ${item.name} · 별가루 +${fmt(gain)}`, "rarity-epic");
        return true;
      }
      return false;
    }

    function updateAutoProcessSettings() {
      state.autoProcess.enabled = !!els.autoProcessEnabled.checked;
      state.autoProcess.common = els.autoProcessCommon.value;
      state.autoProcess.uncommon = els.autoProcessUncommon.value;
      state.autoProcess.rare = els.autoProcessRare.value;
      state.autoProcess.epic = els.autoProcessEpic.value;
      state.autoProcess.legendary = els.autoProcessLegendary.value;
      state.autoProcess.keepSpecial = !!els.keepSpecialItems.checked;
      state.autoProcess.keepSixAffix = !!els.keepSixAffixItems.checked;
      saveState();
      renderInventoryManagement();
    }

    function processExistingInventory() {
      const kept = [];
      let processed = 0;
      state.inventory.forEach(item => {
        if (autoProcessNewItem(item)) processed++;
        else kept.push(item);
      });
      state.inventory = kept;
      if (state.lastLoot && !state.inventory.some(item => item.id === state.lastLoot.id)) state.lastLoot = null;
      log(`현재 가방 자동 처리 · ${processed}개 정리`, "neutral");
      saveState();
      renderAll();
    }

    function toggleItemLock(id) {
      const item = findInventoryItem(id);
      if (!item) return;
      item.locked = !item.locked;
      saveState();
      renderInventory();
    }

    function renderInventoryManagement() {
      const settings = state.autoProcess;
      els.autoProcessEnabled.checked = !!settings.enabled;
      els.autoProcessCommon.value = settings.common;
      els.autoProcessUncommon.value = settings.uncommon;
      els.autoProcessRare.value = settings.rare;
      els.autoProcessEpic.value = settings.epic;
      els.autoProcessLegendary.value = settings.legendary;
      els.keepSpecialItems.checked = !!settings.keepSpecial;
      els.keepSixAffixItems.checked = !!settings.keepSixAffix;
      els.affixEssenceCount.textContent = `보관 접사 ${state.affixEssences.length}개`;
      els.affixEssenceGrid.innerHTML = state.affixEssences.length
        ? state.affixEssences.map(essence => `<article class="affix-essence-card">
            <strong>[${essence.affix.name}] ${essence.affix.label} +${essence.affix.value}${essence.affix.percent ? "%" : ""}</strong><br>
            ${essence.affix.kind === "prefix" ? "접두사" : "접미사"} · ${essence.sourceName}<br>
            계승 대상 장비 카드에서 사용할 수 있다.
          </article>`).join("")
        : `<div class="skillbook-empty">아직 추출에 성공한 접사가 없다.</div>`;
    }

    function extractionChance(item) {
      return {common:.01,uncommon:.015,rare:.02,epic:.03,legendary:.05}[item.rarity] || .01;
    }

    function extractStrongestAffix(id) {
      const item = findInventoryItem(id);
      if (!item || itemKind(item) !== "normal" || !(item.affixes || []).length) return;
      if (item.locked) return toast("잠금을 해제한 뒤 추출하세요.");
      const cost = Math.max(250,rarityRank(item)*350);
      if (state.gold < cost) return toast(`추출 비용이 부족합니다. 필요 ${fmt(cost)}G`);
      const target = [...item.affixes].sort((a,b) => (b.tierIndex || 0)-(a.tierIndex || 0) || Number(b.value)-Number(a.value))[0];
      const chance = extractionChance(item);
      if (!confirm(`${item.name}을 파괴하고 가장 강한 접사 [${target.name}]을 추출할까요?\n성공률 ${Math.round(chance*1000)/10}% · 비용 ${fmt(cost)}G`)) return;

      state.gold -= cost;
      removeInventoryItem(id);
      state.records.affixExtractionAttempts = (state.records.affixExtractionAttempts || 0)+1;
      if (Math.random() < chance) {
        state.affixEssences.unshift({
          id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()),
          sourceName:item.name,
          affix:JSON.parse(JSON.stringify(target))
        });
        state.records.affixExtractionSuccesses = (state.records.affixExtractionSuccesses || 0)+1;
        log(`접사 추출 성공 · [${target.name}] ${target.label} +${target.value}${target.percent ? "%" : ""}`, "rarity-legendary");
        toast("접사 추출 성공!");
      } else {
        log(`접사 추출 실패 · ${item.name}이 재가 되었다.`, "negative");
        toast("접사 추출 실패");
      }
      saveState();
      renderAll();
    }

    function inheritAffix(itemId,essenceId) {
      const item = findInventoryItem(itemId);
      const essenceIndex = state.affixEssences.findIndex(entry => entry.id === essenceId);
      if (!item || essenceIndex < 0 || itemKind(item) !== "normal") return;
      if (item.locked) return toast("잠금을 해제한 뒤 계승하세요.");
      const essence = state.affixEssences[essenceIndex];
      const affix = JSON.parse(JSON.stringify(essence.affix));
      const def = affixDefinition(affix.kind,affix.stat,affix.familyId);
      if (!def?.slots?.includes(item.slot)) return toast("이 장비 부위에는 계승할 수 없습니다.");
      const cost = 1200+(affix.tierIndex || 0)*450;
      if (state.gold < cost) return toast(`계승 비용이 부족합니다. 필요 ${fmt(cost)}G`);

      const sameKind = item.affixes.filter(entry => entry.kind === affix.kind);
      const capacity = affix.kind === "prefix" ? item.prefixCapacity : item.suffixCapacity;
      if (sameKind.length < capacity) item.affixes.push(affix);
      else {
        const weakest = sameKind.sort((a,b) => (a.tierIndex || 0)-(b.tierIndex || 0) || Number(a.value)-Number(b.value))[0];
        const index = item.affixes.indexOf(weakest);
        item.affixes[index] = affix;
      }
      state.gold -= cost;
      state.affixEssences.splice(essenceIndex,1);
      rebuildItemFromAffixes(item);
      rebuildStandardItemName(item);
      state.records.affixInheritances = (state.records.affixInheritances || 0)+1;
      log(`접사 계승 · ${item.name}에 [${affix.name}]을 새겼다 · ${fmt(cost)}G`, "rarity-set");
      saveState();
      renderAll();
    }

    function canEvolveUnique(item) {
      if (itemKind(item) !== "unique" || item.specialQuality?.id === "awakened") return false;
      return state.inventory.some(other => other.id !== item.id && !other.locked && other.uniqueId === item.uniqueId);
    }

    function evolveUnique(id) {
      const item = findInventoryItem(id);
      if (!item || itemKind(item) !== "unique" || item.locked) return;
      const duplicate = state.inventory.find(other => other.id !== item.id && !other.locked && other.uniqueId === item.uniqueId);
      if (!duplicate) return toast("진화에 사용할 같은 유니크가 없습니다.");
      const currentIndex = Math.max(0,specialQualityTable.findIndex(entry => entry.id === item.specialQuality?.id));
      if (currentIndex >= specialQualityTable.length-1) return toast("이미 각성한 유물입니다.");
      const current = specialQualityTable[currentIndex];
      const next = specialQualityTable[currentIndex+1];
      const cost = [1000,1800,3200,6000][currentIndex] || 6000;
      if (state.gold < cost) return toast(`진화 비용이 부족합니다. 필요 ${fmt(cost)}G`);
      if (!confirm(`${duplicate.name}을 제물로 사용해 ${item.name}을 ${next.name}(으)로 진화할까요?`)) return;

      state.gold -= cost;
      removeInventoryItem(duplicate.id);
      const statRatio = next.statMult/(current.statMult || 1);
      Object.keys(item.stats || {}).forEach(key => item.stats[key] = typeof item.stats[key] === "number" ? +(item.stats[key]*statRatio).toFixed(2) : item.stats[key]);
      item.intrinsic = {...item.stats};
      const powerRatio = next.powerMult/(current.powerMult || 1);
      Object.keys(item.uniquePowers || {}).forEach(key => {
        if (typeof item.uniquePowers[key] === "number") item.uniquePowers[key] = +(item.uniquePowers[key]*powerRatio).toFixed(4);
      });
      if ((next.skillDelta || 0) > (current.skillDelta || 0)) {
        Object.keys(item.skillBoosts || {}).forEach(skillId => item.skillBoosts[skillId] += 1);
      }
      item.specialQuality = {...next};
      item.specialVerdict = specialVerdict(item.specialBaseTier || "solid",next);
      item.score = itemScoreFromStats(item.stats,specialPowerScore(item.uniquePowers,item.skillBoosts));
      item.sellPrice = Math.max(100,Math.round(item.score*.84*30));
      state.records.uniqueEvolutions = (state.records.uniqueEvolutions || 0)+1;
      log(`유니크 진화 · ${item.name} → ${next.name}`, "rarity-unique");
      toast(`${next.name} 진화 성공`);
      saveState();
      renderAll();
    }

    function scaledExpeditionEnemy(name,mult,boss=false,trait="") {
      const s = totalStats();
      const offense = Math.max(s.attack,s.magicPower);
      return {
        name,baseName:name,zoneId:"expedition",rank:boss ? "심연 군주" : "심연 개체",
        mutation:null,specialType:"",specialLabel:trait,turnLimit:60,
        attack:Math.max(5,(s.defense*.44+s.maxHp/22)*mult),
        defense:Math.max(2,offense*.20*mult),
        hp:Math.max(35,(offense*5.2+s.maxHp*.45)*mult*(boss ? 1.35 : 1)),
        xp:0,gold:0,drop:0,mapMult:1
      };
    }

    function simulateExpedition(enemy,hp,mp) {
      const originalHp = state.hp;
      const originalMp = state.mp;
      state.hp = hp;
      state.mp = mp;
      const result = simulateBattle(enemy);
      state.hp = originalHp;
      state.mp = originalMp;
      return result;
    }

    function weekKey() {
      const now = new Date();
      const start = new Date(now.getFullYear(),0,1);
      const day = Math.floor((now-start)/86400000);
      return `${now.getFullYear()}-${Math.ceil((day+start.getDay()+1)/7)}`;
    }

    function ensureAbyssWeek() {
      const key = weekKey();
      if (state.abyss.weeklyKey !== key) {
        state.abyss.weeklyKey = key;
        state.abyss.weeklyBest = 0;
      }
    }

    function startAbyss() {
      if (state.abyss.active && !confirm("현재 심연 원정을 포기하고 1층부터 다시 시작할까요?")) return;
      const s = totalStats();
      state.abyss.active = true;
      state.abyss.floor = 1;
      state.abyss.hp = s.maxHp;
      state.abyss.mp = s.maxMp;
      state.abyss.history.unshift("심연 원정을 시작했다.");
      saveState();
      renderAll();
    }

    function fightAbyssFloor() {
      if (!state.abyss.active) return toast("먼저 심연 원정을 시작하세요.");
      const floor = state.abyss.floor;
      const boss = floor%5 === 0;
      const mult = .72+floor*.065;
      const enemy = scaledExpeditionEnemy(boss ? `심연 ${floor}층의 군주` : `심연 ${floor}층 방랑자`,mult,boss,boss ? "5층 단위 보스" : "");
      const result = simulateExpedition(enemy,state.abyss.hp,state.abyss.mp);
      if (result.won) {
        state.abyss.hp = Math.min(totalStats().maxHp,result.heroHp+Math.round(totalStats().maxHp*.08));
        state.abyss.mp = Math.min(totalStats().maxMp,result.heroMp+Math.round(totalStats().maxMp*.05));
        const gold = Math.round(45*floor*(boss ? 2 : 1));
        state.gold += gold;
        state.records.totalGold += gold;
        state.records.abyssWins = (state.records.abyssWins || 0)+1;
        state.abyss.bestFloor = Math.max(state.abyss.bestFloor || 0,floor);
        state.abyss.weeklyBest = Math.max(state.abyss.weeklyBest || 0,floor);
        state.records.abyssBestFloor = Math.max(state.records.abyssBestFloor || 0,floor);
        if (boss) {
          state.dust += Math.max(3,Math.floor(floor/2));
          const item = generateItem(Math.max(1,1+floor*.12),8+Math.floor(floor/5));
          storeItem(item);
          recordDroppedItem(item);
        }
        state.abyss.history.unshift(`${floor}층 돌파 · ${result.turns}막 · 골드 +${fmt(gold)}${boss ? " · 보스 전리품 획득" : ""}`);
        state.abyss.floor++;
      } else {
        state.abyss.history.unshift(`${floor}층에서 원정 종료 · 최고 ${state.abyss.bestFloor}층`);
        state.abyss.active = false;
        toast("심연 원정 종료");
      }
      state.abyss.history = state.abyss.history.slice(0,20);
      saveState();
      renderAll();
    }

    function retreatAbyss() {
      if (!state.abyss.active) return;
      state.abyss.history.unshift(`${state.abyss.floor-1}층에서 안전하게 귀환했다.`);
      state.abyss.active = false;
      saveState();
      renderAll();
    }

    function renderAbyss() {
      ensureAbyssWeek();
      const abyss = state.abyss;
      els.abyssFloorBadge.textContent = abyss.active ? `현재 ${abyss.floor}층` : "원정 대기";
      els.abyssBestBadge.textContent = `최고 ${abyss.bestFloor || 0}층 · 이번 주 ${abyss.weeklyBest || 0}층`;
      els.abyssSummary.innerHTML = `<p>매 층 적 체력·공격력이 상승하며, 5층마다 보스와 장비 보상이 등장한다. 원정 중 체력과 마나는 다음 층으로 이어진다.</p>`;
      const boss = abyss.floor%5 === 0;
      els.abyssBattleCard.innerHTML = abyss.active
        ? `<h3>${abyss.floor}층 · ${boss ? "심연의 군주" : "심연 개체"}</h3><p>원정 HP ${fmt(abyss.hp)}/${fmt(totalStats().maxHp)} · MP ${fmt(abyss.mp)}/${fmt(totalStats().maxMp)} · 적 강화 ×${(.72+abyss.floor*.065).toFixed(2)}</p>`
        : `<h3>심연의 입구</h3><p>원정을 시작하면 체력과 마나가 가득 찬 상태로 1층에 진입한다.</p>`;
      els.abyssStartBtn.textContent = abyss.active ? "1층부터 다시 시작" : "심연 원정 시작";
      els.abyssFightBtn.disabled = !abyss.active;
      els.abyssRetreatBtn.disabled = !abyss.active;
      els.abyssHistory.innerHTML = abyss.history.length ? abyss.history.map(line => `<div class="expedition-history-row">${line}</div>`).join("") : `<div class="expedition-history-row">아직 심연 원정 기록이 없다.</div>`;
    }

    function ensureDailyBoss() {
      const today = localDateKey();
      if (state.dailyBoss.date !== today) {
        state.dailyBoss = {date:today,attempted:false,won:false,lockedPower:0,history:[...(state.dailyBoss.history || [])]};
      }
    }

    function todayBoss() {
      const day = new Date().getDay();
      return dailyBossCatalog.find(boss => boss.day === day) || dailyBossCatalog[0];
    }

    function fightDailyBoss(difficultyId) {
      ensureDailyBoss();
      if (state.dailyBoss.attempted) return toast("오늘의 보스 도전은 이미 끝났습니다.");
      const boss = todayBoss();
      const difficulty = dailyBossDifficulties.find(entry => entry.id === difficultyId);
      if (!difficulty) return;
      state.dailyBoss.attempted = true;
      state.dailyBoss.lockedPower = power();
      state.records.dailyBossAttempts = (state.records.dailyBossAttempts || 0)+1;

      const enemy = scaledExpeditionEnemy(boss.name,difficulty.mult,true,boss.trait);
      const s = totalStats();
      const result = simulateExpedition(enemy,s.maxHp,s.maxMp);
      if (result.won) {
        state.dailyBoss.won = true;
        state.records.dailyBossWins = (state.records.dailyBossWins || 0)+1;
        const gold = Math.round((350+state.level*32)*difficulty.reward);
        const dust = Math.max(5,Math.round(8*difficulty.reward));
        state.gold += gold;
        state.records.totalGold += gold;
        state.dust += dust;

        let item = null;
        if (boss.id === "nameless" && Math.random() < .10*difficulty.reward) item = generateSetItem(Math.max(1,1+state.level*.08),randomChoice(slots).key);
        else if (boss.id === "star_eater_boss" && Math.random() < .025*difficulty.reward) item = generateUniqueItem(Math.max(1,1+state.level*.08),randomChoice(slots).key);
        else item = generateItem(Math.max(1,1+state.level*.08),8+Math.round(difficulty.reward*3));
        storeItem(item);
        recordDroppedItem(item);
        state.dailyBoss.history.unshift(`${boss.name} ${difficulty.name} 승리 · 골드 +${fmt(gold)} · 별가루 +${fmt(dust)} · ${item.name}`);
        toast("일일 보스 토벌 성공");
      } else {
        state.dailyBoss.history.unshift(`${boss.name} ${difficulty.name} 패배 · 다음 도전은 내일`);
        toast("일일 보스 도전 종료");
      }
      state.dailyBoss.history = state.dailyBoss.history.slice(0,14);
      saveState();
      renderAll();
    }

    function renderDailyBoss() {
      ensureDailyBoss();
      const boss = todayBoss();
      const done = state.dailyBoss.attempted;
      els.dailyBossNavMark.textContent = done ? "" : "(!)";
      els.dailyBossNavBadge.textContent = done ? (state.dailyBoss.won ? "오늘 토벌 완료" : "오늘 도전 종료") : "오늘 도전 가능";
      els.dailyBossCard.innerHTML = `<h3>${boss.name}</h3><p>${boss.trait}<br>주요 보상 · ${boss.reward}</p>`;
      els.dailyBossDifficultyGrid.innerHTML = dailyBossDifficulties.map(diff => `<article class="daily-boss-difficulty-card ${done ? "done" : ""}">
        <h3>${diff.name}</h3>
        <p>적 강함 ×${diff.mult.toFixed(2)} · 보상 ×${diff.reward.toFixed(1)}<br>입장 기회는 세 난이도 중 한 번만 사용한다.</p>
        <button data-fight-daily-boss="${diff.id}" ${done ? "disabled" : ""}>${done ? "오늘 도전 완료" : `${diff.name} 도전`}</button>
      </article>`).join("");
      els.dailyBossDifficultyGrid.querySelectorAll("[data-fight-daily-boss]").forEach(btn => btn.onclick = () => fightDailyBoss(btn.dataset.fightDailyBoss));
      els.dailyBossHistory.innerHTML = state.dailyBoss.history.length ? state.dailyBoss.history.map(line => `<div class="expedition-history-row">${line}</div>`).join("") : `<div class="expedition-history-row">아직 일일 보스 기록이 없다.</div>`;
    }

    function switchPage(page) {
      document.querySelectorAll(".page").forEach(el => el.classList.toggle("active", el.dataset.page === page));
      document.querySelectorAll(".top-tab").forEach(el => el.classList.toggle("active", el.dataset.pageTarget === page));
      if (page === "guide") renderGuide();
      if (page === "inventory") renderInventory();
      if (page === "character") renderCharacterDetails();
      if (page === "info") renderInfo();
      if (page === "codex") renderCodex();
      if (page === "bounties") renderBounties();
      if (page === "skills") renderSkills();
      if (page === "quests") renderQuests();
      if (page === "attendance") renderAttendance();
      if (page === "staminacamp") renderStaminaCamp();
      if (page === "daily") renderDailyDungeon();
      if (page === "dailyboss") renderDailyBoss();
      if (page === "abyss") renderAbyss();
      if (page === "collection") renderCollectionHall();
      if (page === "mercenary") renderMercenaries();
      if (page === "arena") renderArena();
      if (page === "savevault") renderSaveVault();
      if (page === "gamble") renderGambleShop();
      if (page === "market") renderMarket();
    }

    function rarityRank(item) {
      return { common:1, uncommon:2, rare:3, epic:4, legendary:5, set:6, unique:7 }[item?.rarity] || 0;
    }

    function findInventoryItem(id) {
      return state.inventory.find(item => item.id === id) || null;
    }

    function removeInventoryItem(id) {
      const index = state.inventory.findIndex(item => item.id === id);
      if (index < 0) return null;
      return state.inventory.splice(index, 1)[0];
    }

    function announceSpecialLoot(item) {
      // 모바일 플레이에서는 전리품 팝업과 화면 점멸을 사용하지 않는다.
      // 세트·유니크 여부는 전투 기록의 등급 색상과 전리품 가방에서 확인한다.
    }

    function recordDroppedItem(item) {
      registerCollectionItem(item);
      state.records.items = (state.records.items || 0)+1;
      if (item.rarity === "legendary") state.records.legendary = (state.records.legendary || 0)+1;
      if (itemKind(item) === "set") state.records.setItems = (state.records.setItems || 0)+1;
      if (itemKind(item) === "unique") state.records.uniqueItems = (state.records.uniqueItems || 0)+1;
      if (itemKind(item) === "normal" && (item.affixes || []).length >= 6) state.records.sixAffixItems = (state.records.sixAffixItems || 0)+1;
      if (["set","unique"].includes(itemKind(item))) {
        const verdictId = item.specialVerdict?.id;
        if (verdictId === "dud") state.records.specialDuds = (state.records.specialDuds || 0)+1;
        if (verdictId === "jackpot") state.records.specialJackpots = (state.records.specialJackpots || 0)+1;
      }
    }

    function storeItem(item) {
      item.locked = !!item.locked;
      if (autoProcessNewItem(item)) return false;
      state.inventory.unshift(item);
      state.lastLoot = null;
      announceSpecialLoot(item);
      if (state.inventory.length >= state.inventoryCapacity && autoTimer) {
        toggleAuto();
        log(`인벤토리가 ${state.inventory.length}/${state.inventoryCapacity}칸이 되어 자동 사냥을 중지했습니다.`, "negative");
        toast("인벤토리가 가득 찼습니다.");
      }
      return true;
    }

    function equipInventoryItem(id) {
      const item = findInventoryItem(id);
      if (!item) return;
      const old = state.equipment[item.slot];
      removeInventoryItem(id);
      if (old) state.inventory.unshift(old);
      state.equipment[item.slot] = item;
      state.records.itemsEquipped = (state.records.itemsEquipped || 0)+1;
      if (state.lastLoot?.id === id) state.lastLoot = null;
      const s = totalStats();
      state.hp = Math.min(s.maxHp, state.hp + Math.round(s.maxHp * .12));
      log(`${item.name} 장착${old ? ` · ${old.name}은 인벤토리로 이동` : ""} · 전투력 ${fmt(power())}`, "positive");
      toast("장비를 교체했습니다.");
      saveState();
      renderAll();
    }

    function sellInventoryItem(id) {
      const item = findInventoryItem(id);
      if (!item) return;
      if (item.locked) return toast("잠긴 장비는 판매할 수 없습니다.");
      removeInventoryItem(id);
      state.gold += item.sellPrice;
      state.records.totalGold += item.sellPrice;
      state.records.itemsSold = (state.records.itemsSold || 0) + 1;
      if (state.lastLoot?.id === id) state.lastLoot = null;
      log(`${item.name} 판매 · 골드 +${fmt(item.sellPrice)}`, "neutral");
      saveState();
      renderAll();
    }

    function discardInventoryItem(id) {
      const item = findInventoryItem(id);
      if (!item) return;
      if (item.locked) return toast("잠긴 장비는 버릴 수 없습니다.");
      removeInventoryItem(id);
      if (state.lastLoot?.id === id) state.lastLoot = null;
      log(`${item.name}을 버렸습니다.`, "neutral");
      saveState();
      renderAll();
    }

    function rebuildItemFromAffixes(item) {
      const stats = { ...(item.intrinsic || {}) };
      (item.affixes || []).forEach(affix => addItemStat(stats, affix.stat, affix.value));
      item.stats = stats;
      item.score = powerOfStats({
        maxHp: stats.maxHp || 0, maxMp: stats.maxMp || 0,
        attack: stats.attack || 0, magicPower: stats.magicPower || 0,
        defense: stats.defense || 0, crit: stats.crit || 0,
        goldFind: stats.goldFind || 0, mapFind: stats.mapFind || 0,
        itemFind: stats.itemFind || 0,
        dodge: stats.dodge || 0, doubleHit: stats.doubleHit || 0,
        str: stats.str || 0, vit: stats.vit || 0, int: stats.int || 0,
        spi: stats.spi || 0, luck: stats.luck || 0, spd: stats.spd || 0
      });
      item.sellPrice = Math.max(5, Math.round(item.score * .48 * (item.raritySell || 1)));
    }

    function salvageInventoryItem(id) {
      const item = findInventoryItem(id);
      if (!item) return;
      if (item.locked) return toast("잠긴 장비는 분해할 수 없습니다.");
      const gain = Math.max(1, Math.round(rarityRank(item) * 2 + item.score / 95));
      removeInventoryItem(id);
      if (state.lastLoot?.id === id) state.lastLoot = null;
      state.dust += gain;
      state.records.itemsSalvaged = (state.records.itemsSalvaged || 0) + 1;
      log(`${item.name} 분해 · 별가루 +${fmt(gain)}`, "rarity-epic");
      toast(`별가루 ${gain} 획득`);
      saveState();
      renderAll();
    }

    function randomValueWithinAffixBand(affix) {
      applyAffixTierMetadata(affix);
      const min = Number(affix.rangeMin);
      const max = Number(affix.rangeMax);
      if (!Number.isFinite(min) || !Number.isFinite(max) || max >= 9999) {
        const fallbackMax = affix.percent ? Math.max(min+.9,Number(affix.value)*1.25) : Math.max(min+9,Math.round(Number(affix.value)*1.25));
        return affix.percent
          ? +(min+Math.random()*(fallbackMax-min)).toFixed(1)
          : Math.round(min+Math.random()*(fallbackMax-min));
      }
      if (affix.percent) {
        const steps = Math.max(0,Math.round((max-min)*10));
        return +(min+Math.floor(Math.random()*(steps+1))/10).toFixed(1);
      }
      return Math.floor(min+Math.random()*(max-min+1));
    }

    function rerollAffixWithinTier(itemId,affixIndex) {
      const item = findInventoryItem(itemId);
      if (!item || itemKind(item) !== "normal" || !Array.isArray(item.affixes)) return toast("동급 각인을 새길 수 없는 전리품입니다.");
      if (item.locked) return toast("잠금을 해제한 뒤 재각인하세요.");
      const affix = item.affixes[Number(affixIndex)];
      if (!affix) return;
      if ((state.materials.sameTierRunes || 0) <= 0) return toast("동급 각인석이 없습니다. 오늘의 균열에서 얻을 수 있습니다.");

      applyAffixTierMetadata(affix);
      const before = affix.value;
      let next = before;
      for (let attempt=0;attempt<8 && next === before;attempt++) next = randomValueWithinAffixBand(affix);

      state.materials.sameTierRunes--;
      affix.value = next;
      affix.baseValue = next;
      applyAffixTierMetadata(affix);
      rebuildItemFromAffixes(item);
      rebuildStandardItemName(item);
      state.records.tierRerolls = (state.records.tierRerolls || 0) + 1;
      log(`동급 각인 · ${item.name}의 ${affix.kind === "prefix" ? "접두사" : "접미사"} [${affix.name}] ${before}${affix.percent ? "%" : ""} → ${next}${affix.percent ? "%" : ""}`, "rarity-set");
      toast(`${affix.name} 수치가 다시 새겨졌습니다.`);
      saveState();
      renderAll();
    }

    function reforgeInventoryItem(id) {
      const item = findInventoryItem(id);
      if (!item || itemKind(item) !== "normal" || !Array.isArray(item.affixes) || !item.affixes.length) return toast("세트와 유니크는 재련할 수 없습니다.");
      if (item.locked) return toast("잠금을 해제한 뒤 재련하세요.");
      const cost = Math.max(4, rarityRank(item) * 5);
      if (state.dust < cost) return toast(`별가루가 부족합니다. 필요 ${cost}`);
      state.dust -= cost;
      item.affixes.forEach(affix => {
        const base = affix.baseValue || affix.value;
        const quality = .78 + Math.random() * .48;
        affix.value = affix.percent
          ? +(Math.max(.1,base*quality)).toFixed(1)
          : Math.max(1,Math.round(base*quality));
        affix.baseValue = affix.value;
        applyAffixTierMetadata(affix);
      });
      rebuildItemFromAffixes(item);
      rebuildStandardItemName(item);
      state.records.reforges = (state.records.reforges || 0) + 1;
      log(`${item.name} 재련 · 접사 종류 유지, 수치 재추첨 · ${fmt(item.score)}점`, "rarity-epic");
      toast("접사 수치를 재련했습니다.");
      saveState();
      renderAll();
    }

    function bulkSellJunk() {
      const junk = state.inventory.filter(item => !item.locked && ["common","uncommon"].includes(item.rarity));
      if (!junk.length) return toast("판매할 일반·고급 장비가 없습니다.");
      const total = junk.reduce((sum, item) => sum + item.sellPrice, 0);
      const ids = new Set(junk.map(item => item.id));
      state.inventory = state.inventory.filter(item => !ids.has(item.id));
      state.gold += total;
      state.records.totalGold += total;
      state.records.itemsSold = (state.records.itemsSold || 0) + junk.length;
      if (state.lastLoot && ids.has(state.lastLoot.id)) state.lastLoot = null;
      log(`일반·고급 장비 ${junk.length}개 일괄 판매 · 골드 +${fmt(total)}`, "neutral");
      toast(`${junk.length}개 판매 완료`);
      saveState();
      renderAll();
    }

    function inventoryCardHtml(item, compact=false) {
      const current = state.equipment[item.slot];
      const diff = item.score - (current?.score || 0);
      const kind = itemKind(item);
      normalizeItemAffixes(item);
      const proclamation = kind === "unique"
        ? "이름 있는 유물"
        : kind === "set"
          ? `${item.setName} 세트`
          : item.rarity === "legendary"
            ? "여섯 접사의 정점"
            : "";
      const compatibleEssences = kind === "normal"
        ? state.affixEssences.filter(essence => affixDefinition(essence.affix.kind,essence.affix.stat,essence.affix.familyId)?.slots?.includes(item.slot))
        : [];
      const inheritanceControls = !compact && compatibleEssences.length
        ? `<div class="inheritance-controls"><strong>보관 접사 계승</strong>
            ${compatibleEssences.slice(0,3).map(essence => `<button data-inherit-item="${item.id}" data-essence-id="${essence.id}">[${essence.affix.name}] ${essence.affix.label} +${essence.affix.value}${essence.affix.percent ? "%" : ""}</button>`).join(" ")}
          </div>`
        : "";
      const tierRerollControls = !compact && kind === "normal" && Array.isArray(item.affixes) && item.affixes.length
        ? `<div class="tier-reroll-box">
            <div class="tier-reroll-title">동급 각인 · 보유 ${fmt(state.materials.sameTierRunes || 0)}개</div>
            ${item.affixes.map((affix,index) => {
              applyAffixTierMetadata(affix);
              return `<div class="tier-reroll-row">
                <span>${affix.kind === "prefix" ? "접두사" : "접미사"} [${affix.name}] ${affix.value}${affix.percent ? "%" : ""} · 범위 ${affix.tierLabel}</span>
                <button data-tier-reroll-item="${item.id}" data-tier-reroll-index="${index}" ${(state.materials.sameTierRunes || 0) <= 0 ? "disabled" : ""}>동급 재각인</button>
              </div>`;
            }).join("")}
          </div>`
        : "";
      return `
        <article class="inventory-card ${itemKindClass(item)} ${kind === "normal" && (item.affixes || []).length >= 6 ? "six-affix" : ""} ${item.locked ? "item-locked" : ""}">
          <div class="loot-header">
            <div>
              ${proclamation ? `<div class="loot-proclamation">${proclamation}</div>` : ""}
              <div class="rarity ${item.rarityClass}">[${item.rarityName}] ${slots.find(s=>s.key===item.slot)?.label || item.slot}</div>
              <div class="item-name ${item.rarityClass}">${item.name}</div>
              ${kind === "normal" ? `<div class="affix-capacity-badge ${item.affixes?.length >= 6 ? "six-affix-mark" : ""}">${normalAffixCapacityText(item)}</div>` : ""}
              ${item.locked ? `<div class="lock-badge">🔒 보호됨</div>` : ""}
            </div>
            <div class="score">${fmt(item.score)}점</div>
          </div>
          <div class="affixes">${itemStatLines(item).map(x=>`<div>${x}</div>`).join("") || "<div>추가 능력 없음</div>"}</div>
          ${specialItemLines(item)}
          ${inheritanceControls}
          ${tierRerollControls}
          ${compact ? "" : `<div class="compare ${diff >= 0 ? "positive" : "negative"}">현재 장비 대비 ${diff >= 0 ? "+" : ""}${fmt(diff)}</div>
          <div class="mini-buttons">
            <button class="primary" data-inventory-equip="${item.id}">장착</button>
            <button data-inventory-lock="${item.id}">${item.locked ? "잠금 해제" : "잠금"}</button>
            <button data-inventory-sell="${item.id}">판매 +${fmt(item.sellPrice)}G</button>
            <button data-inventory-salvage="${item.id}">분해</button>
            ${kind === "normal" && Array.isArray(item.affixes) && item.affixes.length ? `<button data-inventory-reforge="${item.id}">재련</button><button data-extract-affix="${item.id}">접사 추출</button>` : ""}
            ${kind === "unique" && canEvolveUnique(item) ? `<button data-evolve-unique="${item.id}">중복 유니크 진화</button>` : ""}
            <button data-inventory-discard="${item.id}">버리기</button>
          </div>`}
        </article>
      `;
    }

    function renderInventory() {
      const filter = els.inventoryFilter?.value || "all";
      const sort = els.inventorySort?.value || "recent";
      let items = [...state.inventory];
      if (filter === "rareplus") items = items.filter(item => rarityRank(item) >= 3);
      else if (filter === "special") items = items.filter(item => ["set","unique"].includes(itemKind(item)));
      else if (filter !== "all") items = items.filter(item => item.slot === filter);

      if (sort === "score") items.sort((a,b) => b.score - a.score);
      if (sort === "rarity") items.sort((a,b) => rarityRank(b) - rarityRank(a) || b.score - a.score);
      if (sort === "price") items.sort((a,b) => b.sellPrice - a.sellPrice);

      els.inventoryCount.textContent = `${state.inventory.length} / ${state.inventoryCapacity}`;
      els.dustCount.textContent = `별가루 ${fmt(state.dust)}`;
      els.tierStoneCount.textContent = `동급 각인석 ${fmt(state.materials.sameTierRunes || 0)}`;
      els.inventoryNavCount.textContent = `(${state.inventory.length})`;
      els.inventoryGrid.innerHTML = items.length
        ? items.map(item => inventoryCardHtml(item)).join("")
        : `<div class="inventory-empty">이 칸에는 아직 전리품이 없다.<br>균열에서 이름 있는 물건을 찾아보자.</div>`;

      els.inventoryGrid.querySelectorAll("[data-inventory-equip]").forEach(btn => btn.onclick = () => equipInventoryItem(btn.dataset.inventoryEquip));
      els.inventoryGrid.querySelectorAll("[data-inventory-lock]").forEach(btn => btn.onclick = () => toggleItemLock(btn.dataset.inventoryLock));
      els.inventoryGrid.querySelectorAll("[data-inventory-sell]").forEach(btn => btn.onclick = () => sellInventoryItem(btn.dataset.inventorySell));
      els.inventoryGrid.querySelectorAll("[data-inventory-salvage]").forEach(btn => btn.onclick = () => salvageInventoryItem(btn.dataset.inventorySalvage));
      els.inventoryGrid.querySelectorAll("[data-inventory-reforge]").forEach(btn => btn.onclick = () => reforgeInventoryItem(btn.dataset.inventoryReforge));
      els.inventoryGrid.querySelectorAll("[data-tier-reroll-item]").forEach(btn => btn.onclick = () => rerollAffixWithinTier(btn.dataset.tierRerollItem,btn.dataset.tierRerollIndex));
      els.inventoryGrid.querySelectorAll("[data-inherit-item]").forEach(btn => btn.onclick = () => inheritAffix(btn.dataset.inheritItem,btn.dataset.essenceId));
      els.inventoryGrid.querySelectorAll("[data-extract-affix]").forEach(btn => btn.onclick = () => extractStrongestAffix(btn.dataset.extractAffix));
      els.inventoryGrid.querySelectorAll("[data-evolve-unique]").forEach(btn => btn.onclick = () => evolveUnique(btn.dataset.evolveUnique));
      els.inventoryGrid.querySelectorAll("[data-inventory-discard]").forEach(btn => btn.onclick = () => discardInventoryItem(btn.dataset.inventoryDiscard));
      renderInventoryManagement();
    }

    function skillBookGradeById(id) {
      return skillBookGrades.find(grade => grade.id === id) || skillBookGrades[0];
    }

    function generateSkillBook(forcedClassId=null,forcedGradeId=null) {
      const classIds = Object.keys(classes);
      const classId = forcedClassId || (Math.random() < .80 && state.classId ? state.classId : randomChoice(classIds));
      const skills = skillCatalog[classId] || [];
      const skill = randomChoice(skills);
      const grade = forcedGradeId
        ? skillBookGradeById(forcedGradeId)
        : weightedChoice(skillBookGrades.map(entry => ({value:entry,weight:entry.weight})));
      return {
        id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()),
        classId, skillId:skill.id, skillName:skill.name,
        className:classes[classId]?.name || "알 수 없는 직업",
        gradeId:grade.id, gradeName:grade.name, gradeClass:grade.className,
        maxLevel:grade.maxLevel, sellPrice:grade.sell, droppedAt:Date.now()
      };
    }

    function rollSkillBookDrop(enemy,inRareMap=false) {
      const baseChance = inRareMap ? .10 : enemy.rank === "일반" ? .006 : enemy.rank === "정예" ? .025 : .055;
      const developerMult = 1;
      const itemFindBonus = Math.min(.02,(totalStats().itemFind || 0)*.00045);
      if (Math.random() >= Math.min(.45,(baseChance+itemFindBonus)*developerMult)) return null;
      return generateSkillBook();
    }

    function storeSkillBook(book) {
      state.skillBooks.unshift(book);
      state.lastSkillBook = null;
      state.records.skillBooksDropped = (state.records.skillBooksDropped || 0)+1;
      log(`스킬북 자동 보관 · [${book.gradeName}] ${book.className} — ${book.skillName}`,book.gradeClass);
    }

    function useSkillBook(id) {
      const index = state.skillBooks.findIndex(book => book.id === id);
      if (index < 0) return;
      const book = state.skillBooks[index];
      const current = baseSkillLevel(book.classId,book.skillId);
      if (current >= book.maxLevel) return toast(`${book.gradeName}으로는 Lv.${book.maxLevel}을 넘길 수 없습니다.`);
      state.skills[book.classId][book.skillId] = current+1;
      state.skillBooks.splice(index,1);
      if (state.lastSkillBook?.id === id) state.lastSkillBook = null;
      state.records.skillBooksUsed = (state.records.skillBooksUsed || 0)+1;
      state.records.skillUpgrades = (state.records.skillUpgrades || 0)+1;
      log(`${book.skillName} Lv.${current+1} 습득 · ${book.gradeName} 사용`,book.gradeClass);
      toast(`${book.skillName} Lv.${current+1}`);
      saveState();
      renderAll();
    }

    function sellSkillBook(id) {
      const index = state.skillBooks.findIndex(book => book.id === id);
      if (index < 0) return;
      const [book] = state.skillBooks.splice(index,1);
      state.gold += book.sellPrice;
      state.records.totalGold += book.sellPrice;
      state.records.skillBooksSold = (state.records.skillBooksSold || 0)+1;
      if (state.lastSkillBook?.id === id) state.lastSkillBook = null;
      log(`${book.gradeName} — ${book.skillName} 처분 · 골드 +${fmt(book.sellPrice)}`,"neutral");
      saveState();
      renderAll();
    }

    function renderSkillBookDrop() {
      state.lastSkillBook = null;
      els.skillBookDropCard.classList.add("hidden");
      els.skillBookDropCard.innerHTML = "";
    }

    function renderSkillBooks() {
      els.skillBookCountBadge.textContent = `스킬북 ${fmt(state.skillBooks.length)}권`;
      els.skillBookGrid.innerHTML = state.skillBooks.length
        ? state.skillBooks.map(book => {
            const current = baseSkillLevel(book.classId,book.skillId);
            const usable = current < book.maxLevel;
            return `
              <article class="skillbook-card">
                <div class="skillbook-grade ${book.gradeClass}">${book.gradeName}</div>
                <div class="skillbook-name">${book.skillName}</div>
                <div class="skillbook-meta">${book.className}<br>현재 훈련 Lv.${current}</div>
                <div class="skillbook-limit">사용 가능 상한 Lv.${book.maxLevel}</div>
                <div class="mini-buttons">
                  <button class="primary" data-use-skillbook="${book.id}" ${usable ? "" : "disabled"}>${usable ? `읽기 · Lv.${current+1}` : "단계 제한"}</button>
                  <button data-sell-skillbook="${book.id}">처분 +${fmt(book.sellPrice)}G</button>
                </div>
              </article>`;
          }).join("")
        : `<div class="skillbook-empty">아직 보유한 스킬북이 없다. 정예와 지도 수호자를 사냥하면 발견 확률이 높아진다.</div>`;

      els.skillBookGrid.querySelectorAll("[data-use-skillbook]").forEach(btn => btn.onclick = () => useSkillBook(btn.dataset.useSkillbook));
      els.skillBookGrid.querySelectorAll("[data-sell-skillbook]").forEach(btn => btn.onclick = () => sellSkillBook(btn.dataset.sellSkillbook));
    }

    function skillUpgradeCost(level) {
      return 1 + Math.floor(Math.max(0, level - 1) / 3);
    }

    function upgradeSkill(skillId) {
      if (!state.classId) return showClassModal();
      const skill = (skillCatalog[state.classId] || []).find(s => s.id === skillId);
      if (!skill) return;
      const level = baseSkillLevel(state.classId, skillId);
      if (level >= 10) return toast("훈련 가능한 최대 레벨입니다.");
      const cost = skillUpgradeCost(level);
      if (state.skillPoints < cost) return toast(`스킬 포인트가 부족합니다. 필요 ${cost}`);
      state.skillPoints -= cost;
      state.skills[state.classId][skillId] = level + 1;
      state.records.skillUpgrades = (state.records.skillUpgrades || 0) + 1;
      log(`${skill.name} Lv.${level+1} 강화 · 스킬 포인트 -${cost}`, "rarity-epic");
      saveState();
      renderAll();
    }

    function renderSkills() {
      const cls = currentClass();
      els.skillPointBadge.textContent = `스킬 포인트 ${fmt(state.skillPoints)}`;
      const skillNoticeCount = state.skillPoints+state.skillBooks.length;
      els.skillNavCount.textContent = skillNoticeCount > 0 ? `(${skillNoticeCount})` : "";
      renderSkillBooks();
      if (!cls) {
        els.skillGrid.innerHTML = `<div class="inventory-empty">직업을 먼저 선택하세요.</div>`;
        return;
      }
      const combat = classCombatText[state.classId];
      els.skillGrid.innerHTML = (skillCatalog[state.classId] || []).map(skill => {
        const baseLevel = baseSkillLevel(state.classId,skill.id);
        const level = skillLevel(state.classId, skill.id);
        const gearBonus = level - baseLevel;
        const cost = skillUpgradeCost(baseLevel);
        const mult = skill.mult + (level - 1) * skill.growth;
        return `
          <article class="skill-card ${level >= 10 ? "maxed" : ""}">
            <div class="rarity rarity-epic">${cls.name} 기술</div>
            <div class="skill-name">${skill.name}</div>
            <div class="skill-meta">마나 ${skill.cost} · ${skill.every}턴마다 판정 · ${combat.damageType === "magic" ? "마법력" : "공격력"} 기반</div>
            <div class="skill-effect">
              피해 배율 <strong>${mult.toFixed(2)}배</strong><br>
              ${skill.desc}
              ${skill.extraHit ? `<br>추가타 ${Math.round(skill.extraHit*100)}%` : ""}
              ${skill.healRate ? `<br>체력 회복 ${Math.round(skill.healRate*100)}%` : ""}
              ${skill.defensePierce ? `<br>방어 무시 ${Math.round(skill.defensePierce*100)}%` : ""}
              ${skill.critBonus ? `<br>치명타 확률 +${skill.critBonus}%` : ""}
            </div>
            <div class="skill-level">기술 Lv.${level}${gearBonus ? ` <span class="rarity-set">(장비 +${gearBonus})</span>` : ""} · 훈련 ${baseLevel}/10</div>
            <div class="mini-buttons" style="margin-top:10px">
              <button class="primary" data-upgrade-skill="${skill.id}" ${baseLevel >= 10 ? "disabled" : ""}>훈련 · ${cost}P</button>
            </div>
          </article>`;
      }).join("");
      els.skillGrid.querySelectorAll("[data-upgrade-skill]").forEach(btn => btn.onclick = () => upgradeSkill(btn.dataset.upgradeSkill));
    }

    function renderCharacterDetails() {
      const s = totalStats();
      const a = totalAttributes();
      const cls = currentClass();
      els.characterClassBadge.textContent = cls ? `${state.nickname || "무명의 사냥꾼"} · ${cls.name}` : `${state.nickname || "무명의 사냥꾼"} · 직업 미선택`;
      els.nicknameEditInput.value = state.nickname || "";
      const rows = [
        ["전투력", fmt(power())],
        ["최대 체력", fmt(s.maxHp)],
        ["최대 마나", fmt(s.maxMp)],
        ["현재 체력 / 마나", `${fmt(state.hp)} / ${fmt(state.mp)}`],
        ["물리 공격력", s.attack.toFixed(1)],
        ["마법력", s.magicPower.toFixed(1)],
        ["방어력", s.defense.toFixed(1)],
        ["치명타 확률", `${s.crit.toFixed(1)}%`],
        ["치명타 피해", `${Math.round(s.critDamage * 100)}%`],
        ["연속 공격", `${(s.doubleHit * 100).toFixed(1)}%`],
        ["회피", `${(s.dodge * 100).toFixed(1)}%`],
        ["골드 발견", `+${s.goldFind.toFixed(1)}%`],
        ["장비 발견", `+${s.itemFind.toFixed(1)}%`],
        ["희귀 지도 발견", `+${s.mapFind.toFixed(2)}%`],
        ["활성 세트", equippedSetText()],
        ["기술 피해 보정", `+${Math.round((s.skillDamageBonus || 0)*100)}%`],
        ["피해 감소", `${Math.round((s.damageReduction || 0)*100)}%`],
        ["힘 / 생명", `${fmt(a.str)} / ${fmt(a.vit)}`],
        ["지능 / 정신", `${fmt(a.int)} / ${fmt(a.spi)}`],
        ["행운 / 속도", `${fmt(a.luck)} / ${fmt(a.spd)}`]
      ];
      els.detailStats.innerHTML = rows.map(([k,v]) => `<div class="detail-row"><span>${k}</span><strong>${v}</strong></div>`).join("");
      els.detailEquipment.innerHTML = slots.map(slot => {
        const item = state.equipment[slot.key];
        return item
          ? inventoryCardHtml(item, true)
          : `<div class="inventory-card"><div class="rarity neutral">${slot.label}</div><div class="item-name neutral">비어 있음</div></div>`;
      }).join("");
    }

    function renderInfo() {
      document.querySelectorAll(".info-tab").forEach(btn => btn.classList.toggle("active", btn.dataset.infoTarget === activeInfoTab));
      if (activeInfoTab === "zones") {
        els.infoContent.innerHTML = `<div class="info-grid">${zones.map(z => `
          <div class="info-card">
            <h3>${z.name}</h3>
            <p>권장 전투력 ${fmt(z.rec)} · 현재 과열도 ${Math.round(state.heat[z.id] || 0)}%</p>
            <p>출현 몬스터: ${z.enemies.join(", ")}</p>
            <p>기본 보상 배율 ×${z.mult.toFixed(2)} · 입장 제한 없음</p>
          </div>`).join("")}</div>`;
      } else if (activeInfoTab === "classes") {
        els.infoContent.innerHTML = `<div class="info-grid">${Object.values(classes).map(cls => `
          <div class="info-card">
            <h3>${cls.name} <span class="badge">${cls.line}</span></h3>
            <p>${cls.desc}</p>
            <p><strong>주 능력치:</strong> ${attributeInfo[cls.main].name}</p>
            <p>${cls.passive}</p>
          </div>`).join("")}</div>`;
      } else if (activeInfoTab === "drops") {
        els.infoContent.innerHTML = `
          <div class="info-grid">
            ${rarityTable.map(r => `<div class="info-card"><h3 class="${r.className}">${r.name}</h3><p>기본 가중치 ${r.weight}%</p><p>접두사 ${r.prefixCount}개 · 접미사 ${r.suffixCount}개 · 판매 배율 ×${r.sell}</p></div>`).join("")}
            <div class="info-card"><h3>장비 보관 규칙</h3><p>획득 즉시 인벤토리에 들어갑니다. 장착 시 기존 장비도 인벤토리로 회수됩니다.</p><p>인벤토리가 기준 용량에 도달하면 자동 사냥이 중지되며 장비는 삭제되지 않습니다.</p></div>
            <div class="info-card"><h3>희귀 지도</h3><p>정예 처치와 지도 발견 능력치에 따라 발견 확률이 증가합니다.</p><p>테스트 모드는 희귀 지도를 빠르게 확인하기 위한 높은 확률 설정입니다.</p></div>
            <div class="info-card"><h3>접두사 표</h3><p>강력한→공격력 · 비전의→마법력 · 철벽의→방어력 · 생명의→최대 체력</p><p>예리한→치명타 · 탐욕의→골드 · 발견자의→장비 발견 · 신속한→속도</p></div>
            <div class="info-card"><h3>접미사 표</h3><p>학살자→공격력 · 대마도사→마법력 · 수호자→방어력 · 불사자→최대 체력</p><p>매의 눈→치명타 · 보물사냥꾼→장비 발견 · 길잡이→희귀 지도 · 행운아→행운</p></div>
            <div class="info-card"><h3>접사 수치 규칙</h3><p>접사의 이름과 효과는 고정되고 수치만 달라진다.</p><p>일반 전리품의 영웅·전설 확률은 크게 낮아졌다.</p></div>
            <div class="info-card"><h3 class="rarity-set">세트 전리품</h3><p>일반 등급과 별개의 녹색 전리품이다. 같은 세트를 2·3·4부위 장착할 때마다 고유 효과가 열린다.</p><p>잿빛 파수꾼 · 별무리 서약 · 붉은 사냥, 세 종류가 존재한다.</p></div>
            <div class="info-card"><h3 class="rarity-unique">유니크 유물</h3><p>이름·설정·능력치·고유 효과가 고정된 붉은 유물이다. 접사가 붙지 않으며 재련할 수도 없다.</p><p>일부 유물은 특정 기술 또는 모든 기술의 레벨을 올린다.</p></div>
            <div class="info-card"><h3>특별 전리품 확률</h3><p>장비 드롭 판정 뒤 세트 약 1.8%, 유니크 약 0.3%의 별도 판정을 거친다.</p><p>희귀 지도와 장비 발견 능력치는 이 확률을 조금 높인다.</p></div>
            <div class="info-card"><h3>접사 수치 등급</h3><p>접사 이름은 수치 범위를 뜻한다. 공격력 +10~19는 ‘강인한’, +20~39는 ‘강력한’으로 표시된다.</p><p>수치가 다른 등급으로 넘어가면 접사 이름도 함께 바뀐다.</p></div>
            <div class="info-card"><h3>동급 각인석</h3><p>오늘의 균열에서만 얻는 재료다. 접사의 이름과 수치 등급을 유지하면서 해당 범위 안에서만 값을 다시 굴린다.</p><p>예: 강인한 공격력 +10을 사용하면 +10~19 안에서 다시 결정된다.</p></div>
            <div class="info-card"><h3>출석부</h3><p>하루 한 번 보상을 받을 수 있으며, 접속을 놓쳐도 7일 보상 순서는 초기화되지 않는다.</p><p>연속 7일마다 별가루 보너스가 추가된다.</p></div>
            <div class="info-card"><h3>일반 장비의 접사 슬롯</h3><p>일반 0+0 · 고급 1+0 · 희귀 1+1 · 영웅 2+2 · 전설 3+3 구조다.</p><p>전설 장비는 최대 접두사 3개와 접미사 3개, 총 6개의 접사를 가진다. 이름에는 가장 강한 접두사와 접미사만 표시된다.</p></div>
            <div class="info-card"><h3 class="rarity-set">세트·유니크 완성도</h3><p>세트와 유니크는 일반 접사를 갖지 않는 대신 일반 장비에 없는 전용 효과가 붙는다.</p><p>결함품·불완전·온전·완벽·각성으로 완성도가 나뉘며 능력치와 고유 효과 출력이 달라진다.</p></div>
            <div class="info-card"><h3 class="rarity-unique">대박과 꽝</h3><p>같은 이름의 유물도 감정 결과가 다르다. 좋은 기반 유니크의 각성품은 대박이고, 약한 유니크의 결함품은 실제 꽝에 가깝다.</p><p>누더기 행상단 세트와 무딘 왕의 식칼·금 간 모래시계는 의도적으로 약하거나 대가가 있는 특별 전리품이다.</p></div>
            <div class="info-card"><h3 class="rarity-set">녹빛 활력 물약</h3><p>몬스터의 회복품 드롭에서 낮은 확률로 등장하며 한 병당 활력 12를 회복한다.</p><p>수동 사냥에서는 즉시 사용·보관·판매를 고를 수 있고 연속 사냥에서는 자동으로 보관된다.</p></div>
            <div class="info-card"><h3>숫자 봉인</h3><p>활력 야영지에서 하루 5판까지 정상 보상을 받는 세 자리 숫자야구다. 최대 8번 안에 맞히면 시도 횟수에 따라 활력을 얻는다.</p><p>5판 이후에는 무제한 연습 대전으로 전환되며 활력 보상은 10%, 활력 물약은 지급되지 않는다. 연습 결과는 보상 대전 연승에 영향을 주지 않는다.</p></div>
            <div class="info-card"><h3>초보자 가이드 미션</h3><p>현재 단계 하나만 활성화되며 목표를 달성하고 보상을 받으면 다음 단계가 열린다. 가이드가 열리기 전에 수행한 장착·스탯 배분·수동 저장도 자동으로 인정된다.</p><p>사냥·장착·능력치·기술·도감·의뢰·야영지·일일 균열·저장까지 차례로 익힌다.</p></div>
            <div class="info-card"><h3 class="rarity-epic">몬스터 스킬북</h3><p>몬스터는 낮은 확률로 특정 직업과 기술이 적힌 스킬북을 떨어뜨린다. 정예·보스·희귀 지도에서 확률이 높다.</p><p>낡은 책은 Lv.5, 온전한 책은 Lv.8, 금단의 책은 Lv.10까지 기술을 직접 올릴 수 있다.</p></div>
            <div class="info-card"><h3 class="rarity-set">야전 정비 계약</h3><p>한 판당 최대 지출액을 정하면 일반 사냥이 끝난 뒤 부족한 체력과 마나를 자동으로 복구한다.</p><p>1골드는 체력 2 또는 마나 1로 환산되며, 설정한 상한을 전부 쓰는 것이 아니라 실제 부족분에 필요한 골드만 사용한다.</p></div>
            <div class="info-card"><h3>끝없는 심연</h3><p>층마다 적이 강해지고 체력·마나가 다음 층으로 이어진다. 5층마다 보스와 장비 보상이 등장한다.</p></div>
            <div class="info-card"><h3>요일의 대적자</h3><p>하루 한 번 세 난이도 중 하나를 선택한다. 토요일은 세트, 일요일은 유니크 확률이 높다.</p></div>
            <div class="info-card"><h3>잠금·자동 처리</h3><p>중요 장비는 잠그고, 일반 장비는 등급별로 자동 판매·분해할 수 있다. 세트·유니크와 6접사는 별도 보호 가능하다.</p></div>
            <div class="info-card"><h3>접사 추출·계승</h3><p>장비를 파괴해 가장 강한 접사를 추출한다. 성공률은 등급에 따라 1~5%이며 성공한 접사는 다른 장비에 계승할 수 있다.</p></div>
            <div class="info-card"><h3>수집·칭호·용병</h3><p>세트·유니크 수집은 영구 능력치와 보상을 제공한다. 업적으로 칭호를 얻고 용병 한 명을 동행시킬 수 있다.</p></div>
            <div class="info-card"><h3 class="rarity-legendary">눈먼 행상인의 도박</h3><p>무기·갑옷·반지·부적 중 부위만 선택해 현재 성장 수준에 맞는 미확인 장비를 구매한다.</p><p>가격은 레벨과 전투력에 따라 상승하며 세트와 유니크도 극히 낮은 확률로 등장한다. 장비 발견 수치는 도박 확률에 영향을 주지 않는다.</p></div>
            <div class="info-card"><h3>모바일 전리품 수령</h3><p>사냥 중 획득한 장비와 회복품은 별도의 확인창 없이 즉시 전리품 가방과 회복품 가방에 들어간다.</p><p>스킬북도 기술서 보관함으로 자동 이동하며, 획득 내용은 전투 기록과 메뉴의 보유 수량으로 확인한다.</p></div>
            <div class="info-card"><h3>활력 제한</h3><p>일반 사냥은 활력 1, 희귀 지도는 활력 3을 사용합니다.</p><p>최대 60이며 10분마다 1 회복됩니다. 활력이 없으면 자동 사냥도 멈춥니다.</p></div>
            <div class="info-card"><h3>마나와 기술</h3><p>직업마다 고유 기술과 마나 소모량이 다릅니다. 마나가 부족하면 기본 공격으로 계속 전투합니다.</p><p>승리 후 최대 마나의 5%를 회복하고, 마나약과 혼합 영약으로 추가 회복할 수 있습니다.</p></div>
            <div class="info-card"><h3>회복품 선택</h3><p>전투 후 치유약·마나약·혼합 영약을 발견할 수 있습니다.</p><p>수동 사냥에서는 즉시 사용·보관·판매를 선택하며, 자동 사냥에서는 자동 보관됩니다.</p></div>
            <div class="info-card"><h3>장비 분해와 재련</h3><p>필요 없는 장비를 분해하면 별가루를 얻습니다.</p><p>재련은 접두사·접미사의 종류를 유지하면서 수치만 다시 추첨합니다.</p></div>
            <div class="info-card"><h3>전리품 피버</h3><p>승리·정예·변이 처치로 게이지가 차며, 100이 되면 다음 3회 보상이 크게 증가합니다.</p><p>피버 중에는 골드·경험치·장비·희귀 지도 확률이 상승합니다.</p></div>
            <div class="info-card"><h3>변이 몬스터</h3><p>황금빛·거대한·광폭한·보물에 홀린 몬스터가 낮은 확률로 출현합니다.</p><p>각 변이는 위험도와 보상 구조가 다르며 도감에도 기록됩니다.</p></div>
            <div class="info-card"><h3>느린 성장 곡선</h3><p>레벨업 요구 경험치가 크게 증가했고 일반 사냥 경험치와 골드가 감소했습니다.</p><p>레벨당 능력치 포인트는 2이며, 3레벨마다 스킬 포인트를 1 얻습니다.</p></div>
            <div class="info-card"><h3>직업 스킬</h3><p>직업별 기술 3개가 전투 턴에 맞춰 자동 사용됩니다.</p><p>기술서 포인트로 최대 10레벨까지 강화할 수 있습니다.</p></div>
            <div class="info-card"><h3>일일 던전과 아레나</h3><p>일일 던전은 하루 3회 도전·1회 클리어 제한이며, 아레나는 하루 입장권 5장을 제공합니다.</p><p>아레나는 다른 사냥꾼의 기록을 본뜬 잔영과 겨루는 비동기 결투입니다.</p></div>
          </div>`;
      } else {
        const r = state.records;
        const rows = [
          ["사냥꾼", state.nickname || "무명의 사냥꾼"],
          ["현재 직업", currentClass()?.name || "미선택"],
          ["직업 숙련도", fmt(state.classId ? state.mastery[state.classId] || 0 : 0)],
          ["현재 레벨 / 전투력", `${fmt(state.level)} / ${fmt(power())}`],
          ["인벤토리", `${fmt(state.inventory.length)} / ${fmt(state.inventoryCapacity)}`],
          ["총 처치", fmt(r.kills)], ["승리 / 패배", `${fmt(r.wins)} / ${fmt(r.defeats)}`],
          ["최고 피해", fmt(r.highestDamage)], ["최고 연속 처치", fmt(r.bestStreak)],
          ["획득 장비", fmt(r.items)], ["판매한 장비", fmt(r.itemsSold || 0)],
          ["회복품 발견 / 사용", `${fmt(r.recoveryDrops || 0)} / ${fmt(r.recoveryUsed || 0)}`],
          ["활력 물약 발견 / 사용", `${fmt(r.staminaPotionDrops || 0)} / ${fmt(r.staminaPotionsUsed || 0)}`],
          ["숫자 봉인 성공 / 도전", `${fmt(r.numberBaseballWins || 0)} / ${fmt(r.numberBaseballGames || 0)}`],
          ["미니게임 활력 획득", fmt(r.staminaEarnedFromGames || 0)],
          ["스킬북 발견 / 사용 / 판매", `${fmt(r.skillBooksDropped || 0)} / ${fmt(r.skillBooksUsed || 0)} / ${fmt(r.skillBooksSold || 0)}`],
          ["야전 정비 전투 / 지출", `${fmt(r.fieldCareBattles || 0)} / ${fmt(r.fieldCareGoldSpent || 0)}G`],
          ["야전 정비 HP / MP", `${fmt(r.fieldCareHpRestored || 0)} / ${fmt(r.fieldCareMpRestored || 0)}`],
          ["자동 판매 / 자동 분해", `${fmt(r.autoSoldItems || 0)} / ${fmt(r.autoSalvagedItems || 0)}`],
          ["접사 추출 / 성공 / 계승", `${fmt(r.affixExtractionAttempts || 0)} / ${fmt(r.affixExtractionSuccesses || 0)} / ${fmt(r.affixInheritances || 0)}`],
          ["심연 최고 / 승리", `${fmt(r.abyssBestFloor || 0)}층 / ${fmt(r.abyssWins || 0)}`],
          ["일일 보스 승리 / 도전", `${fmt(r.dailyBossWins || 0)} / ${fmt(r.dailyBossAttempts || 0)}`],
          ["희귀 몬스터 처치 / 도주", `${fmt(r.rareMonsterKills || 0)} / ${fmt(r.rareMonsterEscapes || 0)}`],
          ["용병 고용 / 유니크 진화", `${fmt(r.mercenariesHired || 0)} / ${fmt(r.uniqueEvolutions || 0)}`],
          ["도박 횟수 / 골드 지출", `${fmt(r.gambleCount || 0)} / ${fmt(r.gambleGoldSpent || 0)}G`],
          ["도박 영웅 이상 / 세트·유니크", `${fmt(r.gambleEpicPlus || 0)} / ${fmt(r.gambleSpecialItems || 0)}`],
          ["능력치 초기화 / 골드 지출", `${fmt(r.statResets || 0)} / ${fmt(r.statResetGoldSpent || 0)}G`],
          ["가이드 미션", `${fmt(r.guideMissionsClaimed || 0)} / ${guideMissions.length}`],
          ["정예 / 변이 처치", `${fmt(r.eliteKills || 0)} / ${fmt(r.mutatedKills || 0)}`],
          ["분해 / 재련", `${fmt(r.itemsSalvaged || 0)} / ${fmt(r.reforges || 0)}`],
          ["현상금 / 퀘스트", `${fmt(r.bountiesClaimed || 0)} / ${fmt(r.questsClaimed || 0)}`],
          ["일일 던전", fmt(r.dailyClears || 0)],
          ["아레나 승 / 패", `${fmt(r.arenaWins || 0)} / ${fmt(r.arenaLosses || 0)}`],
          ["스킬 강화", fmt(r.skillUpgrades || 0)],
          ["출석 / 동급 각인", `${fmt(r.attendanceClaims || 0)} / ${fmt(r.tierRerolls || 0)}`],
          ["6접사 장비", fmt(r.sixAffixItems || 0)],
          ["특수 감정 꽝 / 대박", `${fmt(r.specialDuds || 0)} / ${fmt(r.specialJackpots || 0)}`],
          ["도감 점수", fmt(codexScoreValue())],
          ["전설 / 세트 / 유니크", `${fmt(r.legendary)} / ${fmt(r.setItems || 0)} / ${fmt(r.uniqueItems || 0)}`], ["희귀 지도", fmt(r.rareMaps)],
          ["총 획득 골드", fmt(r.totalGold)], ["거래 횟수", fmt(state.market.trades || 0)]
        ];
        els.infoContent.innerHTML = `
          <div class="information-record-header">
            <div>
              <span>ADVENTURE RECORD</span>
              <h3>${state.nickname || "무명의 사냥꾼"}의 전과 기록</h3>
            </div>
            <strong>Lv.${fmt(state.level)}</strong>
          </div>
          <div class="info-card information-record-card">
            ${rows.map(([k,v]) => `<div class="record"><span>${k}</span><strong>${v}</strong></div>`).join("")}
          </div>`;
      }
    }

    function bountyMetric(type) {
      const r = state.records;
      return ({
        kills: r.kills || 0,
        eliteKills: r.eliteKills || 0,
        items: r.items || 0,
        recoveryDrops: r.recoveryDrops || 0,
        mutatedKills: r.mutatedKills || 0,
        itemsSalvaged: r.itemsSalvaged || 0,
        marketTrades: r.marketTrades || 0
      })[type] || 0;
    }

    function generateBounties() {
      const pool = [...bountyTemplates].sort(() => Math.random() - .5).slice(0, 3);
      state.bounties = {
        createdAt: Date.now(),
        missions: pool.map((tpl, index) => {
          const target = Math.floor(tpl.min + Math.random() * (tpl.max - tpl.min + 1));
          return {
            id:`${Date.now()}-${index}-${tpl.type}`,
            type:tpl.type, name:tpl.name, desc:tpl.desc,
            target, start:bountyMetric(tpl.type),
            gold:tpl.gold + target * 12,
            dust:tpl.dust + Math.floor(target / 3),
            claimed:false
          };
        })
      };
    }

    function ensureBounties() {
      if (!state.bounties || !Array.isArray(state.bounties.missions) || !state.bounties.missions.length) generateBounties();
    }

    function bountyProgress(mission) {
      return Math.max(0, bountyMetric(mission.type) - mission.start);
    }

    function claimBounty(id) {
      ensureBounties();
      const mission = state.bounties.missions.find(m => m.id === id);
      if (!mission || mission.claimed || bountyProgress(mission) < mission.target) return;
      mission.claimed = true;
      state.gold += mission.gold;
      state.dust += mission.dust;
      state.records.totalGold += mission.gold;
      state.records.bountiesClaimed = (state.records.bountiesClaimed || 0) + 1;
      log(`현상금 [${mission.name}] 완료 · 골드 +${fmt(mission.gold)} · 별가루 +${fmt(mission.dust)}`, "rarity-epic");
      toast("현상금 보상을 받았습니다.");
      saveState();
      renderAll();
    }

    function refreshBounties() {
      ensureBounties();
      const allClaimed = state.bounties.missions.every(m => m.claimed);
      const cost = allClaimed ? 0 : 180;
      if (state.gold < cost) return toast(`갱신 골드가 부족합니다. 필요 ${cost}`);
      if (cost) state.gold -= cost;
      generateBounties();
      log(`현상금 목록 갱신${cost ? ` · 골드 -${cost}` : " · 완료 보너스 무료"}`, "neutral");
      saveState();
      renderAll();
    }

    function renderBounties() {
      ensureBounties();
      const readyCount = state.bounties.missions.filter(m => !m.claimed && bountyProgress(m) >= m.target).length;
      els.bountyNavCount.textContent = readyCount ? `(${readyCount})` : "";
      els.bountyDust.textContent = `별가루 ${fmt(state.dust)}`;
      const allClaimed = state.bounties.missions.every(m => m.claimed);
      els.refreshBountiesBtn.textContent = allClaimed ? "새 의뢰 무료 받기" : "의뢰 갱신 · 180G";
      els.bountyGrid.innerHTML = state.bounties.missions.map(mission => {
        const progress = Math.min(mission.target, bountyProgress(mission));
        const complete = progress >= mission.target;
        const pct = mission.target ? progress / mission.target * 100 : 100;
        return `
          <article class="bounty-card ${complete ? "complete" : ""} ${mission.claimed ? "claimed" : ""}">
            <div class="rarity ${complete ? "positive" : "neutral"}">${mission.claimed ? "보상 수령 완료" : complete ? "완료" : "진행 중"}</div>
            <div class="bounty-name">${mission.name}</div>
            <div class="notice">${mission.desc}</div>
            <div class="meter-wrap">
              <div class="meter-label"><span>진행도</span><span>${fmt(progress)} / ${fmt(mission.target)}</span></div>
              <div class="meter xp"><div style="width:${pct}%"></div></div>
            </div>
            <div class="bounty-reward">골드 ${fmt(mission.gold)} · 별가루 ${fmt(mission.dust)}</div>
            <div class="mini-buttons">
              <button class="primary" data-claim-bounty="${mission.id}" ${!complete || mission.claimed ? "disabled" : ""}>보상 받기</button>
            </div>
          </article>`;
      }).join("");
      els.bountyGrid.querySelectorAll("[data-claim-bounty]").forEach(btn => btn.onclick = () => claimBounty(btn.dataset.claimBounty));
    }

    function localDateKey() {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth()+1).padStart(2,"0");
      const day = String(d.getDate()).padStart(2,"0");
      return `${year}-${month}-${day}`;
    }

    function inferredStatPointsSpent() {
      const baseAttributeTotal = Object.keys(attributeInfo).length * 5;
      const classStartBonus = state.classId
        ? Object.values(classes[state.classId]?.start || {}).reduce((sum,value) => sum + Number(value || 0),0)
        : 0;
      const currentAttributeTotal = Object.values(state.attributes || {})
        .reduce((sum,value) => sum + Number(value || 0),0);
      return Math.max(0,Math.round(currentAttributeTotal-baseAttributeTotal-classStartBonus));
    }

    function hasExistingManualSave() {
      try {
        return [1,2,3].some(slot => !!localStorage.getItem(saveSlotKey(slot)));
      } catch (error) {
        return false;
      }
    }

    function synchronizeRetroactiveGuideRecords() {
      state.records = state.records || {};
      state.records.statPointsSpent = Math.max(
        Number(state.records.statPointsSpent || 0),
        inferredStatPointsSpent()
      );
      if (Object.values(state.equipment || {}).some(Boolean)) {
        state.records.itemsEquipped = Math.max(Number(state.records.itemsEquipped || 0),1);
      }
      if (hasExistingManualSave()) {
        state.records.manualSaves = Math.max(Number(state.records.manualSaves || 0),1);
      }
    }

    function guideMetric(type) {
      const r = state.records;
      if (type === "codex") return Object.keys(state.codex || {}).length;
      if (type === "statPointsSpent") {
        return Math.max(Number(r.statPointsSpent || 0),inferredStatPointsSpent());
      }
      if (type === "itemsEquipped") {
        return Math.max(Number(r.itemsEquipped || 0),Object.values(state.equipment || {}).some(Boolean) ? 1 : 0);
      }
      if (type === "manualSaves") {
        return Math.max(Number(r.manualSaves || 0),hasExistingManualSave() ? 1 : 0);
      }
      return ({
        kills:r.kills || 0, items:r.items || 0,
        skillUpgrades:r.skillUpgrades || 0, questsClaimed:r.questsClaimed || 0,
        numberBaseballGames:r.numberBaseballGames || 0, dailyClears:r.dailyClears || 0
      })[type] || 0;
    }

    function guideCurrentIndex() {
      const index = guideMissions.findIndex(mission => !state.guide.claimed[mission.id]);
      return index < 0 ? guideMissions.length : index;
    }

    function guideRewardText(reward={}) {
      return [
        reward.gold ? `골드 ${fmt(reward.gold)}` : "",
        reward.dust ? `별가루 ${fmt(reward.dust)}` : "",
        reward.skill ? `스킬 포인트 ${fmt(reward.skill)}` : "",
        reward.health ? `치유약 ${fmt(reward.health)}` : "",
        reward.staminaPotion ? `활력 물약 ${fmt(reward.staminaPotion)}` : "",
        reward.tierStone ? `동급 각인석 ${fmt(reward.tierStone)}` : "",
        reward.book ? "온전한 스킬북 1권" : ""
      ].filter(Boolean).join(" · ");
    }

    function grantGuideReward(reward={}) {
      if (reward.gold) {
        state.gold += reward.gold;
        state.records.totalGold += reward.gold;
      }
      if (reward.dust) state.dust += reward.dust;
      if (reward.skill) state.skillPoints += reward.skill;
      if (reward.health) state.consumables.health += reward.health;
      if (reward.staminaPotion) state.consumables.stamina += reward.staminaPotion;
      if (reward.tierStone) state.materials.sameTierRunes += reward.tierStone;
      if (reward.book) storeSkillBook(generateSkillBook(state.classId || null,"complete"));
    }

    function claimGuideMission(id) {
      const mission = guideMissions[guideCurrentIndex()];
      if (!mission || mission.id !== id || state.guide.claimed[id]) return;
      if (guideMetric(mission.type) < mission.target) return toast("아직 가이드 목표를 달성하지 못했습니다.");
      state.guide.claimed[id] = true;
      grantGuideReward(mission.reward);
      state.records.guideMissionsClaimed = (state.records.guideMissionsClaimed || 0)+1;
      log(`가이드 미션 완료 · ${mission.name} · ${guideRewardText(mission.reward)}`,"rarity-epic");
      toast(`가이드 완료 · ${mission.name}`);
      saveState();
      renderAll();
    }

    function renderGuide() {
      const currentIndex = guideCurrentIndex();
      const completeAll = currentIndex >= guideMissions.length;
      const completedCount = guideMissions.filter(mission => state.guide.claimed[mission.id]).length;
      els.guideSummaryBadge.textContent = `${completedCount} / ${guideMissions.length} 완료`;

      if (completeAll) {
        els.guideNavMark.textContent = "";
        els.guideCurrentBanner.classList.add("complete");
        els.guideCurrentBanner.innerHTML = `<h3>초보자 길잡이 완료</h3><p>기본적인 모험 준비를 모두 마쳤다. 이제 세트·유니크·일일 균열과 더 높은 사냥터를 자유롭게 노려라.</p>`;
        els.guideMiniTracker.innerHTML = `<div class="guide-all-complete">모든 가이드 미션 완료<br><strong>${state.nickname || "사냥꾼"}</strong>의 진짜 사냥이 시작된다.</div>`;
      } else {
        const current = guideMissions[currentIndex];
        const progress = Math.min(current.target,guideMetric(current.type));
        const ready = progress >= current.target;
        els.guideNavMark.textContent = ready ? "(!)" : "";
        els.guideCurrentBanner.classList.toggle("complete",ready);
        els.guideCurrentBanner.innerHTML = `
          <div class="guide-step">GUIDE ${currentIndex+1} / ${guideMissions.length}</div>
          <h3>${ready ? "목표 달성 · " : ""}${current.name}</h3>
          <p>${current.desc}<br>진행도 ${fmt(progress)} / ${fmt(current.target)} · 보상 ${guideRewardText(current.reward)}</p>
          <div class="guide-current-actions">
            ${ready ? `<button class="primary-guide" data-guide-claim="${current.id}">완료 보상 받기</button>` : `<button data-guide-move="${current.page}">해당 화면으로 이동</button>`}
          </div>`;

        els.guideMiniTracker.innerHTML = `
          <div class="guide-mini-step">GUIDE ${currentIndex+1} / ${guideMissions.length}</div>
          <div class="guide-mini-name">${ready ? "목표 달성 · " : ""}${current.name}</div>
          <div class="guide-mini-desc">${current.desc}</div>
          <div class="meter-wrap">
            <div class="meter-label"><span>진행도</span><span>${fmt(progress)} / ${fmt(current.target)}</span></div>
            <div class="meter xp"><div style="width:${current.target ? progress/current.target*100 : 100}%"></div></div>
          </div>
          <div class="guide-mini-actions">
            ${ready ? `<button class="primary-guide" data-guide-mini-claim="${current.id}">완료 보상 받기</button>` : `<button data-guide-mini-move="${current.page}">미션 위치로 이동</button>`}
            <button data-guide-mini-open="guide">전체 가이드 보기</button>
          </div>`;
      }

      els.guideMissionGrid.innerHTML = guideMissions.map((mission,index) => {
        const claimed = !!state.guide.claimed[mission.id];
        const active = index === currentIndex;
        const progress = claimed ? mission.target : Math.min(mission.target,guideMetric(mission.type));
        const ready = active && progress >= mission.target;
        return `
          <article class="guide-mission-card ${claimed ? "done" : active ? ready ? "claimable" : "active" : "locked"}">
            <div class="guide-status-stamp ${claimed ? "done" : ready ? "ready" : ""}">${claimed ? "완료됨" : ready ? "보상 대기" : active ? "진행 중" : "잠김"}</div>
            <div class="guide-step">STEP ${index+1}</div>
            <div class="guide-mission-name">${mission.name}</div>
            <div class="guide-mission-desc">${mission.desc}</div>
            <div class="meter-wrap">
              <div class="meter-label"><span>진행도</span><span>${fmt(progress)} / ${fmt(mission.target)}</span></div>
              <div class="meter xp"><div style="width:${mission.target ? progress/mission.target*100 : 100}%"></div></div>
            </div>
            <div class="guide-reward">${guideRewardText(mission.reward)}</div>
            <div class="mini-buttons">
              ${claimed ? `<button class="quest-finished-button" disabled>✓ 완료됨</button>` :
                ready ? `<button class="primary" data-guide-card-claim="${mission.id}">보상 받기</button>` :
                active ? `<button data-guide-card-move="${mission.page}">이동</button>` :
                `<button disabled>이전 단계 필요</button>`}
            </div>
          </article>`;
      }).join("");

      document.querySelectorAll("[data-guide-claim],[data-guide-mini-claim],[data-guide-card-claim]").forEach(btn => {
        btn.onclick = () => claimGuideMission(btn.dataset.guideClaim || btn.dataset.guideMiniClaim || btn.dataset.guideCardClaim);
      });
      document.querySelectorAll("[data-guide-move],[data-guide-mini-move],[data-guide-card-move]").forEach(btn => {
        btn.onclick = () => switchPage(btn.dataset.guideMove || btn.dataset.guideMiniMove || btn.dataset.guideCardMove);
      });
      document.querySelectorAll("[data-guide-mini-open]").forEach(btn => btn.onclick = () => switchPage("guide"));
    }

    function questMetric(type) {
      const r = state.records;
      if (type === "level") return state.level;
      if (type === "zones") return Object.keys(state.zonesVisited || {}).filter(k => state.zonesVisited[k]).length;
      if (type === "codex") return Object.keys(state.codex || {}).length;
      return ({
        kills:r.kills || 0,
        items:r.items || 0,
        rareMaps:r.rareMaps || 0,
        dailyClears:r.dailyClears || 0,
        arenaWins:r.arenaWins || 0,
        legendary:r.legendary || 0,
        skillUpgrades:r.skillUpgrades || 0
      })[type] || 0;
    }

    function claimQuest(id) {
      const quest = questDefinitions.find(q => q.id === id);
      if (!quest || state.quests.claimed[id] || questMetric(quest.type) < quest.target) return;
      state.quests.claimed[id] = true;
      const reward = quest.reward;
      if (reward.gold) {
        state.gold += reward.gold;
        state.records.totalGold += reward.gold;
      }
      if (reward.dust) state.dust += reward.dust;
      if (reward.skill) state.skillPoints += reward.skill;
      if (reward.health) state.consumables.health += reward.health;
      if (reward.mana) state.consumables.mana += reward.mana;
      state.records.questsClaimed = (state.records.questsClaimed || 0) + 1;
      log(`퀘스트 [${quest.name}] 완료 · ${reward.gold ? `골드 +${reward.gold} ` : ""}${reward.dust ? `별가루 +${reward.dust} ` : ""}${reward.skill ? `스킬 포인트 +${reward.skill}` : ""}`, "rarity-epic");
      toast("퀘스트 보상을 받았습니다.");
      saveState();
      renderAll();
    }

    function renderQuests() {
      const completed = questDefinitions.filter(q => state.quests.claimed[q.id]).length;
      const claimable = questDefinitions.filter(q => !state.quests.claimed[q.id] && questMetric(q.type) >= q.target).length;
      els.questSummaryBadge.textContent = `${completed} / ${questDefinitions.length} 완료`;
      els.questNavCount.textContent = claimable ? `(${claimable})` : "";
      els.questGrid.innerHTML = questDefinitions.map(quest => {
        const current = Math.min(quest.target,questMetric(quest.type));
        const complete = current >= quest.target;
        const claimed = !!state.quests.claimed[quest.id];
        const rewardText = [
          quest.reward.gold ? `골드 ${fmt(quest.reward.gold)}` : "",
          quest.reward.dust ? `별가루 ${fmt(quest.reward.dust)}` : "",
          quest.reward.skill ? `스킬 포인트 ${fmt(quest.reward.skill)}` : ""
        ].filter(Boolean).join(" · ");
        const status = claimed
          ? `<div class="quest-complete-stamp">✓ 완료됨 · 보상 수령 완료</div>`
          : complete
            ? `<div class="quest-waiting-stamp">목표 완료 · 보상 대기</div>`
            : `<div class="rarity rarity-rare">진행 중</div>`;
        return `
          <article class="quest-card ${complete ? "complete" : ""} ${claimed ? "claimed" : ""}">
            ${status}
            <div class="quest-name">${quest.name}</div>
            <div class="quest-desc">${claimed ? `${quest.desc} · 이 의뢰는 완전히 종료되었습니다.` : quest.desc}</div>
            <div class="meter-wrap">
              <div class="meter-label"><span>진행도</span><span>${fmt(claimed ? quest.target : current)} / ${fmt(quest.target)}</span></div>
              <div class="meter xp"><div style="width:${claimed || !quest.target ? 100 : current/quest.target*100}%"></div></div>
            </div>
            <div class="quest-reward">${claimed ? `수령한 보상 · ${rewardText}` : `완료 보상 · ${rewardText}`}</div>
            <div class="mini-buttons">
              ${claimed ? `<button class="quest-finished-button" disabled>✓ 완료됨</button>` :
                complete ? `<button class="primary" data-claim-quest="${quest.id}">보상 받기</button>` :
                `<button disabled>진행 중</button>`}
            </div>
          </article>`;
      }).join("");
      els.questGrid.querySelectorAll("[data-claim-quest]").forEach(btn => btn.onclick = () => claimQuest(btn.dataset.claimQuest));
    }

    function dateKeyDayNumber(key) {
      if (!key) return null;
      const [y,m,d] = key.split("-").map(Number);
      if (![y,m,d].every(Number.isFinite)) return null;
      return Math.floor(new Date(y,m-1,d,12,0,0).getTime()/86400000);
    }

    function attendanceClaimable() {
      return state.attendance.lastClaimDate !== localDateKey();
    }

    function currentAttendanceReward() {
      return attendanceRewards[state.attendance.cycleIndex % attendanceRewards.length];
    }

    function grantAttendanceReward(rewardDef) {
      const reward = rewardDef.reward || {};
      if (reward.gold) {
        state.gold += reward.gold;
        state.records.totalGold += reward.gold;
      }
      if (reward.dust) state.dust += reward.dust;
      if (reward.skill) state.skillPoints += reward.skill;
      if (reward.health) state.consumables.health += reward.health;
      if (reward.mana) state.consumables.mana += reward.mana;
      if (reward.elixir) state.consumables.elixir += reward.elixir;
      if (reward.stamina) state.stamina = Math.min(STAMINA_MAX,state.stamina+reward.stamina);

      if (reward.lootBox) {
        const rewardZone = [...zones].reverse().find(zoneDef => power() >= zoneDef.rec*.72) || zones[0];
        const item = generateItem(rewardZone.mult*1.18,10);
        storeItem(item);
        recordDroppedItem(item);
        log(`출석 상자의 봉인이 풀렸다 · ${item.name}`, item.rarityClass);
      }
    }

    function claimAttendance() {
      if (!attendanceClaimable()) return toast("오늘의 출석 보상은 이미 받았습니다.");
      const today = localDateKey();
      const todayNumber = dateKeyDayNumber(today);
      const previousNumber = dateKeyDayNumber(state.attendance.lastClaimDate);
      state.attendance.streak = previousNumber != null && todayNumber-previousNumber === 1
        ? (state.attendance.streak || 0)+1
        : 1;

      const rewardDef = currentAttendanceReward();
      grantAttendanceReward(rewardDef);
      state.attendance.lastClaimDate = today;
      state.attendance.totalClaims = (state.attendance.totalClaims || 0)+1;
      state.attendance.cycleIndex = (state.attendance.cycleIndex+1)%attendanceRewards.length;
      state.records.attendanceClaims = (state.records.attendanceClaims || 0)+1;

      if (state.attendance.streak > 0 && state.attendance.streak%7 === 0) {
        state.dust += 5;
        log(`연속 출석 ${state.attendance.streak}일 · 별가루 +5`, "rarity-set");
      }

      log(`출석 ${rewardDef.day}일차 · ${rewardDef.name} 수령`, "rarity-epic");
      toast(`${rewardDef.name} 보상 수령`);
      saveState();
      renderAll();
    }

    function renderAttendance() {
      const claimable = attendanceClaimable();
      const reward = currentAttendanceReward();
      els.attendanceNavMark.textContent = claimable ? "(!)" : "";
      els.attendanceStreakBadge.textContent = `연속 ${fmt(state.attendance.streak || 0)}일`;
      els.attendanceTotalBadge.textContent = `누적 ${fmt(state.attendance.totalClaims || 0)}일`;
      els.attendanceBanner.innerHTML = claimable
        ? `<h3>오늘은 ${reward.day}일차 보상</h3><p>${reward.name} · ${reward.text}<br>7일차까지 받은 뒤에는 다시 1일차부터 이어진다.</p>`
        : `<h3>오늘의 흔적을 남겼다</h3><p>다음 보상은 ${currentAttendanceReward().day}일차 · ${currentAttendanceReward().name}. 내일 다시 출석부를 펼쳐 보자.</p>`;

      const currentIndex = state.attendance.cycleIndex % attendanceRewards.length;
      els.attendanceGrid.innerHTML = attendanceRewards.map((entry,index) => `
        <article class="attendance-card ${claimable && index===currentIndex ? "current" : ""} ${!claimable && index===(currentIndex+attendanceRewards.length-1)%attendanceRewards.length ? "claimed-today" : ""}">
          <div class="attendance-day">DAY ${entry.day}</div>
          <div class="attendance-icon"><span>${entry.icon}</span></div>
          <div class="attendance-name">${entry.name}</div>
          <div class="attendance-reward">${entry.text}</div>
        </article>
      `).join("");

      els.attendanceClaimBtn.disabled = !claimable;
      els.attendanceClaimBtn.textContent = claimable ? `${reward.day}일차 보상 받기` : "오늘의 보상 수령 완료";
    }

    function ensureStaminaGame() {
      const today = localDateKey();
      if (state.staminaGame.date !== today) {
        state.staminaGame = {
          date:today,
          tickets:BASEBALL_DAILY_REWARD_GAMES,
          active:false,
          practice:false,
          secret:"",
          attempts:0,
          maxAttempts:8,
          history:[],
          winsToday:0,
          streak:state.staminaGame.streak || 0,
          bestAttempts:state.staminaGame.bestAttempts || null
        };
      }
    }

    function createBaseballSecret() {
      const first = String(1+Math.floor(Math.random()*9));
      const digits = [first];
      while (digits.length < 3) {
        const digit = String(Math.floor(Math.random()*10));
        if (!digits.includes(digit)) digits.push(digit);
      }
      return digits.join("");
    }

    function validateBaseballGuess(value) {
      const guess = String(value || "").trim();
      if (!/^\d{3}$/.test(guess)) return {ok:false,message:"세 자리 숫자를 입력하세요."};
      if (new Set(guess).size !== 3) return {ok:false,message:"서로 다른 숫자 세 개를 입력하세요."};
      if (guess[0] === "0") return {ok:false,message:"첫 숫자는 0이 될 수 없습니다."};
      return {ok:true,guess};
    }

    function evaluateBaseballGuess(secret,guess) {
      let strikes = 0;
      let balls = 0;
      for (let i=0;i<3;i++) {
        if (guess[i] === secret[i]) strikes++;
        else if (secret.includes(guess[i])) balls++;
      }
      return {strikes,balls};
    }

    function grantGameStamina(amount,source,{allowOverflowPotion=true}={}) {
      const normalizedAmount = Math.max(0,Math.round((Number(amount) || 0)*10)/10);
      const before = state.stamina;
      state.stamina = Math.min(STAMINA_MAX,Math.round((state.stamina+normalizedAmount)*10)/10);
      state.staminaUpdatedAt = Date.now();
      const gained = Math.round((state.stamina-before)*10)/10;
      const overflow = Math.max(0,Math.round((normalizedAmount-gained)*10)/10);
      let potionBonus = 0;
      if (allowOverflowPotion && overflow > 0) {
        potionBonus = Math.max(1,Math.ceil(overflow/12));
        state.consumables.stamina = (state.consumables.stamina || 0)+potionBonus;
      }
      state.records.staminaEarnedFromGames = Math.round(((state.records.staminaEarnedFromGames || 0)+gained)*10)/10;
      log(`${source} · 활력 +${fmtStamina(gained)}${potionBonus ? ` · 초과분 활력 물약 +${potionBonus}` : ""}`,"rarity-set");
      return {gained,potionBonus};
    }

    function startBaseballGame() {
      ensureStaminaGame();
      if (state.staminaGame.active) return toast("이미 숫자 봉인을 풀고 있습니다.");

      const practice = state.staminaGame.tickets <= 0;
      if (!practice) state.staminaGame.tickets--;

      state.staminaGame.active = true;
      state.staminaGame.practice = practice;
      state.staminaGame.secret = createBaseballSecret();
      state.staminaGame.attempts = 0;
      state.staminaGame.history = [];
      state.records.numberBaseballGames = (state.records.numberBaseballGames || 0)+1;
      if (practice) {
        state.records.numberBaseballPracticeGames = (state.records.numberBaseballPracticeGames || 0)+1;
      }

      els.baseballGuessInput.value = "";
      log(
        practice
          ? "활력 야영지 · 연습 숫자 봉인을 시작했다. 보상은 10%만 지급된다."
          : `활력 야영지 · 보상 숫자 봉인을 시작했다. 오늘 ${state.staminaGame.tickets}판 남았다.`,
        practice ? "neutral" : "rarity-set"
      );
      saveState();
      renderStaminaCamp();
      setTimeout(() => els.baseballGuessInput.focus(),50);
    }

    function finishBaseballGame(won,reason="") {
      const game = state.staminaGame;
      const practice = !!game.practice;
      let reward = 4;
      let potionReward = 0;

      if (won) {
        reward = game.attempts <= 3 ? 24 : game.attempts <= 5 ? 18 : 12;

        if (!practice) {
          game.streak = (game.streak || 0)+1;
          const streakBonus = Math.min(6,Math.max(0,(game.streak-1)*2));
          reward += streakBonus;
          if (game.attempts <= 3) potionReward = 1;
          game.winsToday = (game.winsToday || 0)+1;
        } else {
          state.records.numberBaseballPracticeWins = (state.records.numberBaseballPracticeWins || 0)+1;
        }

        game.bestAttempts = game.bestAttempts == null ? game.attempts : Math.min(game.bestAttempts,game.attempts);
        state.records.numberBaseballWins = (state.records.numberBaseballWins || 0)+1;
        const oldBest = state.records.numberBaseballBest || 0;
        if (!oldBest || game.attempts < oldBest) state.records.numberBaseballBest = game.attempts;
      } else if (!practice) {
        game.streak = 0;
      }

      if (practice) {
        reward = Math.round(reward*BASEBALL_PRACTICE_REWARD_RATE*10)/10;
        potionReward = 0;
      }

      const rewardSource = practice
        ? won
          ? `연습 숫자 봉인 ${game.attempts}회 만에 해독 · 보상 10%`
          : "연습 숫자 봉인 위로 보상 · 보상 10%"
        : won
          ? `숫자 봉인 ${game.attempts}회 만에 해독`
          : "숫자 봉인 위로 보상";

      const result = grantGameStamina(reward,rewardSource,{allowOverflowPotion:!practice});
      if (potionReward) {
        state.consumables.stamina = (state.consumables.stamina || 0)+potionReward;
        log(`빠른 해독 보너스 · 녹빛 활력 물약 +${potionReward}`,"rarity-set");
      }

      game.active = false;
      const secret = game.secret;
      game.secret = "";
      game.practice = false;
      game.history.unshift({
        final:true,
        won,
        practice,
        secret,
        text:won
          ? `${practice ? "연습 · " : ""}${game.attempts}회 만에 봉인 해독 · 활력 +${fmtStamina(result.gained)}${potionReward ? ` · 물약 +${potionReward}` : ""}`
          : `${practice ? "연습 · " : ""}${reason || "봉인 해독 실패"} · 정답 ${secret} · 활력 +${fmtStamina(result.gained)}`
      });
      game.history = game.history.slice(0,12);
      saveState();
      renderAll();
      toast(
        won
          ? practice ? "연습 숫자 봉인 성공! 보상 10%" : "숫자 봉인 해독 성공!"
          : practice ? "연습 대전이 끝났습니다." : "숫자 봉인이 닫혔습니다."
      );
    }

    function submitBaseballGuess() {
      ensureStaminaGame();
      if (!state.staminaGame.active) return toast("먼저 숫자 봉인을 시작하세요.");
      const validation = validateBaseballGuess(els.baseballGuessInput.value);
      if (!validation.ok) return toast(validation.message);

      const guess = validation.guess;
      const result = evaluateBaseballGuess(state.staminaGame.secret,guess);
      state.staminaGame.attempts++;
      state.staminaGame.history.unshift({
        guess,
        strikes:result.strikes,
        balls:result.balls,
        attempt:state.staminaGame.attempts
      });
      state.staminaGame.history = state.staminaGame.history.slice(0,12);
      els.baseballGuessInput.value = "";

      if (result.strikes === 3) {
        finishBaseballGame(true);
        return;
      }
      if (state.staminaGame.attempts >= state.staminaGame.maxAttempts) {
        finishBaseballGame(false,"8번의 기회를 모두 사용");
        return;
      }

      saveState();
      renderStaminaCamp();
      setTimeout(() => els.baseballGuessInput.focus(),20);
    }

    function giveUpBaseballGame() {
      if (!state.staminaGame.active) return;
      const message = state.staminaGame.practice
        ? "이번 연습 숫자 봉인을 포기할까요?"
        : "이번 숫자 봉인을 포기할까요? 보상 대전 횟수는 돌아오지 않습니다.";
      if (!confirm(message)) return;
      finishBaseballGame(false,"봉인 해독 포기");
    }

    function resetBaseballDemo() {
      state.staminaGame = {
        date:localDateKey(),
        tickets:BASEBALL_DAILY_REWARD_GAMES,
        active:false,
        practice:false,
        secret:"",
        attempts:0,
        maxAttempts:8,
        history:[],
        winsToday:0,
        streak:state.staminaGame.streak || 0,
        bestAttempts:state.staminaGame.bestAttempts || null
      };
      log("시험용 숫자 봉인 보상 대전 5판을 복구했다.","neutral");
      saveState();
      renderAll();
    }

    function renderStaminaCamp() {
      ensureStaminaGame();
      const game = state.staminaGame;
      const active = game.active;
      const remaining = Math.max(0,game.maxAttempts-game.attempts);

      const practiceAvailable = game.tickets <= 0;
      const activePractice = active && !!game.practice;

      els.staminaCampNavMark.textContent = game.tickets > 0 ? `(${game.tickets})` : "(연습)";
      els.baseballTicketBadge.textContent = game.tickets > 0
        ? `보상 대전 ${game.tickets} / ${BASEBALL_DAILY_REWARD_GAMES}`
        : "연습 대전 · 보상 10%";
      els.baseballTicketBadge.classList.toggle("practice",practiceAvailable);
      els.campStaminaBadge.textContent = `활력 ${fmtStamina(state.stamina)} / ${STAMINA_MAX}`;
      els.campPotionBadge.textContent = `활력 물약 ${fmt(state.consumables.stamina || 0)}`;
      els.campPotionCount.textContent = `보유 ${fmt(state.consumables.stamina || 0)}개`;
      els.campUsePotionBtn.disabled = (state.consumables.stamina || 0) <= 0 || state.stamina >= STAMINA_MAX;

      els.baseballStartBtn.disabled = active;
      els.baseballStartBtn.textContent = practiceAvailable
        ? "연습 대전 시작 · 보상 10%"
        : `보상 대전 시작 · ${game.tickets}판 남음`;
      els.baseballStartBtn.classList.toggle("practice",practiceAvailable);
      els.baseballGuessInput.disabled = !active;
      els.baseballGuessBtn.disabled = !active;
      els.baseballGiveUpBtn.disabled = !active;

      els.baseballTitle.textContent = active
        ? `${activePractice ? "연습 " : ""}숫자 봉인 해독 중 · 남은 기회 ${remaining}`
        : practiceAvailable
          ? "점술사의 숫자 봉인 · 연습 대전"
          : "점술사의 숫자 봉인";
      els.baseballStatus.textContent = active
        ? activePractice
          ? `${game.attempts}회 시도했다. 연습 대전은 활력 보상의 10%만 받으며 물약은 지급되지 않는다.`
          : `${game.attempts}회 시도했다. 스트라이크와 볼의 흔적을 읽어 다음 숫자를 골라라.`
        : game.tickets > 0
          ? `오늘 보상 대전이 ${game.tickets}판 남았다. 다 사용한 뒤에도 연습 대전을 계속할 수 있다.`
          : "오늘의 보상 대전 5판을 모두 마쳤다. 이제 무제한 연습 대전에서 활력 보상의 10%를 받는다.";

      els.baseballSeal.classList.toggle("solved",!active && game.history[0]?.final && game.history[0]?.won);
      const sealDigits = active
        ? ["?","?","?"]
        : game.history[0]?.final
          ? String(game.history[0].secret || "???").split("")
          : ["?","?","?"];
      els.baseballSeal.innerHTML = sealDigits.map(digit => `<span>${digit}</span>`).join("");

      els.baseballHistory.innerHTML = game.history.length
        ? game.history.map(entry => {
            if (entry.final) {
              return `<div class="baseball-history-row ${entry.practice ? "practice" : ""}">
                <span>${entry.practice ? "연습" : "결과"}</span>
                <strong>${entry.won ? "해독 성공" : "봉인 종료"}</strong>
                <span class="baseball-result ${entry.won ? "strike" : "out"}">${entry.text}</span>
              </div>`;
            }
            const out = entry.strikes === 0 && entry.balls === 0;
            return `<div class="baseball-history-row">
              <span>${entry.attempt}회</span>
              <strong>${entry.guess}</strong>
              <span class="baseball-result ${entry.strikes ? "strike" : entry.balls ? "ball" : "out"}">${entry.strikes}S ${entry.balls}B</span>
            </div>`;
          }).join("")
        : `<div class="notice">아직 숫자를 던지지 않았다. 첫 숫자는 0이 될 수 없고 세 숫자는 서로 달라야 한다.</div>`;

      els.baseballRecord.innerHTML = `
        <div class="camp-record-grid">
          <div class="stat"><span>누적 도전</span><strong>${fmt(state.records.numberBaseballGames || 0)}</strong></div>
          <div class="stat"><span>누적 성공</span><strong>${fmt(state.records.numberBaseballWins || 0)}</strong></div>
          <div class="stat"><span>최고 기록</span><strong>${state.records.numberBaseballBest ? `${state.records.numberBaseballBest}회` : "-"}</strong></div>
          <div class="stat"><span>보상 대전 연승</span><strong>${fmt(game.streak || 0)}</strong></div>
          <div class="stat"><span>연습 도전</span><strong>${fmt(state.records.numberBaseballPracticeGames || 0)}</strong></div>
          <div class="stat"><span>연습 성공</span><strong>${fmt(state.records.numberBaseballPracticeWins || 0)}</strong></div>
        </div>
      `;
    }

    function ensureDailyDungeon() {
      const today = localDateKey();
      if (state.dailyDungeon.date !== today) {
        state.dailyDungeon = {
          date:today,
          attempts:3,
          cleared:false,
          best:null,
          history:[],
          runLog:[],
          running:false,
          currentWave:0,
          lastResult:""
        };
      }
    }

    function currentDailyTheme() {
      const seed = Number(localDateKey().replaceAll("-",""));
      return dailyDungeonThemes[seed % dailyDungeonThemes.length];
    }

    function createDungeonEnemy(wave, difficulty) {
      const s = totalStats();
      const ratio = difficulty.mult * (1 + (wave-1) * .10);
      const baseDamage = Math.max(s.attack, s.magicPower);
      return {
        name:`${currentDailyTheme().name} 수호자 ${wave}`,
        baseName:`균열 수호자 ${wave}`,
        zoneId:"daily",
        rank: wave === 5 ? "던전 보스" : wave >= 3 ? "던전 정예" : "던전 몬스터",
        mutation:null,
        attack: Math.max(5, (s.defense * .55 + s.maxHp / 15) * ratio),
        defense: Math.max(2, baseDamage * .18 * ratio),
        hp: Math.max(45, s.maxHp * (.62 + wave*.12) * ratio),
        xp:0, gold:0, drop:0, mapMult:1
      };
    }

    function dailyDungeonPause(ms=260) {
      return new Promise(resolve => setTimeout(resolve,ms));
    }

    function pushDailyRunLog(text,cls="neutral",wave=0) {
      state.dailyDungeon.runLog = state.dailyDungeon.runLog || [];
      state.dailyDungeon.runLog.push({
        text,
        cls,
        wave,
        order:state.dailyDungeon.runLog.length+1
      });
      state.dailyDungeon.runLog = state.dailyDungeon.runLog.slice(-90);
      renderDailyRunLog();
    }

    function dailyBattleHighlights(events) {
      if (!Array.isArray(events) || !events.length) return [];
      const chosen = [];
      const used = new Set();

      const add = event => {
        if (!event || used.has(event.text) || chosen.length >= 10) return;
        used.add(event.text);
        chosen.push(event);
      };

      add(events[0]);
      events.slice(1,5).forEach(add);

      events
        .filter(event =>
          /rarity-unique|rarity-legendary|battle-heal|battle-effect|positive/.test(event.cls || "")
        )
        .slice(0,3)
        .forEach(add);

      events.slice(-3).forEach(add);
      return chosen;
    }

    function renderDailyRunLog() {
      const dungeon = state.dailyDungeon;
      if (!els.dailyRunLog || !els.dailyRunProgress || !els.dailyRunStatus) return;

      let status = "공략 대기";
      if (dungeon.running) status = `${Math.max(1,dungeon.currentWave || 1)}/5 웨이브 진행 중`;
      else if (dungeon.lastResult === "cleared") status = "균열 정복 완료";
      else if (dungeon.lastResult === "failed") status = `${dungeon.currentWave || 1}웨이브에서 실패`;

      els.dailyRunStatus.textContent = status;
      els.dailyRunStatus.className = dungeon.running
        ? "running"
        : dungeon.lastResult === "cleared"
          ? "cleared"
          : dungeon.lastResult === "failed"
            ? "failed"
            : "";

      els.dailyRunProgress.innerHTML = Array.from({length:5},(_,index) => {
        const wave = index+1;
        let cls = "";
        if (dungeon.lastResult === "cleared" || wave < dungeon.currentWave) cls = "complete";
        if (dungeon.running && wave === dungeon.currentWave) cls = "current";
        if (!dungeon.running && dungeon.lastResult === "failed" && wave === dungeon.currentWave) cls = "failed";
        return `
          <div class="daily-wave-step ${cls}">
            <span>${wave}</span>
            <strong>${wave === 5 ? "균열핵" : `${wave}웨이브`}</strong>
          </div>
        `;
      }).join("");

      const logEntries = dungeon.runLog || [];
      els.dailyRunLog.innerHTML = logEntries.length
        ? logEntries.map(entry => `
            <div class="daily-run-line ${entry.cls || "neutral"}">
              <span>${String(entry.order || 0).padStart(2,"0")}</span>
              <p>${entry.text}</p>
            </div>
          `).join("")
        : `<div class="daily-run-empty">난이도를 고르고 도전하면 입장부터 보상 획득까지 전투 기록이 이곳에 남습니다.</div>`;

      if (dungeon.running) {
        requestAnimationFrame(() => {
          els.dailyRunLog.scrollTop = els.dailyRunLog.scrollHeight;
        });
      }
    }

    async function runDailyDungeon(difficultyId) {
      ensureDailyDungeon();
      if (state.dailyDungeon.cleared) return toast("오늘의 던전은 이미 클리어했습니다.");
      if (state.dailyDungeon.attempts <= 0) return toast("오늘의 도전 횟수를 모두 사용했습니다.");
      if (isBusy || state.dailyDungeon.running) return;

      const difficulty = dailyDifficulties.find(d => d.id === difficultyId);
      if (!difficulty) return;

      if (autoTimer) toggleAuto();
      isBusy = true;
      state.dailyDungeon.running = true;
      state.dailyDungeon.currentWave = 0;
      state.dailyDungeon.lastResult = "";
      state.dailyDungeon.runLog = [];
      state.dailyDungeon.attempts--;

      const theme = currentDailyTheme();
      const originalHp = state.hp;
      const originalMp = state.mp;
      const s = totalStats();
      state.hp = s.maxHp;
      state.mp = s.maxMp;

      let cleared = true;
      let totalTurns = 0;
      let waveReached = 0;
      const rewardItems = [];

      pushDailyRunLog(
        `[균열 개방] ${theme.name} · ${difficulty.name} 난이도에 입장했다. 입장권이 1장 소모되었다.`,
        "rarity-epic"
      );
      pushDailyRunLog(
        `공략 시작 상태 · HP ${fmt(state.hp)}/${fmt(s.maxHp)} · MP ${fmt(state.mp)}/${fmt(s.maxMp)} · 5연전`,
        "battle-start"
      );
      log(`[일일 던전] ${theme.name} · ${difficulty.name} 난이도 입장`, "rarity-epic");
      renderDailyDungeon();

      requestAnimationFrame(() => {
        els.dailyRunPanel?.scrollIntoView({behavior:"smooth",block:"nearest"});
      });
      await dailyDungeonPause(420);

      for (let wave=1; wave<=5; wave++) {
        state.dailyDungeon.currentWave = wave;
        const enemy = createDungeonEnemy(wave,difficulty);

        pushDailyRunLog(
          `[${wave}/5] ${enemy.name} 출현 · ${enemy.rank} · HP ${fmt(enemy.hp)} · 공격 ${fmt(enemy.attack)} · 방어 ${fmt(enemy.defense)}`,
          wave === 5 ? "rarity-legendary" : "battle-start",
          wave
        );
        renderDailyDungeon();
        await dailyDungeonPause(wave === 5 ? 520 : 320);

        const result = simulateBattle(enemy);
        const highlights = dailyBattleHighlights(result.events);

        for (const event of highlights) {
          pushDailyRunLog(`[${wave}/5] ${event.text}`,event.cls || "neutral",wave);
          await dailyDungeonPause(70);
        }

        totalTurns += result.turns;
        waveReached = wave;
        state.hp = result.heroHp;
        state.mp = result.heroMp;

        if (!result.won) {
          cleared = false;
          pushDailyRunLog(
            `[${wave}/5] 전투 불능 · ${result.turns}막 · 균열 수호자를 돌파하지 못했다.`,
            "negative",
            wave
          );
          break;
        }

        pushDailyRunLog(
          `[${wave}/5] 돌파 성공 · ${result.turns}막 · 남은 HP ${fmt(state.hp)} · MP ${fmt(state.mp)}`,
          wave === 5 ? "rarity-legendary" : "positive",
          wave
        );

        if (wave < 5) {
          const currentStats = totalStats();
          const beforeHp = state.hp;
          const beforeMp = state.mp;
          state.hp = Math.min(currentStats.maxHp,state.hp+Math.round(currentStats.maxHp*.12));
          state.mp = Math.min(currentStats.maxMp,state.mp+Math.round(currentStats.maxMp*.10));
          pushDailyRunLog(
            `균열 사이의 짧은 휴식 · HP +${fmt(state.hp-beforeHp)} · MP +${fmt(state.mp-beforeMp)}`,
            "battle-heal",
            wave
          );
        }

        renderDailyDungeon();
        await dailyDungeonPause(300);
      }

      state.hp = originalHp;
      state.mp = originalMp;

      if (cleared) {
        state.dailyDungeon.cleared = true;
        state.dailyDungeon.best = {difficulty:difficulty.id,turns:totalTurns};
        state.records.dailyClears = (state.records.dailyClears || 0)+1;

        const rewardMult = difficulty.rewardMult;
        const goldReward = Math.round(260*rewardMult*theme.gold);
        const dustReward = Math.round(7*rewardMult*theme.dust);
        const skillReward = Math.round((difficulty.id === "nightmare" ? 1 : 0)+theme.skill);
        const tierStoneReward =
          (difficulty.id === "normal" ? 1 : difficulty.id === "hard" ? 2 : 3)+
          (theme.id === "arcane" ? 1 : 0);

        state.gold += goldReward;
        state.dust += dustReward;
        state.skillPoints += skillReward;
        state.materials.sameTierRunes += tierStoneReward;
        state.records.totalGold += goldReward;

        pushDailyRunLog(
          `[균열핵 파괴] ${totalTurns}막에 걸친 5연전이 끝났다. 균열이 안정되기 시작한다.`,
          "rarity-legendary",
          5
        );

        if (theme.id === "supply") {
          const healthReward = 2+(difficulty.id !== "normal" ? 1 : 0);
          const manaReward = 2+(difficulty.id === "nightmare" ? 1 : 0);
          const staminaReward = difficulty.id === "nightmare" ? 2 : 1;
          const elixirReward = difficulty.id === "nightmare" ? 2 : 1;
          state.consumables.health += healthReward;
          state.consumables.mana += manaReward;
          state.consumables.stamina += staminaReward;
          state.consumables.elixir += elixirReward;
          pushDailyRunLog(
            `보급 균열 회수 · 체력약 +${healthReward} · 마나약 +${manaReward} · 활력약 +${staminaReward} · 영약 +${elixirReward}`,
            "battle-heal"
          );
        }

        const itemCount = theme.items+(difficulty.id === "hard" ? 1 : difficulty.id === "nightmare" ? 2 : 0);
        for (let i=0; i<itemCount; i++) {
          const bonus = difficulty.id === "nightmare" ? 8 : difficulty.id === "hard" ? 4 : 2;
          const dailyZone = [...zones].reverse().find(z => power() >= z.rec*.75) || zones[0];
          const item = generateItem(dailyZone.mult*(1+difficulty.rewardMult*.18),bonus);
          storeItem(item);
          recordDroppedItem(item);
          rewardItems.push(item);
        }

        pushDailyRunLog(
          `핵심 보상 · 골드 +${fmt(goldReward)} · 별가루 +${fmt(dustReward)} · 동급 각인석 +${tierStoneReward}${skillReward ? ` · 스킬 포인트 +${skillReward}` : ""}`,
          "rarity-set"
        );

        rewardItems.forEach((item,index) => {
          pushDailyRunLog(
            `전리품 ${index+1} · ${item.name} · ${item.rarityName} · 장비 점수 ${fmt(item.score)}`,
            item.rarityClass || "positive"
          );
        });

        const line = `${difficulty.name} 클리어 · ${totalTurns}턴 · 골드 +${fmt(goldReward)} · 별가루 +${fmt(dustReward)} · 동급 각인석 +${tierStoneReward}${skillReward ? ` · 스킬 포인트 +${skillReward}` : ""}`;
        state.dailyDungeon.history.unshift(line);
        state.dailyDungeon.history = state.dailyDungeon.history.slice(0,5);
        state.dailyDungeon.lastResult = "cleared";
        log(`[일일 던전] ${line}`, "rarity-legendary");
        toast("오늘의 균열 정복 완료!");
      } else {
        const line = `${difficulty.name} 실패 · ${waveReached}웨이브 도달`;
        state.dailyDungeon.history.unshift(line);
        state.dailyDungeon.history = state.dailyDungeon.history.slice(0,5);
        state.dailyDungeon.lastResult = "failed";
        pushDailyRunLog(
          `[균열 붕괴] ${waveReached}웨이브에서 후퇴했다. 다음 도전에서는 처음부터 다시 진입한다.`,
          "negative",
          waveReached
        );
        log(`[일일 던전] ${line}`, "negative");
        toast(`${waveReached}웨이브에서 공략 실패`);
      }

      state.dailyDungeon.running = false;
      isBusy = false;
      saveState();
      renderAll();
    }

    function resetDailyDungeonDemo() {
      state.dailyDungeon = {
        date:localDateKey(),
        attempts:3,
        cleared:false,
        best:null,
        history:[],
        runLog:[],
        running:false,
        currentWave:0,
        lastResult:""
      };
      log("오늘의 균열 입장권을 시험용으로 복구했다.", "neutral");
      saveState();
      renderAll();
    }

    function renderDailyDungeon() {
      ensureDailyDungeon();
      const theme = currentDailyTheme();
      els.dailyTicketBadge.textContent = state.dailyDungeon.running
        ? `공략 중 · ${Math.max(1,state.dailyDungeon.currentWave || 1)}/5`
        : state.dailyDungeon.cleared
          ? "오늘 클리어 완료"
          : `도전 ${state.dailyDungeon.attempts} / 3`;
      els.dailyTicketBadge.classList.toggle("running",!!state.dailyDungeon.running);
      els.dailyTierStoneBadge.textContent = `동급 각인석 ${fmt(state.materials.sameTierRunes || 0)}`;
      els.dailyTheme.innerHTML = `
        <h3>${theme.name}</h3>
        <div class="daily-desc">${theme.desc}</div>
        <div class="daily-reward">오늘의 특수 보상: ${theme.id === "gold" ? "골드 ×2" : theme.id === "arcane" ? "스킬 포인트 +1" : theme.id === "supply" ? "회복품 대량 지급" : "장비 추가 드롭"}</div>
      `;
      els.dailyGrid.innerHTML = dailyDifficulties.map(diff => `
        <article class="daily-card ${state.dailyDungeon.cleared && state.dailyDungeon.best?.difficulty === diff.id ? "cleared" : ""}">
          <div class="rarity ${diff.id === "nightmare" ? "rarity-legendary" : diff.id === "hard" ? "rarity-epic" : "rarity-rare"}">${diff.name}</div>
          <div class="daily-name">5연전 ${diff.name}</div>
          <div class="daily-desc">${diff.recText}<br>보상 배율 ×${diff.rewardMult}</div>
          <div class="daily-reward">골드 ${fmt(Math.round(260*diff.rewardMult*theme.gold))} · 별가루 ${fmt(Math.round(7*diff.rewardMult*theme.dust))}<br>동급 각인석 ${diff.id === "normal" ? 1 : diff.id === "hard" ? 2 : 3}${theme.id === "arcane" ? " +1" : ""}</div>
          <div class="mini-buttons">
            <button class="primary" data-daily-run="${diff.id}" ${state.dailyDungeon.running || state.dailyDungeon.cleared || state.dailyDungeon.attempts<=0 ? "disabled" : ""}>${state.dailyDungeon.running ? "공략 진행 중" : "도전하기"}</button>
          </div>
        </article>
      `).join("");
      els.dailyGrid.querySelectorAll("[data-daily-run]").forEach(btn => btn.onclick = () => runDailyDungeon(btn.dataset.dailyRun));
      renderDailyRunLog();
      els.dailyHistory.innerHTML = state.dailyDungeon.history.length
        ? `<strong>오늘의 결과 요약</strong><br>${state.dailyDungeon.history.map(x => `• ${x}`).join("<br>")}`
        : "아직 오늘의 도전 결과가 없습니다.";
    }

    function ensureArena() {
      const today = localDateKey();
      if (state.arena.date !== today) {
        state.arena.date = today;
        state.arena.tickets = 5;
        state.arena.opponents = [];
      }
      if (!Array.isArray(state.arena.opponents) || state.arena.opponents.length !== 3) generateArenaOpponents();
    }

    function generateArenaOpponents() {
      const ratios = [.84 + Math.random()*.08, .98 + Math.random()*.08, 1.13 + Math.random()*.15];
      const classIds = Object.keys(classes);
      state.arena.opponents = ratios.map((ratio,index) => ({
        id:`${Date.now()}-${index}-${Math.random()}`,
        name:randomChoice(arenaNames),
        classId:randomChoice(classIds),
        power:Math.max(20,Math.round(power()*ratio)),
        ratio,
        rating:Math.max(700,Math.round(state.arena.rating + (ratio-1)*320 + (Math.random()-.5)*80))
      }));
    }

    function refreshArenaOpponents() {
      ensureArena();
      if (state.gold < 60) return toast("상대 갱신에 필요한 골드가 부족합니다.");
      state.gold -= 60;
      generateArenaOpponents();
      log("아레나 상대 목록 갱신 · 골드 -60", "neutral");
      saveState();
      renderAll();
    }

    function createArenaEnemy(opponent) {
      const s = totalStats();
      const ratio = opponent.ratio;
      const opponentClass = classes[opponent.classId];
      return {
        name:`${opponent.name} (${opponentClass.name})`,
        baseName:opponent.name,
        zoneId:"arena",
        rank:"결투 상대",
        mutation:null,
        attack:Math.max(4,(Math.max(s.attack,s.magicPower)*.75 + s.defense*.18)*ratio),
        defense:Math.max(2,s.defense*.72*ratio),
        hp:Math.max(55,s.maxHp*.92*ratio),
        xp:0,gold:0,drop:0,mapMult:1
      };
    }

    function challengeArena(opponentId) {
      ensureArena();
      if (state.arena.tickets <= 0) return toast("오늘의 아레나 입장권을 모두 사용했습니다.");
      const opponent = state.arena.opponents.find(o => o.id === opponentId);
      if (!opponent || isBusy) return;

      isBusy = true;
      state.arena.tickets--;
      const oldHp = state.hp;
      const oldMp = state.mp;
      const s = totalStats();
      state.hp = s.maxHp;
      state.mp = s.maxMp;
      const result = simulateBattle(createArenaEnemy(opponent));
      state.hp = oldHp;
      state.mp = oldMp;
      result.events.forEach(event => log(`[아레나] ${event.text}`, event.cls));

      let ratingChange;
      if (result.won) {
        ratingChange = Math.max(9,Math.round(17 + (opponent.rating-state.arena.rating)/35));
        state.arena.rating += ratingChange;
        state.arena.wins++;
        state.records.arenaWins = (state.records.arenaWins || 0) + 1;
        const goldReward = Math.round(42 * opponent.ratio);
        const dustReward = opponent.ratio >= 1.1 ? 3 : 1;
        state.gold += goldReward;
        state.dust += dustReward;
        state.records.totalGold += goldReward;
        state.arena.history.unshift(`승리 vs ${opponent.name} · 레이팅 +${ratingChange} · 골드 +${goldReward} · 별가루 +${dustReward}`);
        log(`[아레나] ${opponent.name}에게 승리 · 레이팅 +${ratingChange}`, "positive");
        toast("아레나 승리!");
      } else {
        ratingChange = Math.max(7,Math.round(13 + (state.arena.rating-opponent.rating)/45));
        state.arena.rating = Math.max(500,state.arena.rating-ratingChange);
        state.arena.losses++;
        state.records.arenaLosses = (state.records.arenaLosses || 0) + 1;
        state.arena.history.unshift(`패배 vs ${opponent.name} · 레이팅 -${ratingChange}`);
        log(`[아레나] ${opponent.name}에게 패배 · 레이팅 -${ratingChange}`, "negative");
        toast("아레나 패배");
      }
      state.arena.history = state.arena.history.slice(0,8);
      generateArenaOpponents();
      isBusy = false;
      saveState();
      renderAll();
    }

    function renderArena() {
      ensureArena();
      els.arenaRatingBadge.textContent = `레이팅 ${fmt(state.arena.rating)}`;
      els.arenaNavCount.textContent = state.arena.tickets > 0 ? `(${state.arena.tickets})` : "";
      els.arenaSummary.innerHTML = [
        ["오늘 입장권", `${state.arena.tickets} / 5`],
        ["레이팅", fmt(state.arena.rating)],
        ["승리 / 패배", `${fmt(state.arena.wins)} / ${fmt(state.arena.losses)}`],
        ["내 전투력", fmt(power())]
      ].map(([k,v]) => `<div class="stat"><span>${k}</span><strong>${v}</strong></div>`).join("");
      els.arenaGrid.innerHTML = state.arena.opponents.map((opponent,index) => {
        const cls = classes[opponent.classId];
        const delta = opponent.power-power();
        return `
          <article class="arena-card">
            <div class="arena-class">${cls.name}</div>
            <div class="arena-name">${opponent.name}</div>
            <div class="arena-meta">레이팅 ${fmt(opponent.rating)} · 전투력 ${fmt(opponent.power)}<br>
              내 전투력 대비 <span class="${delta>0 ? "negative" : "positive"}">${delta>=0 ? "+" : ""}${fmt(delta)}</span>
            </div>
            <div class="arena-reward">${index===0 ? "안전한 상대" : index===1 ? "비슷한 상대" : "고보상 강적"}</div>
            <div class="mini-buttons">
              <button class="primary" data-arena-fight="${opponent.id}" ${state.arena.tickets<=0 ? "disabled" : ""}>대결하기</button>
            </div>
          </article>`;
      }).join("");
      els.arenaGrid.querySelectorAll("[data-arena-fight]").forEach(btn => btn.onclick = () => challengeArena(btn.dataset.arenaFight));
      els.arenaLog.innerHTML = state.arena.history.length
        ? `<strong>최근 결과</strong><br>${state.arena.history.map(x => `• ${x}`).join("<br>")}`
        : "아직 아레나 대전 기록이 없습니다.";
    }

    const gambleSlotConfig = {
      weapon:{label:"무기",icon:"⚔",basePrice:140},
      armor:{label:"갑옷",icon:"♜",basePrice:120},
      ring:{label:"반지",icon:"◉",basePrice:170},
      amulet:{label:"부적",icon:"◆",basePrice:190}
    };

    function gamblePriceFor(slot=state.gamble.selectedSlot) {
      const config = gambleSlotConfig[slot] || gambleSlotConfig.weapon;
      const levelCost = state.level*28;
      const powerCost = Math.sqrt(Math.max(1,power()))*5.5;
      return Math.max(100,Math.round((config.basePrice+levelCost+powerCost)/10)*10);
    }

    function gambleZoneMultiplier() {
      const currentPower = power();
      const available = zones.filter(zoneDef => currentPower >= zoneDef.rec*.72);
      return (available.at(-1) || zones[0]).mult;
    }

    function rollGambleCategory() {
      const roll = Math.random();
      if (roll < .0005) return "unique";
      if (roll < .0025) return "set";
      if (roll < .0100) return "legendary";
      if (roll < .0600) return "epic";
      if (roll < .2300) return "rare";
      if (roll < .5500) return "uncommon";
      return "common";
    }

    function generateGambleItem(slot) {
      const category = rollGambleCategory();
      const zoneMult = gambleZoneMultiplier();
      const playerFactor = 1+(state.level-1)*.08;
      const specialBase = playerFactor*zoneMult*(.88+Math.random()*.25);

      if (category === "unique") return generateUniqueItem(specialBase,slot);
      if (category === "set") return generateSetItem(specialBase,slot);
      return generateStandardItem(zoneMult,0,slot,category);
    }

    function gambleAutoOutcome(item) {
      const settings = state.autoProcess || {};
      if (!settings.enabled || item.locked) return "keep";
      if (settings.keepSpecial && ["set","unique"].includes(itemKind(item))) return "keep";
      if (settings.keepSixAffix && itemKind(item) === "normal" && (item.affixes || []).length >= 6) return "keep";
      if (itemKind(item) !== "normal") return "keep";
      return settings[item.rarity] || "keep";
    }

    function gambleOutcomeLabel(outcome) {
      return outcome === "sell" ? "자동 판매됨" : outcome === "salvage" ? "자동 분해됨" : "전리품 가방에 보관";
    }

    function performGambleRoll(slot) {
      const cost = gamblePriceFor(slot);
      if (state.gold < cost) return {ok:false,reason:"gold"};

      const item = generateGambleItem(slot);
      const expectedOutcome = gambleAutoOutcome(item);
      if (expectedOutcome === "keep" && state.inventory.length >= state.inventoryCapacity) {
        return {ok:false,reason:"inventory"};
      }

      state.gold -= cost;
      state.records.gambleCount = (state.records.gambleCount || 0)+1;
      state.records.gambleGoldSpent = (state.records.gambleGoldSpent || 0)+cost;
      if (rarityRank(item) >= rarityRank({rarity:"epic"})) {
        state.records.gambleEpicPlus = (state.records.gambleEpicPlus || 0)+1;
      }
      if (["set","unique"].includes(itemKind(item))) {
        state.records.gambleSpecialItems = (state.records.gambleSpecialItems || 0)+1;
      }

      recordDroppedItem(item);
      const stored = storeItem(item);
      const outcome = stored ? "keep" : expectedOutcome;
      state.lastLoot = null;

      const snapshot = JSON.parse(JSON.stringify(item));
      state.gamble.lastResult = {
        item:snapshot,
        cost,
        outcome,
        at:Date.now()
      };
      state.gamble.history.unshift({
        name:item.name,
        rarityName:item.rarityName,
        rarityClass:item.rarityClass,
        slot:item.slot,
        cost,
        outcome,
        at:Date.now()
      });
      state.gamble.history = state.gamble.history.slice(0,30);

      log(`도박 상점 · ${gambleSlotConfig[slot].label} 봉인품 → [${item.rarityName}] ${item.name} · ${fmt(cost)}G`,item.rarityClass);
      return {ok:true,item,outcome,cost};
    }

    function gambleItems(amount) {
      const count = Math.max(1,Math.min(10,Math.floor(Number(amount) || 1)));
      let completed = 0;
      let stoppedReason = "";

      for (let index=0;index<count;index++) {
        const result = performGambleRoll(state.gamble.selectedSlot);
        if (!result.ok) {
          stoppedReason = result.reason;
          break;
        }
        completed++;
      }

      if (!completed) {
        if (stoppedReason === "gold") toast("도박에 필요한 골드가 부족합니다.");
        else if (stoppedReason === "inventory") toast("전리품 가방이 가득 찼습니다.");
        return;
      }

      if (completed < count) {
        toast(`${completed}회까지만 구매했습니다. ${stoppedReason === "gold" ? "골드 부족" : "가방 부족"}`);
      } else {
        toast(`봉인품 ${completed}개 개봉 완료`);
      }

      saveState();
      renderAll();
    }

    function selectGambleSlot(slot) {
      if (!gambleSlotConfig[slot]) return;
      state.gamble.selectedSlot = slot;
      saveState();
      renderGambleShop();
    }

    function renderGambleShop() {
      const selected = gambleSlotConfig[state.gamble.selectedSlot]
        ? state.gamble.selectedSlot
        : "weapon";
      state.gamble.selectedSlot = selected;
      const price = gamblePriceFor(selected);

      els.gambleGoldBadge.textContent = `보유 골드 ${fmt(state.gold)}G`;
      els.gambleCountBadge.textContent = `도박 ${fmt(state.records.gambleCount || 0)}회`;
      els.gambleSelectedSlot.textContent = gambleSlotConfig[selected].label;
      els.gamblePrice.textContent = `${fmt(price)} G`;
      els.gambleTenPrice.textContent = `${fmt(price*10)} G`;
      els.gambleOnceBtn.disabled = state.gold < price;
      els.gambleTenBtn.disabled = state.gold < price;

      els.gambleSlotGrid.innerHTML = Object.entries(gambleSlotConfig).map(([slot,config]) => `
        <button class="gamble-slot-card ${selected === slot ? "active" : ""}" data-gamble-slot="${slot}">
          <span class="gamble-slot-icon">${config.icon}</span>
          <strong>${config.label}</strong>
          <span>${fmt(gamblePriceFor(slot))}G</span>
        </button>
      `).join("");
      els.gambleSlotGrid.querySelectorAll("[data-gamble-slot]").forEach(btn => {
        btn.onclick = () => selectGambleSlot(btn.dataset.gambleSlot);
      });

      const last = state.gamble.lastResult;
      els.gambleResult.innerHTML = last?.item
        ? `<div class="gamble-result-status ${last.outcome === "keep" ? "kept" : "processed"}">
            ${gambleOutcomeLabel(last.outcome)} · 지출 ${fmt(last.cost)}G
          </div>${inventoryCardHtml(last.item,true)}`
        : `<div class="inventory-empty">아직 열린 봉인품이 없다.<br>부위를 고르고 행상인에게 골드를 건네 보자.</div>`;

      els.gambleHistory.innerHTML = state.gamble.history.length
        ? state.gamble.history.map(entry => `
          <div class="gamble-history-row">
            <span>${gambleSlotConfig[entry.slot]?.label || entry.slot}</span>
            <strong class="${entry.rarityClass}">[${entry.rarityName}] ${entry.name}</strong>
            <span class="gamble-cost">-${fmt(entry.cost)}G</span>
            <span class="gamble-outcome">${gambleOutcomeLabel(entry.outcome)}</span>
          </div>
        `).join("")
        : `<div class="gamble-history-row"><span>기록</span><strong>아직 도박 기록이 없다.</strong><span></span><span></span></div>`;
    }

    function updateMarket() {
      const now = Date.now();
      const elapsed = Math.floor((now - state.market.lastTick) / 10000);
      if (elapsed <= 0) return false;
      const ticks = Math.min(elapsed, 20);
      for (let i=0; i<ticks; i++) {
        const meanPull = (95 - state.market.price) * .045;
        const noise = (Math.random() - .5) * 13;
        state.market.price = Math.max(35, Math.min(240, Math.round(state.market.price + meanPull + noise)));
        state.market.history.push(state.market.price);
        if (state.market.history.length > 24) state.market.history.shift();
      }
      state.market.lastTick += elapsed * 10000;
      return true;
    }

    function marketQuantity(input) {
      return Math.max(1,Math.floor(Number(input?.value) || 1));
    }

    function marketBuyMaximum() {
      return Math.max(0,Math.floor(state.gold / Math.max(1,state.market.price)));
    }

    function marketSellMaximum() {
      return Math.max(0,Math.floor(state.market.tokens || 0));
    }

    function marketPresetQuantity(maximum,preset) {
      if (maximum <= 0) return 1;
      if (preset === "one") return 1;
      if (preset === "third") return Math.max(1,Math.floor(maximum/3));
      if (preset === "half") return Math.max(1,Math.floor(maximum/2));
      return maximum;
    }

    function setMarketPreset(side,preset) {
      updateMarket();
      const buying = side === "buy";
      const maximum = buying ? marketBuyMaximum() : marketSellMaximum();
      const input = buying ? els.marketBuyQty : els.marketSellQty;
      input.value = marketPresetQuantity(maximum,preset);
      renderMarketTradePreviews();
    }

    function renderMarketTradePreviews() {
      const buyMax = marketBuyMaximum();
      const sellMax = marketSellMaximum();
      const sellUnit = Math.floor(state.market.price*.98);

      els.marketBuyQty.max = Math.max(1,buyMax);
      els.marketSellQty.max = Math.max(1,sellMax);

      const requestedBuy = marketQuantity(els.marketBuyQty);
      const requestedSell = marketQuantity(els.marketSellQty);
      const buyQty = buyMax > 0 ? Math.min(requestedBuy,buyMax) : 0;
      const sellQty = sellMax > 0 ? Math.min(requestedSell,sellMax) : 0;

      els.marketBuyAvailable.textContent = `${fmt(buyMax)}개`;
      els.marketSellAvailable.textContent = `${fmt(sellMax)}개`;
      els.marketBuyTotal.textContent = `${fmt(state.market.price*buyQty)}G`;
      els.marketSellTotal.textContent = `${fmt(sellUnit*sellQty)}G`;

      const previewProfit = Math.round((sellUnit-state.market.avgCost)*sellQty);
      els.marketSellProfitPreview.textContent = `${previewProfit >= 0 ? "+" : ""}${fmt(previewProfit)}G`;
      els.marketSellProfitPreview.className = previewProfit >= 0 ? "positive" : "negative";

      els.marketBuyBtn.disabled = buyQty <= 0;
      els.marketSellBtn.disabled = sellQty <= 0;
    }

    function buyMarket(qty) {
      updateMarket();
      const cost = state.market.price * qty;
      if (cost > state.gold) return toast("골드가 부족합니다.");
      const oldTokens = state.market.tokens;
      const totalCost = state.market.avgCost * oldTokens + cost;
      state.gold -= cost;
      state.market.tokens += qty;
      state.market.avgCost = state.market.tokens ? totalCost / state.market.tokens : 0;
      state.market.trades++;
      state.records.marketTrades = (state.records.marketTrades || 0) + 1;
      state.market.ledger.unshift(`검은 주화 ${qty}개 구매 · -${fmt(cost)}G`);
      state.market.ledger = state.market.ledger.slice(0, 8);
      log(`거래소에서 검은 주화 ${qty}개 구매 · ${fmt(cost)}G`, "neutral");
      saveState();
      renderAll();
    }

    function sellMarket(qty) {
      updateMarket();
      qty = Math.min(qty, state.market.tokens);
      if (qty <= 0) return toast("판매할 검은 주화가 없습니다.");
      const unitSell = Math.floor(state.market.price * .98);
      const revenue = unitSell * qty;
      const profit = Math.round((unitSell - state.market.avgCost) * qty);
      state.market.tokens -= qty;
      state.gold += revenue;
      state.market.realized += profit;
      state.market.trades++;
      state.records.marketTrades = (state.records.marketTrades || 0) + 1;
      if (state.market.tokens === 0) state.market.avgCost = 0;
      state.market.ledger.unshift(`검은 주화 ${qty}개 판매 · +${fmt(revenue)}G · 손익 ${profit >= 0 ? "+" : ""}${fmt(profit)}G`);
      state.market.ledger = state.market.ledger.slice(0, 8);
      log(`거래소에서 검은 주화 ${qty}개 판매 · 골드 +${fmt(revenue)}`, profit >= 0 ? "positive" : "negative");
      saveState();
      renderAll();
    }

    function renderMarket() {
      updateMarket();
      const history = state.market.history.length ? state.market.history : [state.market.price];
      const min = Math.min(...history);
      const max = Math.max(...history);
      const average = history.reduce((sum,price) => sum+price,0)/history.length;
      const span = Math.max(1,max-min);
      const sellUnit = Math.floor(state.market.price*.98);
      const positionValue = sellUnit*state.market.tokens;
      const unrealized = Math.round((sellUnit-state.market.avgCost)*state.market.tokens);
      const invested = state.market.avgCost*state.market.tokens;
      const returnRate = invested > 0 ? unrealized/invested*100 : 0;

      els.marketPrice.textContent = `${fmt(state.market.price)} G`;
      els.marketSellPrice.textContent = `${fmt(sellUnit)} G`;
      els.marketHistoryAvg.textContent = `${average.toFixed(1)} G`;

      els.marketGold.textContent = `${fmt(state.gold)} G`;
      els.marketTokens.textContent = `${fmt(state.market.tokens)}개`;
      els.marketAvg.textContent = `${state.market.avgCost ? state.market.avgCost.toFixed(1) : "0"} G`;
      els.marketPositionValue.textContent = `${fmt(positionValue)} G`;
      els.marketUnrealized.textContent = `${unrealized >= 0 ? "+" : ""}${fmt(unrealized)} G`;
      els.marketUnrealized.className = unrealized >= 0 ? "positive" : "negative";
      els.marketReturn.textContent = `${returnRate >= 0 ? "+" : ""}${returnRate.toFixed(1)}%`;
      els.marketReturn.className = returnRate >= 0 ? "positive" : "negative";
      els.marketProfit.textContent = `${state.market.realized >= 0 ? "+" : ""}${fmt(state.market.realized)} G`;
      els.marketProfit.className = state.market.realized >= 0 ? "positive" : "negative";
      els.marketTradeCount.textContent = `${fmt(state.market.trades || 0)}회`;

      els.marketBuyUnit.textContent = `개당 ${fmt(state.market.price)}G`;
      els.marketSellUnit.textContent = `개당 ${fmt(sellUnit)}G`;

      els.marketHistory.innerHTML = history.map((price,index) => {
        const h = 28+((price-min)/span)*138;
        const isLatest = index === history.length-1 ? " latest" : "";
        return `<div class="market-bar${isLatest}" style="height:${h}px" title="${price}G"></div>`;
      }).join("");

      els.marketLedger.innerHTML = state.market.ledger.length
        ? state.market.ledger.map(line => `<div class="detail-row"><span>${line}</span></div>`).join("")
        : `<div class="notice">아직 거래 기록이 없습니다.</div>`;

      renderMarketTradePreviews();
    }

    function generateRareMap() {
      const types = [
        { name:"황금 고블린의 은신처", desc:"골드 보상이 크게 증가합니다.", gold:3.5, item:1.15, difficulty:1.25 },
        { name:"무기 제작자의 무덤", desc:"장비가 확정 드롭되며 무기 확률이 높습니다.", gold:1.15, item:2.0, difficulty:1.4 },
        { name:"피의 투기장", desc:"적이 매우 강하지만 영웅 이상 장비 확률이 증가합니다.", gold:1.55, item:2.4, difficulty:1.75 },
        { name:"뒤틀린 보물창고", desc:"골드와 장비가 모두 크게 증가합니다.", gold:2.2, item:1.8, difficulty:1.55 },
        { name:"이름 없는 방", desc:"무슨 일이 일어날지 알 수 없습니다.", gold:0.8 + Math.random()*3, item:1 + Math.random()*2.4, difficulty:1.1 + Math.random()*.9 }
      ];
      const t = randomChoice(types);
      state.rareMap = {
        ...t,
        expiresAt: Date.now() + 10 * 60 * 1000,
        sourceZone: state.currentZone
      };
      state.records.rareMaps++;
      log(`희미한 균열이 열렸습니다. [${t.name}] 발견!`, "rarity-epic");
      toast("희귀 지도를 발견했습니다!");
    }

    function renderRareMap() {
      const map = state.rareMap;
      if (!map || map.expiresAt <= Date.now()) {
        if (map) {
          state.rareMap = null;
          log("희귀 지도의 균열이 닫혔습니다.", "neutral");
        }
        els.rareMapCard.classList.add("hidden");
        return;
      }

      const left = Math.max(0, Math.floor((map.expiresAt - Date.now()) / 1000));
      const mm = String(Math.floor(left / 60)).padStart(2,"0");
      const ss = String(left % 60).padStart(2,"0");
      els.rareMapCard.classList.remove("hidden");
      els.rareMapCard.innerHTML = `
        <div class="rarity rarity-epic">희귀 지도 발견</div>
        <div class="item-name">${map.name}</div>
        <div class="notice">${map.desc}</div>
        <div class="affixes">
          <div>골드 배율 ×${map.gold.toFixed(2)}</div>
          <div>장비 보상 ×${map.item.toFixed(2)}</div>
          <div>적 전투력 ×${map.difficulty.toFixed(2)}</div>
          <div>남은 시간 ${mm}:${ss}</div>
        </div>
        <div class="mini-buttons">
          <button class="primary" id="enterMapBtn">희귀 지도 입장 · 활력 3</button>
          <button id="discardMapBtn">균열 닫기</button>
        </div>
      `;
      document.getElementById("enterMapBtn").onclick = () => hunt(true);
      document.getElementById("discardMapBtn").onclick = () => {
        state.rareMap = null;
        saveState();
        renderAll();
      };
    }

    function createEnemy(inRareMap=false) {
      const z = zone();
      const heat = state.heat[z.id] || 0;
      const rulerChance = heat >= 90 ? .16 : heat >= 60 ? .06 : .015;
      const eliteChance = heat >= 60 ? .24 : heat >= 30 ? .14 : .08;
      const roll = Math.random();

      let rank = "일반";
      let rankMult = 1;
      if (roll < rulerChance) { rank = "지역 지배자"; rankMult = 2.15; }
      else if (roll < rulerChance + eliteChance) { rank = "정예"; rankMult = 1.45; }

      if (inRareMap) {
        rank = Math.random() < .42 ? "희귀 정예" : "지도 수호자";
        rankMult *= state.rareMap.difficulty;
      }

      let special = null;
      const rareChance = inRareMap ? .025 : .007;
      if (Math.random() < rareChance) {
        special = randomChoice(rareMonsterCatalog);
        rank = "희귀 몬스터";
        rankMult *= 1.18;
      }

      const mutationChance = special ? 0 : inRareMap ? .34 : .13 + heat * .001;
      const mutation = Math.random() < mutationChance ? randomChoice(enemyMutations) : null;
      const scaling = z.mult * (1 + state.level * .055) * (1 + heat * .0045) * rankMult;
      const baseName = special ? special.name : randomChoice(z.enemies);

      return {
        name: special
          ? `${rank} ${baseName}`
          : `${mutation ? mutation.name + " " : ""}${rank} ${baseName}`,
        baseName,
        zoneId:z.id,
        rank,
        mutation,
        specialType:special?.id || "",
        specialLabel:special?.label || "",
        turnLimit:special?.turnLimit || 60,
        attack:7.5*scaling*(mutation?.attack || 1)*(special?.attack || 1),
        defense:3.2*scaling*(special?.defense || 1),
        hp:42*scaling*(mutation?.hp || 1)*(special?.hp || 1),
        xp:20*z.mult*rankMult*(mutation?.xp || 1)*(special ? 1.7 : 1),
        gold:11*z.mult*rankMult*(mutation?.gold || 1)*(special?.gold || 1),
        drop:(special ? special.drop : rank === "일반" ? .14 : rank === "정예" ? .52 : .88)*(mutation?.item || 1),
        mapMult:mutation?.map || 1
      };
    }

    function skillLevel(classId, skillId) {
      return Math.min(15, baseSkillLevel(classId,skillId) + equippedSkillBonus(classId,skillId));
    }

    function getCombatSkills() {
      return skillCatalog[state.classId] || [];
    }

    function simulateBattle(enemy) {
      const s = totalStats();
      const combat = classCombatText[state.classId] || {action:"공격",damageType:"physical"};
      const heroPower = combat.damageType === "magic" ? s.magicPower : s.attack;
      let heroHp = state.hp;
      let heroMp = state.mp;
      let enemyHp = enemy.hp;
      let turns = 0;
      let maxHit = 0;
      let emergencyUsed = false;
      let emergencyManaUsed = false;
      let revived = false;
      let firstSkillUsed = false;
      let specialCount = 0;
      let skillUses = 0;
      const elite = enemy.rank !== "일반";
      const skills = getCombatSkills();
      const events = [{
        text:`전투 개시 · ${currentClass()?.name || "사냥꾼"} HP ${fmt(heroHp)}/${fmt(s.maxHp)} · MP ${fmt(heroMp)}/${fmt(s.maxMp)} ↔ ${enemy.name} HP ${fmt(enemyHp)}`,
        cls:"battle-start"
      }];
      const enemyActions = ["할퀴기","난타","돌진","흉포한 일격"];

      while (heroHp > 0 && enemyHp > 0 && turns < (enemy.turnLimit || 60)) {
        turns++;

        if (!emergencyManaUsed && s.emergencyManaRate > 0 && heroMp < s.maxMp*.20) {
          const before = heroMp;
          heroMp = Math.min(s.maxMp,heroMp+Math.round(s.maxMp*s.emergencyManaRate));
          emergencyManaUsed = true;
          events.push({text:`마지막 숨의 유리병이 깨졌다 · MP +${fmt(heroMp-before)}`,cls:"battle-heal"});
        }

        const usableSkills = skills
          .map(skill => ({
            ...skill,
            effectiveEvery:Math.max(2,skill.every-Math.round(s.skillEveryReduction || 0)),
            effectiveCost:Math.max(1,Math.round(skill.cost*(1-Math.min(.65,s.skillManaReduction || 0))))
          }))
          .filter(skill => turns % skill.effectiveEvery === 0 && heroMp >= skill.effectiveCost)
          .sort((a,b) => b.effectiveEvery-a.effectiveEvery);

        const activeSkill = usableSkills[0] || null;
        const skillLv = activeSkill ? skillLevel(state.classId,activeSkill.id) : 0;
        const actionName = activeSkill ? activeSkill.name : combat.action;
        const critChance = s.crit + (activeSkill?.critBonus || 0);
        const crit = Math.random()*100 < critChance;
        const variance = s.stableDamage ? .96+Math.random()*.08 : .86+Math.random()*.28;
        const defensePierce = activeSkill?.defensePierce || 0;
        let hit = Math.max(1,heroPower*variance-enemy.defense*.35*(1-defensePierce));
        const effects = [];

        if (heroHp < s.maxHp*.35 && s.lowHpDamageBonus > 0) {
          hit *= 1+s.lowHpDamageBonus;
          effects.push("빈사 투지");
        }
        if (activeSkill) {
          heroMp -= activeSkill.effectiveCost;
          hit *= activeSkill.mult+(skillLv-1)*activeSkill.growth+(s.skillDamageBonus || 0);
          skillUses++;
          specialCount++;
          effects.push(`기술 Lv.${skillLv}`,`마나 -${activeSkill.effectiveCost}`);
          if (!firstSkillUsed && s.firstSkillDamage > 0) {
            hit *= 1+s.firstSkillDamage;
            firstSkillUsed = true;
            effects.push("유니크 발동");
          } else if (!firstSkillUsed) {
            firstSkillUsed = true;
          }
          if (s.manaOnSkill > 0) {
            const restored = Math.min(s.maxMp-heroMp,Math.round(s.manaOnSkill));
            heroMp += restored;
            if (restored) effects.push(`마나 환류 +${restored}`);
          }
          if (defensePierce) effects.push(`방어 무시 ${Math.round(defensePierce*100)}%`);
        }
        if (turns === 1 && s.firstStrike) {
          hit *= 1+s.firstStrike;
          effects.push("선제 강화");
        }
        if (elite && s.eliteDamage) {
          hit *= 1+s.eliteDamage;
          effects.push("정예 추가 피해");
        }
        if (s.spellBurst && turns%3 === 0) {
          hit *= 1+s.spellBurst;
          specialCount++;
          effects.push("주문 폭발");
        }
        if (crit) {
          hit *= s.critDamage;
          effects.push("치명타");
        }

        hit = Math.round(hit);
        enemyHp -= hit;
        maxHit = Math.max(maxHit,hit);
        events.push({
          text:`${turns}막 · ${actionName} → ${fmt(hit)} 피해${effects.length ? ` (${effects.join(", ")})` : ""} · 적 ${fmt(Math.max(0,enemyHp))}/${fmt(enemy.hp)} · MP ${fmt(heroMp)}/${fmt(s.maxMp)}`,
          cls:crit ? "battle-turn positive" : "battle-turn"
        });

        if (activeSkill?.extraHit && enemyHp > 0) {
          const extra = Math.max(1,Math.round(hit*activeSkill.extraHit));
          enemyHp -= extra;
          maxHit = Math.max(maxHit,extra);
          specialCount++;
          events.push({text:`${activeSkill.name} 추가타 → ${fmt(extra)} 피해`,cls:"battle-effect"});
        }

        if (activeSkill && s.skillEcho > 0 && enemyHp > 0 && Math.random() < s.skillEcho) {
          const echo = Math.max(1,Math.round(hit*.55));
          enemyHp -= echo;
          maxHit = Math.max(maxHit,echo);
          specialCount++;
          events.push({text:`별의 잔향 → ${fmt(echo)} 추가 피해`,cls:"battle-effect"});
        }

        if (activeSkill?.healRate) {
          const before = heroHp;
          heroHp = Math.min(s.maxHp,heroHp+Math.round(s.maxHp*activeSkill.healRate));
          events.push({text:`${activeSkill.name} · HP +${fmt(heroHp-before)}`,cls:"battle-heal"});
        }

        if (activeSkill?.manaRestore) {
          const before = heroMp;
          heroMp = Math.min(s.maxMp,heroMp+activeSkill.manaRestore+skillLv);
          events.push({text:`마나 환류 · MP +${fmt(heroMp-before)}`,cls:"battle-heal"});
        }

        if (enemyHp > 0 && s.executeThreshold > 0 && enemyHp/enemy.hp <= s.executeThreshold) {
          enemyHp = 0;
          specialCount++;
          events.push({text:`처형선 도달 · ${enemy.name}의 숨통을 끊었다.`,cls:"rarity-unique"});
        }

        if (enemyHp > 0 && Math.random() < s.doubleHit) {
          const extra = Math.max(1,Math.round(hit*.58));
          enemyHp -= extra;
          maxHit = Math.max(maxHit,extra);
          specialCount++;
          events.push({text:`연속 공격 → ${fmt(extra)} 피해`,cls:"battle-effect"});
        }
        const mercenary = activeMercenaryDefinition();
        if (enemyHp > 0 && s.companionStrikeEvery > 0 && turns % Math.round(s.companionStrikeEvery) === 0) {
          const companionHit = Math.max(1,Math.round(heroPower*s.companionStrikeRate));
          enemyHp -= companionHit;
          maxHit = Math.max(maxHit,companionHit);
          specialCount++;
          events.push({text:`${mercenary?.name || "동행 용병"}의 지원 공격 → ${fmt(companionHit)} 피해`,cls:"rarity-set"});
        }
        if (heroHp > 0 && s.companionHealEvery > 0 && turns % Math.round(s.companionHealEvery) === 0) {
          const beforeCompanionHeal = heroHp;
          heroHp = Math.min(s.maxHp,heroHp+Math.round(s.maxHp*s.companionHealRate));
          if (heroHp > beforeCompanionHeal) {
            specialCount++;
            events.push({text:`${mercenary?.name || "동행 용병"}의 지원 회복 · HP +${fmt(heroHp-beforeCompanionHeal)}`,cls:"battle-heal"});
          }
        }
        if (enemyHp <= 0) break;

        if (Math.random() >= s.dodge) {
          let enemyHit = Math.max(1,Math.round(enemy.attack*(.9+Math.random()*.2)-s.defense*.42));
          let reduction = Math.min(.75,s.damageReduction || 0);
          if (heroHp < s.maxHp*.35) reduction = Math.min(.82,reduction+(s.lowHpDamageReduction || 0));
          enemyHit = Math.max(1,Math.round(enemyHit*(1-reduction)));
          heroHp -= enemyHit;
          events.push({text:`${enemy.name}의 ${randomChoice(enemyActions)} → ${fmt(enemyHit)} 피해 · 내 HP ${fmt(Math.max(0,heroHp))}/${fmt(s.maxHp)}`,cls:"battle-enemy"});

          if (heroHp <= 0 && !revived && s.reviveRate > 0) {
            heroHp = Math.max(1,Math.round(s.maxHp*s.reviveRate));
            revived = true;
            specialCount++;
            events.push({text:`죽지 않는 자의 마지막 밤 · HP ${fmt(heroHp)}로 부활`,cls:"rarity-unique"});
          }

          if (heroHp > 0 && Math.random() < s.counter) {
            const counterHit = Math.max(1,Math.round(heroPower*.72));
            enemyHp -= counterHit;
            maxHit = Math.max(maxHit,counterHit);
            specialCount++;
            events.push({text:`반격 → ${fmt(counterHit)} 피해`,cls:"battle-effect"});
          }
        } else {
          specialCount++;
          events.push({text:`회피 · 공격이 허공을 갈랐다.`,cls:"battle-effect"});
        }

        if (!emergencyUsed && s.emergencyHeal > 0 && heroHp > 0 && heroHp < s.maxHp*.35) {
          const before = heroHp;
          heroHp = Math.min(s.maxHp,heroHp+Math.round(s.maxHp*s.emergencyHeal));
          emergencyUsed = true;
          specialCount++;
          events.push({text:`긴급 회복 · HP +${fmt(heroHp-before)}`,cls:"battle-heal"});
        }
      }

      return {
        won:heroHp > 0 && enemyHp <= 0,
        escaped:heroHp > 0 && enemyHp > 0,
        heroHp:Math.max(0,Math.round(heroHp)),
        heroMp:Math.max(0,Math.round(heroMp)),
        turns,maxHit,specialCount,skillUses,events
      };
    }

    function rollRecoveryDrop(enemy,inRareMap=false) {
      const chance = inRareMap ? 1 : enemy.rank === "일반" ? .26 : .58;
      if (Math.random() >= chance) return null;
      const roll = Math.random();
      const id = roll < .34
        ? "health"
        : roll < .64
          ? "mana"
          : roll < .80
            ? "stamina"
            : "elixir";
      return { ...recoveryItems[id], droppedAt:Date.now() };
    }

    function applyRecovery(item) {
      const s = totalStats();
      const beforeHp = state.hp;
      const beforeMp = state.mp;
      const beforeStamina = state.stamina;
      if (item.hpRate) state.hp = Math.min(s.maxHp,state.hp+Math.round(s.maxHp*item.hpRate));
      if (item.mpRate) state.mp = Math.min(s.maxMp,state.mp+Math.round(s.maxMp*item.mpRate));
      if (item.staminaFlat) {
        state.stamina = Math.min(STAMINA_MAX,state.stamina+Math.round(item.staminaFlat));
        state.staminaUpdatedAt = Date.now();
      }
      const hpGain = state.hp-beforeHp;
      const mpGain = state.mp-beforeMp;
      const staminaGain = state.stamina-beforeStamina;
      state.records.recoveryUsed = (state.records.recoveryUsed || 0)+1;
      if (item.id === "stamina") state.records.staminaPotionsUsed = (state.records.staminaPotionsUsed || 0)+1;
      const gains = [
        hpGain ? `HP +${fmt(hpGain)}` : "",
        mpGain ? `MP +${fmt(mpGain)}` : "",
        staminaGain ? `활력 +${fmt(staminaGain)}` : ""
      ].filter(Boolean).join(" · ");
      log(`${item.name} 사용${gains ? ` · ${gains}` : ""}`,item.id === "stamina" ? "rarity-set" : "battle-heal");
      return {hpGain,mpGain,staminaGain};
    }

    function usePendingRecovery() {
      const item = state.pendingRecovery;
      if (!item) return;
      applyRecovery(item);
      state.pendingRecovery = null;
      saveState();
      renderAll();
    }

    function storePendingRecovery() {
      const item = state.pendingRecovery;
      if (!item) return;
      state.consumables[item.id] = (state.consumables[item.id] || 0) + 1;
      log(`${item.name}을 회복품 가방에 보관했습니다.`, item.color);
      state.pendingRecovery = null;
      saveState();
      renderAll();
    }

    function sellPendingRecovery() {
      const item = state.pendingRecovery;
      if (!item) return;
      state.gold += item.sell;
      state.records.totalGold += item.sell;
      log(`${item.name} 판매 · 골드 +${fmt(item.sell)}`, "neutral");
      state.pendingRecovery = null;
      saveState();
      renderAll();
    }

    function useConsumable(id) {
      const item = recoveryItems[id];
      if (!item || (state.consumables[id] || 0) <= 0) return toast(`${item?.name || "회복품"}이 없습니다.`);
      const s = totalStats();
      const hpFull = !item.hpRate || state.hp >= s.maxHp;
      const mpFull = !item.mpRate || state.mp >= s.maxMp;
      const staminaFull = !item.staminaFlat || state.stamina >= STAMINA_MAX;
      if (hpFull && mpFull && staminaFull) return toast("회복할 자원이 없습니다.");
      state.consumables[id]--;
      applyRecovery(item);
      saveState();
      renderAll();
    }

    function updateCodex(enemy, result, item=null, recovery=null) {
      const key = `${enemy.zoneId}:${enemy.baseName}`;
      const old = state.codex[key] || {
        name:enemy.baseName, zoneId:enemy.zoneId, encounters:0, kills:0,
        highestDamage:0, fastestTurns:null, ranks:{}, mutations:{}, itemRarities:{}, recoveryDrops:{}
      };
      old.encounters++;
      old.ranks[enemy.rank] = (old.ranks[enemy.rank] || 0) + 1;
      old.mutations = old.mutations || {};
      if (enemy.mutation) old.mutations[enemy.mutation.name] = (old.mutations[enemy.mutation.name] || 0) + 1;
      old.highestDamage = Math.max(old.highestDamage || 0, result.maxHit || 0);
      if (result.won) {
        old.kills++;
        old.fastestTurns = old.fastestTurns == null ? result.turns : Math.min(old.fastestTurns, result.turns);
      }
      if (item) old.itemRarities[item.rarityName] = (old.itemRarities[item.rarityName] || 0) + 1;
      if (recovery) old.recoveryDrops[recovery.name] = (old.recoveryDrops[recovery.name] || 0) + 1;
      state.codex[key] = old;
    }

    function codexStars(kills) {
      return [1,10,50,200].filter(v => kills >= v).length;
    }

    function codexScoreValue() {
      return Object.values(state.codex).reduce((sum, entry) => sum + codexStars(entry.kills || 0), 0);
    }

    function renderRecoveryCard() {
      state.pendingRecovery = null;
      els.recoveryCard.classList.add("hidden");
      els.recoveryCard.innerHTML = "";
    }

    function renderConsumables() {
      const entries = Object.values(recoveryItems);
      els.consumableSummary.textContent = `치유약 ${state.consumables.health || 0} · 마나약 ${state.consumables.mana || 0} · 활력약 ${state.consumables.stamina || 0} · 영약 ${state.consumables.elixir || 0}`;
      els.potionBtn.textContent = `체력약 ${state.consumables.health || 0}`;
      els.manaPotionBtn.textContent = `마나약 ${state.consumables.mana || 0}`;
      els.staminaPotionBtn.textContent = `활력약 ${state.consumables.stamina || 0}`;
      els.elixirBtn.textContent = `혼합 영약 ${state.consumables.elixir || 0}`;
      els.consumableGrid.innerHTML = entries.map(item => `
        <div class="consumable-card">
          <strong class="${item.color}">${item.name}</strong>
          <p>${item.desc}</p>
          <div class="consumable-count">보유 ${state.consumables[item.id] || 0}개</div>
          <div class="mini-buttons">
            <button class="primary" data-use-consumable="${item.id}">사용</button>
          </div>
        </div>
      `).join("");
      els.consumableGrid.querySelectorAll("[data-use-consumable]").forEach(btn => {
        btn.onclick = () => useConsumable(btn.dataset.useConsumable);
      });
    }

    function renderCodex() {
      const allMonsters = zones.flatMap(z => z.enemies.map(name => ({ zone:z, name, key:`${z.id}:${name}` })));
      const discovered = allMonsters.filter(m => state.codex[m.key]);
      const totalKills = discovered.reduce((sum,m) => sum + (state.codex[m.key].kills || 0), 0);
      const score = codexScoreValue();
      els.codexNavCount.textContent = `(${discovered.length}/${allMonsters.length})`;
      els.codexScore.textContent = `도감 점수 ${score}`;
      els.codexSummary.innerHTML = [
        ["발견", `${discovered.length} / ${allMonsters.length}`],
        ["도감 점수", fmt(score)],
        ["도감 기록 처치", fmt(totalKills)],
        ["완전 관찰", `${discovered.filter(m => codexStars(state.codex[m.key].kills || 0) >= 4).length}종`]
      ].map(([k,v]) => `<div class="stat"><span>${k}</span><strong>${v}</strong></div>`).join("");

      els.codexGrid.innerHTML = allMonsters.map(monster => {
        const entry = state.codex[monster.key];
        if (!entry) return `<article class="codex-card unknown"><div><div class="codex-zone">${monster.zone.name}</div><div class="codex-name">???</div><div>아직 만나지 못한 몬스터</div></div></article>`;
        const stars = codexStars(entry.kills || 0);
        const itemDrops = Object.entries(entry.itemRarities || {}).map(([k,v]) => `${k} ${v}회`).join(", ") || "장비 미발견";
        const recoveryDrops = Object.entries(entry.recoveryDrops || {}).map(([k,v]) => `${k} ${v}회`).join(", ") || "회복품 미발견";
        const ranks = Object.entries(entry.ranks || {}).map(([k,v]) => `${k} ${v}`).join(" · ");
        const mutations = Object.entries(entry.mutations || {}).map(([k,v]) => `${k} ${v}`).join(" · ");
        return `
          <article class="codex-card">
            <div class="codex-zone">${monster.zone.name}</div>
            <div class="codex-name">${entry.name}</div>
            <div class="codex-stars">${"★".repeat(stars)}${"☆".repeat(4-stars)}</div>
            <div class="record"><span>조우 / 처치</span><strong>${fmt(entry.encounters)} / ${fmt(entry.kills)}</strong></div>
            <div class="record"><span>최단 전투</span><strong>${entry.fastestTurns ? `${entry.fastestTurns}턴` : "-"}</strong></div>
            <div class="record"><span>최고 피해</span><strong>${fmt(entry.highestDamage || 0)}</strong></div>
            <div class="codex-drop-list">
              <div><strong>등급 조우:</strong> ${ranks || "-"}</div>
              <div><strong>변이 조우:</strong> ${mutations || "-"}</div>
              <div><strong>장비 기록:</strong> ${itemDrops}</div>
              <div><strong>회복품 기록:</strong> ${recoveryDrops}</div>
              <div><strong>관찰 단계:</strong> 1 / 10 / 50 / 200마리</div>
            </div>
          </article>`;
      }).join("");
    }

    function sanitizeFieldCareBudget(value) {
      const budget = Math.floor(Number(value));
      return clamp(Number.isFinite(budget) ? budget : 25,1,999999);
    }

    function fieldCareNeeds() {
      const s = totalStats();
      const missingHp = Math.max(0,s.maxHp-state.hp);
      const missingMp = Math.max(0,s.maxMp-state.mp);
      return {
        maxHp:s.maxHp,
        maxMp:s.maxMp,
        missingHp,
        missingMp,
        hpGoldNeeded:Math.ceil(missingHp/2),
        mpGoldNeeded:Math.ceil(missingMp)
      };
    }

    function allocateFieldCareGold(maxSpend,needs,priority) {
      let hpSpend = 0;
      let mpSpend = 0;
      let remaining = Math.max(0,Math.floor(maxSpend));

      const spendHp = amount => {
        const spent = Math.min(remaining,Math.max(0,needs.hpGoldNeeded-hpSpend),Math.max(0,Math.floor(amount)));
        hpSpend += spent;
        remaining -= spent;
      };
      const spendMp = amount => {
        const spent = Math.min(remaining,Math.max(0,needs.mpGoldNeeded-mpSpend),Math.max(0,Math.floor(amount)));
        mpSpend += spent;
        remaining -= spent;
      };

      if (priority === "hp") {
        spendHp(remaining);
        spendMp(remaining);
      } else if (priority === "mp") {
        spendMp(remaining);
        spendHp(remaining);
      } else {
        const hpRatio = needs.maxHp > 0 ? needs.missingHp/needs.maxHp : 0;
        const mpRatio = needs.maxMp > 0 ? needs.missingMp/needs.maxMp : 0;
        const ratioTotal = hpRatio+mpRatio;

        if (ratioTotal > 0) {
          const initialHp = Math.round(remaining*(hpRatio/ratioTotal));
          const initialMp = remaining-initialHp;
          spendHp(initialHp);
          spendMp(initialMp);
        }
        spendHp(remaining);
        spendMp(remaining);
      }

      return {hpSpend,mpSpend,totalSpend:hpSpend+mpSpend};
    }

    function applyFieldCare() {
      const care = state.fieldCare || {};
      if (!care.enabled) return null;

      care.budget = sanitizeFieldCareBudget(care.budget);
      if (!["balanced","hp","mp"].includes(care.priority)) care.priority = "balanced";

      const needs = fieldCareNeeds();
      if (needs.missingHp <= 0 && needs.missingMp <= 0) return null;

      const available = Math.min(care.budget,Math.floor(state.gold));
      if (available <= 0) {
        log("야전 정비 미집행 · 사용할 골드가 없습니다.","neutral");
        return {spent:0,hpGain:0,mpGain:0};
      }

      const allocation = allocateFieldCareGold(available,needs,care.priority);
      if (allocation.totalSpend <= 0) return null;

      const beforeHp = state.hp;
      const beforeMp = state.mp;
      const s = totalStats();

      state.hp = Math.min(s.maxHp,state.hp+allocation.hpSpend*2);
      state.mp = Math.min(s.maxMp,state.mp+allocation.mpSpend);
      state.gold -= allocation.totalSpend;

      const hpGain = state.hp-beforeHp;
      const mpGain = state.mp-beforeMp;

      state.records.fieldCareBattles = (state.records.fieldCareBattles || 0)+1;
      state.records.fieldCareGoldSpent = (state.records.fieldCareGoldSpent || 0)+allocation.totalSpend;
      state.records.fieldCareHpRestored = (state.records.fieldCareHpRestored || 0)+hpGain;
      state.records.fieldCareMpRestored = (state.records.fieldCareMpRestored || 0)+mpGain;

      log(`야전 정비 계약 · ${fmt(allocation.totalSpend)}G 지출 · HP +${fmt(hpGain)} · MP +${fmt(mpGain)}`,"battle-heal");
      return {spent:allocation.totalSpend,hpGain,mpGain};
    }

    function updateFieldCareSettings() {
      state.fieldCare.enabled = !!els.fieldCareToggle.checked;
      state.fieldCare.budget = sanitizeFieldCareBudget(els.fieldCareBudget.value);
      state.fieldCare.priority = ["balanced","hp","mp"].includes(els.fieldCarePriority.value)
        ? els.fieldCarePriority.value
        : "balanced";
      saveState();
      renderFieldCare();
    }

    function setFieldCareBudget(value) {
      state.fieldCare.budget = sanitizeFieldCareBudget(value);
      els.fieldCareBudget.value = state.fieldCare.budget;
      saveState();
      renderFieldCare();
    }

    function renderFieldCare() {
      const care = state.fieldCare || (state.fieldCare = {enabled:false,budget:25,priority:"balanced"});
      care.budget = sanitizeFieldCareBudget(care.budget);
      if (!["balanced","hp","mp"].includes(care.priority)) care.priority = "balanced";

      els.fieldCareToggle.checked = !!care.enabled;
      els.fieldCareBudget.value = care.budget;
      els.fieldCarePriority.value = care.priority;

      const card = els.fieldCareStatus.closest(".field-care-card");
      card?.classList.toggle("enabled",!!care.enabled);
      els.fieldCareStatus.textContent = care.enabled ? "계약 실행 중" : "계약 해제";
      els.fieldCareStatus.classList.toggle("on",!!care.enabled);
      els.fieldCareStatus.classList.toggle("off",!care.enabled);

      const needs = fieldCareNeeds();
      const potentialSpend = Math.min(care.budget,Math.floor(state.gold),needs.hpGoldNeeded+needs.mpGoldNeeded);
      const priorityText = care.priority === "hp" ? "체력 우선" : care.priority === "mp" ? "마나 우선" : "부족 비율에 따른 균형";

      els.fieldCarePreview.classList.toggle("active",!!care.enabled);
      els.fieldCarePreview.innerHTML = care.enabled
        ? `다음 전투 후 최대 <strong>${fmt(care.budget)}G</strong> · ${priorityText}<br>현재 부족분 기준 예상 최대 지출 ${fmt(potentialSpend)}G · 1G당 HP 2 또는 MP 1`
        : `계약을 켜면 전투 후 최대 ${fmt(care.budget)}G 안에서 필요한 만큼만 사용한다. 골드가 부족하면 보유액까지만 정비한다.`;
    }

    function showDefeatModal({enemy,result,autoStopped}) {
      const stats = totalStats();
      els.defeatEnemy.textContent = enemy?.name || "알 수 없는 적";
      els.defeatTurns.textContent = `${fmt(result?.turns || 0)}턴`;
      els.defeatHp.textContent = `${fmt(state.hp)} / ${fmt(stats.maxHp)}`;
      els.defeatMp.textContent = `${fmt(state.mp)} / ${fmt(stats.maxMp)}`;
      els.defeatSummary.textContent = autoStopped
        ? "연속 패배를 막기 위해 자동 사냥을 멈췄습니다. 장비와 경험치는 잃지 않았습니다."
        : "이번 사냥에서 쓰러졌습니다. 장비와 경험치는 잃지 않았으며, 정비 후 다시 도전할 수 있습니다.";
      els.defeatAutoStop.textContent = autoStopped
        ? "자동 사냥이 즉시 중지되었습니다."
        : "수동 사냥 패배가 기록되었습니다.";
      els.defeatAutoStop.classList.toggle("manual",!autoStopped);
      els.defeatModal.classList.remove("hidden");
      document.body.classList.add("modal-open");

      if (navigator.vibrate) {
        try { navigator.vibrate([120,70,220]); } catch (_) {}
      }
    }

    function closeDefeatModal() {
      els.defeatModal.classList.add("hidden");
      document.body.classList.remove("modal-open");
    }

    function openRecoveryInventoryAfterDefeat() {
      closeDefeatModal();
      switchPage("inventory");
      setTimeout(() => {
        document.querySelector(".consumable-shelf")?.scrollIntoView({behavior:"smooth",block:"start"});
      },80);
    }

    async function hunt(inRareMap=false) {
      if (!state.classId) { showClassModal(); return; }
      if (state.pendingRecovery) {
        const pending = state.pendingRecovery;
        state.consumables[pending.id] = (state.consumables[pending.id] || 0)+1;
        state.pendingRecovery = null;
        log(`${pending.name}을 회복품 가방으로 자동 이동했습니다.`,pending.color);
      }
      recoverOffline();
      const cost = staminaCost(inRareMap);
      if (state.stamina < cost) {
        if (autoTimer) toggleAuto();
        log(`활력이 부족해 사냥을 중단했습니다. 필요 ${cost}, 현재 ${state.stamina}.`, "negative");
        toast("활력이 부족합니다.");
        renderAll();
        return;
      }
      if (isBusy) return;
      if (inRareMap && (!state.rareMap || state.rareMap.expiresAt <= Date.now())) {
        state.rareMap = null;
        renderAll();
        return;
      }

      isBusy = true;
      els.huntBtn.disabled = true;
      const z = zone();
      const feverActive = state.feverBattles > 0;
      const enemy = createEnemy(inRareMap);
      els.enemyName.textContent = "사냥중";
      els.enemyName.classList.remove("status-idle");
      els.enemyName.classList.add("status-hunting");
      els.enemyMeta.innerHTML = `${enemy.name} · ${enemy.rank}${enemy.specialType ? ` · <span class="rare-monster-tag">${enemy.specialLabel}</span>` : ""}${enemy.mutation ? ` · <span class="mutation-badge">${enemy.mutation.name}: ${enemy.mutation.desc}</span>` : ""} · 예상 전투력 ${fmt(Math.round(enemy.attack*6 + enemy.defense*3 + enemy.hp*.2))}`;

      await new Promise(r => setTimeout(r, 650));

      const result = simulateBattle(enemy);
      let defeatNotice = null;
      if (state.stamina >= STAMINA_MAX) state.staminaUpdatedAt = Date.now();
      state.stamina = Math.max(0, state.stamina - cost);
      state.mp = result.heroMp;
      result.events.forEach(event => log(event.text, event.cls));
      state.heat[z.id] = clamp((state.heat[z.id] || 0) + (inRareMap ? 2 : 4), 0, 100);
      state.heatUpdatedAt = Date.now();

      if (result.won) {
        const s = totalStats();
        const rareGold = inRareMap ? state.rareMap.gold : 1;
        const earnedGold = Math.max(1, Math.round(enemy.gold * .78 * rareGold * (1 + s.goldFind/100) * (feverActive ? 1.5 : 1)));
        const earnedXp = Math.max(1, Math.round(enemy.xp * .68 * (inRareMap ? 1.6 : 1) * (feverActive ? 1.2 : 1)));
        state.gold += earnedGold;
        state.xp += earnedXp;
        state.records.gold += 0;
        state.records.totalGold += earnedGold;
        state.records.kills++;
        state.records.wins++;
        if (enemy.rank !== "일반") state.records.eliteKills = (state.records.eliteKills || 0)+1;
        if (enemy.specialType) {
          state.records.rareMonsterKills = (state.records.rareMonsterKills || 0)+1;
          log(`희귀 몬스터 처치 · ${enemy.baseName}`, "rarity-legendary");
        }
        if (enemy.mutation) state.records.mutatedKills = (state.records.mutatedKills || 0) + 1;
        state.mastery[state.classId] = (state.mastery[state.classId] || 0) + 1;
        state.records.highestDamage = Math.max(state.records.highestDamage, result.maxHit);
        state.streak++;
        state.records.bestStreak = Math.max(state.records.bestStreak, state.streak);
        state.hp = Math.min(s.maxHp, result.heroHp + Math.round(s.maxHp * (.10 + s.postHeal)));
        const manaBreath = Math.max(1, Math.round(s.maxMp * .05));
        state.mp = Math.min(s.maxMp, state.mp + manaBreath);

        log(`${enemy.name} 처치 · 경험치 +${fmt(earnedXp)} · 골드 +${fmt(earnedGold)} · ${result.turns}턴 · 기술 ${result.skillUses}회${result.specialCount ? ` · 직업 효과 ${result.specialCount}회` : ""}`, "positive");
        log(`전투 호흡 · 마나 +${fmt(manaBreath)} · 현재 MP ${fmt(state.mp)}/${fmt(s.maxMp)}`, "battle-heal");

        levelUpCheck();

        const mapBase = .009;
        const mapChance = (mapBase + (s.mapFind/100)) * (enemy.rank === "일반" ? 1 : 2.1) * enemy.mapMult * (feverActive ? 1.45 : 1);
        if (!inRareMap && !state.rareMap && Math.random() < mapChance) generateRareMap();

        let droppedItem = null;
        const itemChance = enemy.specialType === "reliccarrier"
          ? 1
          : Math.min(.92,enemy.drop*(1+s.itemFind/100)*(inRareMap ? state.rareMap.item : 1)*(feverActive ? 2.0 : 1));
        if (Math.random() < itemChance) {
          const bonus = enemy.specialType === "reliccarrier" ? 12 : inRareMap ? 6 : enemy.rank === "일반" ? 0 : 2.5;
          droppedItem = enemy.specialType === "reliccarrier" && Math.random() < .22
            ? (Math.random() < .82 ? generateSetItem(z.mult*1.65,randomChoice(slots).key) : generateUniqueItem(z.mult*1.65,randomChoice(slots).key))
            : generateItem(z.mult*(inRareMap ? 1.35 : 1),bonus);
          storeItem(droppedItem);
          recordDroppedItem(droppedItem);
          const dropVerb = itemKind(droppedItem) === "unique" ? "유물이 모습을 드러냈다" : itemKind(droppedItem) === "set" ? "세트 전리품 발견" : "전리품 획득";
          log(`${dropVerb} · [${droppedItem.rarityName}] ${droppedItem.name} · ${fmt(droppedItem.score)}점`, droppedItem.rarityClass);

          if (s.extraDropChance > 0 && Math.random() < s.extraDropChance) {
            const bonusItem = generateStandardItem(z.mult*(inRareMap ? 1.35 : 1),bonus);
            storeItem(bonusItem);
            recordDroppedItem(bonusItem);
            log(`일곱 번째 행운 · 전리품이 하나 더 떨어졌다: ${bonusItem.name}`, "rarity-unique");
          }
        }

        const skillBookDrop = enemy.specialType === "bookeater"
          ? generateSkillBook(state.classId,Math.random() < .18 ? "forbidden" : "complete")
          : rollSkillBookDrop(enemy,inRareMap);
        if (skillBookDrop) storeSkillBook(skillBookDrop);

        const recoveryDrop = enemy.specialType === "greenwisp"
          ? {...recoveryItems.stamina,droppedAt:Date.now()}
          : rollRecoveryDrop(enemy,inRareMap);
        if (recoveryDrop) {
          state.records.recoveryDrops = (state.records.recoveryDrops || 0)+1;
          if (recoveryDrop.id === "stamina") state.records.staminaPotionDrops = (state.records.staminaPotionDrops || 0)+1;
          state.consumables[recoveryDrop.id] = (state.consumables[recoveryDrop.id] || 0)+1;
          state.pendingRecovery = null;
          log(`회복품 자동 보관 · ${recoveryDrop.name} +1`,recoveryDrop.color);
        }

        updateCodex(enemy, result, droppedItem, recoveryDrop);

        if (feverActive) {
          state.feverBattles = Math.max(0, state.feverBattles - 1);
          log(`전리품 피버 보상 적용 · 남은 전투 ${state.feverBattles}회`, "rarity-legendary");
          if (state.feverBattles === 0) log("전리품 피버가 종료되었습니다.", "neutral");
        } else {
          state.fever = Math.min(100, state.fever + 12 + (enemy.rank !== "일반" ? 8 : 0) + (enemy.mutation ? 10 : 0));
          if (state.fever >= 100) {
            state.fever = 0;
            state.feverBattles = 3;
            state.records.feverActivations = (state.records.feverActivations || 0) + 1;
            log("전리품 피버 발동! 다음 3회 사냥의 골드·경험치·장비·지도 확률이 상승합니다.", "rarity-legendary");
            toast("전리품 피버 발동!");
          }
        }

        if (enemy.specialType === "goldrunner") {
          const bonusGold = Math.max(50,Math.round(enemy.gold*4));
          state.gold += bonusGold;
          state.records.totalGold += bonusGold;
          for (let i=0;i<2;i++) {
            const treasure = generateStandardItem(z.mult*1.25,7);
            storeItem(treasure);
            recordDroppedItem(treasure);
          }
          log(`황금 도망자의 자루를 열었다 · 골드 +${fmt(bonusGold)} · 추가 장비 2개`, "rarity-legendary");
        }

        if (inRareMap) {
          log(`희귀 지도 [${state.rareMap.name}] 공략 완료!`, "rarity-epic");
          state.rareMap = null;
        }
      } else if (result.escaped) {
        state.records.rareMonsterEscapes = (state.records.rareMonsterEscapes || 0)+1;
        state.streak = 0;
        state.hp = Math.max(1,result.heroHp);
        state.mp = Math.max(0,result.heroMp);
        updateCodex(enemy,result,null,null);
        log(`${enemy.name}이 ${enemy.turnLimit}막 안에 쓰러지지 않아 도망쳤습니다.`, "negative");
      } else {
        const s = totalStats();
        const autoStopped = !!autoTimer;
        if (autoTimer) toggleAuto();

        state.records.defeats++;
        state.streak = 0;
        state.hp = Math.max(1,Math.round(s.maxHp*.45));
        state.mp = Math.max(0,Math.round(s.maxMp*.25));
        updateCodex(enemy,result,null,null);
        if (feverActive) state.feverBattles = Math.max(0,state.feverBattles-1);

        defeatNotice = {enemy,result,autoStopped};
        log(`${enemy.name}에게 패배했습니다.${autoStopped ? " 자동 사냥을 즉시 중지했습니다." : ""} 장비와 경험치는 잃지 않습니다.`, "negative");
      }

      applyFieldCare();
      if (defeatNotice) showDefeatModal(defeatNotice);
      saveState();
      setTimeout(() => {
        isBusy = false;
        els.huntBtn.disabled = false;
        renderAll();
      }, 180);
    }

    function levelUpCheck() {
      let leveled = false;
      while (state.xp >= xpNeeded()) {
        const need = xpNeeded();
        state.xp -= need;
        state.level++;
        state.statPoints += 2;
        if (state.level % 3 === 0) state.skillPoints += 1;
        leveled = true;
        const s = totalStats();
        state.hp = s.maxHp;
        state.mp = s.maxMp;
        log(`레벨 ${state.level} 달성! 능력치 포인트 +2${state.level % 3 === 0 ? " · 스킬 포인트 +1" : ""} · 체력과 마나가 모두 회복되었습니다.`, "rarity-epic");
      }
      if (leveled) toast(`레벨 ${state.level} 달성!`);
    }

    function equipLastLoot() {
      const item = state.lastLoot;
      if (!item) return;
      equipInventoryItem(item.id);
    }

    function sellLastLoot() {
      const item = state.lastLoot;
      if (!item) return;
      sellInventoryItem(item.id);
    }

    function potion() { useConsumable("health"); }
    function manaPotion() { useConsumable("mana"); }
    function useElixir() { useConsumable("elixir"); }

    function updateAutoButton() {
      if (!autoTimer) {
        els.autoBtn.textContent = "연속 사냥 · 5초";
        return;
      }
      const seconds = Math.max(1, Math.ceil((autoNextAt - Date.now()) / 1000));
      els.autoBtn.textContent = `자동 사냥 중지 · 다음 ${seconds}초`;
    }

    function toggleAuto() {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
        autoNextAt = 0;
        updateAutoButton();
        return;
      }
      recoverOffline();
      if (state.stamina < 1) return toast("활력이 부족합니다.");
      hunt(false);
      autoNextAt = Date.now() + AUTO_HUNT_INTERVAL_MS;
      autoTimer = setInterval(() => {
        if (!isBusy) {
          autoNextAt = Date.now() + AUTO_HUNT_INTERVAL_MS;
          hunt(false);
        }
      }, AUTO_HUNT_INTERVAL_MS);
      updateAutoButton();
    }

    function log(text, cls="") {
      state.logs.push({ text, cls, at: Date.now() });
      if (state.logs.length > 220) state.logs = state.logs.slice(-220);
    }

    function toast(message) {
      els.toast.textContent = message;
      els.toast.classList.add("show");
      clearTimeout(toast.timer);
      toast.timer = setTimeout(() => els.toast.classList.remove("show"), 1600);
    }

    function showClassModal() {
      if (autoTimer) toggleAuto();
      els.classOptions.innerHTML = Object.entries(classes).map(([id, cls]) => `
        <button class="class-option" data-class="${id}">
          <div class="class-option-name">${cls.name}</div>
          <div class="class-option-stat">${cls.line} · 주 능력치 ${attributeInfo[cls.main].name}</div>
          <div class="class-option-desc">${cls.desc}</div>
          <div class="class-option-passive">${cls.passive}</div>
        </button>
      `).join("");
      els.classOptions.querySelectorAll("[data-class]").forEach(btn => {
        btn.onclick = () => chooseClass(btn.dataset.class);
      });
      els.classModal.classList.remove("hidden");
    }

    function chooseClass(id) {
      const cls = classes[id];
      if (!cls) return;
      const firstChoice = !state.classId;
      state.classId = id;
      if (firstChoice) {
        Object.entries(cls.start).forEach(([k,v]) => state.attributes[k] += v);
        state.statPoints += 2;
        state.skillPoints += 1;
        state.logs.push({ text:`${cls.name}의 길을 선택했습니다. 주 능력치 ${attributeInfo[cls.main].name}이 증가하며 시작 스킬 포인트 1을 받았습니다.`, cls:"rarity-epic", at:Date.now() });
      }
      const s = totalStats();
      state.hp = s.maxHp;
      state.mp = s.maxMp;
      els.classModal.classList.add("hidden");
      saveState();
      renderAll();
      toast(`${cls.name} 선택 완료`);
    }

    function attributeDetail(key) {
      const detail = {
        str:"공격력 +1.48",
        vit:"최대 체력 +8 · 방어력 +0.62",
        int:"마법력 +1.58 · 최대 마나 +5.4",
        spi:"방어력 +0.78 · 마나 +4.2 · 체력 +2",
        luck:"치명타 +0.33%p · 골드 +0.12% · 장비 발견 +0.11%",
        spd:"공격력 +0.28 · 치명타 +0.09%p · 연속공격·회피·지도 발견"
      };
      return detail[key] || attributeInfo[key]?.desc || "";
    }

    function manualStatAllocation() {
      const clsStart = state.classId ? (classes[state.classId]?.start || {}) : {};
      return Object.fromEntries(Object.keys(attributeInfo).map(key => [
        key,
        Math.max(0,Math.round(Number(state.attributes[key] || 0)-5-Number(clsStart[key] || 0)))
      ]));
    }

    function refundableStatPoints() {
      return Object.values(manualStatAllocation()).reduce((sum,value) => sum+value,0);
    }

    function statResetCost() {
      if (Number(state.statResetCount || 0) === 0) return 0;
      const paidResetIndex = Math.max(0,Number(state.statResetCount || 0)-1);
      return Math.max(500,Math.round((500+state.level*120+paidResetIndex*700)/100)*100);
    }

    function resetAllocatedStats() {
      const refund = refundableStatPoints();
      if (refund <= 0) return toast("되돌릴 능력치 포인트가 없습니다.");

      const cost = statResetCost();
      if (state.gold < cost) return toast(`초기화 비용이 부족합니다. 필요 ${fmt(cost)}G`);

      const costText = cost > 0 ? `${fmt(cost)}G` : "무료";
      if (!confirm(`배분한 능력치 ${fmt(refund)}포인트를 되돌릴까요?\n비용: ${costText}\n직업 기본 능력치와 장비 능력치는 유지됩니다.`)) return;

      if (autoTimer) toggleAuto();
      state.gold -= cost;
      state.records.statResetGoldSpent = (state.records.statResetGoldSpent || 0)+cost;

      state.attributes = Object.fromEntries(Object.keys(attributeInfo).map(key => [key,5]));
      const cls = currentClass();
      if (cls) {
        Object.entries(cls.start || {}).forEach(([key,value]) => {
          state.attributes[key] += Number(value || 0);
        });
      }

      state.statPoints += refund;
      state.statResetCount = Number(state.statResetCount || 0)+1;
      state.records.statResets = (state.records.statResets || 0)+1;

      const stats = totalStats();
      state.hp = stats.maxHp;
      state.mp = stats.maxMp;

      log(`능력치 초기화 · ${fmt(refund)}포인트 반환 · 비용 ${costText}`,cost > 0 ? "rarity-legendary" : "positive");
      saveState();
      renderAll();
      toast(cost > 0 ? `능력치 초기화 · ${fmt(cost)}G` : "첫 능력치 초기화 무료 완료");
    }

    function allocateStat(key, amount=1) {
      if (state.statPoints <= 0 || !Object.hasOwn(attributeInfo, key)) return;
      const safeAmount = Math.max(0, Math.min(state.statPoints, Math.floor(Number(amount) || 0)));
      if (safeAmount <= 0) return;
      state.attributes[key] += safeAmount;
      state.statPoints -= safeAmount;
      state.records.statPointsSpent = (state.records.statPointsSpent || 0)+safeAmount;
      const s = totalStats();
      state.hp = Math.min(s.maxHp, state.hp + Math.round(s.maxHp * Math.min(.25, safeAmount * .02)));
      state.mp = Math.min(s.maxMp, state.mp + Math.round(s.maxMp * Math.min(.25, safeAmount * .02)));
      log(`${attributeInfo[key].name} +${safeAmount} 배분 · 남은 포인트 ${state.statPoints}`, "neutral");
      saveState();
      renderAll();
    }

    function applyStatInput(key) {
      const input = els.attributes.querySelector(`[data-stat-input="${key}"]`);
      allocateStat(key, input?.value || 0);
    }

    function allocateRecommended() {
      const cls = currentClass();
      if (!cls || state.statPoints <= 0) return;
      const total = state.statPoints;
      allocateStat(cls.main, Math.ceil(total * .7));
      if (state.statPoints > 0) allocateStat(cls.secondary, state.statPoints);
    }

    function allocateBalanced() {
      if (state.statPoints <= 0) return;
      const keys = Object.keys(attributeInfo);
      const spent = state.statPoints;
      let cursor = 0;
      while (state.statPoints > 0) {
        state.attributes[keys[cursor % keys.length]]++;
        state.statPoints--;
        cursor++;
      }
      state.records.statPointsSpent = (state.records.statPointsSpent || 0)+spent;
      const s = totalStats();
      state.hp = Math.min(s.maxHp, state.hp + Math.round(s.maxHp * .15));
      state.mp = Math.min(s.maxMp, state.mp + Math.round(s.maxMp * .15));
      log("남은 능력치 포인트를 균등하게 배분했습니다.", "neutral");
      saveState();
      renderAll();
    }

    function renderClassStats() {
      const cls = currentClass();
      const attrs = totalAttributes();
      els.heroTitle.textContent = state.achievements.activeTitle
        ? `[${state.achievements.activeTitle}] ${state.nickname || "무명의 사냥꾼"}`
        : state.nickname || "무명의 사냥꾼";
      els.classLine.textContent = cls ? `${cls.line} · 주 능력치 ${attributeInfo[cls.main].name}` : "직업 선택 필요";
      els.classPassiveTitle.textContent = cls ? `${cls.name} 패시브` : "직업 패시브";
      els.classPassive.textContent = cls ? cls.passive : "직업을 선택하면 고유 효과가 적용됩니다.";
      const mastery = cls ? (state.mastery[state.classId] || 0) : 0;
      els.masteryText.textContent = `숙련도 ${fmt(mastery)} · 공격 보정 +${Math.min(25, mastery * .1).toFixed(1)}%`;
      els.statPoints.textContent = `남은 포인트 ${fmt(state.statPoints)}`;
      els.attributes.innerHTML = Object.entries(attributeInfo).map(([key, info]) => `
        <div class="attribute-row ${cls && cls.main === key ? "main-stat" : ""}">
          <div class="attribute-label">
            <span>${info.short} <strong>${fmt(attrs[key])}</strong></span>
            <small>${attributeDetail(key)}</small>
          </div>
          <input type="number" min="0" max="${state.statPoints}" value="${state.statPoints > 0 ? 1 : 0}" data-stat-input="${key}" ${state.statPoints <= 0 ? "disabled" : ""} />
          <button data-stat-apply="${key}" ${state.statPoints <= 0 ? "disabled" : ""}>배분</button>
        </div>
      `).join("");
      const resetCost = statResetCost();
      const refund = refundableStatPoints();
      els.statResetHint.textContent = resetCost === 0
        ? `첫 초기화 무료 · 반환 가능 ${fmt(refund)}포인트`
        : `반환 가능 ${fmt(refund)}포인트 · 비용 ${fmt(resetCost)}G`;
      els.statResetBtn.textContent = resetCost === 0 ? "무료 초기화" : `${fmt(resetCost)}G로 초기화`;
      els.statResetBtn.disabled = refund <= 0 || state.gold < resetCost;
      els.attributes.querySelectorAll("[data-stat-apply]").forEach(btn => btn.onclick = () => applyStatInput(btn.dataset.statApply));
      els.attributes.querySelectorAll("[data-stat-input]").forEach(input => input.onkeydown = event => {
        if (event.key === "Enter") applyStatInput(input.dataset.statInput);
      });
    }

    let activeEquipmentTooltipSlot = null;

    function equipmentTooltipHtml(item) {
      normalizeItemAffixes(item);
      const kind = itemKind(item);
      const slotLabel = slots.find(slot => slot.key === item.slot)?.label || item.slot;
      const kindLabel = kind === "unique"
        ? "유니크 장비"
        : kind === "set"
          ? `${item.setName || "세트"} 세트`
          : `${item.rarityName || "일반"} 장비`;
      const statRows = itemStatLines(item);

      return `
        <div class="equipment-tooltip-head">
          <div>
            <span class="equipment-tooltip-type">${kindLabel} · ${slotLabel}</span>
            <strong class="${item.rarityClass}">${itemKind(item)==="unique" ? "◆ " : itemKind(item)==="set" ? "◇ " : ""}${item.name}</strong>
          </div>
          <b>${fmt(item.score)}점</b>
        </div>
        <div class="equipment-tooltip-equipped">현재 장착 중</div>
        <div class="equipment-tooltip-stats">
          ${statRows.length
            ? statRows.map(line => `<div>${line}</div>`).join("")
            : `<div class="neutral">추가 능력 없음</div>`}
        </div>
        ${specialItemLines(item)}
        <div class="equipment-tooltip-footer">
          <span>판매가</span>
          <strong>${fmt(item.sellPrice || 0)}G</strong>
        </div>
      `;
    }

    function positionEquipmentTooltip(clientX,clientY,anchor=null) {
      const tooltip = els.equipmentTooltip;
      if (!tooltip || tooltip.classList.contains("hidden")) return;

      const margin = 12;
      const gap = 14;
      const rect = tooltip.getBoundingClientRect();
      let x = Number.isFinite(clientX) ? clientX+gap : margin;
      let y = Number.isFinite(clientY) ? clientY+gap : margin;

      if (anchor) {
        const anchorRect = anchor.getBoundingClientRect();
        x = anchorRect.right+gap;
        y = anchorRect.top;
        if (x+rect.width > window.innerWidth-margin) {
          x = anchorRect.left-rect.width-gap;
        }
      }

      if (x+rect.width > window.innerWidth-margin) x = window.innerWidth-rect.width-margin;
      if (y+rect.height > window.innerHeight-margin) y = window.innerHeight-rect.height-margin;
      x = Math.max(margin,x);
      y = Math.max(margin,y);

      tooltip.style.left = `${Math.round(x)}px`;
      tooltip.style.top = `${Math.round(y)}px`;
    }

    function showEquipmentTooltip(slotKey,event=null,anchor=null) {
      const item = state.equipment[slotKey];
      if (!item || !els.equipmentTooltip) return;

      activeEquipmentTooltipSlot = slotKey;
      els.equipmentTooltip.innerHTML = equipmentTooltipHtml(item);
      els.equipmentTooltip.classList.remove("hidden");
      els.equipmentTooltip.setAttribute("aria-hidden","false");

      requestAnimationFrame(() => {
        const pointerX = event && Number.isFinite(event.clientX) ? event.clientX : NaN;
        const pointerY = event && Number.isFinite(event.clientY) ? event.clientY : NaN;
        positionEquipmentTooltip(pointerX,pointerY,anchor);
      });
    }

    function hideEquipmentTooltip() {
      activeEquipmentTooltipSlot = null;
      if (!els.equipmentTooltip) return;
      els.equipmentTooltip.classList.add("hidden");
      els.equipmentTooltip.setAttribute("aria-hidden","true");
    }

    function bindEquipmentTooltips() {
      els.equipment.querySelectorAll("[data-equipment-tooltip]").forEach(row => {
        const slotKey = row.dataset.equipmentTooltip;

        row.addEventListener("mouseenter",event => {
          showEquipmentTooltip(slotKey,event,row);
        });

        row.addEventListener("mousemove",event => {
          if (activeEquipmentTooltipSlot === slotKey && window.matchMedia("(hover:hover)").matches) {
            positionEquipmentTooltip(event.clientX,event.clientY);
          }
        });

        row.addEventListener("mouseleave",hideEquipmentTooltip);
        row.addEventListener("focus",() => showEquipmentTooltip(slotKey,null,row));
        row.addEventListener("blur",hideEquipmentTooltip);

        row.addEventListener("click",event => {
          if (window.matchMedia("(hover:hover)").matches) return;
          event.stopPropagation();
          if (activeEquipmentTooltipSlot === slotKey && !els.equipmentTooltip.classList.contains("hidden")) {
            hideEquipmentTooltip();
          } else {
            showEquipmentTooltip(slotKey,null,row);
          }
        });
      });
    }

    function renderEquipment() {
      hideEquipmentTooltip();
      els.equipment.innerHTML = slots.map(slot => {
        const item = state.equipment[slot.key];
        return `
          <div class="equip-row ${item ? "has-equipment-tooltip" : ""}"
            ${item ? `data-equipment-tooltip="${slot.key}" tabindex="0" aria-label="${slot.label} 장비 정보 보기"` : ""}>
            <div class="slot">${slot.label}</div>
            <div class="equip-name ${item ? item.rarityClass : "neutral"}">
              ${item ? `${itemKind(item)==="unique" ? "◆ " : itemKind(item)==="set" ? "◇ " : ""}${item.name} · ${fmt(item.score)}` : "비어 있음"}
            </div>
            ${item ? `<span class="equipment-info-mark">i</span>` : ""}
          </div>
        `;
      }).join("");
      bindEquipmentTooltips();
    }

    function renderZones() {
      els.zoneSelect.innerHTML = zones.map(z => `
        <option value="${z.id}">T${z.tier} · ${z.name} · 권장 ${fmt(z.rec)}</option>
      `).join("");
      els.zoneSelect.value = state.currentZone;

      const current = zone();
      els.zoneSelectSummary.innerHTML = `
        <div><span>선택 던전</span><strong>${current.name}</strong></div>
        <div><span>권장 전투력</span><strong>${fmt(current.rec)}</strong></div>
        <div><span>현재 과열도</span><strong>${Math.round(state.heat[current.id] || 0)}%</strong></div>
      `;

      els.zoneSelect.onchange = () => {
        const nextZone = zones.find(z => z.id === els.zoneSelect.value);
        if (!nextZone || nextZone.id === state.currentZone) return;
        if (autoTimer) toggleAuto();
        state.currentZone = nextZone.id;
        state.zonesVisited[state.currentZone] = true;
        saveState();
        renderAll();
        log(`${nextZone.name}으로 이동했습니다.`, "neutral");
        renderLog();
      };
    }

    function renderLoot() {
      state.lastLoot = null;
      els.lootCard.classList.add("hidden");
      els.lootCard.classList.remove("unique-drop","set-drop");
      els.lootCard.innerHTML = "";
    }

    function renderLog() {
      const rows = state.logs.map(entry => {
        if (typeof entry === "string") return `<div class="log-entry">${entry}</div>`;
        const time = new Date(entry.at).toLocaleTimeString("ko-KR", {hour:"2-digit", minute:"2-digit", second:"2-digit"});
        return `<div class="log-entry ${entry.cls || ""}"><span class="neutral">${time}</span> ${entry.text}</div>`;
      }).join("");
      els.combatLog.innerHTML = rows;
      els.combatLog.scrollTop = els.combatLog.scrollHeight;
    }

    function renderAll() {
      recoverOffline();
      ensureStaminaGame();
      ensureDailyDungeon();
      ensureArena();
      const s = totalStats();
      const maxHp = s.maxHp;
      const maxMp = s.maxMp;
      const need = xpNeeded();
      const z = zone();
      const heat = state.heat[z.id] || 0;

      els.levelBadge.textContent = `Lv.${state.level}`;
      renderClassStats();
      els.power.textContent = fmt(power());
      els.gold.textContent = fmt(state.gold);
      els.attack.textContent = `${fmt(s.attack)} / ${fmt(s.magicPower)}`;
      els.defense.textContent = fmt(s.defense);
      els.crit.textContent = `${s.crit.toFixed(1)}%`;
      els.streak.textContent = fmt(state.streak);

      els.xpText.textContent = `${fmt(state.xp)} / ${fmt(need)}`;
      els.xpBar.style.width = `${clamp(state.xp / need * 100, 0, 100)}%`;
      els.focusText.textContent = `${fmtStamina(state.stamina)} / ${STAMINA_MAX} · ${staminaRecoveryLabel()}`;
      els.focusBar.style.width = `${state.stamina / STAMINA_MAX * 100}%`;
      els.focusBonusText.textContent = "일반 사냥 -1 · 희귀 지도 -3";

      els.currentZoneName.textContent = z.name;
      if (!isBusy) {
        els.enemyName.textContent = "대기중";
        els.enemyName.classList.remove("status-hunting");
        els.enemyName.classList.add("status-idle");
        els.enemyMeta.textContent = `권장 전투력 ${fmt(z.rec)} · 현재 전투력 ${fmt(power())}`;
      }

      els.hpText.textContent = `${fmt(state.hp)} / ${fmt(maxHp)}`;
      els.hpBar.style.width = `${clamp(state.hp / maxHp * 100, 0, 100)}%`;
      els.mpText.textContent = `${fmt(state.mp)} / ${fmt(maxMp)}`;
      els.mpBar.style.width = `${clamp(state.mp / maxMp * 100, 0, 100)}%`;
      els.heatText.textContent = `${Math.round(heat)}% · 적 강화 +${Math.round(heat*.45)}%`;
      els.heatBar.style.width = `${heat}%`;
      els.feverText.textContent = state.feverBattles > 0 ? `피버 활성 · 남은 ${state.feverBattles}회` : `${Math.round(state.fever)} / 100`;
      els.feverBar.style.width = `${state.feverBattles > 0 ? 100 : state.fever}%`;

      renderEquipment();
      renderZones();
      renderGuide();
      renderLoot();
      renderRareMap();
      renderRecoveryCard();
      renderSkillBookDrop();
      renderConsumables();
      renderFieldCare();
      renderCodex();
      renderBounties();
      renderSkills();
      renderQuests();
      renderAttendance();
      renderStaminaCamp();
      renderDailyDungeon();
      renderDailyBoss();
      renderAbyss();
      renderCollectionHall();
      renderMercenaries();
      renderArena();
      renderSaveVault();
      renderGambleShop();
      renderLog();
      renderInventory();
      renderCharacterDetails();
      renderInfo();
      renderMarket();
    }

    document.querySelectorAll(".top-tab").forEach(btn => btn.onclick = () => switchPage(btn.dataset.pageTarget));
    document.querySelectorAll(".info-tab").forEach(btn => btn.onclick = () => {
      activeInfoTab = btn.dataset.infoTarget;
      renderInfo();
    });
    els.inventoryFilter.onchange = renderInventory;
    els.inventorySort.onchange = renderInventory;
    els.nicknameSaveBtn.onclick = updateNickname;
    els.nicknameEditInput.onkeydown = event => {
      if (event.key === "Enter") updateNickname();
    };
    els.nicknameConfirmBtn.onclick = confirmNickname;
    els.nicknameModalInput.onkeydown = event => {
      if (event.key === "Enter") confirmNickname();
    };
    els.shareSaveBtn.onclick = shareSaveFile;
    els.exportSaveBtn.onclick = exportSaveFile;
    els.importSaveBtn.onclick = () => els.importSaveInput.click();
    els.importSaveInput.onchange = () => importSaveFile(els.importSaveInput.files?.[0]);
    els.recommendedStatsBtn.onclick = allocateRecommended;
    els.balancedStatsBtn.onclick = allocateBalanced;
    els.refreshBountiesBtn.onclick = refreshBounties;
    els.attendanceClaimBtn.onclick = claimAttendance;
    els.dailyResetBtn.onclick = resetDailyDungeonDemo;
    els.arenaRefreshBtn.onclick = refreshArenaOpponents;
    els.sellJunkBtn.onclick = bulkSellJunk;
    [
      els.autoProcessEnabled,els.autoProcessCommon,els.autoProcessUncommon,
      els.autoProcessRare,els.autoProcessEpic,els.autoProcessLegendary,
      els.keepSpecialItems,els.keepSixAffixItems
    ].forEach(control => control.onchange = updateAutoProcessSettings);
    els.processExistingBtn.onclick = processExistingInventory;
    els.abyssStartBtn.onclick = startAbyss;
    els.abyssFightBtn.onclick = fightAbyssFloor;
    els.abyssRetreatBtn.onclick = retreatAbyss;
    els.gambleOnceBtn.onclick = () => gambleItems(1);
    els.gambleTenBtn.onclick = () => gambleItems(10);
    els.marketBuyBtn.onclick = () => buyMarket(marketQuantity(els.marketBuyQty));
    els.marketSellBtn.onclick = () => sellMarket(marketQuantity(els.marketSellQty));
    els.marketBuyQty.oninput = renderMarketTradePreviews;
    els.marketSellQty.oninput = renderMarketTradePreviews;
    document.querySelectorAll("[data-market-buy-preset]").forEach(btn => {
      btn.onclick = () => setMarketPreset("buy",btn.dataset.marketBuyPreset);
    });
    document.querySelectorAll("[data-market-sell-preset]").forEach(btn => {
      btn.onclick = () => setMarketPreset("sell",btn.dataset.marketSellPreset);
    });

    els.refillStaminaBtn.onclick = () => {
      state.stamina = STAMINA_MAX;
      state.staminaUpdatedAt = Date.now();
      log("시험용 활력 회복 · 활력 60", "positive");
      saveState();
      renderAll();
      toast("활력이 모두 회복되었습니다.");
    };

    els.huntBtn.onclick = () => hunt(false);
    els.autoBtn.onclick = toggleAuto;
    document.addEventListener("click",event => {
      if (!event.target.closest("[data-equipment-tooltip]") && !event.target.closest("#equipmentTooltip")) {
        hideEquipmentTooltip();
      }
    });
    window.addEventListener("scroll",hideEquipmentTooltip,{passive:true});
    window.addEventListener("resize",hideEquipmentTooltip);
    document.addEventListener("keydown",event => {
      if (event.key === "Escape") hideEquipmentTooltip();
    });
    els.defeatConfirmBtn.onclick = closeDefeatModal;
    els.defeatInventoryBtn.onclick = openRecoveryInventoryAfterDefeat;
    els.statResetBtn.onclick = resetAllocatedStats;
    els.changeClassBtn.onclick = showClassModal;
    els.potionBtn.onclick = potion;
    els.manaPotionBtn.onclick = manaPotion;
    els.elixirBtn.onclick = useElixir;
    els.staminaPotionBtn.onclick = () => useConsumable("stamina");
    els.fieldCareToggle.onchange = updateFieldCareSettings;
    els.fieldCareBudget.onchange = updateFieldCareSettings;
    els.fieldCareBudget.onkeydown = event => {
      if (event.key === "Enter") {
        event.preventDefault();
        updateFieldCareSettings();
        els.fieldCareBudget.blur();
      }
    };
    els.fieldCarePriority.onchange = updateFieldCareSettings;
    document.querySelectorAll("[data-care-budget]").forEach(btn => {
      btn.onclick = () => setFieldCareBudget(btn.dataset.careBudget);
    });
    els.baseballStartBtn.onclick = startBaseballGame;
    els.baseballGuessBtn.onclick = submitBaseballGuess;
    els.baseballGiveUpBtn.onclick = giveUpBaseballGame;
    els.baseballResetBtn.onclick = resetBaseballDemo;
    els.campUsePotionBtn.onclick = () => useConsumable("stamina");
    els.baseballGuessInput.onkeydown = event => {
      if (event.key === "Enter") submitBaseballGuess();
    };
    function deleteCurrentCharacter() {
      const nickname = cleanNickname(state.nickname || "");
      const displayName = nickname || "무명의 사냥꾼";

      const firstConfirmed = confirm(
        `[${displayName}] 캐릭터를 삭제하시겠습니까?\n\n`+
        "레벨, 장비, 골드, 수집 기록과 수동 저장 슬롯이 모두 삭제됩니다.\n"+
        "삭제한 데이터는 복구할 수 없습니다."
      );
      if (!firstConfirmed) return;

      const typed = prompt(
        "정말 삭제하려면 현재 닉네임을 정확히 입력하세요.\n\n"+
        `입력할 닉네임: ${displayName}`,
        ""
      );
      if (typed === null) return;

      if (cleanNickname(typed) !== displayName) {
        toast("닉네임이 일치하지 않아 캐릭터 삭제를 취소했습니다.");
        return;
      }

      if (autoTimer) toggleAuto();

      localStorage.removeItem(SAVE_KEY);
      for (let slot=1;slot<=3;slot++) {
        localStorage.removeItem(saveSlotKey(slot));
      }

      state = defaultState();
      saveState();
      renderAll();
      showNicknameModal();
      toast("캐릭터가 삭제되었습니다.");
    }

    els.resetBtn.onclick = deleteCurrentCharacter;

    window.addEventListener("beforeunload", saveState);
    setInterval(() => {
      recoverOffline();
      renderRareMap();
      const s = totalStats();
      els.focusText.textContent = `${fmtStamina(state.stamina)} / ${STAMINA_MAX} · ${staminaRecoveryLabel()}`;
      els.focusBar.style.width = `${state.stamina / STAMINA_MAX * 100}%`;
      updateAutoButton();
      state.hp = Math.min(state.hp, s.maxHp);
      state.mp = Math.min(state.mp, s.maxMp);
      if (updateMarket()) {
        renderMarket();
        saveState();
      }
    }, 1000);

    renderAll();
    updateAutoButton();
    if (!state.nickname) showNicknameModal();
    else if (!state.classId) showClassModal();
