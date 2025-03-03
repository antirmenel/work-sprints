import React, { useState, useEffect, useMemo } from 'react';
import { FaPlay, FaPause, FaRedo, FaCheck, FaPlus } from 'react-icons/fa';

// Predefined session lengths (in seconds)
const SESSION_LENGTHS = {
  SHORT: 300, // 5 minutes
  MEDIUM: 600, // 10 minutes
  LONG: 1500, // 25 minutes
};

// Helper Functions
const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// Circular Progress Component
const CircularProgress = React.memo(({ progress, size = 160, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e0e0e0" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#4F46E5"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        className="transition-all duration-300 ease-out"
      />
    </svg>
  );
});

// Main Timer Component
const Timer = () => {
  const [timeLeft, setTimeLeft] = useState(SESSION_LENGTHS.SHORT);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionLength, setSessionLength] = useState(SESSION_LENGTHS.SHORT);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [completedSprints, setCompletedSprints] = useState(0);

  // Play sound function
  const playSound = (soundFile) => {
    const audio = new Audio(soundFile);
    audio.play().catch((error) => console.error('Error playing sound:', error));
  };

  // Timer logic
  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      setCompletedSprints((prev) => prev + 1);
      playSound('/sounds/complete.mp3'); // Play completion sound
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]); // Correctly includes `timeLeft`

  // Progress calculation
  const progress = useMemo(() => (timeLeft / sessionLength) * 100, [timeLeft, sessionLength]);

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(sessionLength);
  };

  // Handle session change
  const handleSessionChange = (length) => {
    setSessionLength(length);
    setTimeLeft(length);
    setIsRunning(false);
  };

  // Add a new task
  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask('');
    }
  };

  // Mark task as completed
  const completeTask = (id) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: true } : task)));
  };

  // Play start sound when timer starts
  useEffect(() => {
    if (isRunning) {
      playSound('/sounds/start.mp3');
    }
  }, [isRunning]); // Correctly includes `isRunning`

  // Play pause sound when timer pauses
  useEffect(() => {
    if (!isRunning && timeLeft > 0) {
      playSound('/sounds/pause.mp3');
    }
  }, [isRunning, timeLeft]); // Added `timeLeft` as a dependency

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900 font-sans p-4">
      {/* Hidden video to unlock audio autoplay */}
      <video
        id="unlock-audio"
        muted
        autoPlay
        style={{ display: 'none' }}
        src="/sounds/silent.mp4" // A short silent video
      />

      <div className="mb-8">
        <CircularProgress progress={progress} />
      </div>

      <div className="text-5xl font-light mb-6">{formatTime(timeLeft)}</div>

      <div className="flex space-x-4 mb-8">
        <button
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
          onClick={() => setIsRunning(!isRunning)}
          className="text-sm font-medium px-6 py-3 border border-gray-300 hover:bg-gray-900 hover:text-white transition duration-200 flex items-center space-x-2"
        >
          {isRunning ? <FaPause /> : <FaPlay />}
        </button>
        <button
          aria-label="Reset timer"
          onClick={resetTimer}
          className="text-sm font-medium px-6 py-3 border border-gray-300 hover:bg-gray-900 hover:text-white transition duration-200 flex items-center space-x-2"
        >
          <FaRedo />
        </button>
      </div>

      {/* Session Length Buttons */}
      <div className="flex space-x-4 mb-8">
        {Object.entries(SESSION_LENGTHS).map(([key, value]) => (
          <button
            key={key}
            aria-label={`${key.toLowerCase()} session`}
            onClick={() => handleSessionChange(value)}
            className={`text-sm font-medium px-6 py-3 border border-gray-300 ${
              sessionLength === value ? 'bg-gray-900 text-white' : 'hover:bg-gray-900 hover:text-white'
            } transition duration-200 flex items-center space-x-2`}
          >
            <span>{`${value / 60} min`}</span>
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="w-full max-w-md mb-8">
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a task"
            className="flex-1 px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            onClick={addTask}
            className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-700 transition duration-200"
          >
            <FaPlus />
          </button>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between px-4 py-2 bg-white border border-gray-300 ${
                task.completed ? 'line-through text-gray-400' : ''
              }`}
            >
              <span>{task.text}</span>
              {!task.completed && (
                <button
                  onClick={() => completeTask(task.id)}
                  className="text-gray-900 hover:text-gray-700"
                >
                  <FaCheck />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Session History */}
      <div className="text-sm text-gray-600">
        Completed sprints: {completedSprints}
      </div>

      {/* Footer */}
      <div className="mt-8 text-sm text-gray-500">
        Made with ❤️ by <a href="https://github.com/antirmenel" target="_blank" rel="noopener noreferrer">Menel</a>
      </div>
    </div>
  );
};

export default Timer;