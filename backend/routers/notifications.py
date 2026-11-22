"""Persisted in-app notifications: lists, marks read, and clears the
alerts created by backend/notifications.py (per-reading + temporal)."""
from fastapi import APIRouter, Depends, HTTPException, Query

from backend.db import get_db_connection
from backend.security import get_current_user

router = APIRouter(prefix="/notifications")

FIELDS = (
    "notification_id, title, message, severity, category, metric_name, "
    "metric_value, action_label, action_route, is_read, created_at"
)


def connection():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(503, "Notifications are temporarily unavailable")
    return conn


def row_to_dict(row):
    (notification_id, title, message, severity, category, metric_name,
     metric_value, action_label, action_route, is_read, created_at) = row
    return {
        "notification_id": notification_id,
        "title": title,
        "message": message,
        "severity": severity,
        "category": category,
        "metric_name": metric_name,
        "metric_value": metric_value,
        "action_label": action_label,
        "action_route": action_route,
        "is_read": bool(is_read),
        "created_at": created_at,
    }


@router.get("")
def list_notifications(limit: int = Query(50, ge=1, le=200),
                       offset: int = Query(0, ge=0),
                       current_user=Depends(get_current_user)):
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                f"SELECT {FIELDS} FROM Notifications WHERE user_id = %s "
                "ORDER BY created_at DESC, notification_id DESC LIMIT %s OFFSET %s",
                (current_user.user_id, limit, offset),
            )
            notifications = [row_to_dict(row) for row in cursor.fetchall()]
            cursor.execute(
                "SELECT COUNT(*) FROM Notifications WHERE user_id = %s AND is_read = FALSE",
                (current_user.user_id,),
            )
            unread_count = cursor.fetchone()[0]
        return {"notifications": notifications, "unread_count": unread_count}
    finally:
        conn.close()


@router.post("/{notification_id}/read")
def mark_read(notification_id: int, current_user=Depends(get_current_user)):
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT user_id FROM Notifications WHERE notification_id = %s",
                (notification_id,),
            )
            row = cursor.fetchone()
            if not row or row[0] != current_user.user_id:
                raise HTTPException(404, "Notification not found.")
            cursor.execute(
                "UPDATE Notifications SET is_read = TRUE WHERE notification_id = %s",
                (notification_id,),
            )
        conn.commit()
        return {"notification_id": notification_id, "is_read": True}
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.post("/read-all")
def mark_all_read(current_user=Depends(get_current_user)):
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE Notifications SET is_read = TRUE WHERE user_id = %s AND is_read = FALSE",
                (current_user.user_id,),
            )
            updated = cursor.rowcount
        conn.commit()
        return {"updated": updated}
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.delete("/{notification_id}")
def delete_notification(notification_id: int, current_user=Depends(get_current_user)):
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT user_id FROM Notifications WHERE notification_id = %s",
                (notification_id,),
            )
            row = cursor.fetchone()
            if not row or row[0] != current_user.user_id:
                raise HTTPException(404, "Notification not found.")
            cursor.execute(
                "DELETE FROM Notifications WHERE notification_id = %s",
                (notification_id,),
            )
        conn.commit()
        return {"notification_id": notification_id}
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@router.delete("")
def clear_notifications(current_user=Depends(get_current_user)):
    conn = connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "DELETE FROM Notifications WHERE user_id = %s",
                (current_user.user_id,),
            )
            cleared = cursor.rowcount
        conn.commit()
        return {"cleared": cleared}
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
