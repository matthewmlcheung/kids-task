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
        <div
          key={p.id}
          className="confetti-piece rounded-sm"
          style={{
            left: p.left,
            animationDelay: p.animationDelay,
            backgroundColor: p.backgroundColor,
          }}
        />
      ))}
    </div>
  );
};

// Helper function to find the most recent Monday
const getStartOfWeek = () => {
  const d = new Date();
  const day = d.getDay();
  // If it's Sunday (0), go back 6 days to Monday. Otherwise, go back (day - 1) days.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toDateString();
};

const defaultTasks = [
  { id: 1, title: "Superkids", icon: "🦸‍♀️", completed: false, category: "daily" },
  { id: 2, title: "Baby Yeung", icon: "👶", completed: false, category: "daily" },
  { id: 3, title: "Brainac", icon: "🧠", completed: false, category: "daily" },
  { id: 4, title: "Good Hope", icon: "🏫", completed: false, category: "daily" },
  { id: 5, title: "Violin", icon: "🎻", completed: false, category: "daily" },
  { id: 6, title: "Read 2 Books", icon: "📚", completed: false, category: "weekly" },
  { id: 7, title: "Tidy Up Room", icon: "🧸", completed: false, category: "weekly" },
];

const defaultRewards = [
  { id: 1, title: "30 mins iPad time", cost: 10, icon: "📱" },
  { id: 2, title: "Pick Friday Dinner", cost: 20, icon: "🍕" },
  { id: 3, title: "New Small Toy", cost: 50, icon: "🎁" },
];

const QUICK_EMOJIS = [
  "🦸‍♀️", "👶", "🧠", "🏫", "🎻", "📚", "🧸", "🎨", "⚽", "🎹", "🧹", "🍎", "⭐", "🚀", 
  "🎾", "🏀", "🏊", "🏮", "🐉", "🔬", "🧪", "📖", "📝", "💯", "📱", "🍕", "🎁", "🎮", "🍦"
];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [rewardHistory, setRewardHistory] = useState([]);
  const [stars, setStars] = useState(0);
  const [lastWeeklyReset, setLastWeeklyReset] = useState('');
  
  const [activeTab, setActiveTab] = useState('daily'); 
  const [viewMode, setViewMode] = useState('kid');
  const [parentTab, setParentTab] = useState('quests');
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

  useEffect(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => {
        const today = new Date().toDateString();
        const currentWeekStart = getStartOfWeek();
        
        let parsedTasks = data.tasks && data.tasks.length > 0 ? data.tasks : defaultTasks;
        let parsedRewards = data.rewards && data.rewards.length > 0 ? data.rewards : defaultRewards;
        let parsedHistory = data.rewardHistory || [];
        let parsedStars = data.stars || 0;
        let lastLogin = data.lastLogin || today;
        let parsedWeeklyReset = data.lastWeeklyReset || currentWeekStart;

        // Reset Daily tasks if it's a new day
        if (lastLogin !== today) {
          parsedTasks = parsedTasks.map(t => 
            t.category === 'daily' ? { ...t, completed: false } : t
          );
        }

        // Reset Weekly tasks if it's a new Monday!
        if (parsedWeeklyReset !== currentWeekStart) {
          parsedTasks = parsedTasks.map(t => 
            t.category === 'weekly' ? { ...t, completed: false } : t
          );
          parsedWeeklyReset = currentWeekStart;
        }
        
        setTasks(parsedTasks);
        setRewards(parsedRewards);
        setRewardHistory(parsedHistory);
        setStars(parsedStars);
        setLastWeeklyReset(parsedWeeklyReset);
        setIsLoaded(true);
      })
      .catch(() => {
        const today = new Date().toDateString();
        const currentWeekStart = getStartOfWeek();

        const savedTasks = localStorage.getItem('superStarTasks');
        const savedRewards = localStorage.getItem('superStarRewards');
        const savedHistory = localStorage.getItem('superStarHistory');
        const savedStars = localStorage.getItem('superStarPoints');
        const lastLogin = localStorage.getItem('superStarLastLogin');
        const savedWeeklyReset = localStorage.getItem('superStarWeeklyReset');
        
        let parsedTasks = savedTasks ? JSON.parse(savedTasks) : defaultTasks;
        let parsedRewards = savedRewards ? JSON.parse(savedRewards) : defaultRewards;
        let parsedHistory = savedHistory ? JSON.parse(savedHistory) : [];
        let parsedWeeklyReset = savedWeeklyReset || currentWeekStart;
        
        if (lastLogin !== today) {
          parsedTasks = parsedTasks.map(t => t.category === 'daily' ? { ...t, completed: false } : t);
        }
        if (parsedWeeklyReset !== currentWeekStart) {
          parsedTasks = parsedTasks.map(t => t.category === 'weekly' ? { ...t, completed: false } : t);
          parsedWeeklyReset = currentWeekStart;
        }

        setTasks(parsedTasks);
        setRewards(parsedRewards);
        setRewardHistory(parsedHistory);
        setStars(savedStars ? parseInt(savedStars, 10) : 0);
        setLastWeeklyReset(parsedWeeklyReset);
        setIsLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const today = new Date().toDateString();
      localStorage.setItem('superStarTasks', JSON.stringify(tasks));
      localStorage.setItem('superStarRewards', JSON.stringify(rewards));
      localStorage.setItem('superStarHistory', JSON.stringify(rewardHistory));
      localStorage.setItem('superStarPoints', stars.toString());
      localStorage.setItem('superStarLastLogin', today);
      localStorage.setItem('superStarWeeklyReset', lastWeeklyReset);
      
      fetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ tasks, rewards, rewardHistory, stars, lastLogin: today, lastWeeklyReset })
      }).catch(err => console.error("Offline: Saved locally"));
    }
  }, [tasks, rewards, rewardHistory, stars, lastWeeklyReset, isLoaded]);

  const toggleTask = (id) => {
    setTasks(prevTasks => {
      return prevTasks.map(task => {
        if (task.id === id) {
          const isNowCompleted = !task.completed;
          if (isNowCompleted) {
            setStars(s => s + 1);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2500);
          } else {
            setStars(s => Math.max(0, s - 1));
          }
          return { ...task, completed: isNowCompleted };
        }
        return task;
      });
    });
  };

  const handleRedeem = (reward) => {
    if (stars >= reward.cost) {
      setStars(s => s - reward.cost);
      
      const newRecord = {
        id: Date.now(),
        title: reward.title,
        icon: reward.icon,
        cost: reward.cost,
        date: new Date().toLocaleString(),
        fulfilled: false
      };
      setRewardHistory([newRecord, ...rewardHistory]);

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

  const closePinModal = () => {
    setShowPinModal(false);
    setPinInput('');
    setPinError(false);
  };

  const handleSaveTask = () => {
    if (!editingTask.title.trim()) return;
    if (editId) {
      setTasks(tasks.map(t => t.id === editId ? { ...t, ...editingTask } : t));
    } else {
      setTasks([...tasks, { id: Date.now(), ...editingTask, completed: false }]);
    }
    setEditingTask({ title: '', icon: '⭐', category: 'daily' });
    setEditId(null);
  };

  const handleSaveReward = () => {
    if (!editingReward.title.trim()) return;
    if (editId) {
      setRewards(rewards.map(r => r.id === editId ? { ...r, ...editingReward } : r));
    } else {
      setRewards([...rewards, { id: Date.now(), ...editingReward }]);
    }
    setEditingReward({ title: '', icon: '🎁', cost: 10 });
    setEditId(null);
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    if (editId === id) setEditId(null);
  };

  const handleDeleteReward = (id) => {
    setRewards(rewards.filter(r => r.id !== id));
    if (editId === id) setEditId(null);
  };

  const toggleFulfillHistory = (id) => {
    setRewardHistory(rewardHistory.map(h => h.id === id ? { ...h, fulfilled: !h.fulfilled } : h));
  };

  const handleDeleteHistory = (id) => {
    if(window.confirm("Are you sure you want to permanently delete this record?")) {
      setRewardHistory(rewardHistory.filter(h => h.id !== id));
    }
  };

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    let _tasks = [...tasks];
    const draggedItemContent = _tasks.splice(dragItem.current, 1)[0];
    _tasks.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setTasks(_tasks);
  };

  const renderParentMode = () => (
    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200 mb-8">
      <div className="bg-gray-800 p-6 text-white relative">
        <button 
          onClick={() => setViewMode('kid')}
          className="absolute top-4 left-4 p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-center mt-2">Parent Dashboard</h1>
        
        {/* NEW: Parent Star Banker / Modifier */}
        <div className="bg-gray-700 rounded-xl p-4 mt-4 flex items-center justify-between border border-gray-600">
          <div className="flex items-center gap-2 text-yellow-400 font-bold text-lg">
            <Star className="fill-current" size={24} />
            {stars} Stars
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStars(s => Math.max(0, s - 10))} className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg font-bold text-sm transition-colors">- 10</button>
            <button onClick={() => setStars(s => s + 10)} className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg font-bold text-sm transition-colors">+ 10</button>
            <button onClick={() => setStars(s => s + 50)} className="bg-gray-500 hover:bg-gray-400 text-white px-3 py-2 rounded-lg font-bold text-sm transition-colors shadow">+ 50</button>
          </div>
        </div>

        <div className="flex bg-gray-700 p-1 rounded-xl mt-4 text-sm">
          <button 
            onClick={() => { setParentTab('quests'); setEditId(null); }} 
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${parentTab === 'quests' ? 'bg-blue-500 text-white shadow' : 'text-gray-300 hover:text-white'}`}
          >
            Quests
          </button>
          <button 
            onClick={() => { setParentTab('rewards'); setEditId(null); }} 
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${parentTab === 'rewards' ? 'bg-purple-500 text-white shadow' : 'text-gray-300 hover:text-white'}`}
          >
            Store
          </button>
          <button 
            onClick={() => { setParentTab('history'); setEditId(null); }} 
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${parentTab === 'history' ? 'bg-green-500 text-white shadow' : 'text-gray-300 hover:text-white'}`}
          >
            History
          </button>
        </div>
      </div>

      {parentTab !== 'history' && (
        <div className="p-6 bg-gray-50 border-b">
          <h2 className="font-bold text-gray-700 mb-4">
            {editId ? `Edit ${parentTab === 'quests' ? 'Quest' : 'Reward'}` : `Add New ${parentTab === 'quests' ? 'Quest' : 'Reward'}`}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{parentTab === 'quests' ? 'Quest Title' : 'Reward Title'}</label>
              <input 
                type="text" 
                value={parentTab === 'quests' ? editingTask.title : editingReward.title}
                onChange={(e) => parentTab === 'quests' 
                  ? setEditingTask({...editingTask, title: e.target.value})
                  : setEditingReward({...editingReward, title: e.target.value})}
                placeholder={parentTab === 'quests' ? "e.g. Piano Practice" : "e.g. 30 mins iPad"}
                className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">Emoji Icon</label>
                <input 
                  type="text" 
                  maxLength="2"
                  value={parentTab === 'quests' ? editingTask.icon : editingReward.icon}
                  onChange={(e) => parentTab === 'quests'
                    ? setEditingTask({...editingTask, icon: e.target.value})
                    : setEditingReward({...editingReward, icon: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-300 text-center text-2xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              
              {parentTab === 'quests' ? (
                <div className="flex-[2]">
                  <label className="block text-sm text-gray-600 mb-1">Frequency</label>
                  <select 
                    value={editingTask.category}
                    onChange={(e) => setEditingTask({...editingTask, category: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              ) : (
                <div className="flex-[2]">
                  <label className="block text-sm text-gray-600 mb-1">Star Cost</label>
                  <input 
                    type="number"
                    min="1"
                    value={editingReward.cost}
                    onChange={(e) => setEditingReward({...editingReward, cost: parseInt(e.target.value) || 0})}
                    className="w-full p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              )}
            </div>

            <div>
               <label className="block text-sm text-gray-600 mb-2">Quick Emojis</label>
               <div className="flex flex-wrap gap-2">
                  {QUICK_EMOJIS.map(emoji => (
                    <button 
                      key={emoji}
                      onClick={() => parentTab === 'quests' 
                        ? setEditingTask({...editingTask, icon: emoji}) 
                        : setEditingReward({...editingReward, icon: emoji})}
                      className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-xl"
                    >
                      {emoji}
                    </button>
                  ))}
               </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={parentTab === 'quests' ? handleSaveTask : handleSaveReward}
                className={`flex-1 text-white font-bold py-3 rounded-xl shadow flex justify-center items-center gap-2 ${parentTab === 'quests' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600'}`}
              >
                {editId ? <CheckCircle2 size={20}/> : <Plus size={20}/>}
                {editId ? 'Save Changes' : `Add ${parentTab === 'quests' ? 'Quest' : 'Reward'}`}
              </button>
              {editId && (
                <button 
                  onClick={() => { setEditId(null); setEditingTask({ title: '', icon: '⭐', category: 'daily' }); setEditingReward({ title: '', icon: '🎁', cost: 10 }); }}
                  className="px-4 bg-gray-300 text-gray-700 font-bold py-3 rounded-xl shadow hover:bg-gray-400"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {parentTab === 'history' ? (
          <>
            <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-2 px-2 flex justify-between items-center">
              <span>Redemption Log</span>
            </h3>
            {rewardHistory.length === 0 ? (
              <div className="text-center p-8 text-gray-400 font-bold">No rewards claimed yet.</div>
            ) : (
              rewardHistory.map((record) => (
                <div key={record.id} className={`flex items-center justify-between p-4 border rounded-2xl shadow-sm transition-all ${record.fulfilled ? 'bg-gray-100 opacity-75 border-gray-200' : 'bg-white border-green-100'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{record.icon}</span>
                    <div>
                      <p className={`font-bold transition-all ${record.fulfilled ? 'text-gray-500 line-through decoration-gray-400' : 'text-gray-800'}`}>{record.title}</p>
                      <p className="text-xs text-gray-400 font-semibold">{record.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => toggleFulfillHistory(record.id)} 
                      className={`p-2 rounded-lg flex flex-col items-center transition-colors ${record.fulfilled ? 'text-gray-500 hover:bg-gray-200' : 'text-green-500 hover:bg-green-50'}`}
                    >
                      {record.fulfilled ? <Undo size={20} /> : <CheckCircle2 size={20} />}
                      <span className="text-[10px] font-bold mt-1">{record.fulfilled ? 'Undo' : 'Fulfill'}</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteHistory(record.id)} 
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg flex flex-col items-center transition-colors"
                    >
                      <Trash2 size={20} />
                      <span className="text-[10px] font-bold mt-1">Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        ) : parentTab === 'quests' ? (
          <>
            <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-2 px-2">Current Quests (Drag to Reorder)</h3>
            {tasks.map((task, index) => (
              <div 
                key={task.id} 
                draggable
                onDragStart={() => (dragItem.current = index)}
                onDragEnter={() => (dragOverItem.current = index)}
                onDragEnd={handleSort}
                onDragOver={(e) => e.preventDefault()}
                className="flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm cursor-grab active:cursor-grabbing hover:border-gray-300"
              >
                <div className="flex items-center gap-3">
                  <GripVertical size={20} className="text-gray-300" />
                  <span className="text-2xl">{task.icon}</span>
                  <div>
                    <p className="font-bold text-gray-700">{task.title}</p>
                    <p className="text-xs font-semibold text-gray-400 uppercase">{task.category}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingTask(task); setEditId(task.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                  <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-2 px-2">Current Rewards</h3>
            {rewards.map((reward) => (
              <div key={reward.id} className="flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm hover:border-gray-300">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{reward.icon}</span>
                  <div>
                    <p className="font-bold text-gray-700">{reward.title}</p>
                    <p className="text-sm font-bold text-purple-500 flex items-center gap-1"><Star size={14} className="fill-current"/> {reward.cost} Stars</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingReward(reward); setEditId(reward.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg"><Edit2 size={18} /></button>
                  <button onClick={() => handleDeleteReward(reward.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );

  if (!isLoaded) return null;

  if (viewMode === 'parent') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 font-sans">
        <GlobalStyles />
        {renderParentMode()}
      </div>
    );
  }

  const visibleTasks = tasks.filter(t => t.category === activeTab);
  const completedVisible = visibleTasks.filter(t => t.completed).length;
  const progressPercent = visibleTasks.length === 0 ? 0 : Math.round((completedVisible / visibleTasks.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-purple-100 to-pink-100 p-4 font-sans text-gray-800 relative pb-10">
      <GlobalStyles />
      {showConfetti && <Confetti />}

      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-pop">
            <button onClick={closePinModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
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

      <div className="max-w-md mx-auto bg-white/60 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border-4 border-white relative">
        <button onClick={() => setShowPinModal(true)} className="absolute top-4 right-4 z-20 p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md transition-colors text-white"><Settings size={20} /></button>

        <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-6 text-white text-center rounded-b-3xl shadow-md relative">
          <Sparkles className="absolute top-4 left-4 w-8 h-8 opacity-50 animate-pulse" />
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 drop-shadow-md pr-8">My Super Quests!</h1>
          <div className="inline-flex items-center bg-white/20 px-6 py-2 rounded-full backdrop-blur-sm border border-white/40 shadow-inner">
            <Trophy className="w-6 h-6 text-yellow-300 mr-2 animate-float" />
            <span className="text-2xl font-bold">{stars} Stars</span>
          </div>
        </div>

        <div className="flex p-4 gap-2">
          <button onClick={() => setActiveTab('daily')} className={`flex-1 py-3 px-2 rounded-2xl font-bold text-sm flex flex-col justify-center items-center gap-1 transition-all duration-300 ${activeTab === 'daily' ? 'bg-blue-400 text-white shadow-lg scale-105' : 'bg-white text-gray-500 hover:bg-blue-50'}`}>
            <Star className={activeTab === 'daily' ? 'fill-current' : ''} size={20} /> Today
          </button>
          <button onClick={() => setActiveTab('weekly')} className={`flex-1 py-3 px-2 rounded-2xl font-bold text-sm flex flex-col justify-center items-center gap-1 transition-all duration-300 ${activeTab === 'weekly' ? 'bg-green-400 text-white shadow-lg scale-105' : 'bg-white text-gray-500 hover:bg-green-50'}`}>
            <Calendar className={activeTab === 'weekly' ? 'fill-current' : ''} size={20} /> Week
          </button>
          <button onClick={() => setActiveTab('store')} className={`flex-1 py-3 px-2 rounded-2xl font-bold text-sm flex flex-col justify-center items-center gap-1 transition-all duration-300 ${activeTab === 'store' ? 'bg-purple-400 text-white shadow-lg scale-105' : 'bg-white text-gray-500 hover:bg-purple-50'}`}>
            <Gift className={activeTab === 'store' ? 'fill-current' : ''} size={20} /> Rewards
          </button>
        </div>

        {activeTab === 'store' ? (
          <div className="p-4 mb-4">
            <h2 className="font-bold text-gray-600 text-center uppercase tracking-wider mb-4">Star Store</h2>
            <div className="space-y-4 mb-8">
              {rewards.length === 0 ? (
                <div className="text-center p-8 text-gray-400 font-bold">No rewards right now.</div>
              ) : (
                rewards.map(reward => {
                  const canAfford = stars >= reward.cost;
                  return (
                    <div key={reward.id} className="flex items-center p-4 bg-white rounded-2xl border-2 border-purple-100 shadow-md">
                      <div className="text-4xl mr-4">{reward.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-700">{reward.title}</h3>
                        <p className="text-purple-500 font-bold flex items-center gap-1"><Star size={14} className="fill-current"/> {reward.cost}</p>
                      </div>
                      <button 
                        onClick={() => handleRedeem(reward)}
                        disabled={!canAfford}
                        className={`px-4 py-2 rounded-xl font-bold transition-all shadow-sm ${canAfford ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        {canAfford ? 'Redeem!' : 'Need Stars'}
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {/* Kid's History View */}
            {rewardHistory.length > 0 && (
              <div className="mt-8 border-t-2 border-purple-100 pt-6">
                <h2 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock size={16} /> My Recent Rewards
                </h2>
                <div className="space-y-3">
                  {rewardHistory.slice(0, 5).map(record => (
                    <div key={record.id} className={`flex items-center p-3 rounded-xl border transition-colors ${record.fulfilled ? 'bg-green-50 border-green-200' : 'bg-white/50 border-purple-100'}`}>
                      <span className="text-2xl mr-3">{record.icon}</span>
                      <div className="flex-1">
                        <p className={`font-bold ${record.fulfilled ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-700'}`}>{record.title}</p>
                        <p className="text-[10px] text-gray-400">{record.date}</p>
                      </div>
                      {record.fulfilled && (
                        <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full border border-green-200 shadow-sm animate-pop">
                          Delivered!
                        </span>
                      )}
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
                <span className="font-bold text-purple-500">{completedVisible} / {visibleTasks.length}</span>
              </div>
              <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner border-2 border-white">
                <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700 ease-out flex items-center justify-end pr-2" style={{ width: `${progressPercent}%` }}>
                  {progressPercent > 20 && <span className="text-xs text-white font-bold animate-pulse">{progressPercent}%</span>}
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4 mb-4">
              {visibleTasks.length === 0 ? (
                <div className="text-center p-8 text-gray-400 font-bold">No quests here! 🎉</div>
              ) : (
                visibleTasks.map(task => (
                  <div key={task.id} onClick={() => toggleTask(task.id)} className={`group cursor-pointer relative overflow-hidden flex items-center p-4 rounded-2xl transition-all duration-300 transform active:scale-95 border-2 ${task.completed ? 'bg-green-100 border-green-300 shadow-sm opacity-80' : 'bg-white border-blue-100 shadow-md hover:-translate-y-1'}`}>
                    <div className={`absolute left-0 top-0 bottom-0 bg-green-200/40 transition-all duration-500 ease-in-out ${task.completed ? 'w-full' : 'w-0'}`} />
                    <div className={`relative z-10 text-4xl mr-4 transition-transform duration-300 ${task.completed ? 'scale-110' : 'group-hover:scale-110'}`}>{task.icon}</div>
                    <div className="relative z-10 flex-1">
                      <h3 className={`text-xl font-bold transition-all duration-300 ${task.completed ? 'text-green-700 line-through decoration-green-400 decoration-4' : 'text-gray-700'}`}>{task.title}</h3>
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