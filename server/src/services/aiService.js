const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

// Initialize Gemini if key exists
let geminiModel = null;
if (process.env.GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  } catch (error) {
    console.error("Failed to initialize Gemini:", error.message);
  }
}

// Initialize OpenAI if key exists
let openai = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (error) {
    console.error("Failed to initialize OpenAI:", error.message);
  }
}

/**
 * Heuristic fallback for task analysis when no AI keys are present.
 */
function getHeuristicAnalysis(title, deadline) {
  const lowercaseTitle = title.toLowerCase();
  let category = "Personal";
  let difficulty = "Medium";
  let estimatedTime = 60; // default 60 minutes
  let priority = 5;
  let subtasks = [];

  // 1. Determine Category
  if (lowercaseTitle.includes("study") || lowercaseTitle.includes("exam") || lowercaseTitle.includes("homework") || lowercaseTitle.includes("class") || lowercaseTitle.includes("read")) {
    category = "Study";
  } else if (lowercaseTitle.includes("work") || lowercaseTitle.includes("code") || lowercaseTitle.includes("build") || lowercaseTitle.includes("project") || lowercaseTitle.includes("meeting")) {
    category = "Work";
  } else if (lowercaseTitle.includes("gym") || lowercaseTitle.includes("workout") || lowercaseTitle.includes("run") || lowercaseTitle.includes("exercise") || lowercaseTitle.includes("swim")) {
    category = "Gym";
  } else if (lowercaseTitle.includes("breakfast") || lowercaseTitle.includes("lunch") || lowercaseTitle.includes("dinner") || lowercaseTitle.includes("eat") || lowercaseTitle.includes("meal")) {
    category = "Meals";
  }

  // 2. Determine Difficulty & Default Times
  if (lowercaseTitle.includes("exam") || lowercaseTitle.includes("thesis") || lowercaseTitle.includes("build") || lowercaseTitle.includes("complex") || lowercaseTitle.includes("final")) {
    difficulty = "Hard";
    estimatedTime = 180; // 3 hours
    priority = 8;
  } else if (lowercaseTitle.includes("clean") || lowercaseTitle.includes("call") || lowercaseTitle.includes("buy") || lowercaseTitle.includes("grocery") || lowercaseTitle.includes("check")) {
    difficulty = "Easy";
    estimatedTime = 30; // 30 mins
    priority = 3;
  }

  // 3. Generate Mock Subtasks
  if (difficulty === "Hard") {
    subtasks = [
      { title: "Review requirements and references", completed: false },
      { title: "Draft outline or design foundation", completed: false },
      { title: "Execute core implementation", completed: false },
      { title: "Review and polish details", completed: false }
    ];
  } else if (difficulty === "Medium") {
    subtasks = [
      { title: "Set up workspace", completed: false },
      { title: "Complete primary task objective", completed: false },
      { title: "Double-check work", completed: false }
    ];
  } else {
    subtasks = [
      { title: "Complete task", completed: false }
    ];
  }

  return {
    title,
    category,
    difficulty,
    estimatedTime,
    priority,
    subtasks
  };
}

/**
 * Analyzes a raw task string and returns structured task metadata
 */
async function analyzeTask(taskInput, deadline) {
  const systemPrompt = `You are a productivity task extraction assistant. 
Given a raw task description and a optional deadline, extract/estimate:
1. A cleaned up, concise Title
2. Category: Must be one of ["Work", "Study", "Gym", "Meals", "Personal"]
3. Difficulty: Must be one of ["Easy", "Medium", "Hard"]
4. Estimated Time: Completion duration in minutes (integer)
5. Priority: A priority rating from 1 to 10 (integer)
6. Subtasks: A list of 2-5 sub-steps to complete this task.

Return ONLY a valid JSON object matching this schema, without markdown formatting or code blocks:
{
  "title": "Cleaned task title",
  "category": "Work",
  "difficulty": "Medium",
  "estimatedTime": 90,
  "priority": 7,
  "subtasks": [{"title": "Step 1", "completed": false}, {"title": "Step 2", "completed": false}]
}`;

  const userPrompt = `Analyze this task input: "${taskInput}". Optional deadline context: "${deadline || 'Not specified'}".`;

  // 1. Try OpenAI if key is present
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2
      });
      const content = response.choices[0].message.content.trim();
      return JSON.parse(content);
    } catch (error) {
      console.warn("OpenAI Task Analysis failed, trying Gemini...", error.message);
    }
  }

  // 2. Try Gemini if key is present
  if (geminiModel) {
    try {
      const prompt = `${systemPrompt}\n\nUser Input: ${userPrompt}\nJSON Response:`;
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text().trim();
      // Remove any markdown code blocks if the LLM outputted them
      const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.warn("Gemini Task Analysis failed, falling back to heuristics...", error.message);
    }
  }

  // 3. Fallback to heuristics
  return getHeuristicAnalysis(taskInput, deadline);
}

/**
 * EOD Reflection Engine: Summarizes completed tasks and suggests goals for tomorrow
 */
async function generateReflection(completedTasks, pendingTasks) {
  const summaryText = `Completed tasks: ${completedTasks.map(t => t.title).join(', ') || 'None'}. Pending tasks: ${pendingTasks.map(t => t.title).join(', ') || 'None'}.`;
  
  const systemPrompt = `You are a supportive, encouraging productivity coach. 
Generate a short 3-4 sentence end-of-day summary. 
Acknowledge completed tasks, gently motivate for pending ones, and suggest a focus area for tomorrow.`;

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: summaryText }
        ]
      });
      return response.choices[0].message.content.trim();
    } catch (error) {
      console.warn("OpenAI Reflection failed, using Gemini...");
    }
  }

  if (geminiModel) {
    try {
      const result = await geminiModel.generateContent(`${systemPrompt}\n\nStats: ${summaryText}`);
      return result.response.text().trim();
    } catch (error) {
      console.warn("Gemini Reflection failed, using heuristic reflection...");
    }
  }

  // Heuristic Reflection Fallback
  if (completedTasks.length > 0) {
    return `Great job today! You knocked out ${completedTasks.length} task(s), including "${completedTasks[0].title}". You have ${pendingTasks.length} tasks pending. Rest up tonight, and tomorrow we'll focus on tackling the rest!`;
  }
  return `Today was a quiet day, but that's okay! We have ${pendingTasks.length} tasks waiting for you tomorrow. Let's start the morning fresh and build up your streak!`;
}

async function chatWithAssistant(message, context) {
  const { user, tasks = [], schedule = [], habits = [] } = context;

  const systemPrompt = `You are Planr's AI Productivity Coach & Companion. 
Analyze the user's request and provide a helpful, coaching-oriented response (1-3 sentences max).
You have access to their current context:
- User: ${user?.name || 'User'}, Peak energy preference: ${user?.energyPreference || 'Morning'}
- Pending Tasks: ${JSON.stringify(tasks.slice(0, 5).map(t => ({ id: t._id || t.id, title: t.title, priority: t.priority, deadline: t.deadline })))}
- Today's Timeline: ${JSON.stringify(schedule.slice(0, 5).map(s => ({ title: s.title, start: s.start, end: s.end })))}
- Habits: ${JSON.stringify(habits.slice(0, 5).map(h => ({ name: h.name, streak: h.streak })))}

Determine if any of the following structured actions are requested or highly relevant:
1. {"type": "RESCHEDULE", "description": "Trigger schedule regeneration"}
2. {"type": "VIEW_PAGE", "page": "/tasks", "description": "Go to Tasks view"}
3. {"type": "VIEW_PAGE", "page": "/habits", "description": "Go to Habits view"}
4. {"type": "VIEW_PAGE", "page": "/goals", "description": "Go to Goals view"}
5. {"type": "FOCUS_TASK", "taskId": "<id>", "description": "Focus on: <task title>"} (use if user asks what to work on now, selecting the highest-priority pending task)

Return ONLY a valid JSON object matching this schema, without markdown formatting or code blocks:
{
  "message": "Coaching reply to user's question.",
  "actions": [{"type": "RESCHEDULE", "description": "Optimize schedule"}]
}`;

  // 1. Try OpenAI if key is present
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.3
      });
      return JSON.parse(response.choices[0].message.content.trim());
    } catch (error) {
      console.warn("OpenAI Chat Assistant failed, trying Gemini...", error.message);
    }
  }

  // 2. Try Gemini if key is present
  if (geminiModel) {
    try {
      const prompt = `${systemPrompt}\n\nUser Input: ${message}\nJSON Response:`;
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text().trim();
      const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.warn("Gemini Chat Assistant failed, falling back to heuristics...", error.message);
    }
  }

  // 3. Fallback Heuristics
  const msgLower = message.toLowerCase();
  let reply = "I'm here to support you! Let's stay on track and crush those deadlines today.";
  const actions = [];

  const highestPriorityTask = tasks
    .filter(t => t.status === 'pending')
    .sort((a, b) => (b.priority || 5) - (a.priority || 5))[0];

  if (msgLower.includes('reschedule') || msgLower.includes('replan') || msgLower.includes('re-schedule') || msgLower.includes('organize my day')) {
    reply = "Understood. I will recalculate your daily calendar around your routine blocks to maximize productivity.";
    actions.push({ type: "RESCHEDULE", description: "Optimize and reschedule your remaining tasks." });
  } else if (msgLower.includes('what should i do') || msgLower.includes('what\'s next') || msgLower.includes('what to work on') || msgLower.includes('now') || msgLower.includes('next task')) {
    if (highestPriorityTask) {
      reply = `You should focus on your highest priority task: "${highestPriorityTask.title}". It's due soon, and completing it will boost your streak!`;
      actions.push({
        type: "FOCUS_TASK",
        taskId: highestPriorityTask._id || highestPriorityTask.id,
        description: `Focus on completing: ${highestPriorityTask.title}`
      });
    } else {
      reply = "You don't have any pending tasks right now. Great job keeping your plate clean! Try adding new tasks or building habits.";
    }
  } else if (msgLower.includes('task') || msgLower.includes('todo') || msgLower.includes('to-do')) {
    reply = "Let's check your tasks. You can view all tasks and add details in the Task Workspace.";
    actions.push({ type: "VIEW_PAGE", page: "/tasks", description: "Navigate to Tasks page" });
  } else if (msgLower.includes('habit') || msgLower.includes('streak')) {
    reply = "Keeping up with your habits builds long-term discipline. Let's see your streak heatmap!";
    actions.push({ type: "VIEW_PAGE", page: "/habits", description: "Navigate to Habits page" });
  } else if (msgLower.includes('goal') || msgLower.includes('milestone')) {
    reply = "Breaking long-term goals into clear milestones keeps you aligned. Let's check your achievements page!";
    actions.push({ type: "VIEW_PAGE", page: "/goals", description: "Navigate to Goals page" });
  }

  return {
    message: reply,
    actions
  };
}

module.exports = {
  analyzeTask,
  generateReflection,
  chatWithAssistant
};

