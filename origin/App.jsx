import React, { useState, useEffect, useRef } from 'react';
import { 
    Swords, Shield, Wheat, Coins, Users, UserPlus, 
    Map, Scroll, Calendar, Home, Coffee, ShoppingBag, 
    Tent, Flag, ArrowRight, MessageSquareWarning, Crown
} from 'lucide-react';

// --- Initial Data ---
const INITIAL_DATE = { year: 190, month: 1 };
const MAX_AP = 5; // Action points per month

const INITIAL_CITIES = {
    'luoyang': { id: 'luoyang', name: '洛阳', owner: 'player', agriculture: 150, commerce: 150, defense: 100, troops: 5000, morale: 70 },
    'xuchang': { id: 'xuchang', name: '许昌', owner: 'caocao', agriculture: 200, commerce: 180, defense: 150, troops: 8000, morale: 80 },
    'chengdu': { id: 'chengdu', name: '成都', owner: 'liubei', agriculture: 180, commerce: 120, defense: 120, troops: 6000, morale: 85 },
    'jianye': { id: 'jianye', name: '建业', owner: 'sunquan', agriculture: 160, commerce: 190, defense: 140, troops: 7000, morale: 75 },
};

const INITIAL_FACTIONS = {
    'player': { id: 'player', name: '您的势力', ruler: 'player_ruler', color: 'bg-blue-600' },
    'caocao': { id: 'caocao', name: '曹操军', ruler: 'caocao', relation: 40, color: 'bg-red-700' },
    'liubei': { id: 'liubei', name: '刘备军', ruler: 'liubei', relation: 60, color: 'bg-green-600' },
    'sunquan': { id: 'sunquan', name: '孙权军', ruler: 'sunquan', relation: 50, color: 'bg-orange-600' },
};

const INITIAL_OFFICERS = [
    // 玩家初始
    { id: 'player_ruler', name: '主公(您)', faction: 'player', cmd: 85, int: 85, pol: 85, cha: 90, loyalty: 100, state: 'active' },
    // 曹操势力
    { id: 'caocao', name: '曹操', faction: 'caocao', cmd: 98, int: 91, pol: 94, cha: 96, loyalty: 100, state: 'active' },
    { id: 'xiahoudun', name: '夏侯惇', faction: 'caocao', cmd: 89, int: 58, pol: 70, cha: 81, loyalty: 100, state: 'active' },
    // 刘备势力
    { id: 'liubei', name: '刘备', faction: 'liubei', cmd: 75, int: 73, pol: 78, cha: 99, loyalty: 100, state: 'active' },
    { id: 'guanyu', name: '关羽', faction: 'liubei', cmd: 95, int: 75, pol: 62, cha: 93, loyalty: 100, state: 'active' },
    // 孙权势力
    { id: 'sunquan', name: '孙权', faction: 'sunquan', cmd: 76, int: 80, pol: 89, cha: 95, loyalty: 100, state: 'active' },
    { id: 'zhouyu', name: '周瑜', faction: 'sunquan', cmd: 97, int: 96, pol: 86, cha: 93, loyalty: 100, state: 'active' },
    // 在野武将 (需要探访发现)
    { id: 'zhaoyun', name: '赵云', faction: 'free', cmd: 96, int: 76, pol: 65, cha: 91, loyalty: 50, state: 'hidden' },
    { id: 'zhugeliang', name: '诸葛亮', faction: 'free', cmd: 90, int: 100, pol: 95, cha: 90, loyalty: 50, state: 'hidden' },
    { id: 'diaochan', name: '貂蝉', faction: 'free', cmd: 20, int: 81, pol: 65, cha: 100, loyalty: 50, state: 'hidden' },
    { id: 'guojia', name: '郭嘉', faction: 'free', cmd: 50, int: 98, pol: 84, cha: 78, loyalty: 50, state: 'hidden' },
    { id: 'lvbu', name: '吕布', faction: 'free', cmd: 100, int: 26, pol: 13, cha: 40, loyalty: 30, state: 'hidden' },
];

const ARTIFACTS = [
    { name: '雌雄双股剑', stat: 'cmd', val: 3, desc: '提升统帅' },
    { name: '青龙偃月刀', stat: 'cmd', val: 5, desc: '大幅提升统帅' },
    { name: '太平要术', stat: 'int', val: 5, desc: '大幅提升智力' },
    { name: '遁甲天书', stat: 'int', val: 4, desc: '提升智力' },
    { name: '玉玺', stat: 'cha', val: 10, desc: '天命所归，极大提升魅力' },
    { name: '赤兔马', stat: 'cmd', val: 4, desc: '神速，提升统帅' }
];

// --- Utility Functions ---
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const chance = (percent) => Math.random() * 100 < percent;

export default function App() {
    // --- State ---
    const [date, setDate] = useState(INITIAL_DATE);
    const [ap, setAp] = useState(MAX_AP);
    const [resources, setResources] = useState({ gold: 2000, food: 10000, reputation: 50 });
    const [cities, setCities] = useState(INITIAL_CITIES);
    const [factions, setFactions] = useState(INITIAL_FACTIONS);
    const [officers, setOfficers] = useState(INITIAL_OFFICERS);
    const [inventory, setInventory] = useState([]);
    const [logs, setLogs] = useState([{ id: 0, text: '公元190年，群雄割据，您占据洛阳，开启了争霸之路。', type: 'system' }]);
    const [activeTab, setActiveTab] = useState('HOME');
    const logsEndRef = useRef(null);

    // Auto-scroll logs
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    // --- Helpers ---
    const addLog = (text, type = 'normal') => {
        setLogs(prev => [...prev, { id: Date.now() + Math.random(), text, type }]);
    };

    const costAp = (amount = 1) => {
        if (ap >= amount) {
            setAp(prev => prev - amount);
            return true;
        }
        addLog('政令不足！请等待下个月。', 'error');
        return false;
    };

    const getPlayerOfficers = () => officers.filter(o => o.faction === 'player');
    const getPlayerCity = () => Object.values(cities).find(c => c.owner === 'player');
    
    // Calculate total stats for player
    const getTotalStats = () => {
        const pOfficers = getPlayerOfficers();
        return pOfficers.reduce((acc, o) => ({
            cmd: acc.cmd + o.cmd, int: acc.int + o.int, pol: acc.pol + o.pol, cha: acc.cha + o.cha
        }), { cmd: 0, int: 0, pol: 0, cha: 0 });
    };

    // --- Core Actions ---

    // 1. Next Month (Turn processing)
    const nextMonth = () => {
        // Time progression
        let newMonth = date.month + 1;
        let newYear = date.year;
        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        }
        setDate({ year: newYear, month: newMonth });
        setAp(MAX_AP); // Reset AP

        const myCity = getPlayerCity();
        const myOfficers = getPlayerOfficers();
        
        // Income & Expenses
        const goldIncome = Math.floor(myCity.commerce * 2.5);
        const foodIncome = Math.floor(myCity.agriculture * 5); // Harvest usually in autumn, but simplified here
        const troopUpkeep = Math.floor(myCity.troops * 0.5);
        const officerSalary = myOfficers.length * 20;

        let newGold = resources.gold + goldIncome - officerSalary;
        let newFood = resources.food + foodIncome - troopUpkeep;

        addLog(`【次月结算】获得资金 ${goldIncome}，粮草 ${foodIncome}。`);
        
        // Penalties if bankrupt
        let moraleDrop = 0;
        if (newGold < 0) {
            addLog('警告：国库空虚，武将忠诚度下降！', 'error');
            newGold = 0;
            setOfficers(prev => prev.map(o => o.faction === 'player' && o.id !== 'player_ruler' ? { ...o, loyalty: Math.max(0, o.loyalty - randInt(2, 5)) } : o));
        }
        if (newFood < 0) {
            addLog('警告：粮草断绝，士兵哗变，士气下降！', 'error');
            newFood = 0;
            moraleDrop = randInt(5, 10);
            setCities(prev => ({
                ...prev,
                [myCity.id]: { ...prev[myCity.id], troops: Math.floor(prev[myCity.id].troops * 0.8), morale: Math.max(0, prev[myCity.id].morale - moraleDrop) }
            }));
        }

        setResources(prev => ({ ...prev, gold: newGold, food: newFood }));

        // AI Actions (Simplified)
        setCities(prev => {
            let nextCities = { ...prev };
            Object.keys(nextCities).forEach(key => {
                const c = nextCities[key];
                if (c.owner !== 'player') {
                    // AI grows slowly
                    c.troops += randInt(100, 500);
                    c.agriculture += randInt(1, 5);
                    c.commerce += randInt(1, 5);
                }
            });
            return nextCities;
        });
        
        // Win Condition Check
        const enemyCities = Object.values(cities).filter(c => c.owner !== 'player');
        if (enemyCities.length === 0) {
            addLog('⭐⭐⭐ 捷报！您已攻克所有敌城，一统天下，成就霸业！ ⭐⭐⭐', 'success');
            alert("恭喜您，一统天下！");
        }
    };

    // 2. Exploration (民间探访)
    const exploreLocation = (location) => {
        if (!costAp(1)) return;

        const pOfficers = getPlayerOfficers();
        // Use highest charm for better results
        const maxCha = Math.max(...pOfficers.map(o => o.cha)); 
        const bonus = Math.floor(maxCha / 20);

        if (location === 'tavern') {
            // 酒馆: 寻访武将 或 听闻情报
            if (chance(30 + bonus)) {
                // Find hidden officer
                const hidden = officers.filter(o => o.state === 'hidden');
                if (hidden.length > 0) {
                    const found = hidden[randInt(0, hidden.length - 1)];
                    setOfficers(prev => prev.map(o => o.id === found.id ? { ...o, state: 'discovered' } : o));
                    addLog(`你在酒馆偶遇了在野名士【${found.name}】！可前往人事界面招募。`, 'success');
                } else {
                    addLog('你在酒馆喝了一杯，听了些市井传言，一无所获。');
                }
            } else if (chance(40)) {
                // Gossip affects relations
                const targetFactions = Object.keys(factions).filter(k => k !== 'player');
                const target = targetFactions[randInt(0, targetFactions.length - 1)];
                addLog(`听闻酒客议论，你对【${factions[target].name}】的了解加深了。`);
            } else {
                addLog('酒馆里冷冷清清。');
            }
        } 
        else if (location === 'market') {
            // 市场: 获得金钱、道具或交易
            if (chance(15 + bonus)) {
                // Find item
                const item = ARTIFACTS[randInt(0, ARTIFACTS.length - 1)];
                if (!inventory.some(i => i.name === item.name)) {
                    setInventory([...inventory, item]);
                    addLog(`你在市集淘到了稀世珍宝：【${item.name}】！(${item.desc})`, 'success');
                    // Auto apply buff to ruler
                    setOfficers(prev => prev.map(o => o.id === 'player_ruler' ? { ...o, [item.stat]: o[item.stat] + item.val } : o));
                } else {
                    const goldFound = randInt(100, 300);
                    setResources(prev => ({ ...prev, gold: prev.gold + goldFound }));
                    addLog(`你在市集巡视，收缴了违规商贩的罚款 ${goldFound} 金。`);
                }
            } else {
                const goldFound = randInt(50, 200);
                setResources(prev => ({ ...prev, gold: prev.gold + goldFound }));
                addLog(`你在市集协助管理，获得了 ${goldFound} 金的税收分成。`);
            }
        }
        else if (location === 'street') {
            // 街道: 民心、粮食
            if (chance(40)) {
                const foodFound = randInt(500, 1500);
                setResources(prev => ({ ...prev, food: prev.food + foodFound }));
                addLog(`当地富商感念你的恩德，捐赠了 ${foodFound} 粮草。`, 'success');
            } else if (chance(40)) {
                setResources(prev => ({ ...prev, reputation: Math.min(100, prev.reputation + randInt(2, 5)) }));
                addLog('你巡视街道，体恤民情，获得了百姓的爱戴（民心上升）。', 'success');
            } else {
                addLog('街道上平静祥和，无事发生。');
            }
        }
    };

    // 3. Domestic (内政)
    const developCity = (type) => {
        if (!costAp(1)) return;
        const stats = getTotalStats();
        const myCity = getPlayerCity();
        
        let increase = 0;
        let cost = 100;

        if (resources.gold < cost) {
            addLog('金钱不足，无法进行内政开发！(需100金)', 'error');
            setAp(prev => prev + 1); // Refund AP
            return;
        }

        setResources(prev => ({ ...prev, gold: prev.gold - cost }));

        if (type === 'agriculture') {
            increase = Math.floor(stats.pol * 0.15 + randInt(1, 5));
            setCities(prev => ({ ...prev, [myCity.id]: { ...prev[myCity.id], agriculture: prev[myCity.id].agriculture + increase } }));
            addLog(`指派文官开垦农田，农业值提升了 ${increase}！`);
        } else if (type === 'commerce') {
            increase = Math.floor(stats.pol * 0.15 + randInt(1, 5));
            setCities(prev => ({ ...prev, [myCity.id]: { ...prev[myCity.id], commerce: prev[myCity.id].commerce + increase } }));
            addLog(`指派文官发展商贸，商业值提升了 ${increase}！`);
        } else if (type === 'defense') {
            increase = Math.floor(stats.cmd * 0.15 + randInt(1, 5));
            setCities(prev => ({ ...prev, [myCity.id]: { ...prev[myCity.id], defense: prev[myCity.id].defense + increase } }));
            addLog(`指派武将修筑城防，防御值提升了 ${increase}！`);
        }
    };

    // 4. Military (军事)
    const militaryAction = (action, targetCityId = null) => {
        const myCity = getPlayerCity();
        const stats = getTotalStats();

        if (action === 'draft') {
            const costGold = 200;
            const costFood = 500;
            if (resources.gold < costGold || resources.food < costFood) {
                addLog(`征兵需要 ${costGold}金 和 ${costFood}粮草，资源不足！`, 'error');
                return;
            }
            if (!costAp(1)) return;
            
            const recruits = Math.floor(stats.cha * 10 + resources.reputation * 5 + randInt(100, 500));
            setResources(prev => ({ ...prev, gold: prev.gold - costGold, food: prev.food - costFood }));
            setCities(prev => ({ ...prev, [myCity.id]: { ...prev[myCity.id], troops: prev[myCity.id].troops + recruits, morale: Math.max(10, prev[myCity.id].morale - 5) } }));
            addLog(`发布募兵令，消耗金粮，招募了 ${recruits} 名新兵。（士气略微下降）`);
        } 
        else if (action === 'train') {
            if (!costAp(1)) return;
            const moraleBoost = Math.floor(stats.cmd * 0.1 + randInt(2, 8));
            setCities(prev => ({ ...prev, [myCity.id]: { ...prev[myCity.id], morale: Math.min(100, prev[myCity.id].morale + moraleBoost) } }));
            addLog(`武将们操练兵马，军队士气提升了 ${moraleBoost}！`);
        }
        else if (action === 'attack' && targetCityId) {
            const costFood = myCity.troops * 1; // 1 food per soldier to march
            if (resources.food < costFood) {
                addLog(`大军出征需要 ${costFood} 粮草，当前粮草不足！`, 'error');
                return;
            }
            if (!costAp(2)) return; // Attack costs 2 AP

            setResources(prev => ({ ...prev, food: prev.food - costFood }));
            const targetCity = cities[targetCityId];
            const targetFaction = targetCity.owner;
            const enemyOfficers = officers.filter(o => o.faction === targetFaction);
            const enemyCmdTotal = enemyOfficers.reduce((acc, o) => acc + o.cmd, 0) || 50; // Default if no officers

            addLog(`🔥 您对【${targetCity.name}】(${factions[targetFaction].name}) 发动了战争！`, 'warning');

            // Simple Battle Calculation
            const myPower = myCity.troops * (1 + stats.cmd/200) * (myCity.morale/100) * randInt(80, 120) / 100;
            // City defense acts as a multiplier for enemy troops
            const enemyPower = targetCity.troops * (1 + enemyCmdTotal/200) * (targetCity.morale/100) * (1 + targetCity.defense/200) * randInt(80, 120) / 100;

            setTimeout(() => {
                if (myPower > enemyPower) {
                    // Win
                    const troopsLost = Math.floor(targetCity.troops * 0.4 + randInt(100, 500));
                    const enemyTroopsLeft = 0;
                    
                    setCities(prev => ({ 
                        ...prev, 
                        [myCity.id]: { ...prev[myCity.id], troops: Math.max(0, prev[myCity.id].troops - troopsLost) },
                        [targetCityId]: { ...prev[targetCityId], owner: 'player', troops: Math.floor(targetCity.troops * 0.2) } // Capture city, some troops surrender
                    }));
                    
                    // Capture officers
                    let capturedNames = [];
                    setOfficers(prev => prev.map(o => {
                        if (o.faction === targetFaction && chance(50)) {
                            capturedNames.push(o.name);
                            return { ...o, faction: 'player', loyalty: 40 }; // Captured and forced to join, low loyalty
                        }
                        // Rest flee and become free
                        if (o.faction === targetFaction) return { ...o, faction: 'free', state: 'discovered' };
                        return o;
                    }));

                    // Spoil of war
                    const spoilGold = Math.floor(targetCity.commerce * 10);
                    const spoilFood = Math.floor(targetCity.agriculture * 20);
                    setResources(prev => ({ ...prev, gold: prev.gold + spoilGold, food: prev.food + spoilFood, reputation: prev.reputation + 5 }));

                    let logMsg = `⚔️ 战斗胜利！您成功攻占了【${targetCity.name}】！我军损失 ${troopsLost} 兵力。缴获资金 ${spoilGold}，粮草 ${spoilFood}。`;
                    if (capturedNames.length > 0) logMsg += `俘虏并收编了敌将：${capturedNames.join(', ')}。`;
                    addLog(logMsg, 'success');

                } else {
                    // Lose
                    const troopsLost = Math.floor(myCity.troops * 0.6 + randInt(500, 1000));
                    setCities(prev => ({
                        ...prev,
                        [myCity.id]: { ...prev[myCity.id], troops: Math.max(0, prev[myCity.id].troops - troopsLost), morale: Math.max(10, prev[myCity.id].morale - 20) },
                        [targetCityId]: { ...prev[targetCityId], troops: Math.max(0, Math.floor(prev[targetCityId].troops * 0.8)) }
                    }));
                    addLog(`⚔️ 战斗失败！敌方城防坚固，我军大败而归，损失了 ${troopsLost} 兵力，士气大跌！`, 'error');
                }
            }, 1000); // Small delay for effect
        }
    };

    // 5. Personnel (人事)
    const personnelAction = (action, officerId) => {
        if (!costAp(1)) return;
        
        const officer = officers.find(o => o.id === officerId);
        const stats = getTotalStats();

        if (action === 'recruit') {
            // Chance based on Ruler Charm vs Officer Intel/Loyalty
            const pRuler = officers.find(o => o.id === 'player_ruler');
            const chanceToHire = Math.max(10, (pRuler.cha - officer.int / 2 + randInt(0, 40)));
            
            if (chance(chanceToHire)) {
                setOfficers(prev => prev.map(o => o.id === officerId ? { ...o, faction: 'player', state: 'active', loyalty: 70 } : o));
                addLog(`登庸成功！【${officer.name}】被主公的魅力折服，加入了您的麾下！`, 'success');
            } else {
                addLog(`登庸失败！【${officer.name}】婉拒了您的招募。`);
            }
        } 
        else if (action === 'reward') {
            const cost = 100;
            if (resources.gold < cost) {
                addLog(`赏赐需要 ${cost} 金，资金不足！`, 'error');
                setAp(prev => prev + 1); // Refund
                return;
            }
            setResources(prev => ({ ...prev, gold: prev.gold - cost }));
            const boost = randInt(10, 20);
            setOfficers(prev => prev.map(o => o.id === officerId ? { ...o, loyalty: Math.min(100, o.loyalty + boost) } : o));
            addLog(`赏赐了【${officer.name}】百金，其忠诚度提升了 ${boost}！`);
        }
    };

    // 6. Diplomacy (外交)
    const diplomacyAction = (action, factionId) => {
        if (!costAp(1)) return;
        const targetFaction = factions[factionId];
        const stats = getTotalStats();

        if (action === 'gift') {
            const cost = 500;
            if (resources.gold < cost) {
                addLog(`赠礼需要 ${cost} 金，资金不足！`, 'error');
                setAp(prev => prev + 1);
                return;
            }
            setResources(prev => ({ ...prev, gold: prev.gold - cost }));
            const relationBoost = Math.floor(stats.pol * 0.15 + randInt(5, 15));
            setFactions(prev => ({ ...prev, [factionId]: { ...prev[factionId], relation: Math.min(100, prev[factionId].relation + relationBoost) } }));
            addLog(`派遣使者向【${targetFaction.name}】献上厚礼，双方友好度提升了 ${relationBoost}。`);
        }
        else if (action === 'alienate') {
            const cost = 300;
            if (resources.gold < cost) {
                addLog(`散布流言需要 ${cost} 金作为活动经费，资金不足！`, 'error');
                setAp(prev => prev + 1);
                return;
            }
            setResources(prev => ({ ...prev, gold: prev.gold - cost }));
            // Lower loyalty of a random officer in that faction
            const enemyOfficers = officers.filter(o => o.faction === factionId);
            if (enemyOfficers.length > 0) {
                const targetOfficer = enemyOfficers[randInt(0, enemyOfficers.length - 1)];
                // Success based on Player Int vs Target Int
                if (chance(stats.int > targetOfficer.int ? 70 : 30)) {
                    const loyaltyDrop = randInt(15, 30);
                    setOfficers(prev => prev.map(o => o.id === targetOfficer.id ? { ...o, loyalty: Math.max(0, o.loyalty - loyaltyDrop) } : o));
                    addLog(`离间计成功！散布流言使【${targetFaction.name}】的武将【${targetOfficer.name}】心生疑隙，忠诚下降！`, 'success');
                } else {
                    addLog(`离间计失败！【${targetFaction.name}】识破了我们的流言蜚语。`);
                }
            } else {
                 addLog(`细作回报：【${targetFaction.name}】麾下暂无知名武将可供离间。`);
            }
        }
    };


    // --- Sub-Components (Renderers) ---

    const renderHeader = () => (
        <div className="bg-slate-900 border-b border-amber-900/50 p-4 flex flex-wrap justify-between items-center text-amber-50 shadow-md">
            <div className="flex items-center space-x-4">
                <Crown className="w-8 h-8 text-yellow-500" />
                <div>
                    <h1 className="text-xl font-bold tracking-widest text-amber-500">霸业：三国崛起</h1>
                    <span className="text-xs text-slate-400">主公：{officers.find(o=>o.id==='player_ruler')?.name}</span>
                </div>
            </div>
            <div className="flex space-x-6 text-sm font-medium mt-2 sm:mt-0">
                <div className="flex items-center text-yellow-400" title="金钱"><Coins className="w-4 h-4 mr-1"/> {resources.gold}</div>
                <div className="flex items-center text-green-400" title="粮草"><Wheat className="w-4 h-4 mr-1"/> {resources.food}</div>
                <div className="flex items-center text-blue-400" title="民心"><Users className="w-4 h-4 mr-1"/> {resources.reputation}</div>
                <div className="flex items-center text-purple-400" title="本月剩余政令"><Scroll className="w-4 h-4 mr-1"/> 政令: {ap}/{MAX_AP}</div>
            </div>
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                <div className="flex items-center text-amber-200">
                    <Calendar className="w-5 h-5 mr-2"/>
                    公元 {date.year} 年 {date.month} 月
                </div>
                <button onClick={nextMonth} className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded shadow border border-red-900 transition flex items-center font-bold">
                    次月 <ArrowRight className="w-4 h-4 ml-1"/>
                </button>
            </div>
        </div>
    );

    const renderNav = () => {
        const navItems = [
            { id: 'HOME', icon: <Home className="w-5 h-5"/>, label: '主城' },
            { id: 'COUNCIL', icon: <Scroll className="w-5 h-5"/>, label: '内政' },
            { id: 'ARMY', icon: <Swords className="w-5 h-5"/>, label: '军政' },
            { id: 'TOWN', icon: <Coffee className="w-5 h-5"/>, label: '探访' },
            { id: 'PERSONNEL', icon: <UserPlus className="w-5 h-5"/>, label: '人事' },
            { id: 'DIPLOMACY', icon: <Map className="w-5 h-5"/>, label: '外交' },
        ];

        return (
            <div className="w-24 bg-slate-800 flex flex-col border-r border-amber-900/30 flex-shrink-0">
                {navItems.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex flex-col items-center justify-center p-4 h-20 transition-colors border-b border-amber-900/20 ${activeTab === item.id ? 'bg-amber-900/50 text-amber-400 border-l-4 border-l-amber-500' : 'text-slate-400 hover:bg-slate-700 hover:text-amber-200'}`}
                    >
                        {item.icon}
                        <span className="text-xs mt-1 font-bold tracking-wide">{item.label}</span>
                    </button>
                ))}
            </div>
        );
    };

    const renderLog = () => (
        <div className="h-48 bg-black/80 border-t border-amber-900/50 p-3 overflow-y-auto font-mono text-sm shadow-inner shrink-0">
            {logs.map((log) => (
                <div key={log.id} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : log.type === 'warning' ? 'text-yellow-400' : log.type === 'system' ? 'text-blue-300' : 'text-slate-300'}`}>
                    <span className="opacity-50 mr-2">[{date.year}年{date.month}月]</span>
                    {log.text}
                </div>
            ))}
            <div ref={logsEndRef} />
        </div>
    );

    // --- Tab Contents ---

    const renderHome = () => {
        const myCity = getPlayerCity();
        const myOfficers = getPlayerOfficers();
        const totalStats = getTotalStats();

        return (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/80 p-5 rounded-lg border border-amber-900/30">
                    <h2 className="text-xl font-bold text-amber-500 mb-4 flex items-center border-b border-amber-900/50 pb-2">
                        <Tent className="w-6 h-6 mr-2"/> 居城情报：{myCity.name}
                    </h2>
                    <div className="grid grid-cols-2 gap-4 text-slate-300">
                        <div><span className="text-slate-500">太守：</span>{officers.find(o=>o.id==='player_ruler')?.name}</div>
                        <div><span className="text-slate-500">驻军：</span>{myCity.troops}</div>
                        <div><span className="text-slate-500">农业：</span>{myCity.agriculture}</div>
                        <div><span className="text-slate-500">商业：</span>{myCity.commerce}</div>
                        <div><span className="text-slate-500">城防：</span>{myCity.defense}</div>
                        <div><span className="text-slate-500">士气：</span>{myCity.morale} / 100</div>
                    </div>
                </div>

                <div className="bg-slate-800/80 p-5 rounded-lg border border-amber-900/30">
                    <h2 className="text-xl font-bold text-amber-500 mb-4 flex items-center border-b border-amber-900/50 pb-2">
                        <Users className="w-6 h-6 mr-2"/> 势力概况
                    </h2>
                    <div className="mb-4">
                        <div className="text-sm text-slate-400 mb-1">势力总能力 (影响内政与军事效率)</div>
                        <div className="flex space-x-4 text-slate-300 font-mono bg-black/30 p-2 rounded">
                            <span className="text-red-400">统:{totalStats.cmd}</span>
                            <span className="text-blue-400">智:{totalStats.int}</span>
                            <span className="text-green-400">政:{totalStats.pol}</span>
                            <span className="text-yellow-400">魅:{totalStats.cha}</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-slate-400 mb-2">麾下武将 ({myOfficers.length}人)</div>
                        <div className="flex flex-wrap gap-2">
                            {myOfficers.map(o => (
                                <span key={o.id} className="px-2 py-1 bg-slate-700 text-xs rounded border border-slate-600 text-amber-100">
                                    {o.name} <span className="opacity-50">(忠:{o.loyalty})</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderCouncil = () => (
        <div className="p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-amber-500 mb-6 text-center">主持内政</h2>
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-slate-800/80 p-6 rounded-lg border border-amber-900/30 text-center hover:bg-slate-800 transition">
                    <Wheat className="w-12 h-12 text-green-500 mx-auto mb-3"/>
                    <h3 className="text-xl text-amber-100 font-bold mb-2">开垦农田</h3>
                    <p className="text-slate-400 text-sm mb-4">提升城市农业值，增加每月的粮草收入。受【政治】总值影响。</p>
                    <button onClick={() => developCity('agriculture')} className="bg-amber-700 hover:bg-amber-600 text-white px-6 py-2 rounded-full font-bold shadow-lg transition">
                        执行 (耗费: 1政令, 100金)
                    </button>
                </div>
                <div className="bg-slate-800/80 p-6 rounded-lg border border-amber-900/30 text-center hover:bg-slate-800 transition">
                    <Coins className="w-12 h-12 text-yellow-500 mx-auto mb-3"/>
                    <h3 className="text-xl text-amber-100 font-bold mb-2">繁荣商业</h3>
                    <p className="text-slate-400 text-sm mb-4">提升城市商业值，增加每月的金钱收入。受【政治】总值影响。</p>
                    <button onClick={() => developCity('commerce')} className="bg-amber-700 hover:bg-amber-600 text-white px-6 py-2 rounded-full font-bold shadow-lg transition">
                        执行 (耗费: 1政令, 100金)
                    </button>
                </div>
                <div className="bg-slate-800/80 p-6 rounded-lg border border-amber-900/30 text-center hover:bg-slate-800 transition">
                    <Shield className="w-12 h-12 text-slate-400 mx-auto mb-3"/>
                    <h3 className="text-xl text-amber-100 font-bold mb-2">修筑城防</h3>
                    <p className="text-slate-400 text-sm mb-4">提升城市防御值，在防守战中获得优势。受【统帅】总值影响。</p>
                    <button onClick={() => developCity('defense')} className="bg-amber-700 hover:bg-amber-600 text-white px-6 py-2 rounded-full font-bold shadow-lg transition">
                        执行 (耗费: 1政令, 100金)
                    </button>
                </div>
            </div>
        </div>
    );

    const renderArmy = () => {
        const myCity = getPlayerCity();
        const enemyCities = Object.values(cities).filter(c => c.owner !== 'player');

        return (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Preparation */}
                <div className="space-y-6">
                    <div className="bg-slate-800/80 p-6 rounded-lg border border-amber-900/30">
                        <h2 className="text-xl font-bold text-amber-500 mb-4 flex items-center border-b border-amber-900/50 pb-2">
                            <Flag className="w-6 h-6 mr-2"/> 军备筹建
                        </h2>
                        <div className="flex flex-col space-y-4 mt-4">
                            <div className="flex justify-between items-center bg-black/20 p-3 rounded">
                                <div>
                                    <div className="text-amber-100 font-bold">征召士兵</div>
                                    <div className="text-xs text-slate-400">消耗200金, 500粮。受【魅力】影响。</div>
                                </div>
                                <button onClick={() => militaryAction('draft')} className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-bold transition">征兵 (1政令)</button>
                            </div>
                            <div className="flex justify-between items-center bg-black/20 p-3 rounded">
                                <div>
                                    <div className="text-amber-100 font-bold">军队操练</div>
                                    <div className="text-xs text-slate-400">提升军队士气。受【统帅】影响。</div>
                                </div>
                                <button onClick={() => militaryAction('train')} className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-bold transition">训练 (1政令)</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attack */}
                <div className="bg-slate-800/80 p-6 rounded-lg border border-amber-900/30">
                    <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center border-b border-amber-900/50 pb-2">
                        <Swords className="w-6 h-6 mr-2"/> 发动战争
                    </h2>
                    <p className="text-sm text-slate-400 mb-4">选择目标城池出兵。每次出征消耗2政令，并根据兵力消耗对应粮草。</p>
                    
                    {enemyCities.length === 0 ? (
                        <div className="text-green-500 font-bold text-center py-10">天下已定，四海升平！</div>
                    ) : (
                        <div className="space-y-3">
                            {enemyCities.map(city => {
                                const faction = factions[city.owner];
                                return (
                                    <div key={city.id} className="flex justify-between items-center p-3 bg-black/40 border border-slate-700 rounded hover:border-red-900/50 transition">
                                        <div>
                                            <div className="text-amber-100 font-bold flex items-center">
                                                {city.name} 
                                                <span className={`ml-2 text-xs px-1 rounded text-white ${faction.color}`}>{faction.name}</span>
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1">兵力: {city.troops} | 城防: {city.defense} | 士气: {city.morale}</div>
                                        </div>
                                        <button 
                                            onClick={() => militaryAction('attack', city.id)} 
                                            className="bg-red-800 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-bold shadow-lg transition"
                                        >
                                            出兵
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderTown = () => (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-amber-500 mb-2 text-center">民间探访</h2>
            <p className="text-center text-slate-400 mb-8 text-sm">微服私访，体察民情，或许会有意想不到的收获。(每次消耗 1 政令)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div 
                    onClick={() => exploreLocation('tavern')}
                    className="bg-slate-800 hover:bg-slate-700 cursor-pointer p-8 rounded-lg border-2 border-amber-900/30 text-center transition flex flex-col items-center justify-center h-64 shadow-lg group"
                >
                    <Coffee className="w-16 h-16 text-amber-600 mb-4 group-hover:scale-110 transition-transform"/>
                    <h3 className="text-xl text-amber-100 font-bold mb-2">酒馆</h3>
                    <p className="text-slate-400 text-sm">鱼龙混杂之地。可打听情报，或结识在野的名士武将。</p>
                </div>
                
                <div 
                    onClick={() => exploreLocation('market')}
                    className="bg-slate-800 hover:bg-slate-700 cursor-pointer p-8 rounded-lg border-2 border-amber-900/30 text-center transition flex flex-col items-center justify-center h-64 shadow-lg group"
                >
                    <ShoppingBag className="w-16 h-16 text-yellow-600 mb-4 group-hover:scale-110 transition-transform"/>
                    <h3 className="text-xl text-amber-100 font-bold mb-2">市集</h3>
                    <p className="text-slate-400 text-sm">商贾云集。巡视可获得额外税收，偶尔能淘到稀世珍宝。</p>
                </div>

                <div 
                    onClick={() => exploreLocation('street')}
                    className="bg-slate-800 hover:bg-slate-700 cursor-pointer p-8 rounded-lg border-2 border-amber-900/30 text-center transition flex flex-col items-center justify-center h-64 shadow-lg group"
                >
                    <Users className="w-16 h-16 text-blue-500 mb-4 group-hover:scale-110 transition-transform"/>
                    <h3 className="text-xl text-amber-100 font-bold mb-2">街道</h3>
                    <p className="text-slate-400 text-sm">安抚百姓，倾听民声。可提升民心，或获得富商的粮草捐赠。</p>
                </div>
            </div>

            {/* Inventory Display */}
            {inventory.length > 0 && (
                <div className="mt-8 bg-slate-800/50 p-4 rounded border border-amber-900/20">
                    <h3 className="text-amber-500 font-bold mb-2 flex items-center"><Crown className="w-4 h-4 mr-2"/> 已获宝物</h3>
                    <div className="flex flex-wrap gap-2">
                        {inventory.map((item, idx) => (
                            <span key={idx} className="bg-amber-900/50 text-amber-200 px-3 py-1 rounded text-sm border border-amber-700" title={item.desc}>
                                {item.name} (+{item.val} {item.stat === 'cmd' ? '统帅' : item.stat === 'int' ? '智力' : '魅力'})
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderPersonnel = () => {
        const myOfficers = getPlayerOfficers().filter(o => o.id !== 'player_ruler');
        const discoveredOfficers = officers.filter(o => o.state === 'discovered' && o.faction === 'free');

        return (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/80 p-5 rounded-lg border border-amber-900/30">
                    <h2 className="text-xl font-bold text-amber-500 mb-4 flex items-center border-b border-amber-900/50 pb-2">
                        <UserPlus className="w-6 h-6 mr-2"/> 登庸在野名士
                    </h2>
                    {discoveredOfficers.length === 0 ? (
                        <p className="text-slate-500 text-sm py-4 text-center">暂未发现可登庸的在野名士。请多去【酒馆】探访。</p>
                    ) : (
                        <div className="space-y-3">
                            {discoveredOfficers.map(o => (
                                <div key={o.id} className="flex justify-between items-center p-3 bg-black/40 border border-slate-700 rounded">
                                    <div>
                                        <div className="text-amber-100 font-bold">{o.name}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-1">统:{o.cmd} 智:{o.int} 政:{o.pol} 魅:{o.cha}</div>
                                    </div>
                                    <button 
                                        onClick={() => personnelAction('recruit', o.id)}
                                        className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-sm font-bold transition"
                                    >
                                        招募 (1政令)
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-slate-800/80 p-5 rounded-lg border border-amber-900/30">
                    <h2 className="text-xl font-bold text-amber-500 mb-4 flex items-center border-b border-amber-900/50 pb-2">
                        <Coins className="w-6 h-6 mr-2"/> 赏赐部下
                    </h2>
                    <p className="text-xs text-slate-400 mb-4">赏赐100金可提升部下忠诚度。忠诚度过低容易被敌对势力离间或叛逃。</p>
                    {myOfficers.length === 0 ? (
                        <p className="text-slate-500 text-sm py-4 text-center">麾下暂无其他武将。</p>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {myOfficers.map(o => (
                                <div key={o.id} className="flex justify-between items-center p-3 bg-black/40 border border-slate-700 rounded">
                                    <div>
                                        <div className="text-amber-100 font-bold flex items-center">
                                            {o.name} 
                                            <span className={`ml-2 text-xs ${o.loyalty < 50 ? 'text-red-400' : o.loyalty < 80 ? 'text-yellow-400' : 'text-green-400'}`}>
                                                忠诚: {o.loyalty}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => personnelAction('reward', o.id)}
                                        disabled={o.loyalty >= 100}
                                        className={`px-3 py-1 rounded text-sm font-bold transition ${o.loyalty >= 100 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-yellow-700 hover:bg-yellow-600 text-white'}`}
                                    >
                                        赏赐 (1政令)
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderDiplomacy = () => {
        const otherFactions = Object.values(factions).filter(f => f.id !== 'player');

        return (
            <div className="p-6">
                <h2 className="text-2xl font-bold text-amber-500 mb-6 text-center">远交近攻</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherFactions.map(faction => (
                        <div key={faction.id} className="bg-slate-800/80 p-5 rounded-lg border border-amber-900/30 flex flex-col">
                            <div className="flex justify-between items-center mb-4 border-b border-amber-900/50 pb-2">
                                <h3 className={`text-lg font-bold text-white px-2 py-1 rounded ${faction.color}`}>{faction.name}</h3>
                                <span className="text-sm font-bold text-slate-300">君主：{officers.find(o=>o.id===faction.ruler)?.name}</span>
                            </div>
                            
                            <div className="mb-6 flex-grow">
                                <div className="text-sm text-slate-400 mb-1">双方友好度</div>
                                <div className="w-full bg-slate-900 rounded-full h-2.5 mb-2 border border-slate-700">
                                    <div className={`h-2.5 rounded-full ${faction.relation > 70 ? 'bg-green-500' : faction.relation > 30 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${faction.relation}%` }}></div>
                                </div>
                                <div className="text-right text-xs text-slate-500">{faction.relation} / 100</div>
                            </div>

                            <div className="space-y-2">
                                <button 
                                    onClick={() => diplomacyAction('gift', faction.id)}
                                    className="w-full bg-amber-800 hover:bg-amber-700 text-white py-2 rounded text-sm font-bold transition flex justify-center items-center"
                                >
                                    献礼结交 (耗:1政令, 500金)
                                </button>
                                <button 
                                    onClick={() => diplomacyAction('alienate', faction.id)}
                                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm font-bold transition flex justify-center items-center"
                                    title="散布流言，降低该势力随机武将的忠诚度"
                                >
                                    <MessageSquareWarning className="w-4 h-4 mr-1"/> 散布流言 (耗:1政令, 300金)
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- Main Layout ---
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans select-none" style={{ backgroundImage: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)' }}>
            {renderHeader()}
            
            <div className="flex flex-1 overflow-hidden">
                {renderNav()}
                
                <main className="flex-1 flex flex-col relative overflow-y-auto">
                    {/* View Switcher */}
                    <div className="flex-1 pb-4">
                        {activeTab === 'HOME' && renderHome()}
                        {activeTab === 'COUNCIL' && renderCouncil()}
                        {activeTab === 'ARMY' && renderArmy()}
                        {activeTab === 'TOWN' && renderTown()}
                        {activeTab === 'PERSONNEL' && renderPersonnel()}
                        {activeTab === 'DIPLOMACY' && renderDiplomacy()}
                    </div>
                </main>
            </div>

            {/* Bottom Log */}
            {renderLog()}
        </div>
    );
}