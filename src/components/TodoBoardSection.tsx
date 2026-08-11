import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { PrivateText } from "./PrivateText";
import { 
  Plus, 
  Trash2, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  X,
  ListTodo,
  FileText,
  Sparkles
} from "lucide-react";

export const TodoBoardSection: React.FC = () => {
  const { 
    todoTasks, 
    addTodoTask, 
    updateTodoTask, 
    deleteTodoTask,
    projects 
  } = useCRM();

  const [isAdding, setIsAdding] = useState(false);
  const [activeDragOverCol, setActiveDragOverCol] = useState<string | null>(null);

  // AI Task Generation states
  const [isAiAdding, setIsAiAdding] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiTaskPrompt, setAiTaskPrompt] = useState("");
  const [aiTaskProjectId, setAiTaskProjectId] = useState("");
  const [aiTaskPriority, setAiTaskPriority] = useState<any>("Medium");
  const [aiTaskError, setAiTaskError] = useState("");
  const [aiTaskSuccess, setAiTaskSuccess] = useState("");

  const handleAiGenerateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAiGenerating(true);
    setAiTaskError("");
    setAiTaskSuccess("");

    try {
      const selectedProj = projects.find(p => p.id === aiTaskProjectId);
      const projectContext = selectedProj 
        ? `Linked Project Name: "${selectedProj.name}" - Description: "${selectedProj.description}"` 
        : "General business operations & consultancy task";

      const prompt = `You are a strategic event planner & operations manager. Generate an elegant, highly detailed, actionable task with a concise title and a detailed description listing clear operational goals.
      
      Focus or user goal requested: "${aiTaskPrompt || "Draft project proposal blueprint"}"
      ${projectContext}

      Output JSON format ONLY as a single object:
      {
        "title": "Actionable task title",
        "description": "Short description breakdown with clear goals or standard operational protocols"
      }`;

      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Parse JSON
      const text = data.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

      if (!parsed.title) throw new Error("Could not extract a valid task title.");

      // Calculate a default due date of 3 days from now
      const inThreeDays = new Date();
      inThreeDays.setDate(inThreeDays.getDate() + 3);
      const defaultDueDate = inThreeDays.toISOString().split('T')[0];

      await addTodoTask({
        title: parsed.title,
        description: parsed.description || "",
        priority: aiTaskPriority,
        status: "Todo",
        dueDate: defaultDueDate,
        projectId: aiTaskProjectId || undefined
      });

      setAiTaskSuccess(`Task "${parsed.title}" successfully synthesized and pinned to the board!`);
      setAiTaskPrompt("");
      setAiTaskProjectId("");
      setTimeout(() => setAiTaskSuccess(""), 4000);
    } catch (err: any) {
      console.error(err);
      setAiTaskError(err.message || "Failed to auto-synthesize task.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleDropOnColumn = async (taskId: string, targetStatus: "Todo" | "In Progress" | "Done") => {
    await updateTodoTask(taskId, { status: targetStatus });
    setActiveDragOverCol(null);
  };

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<any>("Medium");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    await addTodoTask({
      title,
      description,
      priority,
      status: "Todo",
      dueDate,
      projectId: projectId || undefined
    });

    // Reset
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setDueDate("");
    setProjectId("");
    setIsAdding(false);
  };

  const moveTask = async (id: string, currentStatus: string, direction: "next" | "prev") => {
    let nextStatus: "Todo" | "In Progress" | "Done" = "Todo";

    if (currentStatus === "Todo") {
      nextStatus = direction === "next" ? "In Progress" : "Todo";
    } else if (currentStatus === "In Progress") {
      nextStatus = direction === "next" ? "Done" : "Todo";
    } else if (currentStatus === "Done") {
      nextStatus = direction === "prev" ? "In Progress" : "Done";
    }

    await updateTodoTask(id, { status: nextStatus });
  };

  // Group tasks by Kanban state
  const tasksByStatus = {
    Todo: todoTasks.filter(t => t.status === "Todo"),
    "In Progress": todoTasks.filter(t => t.status === "In Progress"),
    Done: todoTasks.filter(t => t.status === "Done")
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ListTodo className="text-blue-500" />
            Operations Kanban Board
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Organize daily priorities, assign critical tags, and slide milestones</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setIsAiAdding(!isAiAdding);
              setIsAdding(false);
            }}
            className={`font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition shrink-0 ${
              isAiAdding 
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" 
                : "bg-amber-500 hover:bg-amber-600 text-white"
            }`}
          >
            <Sparkles size={14} className="fill-current" />
            {isAiAdding ? "Hide AI Generator" : "Gemini AI Synthesizer"}
          </button>
          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setIsAiAdding(false);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition shrink-0"
          >
            {isAdding ? <X size={14} /> : <Plus size={14} />}
            {isAdding ? "Cancel" : "Add Task (Manual)"}
          </button>
        </div>
      </div>

      {/* AI Task Synthesizer Form */}
      {isAiAdding && (
        <form onSubmit={handleAiGenerateTask} className="bg-gradient-to-br from-slate-50 to-amber-50/20 dark:from-slate-900 dark:to-slate-950/40 border border-amber-200/50 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            <Sparkles size={18} className="text-amber-500 fill-amber-500 animate-pulse" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Gemini AI Operational Task Synthesizer</h3>
              <p className="text-[10px] text-slate-500 font-medium">Auto-structure tasks & checkboxes powered by the indexed CRM metadata</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase">What operational goal or event task do you want to achieve?</label>
              <input 
                type="text" 
                value={aiTaskPrompt}
                onChange={(e) => setAiTaskPrompt(e.target.value)}
                placeholder="e.g. Audit security logs or draft timeline playbook for Dyson's retreat"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs bg-white dark:bg-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Task Priority</label>
              <select 
                value={aiTaskPriority}
                onChange={(e) => setAiTaskPriority(e.target.value as any)}
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs bg-white dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Affiliate Project Context (Provides deeper database accuracy)</label>
              <select 
                value={aiTaskProjectId}
                onChange={(e) => setAiTaskProjectId(e.target.value)}
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs bg-white dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">No specific project (General operations task)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {aiTaskError && (
            <p className="text-xs text-rose-600 font-mono flex items-center gap-1 font-semibold">
              <AlertCircle size={14} />
              {aiTaskError}
            </p>
          )}

          {aiTaskSuccess && (
            <p className="text-xs text-emerald-600 font-mono font-semibold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded border border-emerald-100 dark:border-emerald-900/40">
              {aiTaskSuccess}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => {
                setIsAiAdding(false);
                setAiTaskError("");
                setAiTaskSuccess("");
              }}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 bg-white dark:bg-slate-900"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isAiGenerating}
              className="bg-slate-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {isAiGenerating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Synthesizing...
                </>
              ) : (
                <>
                  <Sparkles size={13} className="fill-white" />
                  Synthesize Task & Pin
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Add Task Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-50 pb-2 mb-4">
            <ListTodo size={18} className="text-blue-500" />
            Append Board Task
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Task Title *</label>
              <input 
                type="text" 
                required 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Audit API Endpoints in Cloud Console"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100 font-medium" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Priority Tag</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Target Due Date</label>
              <input 
                type="date" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Linked Project (Optional)</label>
              <select 
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
              >
                <option value="">No Project Affiliation</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Task Description Details</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Breakdown of requirements, credentials, links..."
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg"
            >
              Pin Task
            </button>
          </div>
        </form>
      )}

      {/* Kanban Board Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: TODO */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setActiveDragOverCol("Todo")}
          onDragLeave={() => setActiveDragOverCol(null)}
          onDrop={(e) => {
            const taskId = e.dataTransfer.getData("taskId");
            if (taskId) handleDropOnColumn(taskId, "Todo");
          }}
          className={`p-4 rounded-xl flex flex-col h-full min-h-[450px] transition-all duration-200 ${
            activeDragOverCol === "Todo" 
              ? "bg-blue-50/40 dark:bg-blue-950/20 border-2 border-dashed border-blue-400" 
              : "bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800"
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wide">To Do</h3>
            </div>
            <span className="bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-extrabold px-2 py-0.5 rounded-full">
              {tasksByStatus.Todo.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {tasksByStatus.Todo.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 italic border border-dashed border-slate-200/60 dark:border-slate-800 rounded-lg">
                No pending tasks. Drag a task card here to schedule.
              </div>
            ) : (
              tasksByStatus.Todo.map(task => (
                <KanbanTaskCard key={task.id} task={task} onMove={moveTask} onDelete={deleteTodoTask} />
              ))
            )}
          </div>
        </div>

        {/* Column 2: IN PROGRESS */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setActiveDragOverCol("In Progress")}
          onDragLeave={() => setActiveDragOverCol(null)}
          onDrop={(e) => {
            const taskId = e.dataTransfer.getData("taskId");
            if (taskId) handleDropOnColumn(taskId, "In Progress");
          }}
          className={`p-4 rounded-xl flex flex-col h-full min-h-[450px] transition-all duration-200 ${
            activeDragOverCol === "In Progress" 
              ? "bg-amber-50/40 dark:bg-amber-950/20 border-2 border-dashed border-amber-400" 
              : "bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800"
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wide">In Progress</h3>
            </div>
            <span className="bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-extrabold px-2 py-0.5 rounded-full">
              {tasksByStatus["In Progress"].length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {tasksByStatus["In Progress"].length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 italic border border-dashed border-slate-200/60 dark:border-slate-800 rounded-lg">
                No active development. Drag a task card here to start.
              </div>
            ) : (
              tasksByStatus["In Progress"].map(task => (
                <KanbanTaskCard key={task.id} task={task} onMove={moveTask} onDelete={deleteTodoTask} />
              ))
            )}
          </div>
        </div>

        {/* Column 3: DONE */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setActiveDragOverCol("Done")}
          onDragLeave={() => setActiveDragOverCol(null)}
          onDrop={(e) => {
            const taskId = e.dataTransfer.getData("taskId");
            if (taskId) handleDropOnColumn(taskId, "Done");
          }}
          className={`p-4 rounded-xl flex flex-col h-full min-h-[450px] transition-all duration-200 ${
            activeDragOverCol === "Done" 
              ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-2 border-dashed border-emerald-400" 
              : "bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800"
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wide">Completed</h3>
            </div>
            <span className="bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-extrabold px-2 py-0.5 rounded-full">
              {tasksByStatus.Done.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {tasksByStatus.Done.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 italic border border-dashed border-slate-200/60 dark:border-slate-800 rounded-lg">
                No completed tasks yet. Drag a task card here to close.
              </div>
            ) : (
              tasksByStatus.Done.map(task => (
                <KanbanTaskCard key={task.id} task={task} onMove={moveTask} onDelete={deleteTodoTask} />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// Isolated Kanban Task Card Sub-component
const KanbanTaskCard: React.FC<{ 
  task: any, 
  onMove: (id: string, status: string, dir: "next" | "prev") => void,
  onDelete: (id: string) => void
}> = ({ task, onMove, onDelete }) => {
  const { projects } = useCRM();
  const linkedProj = projects.find(p => p.id === task.projectId);

  let priorityStyle = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  if (task.priority === "High") priorityStyle = "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300";
  if (task.priority === "Medium") priorityStyle = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";

  return (
    <div 
      draggable="true"
      onDragStart={(e) => {
        e.dataTransfer.setData("taskId", task.id);
      }}
      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl shadow-xs space-y-3 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 dark:hover:border-blue-900 transition-all duration-150"
    >
      <div className="flex justify-between items-start gap-2">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${priorityStyle}`}>
          {task.priority}
        </span>
        <button
          onClick={() => { if(confirm("Remove this task from the board?")) onDelete(task.id); }}
          className="text-slate-400 hover:text-rose-500"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="space-y-1">
        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 leading-snug">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            <PrivateText>{task.description}</PrivateText>
          </p>
        )}
      </div>

      {linkedProj && (
        <div className="text-[9px] bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded truncate font-medium">
          Proj: {linkedProj.name}
        </div>
      )}

      <div className="flex justify-between items-center pt-2.5 border-t border-slate-50 dark:border-slate-800/60 mt-2 text-[10px] text-slate-400">
        <span className="flex items-center gap-1 font-mono font-medium">
          <Clock size={10} /> {task.dueDate || "No deadline"}
        </span>
        
        {/* Navigation sliders */}
        <div className="flex gap-1.5">
          {task.status !== "Todo" && (
            <button 
              onClick={() => onMove(task.id, task.status, "prev")}
              className="p-1 border border-slate-100 dark:border-slate-800 rounded bg-slate-50 hover:bg-slate-100"
              title="Slide Left"
            >
              <ChevronLeft size={10} />
            </button>
          )}
          {task.status !== "Done" && (
            <button 
              onClick={() => onMove(task.id, task.status, "next")}
              className="p-1 border border-slate-100 dark:border-slate-800 rounded bg-slate-50 hover:bg-slate-100"
              title="Slide Right"
            >
              <ChevronRight size={10} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
