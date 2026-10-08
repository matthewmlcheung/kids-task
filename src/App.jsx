import React, { useState, useEffect, useRef } from 'react';
import { Star, Trophy, Calendar, Sparkles, CheckCircle2, Circle, Settings, Lock, Edit2, Trash2, Plus, X, ArrowLeft, GripVertical, Gift, Clock, Undo } from 'lucide-react';

const GlobalStyles = () => (
  <style>
    {`
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes pop {
        0% { transform: scale(0.8); opacity: 0; }
        50% { transform: scale(1.1); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes confettiFall {
        0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
        100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
      }
      .animate-float {
        animation: float 3s ease-in-out infinite;
      }
      .animate-pop {
        animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      }
      .confetti-piece {
        position: absolute;
        width: 12px;
        height: 24px;
        top: -20px;
        animation: confettiFall 2.5s ease-in forwards;
      }
    `}
  </style>
);

const Confetti = () => {
  const colors = ['#FFC700', '#FF3D00', '#00E676', '#2979FF', '#E040FB'];
  const pieces = Array.from({ length: 100 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}vw`,
    animationDelay: `${Math.random() * 0.5}s`,
    backgroundColor: colors[Math.floor(Math.random() * colors.length)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div key={p.id} className="confetti-piece rounded-sm" style={{ left: p.left, animationDelay: p.animationDelay, backgroundColor: p.backgroundColor }} />
      ))}
    </div>
  );
};

const getStartOfWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toDateString();
};

// Updated Default Data for Two Kids
const defaultTasks = {
  Colette: [
    { id: 1, title: "Superkids", icon: "🦸‍♀️", completed: false, category: "daily" },
    { id: 2, title: "Violin", icon: "🎻", completed: false, category: "daily" }
  ],
  Kingsley: [
    { id: 3, title: "Superkids", icon: "🦸‍♂️", completed: false, category: "daily" },
    { id: 4, title: "Tidy Up Room", icon: "🧸", completed: false, category: "daily" }
  ]
};

const defaultRewards = {
  shared: [
    { id: 1, title: "15 mins iPad time", cost: 20, icon: "📱" },
    { id: 2, title: "Pick Friday Dinner", cost: 150, icon: "🍕" }
  ],
  Colette: [],
  Kingsley: []
};

const QUICK_EMOJIS = [
  "🦸‍♀️", "🦸‍♂️", "👧", "👦", "🧠", "🏫", "🎻", "📚", "🧸", "🎨", "⚽", "🎹", "🧹", "🍎", "⭐", "🚀", 
  "🎾", "🏀", "🏊", "🏮", "🐉", "🔬", "🧪", "📖", "📝", "💯", "📱", "🍕", "🎁", "🎮", "🍦"
];

export default function App() {
  const [activeKid, setActiveKid] = useState('Colette'); 
  const [tasks, setTasks] = useState(defaultTasks);
  const [rewards, setRewards] = useState(defaultRewards);
  const [rewardHistory, setRewardHistory] = useState({ Colette: [], Kingsley: [] });
  const [stars, setStars] = useState({ Colette: 0, Kingsley: 0 });
  const [lastWeeklyReset, setLastWeeklyReset] = useState('');
  
  const [activeTab, setActiveTab] = useState('daily'); 
  const [viewMode, setViewMode] = useState('kid');
  
  const [parentTab, setParentTab] = useState('quests');
  const [parentTargetKid, setParentTargetKid] = useState('Colette');
  const [parentTargetReward, setParentTargetReward] = useState('shared');

  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [editingTask, setEditingTask] = useState({ title: '', icon: '⭐', category: 'daily' });
  const [editingReward, setEditingReward] = useState({ title: '', icon: '🎁', cost: 10 });
  const [editId, setEditId] = useState(null);

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  // Safe Data Migration Logic
  useEffect(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => loadAndMigrateData(data))
      .catch(() => {
        const savedData = {
          tasks: JSON.parse(localStorage.getItem('superStarTasks') || 'null'),
          rewards: JSON.parse(localStorage.getItem('superStarRewards') || 'null'),
          rewardHistory: JSON.parse(localStorage.getItem('superStarHistory') || 'null'),
          stars: JSON.parse(localStorage.getItem('superStarPoints') || 'null'),
          lastLogin: localStorage.getItem('superStarLastLogin'),
          lastWeeklyReset: localStorage.getItem('superStarWeeklyReset')
        };
        loadAndMigrateData(savedData);
      });
  }, []);

  const loadAndMigrateData = (data) => {
    if (!data) data = {};
    const today = new Date().toDateString();
    const currentWeekStart = getStartOfWeek();
    
    // Convert old flat arrays into object maps safely
    let parsedTasks = data.tasks || defaultTasks;
    if (Array.isArray(parsedTasks) || !parsedTasks.Colette) {
      parsedTasks = { Colette: Array.isArray(parsedTasks) ? parsedTasks : [], Kingsley: [] };
    }

    let parsedRewards = data.rewards || defaultRewards;
    if (Array.isArray(parsedRewards) || !parsedRewards.shared) {
      parsedRewards = { shared: Array.isArray(parsedRewards) ? parsedRewards : [], Colette: [], Kingsley: [] };
    }

    let parsedHistory = data.rewardHistory || { Colette: [], Kingsley: [] };
    if (Array.isArray(parsedHistory) || !parsedHistory.Colette) {
      parsedHistory = { Colette: Array.isArray(parsedHistory) ? parsedHistory : [], Kingsley: [] };
    }

    let parsedStars = data.stars || { Colette: 0, Kingsley: 0 };
    if (typeof parsedStars === 'number') {
      parsedStars = { Colette: parsedStars, Kingsley: 0 };
    }
    if (typeof parsedStars.Colette !== 'number') parsedStars.Colette = 0;
    if (typeof parsedStars.Kingsley !== 'number') parsedStars.Kingsley = 0;

    let lastLogin = data.lastLogin || today;
    let parsedWeeklyReset = data.lastWeeklyReset || currentWeekStart;

    if (lastLogin !== today) {
      ['Colette', 'Kingsley'].forEach(kid => {
        if(parsedTasks[kid]) {
          parsedTasks[kid] = parsedTasks[kid].map(t => t.category === 'daily' ? { ...t, completed: false } : t);
        }
      });
    }

    if (parsedWeeklyReset !== currentWeekStart) {
      ['Colette', 'Kingsley'].forEach(kid => {
        if(parsedTasks[kid]) {
          parsedTasks[kid] = parsedTasks[kid].map(t => t.category === 'weekly' ? { ...t, completed: false } : t);
        }
      });
      parsedWeeklyReset = currentWeekStart;
    }
    
    setTasks(parsedTasks);
    setRewards(parsedRewards);
    setRewardHistory(parsedHistory);
    setStars(parsedStars);
    setLastWeeklyReset(parsedWeeklyReset);
    setIsLoaded(true);
  };

  useEffect(() => {
    if (isLoaded) {
      const today = new Date().toDateString();
      localStorage.setItem('superStarTasks', JSON.stringify(tasks));
      localStorage.setItem('superStarRewards', JSON.stringify(rewards));
      localStorage.setItem('superStarHistory', JSON.stringify(rewardHistory));
      localStorage.setItem('superStarPoints', JSON.stringify(stars));
      localStorage.setItem('superStarLastLogin', today);
      localStorage.setItem('superStarWeeklyReset', lastWeeklyReset);
      
      fetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ tasks, rewards, rewardHistory, stars, lastLogin: today, lastWeeklyReset })
      }).catch(err => console.error("Offline: Saved locally"));
    }
  }, [tasks, rewards, rewardHistory, stars, lastWeeklyReset, isLoaded]);

  const toggleTask = (id) => {
    setTasks(prev => {
      const updated = { ...prev };
      updated[activeKid] = (updated[activeKid] || []).map(task => {
        if (task.id === id) {
          const isNowCompleted = !task.completed;
          if (isNowCompleted) {
            setStars(s => ({ ...s, [activeKid]: (s[activeKid] || 0) + 1 }));
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2500);
          } else {
            setStars(s => ({ ...s, [activeKid]: Math.max(0, (s[activeKid] || 0) - 1) }));
          }
          return { ...task, completed: isNowCompleted };
        }
        return task;
      });
      return updated;
    });
  };

  const handleRedeem = (reward) => {
    if ((stars[activeKid] || 0) >= reward.cost) {
      setStars(s => ({ ...s, [activeKid]: s[activeKid] - reward.cost }));
      
      const newRecord = {
        id: Date.now(),
        title: reward.title,
        icon: reward.icon,
        cost: reward.cost,
        date: new Date().toLocaleString(),
        fulfilled: false
      };
      
      setRewardHistory(prev => ({ ...prev, [activeKid]: [newRecord, ...(prev[activeKid] || [])] }));
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
      alert(`🎉 YAY! You got: ${reward.title}! Check your recent rewards below.`);
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === '1234') {
      setViewMode('parent');
      setShowPinModal(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // Crucial function restored to fix white screen crash!
  const closePinModal = () => {
    setShowPinModal(false);
    setPinInput('');
    setPinError(false);
  };

  const handleSaveTask = () => {
    if (!editingTask.title.trim()) return;
    setTasks(prev => {
      const updated = { ...prev };
      const currentList = updated[parentTargetKid] || [];
      if (editId) {
        updated[parentTargetKid] = currentList.map(t => t.id === editId ? { ...t, ...editingTask } : t);
      } else {
        updated[parentTargetKid] = [...currentList, { id: Date.now(), ...editingTask, completed: false }];
      }
      return updated;
    });
    setEditingTask({ title: '', icon: '⭐', category: 'daily' });
    setEditId(null);
  };

  const handleSaveReward = () => {
    if (!editingReward.title.trim()) return;
    setRewards(prev => {
      const updated = { ...prev };
      const currentList = updated[parentTargetReward] || [];
      if (editId) {
        updated[parentTargetReward] = currentList.map(r => r.id === editId ? { ...r, ...editingReward } : r);
      } else {
        updated[parentTargetReward] = [...currentList, { id: Date.now(), ...editingReward }];
      }
      return updated;
    });
    setEditingReward({ title: '', icon: '🎁', cost: 10 });
    setEditId(null);
  };

  const handleDeleteTask = (id) => {
    setTasks(prev => ({ ...prev, [parentTargetKid]: (prev[parentTargetKid] || []).filter(t => t.id !== id) }));
    if (editId === id) setEditId(null);
  };

  const handleDeleteReward = (id) => {
    setRewards(prev => ({ ...prev, [parentTargetReward]: (prev[parentTargetReward] || []).filter(r => r.id !== id) }));
    if (editId === id) setEditId(null);
  };

  const toggleFulfillHistory = (id) => {
    setRewardHistory(prev => ({
      ...prev,
      [parentTargetKid]: (prev[parentTargetKid] || []).map(h => h.id === id ? { ...h, fulfilled: !h.fulfilled } : h)
    }));
  };

  const handleDeleteHistory = (id) => {
    if(window.confirm("Are you sure you want to permanently delete this record?")) {
      setRewardHistory(prev => ({
        ...prev,
        [parentTargetKid]: (prev[parentTargetKid] || []).filter(h => h.id !== id)
      }));
    }
  };

  const handleTaskSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    setTasks(prev => {
      const updated = { ...prev };
      const list = [...(updated[parentTargetKid] || [])];
      const draggedItem = list.splice(dragItem.current, 1)[0];
      list.splice(dragOverItem.current, 0, draggedItem);
      updated[parentTargetKid] = list;
      return updated;
    });
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleRewardSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    setRewards(prev => {
      const updated = { ...prev };
      const list = [...(updated[parentTargetReward] || [])];
      const draggedItem = list.splice(dragItem.current, 1)[0];
      list.splice(dragOverItem.current, 0, draggedItem);
      updated[parentTargetReward] = list;
      return updated;
    });
    dragItem.current = null;
    dragOverItem.current = null;
  };

  if (!isLoaded) return null;

  // Dynamic Theme Colors
  const outerBg = activeKid === 'Colette' ? 'from-pink-100 via-purple-100 to-pink-200' : 'from-blue-100 via-cyan-100 to-green-100';
  const headerBg = activeKid === 'Colette' ? 'from-pink-400 to-purple-400' : 'from-blue-400 to-emerald-400';
  const highlightColor = activeKid === 'Colette' ? 'text-pink-500' : 'text-blue-500';

  if (viewMode === 'parent') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 font-sans pb-12">
        <GlobalStyles />
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200 mb-8">
          <div className="bg-gray-800 p-6 text-white relative">
            <button type="button" onClick={() => setViewMode('kid')} className="absolute top-4 left-4 p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-center mt-2">Parent Dashboard</h1>
            
            <div className="bg-gray-700 rounded-xl p-3 mt-4 space-y-2 border border-gray-600">
              {['Colette', 'Kingsley'].map(kid => (
                <div key={kid} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-yellow-400 font-bold">
                    <Star className="fill-current" size={16} />
                    {kid}: {stars[kid] || 0}
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setStars(s => ({...s, [kid]: Math.max(0, (s[kid] || 0) - 10)}))} className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded font-bold text-xs">-10</button>
                    <button type="button" onClick={() => setStars(s => ({...s, [kid]: (s[kid] || 0) + 10}))} className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded font-bold text-xs">+10</button>
                    <button type="button" onClick={() => setStars(s => ({...s, [kid]: (s[kid] || 0) + 50}))} className="bg-gray-500 hover:bg-gray-400 text-white px-2 py-1 rounded font-bold text-xs">+50</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex bg-gray-900 p-1 rounded-xl mt-4 text-sm shadow-inner">
              <button type="button" onClick={() => { setParentTab('quests'); setEditId(null); }} className={`flex-1 py-2 rounded-lg font-bold transition-all ${parentTab === 'quests' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}>Quests</button>
              <button type="button" onClick={() => { setParentTab('rewards'); setEditId(null); }} className={`flex-1 py-2 rounded-lg font-bold transition-all ${parentTab === 'rewards' ? 'bg-purple-500 text-white' : 'text-gray-400'}`}>Store</button>
              <button type="button" onClick={() => { setParentTab('history'); setEditId(null); }} className={`flex-1 py-2 rounded-lg font-bold transition-all ${parentTab === 'history' ? 'bg-green-500 text-white' : 'text-gray-400'}`}>History</button>
            </div>

            <div className="flex justify-center mt-3 gap-2">
              {parentTab === 'rewards' && (
                <button type="button" onClick={() => { setParentTargetReward('shared'); setEditId(null); }} className={`px-4 py-1 text-xs rounded-full font-bold border ${parentTargetReward === 'shared' ? 'bg-white text-gray-800' : 'border-gray-500 text-gray-300'}`}>Shared Store</button>
              )}
              <button type="button" onClick={() => { parentTab === 'rewards' ? setParentTargetReward('Colette') : setParentTargetKid('Colette'); setEditId(null); }} className={`px-4 py-1 text-xs rounded-full font-bold border ${(parentTab === 'rewards' ? parentTargetReward : parentTargetKid) === 'Colette' ? 'bg-pink-400 text-white border-pink-400' : 'border-gray-500 text-gray-300'}`}>👧 Colette</button>
              <button type="button" onClick={() => { parentTab === 'rewards' ? setParentTargetReward('Kingsley') : setParentTargetKid('Kingsley'); setEditId(null); }} className={`px-4 py-1 text-xs rounded-full font-bold border ${(parentTab === 'rewards' ? parentTargetReward : parentTargetKid) === 'Kingsley' ? 'bg-blue-400 text-white border-blue-400' : 'border-gray-500 text-gray-300'}`}>👦 Kingsley</button>
            </div>
          </div>

          {parentTab !== 'history' && (
            <div className="p-6 bg-gray-50 border-b">
              <h2 className="font-bold text-gray-700 mb-4">{editId ? `Edit ${parentTab === 'quests' ? 'Quest' : 'Reward'}` : `Add New ${parentTab === 'quests' ? 'Quest' : 'Reward'}`}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Title</label>
                  <input type="text" value={parentTab === 'quests' ? editingTask.title : editingReward.title} onChange={(e) => parentTab === 'quests' ? setEditingTask({...editingTask, title: e.target.value}) : setEditingReward({...editingReward, title: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">Emoji</label>
                    <input type="text" maxLength="2" value={parentTab === 'quests' ? editingTask.icon : editingReward.icon} onChange={(e) => parentTab === 'quests' ? setEditingTask({...editingTask, icon: e.target.value}) : setEditingReward({...editingReward, icon: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 text-center text-xl" />
                  </div>
                  {parentTab === 'quests' ? (
                    <div className="flex-[2]">
                      <label className="block text-sm text-gray-600 mb-1">Frequency</label>
                      <select value={editingTask.category} onChange={(e) => setEditingTask({...editingTask, category: e.target.value})} className="w-full p-3 rounded-xl border border-gray-300 bg-white">
                        <option value="daily">Daily</option><option value="weekly">Weekly</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex-[2]">
                      <label className="block text-sm text-gray-600 mb-1">Cost</label>
                      <input type="number" min="1" value={editingReward.cost} onChange={(e) => setEditingReward({...editingReward, cost: parseInt(e.target.value) || 0})} className="w-full p-3 rounded-xl border border-gray-300 bg-white" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Quick Emojis</label>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_EMOJIS.map(emoji => (
                      <button type="button" key={emoji} onClick={() => parentTab === 'quests' ? setEditingTask({...editingTask, icon: emoji}) : setEditingReward({...editingReward, icon: emoji})} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-xl">{emoji}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={parentTab === 'quests' ? handleSaveTask : handleSaveReward} className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-xl shadow">{editId ? 'Save Changes' : 'Add Item'}</button>
                  {editId && <button type="button" onClick={() => { setEditId(null); setEditingTask({ title: '', icon: '⭐', category: 'daily' }); setEditingReward({ title: '', icon: '🎁', cost: 10 }); }} className="px-4 bg-gray-300 text-gray-700 font-bold py-3 rounded-xl">Cancel</button>}
                </div>
              </div>
            </div>
          )}

          <div className="p-4 space-y-3">
            {parentTab === 'history' ? (
              <>
                <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-2 px-2">{parentTargetKid}'s Log</h3>
                {(rewardHistory[parentTargetKid] || []).map((record) => (
                  <div key={record.id} className={`flex items-center justify-between p-4 border rounded-2xl shadow-sm ${record.fulfilled ? 'bg-gray-100 opacity-75 border-gray-200' : 'bg-white border-green-100'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{record.icon}</span>
                      <div>
                        <p className={`font-bold ${record.fulfilled ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{record.title}</p>
                        <p className="text-xs text-gray-400">{record.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => toggleFulfillHistory(record.id)} className={`p-2 rounded-lg flex flex-col items-center ${record.fulfilled ? 'text-gray-500' : 'text-green-500'}`}>
                        {record.fulfilled ? <Undo size={20} /> : <CheckCircle2 size={20} />}<span className="text-[10px] font-bold mt-1">{record.fulfilled ? 'Undo' : 'Fulfill'}</span>
                      </button>
                      <button type="button" onClick={() => handleDeleteHistory(record.id)} className="p-2 text-red-400 rounded-lg flex flex-col items-center"><Trash2 size={20} /><span className="text-[10px] font-bold mt-1">Delete</span></button>
                    </div>
                  </div>
                ))}
              </>
            ) : parentTab === 'quests' ? (
              <>
                <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-2 px-2">{parentTargetKid}'s Quests (Drag)</h3>
                {(tasks[parentTargetKid] || []).map((task, index) => (
                  <div key={task.id} draggable onDragStart={() => (dragItem.current = index)} onDragEnter={() => (dragOverItem.current = index)} onDragEnd={handleTaskSort} onDragOver={(e) => e.preventDefault()} className="flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm cursor-grab active:cursor-grabbing">
                    <div className="flex items-center gap-3">
                      <GripVertical size={20} className="text-gray-300" /><span className="text-2xl">{task.icon}</span>
                      <div><p className="font-bold text-gray-700">{task.title}</p><p className="text-xs font-semibold text-gray-400 uppercase">{task.category}</p></div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setEditingTask(task); setEditId(task.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                      <button type="button" onClick={() => handleDeleteTask(task.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-2 px-2">{parentTargetReward} Rewards (Drag)</h3>
                {(rewards[parentTargetReward] || []).map((reward, index) => (
                  <div key={reward.id} draggable onDragStart={() => (dragItem.current = index)} onDragEnter={() => (dragOverItem.current = index)} onDragEnd={handleRewardSort} onDragOver={(e) => e.preventDefault()} className="flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm cursor-grab active:cursor-grabbing">
                    <div className="flex items-center gap-3">
                      <GripVertical size={20} className="text-gray-300" /><span className="text-2xl">{reward.icon}</span>
                      <div><p className="font-bold text-gray-700">{reward.title}</p><p className="text-sm font-bold text-purple-500 flex items-center gap-1"><Star size={14} className="fill-current"/> {reward.cost} Stars</p></div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setEditingReward(reward); setEditId(reward.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg"><Edit2 size={18} /></button>
                      <button type="button" onClick={() => handleDeleteReward(reward.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentKidTasks = (tasks[activeKid] || []).filter(t => t.category === activeTab);
  const currentKidRewards = [...(rewards.shared || []), ...(rewards[activeKid] || [])];
  const completedVisible = currentKidTasks.filter(t => t.completed).length;
  const progressPercent = currentKidTasks.length === 0 ? 0 : Math.round((completedVisible / currentKidTasks.length) * 100);

  return (
    <div className={`min-h-screen bg-gradient-to-b ${outerBg} p-4 font-sans text-gray-800 relative pb-12 transition-colors duration-500`}>
      <GlobalStyles />
      {showConfetti && <Confetti />}

      <div className="flex justify-center gap-4 mb-6 z-10 relative">
        <button type="button" onClick={() => setActiveKid('Colette')} className={`px-6 py-2 rounded-full font-bold shadow-lg transition-all duration-300 ${activeKid === 'Colette' ? 'bg-pink-500 text-white scale-110' : 'bg-white/60 text-gray-500 hover:bg-white'}`}>👧 Colette</button>
        <button type="button" onClick={() => setActiveKid('Kingsley')} className={`px-6 py-2 rounded-full font-bold shadow-lg transition-all duration-300 ${activeKid === 'Kingsley' ? 'bg-blue-500 text-white scale-110' : 'bg-white/60 text-gray-500 hover:bg-white'}`}>👦 Kingsley</button>
      </div>

      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-pop">
            <button type="button" onClick={closePinModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500"><Lock size={32} /></div>
              <h2 className="text-xl font-bold text-gray-800">Parent Mode</h2>
            </div>
            <form onSubmit={handlePinSubmit}>
              <input type="password" pattern="[0-9]*" inputMode="numeric" autoFocus value={pinInput} onChange={(e) => { setPinInput(e.target.value); setPinError(false); }} className={`w-full text-center text-3xl tracking-[0.5em] p-4 rounded-xl border-2 outline-none transition-colors ${pinError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-400'}`} placeholder="****" maxLength="4" />
              <button type="submit" className="w-full mt-6 bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-600 active:scale-95 transition-all">Unlock</button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto bg-white/60 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border-4 border-white relative transition-all duration-500">
        <button type="button" onClick={() => setShowPinModal(true)} className="absolute top-4 right-4 z-20 p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md transition-colors text-white"><Settings size={20} /></button>

        <div className={`bg-gradient-to-r ${headerBg} p-6 text-white text-center rounded-b-3xl shadow-md relative transition-colors duration-500`}>
          <Sparkles className="absolute top-4 left-4 w-8 h-8 opacity-50 animate-pulse" />
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 drop-shadow-md pr-8">My Super Quests!</h1>
          <div className="inline-flex items-center bg-white/20 px-6 py-2 rounded-full backdrop-blur-sm border border-white/40 shadow-inner">
            <Trophy className="w-6 h-6 text-yellow-300 mr-2 animate-float" />
            <span className="text-2xl font-bold">{stars[activeKid] || 0} Stars</span>
          </div>
        </div>

        <div className="flex p-4 gap-2">
          <button type="button" onClick={() => setActiveTab('daily')} className={`flex-1 py-3 px-2 rounded-2xl font-bold text-sm flex flex-col justify-center items-center gap-1 transition-all duration-300 ${activeTab === 'daily' ? 'bg-white text-gray-800 shadow-lg scale-105 border border-gray-100' : 'bg-transparent text-gray-500'}`}>
            <Star className={activeTab === 'daily' ? `${highlightColor} fill-current` : ''} size={20} /> Today
          </button>
          <button type="button" onClick={() => setActiveTab('weekly')} className={`flex-1 py-3 px-2 rounded-2xl font-bold text-sm flex flex-col justify-center items-center gap-1 transition-all duration-300 ${activeTab === 'weekly' ? 'bg-white text-gray-800 shadow-lg scale-105 border border-gray-100' : 'bg-transparent text-gray-500'}`}>
            <Calendar className={activeTab === 'weekly' ? `${highlightColor} fill-current` : ''} size={20} /> Week
          </button>
          <button type="button" onClick={() => setActiveTab('store')} className={`flex-1 py-3 px-2 rounded-2xl font-bold text-sm flex flex-col justify-center items-center gap-1 transition-all duration-300 ${activeTab === 'store' ? 'bg-white text-gray-800 shadow-lg scale-105 border border-gray-100' : 'bg-transparent text-gray-500'}`}>
            <Gift className={activeTab === 'store' ? `${highlightColor} fill-current` : ''} size={20} /> Rewards
          </button>
        </div>

        {activeTab === 'store' ? (
          <div className="p-4 mb-4">
            <h2 className="font-bold text-gray-600 text-center uppercase tracking-wider mb-4">Star Store</h2>
            <div className="space-y-4 mb-8">
              {currentKidRewards.length === 0 ? (
                <div className="text-center p-8 text-gray-400 font-bold">No rewards right now.</div>
              ) : (
                currentKidRewards.map(reward => {
                  const canAfford = (stars[activeKid] || 0) >= reward.cost;
                  return (
                    <div key={reward.id} className="flex items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="text-4xl mr-4">{reward.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-700">{reward.title}</h3>
                        <p className={`${highlightColor} font-bold flex items-center gap-1`}><Star size={14} className="fill-current"/> {reward.cost}</p>
                      </div>
                      <button type="button" onClick={() => handleRedeem(reward)} disabled={!canAfford} className={`px-4 py-2 rounded-xl font-bold transition-all shadow-sm ${canAfford ? `bg-gradient-to-r ${headerBg} text-white hover:scale-105 active:scale-95` : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                        {canAfford ? 'Redeem!' : 'Need Stars'}
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {(rewardHistory[activeKid] || []).length > 0 && (
              <div className="mt-8 border-t-2 border-white pt-6">
                <h2 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-4 flex items-center gap-2"><Clock size={16} /> My Recent Rewards</h2>
                <div className="space-y-3">
                  {(rewardHistory[activeKid] || []).slice(0, 5).map(record => (
                    <div key={record.id} className={`flex items-center p-3 rounded-xl border transition-colors ${record.fulfilled ? 'bg-white border-green-200' : 'bg-white/50 border-white'}`}>
                      <span className="text-2xl mr-3">{record.icon}</span>
                      <div className="flex-1">
                        <p className={`font-bold ${record.fulfilled ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{record.title}</p>
                        <p className="text-[10px] text-gray-400">{record.date}</p>
                      </div>
                      {record.fulfilled && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">Delivered!</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="px-6 py-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-600 text-sm uppercase tracking-wider">Progress</span>
                <span className={`font-bold ${highlightColor}`}>{completedVisible} / {currentKidTasks.length}</span>
              </div>
              <div className="h-6 w-full bg-white/50 rounded-full overflow-hidden shadow-inner border border-white">
                <div className={`h-full bg-gradient-to-r ${headerBg} transition-all duration-700 ease-out flex items-center justify-end pr-2`} style={{ width: `${progressPercent}%` }}>
                  {progressPercent > 20 && <span className="text-xs text-white font-bold animate-pulse">{progressPercent}%</span>}
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4 mb-4">
              {currentKidTasks.length === 0 ? (
                <div className="text-center p-8 text-gray-400 font-bold">No quests here! 🎉</div>
              ) : (
                currentKidTasks.map(task => (
                  <div key={task.id} onClick={() => toggleTask(task.id)} className={`group cursor-pointer relative overflow-hidden flex items-center p-4 rounded-2xl transition-all duration-300 transform active:scale-95 border-2 ${task.completed ? 'bg-white border-green-300 shadow-sm opacity-80' : 'bg-white border-white shadow-md hover:-translate-y-1'}`}>
                    <div className={`absolute left-0 top-0 bottom-0 bg-green-100/50 transition-all duration-500 ease-in-out ${task.completed ? 'w-full' : 'w-0'}`} />
                    <div className={`relative z-10 text-4xl mr-4 transition-transform duration-300 ${task.completed ? 'scale-110' : 'group-hover:scale-110'}`}>{task.icon}</div>
                    <div className="relative z-10 flex-1">
                      <h3 className={`text-xl font-bold transition-all duration-300 ${task.completed ? 'text-gray-400 line-through decoration-gray-300 decoration-2' : 'text-gray-700'}`}>{task.title}</h3>
                    </div>
                    <div className="relative z-10 ml-2">
                      {task.completed ? <CheckCircle2 className="w-10 h-10 text-green-500 fill-green-100 animate-pop" /> : <Circle className="w-10 h-10 text-gray-300 group-hover:text-blue-300 transition-colors duration-300" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}