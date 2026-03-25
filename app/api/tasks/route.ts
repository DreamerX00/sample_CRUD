import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handleRouteError, json, parseJsonBody, requireSession } from "@/lib/api";
import { taskSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { error, session } = requireSession(request);

    if (error || !session) {
      return error;
    }

    const { rows } = await db.query(
      `
        SELECT
          t.id,
          t.owner_id AS "ownerId",
          u.name AS "ownerName",
          u.email AS "ownerEmail",
          t.title,
          t.description,
          t.status,
          t.priority,
          t.due_date AS "dueDate",
          t.is_shared AS "isShared",
          t.created_at AS "createdAt",
          t.updated_at AS "updatedAt",
          CASE WHEN t.owner_id = $1 THEN 'owner' ELSE COALESCE(self_share.permission, 'view') END AS "access",
          COALESCE(
            (
              SELECT json_agg(
                jsonb_build_object(
                  'email', shared_user.email,
                  'name', shared_user.name,
                  'permission', task_share.permission
                )
              )
              FROM task_shares task_share
              JOIN users shared_user ON shared_user.id = task_share.shared_with_user_id
              WHERE task_share.task_id = t.id
            ),
            '[]'
          ) AS shares
        FROM tasks t
        JOIN users u ON u.id = t.owner_id
        LEFT JOIN task_shares self_share
          ON self_share.task_id = t.id
          AND self_share.shared_with_user_id = $1
        WHERE t.owner_id = $1
          OR EXISTS (
            SELECT 1
            FROM task_shares ts
            WHERE ts.task_id = t.id
              AND ts.shared_with_user_id = $1
          )
        ORDER BY t.created_at DESC
      `,
      [session.userId],
    );

    return json({ tasks: rows });
  } catch (error) {
    return handleRouteError(error, "Could not load tasks.");
  }
}

export async function POST(request: NextRequest) {
  const { error, session } = requireSession(request);

  if (error || !session) {
    return error;
  }

  try {
    const { title, description, dueDate, priority, status } = await parseJsonBody(
      request,
      taskSchema,
      "Invalid task payload.",
    );
    const { rows } = await db.query(
      `
        INSERT INTO tasks (owner_id, title, description, status, priority, due_date)
        VALUES ($1, $2, $3, $4, $5, $6)
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
      [session.userId, title, description, status, priority, dueDate || null],
    );

    return json({ task: rows[0] }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "Could not create the task.");
  }
}
