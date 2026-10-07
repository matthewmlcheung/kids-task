import React, { useState, useEffect, useRef } from 'react';
import { Star, Trophy, Calendar, Sparkles, CheckCircle2, Circle, Settings, Lock, Edit2, Trash2, Plus, X, ArrowLeft, GripVertical } from 'lucide-react';

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
  const pieces = Array.from({ length: 70 }).map((_, i) => ({
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

const defaultTasks = [
  { id: 1, title: "Superkids", icon: "🦸‍♀️", completed: false, category: "daily" },
  { id: 2, title: "Baby Yeung", icon: "👶", completed: false, category: "daily" },
  { id: 3, title: "Brainac", icon: "🧠", completed: false, category: "daily" },
  { id: 4, title: "Good Hope", icon: "🏫", completed: false, category: "daily" },
  { id: 5, title: "Violin", icon: "🎻", completed: false, category: "daily" },
  { id: 6, title: "Read 2 Books", icon: "📚", completed: false, category: "weekly" },
  { id: 7, title: "Tidy Up Room", icon: "🧸", completed: false, category: "weekly" },
];

// Added Tennis, Basketball, Swim, Chinese (Lantern/Dragon), Science, Story, Exam, and more!
const QUICK_EMOJIS = [
  "🦸‍♀️", "👶", "🧠", "🏫", "🎻", "📚", "🧸", "🎨", "⚽", "🎹", "🧹", "🍎", "⭐", "🚀", 
  "🎾", "🏀", "🏊", "🏮", "🐉", "🔬", "🧪", "📖", "📝", "💯"
];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [stars, setStars] = useState(0);
  const [activeTab, setActiveTab] = useState('daily');
  const [viewMode, setViewMode] = useState('kid'); // 'kid' or 'parent'
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Parent Mode Auth State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Parent Mode Editing State
  const [editingTask, setEditingTask] = useState({ title: '', icon: '⭐', category: 'daily' });
  const [editId, setEditId] = useState(null);

  // Drag and Drop References
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  useEffect(() => {
    const savedTasks = localStorage.getItem('superStarTasks');
    const savedStars = localStorage.getItem('superStarPoints');
    const lastLogin = localStorage.getItem('superStarLastLogin');
    
    const today = new Date().toDateString();

    if (savedTasks) {
      let parsedTasks = JSON.parse(savedTasks);
      // Reset daily tasks if it's a new day!
      if (lastLogin !== today) {
        parsedTasks = parsedTasks.map(t => 
          t.category === 'daily' ? { ...t, completed: false } : t
        );
        localStorage.setItem('superStarLastLogin', today);
      }
      setTasks(parsedTasks);
    } else {
      setTasks(defaultTasks);
      localStorage.setItem('superStarLastLogin', today);
    }

    if (savedStars) {
      setStars(parseInt(savedStars, 10));
    }
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('superStarTasks', JSON.stringify(tasks));
      localStorage.setItem('superStarPoints', stars.toString());
    }
  }, [tasks, stars, isLoaded]);

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
      const newTask = {
        id: Date.now(),
        title: editingTask.title,
        icon: editingTask.icon || '⭐',
        category: editingTask.category,
        completed: false
      };
      setTasks([...tasks, newTask]);
    }
    setEditingTask({ title: '', icon: '⭐', category: 'daily' });
    setEditId(null);
  };

  const handleEditClick = (task) => {
    setEditingTask({ title: task.title, icon: task.icon, category: task.category });
    setEditId(task.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    if (editId === id) {
      setEditingTask({ title: '', icon: '⭐', category: 'daily' });
      setEditId(null);
    }
  };

  // Handle drag and drop sorting
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
    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
      <div className="bg-gray-800 p-6 text-white relative">
        <button 
          onClick={() => setViewMode('kid')}
          className="absolute top-4 left-4 p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-center mt-2">Parent Dashboard</h1>
        <p className="text-center text-gray-400 text-sm mt-1">Manage Quests</p>
      </div>

      <div className="p-6 bg-gray-50 border-b">
        <h2 className="font-bold text-gray-700 mb-4">{editId ? 'Edit Quest' : 'Add New Quest'}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Quest Title</label>
            <input 
              type="text" 
              value={editingTask.title}
              onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
              placeholder="e.g. Piano Practice"
              className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Emoji Icon</label>
              <input 
                type="text" 
                maxLength="2"
                value={editingTask.icon}
                onChange={(e) => setEditingTask({...editingTask, icon: e.target.value})}
                className="w-full p-3 rounded-xl border border-gray-300 text-center text-2xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
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
          </div>

          <div>
             <label className="block text-sm text-gray-600 mb-2">Quick Emojis</label>
             <div className="flex flex-wrap gap-2">
                {QUICK_EMOJIS.map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => setEditingTask({...editingTask, icon: emoji})}
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-xl"
                  >
                    {emoji}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              onClick={handleSaveTask}
              className="flex-1 bg-blue-500 text-white font-bold py-3 rounded-xl shadow hover:bg-blue-600 flex justify-center items-center gap-2"
            >
              {editId ? <CheckCircle2 size={20}/> : <Plus size={20}/>}
              {editId ? 'Save Changes' : 'Add Quest'}
            </button>
            {editId && (
              <button 
                onClick={() => { setEditId(null); setEditingTask({ title: '', icon: '⭐', category: 'daily' }); }}
                className="px-4 bg-gray-300 text-gray-700 font-bold py-3 rounded-xl shadow hover:bg-gray-400"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-2 px-2">Current Quests (Drag to Reorder)</h3>
        {tasks.map((task, index) => (
          <div 
            key={task.id} 
            draggable
            onDragStart={() => (dragItem.current = index)}
            onDragEnter={() => (dragOverItem.current = index)}
            onDragEnd={handleSort}
            onDragOver={(e) => e.preventDefault()}
            className="flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm cursor-grab active:cursor-grabbing hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-gray-300">
                <GripVertical size={20} />
              </div>
              <span className="text-2xl">{task.icon}</span>
              <div>
                <p className="font-bold text-gray-700">{task.title}</p>
                <p className="text-xs font-semibold text-gray-400 uppercase">{task.category}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEditClick(task)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                <Edit2 size={18} />
              </button>
              <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
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
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-purple-100 to-pink-100 p-4 font-sans text-gray-800 relative">
      <GlobalStyles />
      {showConfetti && <Confetti />}

      {/* Parent Pin Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-pop">
            <button onClick={closePinModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                <Lock size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Parent Mode</h2>
              <p className="text-gray-500 text-sm mt-1">Enter PIN to customize quests</p>
            </div>
            <form onSubmit={handlePinSubmit}>
              <input
                type="password"
                pattern="[0-9]*"
                inputMode="numeric"
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                className={`w-full text-center text-3xl tracking-[0.5em] p-4 rounded-xl border-2 outline-none transition-colors ${
                  pinError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-400'
                }`}
                placeholder="****"
                maxLength="4"
              />
              {pinError && <p className="text-red-500 text-center font-bold mt-2 animate-pulse">Incorrect PIN.</p>}
              <button 
                type="submit"
                className="w-full mt-6 bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-600 active:scale-95 transition-all"
              >
                Unlock
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Kid UI Container */}
      <div className="max-w-md mx-auto bg-white/60 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border-4 border-white relative">
        
        {/* Settings Icon for Parents */}
        <button 
          onClick={() => setShowPinModal(true)}
          className="absolute top-4 right-4 z-20 p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md transition-colors text-white"
        >
          <Settings size={20} />
        </button>

        {/* Header Section */}
        <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-6 text-white text-center rounded-b-3xl shadow-md relative">
          <Sparkles className="absolute top-4 left-4 w-8 h-8 opacity-50 animate-pulse" />
          <Sparkles className="absolute bottom-4 left-1/4 w-6 h-6 opacity-50 animate-pulse" />
          
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 drop-shadow-md pr-8">
            My Super Quests!
          </h1>
          
          <div className="inline-flex items-center bg-white/20 px-6 py-2 rounded-full backdrop-blur-sm border border-white/40 shadow-inner">
            <Trophy className="w-6 h-6 text-yellow-300 mr-2 animate-float" />
            <span className="text-2xl font-bold">{stars} Stars</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-4 gap-2">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-lg flex justify-center items-center gap-2 transition-all duration-300 ${
              activeTab === 'daily' 
                ? 'bg-blue-400 text-white shadow-lg scale-105' 
                : 'bg-white text-gray-500 hover:bg-blue-50'
            }`}
          >
            <Star className={activeTab === 'daily' ? 'fill-current' : ''} size={20} />
            Today
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-lg flex justify-center items-center gap-2 transition-all duration-300 ${
              activeTab === 'weekly' 
                ? 'bg-green-400 text-white shadow-lg scale-105' 
                : 'bg-white text-gray-500 hover:bg-green-50'
            }`}
          >
            <Calendar className={activeTab === 'weekly' ? 'fill-current' : ''} size={20} />
            This Week
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-gray-600 text-sm uppercase tracking-wider">Quest Progress</span>
            <span className="font-bold text-purple-500">{completedVisible} / {visibleTasks.length}</span>
          </div>
          <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner border-2 border-white">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700 ease-out flex items-center justify-end pr-2"
              style={{ width: `${progressPercent}%` }}
            >
              {progressPercent > 20 && (
                <span className="text-xs text-white font-bold animate-pulse">
                  {progressPercent}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="p-4 space-y-4 mb-4">
          {visibleTasks.length === 0 ? (
            <div className="text-center p-8 text-gray-400 font-bold">
              No quests here! Ask a parent to add some. 🎉
            </div>
          ) : (
            visibleTasks.map(task => (
              <div 
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`
                  group cursor-pointer relative overflow-hidden flex items-center p-4 rounded-2xl transition-all duration-300 transform active:scale-95 border-2
                  ${task.completed 
                    ? 'bg-green-100 border-green-300 shadow-sm opacity-80' 
                    : 'bg-white border-blue-100 shadow-md hover:shadow-lg hover:-translate-y-1'
                  }
                `}
              >
                {/* Background completion fill effect */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 bg-green-200/40 transition-all duration-500 ease-in-out ${task.completed ? 'w-full' : 'w-0'}`}
                />

                {/* Task Icon (Emoji) */}
                <div className={`relative z-10 text-4xl mr-4 transition-transform duration-300 ${task.completed ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {task.icon}
                </div>

                {/* Task Title */}
                <div className="relative z-10 flex-1">
                  <h3 className={`text-xl font-bold transition-all duration-300 ${task.completed ? 'text-green-700 line-through decoration-green-400 decoration-4' : 'text-gray-700'}`}>
                    {task.title}
                  </h3>
                </div>

                {/* Custom Big Checkbox */}
                <div className="relative z-10 ml-2">
                  {task.completed ? (
                    <CheckCircle2 className="w-10 h-10 text-green-500 fill-green-100 animate-pop" />
                  ) : (
                    <Circle className="w-10 h-10 text-gray-300 group-hover:text-blue-300 transition-colors duration-300" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}