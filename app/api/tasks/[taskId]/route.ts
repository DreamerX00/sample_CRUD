import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { AppError, assertUuid, handleRouteError, json, parseJsonBody, requireSession } from "@/lib/api";
import { taskSchema } from "@/lib/validations";

type Context = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const { error, session } = requireSession(request);

  if (error || !session) {
    return error;
  }

  const { taskId } = await context.params;

  try {
    assertUuid(taskId, "task id");
    const updates = await parseJsonBody(request, taskSchema.partial(), "Invalid task update.");

    if (Object.keys(updates).length === 0) {
      throw new AppError("Provide at least one task field to update.", 400);
    }

    const taskResult = await db.query(
      `
        SELECT
          t.owner_id AS "ownerId",
          COALESCE(ts.permission, 'view') AS permission
        FROM tasks t
        LEFT JOIN task_shares ts
          ON ts.task_id = t.id
          AND ts.shared_with_user_id = $2
        WHERE t.id = $1
      `,
      [taskId, session.userId],
    );

    const task = taskResult.rows[0];

    if (!task) {
      return json({ error: "Task not found." }, { status: 404 });
    }

    const canEdit = task.ownerId === session.userId || task.permission === "edit";

    if (!canEdit) {
      return json({ error: "You do not have permission to edit this task." }, { status: 403 });
    }

    const currentResult = await db.query(
      `
        SELECT title, description, status, priority, due_date AS "dueDate"
        FROM tasks
        WHERE id = $1
      `,
      [taskId],
    );

    const current = currentResult.rows[0];
    const next = { ...current, ...updates };

    const { rows } = await db.query(
      `
        UPDATE tasks
        SET
          title = $2,
          description = $3,
          status = $4,
          priority = $5,
          due_date = $6,
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          owner_id AS "ownerId",
          title,
          description,
          status,
          priority,
          due_date AS "dueDate",
          is_shared AS "isShared",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [
        taskId,
        next.title,
        next.description,
        next.status,
        next.priority,
        next.dueDate || null,
      ],
    );

    return json({ task: rows[0] });
  } catch (error) {
    return handleRouteError(error, "Could not update the task.");
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const { error, session } = requireSession(request);

    if (error || !session) {
      return error;
    }

    const { taskId } = await context.params;
    assertUuid(taskId, "task id");

    const existing = await db.query(
      `
        SELECT owner_id AS "ownerId"
        FROM tasks
        WHERE id = $1
      `,
      [taskId],
    );

    if (!existing.rowCount) {
      return json({ error: "Task not found." }, { status: 404 });
    }

    if (existing.rows[0].ownerId !== session.userId) {
      return json({ error: "Only the owner can delete this task." }, { status: 403 });
    }

    await db.query("DELETE FROM tasks WHERE id = $1", [taskId]);

    return json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Could not delete the task.");
  }
}
