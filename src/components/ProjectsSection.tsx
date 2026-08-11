import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { PrivateText } from "./PrivateText";
import { 
  Plus, 
  Trash2, 
  Briefcase, 
  CheckSquare, 
  Square, 
  Calendar, 
  DollarSign, 
  ChevronDown, 
  ChevronUp,
  X,
  User,
  ListTodo,
  FileText,
  Sparkles,
  AlertCircle
} from "lucide-react";

export const ProjectsSection: React.FC = () => {
  const { 
    projects, 
    contacts, 
    addProject, 
    updateProject, 
    deleteProject 
  } = useCRM();

  const [isAdding, setIsAdding] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  // Add Project Form state
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [status, setStatus] = useState<any>("Planning");
  const [value, setValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [taskInputs, setTaskInputs] = useState<string[]>([""]);

  // AI Roadmap status map
  const [aiLoadingMap, setAiLoadingMap] = useState<Record<string, boolean>>({});
  const [aiErrorMap, setAiErrorMap] = useState<Record<string, string>>({});

  const handleGenerateRoadmap = async (project: any) => {
    setAiLoadingMap(prev => ({ ...prev, [project.id]: true }));
    setAiErrorMap(prev => ({ ...prev, [project.id]: "" }));

    try {
      const prompt = `Based on the following corporate operations project description, synthesize a list of 4 to 6 highly targeted, specific, operational milestone checklist tasks for this event or consultancy project.

      Project Title: "${project.name}"
      Client Name: "${project.contactName}"
      Description / Scope parameters: "${project.description || "Establish standard event consultation workflow"}"

      Output JSON array ONLY, containing objects of task title strings.
      Format:
      [
        { "title": "Establish target milestone 1" },
        { "title": "Synthesize milestone 2" }
      ]`;

      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const text = data.text.trim();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

      if (!Array.isArray(parsed)) {
        throw new Error("Invalid output received from the intelligence core.");
      }

      const generatedSubtasks = parsed.map((item: any, idx: number) => ({
        id: `task_${Date.now()}_${idx}`,
        title: item.title,
        isCompleted: false
      }));

      // Append generated subtasks to the project's subtasks list
      await updateProject(project.id, { subtasks: [...(project.subtasks || []), ...generatedSubtasks] });
    } catch (err: any) {
      console.error(err);
      setAiErrorMap(prev => ({ ...prev, [project.id]: err.message || "Failed to generate roadmap milestones." }));
    } finally {
      setAiLoadingMap(prev => ({ ...prev, [project.id]: false }));
    }
  };

  const handleAddTaskField = () => {
    setTaskInputs([...taskInputs, ""]);
  };

  const handleTaskInputChange = (index: number, val: string) => {
    const updated = [...taskInputs];
    updated[index] = val;
    setTaskInputs(updated);
  };

  const handleRemoveTaskField = (index: number) => {
    setTaskInputs(taskInputs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactName) return;

    const subtasks = taskInputs
      .filter(t => t.trim() !== "")
      .map((t, idx) => ({
        id: `task_${Date.now()}_${idx}`,
        title: t,
        isCompleted: false
      }));

    await addProject({
      name,
      contactName,
      status,
      value: Number(value) || 0,
      deadline,
      description,
      subtasks
    });

    // Reset
    setName("");
    setContactName("");
    setStatus("Planning");
    setValue("");
    setDeadline("");
    setDescription("");
    setTaskInputs([""]);
    setIsAdding(false);
  };

  const toggleSubtask = async (project: any, subtaskId: string) => {
    const updatedSubtasks = project.subtasks.map((task: any) => {
      if (task.id === subtaskId) {
        return { ...task, isCompleted: !task.isCompleted };
      }
      return task;
    });

    await updateProject(project.id, { subtasks: updatedSubtasks });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Project Operations</h2>
          <p className="text-xs text-slate-500 mt-0.5">Define corporate projects, map milestones, and execute checklists</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition shrink-0"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? "Cancel" : "Create Project"}
        </button>
      </div>

      {/* Add Project Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-50 pb-2 mb-4">
            <Briefcase size={18} className="text-blue-500" />
            Initialize Operations Project
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Project Name *</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Corporate Infrastructure Redesign"
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase">Primary Client Contact *</label>
              <select 
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
              >
                <option value="">Select a Client Contact</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.name}>{c.name} ({c.company})</option>
                ))}
                {/* Fallback to text option in case no contact logged */}
                <option value="General Public/Internal">Internal Project / Operations</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2 md:col-span-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Operations Status</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Contract Value ($)</label>
                <input 
                  type="number" 
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="e.g. 25000"
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Deadline Date</label>
                <input 
                  type="date" 
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100" 
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Scope of Deliverables</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="High-level architectural audit parameters, deliverable outcomes..."
                className="mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
              />
            </div>
            
            {/* Project Milestones / Subtasks */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase flex justify-between">
                <span>Milestones Checklist</span>
                <button 
                  type="button" 
                  onClick={handleAddTaskField}
                  className="text-xs text-blue-500 hover:underline flex items-center gap-0.5 font-medium lowercase"
                >
                  + add task
                </button>
              </label>
              
              <div className="space-y-2">
                {taskInputs.map((task, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      type="text"
                      value={task}
                      onChange={(e) => handleTaskInputChange(idx, e.target.value)}
                      placeholder={`e.g. Task ${idx+1}: Establish Cloud Ingress Routing`}
                      className="flex-1 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm bg-transparent dark:text-slate-100"
                    />
                    {taskInputs.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTaskField(idx)}
                        className="text-slate-400 hover:text-rose-500 px-2"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg"
            >
              Launch Project
            </button>
          </div>
        </form>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl py-12 text-center">
          <Briefcase size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 font-medium">No active operations projects logged.</p>
          <p className="text-xs text-slate-400 mt-1">Initialize a project by linking client contacts to launch trackers.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const completedCount = project.subtasks?.filter(t => t.isCompleted).length || 0;
            const totalTasksCount = project.subtasks?.length || 0;
            const progressPct = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;
            const isExpanded = expandedProject === project.id;

            return (
              <div 
                key={project.id} 
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
              >
                {/* Accordion Trigger */}
                <div 
                  onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                  className="p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between cursor-pointer select-none bg-slate-50/10 dark:bg-slate-900/10 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 truncate">{project.name}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        project.status === "Planning" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                        project.status === "In Progress" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                        project.status === "In Review" ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" :
                        project.status === "Completed" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                        "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <User size={12} className="text-slate-400" />
                      Client Contact: <span className="font-semibold text-slate-700 dark:text-slate-300"><PrivateText type="name">{project.contactName}</PrivateText></span>
                    </p>
                  </div>

                  {/* Calculations / Metrics */}
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Project Value</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                        <PrivateText type="money">${Number(project.value).toLocaleString()}</PrivateText>
                      </p>
                    </div>

                    <div className="w-28 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                        <span>Progress</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-300" 
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 text-right">{completedCount}/{totalTasksCount} tasks</p>
                    </div>

                    <div className="flex flex-col items-center">
                      {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left Block: Description */}
                      <div className="md:col-span-2 space-y-3">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <FileText size={12} /> Project Scope & Deliverables
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                            {project.description || "No project description provided."}
                          </p>
                        </div>
                        <div className="flex gap-4 items-center text-xs">
                          <span className="flex items-center gap-1 text-slate-500 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 px-2.5 py-1.5 rounded-lg">
                            <Calendar size={12} className="text-blue-500" />
                            Target Deadline: <strong className="font-semibold text-slate-700 dark:text-slate-300">{project.deadline || "None"}</strong>
                          </span>
                          <span className="flex items-center gap-1 text-slate-500 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 px-2.5 py-1.5 rounded-lg">
                            <ListTodo size={12} className="text-emerald-500" />
                            Milestones: <strong className="font-semibold text-slate-700 dark:text-slate-300">{totalTasksCount} logged</strong>
                          </span>
                        </div>

                        {/* Gemini AI Project Roadmap Generator trigger */}
                        <div className="bg-amber-500/5 dark:bg-slate-950/20 border border-amber-500/25 dark:border-slate-800 p-3.5 rounded-xl space-y-2 mt-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Sparkles size={13} className="text-amber-500 fill-amber-500 animate-pulse" />
                              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide">Gemini Operational Roadmap Planner</span>
                            </div>
                            <span className="text-[8px] font-mono uppercase bg-amber-500 text-white px-1.5 py-0.5 font-bold rounded">AI Synthesizer</span>
                          </div>
                          <p className="text-[10px] text-slate-500">Auto-plan client milestones & operational checklists tailored to the scope parameters above.</p>
                          
                          <button
                            type="button"
                            disabled={aiLoadingMap[project.id]}
                            onClick={() => handleGenerateRoadmap(project)}
                            className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold text-[10px] uppercase py-1.5 px-3 rounded flex items-center gap-1 transition cursor-pointer"
                          >
                            {aiLoadingMap[project.id] ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Planning Milestones...
                              </>
                            ) : (
                              <>
                                <Sparkles size={11} className="fill-current" />
                                Synthesize Custom Checklist
                              </>
                            )}
                          </button>

                          {aiErrorMap[project.id] && (
                            <p className="text-[10px] text-rose-500 font-medium flex items-center gap-1">
                              <AlertCircle size={11} />
                              {aiErrorMap[project.id]}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Block: Tasks Checklist */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <CheckSquare size={12} /> Milestone Checklists
                        </h4>
                        
                        {totalTasksCount === 0 ? (
                          <div className="text-center py-4 text-xs text-slate-400 italic">
                            No milestones logged. Update project scopes to map targets.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-3 rounded-lg">
                            {project.subtasks.map((task: any) => (
                              <div 
                                key={task.id}
                                onClick={() => toggleSubtask(project, task.id)}
                                className="flex gap-2.5 items-start text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 select-none"
                              >
                                {task.isCompleted ? (
                                  <CheckSquare size={14} className="text-blue-600 shrink-0 mt-0.5" />
                                ) : (
                                  <Square size={14} className="text-slate-300 hover:text-blue-500 shrink-0 mt-0.5" />
                                )}
                                <span className={task.isCompleted ? "line-through text-slate-400 font-medium" : "font-medium"}>
                                  {task.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex gap-2">
                        <span className="text-[10px] text-slate-400 font-mono uppercase">
                          project id: {project.id}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <select 
                          value={project.status}
                          onChange={(e) => updateProject(project.id, { status: e.target.value as any })}
                          className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
                        >
                          <option value="Planning">Planning</option>
                          <option value="In Progress">In Progress</option>
                          <option value="In Review">In Review</option>
                          <option value="Completed">Completed</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                        
                        <button
                          onClick={() => { if(confirm("Archive/Delete project operations tracker?")) deleteProject(project.id); }}
                          className="bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/25 dark:text-rose-400 p-1.5 rounded-lg transition text-xs flex items-center gap-1 font-semibold"
                        >
                          <Trash2 size={13} /> Delete Project
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
