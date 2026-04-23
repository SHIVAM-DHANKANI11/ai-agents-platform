"""
n8n Workflow Automation Service
Handles communication between Django and n8n
"""
import requests
import json
import logging
from django.conf import settings
from django.contrib.auth.models import User

logger = logging.getLogger(__name__)

# n8n Configuration
N8N_BASE_URL = getattr(settings, 'N8N_BASE_URL', 'http://localhost:5678')
N8N_WEBHOOK_SECRET = getattr(settings, 'N8N_WEBHOOK_SECRET', 'your-secret-key')


def send_to_n8n(webhook_path, data, user=None):
    """
    Send data to n8n webhook
    
    Args:
        webhook_path: Path to n8n webhook (e.g., '/webhook/task')
        data: Dictionary of data to send
        user: Optional user object to include user info
    
    Returns:
        dict: Response from n8n or None if failed
    """
    url = f"{N8N_BASE_URL}{webhook_path}"
    
    # Add user info if provided
    payload = data.copy()
    if user:
        payload['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
        }
    
    # Add authentication header
    headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': N8N_WEBHOOK_SECRET,
    }
    
    try:
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=10
        )
        response.raise_for_status()
        
        logger.info(f"Successfully sent data to n8n: {webhook_path}")
        return response.json() if response.content else {'status': 'success'}
        
    except requests.exceptions.ConnectionError:
        logger.warning(f"n8n not available at {url}")
        return None
    except requests.exceptions.Timeout:
        logger.warning(f"n8n request timed out")
        return None
    except Exception as e:
        logger.error(f"Error sending to n8n: {e}")
        return None


def trigger_workflow(workflow_type, data, user=None):
    """
    Trigger specific n8n workflow
    
    Args:
        workflow_type: Type of workflow ('task_creation', 'reminder', 'file_summary')
        data: Workflow data
        user: User object
    """
    webhook_paths = {
        'task_creation': '/webhook/task/create',
        'reminder': '/webhook/reminder',
        'file_summary': '/webhook/file/summary',
        'chat_intent': '/webhook/chat/intent',
    }
    
    webhook_path = webhook_paths.get(workflow_type, '/webhook/generic')
    
    # Add workflow type to data
    payload = {
        'workflow_type': workflow_type,
        'data': data,
    }
    
    return send_to_n8n(webhook_path, payload, user)


def notify_task_created(task, user):
    """Notify n8n when a task is created"""
    data = {
        'event': 'task_created',
        'task': {
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'priority': task.priority,
            'created_at': task.created_at.isoformat(),
        }
    }
    return trigger_workflow('task_creation', data, user)


def notify_file_uploaded(file_upload, user):
    """Notify n8n when a file is uploaded"""
    data = {
        'event': 'file_uploaded',
        'file': {
            'id': file_upload.id,
            'filename': file_upload.original_name,
            'file_type': file_upload.file_type,
            'file_url': file_upload.file.url if file_upload.file else None,
            'uploaded_at': file_upload.uploaded_at.isoformat(),
        }
    }
    return trigger_workflow('file_summary', data, user)


def process_chat_intent(message, session_id, user):
    """
    Send chat message to n8n for intent processing
    n8n can detect if user wants to create task, set reminder, etc.
    """
    data = {
        'event': 'chat_message',
        'message': message,
        'session_id': session_id,
        'intent_hints': {
            'is_task_request': any(word in message.lower() for word in ['task', 'todo', 'remind', 'remember']),
            'is_reminder': any(word in message.lower() for word in ['remind', 'remember', 'don\'t forget']),
            'is_scheduling': any(word in message.lower() for word in ['schedule', 'meeting', 'appointment']),
        }
    }
    return trigger_workflow('chat_intent', data, user)


def send_reminder_notification(task, user):
    """Send reminder notification via n8n"""
    data = {
        'event': 'task_reminder',
        'task': {
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'due_date': task.due_date.isoformat() if task.due_date else None,
        },
        'reminder_time': '24h_before',  # or '1h_before', 'at_due'
    }
    return trigger_workflow('reminder', data, user)
