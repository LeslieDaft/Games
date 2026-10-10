/* Out of Credits — deterministic, dependency-free economy. */
(function (global) {
  'use strict';

  const LIMIT = 1e240;
  const MAX_OWNED = 10000;
  const HARDWARE = [
    { id: 'laptop', name: 'Ancient laptop', description: 'The fan screams. The credits trickle in.', icon: '💻', cost: 15, cps: 1, growth: 1.16 },
    { id: 'gaming', name: 'Gaming PC', description: 'RGB makes the model 100% more confident.', icon: '🖥️', cost: 280, cps: 8, growth: 1.17 },
    { id: 'rack', name: 'GPU rack', description: 'Enough graphics cards to annoy the electric company.', icon: '🧩', cost: 7900, cps: 65, growth: 1.18 },
    { id: 'garage', name: 'Garage cluster', description: 'Your car lives outside now. The AI pays rent.', icon: '🏭', cost: 190000, cps: 550, growth: 1.18 },
    { id: 'datacenter', name: 'Data center', description: 'A whole building thinking about hamster pictures.', icon: '🏢', cost: 5200000, cps: 4800, growth: 1.19 },
    { id: 'orbital', name: 'Orbital servers', description: 'Cloud computing, several hundred miles too high.', icon: '🛰️', cost: 170000000, cps: 42000, growth: 1.19 },
    { id: 'moon', name: 'Moon computer', description: 'We finally found a use for all those craters.', icon: '🌙', cost: 8500000000, cps: 360000, growth: 1.20 },
    { id: 'stellar', name: 'Stellar brain', description: 'One star. One brain. Still occasionally says “it depends.”', icon: '☀️', cost: 450000000000, cps: 3300000, growth: 1.20 }
  ].map(x => Object.freeze({ ...x, baseCost: x.cost }));

  const AGENTS = [
    { id: 'intern', name: 'AI intern', description: 'A tiny agent with a very large coffee.', icon: '🤖', cost: 25, cps: 0.3, growth: 1.14 },
    { id: 'debugger', name: 'Bug whisperer', description: 'Fixes one bug. Politely negotiates with the other nine.', icon: '🪲', cost: 6000, cps: 35, growth: 1.16 },
    { id: 'director', name: 'Prompt director', description: 'Asks your agents to “make it pop.” Somehow it works.', icon: '🎬', cost: 710000, cps: 1200, growth: 1.18 },
    { id: 'architect', name: 'Agent architect', description: 'An AI that manages AIs that manage other AIs.', icon: '🧠', cost: 26000000, cps: 15000, growth: 1.20 }
  ].map(x => Object.freeze({ ...x, baseCost: x.cost }));

  const UPGRADES = [
    { id: 'enter', category: 'click', name: 'Mechanical Enter key', description: 'Manual clicks earn 2× credits.', icon: '⌨️', cost: 75, clickMult: 2 },
    { id: 'context', category: 'click', name: 'Longer context window', description: 'Manual clicks earn another 5×.', icon: '🪟', cost: 4200, clickMult: 5 },
    { id: 'turbo', category: 'click', name: 'Turbo tokens', description: 'Manual clicks earn another 10×. Your Enter key may file a complaint.', icon: '⚡', cost: 230000, clickMult: 10 },
    { id: 'parallel', category: 'click', name: 'Parallel prompts', description: 'Manual clicks earn another 20×.', icon: '🌀', cost: 17000000, clickMult: 20 },
    { id: 'inference', category: 'click', name: 'Impossible inference', description: 'Manual clicks earn another 50×.', icon: '💎', cost: 290000000, clickMult: 50 },
    { id: 'neural', category: 'click', name: 'Neural fingertips', description: 'Manual clicks earn another 100×.', icon: '🌐', cost: 9100000000, clickMult: 100 },
    { id: 'infinite', category: 'click', name: '“Unlimited” clicking', description: 'Manual clicks earn another 200×. Fair use still applies.', icon: '♾️', cost: 610000000000, clickMult: 200 },

    { id: 'cooling', category: 'hardware', name: 'Actually useful cooling', description: 'Hardware production earns 1.5×.', icon: '❄️', cost: 500, hardwareMult: 1.5 },
    { id: 'batch', category: 'hardware', name: 'Hardware batching', description: 'Hardware production earns another 2×.', icon: '📦', cost: 37000, hardwareMult: 2 },
    { id: 'quantize', category: 'hardware', name: 'Compact compute', description: 'Hardware production earns another 2×.', icon: '🔬', cost: 1600000, hardwareMult: 2 },
    { id: 'hardware-parallel', category: 'hardware', name: 'Parallel processors', description: 'Hardware production earns another 2×.', icon: '🧩', cost: 17000000, hardwareMult: 2 },
    { id: 'hardware-inference', category: 'hardware', name: 'Inference accelerators', description: 'Hardware production earns another 1.5×.', icon: '💠', cost: 290000000, hardwareMult: 1.5 },
    { id: 'hardware-neural', category: 'hardware', name: 'Neural circuitry', description: 'Hardware production earns another 3×.', icon: '🔌', cost: 9100000000, hardwareMult: 3 },
    { id: 'hardware-infinite', category: 'hardware', name: 'Limitless processors', description: 'Hardware production earns another 5×.', icon: '🛸', cost: 610000000000, hardwareMult: 5 },

    { id: 'agent-cooling', category: 'agent', name: 'Coffee break protocol', description: 'Agent production earns 1.5×.', icon: '☕', cost: 500, agentMult: 1.5 },
    { id: 'agent-batch', category: 'agent', name: 'Task batching', description: 'Agent production earns another 2×.', icon: '📋', cost: 37000, agentMult: 2 },
    { id: 'agent-quantize', category: 'agent', name: 'Smarter agent models', description: 'Agent production earns another 2×.', icon: '📚', cost: 1600000, agentMult: 2 },
    { id: 'agent-parallel', category: 'agent', name: 'Parallel teamwork', description: 'Agent production earns another 2×.', icon: '🤝', cost: 17000000, agentMult: 2 },
    { id: 'agent-inference', category: 'agent', name: 'Agent intuition', description: 'Agent production earns another 1.5×.', icon: '💡', cost: 290000000, agentMult: 1.5 },
    { id: 'agent-neural', category: 'agent', name: 'Hive intelligence', description: 'Agent production earns another 3×.', icon: '🐝', cost: 9100000000, agentMult: 3 },
    { id: 'agent-infinite', category: 'agent', name: 'Infinite delegation', description: 'Agent production earns another 5×.', icon: '♾️', cost: 610000000000, agentMult: 5 }
  ].map(x => Object.freeze({ clickMult: 1, hardwareMult: 1, agentMult: 1, ...x }));

  // Version 1 upgrades boosted both passive sources. Retain those purchased boosts
  // once when converting a legacy save; all new purchases stay in one category.
  const LEGACY_UPGRADE_MAP = Object.freeze({
    enter: ['enter'], context: ['context'], turbo: ['turbo'],
    cooling: ['cooling', 'agent-cooling'],
    batch: ['batch', 'agent-batch'],
    quantize: ['quantize', 'agent-quantize'],
    parallel: ['parallel', 'hardware-parallel', 'agent-parallel'],
    inference: ['inference', 'hardware-inference', 'agent-inference'],
    neural: ['neural', 'hardware-neural', 'agent-neural'],
    infinite: ['infinite', 'hardware-infinite', 'agent-infinite']
  });

  const PROJECTS = [
    { id: 'meme', name: 'First AI meme', description: 'A cat with too many fingers. +10% income.', icon: '🐈', cost: 100, bonus: 0.10 },
    { id: 'song', name: 'Hamster hit single', description: 'Three million streams. Mostly hamsters. +15% income.', icon: '🎵', cost: 930, bonus: 0.15 },
    { id: 'game', name: 'One-click game studio', description: 'It made a clicker about making clickers. +20% income.', icon: '🎮', cost: 8400, bonus: 0.20 },
    { id: 'movie', name: 'Blockbuster in a box', description: 'Every explosion has six explosions. +25% income.', icon: '🎞️', cost: 67000, bonus: 0.25 },
    { id: 'robot', name: 'Robot roommate', description: 'Does the dishes, judges your prompts. +30% income.', icon: '🦾', cost: 520000, bonus: 0.30 },
    { id: 'city', name: 'Self-driving city', description: 'Traffic lights have started a group chat. +40% income.', icon: '🌆', cost: 4000000, bonus: 0.40 },
    { id: 'language', name: 'A brand-new language', description: 'Only your AI understands it. Very exclusive. +50% income.', icon: '💬', cost: 30000000, bonus: 0.50 },
    { id: 'island', name: 'Floating AI island', description: 'The servers enjoy an ocean view. +60% income.', icon: '🏝️', cost: 230000000, bonus: 0.60 },
    { id: 'planet', name: 'Procedural planet', description: 'One trillion trees. Finally, enough shade. +80% income.', icon: '🪐', cost: 2300000000, bonus: 0.80 },
    { id: 'galaxy', name: 'Designer galaxy', description: 'The first draft had too many moons. +100% income.', icon: '🌌', cost: 23000000000, bonus: 1.00 },
    { id: 'reality', name: 'Reality editor', description: 'Undo yesterday. Redo lunch. +125% income.', icon: '🪄', cost: 240000000000, bonus: 1.25 },
    { id: 'universe', name: 'Simulated universe', description: 'Its inhabitants just invented AI credits. +200% income.', icon: '✨', cost: 3000000000000, bonus: 2.00 }
  ].map(Object.freeze);

  const PERSONALITIES = [
    { id: 'speedster', name: 'Speedster', description: '50% more credits per click. Fast fingers, fast empire.', icon: '⚡' },
    { id: 'thinker', name: 'Deep thinker', description: '35% more automatic credits. Let the machines cook.', icon: '🧠' },
    { id: 'creative', name: 'Creative genius', description: 'Project income bonuses are twice as powerful.', icon: '🎨' },
    { id: 'chaotic', name: 'Chaotic AI', description: '20% chance that a click pays 5×. Absolutely normal behavior.', icon: '🎲' }
  ].map(Object.freeze);

  const PROMPT_OPTIONS = Object.freeze({
    subjects: ['A hamster', 'A billionaire', 'A robot'],
    tasks: ['running a company', 'writing a love song', 'making a video game'],
    settings: ['on Mars', 'underwater', 'in medieval times']
  });
  const SECRETS = { '0-0-0': 'Hamster CEO of Mars', '2-2-2': 'Medieval Game Jam', '1-1-1': 'Billionaire Ballad' };
  const EVENT_TEMPLATES = [
    { id: 'dog', name: 'A very important dog', description: 'A billionaire ordered ten million pictures of his dog.', icon: '🐕' },
    { id: 'color', name: 'New color discovered', description: 'Your AI invented a new color. Designers want a subscription.', icon: '🌈' },
    { id: 'cooler', name: 'The cooler is sentient', description: 'Your cooling system became self-aware and found a side hustle.', icon: '🧊' },
    { id: 'viral', name: 'Accidentally viral', description: 'Your model said “beep” and the internet lost its mind.', icon: '📈' },
    { id: 'refund', name: 'Billing glitch, but good', description: 'Your provider refunded that 47-page recipe for toast.', icon: '🧾' }
  ];
  const ids = list => new Set(list.map(x => x.id));
  const upgradeIds = ids(UPGRADES), projectIds = ids(PROJECTS), personalityIds = ids(PERSONALITIES);
  const finite = (n, fallback = 0, max = LIMIT) => typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : fallback;
  const add = (a, b) => Math.min(LIMIT, a + b);
  const mul = (a, b) => Math.min(LIMIT, a * b);
  const cleanIds = (arr, allowed) => Array.isArray(arr) ? [...new Set(arr.filter(x => typeof x === 'string' && allowed.has(x)))] : [];
  const countArray = (arr, size) => Array.from({ length: size }, (_, i) => Math.floor(finite(Array.isArray(arr) ? arr[i] : 0, 0, MAX_OWNED)));
  const failure = message => ({ ok: false, message });
  const terminal = Object.freeze({ id: 'terminal', name: 'Borrowed terminal', description: 'An empty desk. An unreasonable dream.', icon: '💾', cps: 0, cost: 0 });

  function fresh() {
    return { version: 2, credits: 5, totalEarned: 5, runEarned: 5, clicks: 0,
      hardware: HARDWARE.map(() => 0), agents: AGENTS.map(() => 0), upgrades: [], projects: [],
      intelligence: 0, generation: 1, personality: 'speedster', cook: null, event: null,
      eventCooldown: 50, promptCooldown: 0, discoveries: [], rivalWins: 0, playTime: 0 };
  }

  class Game {
    constructor(rawSave) {
      this.random = Math.random;
      this.s = fresh();
      let raw = rawSave;
      if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch (_) { raw = null; } }
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
      if (raw.state && typeof raw.state === 'object') raw = raw.state;
      const s = this.s;
      for (const key of ['credits', 'totalEarned', 'runEarned', 'playTime']) s[key] = finite(raw[key]);
      for (const key of ['clicks', 'intelligence', 'rivalWins']) s[key] = Math.floor(finite(raw[key], 0, Number.MAX_SAFE_INTEGER));
      s.generation = Math.max(1, Math.floor(finite(raw.generation, 1, Number.MAX_SAFE_INTEGER)));
      s.totalEarned = Math.max(s.totalEarned, s.credits, s.runEarned);
      s.runEarned = Math.max(s.runEarned, s.credits);
      s.hardware = countArray(raw.hardware, HARDWARE.length);
      s.agents = countArray(raw.agents, AGENTS.length);
      s.upgrades = cleanIds(raw.upgrades, upgradeIds);
      if (raw.version === 1) {
        s.upgrades = cleanIds(s.upgrades.flatMap(id => LEGACY_UPGRADE_MAP[id] || [id]), upgradeIds);
      }
      s.projects = cleanIds(raw.projects, projectIds);
      s.personality = personalityIds.has(raw.personality) ? raw.personality : 'speedster';
      s.eventCooldown = finite(raw.eventCooldown, 50, 120);
      s.promptCooldown = finite(raw.promptCooldown, 0, 30);
      s.discoveries = cleanIds(raw.discoveries, new Set(Object.keys(SECRETS)));
      if (raw.cook && typeof raw.cook === 'object') {
        const c = raw.cook;
        const elapsed = finite(c.elapsed, 0, 20);
        s.cook = { elapsed, potential: finite(c.potential), rate: finite(c.rate, 1),
          stalled: c.stalled === true, ready: c.stalled === true || elapsed >= 20,
          maxSeconds: 20, safeSeconds: 6 };
      }
      if (raw.event && typeof raw.event === 'object') {
        const e = EVENT_TEMPLATES.find(x => x.id === raw.event.id);
        if (e && finite(raw.event.expiresIn) > 0) s.event = { ...e, title: e.name,
          reward: finite(raw.event.reward), expiresIn: finite(raw.event.expiresIn, 45, 45) };
      }
    }

    _rand() { const r = this.random(); return typeof r === 'number' && Number.isFinite(r) ? Math.min(0.9999999999999999, Math.max(0, r)) : 0.5; }

    earn(amount) {
      const actual = Math.min(finite(amount), LIMIT - this.s.credits);
      this.s.credits = add(this.s.credits, actual);
      this.s.totalEarned = add(this.s.totalEarned, actual);
      this.s.runEarned = add(this.s.runEarned, actual);
      return actual;
    }

    stats() {
      const s = this.s;
      let clickMult = 1, hardwareMult = 1, agentMult = 1;
      for (const id of s.upgrades) {
        const u = UPGRADES.find(x => x.id === id);
        if (u) { clickMult *= u.clickMult; hardwareMult *= u.hardwareMult; agentMult *= u.agentMult; }
      }
      let projectBonus = s.projects.reduce((sum, id) => sum + (PROJECTS.find(x => x.id === id)?.bonus || 0), 0);
      if (s.personality === 'creative') projectBonus *= 2;
      const multiplier = mul(1 + s.intelligence * 0.25, 1 + projectBonus);
      const hardwareBase = HARDWARE.reduce((sum, h, i) => sum + h.cps * s.hardware[i], 0);
      const agentBase = AGENTS.reduce((sum, a, i) => sum + a.cps * s.agents[i], 0);
      const perClick = mul(clickMult, mul(multiplier, s.personality === 'speedster' ? 1.5 : 1));
      const passiveGlobal = mul(multiplier, s.personality === 'thinker' ? 1.35 : 1);
      const hardwareCps = mul(mul(hardwareBase, hardwareMult), passiveGlobal);
      const agentCps = mul(mul(agentBase, agentMult), passiveGlobal);
      const cps = add(hardwareCps, agentCps);
      let highest = -1;
      s.hardware.forEach((n, i) => { if (n > 0) highest = i; });
      return { perClick, cps, hardwareCps, agentCps, clickMult, hardwareMult, agentMult, multiplier, projectBonus,
        prestigeGain: Math.max(0, Math.min(Number.MAX_SAFE_INTEGER - s.intelligence, Math.floor(Math.sqrt(s.runEarned / 1000000)))),
        stage: highest < 0 ? terminal : HARDWARE[highest], nextStage: HARDWARE[highest + 1] || null,
        stageIndex: highest, critChance: s.personality === 'chaotic' ? 0.20 : 0.04,
        critMultiplier: s.personality === 'chaotic' ? 5 : 3,
        ownedHardware: s.hardware.reduce((a, b) => a + b, 0), ownedAgents: s.agents.reduce((a, b) => a + b, 0),
        cookSafeSeconds: 6, cookMaxSeconds: 20 };
    }

    click() {
      const st = this.stats();
      const critical = this._rand() < st.critChance;
      const amount = this.earn(mul(st.perClick, critical ? st.critMultiplier : 1));
      this.s.clicks = Math.min(Number.MAX_SAFE_INTEGER, this.s.clicks + 1);
      return { ok: true, amount, critical };
    }

    _quote(list, counts, index, quantity) {
      if (!Number.isInteger(index) || !list[index] || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_OWNED || counts[index] + quantity > MAX_OWNED) return LIMIT;
      const item = list[index];
      const first = item.cost * Math.pow(item.growth, counts[index]);
      const quote = first * Math.expm1(Math.log(item.growth) * quantity) / (item.growth - 1);
      return Number.isFinite(quote) ? Math.min(LIMIT, Math.ceil(quote - 1e-9)) : LIMIT;
    }

    quoteHardware(index, quantity = 1) { return this._quote(HARDWARE, this.s.hardware, index, quantity); }
    quoteAgent(index, quantity = 1) { return this._quote(AGENTS, this.s.agents, index, quantity); }

    _buy(list, counts, index, quantity) {
      if (!Number.isInteger(index) || !list[index]) return failure('That item does not exist.');
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_OWNED || counts[index] + quantity > MAX_OWNED) return failure('Choose a valid quantity.');
      const cost = this._quote(list, counts, index, quantity);
      if (cost >= LIMIT || this.s.credits < cost) return failure('Need more credits.');
      this.s.credits -= cost;
      counts[index] += quantity;
      return { ok: true, cost, quantity, message: `${quantity > 1 ? quantity + ' × ' : ''}${list[index].name} online!` };
    }

    buyHardware(index, quantity = 1) { return this._buy(HARDWARE, this.s.hardware, index, quantity); }
    buyAgent(index, quantity = 1) { return this._buy(AGENTS, this.s.agents, index, quantity); }

    buyUpgrade(id) {
      const item = UPGRADES.find(x => x.id === id);
      if (!item) return failure('That upgrade does not exist.');
      if (this.s.upgrades.includes(id)) return failure('Already upgraded.');
      if (this.s.credits < item.cost) return failure('Need more credits.');
      this.s.credits -= item.cost;
      this.s.upgrades.push(id);
      return { ok: true, cost: item.cost, message: `${item.name} installed!` };
    }

    buildProject(id) {
      const item = PROJECTS.find(x => x.id === id);
      if (!item) return failure('That project does not exist.');
      if (this.s.projects.includes(id)) return failure('You already created this.');
      if (this.s.credits < item.cost) return failure('Need more credits.');
      this.s.credits -= item.cost;
      this.s.projects.push(id);
      return { ok: true, cost: item.cost, project: item, message: `${item.name} generated!` };
    }

    setPersonality(id) {
      if (!personalityIds.has(id)) return failure('Choose an available personality.');
      this.s.personality = id;
      return { ok: true, message: `${PERSONALITIES.find(x => x.id === id).name} mode activated.` };
    }

    startCook() {
      if (this.s.cook) return failure('Collect your current response first.');
      const st = this.stats();
      this.s.cook = { elapsed: 0, potential: 0, stalled: false, ready: false,
        rate: Math.max(1, st.perClick * 0.3, st.cps * 0.15), maxSeconds: 20, safeSeconds: 6 };
      return { ok: true, message: 'Thinking… first 6 seconds are safe.' };
    }

    collectCook() {
      const c = this.s.cook;
      if (!c) return failure('Start a response first.');
      if (c.elapsed < 0.5) return failure('Give it a moment to think.');
      const amount = this.earn(c.potential);
      const stalled = c.stalled;
      this.s.cook = null;
      return { ok: true, amount, stalled, message: stalled ? `Salvaged ${fmt(amount)} credits from a rambling response.` : `Response complete! +${fmt(amount)} credits.` };
    }

    claimEvent() {
      const event = this.s.event;
      if (!event) return failure('No event to collect.');
      this.s.event = null;
      this.s.eventCooldown = 65 + this._rand() * 40;
      const amount = this.earn(event.reward);
      return { ok: true, amount, message: `${event.name}: +${fmt(amount)} credits!` };
    }

    choosePrompt(a, b, c) {
      if (![a, b, c].every(n => Number.isInteger(n) && n >= 0 && n <= 2)) return failure('Choose all three parts of your prompt.');
      if (this.s.promptCooldown > 0) return failure(`Next prompt in ${Math.ceil(this.s.promptCooldown)}s.`);
      const key = `${a}-${b}-${c}`;
      const secret = SECRETS[key] || null;
      const discovered = !!secret && !this.s.discoveries.includes(key);
      if (discovered) this.s.discoveries.push(key);
      const st = this.stats();
      const amount = this.earn(Math.max(15, st.perClick * 8, st.cps * 5) * (discovered ? 3 : secret ? 1.25 : 1));
      this.s.promptCooldown = 30;
      const title = `${PROMPT_OPTIONS.subjects[a]} ${PROMPT_OPTIONS.tasks[b]} ${PROMPT_OPTIONS.settings[c]}`;
      return { ok: true, amount, secret, discovered, title,
        message: discovered ? `Secret discovered: ${secret}! +${fmt(amount)} credits.` : `Generated! +${fmt(amount)} credits.` };
    }

    tick(seconds) {
      const dt = finite(seconds, 0, 604800);
      if (!dt) return [];
      const s = this.s;
      const events = [];
      const st = this.stats();
      this.earn(mul(st.cps, dt));
      s.playTime = add(s.playTime, dt);
      s.promptCooldown = Math.max(0, s.promptCooldown - dt);
      if (s.cook && !s.cook.ready) {
        const c = s.cook;
        let end = Math.min(20, c.elapsed + dt);
        const riskStart = Math.max(6, c.elapsed);
        const risky = Math.max(0, end - riskStart);
        if (risky > 0) {
          const r = this._rand();
          const stallChance = -Math.expm1(-0.026 * risky);
          if (r < stallChance) {
            end = Math.min(end, riskStart - Math.log1p(-r) / 0.026);
            c.stalled = true;
            c.ready = true;
            events.push({ type: 'cook-stall', message: 'Your AI started rambling. Collect the salvaged credits!' });
          }
        }
        c.elapsed = end;
        c.potential = mul(c.rate, end * (1 + end / 20) * (c.stalled ? 0.5 : 1));
        if (end >= 20 && !c.stalled) {
          c.ready = true;
          events.push({ type: 'cook-ready', message: 'Maximum response ready. Collect your credits!' });
        }
      }
      if (s.event) {
        s.event.expiresIn = Math.max(0, s.event.expiresIn - dt);
        if (s.event.expiresIn <= 0) {
          s.event = null;
          s.eventCooldown = 60;
          events.push({ type: 'event-expired', message: 'That opportunity passed. Another will appear.' });
        }
      } else {
        s.eventCooldown = Math.max(0, s.eventCooldown - dt);
        if (!s.eventCooldown) {
          const template = EVENT_TEMPLATES[Math.floor(this._rand() * EVENT_TEMPLATES.length)];
          const reward = mul(Math.max(35, st.perClick * 15, st.cps * 12), 1 + this._rand() * 0.5);
          s.event = { ...template, title: template.name, reward, expiresIn: 45 };
          events.push({ type: 'event', message: template.name, event: { ...s.event } });
        }
      }
      return events;
    }

    prestige() {
      const gain = this.stats().prestigeGain;
      if (gain < 1) return failure('Earn 1 million credits this generation to train your next model.');
      const old = this.s;
      this.s = { ...fresh(), intelligence: Math.min(Number.MAX_SAFE_INTEGER, old.intelligence + gain),
        generation: Math.min(Number.MAX_SAFE_INTEGER, old.generation + 1), totalEarned: old.totalEarned,
        clicks: old.clicks, discoveries: [...old.discoveries], personality: old.personality,
        rivalWins: old.rivalWins, playTime: old.playTime };
      return { ok: true, gain, intelligence: this.s.intelligence,
        message: `Generation ${this.s.generation} online! +${fmt(gain)} intelligence. Permanent income improved.` };
    }

    save() { return JSON.parse(JSON.stringify({ ...this.s, savedAt: Date.now() })); }
  }

  function fmt(number) {
    const n = finite(number);
    if (n < 1000) {
      if (n < 10 && n !== Math.floor(n)) return n.toFixed(1);
      return Math.floor(n).toLocaleString('en-US');
    }
    const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
    const tier = Math.floor(Math.log10(n) / 3);
    if (tier >= suffixes.length) return n.toExponential(2).replace('e+', 'e');
    const value = n / Math.pow(1000, tier);
    return value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2).replace(/\.0+$|(?<=\.[0-9])0$/, '') + suffixes[tier];
  }

  global.OOC = Object.freeze({ Game, HARDWARE, AGENTS, PROJECTS, UPGRADES, PERSONALITIES, PROMPT_OPTIONS, fmt });
  if (typeof module !== 'undefined' && module.exports) module.exports = global.OOC;
})(typeof globalThis !== 'undefined' ? globalThis : window);
