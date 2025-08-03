import { useState } from "react";

// Example: Fake progress (in a real app, calculate from actual user data)
function randomProgress() {
  // Random progress between 40% and 100% for demo
  return Math.floor(40 + Math.random() * 60);
}

export default function Goal() {
  // Example starting goals
  const [goals, setGoals] = useState([
    { id: 1, text: "Target 8000 steps per day", progress: 72 },
    { id: 2, text: "Reduce BP to <130/80", progress: 58 },
    { id: 3, text: "Drink 2 liters of water daily", progress: 85 },
  ]);
  const [input, setInput] = useState("");

  // Handle adding new goals
  function handleAddGoal(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setGoals([
      ...goals,
      { id: Date.now(), text: input.trim(), progress: randomProgress() }
    ]);
    setInput("");
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h2 className="text-3xl font-bold mb-4 text-teal-700">Health Goals & Progress</h2>
      {/* Add Goal */}
      <form onSubmit={handleAddGoal} className="flex gap-4 mb-6">
        <input
          type="text"
          className="flex-1 border rounded p-2"
          placeholder='e.g. "Sleep 8 hours/night"'
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button className="bg-teal-600 text-white px-4 py-2 rounded" type="submit">
          Add Goal
        </button>
      </form>

      {/* List of goals */}
      <div className="space-y-6">
        {goals.length === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl">
            No goals yet. Add your first goal!
          </div>
        )}
        {goals.map(goal => (
          <div key={goal.id} className="bg-white rounded-2xl shadow-soft p-5">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-lg text-gray-700">{goal.text}</span>
              <span className="text-teal-700 font-semibold">{goal.progress}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-teal-500 h-3 rounded-full transition-all"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
