import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { assertUuid, handleRouteError, json, parseJsonBody, requireSession } from "@/lib/api";
import { shareSchema } from "@/lib/validations";

type Context = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function POST(request: NextRequest, context: Context) {
  const { error, session } = requireSession(request);

  if (error || !session) {
    return error;
  }

  const { taskId } = await context.params;

  try {
    assertUuid(taskId, "task id");
    const shareInput = await parseJsonBody(request, shareSchema, "Invalid share payload.");

    const taskOwner = await db.query(
      "SELECT owner_id AS \"ownerId\" FROM tasks WHERE id = $1",
      [taskId],
    );

    if (!taskOwner.rowCount) {
      return json({ error: "Task not found." }, { status: 404 });
    }

    if (taskOwner.rows[0].ownerId !== session.userId) {
      return json({ error: "Only the owner can share this task." }, { status: 403 });
    }

    const teammateResult = await db.query(
      "SELECT id, email, name FROM users WHERE email = $1",
      [shareInput.email],
    );

    const teammate = teammateResult.rows[0];

    if (!teammate) {
      return json({ error: "That teammate does not have an account yet." }, { status: 404 });
    }

    if (teammate.id === session.userId) {
      return json({ error: "You already own this task." }, { status: 400 });
    }

    await db.query(
      `
        INSERT INTO task_shares (task_id, shared_with_user_id, permission)
        VALUES ($1, $2, $3)
        ON CONFLICT (task_id, shared_with_user_id)
        DO UPDATE SET permission = EXCLUDED.permission
      `,
      [taskId, teammate.id, shareInput.permission],
    );

    await db.query("UPDATE tasks SET is_shared = TRUE, updated_at = NOW() WHERE id = $1", [taskId]);

    return json({
      share: {
        email: teammate.email,
        name: teammate.name,
        permission: shareInput.permission,
      },
    });
  } catch (error) {
    return handleRouteError(error, "Could not share the task.");
  }
}
