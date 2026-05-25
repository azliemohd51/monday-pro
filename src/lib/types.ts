export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Profile {
  id: string;
  name: string;
  avatar_color: string;
  role: string;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  color: string;
  owner_id: string;
  created_at: string;
}

export interface Board {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Task {
  id: string;
  board_id: string;
  title: string;
  description: string;
  assignee_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface TaskWithAssignee extends Task {
  assignee: Profile | null;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "Working on it",
  review: "Review",
  done: "Done",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "#C4C4C4",
  in_progress: "#FDAB3D",
  review: "#A25DDC",
  done: "#00C875",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "#9CA3AF",
  medium: "#579BFC",
  high: "#FDAB3D",
  critical: "#E2445C",
};

export const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "review", "done"];
