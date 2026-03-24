"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AuroraOrb } from "@/components/react-bits/aurora-orb";
import { DatePicker } from "@/components/react-bits/date-picker";
import { FloatingPanel } from "@/components/react-bits/floating-panel";
import { NoiseGrid } from "@/components/react-bits/noise-grid";
import { ToastItem, ToastStack } from "@/components/react-bits/toast-stack";

type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

type Share = {
  email: string;
  name: string;
  permission: "view" | "edit";
};

type Task = {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  title: string;
  description: string;
  status: "planned" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  isShared: boolean;
  access?: "owner" | "view" | "edit";
  shares: Share[];
};

type TaskFormState = {
  title: string;
  description: string;
  status: Task["status"];
  priority: Task["priority"];
  dueDate: string;
};

const emptyTask: TaskFormState = {
  title: "",
  description: "",
  status: "planned" as const,
  priority: "medium" as const,
  dueDate: "",
};

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error("Network error. Please check that the server is running and try again.");
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? ((await response.json()) as ApiErrorPayload & T) : null;

  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? `Request failed with status ${response.status}.`);
  }

  if (!data) {
    throw new Error("The server returned an unexpected response.");
  }

  return data;
}

export function AppShell() {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [shareEmail, setShareEmail] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const stats = {
    total: tasks.length,
    active: tasks.filter((task) => task.status !== "done").length,
    shared: tasks.filter((task) => task.isShared).length,
    completed: tasks.filter((task) => task.status === "done").length,
  };

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((current) => [...current, { id, ...toast }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [dismissToast],
  );

  const refreshSession = async () => {
    const data = await api<{ user: User | null }>("/api/auth/me", {
      method: "GET",
    });
    setUser(data.user);
  };

  const refreshTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      return;
    }

    const data = await api<{ tasks: Task[] }>("/api/tasks", {
      method: "GET",
    });
    setTasks(data.tasks);
  }, [user]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await refreshSession();
      } catch (nextError) {
        pushToast({
          tone: "error",
          title: "Session check failed",
          description:
            nextError instanceof Error ? nextError.message : "Could not load the session.",
        });
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [pushToast]);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    void refreshTasks();
  }, [user, refreshTasks]);

  const onAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const data = await api<{ user: User }>(endpoint, {
        method: "POST",
        body: JSON.stringify(form),
      });

      setUser(data.user);
      setForm({ name: "", email: "", password: "" });
      pushToast({
        tone: "success",
        title: mode === "signup" ? "Account created" : "Login successful",
        description: mode === "signup" ? "You are ready to start planning." : "Welcome back to Daily Align.",
      });
    } catch (nextError) {
      pushToast({
        tone: "error",
        title: "Authentication failed",
        description: nextError instanceof Error ? nextError.message : "Authentication failed.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onLogout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
      setUser(null);
      setTasks([]);
      pushToast({
        tone: "info",
        title: "Logged out",
        description: "Your session has been cleared.",
      });
    } catch (nextError) {
      pushToast({
        tone: "error",
        title: "Logout failed",
        description: nextError instanceof Error ? nextError.message : "Could not log out.",
      });
    }
  };

  const onTaskCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!taskForm.title.trim()) {
      pushToast({
        tone: "error",
        title: "Task title is required",
        description: "Add a short title before creating the task.",
      });
      return;
    }

    if (taskForm.title.trim().length < 2) {
      pushToast({
        tone: "error",
        title: "Task title is too short",
        description: "Use at least 2 characters so the task is meaningful.",
      });
      return;
    }

    setSubmitting(true);

    try {
      await api("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          ...taskForm,
          dueDate: taskForm.dueDate || null,
        }),
      });

      setTaskForm(emptyTask);
      await refreshTasks();
      pushToast({
        tone: "success",
        title: "Task created",
        description: "The task was added to your board.",
      });
    } catch (nextError) {
      pushToast({
        tone: "error",
        title: "Task creation failed",
        description: nextError instanceof Error ? nextError.message : "Could not save the task.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateTask = async (taskId: string, patch: Partial<Task>) => {
    try {
      await api(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });

      await refreshTasks();
    } catch (nextError) {
      pushToast({
        tone: "error",
        title: "Task update failed",
        description: nextError instanceof Error ? nextError.message : "Could not update the task.",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await api(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      await refreshTasks();
      pushToast({
        tone: "success",
        title: "Task deleted",
        description: "The task was removed from your board.",
      });
    } catch (nextError) {
      pushToast({
        tone: "error",
        title: "Delete failed",
        description: nextError instanceof Error ? nextError.message : "Could not delete the task.",
      });
    }
  };

  const shareTask = async (taskId: string) => {
    const email = shareEmail[taskId];

    if (!email) {
      pushToast({
        tone: "error",
        title: "Missing teammate email",
        description: "Add an email address before sharing the task.",
      });
      return;
    }

    try {
      await api(`/api/tasks/${taskId}/share`, {
        method: "POST",
        body: JSON.stringify({
          email,
          permission: "edit",
        }),
      });

      setShareEmail((current) => ({ ...current, [taskId]: "" }));
      await refreshTasks();
      pushToast({
        tone: "success",
        title: "Task shared",
        description: "Your teammate now has access to this task.",
      });
    } catch (nextError) {
      pushToast({
        tone: "error",
        title: "Share failed",
        description: nextError instanceof Error ? nextError.message : "Could not share the task.",
      });
    }
  };

  const statusTone = (status: Task["status"]) => {
    if (status === "done") return "bg-emerald-500/20 text-emerald-100";
    if (status === "in_progress") return "bg-amber-500/20 text-amber-100";
    return "bg-sky-500/20 text-sky-100";
  };

  const priorityTone = (priority: Task["priority"]) => {
    if (priority === "high") return "text-rose-200";
    if (priority === "low") return "text-emerald-200";
    return "text-amber-200";
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) {
      return "whenever it fits the flow";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${dueDate}T00:00:00Z`));
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-lg text-white">Loading Daily Align...</div>;
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-white sm:px-6 lg:px-10">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <AuroraOrb className="absolute left-[-6rem] top-[-2rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,#f97316_0%,rgba(249,115,22,0)_72%)] blur-2xl" />
      <AuroraOrb
        className="absolute right-[-4rem] top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,#38bdf8_0%,rgba(56,189,248,0)_70%)] blur-2xl"
        delay={1.6}
      />
      <AuroraOrb
        className="absolute bottom-[-8rem] left-1/3 h-96 w-96 rounded-full bg-[radial-gradient(circle,#facc15_0%,rgba(250,204,21,0)_68%)] blur-3xl"
        delay={0.8}
      />
      <NoiseGrid />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6">
        <FloatingPanel className="rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.32em] text-orange-100">
                Daily Align Workspace
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                Plan the day, share the momentum, keep every task aligned.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
                A polished CRUD starter with signup, login, personal task boards, live status updates, and teammate sharing on top of Postgres.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Total", value: stats.total },
                { label: "Active", value: stats.active },
                { label: "Shared", value: stats.shared },
                { label: "Done", value: stats.completed },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.08, duration: 0.55 }}
                  className="rounded-3xl border border-white/12 bg-black/20 px-4 py-4"
                >
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </FloatingPanel>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.25fr]">
          <FloatingPanel className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 shadow-xl shadow-black/30 backdrop-blur-xl sm:p-8" delay={0.1}>
            {!user ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-orange-200/70">Access</p>
                    <h2 className="mt-2 text-3xl font-semibold text-white">
                      {mode === "signup" ? "Create your rhythm." : "Step back into focus."}
                    </h2>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 p-1">
                    {(["signup", "login"] as const).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setMode(item)}
                        className={`rounded-full px-4 py-2 text-sm transition ${
                          mode === item ? "bg-white text-slate-950" : "text-white/65"
                        }`}
                      >
                        {item === "signup" ? "Signup" : "Login"}
                      </button>
                    ))}
                  </div>
                </div>

                <form className="mt-8 space-y-4" onSubmit={onAuthSubmit}>
                  {mode === "signup" ? (
                    <label className="block">
                      <span className="mb-2 block text-sm text-white/72">Full name</span>
                      <input
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 outline-none transition focus:border-orange-300"
                        placeholder="Aarav Mehta"
                      />
                    </label>
                  ) : null}

                  <label className="block">
                    <span className="mb-2 block text-sm text-white/72">Email</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 outline-none transition focus:border-sky-300"
                      placeholder="you@dailyalign.app"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-white/72">Password</span>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 outline-none transition focus:border-amber-300"
                      placeholder="At least 8 characters"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-2xl bg-[linear-gradient(135deg,#fb923c,#38bdf8)] px-5 py-3 font-medium text-slate-950 transition hover:scale-[1.01] disabled:opacity-60"
                  >
                    {submitting ? "Working..." : mode === "signup" ? "Create account" : "Login"}
                  </button>
                </form>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    "JWT cookie auth",
                    "Postgres task storage",
                    "Task sharing built in",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/6 p-4 text-sm text-white/70">
                      {item}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-sky-200/70">Workspace</p>
                    <h2 className="mt-2 text-3xl font-semibold text-white">Welcome back, {user.name}.</h2>
                    <p className="mt-2 text-white/68">
                      Create today&apos;s priorities, move them forward, and share the work with your team.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="rounded-full border border-white/12 px-4 py-2 text-sm text-white/76 transition hover:bg-white/8"
                  >
                    Logout
                  </button>
                </div>

                <form className="mt-8 space-y-4" onSubmit={onTaskCreate}>
                  <label className="block">
                    <span className="mb-2 block text-sm text-white/72">Task title</span>
                    <input
                      value={taskForm.title}
                      onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 outline-none transition focus:border-orange-300"
                      placeholder="Prepare sprint handoff"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-white/72">Description</span>
                    <textarea
                      value={taskForm.description}
                      onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))}
                      className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 outline-none transition focus:border-sky-300"
                      placeholder="What needs to happen and who needs visibility?"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block">
                      <span className="mb-2 block text-sm text-white/72">Status</span>
                      <select
                        value={taskForm.status}
                        onChange={(event) =>
                          setTaskForm((current) => ({
                            ...current,
                            status: event.target.value as Task["status"],
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-amber-300"
                      >
                        <option value="planned">Planned</option>
                        <option value="in_progress">In progress</option>
                        <option value="done">Done</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm text-white/72">Priority</span>
                      <select
                        value={taskForm.priority}
                        onChange={(event) =>
                          setTaskForm((current) => ({
                            ...current,
                            priority: event.target.value as Task["priority"],
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-orange-300"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm text-white/72">Due date</span>
                      <DatePicker
                        value={taskForm.dueDate}
                        onChange={(value) => setTaskForm((current) => ({ ...current, dueDate: value }))}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-2xl bg-white px-5 py-3 font-medium text-slate-950 transition hover:scale-[1.01] disabled:opacity-60"
                  >
                    {submitting ? "Saving..." : "Create daily task"}
                  </button>
                </form>
              </>
            )}

          </FloatingPanel>

          <FloatingPanel className="rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-xl shadow-black/30 backdrop-blur-xl sm:p-8" delay={0.18}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-white/52">Board</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Task alignment</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white/64">
                {user ? `${tasks.length} tasks` : "Login to begin"}
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {tasks.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-white/15 bg-black/16 p-10 text-center text-white/58">
                  {user ? "No tasks yet. Create the first one from the panel on the left." : "Signup or login to unlock your board."}
                </div>
              ) : (
                tasks.map((task, index) => (
                  <motion.article
                    key={task.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.45 }}
                    className="rounded-[1.75rem] border border-white/10 bg-slate-950/42 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.24em] ${statusTone(task.status)}`}>
                            {task.status.replace("_", " ")}
                          </span>
                          <span className={`text-sm uppercase tracking-[0.24em] ${priorityTone(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-sm text-white/45">
                            {task.access === "owner" ? "Owned by you" : `Shared by ${task.ownerName ?? "teammate"}`}
                          </span>
                        </div>
                        <h3 className="mt-4 text-2xl font-semibold text-white">{task.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-white/68">{task.description || "No description yet."}</p>
                        <p className="mt-4 text-sm text-white/44">
                          Due {formatDueDate(task.dueDate)}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:w-[18rem]">
                        <select
                          value={task.status}
                          onChange={(event) =>
                            void updateTask(task.id, {
                              status: event.target.value as Task["status"],
                            })
                          }
                          disabled={task.access === "view"}
                          className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none disabled:opacity-40"
                        >
                          <option value="planned">Planned</option>
                          <option value="in_progress">In progress</option>
                          <option value="done">Done</option>
                        </select>

                        <select
                          value={task.priority}
                          onChange={(event) =>
                            void updateTask(task.id, {
                              priority: event.target.value as Task["priority"],
                            })
                          }
                          disabled={task.access === "view"}
                          className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none disabled:opacity-40"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>

                        {task.access === "owner" ? (
                          <>
                            <input
                              type="email"
                              value={shareEmail[task.id] ?? ""}
                              onChange={(event) =>
                                setShareEmail((current) => ({
                                  ...current,
                                  [task.id]: event.target.value,
                                }))
                              }
                              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none sm:col-span-2"
                              placeholder="share with teammate@email.com"
                            />
                            <button
                              type="button"
                              onClick={() => void shareTask(task.id)}
                              className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white transition hover:bg-white/14"
                            >
                              Share task
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteTask(task.id)}
                              className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 transition hover:bg-rose-500/18"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60 sm:col-span-2">
                            Shared access: {task.access}
                          </div>
                        )}
                      </div>
                    </div>

                    {task.shares?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {task.shares.map((share) => (
                          <span
                            key={`${task.id}-${share.email}`}
                            className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70"
                          >
                            {share.name} • {share.permission}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </motion.article>
                ))
              )}
            </div>
          </FloatingPanel>
        </div>
      </div>
    </main>
  );
}
