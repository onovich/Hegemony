import React, { useState, useEffect, useRef } from 'react';
import { 
    Swords, Shield, Wheat, Coins, Users, UserPlus, 
    Map, Scroll, Calendar, Home, Coffee, ShoppingBag, 
    Tent, Flag, ArrowRight, MessageSquareWarning, Crown
} from 'lucide-react';
import {
    ARTIFACTS,
    GAME_BALANCE,
    INITIAL_CITIES,
    INITIAL_DATE,
    INITIAL_FACTIONS,
    INITIAL_OFFICERS,
    INITIAL_RESOURCES,
    MAX_AP,
} from '../src/data/gameConfig.js';
import { advanceMonth } from '../src/logic/engine/calendarEngine.js';
import { resolvePlayerMonthlyTurn } from '../src/logic/engine/playerTurnResolution.js';
import {
    advanceTurnEconomy,
    advanceFactionEconomy,
    calculateAttackFoodCost,
    calculateBattlePower,
    calculateDefeatLosses,
    calculateDevelopmentGain,
    calculateDraftRecruits,
    calculateRecruitChance,
    calculateRewardBoost,
    calculateTrainingBoost,
    calculateVictoryLosses,
    getAlienateLoyaltyDrop,
    getAlienateSuccessChance,
    getCapturedCityTroops,
    getCityRoleLabel,
    getDiplomacyStateLabel,
    getEffectiveFactionStats,
    getExplorationBonus,
    getGiftRelationBoost,
    getOfficerContributionMultiplier,
} from '../src/logic/engine/gameBalance.js';
import { resolveAiFactionCityManagement } from '../src/logic/engine/aiCityManagement.js';
import { resolveAiMonthlyBattles } from '../src/logic/engine/aiBattleResolution.js';
import { getDirectedStatsWithSpecialty, getOfficerSpecialty } from '../src/logic/engine/officerSpecialties.js';
import {
    applyCityLeadershipRelationshipEffects,
    calculateRecruitRelationshipBonus,
    getCityLeadershipRelationshipEffect,
    getOfficerRelationLabel,
    getOfficerRelationScore,
} from '../src/logic/engine/officerRelationships.js';

const TAB_ITEMS = [
    { id: 'HOME', icon: Home, label: '主城', shortcut: '1' },
    { id: 'COUNCIL', icon: Scroll, label: '内政', shortcut: '2' },
    { id: 'ARMY', icon: Swords, label: '军政', shortcut: '3' },
    { id: 'TOWN', icon: Coffee, label: '探访', shortcut: '4' },
    { id: 'PERSONNEL', icon: UserPlus, label: '人事', shortcut: '5' },
    { id: 'DIPLOMACY', icon: Map, label: '外交', shortcut: '6' },
];

// --- Utility Functions ---
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const chance = (percent) => Math.random() * 100 < percent;
const EMPTY_STATS = { cmd: 0, int: 0, pol: 0, cha: 0 };

export default function App() {
    // --- State ---
    const [date, setDate] = useState(INITIAL_DATE);
    const [ap, setAp] = useState(MAX_AP);
    const [resources, setResources] = useState(INITIAL_RESOURCES);
    const [cities, setCities] = useState(INITIAL_CITIES);
    const [factions, setFactions] = useState(INITIAL_FACTIONS);
    const [officers, setOfficers] = useState(INITIAL_OFFICERS);
    const [inventory, setInventory] = useState([]);
    const [logs, setLogs] = useState([{ id: 0, text: '公元190年，群雄割据，您占据洛阳，开启了争霸之路。', type: 'system' }]);
    const [activeTab, setActiveTab] = useState('HOME');
    const [activeCityId, setActiveCityId] = useState('luoyang');
    const [gameResult, setGameResult] = useState(null);
    const [isDesktop, setIsDesktop] = useState(false);
    const logsEndRef = useRef(null);

    // Auto-scroll logs
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const syncViewport = (event) => setIsDesktop(event.matches);

        setIsDesktop(mediaQuery.matches);

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', syncViewport);
            return () => mediaQuery.removeEventListener('change', syncViewport);
        }

        mediaQuery.addListener(syncViewport);
        return () => mediaQuery.removeListener(syncViewport);
    }, []);

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
    const getPlayerCities = () => Object.values(cities).filter(c => c.owner === 'player');
    const getPlayerRuler = () => officers.find(officer => officer.id === 'player_ruler') ?? null;
    const getPlayerCity = () => {
        const playerCities = getPlayerCities();
        return playerCities.find(city => city.id === activeCityId) ?? playerCities[0] ?? null;
    };
    const getCityOfficers = (cityId, factionId = 'player') => officers.filter(o => o.faction === factionId && o.state === 'active' && o.cityId === cityId);
    const getCityOperationalProfile = (cityId, factionId = 'player', cityState = cities, officerState = officers) => {
        const city = cityState[cityId];
        if (!city) {
            return {
                stationedOfficers: [],
                governor: null,
                commander: null,
                governorSpecialty: null,
                commanderSpecialty: null,
                leadershipRelation: getCityLeadershipRelationshipEffect(null, null),
                economyStats: EMPTY_STATS,
                militaryStats: EMPTY_STATS,
            };
        }

        const stationedOfficers = officerState.filter(officer => (
            officer.faction === factionId &&
            officer.state === 'active' &&
            officer.cityId === cityId
        ));
        const governor = stationedOfficers.find(officer => officer.id === city.governorId) ?? null;
        const commander = stationedOfficers.find(officer => officer.id === city.commanderId) ?? null;
        const economyProfile = getDirectedStatsWithSpecialty(stationedOfficers, governor?.id ?? null, 'governor');
        const militaryProfile = getDirectedStatsWithSpecialty(stationedOfficers, commander?.id ?? null, 'commander');
        const relationshipProfile = applyCityLeadershipRelationshipEffects({
            economyStats: economyProfile.stats,
            militaryStats: militaryProfile.stats,
            governor,
            commander,
        });

        return {
            stationedOfficers,
            governor,
            commander,
            governorSpecialty: economyProfile.activeSpecialty,
            commanderSpecialty: militaryProfile.activeSpecialty,
            leadershipRelation: relationshipProfile.relationshipEffect,
            economyStats: relationshipProfile.economyStats,
            militaryStats: relationshipProfile.militaryStats,
        };
    };
    const getCurrentCityProfile = () => {
        const currentCity = getPlayerCity();
        return currentCity
            ? getCityOperationalProfile(currentCity.id)
            : {
                stationedOfficers: [],
                governor: null,
                commander: null,
                governorSpecialty: null,
                commanderSpecialty: null,
                leadershipRelation: getCityLeadershipRelationshipEffect(null, null),
                economyStats: EMPTY_STATS,
                militaryStats: EMPTY_STATS,
            };
    };
    const activeTabLabel = TAB_ITEMS.find(item => item.id === activeTab)?.label ?? '主城';
    const factionRulerIds = new Set(Object.values(factions).map(faction => faction.ruler));

    useEffect(() => {
        const playerCities = Object.values(cities).filter(city => city.owner === 'player');
        if (playerCities.length === 0) {
            return;
        }

        if (!playerCities.some(city => city.id === activeCityId)) {
            setActiveCityId(playerCities[0].id);
        }
    }, [cities, activeCityId]);

    useEffect(() => {
        let hasChanges = false;
        const nextCities = { ...cities };

        Object.values(cities).forEach(city => {
            const stationedIds = new Set(
                officers
                    .filter(officer => officer.faction === city.owner && officer.state === 'active' && officer.cityId === city.id)
                    .map(officer => officer.id)
            );

            const governorValid = !city.governorId || stationedIds.has(city.governorId);
            const commanderValid = !city.commanderId || stationedIds.has(city.commanderId);

            if (!governorValid || !commanderValid) {
                hasChanges = true;
                nextCities[city.id] = {
                    ...nextCities[city.id],
                    governorId: governorValid ? nextCities[city.id].governorId : null,
                    commanderId: commanderValid ? nextCities[city.id].commanderId : null,
                };
            }
        });

        if (hasChanges) {
            setCities(nextCities);
        }
    }, [cities, officers]);
    
    // Calculate total stats for player
    const getTotalStats = () => {
        return getEffectiveFactionStats(getPlayerOfficers());
    };

    const ensureCurrentCityOfficer = (actionLabel) => {
        const currentCityOfficers = getCurrentCityProfile().stationedOfficers;
        const currentCity = getPlayerCity();
        if (currentCityOfficers.length > 0) {
            return true;
        }

        addLog(currentCity
            ? `【${currentCity.name}】暂无驻守武将，无法执行${actionLabel}。请先在人事中调度武将。`
            : `当前已无可操作城池，无法执行${actionLabel}。`, 'error');
        return false;
    };

    const getLoyaltyStageLabel = (loyalty) => {
        if (loyalty >= GAME_BALANCE.loyalty.stableThreshold) {
            return '安定';
        }

        if (loyalty >= GAME_BALANCE.loyalty.warningThreshold) {
            return '可用';
        }

        if (loyalty > GAME_BALANCE.loyalty.embezzleThreshold) {
            return '不稳';
        }

        if (loyalty > GAME_BALANCE.loyalty.desertionThreshold) {
            return '离心';
        }

        return '叛离边缘';
    };

    // --- Core Actions ---

    // 1. Next Month (Turn processing)
    const nextMonth = () => {
        const nextDate = advanceMonth(date);
        setDate(nextDate);
        setAp(MAX_AP); // Reset AP

        const nextCities = Object.fromEntries(
            Object.entries(cities).map(([cityId, city]) => [cityId, { ...city }])
        );
        const nextOfficers = officers.map(officer => ({ ...officer }));

        const getFactionCitiesFromState = (factionId) => Object.values(nextCities).filter(city => city.owner === factionId);
        const getFactionOfficersFromState = (factionId, cityId = null) => nextOfficers.filter(officer => (
            officer.faction === factionId &&
            officer.state === 'active' &&
            (cityId === null || officer.cityId === cityId)
        ));
        const getCityProfileFromState = (cityId, factionId) => getCityOperationalProfile(cityId, factionId, nextCities, nextOfficers);

        const myCities = getFactionCitiesFromState('player');
        const myOfficers = getFactionOfficersFromState('player');
        const economy = advanceFactionEconomy({
            cities: myCities,
            officerCount: myOfficers.length,
            getCityStats: (city) => getCityProfileFromState(city.id, 'player').economyStats,
        });
        const playerTurnResult = resolvePlayerMonthlyTurn({
            nextCities,
            nextOfficers,
            resources,
            factions,
            factionRulerIds,
            economy,
            getFactionCitiesFromState,
            getFactionOfficersFromState,
            getCityProfileFromState,
            getCityRoleLabel,
        });

        setResources(prev => ({
            ...prev,
            ...playerTurnResult.resources,
        }));

        playerTurnResult.logs.forEach(log => addLog(log.text, log.type));

        const aiFactionIds = [...new Set(Object.values(nextCities).filter(city => city.owner !== 'player').map(city => city.owner))];

        aiFactionIds.forEach(factionId => {
            const aiManagement = resolveAiFactionCityManagement({
                factionId,
                factionName: factions[factionId].name,
                cities: getFactionCitiesFromState(factionId),
                officers: nextOfficers,
            });

            Object.entries(aiManagement.cityUpdates).forEach(([cityId, updatedCity]) => {
                nextCities[cityId] = updatedCity;
            });

            aiManagement.logs.forEach(log => addLog(log.text, log.type));
        });

        const aiBattleResult = resolveAiMonthlyBattles({
            nextCities,
            nextOfficers,
            factions,
            getFactionCitiesFromState,
            getCityProfileFromState,
        });

        aiBattleResult.logs.forEach(log => addLog(log.text, log.type));

        setOfficers(nextOfficers);
        setCities(nextCities);
        
        const remainingPlayerCities = Object.values(nextCities).filter(city => city.owner === 'player');
        const enemyCities = Object.values(nextCities).filter(city => city.owner !== 'player');
        if (remainingPlayerCities.length === 0) {
            setOfficers(nextOfficers);
            setCities(nextCities);
            setGameResult('defeat');
            addLog('☠️ 我方城池尽失，基业崩溃，霸业未成而中道崩殂！', 'error');
            setTimeout(() => alert('游戏结束：我方城池尽失。'), 100);
            return;
        }

        if (enemyCities.length === 0) {
            addLog('⭐⭐⭐ 捷报！您已攻克所有敌城，一统天下，成就霸业！ ⭐⭐⭐', 'success');
            alert("恭喜您，一统天下！");
        }
    };

    useEffect(() => {
        if (!isDesktop) return;

        const handleKeydown = (event) => {
            const target = event.target;
            const isEditable = target instanceof HTMLElement && (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.isContentEditable
            );

            if (isEditable || event.metaKey || event.ctrlKey || event.altKey) {
                return;
            }

            const tabMatch = TAB_ITEMS.find(item => item.shortcut === event.key);
            if (tabMatch) {
                event.preventDefault();
                setActiveTab(tabMatch.id);
                return;
            }

            if (event.key === 'n' || event.key === 'N') {
                event.preventDefault();
                nextMonth();
            }
        };

        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, [isDesktop, activeTab, date, ap, resources, cities, factions, officers, inventory, logs]);

    // 2. Exploration (民间探访)
    const exploreLocation = (location) => {
        if (!costAp(1)) return;
        if (!ensureCurrentCityOfficer('探访')) {
            setAp(prev => prev + 1);
            return;
        }

        const pOfficers = getCurrentCityProfile().stationedOfficers;
        const bonus = getExplorationBonus(pOfficers);

        if (location === 'tavern') {
            // 酒馆: 寻访武将 或 听闻情报
            if (chance(GAME_BALANCE.exploration.tavernDiscoverChance + bonus)) {
                // Find hidden officer
                const hidden = officers.filter(o => o.state === 'hidden');
                if (hidden.length > 0) {
                    const found = hidden[randInt(0, hidden.length - 1)];
                    setOfficers(prev => prev.map(o => o.id === found.id ? { ...o, state: 'discovered' } : o));
                    addLog(`你在酒馆偶遇了在野名士【${found.name}】！可前往人事界面招募。`, 'success');
                } else {
                    addLog('你在酒馆喝了一杯，听了些市井传言，一无所获。');
                }
            } else if (chance(GAME_BALANCE.exploration.tavernRumorChance)) {
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
            if (chance(GAME_BALANCE.exploration.marketArtifactChance + bonus)) {
                // Find item
                const item = ARTIFACTS[randInt(0, ARTIFACTS.length - 1)];
                if (!inventory.some(i => i.name === item.name)) {
                    setInventory([...inventory, item]);
                    addLog(`你在市集淘到了稀世珍宝：【${item.name}】！(${item.desc})`, 'success');
                    // Auto apply buff to ruler
                    setOfficers(prev => prev.map(o => o.id === 'player_ruler' ? { ...o, [item.stat]: o[item.stat] + item.val } : o));
                } else {
                    const goldFound = randInt(GAME_BALANCE.exploration.marketDuplicateGoldMin, GAME_BALANCE.exploration.marketDuplicateGoldMax);
                    setResources(prev => ({ ...prev, gold: prev.gold + goldFound }));
                    addLog(`你在市集巡视，收缴了违规商贩的罚款 ${goldFound} 金。`);
                }
            } else {
                const goldFound = randInt(GAME_BALANCE.exploration.marketRegularGoldMin, GAME_BALANCE.exploration.marketRegularGoldMax);
                setResources(prev => ({ ...prev, gold: prev.gold + goldFound }));
                addLog(`你在市集协助管理，获得了 ${goldFound} 金的税收分成。`);
            }
        }
        else if (location === 'street') {
            // 街道: 民心、粮食
            if (chance(GAME_BALANCE.exploration.streetFoodChance)) {
                const foodFound = randInt(GAME_BALANCE.exploration.streetFoodMin, GAME_BALANCE.exploration.streetFoodMax);
                setResources(prev => ({ ...prev, food: prev.food + foodFound }));
                addLog(`当地富商感念你的恩德，捐赠了 ${foodFound} 粮草。`, 'success');
            } else if (chance(GAME_BALANCE.exploration.streetReputationChance)) {
                setResources(prev => ({ ...prev, reputation: Math.min(100, prev.reputation + randInt(GAME_BALANCE.exploration.streetReputationMin, GAME_BALANCE.exploration.streetReputationMax)) }));
                addLog('你巡视街道，体恤民情，获得了百姓的爱戴（民心上升）。', 'success');
            } else {
                addLog('街道上平静祥和，无事发生。');
            }
        }
    };

    // 3. Domestic (内政)
    const developCity = (type) => {
        if (!costAp(1)) return;
        if (!ensureCurrentCityOfficer('内政')) {
            setAp(prev => prev + 1);
            return;
        }
        const currentCityProfile = getCurrentCityProfile();
        const stats = type === 'defense' ? currentCityProfile.militaryStats : currentCityProfile.economyStats;
        const myCity = getPlayerCity();
        
        let increase = 0;
        const cost = GAME_BALANCE.development.goldCost;

        if (resources.gold < cost) {
            addLog('金钱不足，无法进行内政开发！(需100金)', 'error');
            setAp(prev => prev + 1); // Refund AP
            return;
        }

        setResources(prev => ({ ...prev, gold: prev.gold - cost }));
        increase = calculateDevelopmentGain(type, stats);

        if (type === 'agriculture') {
            setCities(prev => ({ ...prev, [myCity.id]: { ...prev[myCity.id], agriculture: prev[myCity.id].agriculture + increase } }));
            addLog(`指派文官开垦农田，农业值提升了 ${increase}！`);
        } else if (type === 'commerce') {
            setCities(prev => ({ ...prev, [myCity.id]: { ...prev[myCity.id], commerce: prev[myCity.id].commerce + increase } }));
            addLog(`指派文官发展商贸，商业值提升了 ${increase}！`);
        } else if (type === 'defense') {
            setCities(prev => ({ ...prev, [myCity.id]: { ...prev[myCity.id], defense: prev[myCity.id].defense + increase } }));
            addLog(`指派武将修筑城防，防御值提升了 ${increase}！`);
        }
    };

    // 4. Military (军事)
    const militaryAction = (action, targetCityId = null) => {
        const myCity = getPlayerCity();
        if ((action === 'draft' || action === 'train' || action === 'attack') && !ensureCurrentCityOfficer(action === 'attack' ? '出兵' : '军务')) {
            return;
        }
        const stats = getCurrentCityProfile().militaryStats;

        if (action === 'draft') {
            const costGold = GAME_BALANCE.military.draftGoldCost;
            const costFood = GAME_BALANCE.military.draftFoodCost;
            if (resources.gold < costGold || resources.food < costFood) {
                addLog(`征兵需要 ${costGold}金 和 ${costFood}粮草，资源不足！`, 'error');
                return;
            }
            if (!costAp(1)) return;
            
            const recruits = calculateDraftRecruits({
                city: myCity,
                effectiveCha: stats.cha,
                reputation: resources.reputation,
            });
            setResources(prev => ({ ...prev, gold: prev.gold - costGold, food: prev.food - costFood }));
            setCities(prev => ({ ...prev, [myCity.id]: { ...prev[myCity.id], troops: prev[myCity.id].troops + recruits, morale: Math.max(10, prev[myCity.id].morale - GAME_BALANCE.military.draftMoralePenalty) } }));
            addLog(`发布募兵令，消耗金粮，招募了 ${recruits} 名新兵。（士气略微下降）`);
        } 
        else if (action === 'train') {
            if (!costAp(1)) return;
            const moraleBoost = calculateTrainingBoost(stats.cmd);
            setCities(prev => ({ ...prev, [myCity.id]: { ...prev[myCity.id], morale: Math.min(100, prev[myCity.id].morale + moraleBoost) } }));
            addLog(`武将们操练兵马，军队士气提升了 ${moraleBoost}！`);
        }
        else if (action === 'attack' && targetCityId) {
            const costFood = calculateAttackFoodCost(myCity.troops);
            if (resources.food < costFood) {
                addLog(`大军出征需要 ${costFood} 粮草，当前粮草不足！`, 'error');
                return;
            }
            if (!costAp(GAME_BALANCE.military.attackApCost)) return; // Attack costs 2 AP

            setResources(prev => ({ ...prev, food: prev.food - costFood }));
            const targetCity = cities[targetCityId];
            const targetFaction = targetCity.owner;
            const enemyOfficers = getCityOfficers(targetCityId, targetFaction);
            const enemyStats = getEffectiveFactionStats(enemyOfficers);
            const currentRelation = factions[targetFaction].relation ?? 0;

            setFactions(prev => ({
                ...prev,
                [targetFaction]: {
                    ...prev[targetFaction],
                    relation: Math.max(0, prev[targetFaction].relation - GAME_BALANCE.diplomacy.attackRelationDrop),
                },
            }));

            if (currentRelation >= GAME_BALANCE.diplomacy.tradeThreshold) {
                setResources(prev => ({
                    ...prev,
                    reputation: Math.max(0, prev.reputation - GAME_BALANCE.diplomacy.friendlyAttackReputationPenalty),
                }));
                addLog(`你对友好势力【${factions[targetFaction].name}】开战，名望下降了 ${GAME_BALANCE.diplomacy.friendlyAttackReputationPenalty}。`, 'warning');
            }

            addLog(`🔥 您对【${targetCity.name}】(${factions[targetFaction].name}) 发动了战争！`, 'warning');

            // Simple Battle Calculation
            const myPower = calculateBattlePower({
                troops: myCity.troops,
                cmd: stats.cmd,
                morale: myCity.morale,
            });
            const enemyPower = calculateBattlePower({
                troops: targetCity.troops,
                cmd: enemyStats.cmd || GAME_BALANCE.military.defaultEnemyCommand,
                morale: targetCity.morale,
                defense: targetCity.defense,
                isDefender: true,
            });

            setTimeout(() => {
                if (myPower > enemyPower) {
                    // Win
                    const troopsLost = calculateVictoryLosses(targetCity.troops);
                    const capturedTroops = getCapturedCityTroops(targetCity.troops);
                    
                    setCities(prev => ({ 
                        ...prev, 
                        [myCity.id]: { ...prev[myCity.id], troops: Math.max(0, prev[myCity.id].troops - troopsLost) },
                        [targetCityId]: { ...prev[targetCityId], owner: 'player', governorId: null, commanderId: null, troops: capturedTroops, morale: 60 }
                    }));
                    
                    // Capture officers
                    let capturedNames = [];
                    setOfficers(prev => prev.map(o => {
                        if (o.faction === targetFaction && o.cityId === targetCityId && chance(50)) {
                            capturedNames.push(o.name);
                            return { ...o, faction: 'player', cityId: targetCityId, state: 'active', loyalty: 40 };
                        }
                        // Rest flee and become free
                        if (o.faction === targetFaction && o.cityId === targetCityId) return { ...o, faction: 'free', cityId: null, state: 'discovered' };
                        return o;
                    }));

                    // Spoil of war
                    const spoilGold = Math.floor(targetCity.commerce * 10);
                    const spoilFood = Math.floor(targetCity.agriculture * 20);
                    setResources(prev => ({ ...prev, gold: prev.gold + spoilGold, food: prev.food + spoilFood, reputation: prev.reputation + 5 }));

                    let logMsg = `⚔️ 战斗胜利！您成功攻占了【${targetCity.name}】！我军损失 ${troopsLost} 兵力。缴获资金 ${spoilGold}，粮草 ${spoilFood}。`;
                    if (capturedNames.length > 0) logMsg += `俘虏并收编了敌将：${capturedNames.join(', ')}。`;
                    addLog(logMsg, 'success');

                    const remainingEnemyCities = Object.values(cities).filter(c => c.owner !== 'player' && c.id !== targetCityId);
                    if (remainingEnemyCities.length === 0) {
                        addLog('⭐⭐⭐ 捷报！您已攻克所有敌城，一统天下，成就霸业！ ⭐⭐⭐', 'success');
                        setTimeout(() => alert('恭喜您，一统天下！'), 100);
                    }

                } else {
                    // Lose
                    const troopsLost = calculateDefeatLosses(myCity.troops);
                    setCities(prev => ({
                        ...prev,
                        [myCity.id]: { ...prev[myCity.id], troops: Math.max(0, prev[myCity.id].troops - troopsLost), morale: Math.max(10, prev[myCity.id].morale - GAME_BALANCE.military.defeatMoralePenalty) },
                        [targetCityId]: { ...prev[targetCityId], troops: Math.max(0, Math.floor(prev[targetCityId].troops * GAME_BALANCE.military.defenderTroopLossRateOnRepel)) }
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
            const pRuler = getPlayerRuler();
            const relationBonus = calculateRecruitRelationshipBonus(pRuler, officer);
            const relationLabel = getOfficerRelationLabel(getOfficerRelationScore(pRuler, officer));
            const chanceToHire = calculateRecruitChance({
                rulerCha: pRuler.cha,
                officerInt: officer.int,
                officerLoyalty: officer.loyalty,
                relationshipBonus: relationBonus,
            });
            
            if (chance(chanceToHire)) {
                setOfficers(prev => prev.map(o => o.id === officerId ? { ...o, faction: 'player', cityId: activeCityId, state: 'active', loyalty: 70 } : o));
                addLog(`登庸成功！【${officer.name}】因与主公关系${relationLabel}，被顺利说服加入麾下。`, 'success');
            } else {
                addLog(`登庸失败！【${officer.name}】与主公关系${relationLabel}，婉拒了招募。`);
            }
        } 
        else if (action === 'reward') {
            const cost = GAME_BALANCE.personnel.rewardGoldCost;
            if (resources.gold < cost) {
                addLog(`赏赐需要 ${cost} 金，资金不足！`, 'error');
                setAp(prev => prev + 1); // Refund
                return;
            }
            setResources(prev => ({ ...prev, gold: prev.gold - cost }));
            const boost = calculateRewardBoost();
            setOfficers(prev => prev.map(o => o.id === officerId ? { ...o, loyalty: Math.min(100, o.loyalty + boost) } : o));
            addLog(`赏赐了【${officer.name}】百金，其忠诚度提升了 ${boost}！`);
        }
        else if (action === 'dispatch') {
            const destinationCity = cities[activeCityId];
            const currentCityName = cities[officer.cityId]?.name ?? '未知地点';
            setOfficers(prev => prev.map(o => o.id === officerId ? { ...o, cityId: activeCityId } : o));
            addLog(`调度【${officer.name}】离开【${currentCityName}】，前往【${destinationCity.name}】驻守。`, 'system');
        }
        else if (action === 'appointGovernor') {
            setCities(prev => ({
                ...prev,
                [activeCityId]: {
                    ...prev[activeCityId],
                    governorId: officerId,
                },
            }));
            addLog(`任命【${officer.name}】为【${cities[activeCityId].name}】太守。`, 'success');
        }
        else if (action === 'appointCommander') {
            setCities(prev => ({
                ...prev,
                [activeCityId]: {
                    ...prev[activeCityId],
                    commanderId: officerId,
                },
            }));
            addLog(`任命【${officer.name}】为【${cities[activeCityId].name}】主将。`, 'success');
        }
    };

    // 6. Diplomacy (外交)
    const diplomacyAction = (action, factionId) => {
        if (!costAp(1)) return;
        const targetFaction = factions[factionId];
        const stats = getTotalStats();

        if (action === 'gift') {
            const cost = GAME_BALANCE.diplomacy.giftGoldCost;
            if (resources.gold < cost) {
                addLog(`赠礼需要 ${cost} 金，资金不足！`, 'error');
                setAp(prev => prev + 1);
                return;
            }
            setResources(prev => ({ ...prev, gold: prev.gold - cost }));
            const relationBoost = getGiftRelationBoost(stats.pol);
            const nextRelation = Math.min(100, targetFaction.relation + relationBoost);
            setFactions(prev => ({ ...prev, [factionId]: { ...prev[factionId], relation: nextRelation } }));
            addLog(`派遣使者向【${targetFaction.name}】献上厚礼，双方友好度提升了 ${relationBoost}。`);
            if (targetFaction.relation < GAME_BALANCE.diplomacy.tradeThreshold && nextRelation >= GAME_BALANCE.diplomacy.tradeThreshold) {
                addLog(`【${targetFaction.name}】已进入通商友邦状态，下月起可获得稳定贸易收益。`, 'success');
            }
        }
        else if (action === 'alienate') {
            const cost = GAME_BALANCE.diplomacy.alienateGoldCost;
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
                if (chance(getAlienateSuccessChance(stats.int, targetOfficer.int))) {
                    const loyaltyDrop = getAlienateLoyaltyDrop();
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
        <div className="bg-slate-900 border-b border-amber-900/50 p-4 lg:px-6 text-amber-50 shadow-md">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
                <Crown className="w-8 h-8 text-yellow-500" />
                <div>
                    <h1 className="text-xl font-bold tracking-widest text-amber-500">霸业：三国崛起</h1>
                    <span className="text-xs text-slate-400">主公：{officers.find(o=>o.id==='player_ruler')?.name}{isDesktop ? ` · 当前界面：${activeTabLabel}` : ''}</span>
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
        </div>
    );

    const renderNav = () => {
        return (
            <div className="w-24 bg-slate-800 flex flex-col border-r border-amber-900/30 flex-shrink-0 lg:w-28 lg:rounded-2xl lg:border lg:border-amber-900/30 lg:bg-slate-900/70 lg:shadow-2xl lg:backdrop-blur-sm lg:overflow-hidden">
                {TAB_ITEMS.map(item => {
                    const Icon = item.icon;

                    return (
                    <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        title={isDesktop ? `${item.label} (${item.shortcut})` : item.label}
                        className={`flex flex-col items-center justify-center p-4 h-20 transition-colors border-b border-amber-900/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${activeTab === item.id ? 'bg-amber-900/50 text-amber-400 border-l-4 border-l-amber-500' : 'text-slate-400 hover:bg-slate-700 hover:text-amber-200'} ${isDesktop ? 'lg:h-24 lg:gap-1' : ''}`}
                    >
                        <Icon className="w-5 h-5 lg:w-6 lg:h-6"/>
                        <span className="text-xs mt-1 font-bold tracking-wide">{item.label}</span>
                        {isDesktop && <span className="text-[10px] text-slate-500">{item.shortcut}</span>}
                    </button>
                )})}
            </div>
        );
    };

    const renderLog = (className = 'h-48 bg-black/80 border-t border-amber-900/50 p-3 overflow-y-auto font-mono text-sm shadow-inner shrink-0') => (
        <div className={className}>
            {logs.map((log) => (
                <div key={log.id} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : log.type === 'warning' ? 'text-yellow-400' : log.type === 'system' ? 'text-blue-300' : 'text-slate-300'}`}>
                    <span className="opacity-50 mr-2">[{date.year}年{date.month}月]</span>
                    {log.text}
                </div>
            ))}
            <div ref={logsEndRef} />
        </div>
    );

    const renderDesktopSidebar = () => {
        const myCity = getPlayerCity();
        const playerCities = getPlayerCities();
        const totalTroops = playerCities.reduce((sum, city) => sum + city.troops, 0);

        return (
            <aside className="hidden lg:flex lg:w-[320px] lg:flex-col lg:gap-4 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-amber-900/30 lg:bg-slate-900/70 lg:p-4 lg:shadow-2xl lg:backdrop-blur-sm">
                <div className="rounded-xl border border-amber-900/20 bg-black/20 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-bold tracking-widest text-amber-400">桌面指挥台</h2>
                        <span className="rounded-full border border-amber-800/40 bg-amber-950/40 px-2 py-1 text-xs text-amber-200">{activeTabLabel}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                        <div className="rounded-lg bg-slate-800/70 p-3">
                            <div className="text-xs text-slate-500">当前操作城</div>
                            <div className="mt-1 font-bold text-amber-100">{myCity.name}</div>
                        </div>
                        <div className="rounded-lg bg-slate-800/70 p-3">
                            <div className="text-xs text-slate-500">总兵力</div>
                            <div className="mt-1 font-bold text-amber-100">{totalTroops}</div>
                        </div>
                        <div className="rounded-lg bg-slate-800/70 p-3">
                            <div className="text-xs text-slate-500">当前城士气</div>
                            <div className="mt-1 font-bold text-amber-100">{myCity.morale} / 100</div>
                        </div>
                        <div className="rounded-lg bg-slate-800/70 p-3">
                            <div className="text-xs text-slate-500">治下城池</div>
                            <div className="mt-1 font-bold text-amber-100">{playerCities.length} 座</div>
                        </div>
                        <div className="rounded-lg bg-slate-800/70 p-3 col-span-2">
                            <div className="text-xs text-slate-500">本月政令</div>
                            <div className="mt-1 font-bold text-amber-100">{ap} / {MAX_AP}</div>
                        </div>
                    </div>
                    <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-400">
                        <div className="mb-2 font-bold tracking-wide text-slate-300">切换当前城池</div>
                        <div className="grid grid-cols-2 gap-2">
                            {playerCities.map(city => (
                                <button
                                    key={city.id}
                                    type="button"
                                    onClick={() => setActiveCityId(city.id)}
                                    className={`rounded px-2 py-2 text-left transition ${city.id === myCity.id ? 'bg-amber-900/50 text-amber-200 border border-amber-700/60' : 'bg-slate-900/70 text-slate-300 border border-slate-700 hover:border-amber-800/40'}`}
                                >
                                    <div className="font-bold">{city.name}</div>
                                    <div className="text-[10px] opacity-70">{getCityRoleLabel(city)} · 兵 {city.troops} / 商 {city.commerce}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-400">
                        <div className="mb-2 font-bold tracking-wide text-slate-300">快捷键</div>
                        <div className="grid grid-cols-2 gap-2">
                            {TAB_ITEMS.map(item => (
                                <div key={item.id} className="flex items-center justify-between rounded bg-slate-900/70 px-2 py-1">
                                    <span>{item.label}</span>
                                    <span className="text-amber-300">{item.shortcut}</span>
                                </div>
                            ))}
                            <div className="col-span-2 flex items-center justify-between rounded bg-slate-900/70 px-2 py-1">
                                <span>推进次月</span>
                                <span className="text-amber-300">N</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-amber-900/20 bg-black/20">
                    <div className="border-b border-amber-900/20 px-4 py-3 text-sm font-bold tracking-widest text-amber-400">军情日志</div>
                    {renderLog('h-full overflow-y-auto p-4 font-mono text-sm')}
                </div>
            </aside>
        );
    };

    // --- Tab Contents ---

    const renderHome = () => {
        const myCity = getPlayerCity();
        const playerCities = getPlayerCities();
        const myOfficers = getPlayerOfficers();
        const currentCityProfile = getCurrentCityProfile();
        const currentCityOfficers = currentCityProfile.stationedOfficers;
        const totalStats = getTotalStats();
        const currentCityEconomyStats = currentCityProfile.economyStats;
        const currentCityMilitaryStats = currentCityProfile.militaryStats;
        const currentCityEconomy = myCity
            ? advanceTurnEconomy({ city: myCity, officerCount: 0, cityStats: currentCityEconomyStats })
            : null;
        const totalTroops = playerCities.reduce((sum, city) => sum + city.troops, 0);
        const totalAgriculture = playerCities.reduce((sum, city) => sum + city.agriculture, 0);
        const totalCommerce = playerCities.reduce((sum, city) => sum + city.commerce, 0);

        return (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/80 p-5 rounded-lg border border-amber-900/30">
                    <h2 className="text-xl font-bold text-amber-500 mb-4 flex items-center border-b border-amber-900/50 pb-2">
                        <Tent className="w-6 h-6 mr-2"/> 当前城池情报：{myCity.name}
                    </h2>
                    <div className="mb-4 rounded-lg bg-black/20 p-3 text-xs text-slate-400">
                        所属地区：{myCity.region} · 城市特色：{myCity.specialty}
                    </div>
                    <div className="mb-4 rounded-lg bg-black/20 p-3 text-xs text-slate-400">
                        太守特技：{currentCityProfile.governorSpecialty?.name ?? '未激活'} · 主将特技：{currentCityProfile.commanderSpecialty?.name ?? '未激活'}
                    </div>
                    <div className="mb-4 rounded-lg bg-black/20 p-3 text-xs text-slate-400">
                        主官配合：{currentCityProfile.leadershipRelation.relationLabel} {currentCityProfile.governor && currentCityProfile.commander && currentCityProfile.governor.id !== currentCityProfile.commander.id ? `(相性 ${currentCityProfile.leadershipRelation.relationScore})` : '（待成型）'}
                    </div>
                    <div className="mb-4 rounded-lg bg-black/20 p-3 text-xs text-slate-400">
                        同城人物事件：驻守武将之间若是知己，月度可能触发协力增益；若是死敌，则可能引发内耗。部分特定人物组合还会触发专属事件文本与结果。
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-slate-300">
                        <div><span className="text-slate-500">太守：</span>{currentCityProfile.governor?.name ?? '未任命'}</div>
                        <div><span className="text-slate-500">驻军：</span>{myCity.troops}</div>
                        <div><span className="text-slate-500">农业：</span>{myCity.agriculture}</div>
                        <div><span className="text-slate-500">商业：</span>{myCity.commerce}</div>
                        <div><span className="text-slate-500">城防：</span>{myCity.defense}</div>
                        <div><span className="text-slate-500">士气：</span>{myCity.morale} / 100</div>
                        <div><span className="text-slate-500">驻守武将：</span>{currentCityOfficers.length}</div>
                        <div><span className="text-slate-500">主将：</span>{currentCityProfile.commander?.name ?? '未任命'}</div>
                        <div><span className="text-slate-500">政务统筹：</span>政 {currentCityEconomyStats.pol} / 魅 {currentCityEconomyStats.cha}</div>
                        <div><span className="text-slate-500">军务统筹：</span>统 {currentCityMilitaryStats.cmd} / 魅 {currentCityMilitaryStats.cha}</div>
                        <div><span className="text-slate-500">预计月资金：</span>{currentCityEconomy?.goldIncome ?? 0}</div>
                        <div><span className="text-slate-500">预计月粮草：</span>{currentCityEconomy?.foodIncome ?? 0}</div>
                    </div>
                    {playerCities.length > 1 && (
                        <div className="mt-4 rounded-lg bg-black/20 p-3 text-xs text-slate-400">
                            已占领 {playerCities.length} 座城池，内政、征兵、训练与出兵都以当前选中城池执行。
                        </div>
                    )}
                    <div className="mt-4 rounded-lg bg-black/20 p-3 text-xs text-slate-400">
                        太守主导本城政务收益，主将主导本城军务表现。任命合适人选，能让每座城的定位更明确。
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {currentCityOfficers.length === 0 ? (
                            <span className="text-xs text-red-400">当前城暂无驻守武将</span>
                        ) : currentCityOfficers.map(o => (
                            <span key={o.id} className="px-2 py-1 bg-slate-700 text-xs rounded border border-slate-600 text-amber-100">
                                {o.name}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-800/80 p-5 rounded-lg border border-amber-900/30">
                    <h2 className="text-xl font-bold text-amber-500 mb-4 flex items-center border-b border-amber-900/50 pb-2">
                        <Users className="w-6 h-6 mr-2"/> 势力概况
                    </h2>
                    <div className="mb-4">
                        <div className="text-sm text-slate-400 mb-1">势力有效能力 (主将发挥 + 辅佐折算，影响内政与军事效率)</div>
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
                                    {o.name} <span className="opacity-50">(忠:{o.loyalty} / 效率:{Math.round(getOfficerContributionMultiplier(o.loyalty) * 100)}%)</span>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
                        <div className="rounded bg-black/20 p-3">
                            <div className="text-xs text-slate-500">治下城池</div>
                            <div className="mt-1 font-bold text-amber-100">{playerCities.length}</div>
                        </div>
                        <div className="rounded bg-black/20 p-3">
                            <div className="text-xs text-slate-500">总兵力</div>
                            <div className="mt-1 font-bold text-amber-100">{totalTroops}</div>
                        </div>
                        <div className="rounded bg-black/20 p-3">
                            <div className="text-xs text-slate-500">总农业</div>
                            <div className="mt-1 font-bold text-amber-100">{totalAgriculture}</div>
                        </div>
                        <div className="rounded bg-black/20 p-3">
                            <div className="text-xs text-slate-500">总商业</div>
                            <div className="mt-1 font-bold text-amber-100">{totalCommerce}</div>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2 bg-slate-800/80 p-5 rounded-lg border border-amber-900/30">
                    <h2 className="text-xl font-bold text-amber-500 mb-4 border-b border-amber-900/50 pb-2">城池总览</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {playerCities.map(city => (
                            (() => {
                                const cityProfile = getCityOperationalProfile(city.id);
                                const stationedOfficers = cityProfile.stationedOfficers;
                                const projectedEconomy = advanceTurnEconomy({ city, officerCount: 0, cityStats: cityProfile.economyStats });

                                return (
                            <button
                                key={city.id}
                                type="button"
                                onClick={() => setActiveCityId(city.id)}
                                className={`rounded-lg border p-4 text-left transition ${city.id === myCity.id ? 'border-amber-600 bg-amber-950/30' : 'border-slate-700 bg-black/20 hover:border-amber-800/40'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="font-bold text-amber-100">{city.name}</div>
                                    <span className="text-xs text-slate-400">{city.id === myCity.id ? '当前操作城' : '点击切换'}</span>
                                </div>
                                <div className="mt-2 text-xs text-amber-300">定位：{getCityRoleLabel(city)}</div>
                                <div className="mt-1 text-xs text-slate-500">地区：{city.region} · 特色：{city.specialty}</div>
                                <div className="mt-1 text-xs text-slate-400">太守：{cityProfile.governor?.name ?? '未任命'} | 主将：{cityProfile.commander?.name ?? '未任命'}</div>
                                <div className="mt-1 text-xs text-slate-500">特技：{cityProfile.governorSpecialty?.shortLabel ?? '无'} / {cityProfile.commanderSpecialty?.shortLabel ?? '无'}</div>
                                <div className="mt-1 text-xs text-slate-500">配合：{cityProfile.leadershipRelation.relationLabel}</div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-300">
                                    <div>兵力：{city.troops}</div>
                                    <div>士气：{city.morale}</div>
                                    <div>农业：{city.agriculture}</div>
                                    <div>商业：{city.commerce}</div>
                                    <div>城防：{city.defense}</div>
                                    <div>驻守：{stationedOfficers.length} 人</div>
                                    <div>月资金：{projectedEconomy.goldIncome}</div>
                                    <div>月粮草：{projectedEconomy.foodIncome}</div>
                                    <div>用途：{city.role === 'military' ? '便于扩军' : city.role === 'commerce' ? '偏重金钱' : city.role === 'agriculture' ? '偏重粮草' : '经营均衡'}</div>
                                </div>
                            </button>
                                );
                            })()
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderCouncil = () => (
        <div className="p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-amber-500 mb-6 text-center">主持内政</h2>
            <p className="mb-6 text-center text-xs text-slate-400">当前城由【{getCurrentCityProfile().governor?.name ?? '未任命'}】主持政务，太守会优先影响本城经营收益与开发效果。</p>
            <p className="mb-6 text-center text-xs text-slate-500">当前激活特技：{getCurrentCityProfile().governorSpecialty?.name ?? '无'}。{getCurrentCityProfile().governorSpecialty?.description ?? '任命合适的太守后，可在此看到政务侧加成。'}</p>
            <p className="mb-6 text-center text-xs text-slate-500">当前主官配合：{getCurrentCityProfile().leadershipRelation.relationLabel}。太守与主将相性越好，内政与军务的协同加成越高。</p>
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
        const currentCityProfile = getCurrentCityProfile();
        const currentCityOfficers = currentCityProfile.stationedOfficers;
        const currentCityStats = currentCityProfile.militaryStats;
        const enemyCities = Object.values(cities).filter(c => c.owner !== 'player');

        return (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Preparation */}
                <div className="space-y-6">
                    <div className="bg-slate-800/80 p-6 rounded-lg border border-amber-900/30">
                        <h2 className="text-xl font-bold text-amber-500 mb-4 flex items-center border-b border-amber-900/50 pb-2">
                            <Flag className="w-6 h-6 mr-2"/> 军备筹建
                        </h2>
                        <p className="text-xs text-slate-400 mb-4">当前军务由【{myCity.name}】执行，主将为【{currentCityProfile.commander?.name ?? '未任命'}】，城市定位为【{getCityRoleLabel(myCity)}】。</p>
                        <p className="text-xs text-slate-500 mb-4">当前激活特技：{currentCityProfile.commanderSpecialty?.name ?? '无'}。{currentCityProfile.commanderSpecialty?.description ?? '任命合适主将后，可在此看到军务侧加成。'}</p>
                        <p className="text-xs text-slate-500 mb-4">当前主官配合：{currentCityProfile.leadershipRelation.relationLabel}，会同步修正本城的政务与军务画像。</p>
                        <div className="mb-4 rounded bg-black/20 p-3 text-xs text-slate-300">
                            驻守武将：{currentCityOfficers.length} 人 | 当前城有效统率：{currentCityStats.cmd} | 当前城有效魅力：{currentCityStats.cha}
                        </div>
                        <div className="flex flex-col space-y-4 mt-4">
                            <div className="flex justify-between items-center bg-black/20 p-3 rounded">
                                <div>
                                    <div className="text-amber-100 font-bold">征召士兵</div>
                                    <div className="text-xs text-slate-400">消耗250金, 800粮。受【有效魅力】与城市商贸影响。</div>
                                </div>
                                <button onClick={() => militaryAction('draft')} className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-bold transition">征兵 (1政令)</button>
                            </div>
                            <div className="flex justify-between items-center bg-black/20 p-3 rounded">
                                <div>
                                    <div className="text-amber-100 font-bold">军队操练</div>
                                    <div className="text-xs text-slate-400">提升军队士气。受【有效统帅】影响。</div>
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
                <button 
                    type="button"
                    onClick={() => exploreLocation('tavern')}
                    className="bg-slate-800 hover:bg-slate-700 cursor-pointer p-8 rounded-lg border-2 border-amber-900/30 text-center transition flex flex-col items-center justify-center h-64 shadow-lg group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
                >
                    <Coffee className="w-16 h-16 text-amber-600 mb-4 group-hover:scale-110 transition-transform"/>
                    <h3 className="text-xl text-amber-100 font-bold mb-2">酒馆</h3>
                    <p className="text-slate-400 text-sm">鱼龙混杂之地。可打听情报，或结识在野的名士武将。</p>
                </button>
                
                <button 
                    type="button"
                    onClick={() => exploreLocation('market')}
                    className="bg-slate-800 hover:bg-slate-700 cursor-pointer p-8 rounded-lg border-2 border-amber-900/30 text-center transition flex flex-col items-center justify-center h-64 shadow-lg group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
                >
                    <ShoppingBag className="w-16 h-16 text-yellow-600 mb-4 group-hover:scale-110 transition-transform"/>
                    <h3 className="text-xl text-amber-100 font-bold mb-2">市集</h3>
                    <p className="text-slate-400 text-sm">商贾云集。巡视可获得额外税收，偶尔能淘到稀世珍宝。</p>
                </button>

                <button 
                    type="button"
                    onClick={() => exploreLocation('street')}
                    className="bg-slate-800 hover:bg-slate-700 cursor-pointer p-8 rounded-lg border-2 border-amber-900/30 text-center transition flex flex-col items-center justify-center h-64 shadow-lg group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
                >
                    <Users className="w-16 h-16 text-blue-500 mb-4 group-hover:scale-110 transition-transform"/>
                    <h3 className="text-xl text-amber-100 font-bold mb-2">街道</h3>
                    <p className="text-slate-400 text-sm">安抚百姓，倾听民声。可提升民心，或获得富商的粮草捐赠。</p>
                </button>
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
        const currentCityProfile = getCurrentCityProfile();
        const stationedOfficers = currentCityProfile.stationedOfficers.filter(o => o.id !== 'player_ruler');
        const playerRuler = getPlayerRuler();

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
                                        <div className="mt-1 text-xs text-slate-500">定位：{o.roleProfile} | 特技：{getOfficerSpecialty(o)?.name ?? '无'}</div>
                                        <div className="mt-1 text-xs text-slate-500">与主公相性：{getOfficerRelationLabel(getOfficerRelationScore(playerRuler, o))} | 招募修正：{calculateRecruitRelationshipBonus(playerRuler, o) >= 0 ? '+' : ''}{calculateRecruitRelationshipBonus(playerRuler, o)}</div>
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
                        <Tent className="w-6 h-6 mr-2"/> 当前城任命
                    </h2>
                    <p className="text-xs text-slate-400 mb-4">当前操作城为【{cities[activeCityId]?.name}】。太守优先影响经营收益，主将优先影响军务表现。</p>
                    <p className="text-xs text-slate-500 mb-4">当前主官配合：{currentCityProfile.leadershipRelation.relationLabel}。知己搭档会强化城市画像，死敌搭档会拖累经营与军务。</p>
                    {stationedOfficers.length === 0 ? (
                        <p className="text-slate-500 text-sm py-4 text-center">当前城暂无可任命的驻守武将。</p>
                    ) : (
                        <div className="space-y-3 mb-6">
                            {stationedOfficers.map(o => (
                                <div key={o.id} className="flex justify-between items-center p-3 bg-black/40 border border-slate-700 rounded">
                                    <div>
                                        <div className="text-amber-100 font-bold">{o.name}</div>
                                        <div className="mt-1 text-xs text-slate-400">政:{o.pol} 魅:{o.cha} 统:{o.cmd}</div>
                                        <div className="mt-1 text-xs text-slate-500">定位：{o.roleProfile} | 特技：{getOfficerSpecialty(o)?.name ?? '无'}</div>
                                        <div className="mt-1 text-xs text-slate-500">与主公关系：{getOfficerRelationLabel(getOfficerRelationScore(playerRuler, o))}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => personnelAction('appointGovernor', o.id)}
                                            disabled={currentCityProfile.governor?.id === o.id}
                                            className={`px-3 py-1 rounded text-sm font-bold transition ${currentCityProfile.governor?.id === o.id ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-amber-800 hover:bg-amber-700 text-white'}`}
                                        >
                                            任太守
                                        </button>
                                        <button 
                                            onClick={() => personnelAction('appointCommander', o.id)}
                                            disabled={currentCityProfile.commander?.id === o.id}
                                            className={`px-3 py-1 rounded text-sm font-bold transition ${currentCityProfile.commander?.id === o.id ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-red-800 hover:bg-red-700 text-white'}`}
                                        >
                                            任主将
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <h2 className="text-xl font-bold text-amber-500 mb-4 flex items-center border-b border-amber-900/50 pb-2">
                        <Coins className="w-6 h-6 mr-2"/> 赏赐部下
                    </h2>
                    <p className="text-xs text-slate-400 mb-4">忠诚会影响武将实际贡献。60 以下开始明显降效，40 以下可能侵吞军资，30 以下有概率直接叛逃。</p>
                    <p className="text-xs text-slate-500 mb-4">当前操作城为【{cities[activeCityId]?.name}】，可将武将调往此地驻守。</p>
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
                                        <div className="mt-1 text-xs text-slate-400">
                                            状态：{getLoyaltyStageLabel(o.loyalty)} | 当前贡献效率：{Math.round(getOfficerContributionMultiplier(o.loyalty) * 100)}%
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            定位：{o.roleProfile} | 特技：{getOfficerSpecialty(o)?.name ?? '无'}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            与主公关系：{getOfficerRelationLabel(getOfficerRelationScore(playerRuler, o))}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            驻守：{cities[o.cityId]?.name ?? '未配置'}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => personnelAction('dispatch', o.id)}
                                            disabled={o.cityId === activeCityId}
                                            className={`px-3 py-1 rounded text-sm font-bold transition ${o.cityId === activeCityId ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                                        >
                                            调往当前城
                                        </button>
                                        <button 
                                            onClick={() => personnelAction('reward', o.id)}
                                            disabled={o.loyalty >= 100}
                                            className={`px-3 py-1 rounded text-sm font-bold transition ${o.loyalty >= 100 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-yellow-700 hover:bg-yellow-600 text-white'}`}
                                        >
                                            赏赐 (1政令)
                                        </button>
                                    </div>
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
                                <div className="mb-3 rounded border border-slate-700 bg-black/20 px-3 py-2 text-xs text-slate-300">
                                    关系状态：{getDiplomacyStateLabel(faction.relation)}
                                </div>
                                <div className="text-sm text-slate-400 mb-1">双方友好度</div>
                                <div className="w-full bg-slate-900 rounded-full h-2.5 mb-2 border border-slate-700">
                                    <div className={`h-2.5 rounded-full ${faction.relation > 70 ? 'bg-green-500' : faction.relation > 30 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${faction.relation}%` }}></div>
                                </div>
                                <div className="text-right text-xs text-slate-500">{faction.relation} / 100</div>
                                <div className="mt-2 text-xs text-slate-400">
                                    {faction.relation >= GAME_BALANCE.diplomacy.tradeThreshold
                                        ? '每月可获得通商收益。'
                                        : faction.relation <= GAME_BALANCE.diplomacy.hostileThreshold
                                            ? '每月可能触发边境施压，压低我方城池士气。'
                                            : '当前暂无额外外交结算效果。'}
                                </div>
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
    if (gameResult === 'defeat') {
        return (
            <div className="min-h-screen bg-slate-950 px-6 py-16 text-amber-50" style={{ backgroundImage: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)' }}>
                <div className="mx-auto max-w-3xl rounded-2xl border border-red-900/40 bg-slate-900/80 p-8 shadow-2xl">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-widest text-red-400">基业覆灭</h1>
                        <p className="mt-4 text-slate-300">公元 {date.year} 年 {date.month} 月，我方城池尽失，天下霸业暂告终结。</p>
                    </div>
                    <div className="mt-6 rounded-xl border border-amber-900/20 bg-black/30 p-4 text-sm text-slate-300">
                        <div className="mb-2 font-bold text-amber-300">终局摘要</div>
                        <div>剩余金钱：{resources.gold}</div>
                        <div>剩余粮草：{resources.food}</div>
                        <div>剩余名望：{resources.reputation}</div>
                    </div>
                    <div className="mt-6 rounded-xl border border-amber-900/20 bg-black/30 p-4">
                        <div className="mb-3 font-bold tracking-widest text-amber-400">最后军情</div>
                        {renderLog('max-h-80 overflow-y-auto font-mono text-sm')}
                    </div>
                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="rounded-full bg-red-800 px-6 py-3 font-bold text-white transition hover:bg-red-700"
                        >
                            重新起兵
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans select-none" style={{ backgroundImage: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)' }}>
            {renderHeader()}
            
            <div className="flex flex-1 overflow-hidden lg:px-6 lg:py-6">
                <div className="flex flex-1 overflow-hidden lg:mx-auto lg:max-w-7xl lg:gap-6">
                    {renderNav()}
                    
                    <main className="flex-1 flex flex-col relative overflow-y-auto lg:rounded-2xl lg:border lg:border-amber-900/30 lg:bg-slate-900/60 lg:shadow-2xl lg:backdrop-blur-sm">
                        {/* View Switcher */}
                        <div className="flex-1 pb-4 lg:pb-6">
                            {activeTab === 'HOME' && renderHome()}
                            {activeTab === 'COUNCIL' && renderCouncil()}
                            {activeTab === 'ARMY' && renderArmy()}
                            {activeTab === 'TOWN' && renderTown()}
                            {activeTab === 'PERSONNEL' && renderPersonnel()}
                            {activeTab === 'DIPLOMACY' && renderDiplomacy()}
                        </div>
                    </main>

                    {renderDesktopSidebar()}
                </div>
            </div>

            {/* Bottom Log */}
            <div className="lg:hidden">
                {renderLog()}
            </div>
        </div>
    );
}