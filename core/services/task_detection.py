"""
AI Task Detection Service
Detects task creation intents in chat messages and extracts task details
"""
import re
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


def detect_task_intent(message):
    """
    Detect if a chat message contains a task creation intent
    
    Returns: dict with task details or None if no task detected
    """
    message_lower = message.lower().strip()
    
    # Task intent patterns
    task_patterns = [
        r'(?:remind\s+me\s+to|add\s+(?:a\s+)?task|create\s+(?:a\s+)?task|i\s+need\s+to|i\s+have\s+to|i\s+should|schedule|don\'t\s+forget\s+to)',
        r'(?:put\s+on\s+my\s+list|add\s+to\s+tasks|make\s+a\s+note|todo|to-do)',
    ]
    
    # Check if message matches any task pattern
    is_task = any(re.search(pattern, message_lower) for pattern in task_patterns)
    
    if not is_task:
        return None
    
    # Extract task details
    task_details = extract_task_details(message)
    
    logger.info(f"Task detected in message: {task_details.get('title', 'Unknown')}")
    return task_details


def extract_task_details(message):
    """
    Extract task details from message using NLP patterns
    
    Returns dict with: title, priority, due_date, estimated_time, description
    """
    message_lower = message.lower().strip()
    
    # Initialize task details
    task = {
        'title': '',
        'description': '',
        'priority': 'medium',
        'due_date': None,
        'estimated_time': None,
        'category': 'other'
    }
    
    # Remove task intent phrases to get the actual task
    intent_phrases = [
        r'remind\s+me\s+to\s+',
        r'add\s+(?:a\s+)?task\s*(?::|to)?\s*',
        r'create\s+(?:a\s+)?task\s*(?::|for)?\s*',
        r'i\s+need\s+to\s+',
        r'i\s+have\s+to\s+',
        r'i\s+should\s+',
        r'schedule\s+',
        r'don\'t\s+forget\s+to\s+',
        r'put\s+on\s+my\s+list\s*',
        r'add\s+to\s+tasks?\s*',
        r'make\s+a\s+note\s*(?::|to)?\s*',
    ]
    
    # Clean message to extract task title
    clean_message = message
    for pattern in intent_phrases:
        clean_message = re.sub(pattern, '', clean_message, flags=re.IGNORECASE)
    
    clean_message = clean_message.strip()
    
    # Extract priority keywords
    priority_keywords = {
        'urgent': 'high',
        'important': 'high',
        'high priority': 'high',
        'asap': 'high',
        'critical': 'high',
        'low priority': 'low',
        'whenever': 'low',
        'no rush': 'low',
        'when you can': 'low',
    }
    
    for keyword, priority in priority_keywords.items():
        if keyword in message_lower:
            task['priority'] = priority
            break
    
    # Extract due date patterns
    due_date = extract_due_date(message_lower)
    if due_date:
        task['due_date'] = due_date
    
    # Extract time estimates
    time_estimate = extract_time_estimate(message_lower)
    if time_estimate:
        task['estimated_time'] = time_estimate
    
    # Extract category
    category = detect_category(message_lower)
    if category:
        task['category'] = category
    
    # Set title (first sentence or first 100 chars)
    sentences = re.split(r'[.!?]+', clean_message)
    task['title'] = sentences[0].strip()[:100] if sentences else clean_message[:100]
    
    # Set description (full cleaned message if longer than title)
    if len(clean_message) > len(task['title']):
        task['description'] = clean_message
    
    # If title is empty, use original message
    if not task['title']:
        task['title'] = message[:100]
    
    return task


def extract_due_date(message):
    """Extract due date from message text"""
    now = datetime.now()
    
    # Today
    if re.search(r'\btoday\b', message):
        return now.replace(hour=23, minute=59, second=59)
    
    # Tomorrow
    if re.search(r'\btomorrow\b', message):
        tomorrow = now + timedelta(days=1)
        return tomorrow.replace(hour=23, minute=59, second=59)
    
    # Next week
    if re.search(r'\bnext\s+week\b', message):
        next_week = now + timedelta(weeks=1)
        return next_week.replace(hour=23, minute=59, second=59)
    
    # Specific day of week (e.g., "on Monday", "by Friday")
    days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    for i, day in enumerate(days):
        if re.search(rf'\b(on|by|next)\s+{day}\b', message):
            today_weekday = now.weekday()
            target_weekday = i
            days_ahead = target_weekday - today_weekday
            if days_ahead <= 0:  # Target day already happened this week
                days_ahead += 7
            target_date = now + timedelta(days=days_ahead)
            return target_date.replace(hour=23, minute=59, second=59)
    
    # In X days
    match = re.search(r'\bin\s+(\d+)\s+days?\b', message)
    if match:
        days = int(match.group(1))
        future_date = now + timedelta(days=days)
        return future_date.replace(hour=23, minute=59, second=59)
    
    # Date patterns (MM/DD/YYYY or DD-MM-YYYY)
    date_patterns = [
        r'(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})',
        r'(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})',
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, message)
        if match:
            try:
                if len(match.group(3)) == 4:  # MM/DD/YYYY format
                    month, day, year = int(match.group(1)), int(match.group(2)), int(match.group(3))
                else:  # YYYY-MM-DD format
                    year, month, day = int(match.group(1)), int(match.group(2)), int(match.group(3))
                
                due_date = datetime(year, month, day, 23, 59, 59)
                if due_date > now:
                    return due_date
            except ValueError:
                pass
    
    return None


def extract_time_estimate(message):
    """Extract time estimate from message (in minutes)"""
    # Patterns like "30 minutes", "1 hour", "2 hours"
    patterns = [
        (r'(\d+)\s*(?:min|minute)s?', 1),  # X minutes
        (r'(\d+)\s*hour?s?', 60),  # X hours
        (r'half\s+an?\s+hour', 30),  # half an hour
        (r'a(?:n)?\s+hour', 60),  # an hour
    ]
    
    for pattern, multiplier in patterns:
        match = re.search(pattern, message)
        if match:
            if isinstance(multiplier, int):
                value = int(match.group(1)) * multiplier
            else:
                value = multiplier
            return value
    
    return None


def detect_category(message):
    """Detect task category from message content"""
    categories = {
        'work': ['work', 'job', 'meeting', 'deadline', 'project', 'client', 'boss', 'office', 'presentation', 'report'],
        'personal': ['personal', 'home', 'family', 'friend', 'birthday', 'anniversary', 'celebrate'],
        'health': ['health', 'exercise', 'workout', 'gym', 'doctor', 'appointment', 'medicine', 'diet', 'run', 'yoga'],
        'learning': ['learn', 'study', 'course', 'read', 'book', 'tutorial', 'practice', 'skill', 'certification'],
        'shopping': ['buy', 'purchase', 'shop', 'order', 'grocery', 'store', 'mall', 'amazon', 'get'],
    }
    
    for category, keywords in categories.items():
        if any(keyword in message for keyword in keywords):
            return category
    
    return 'other'


def format_task_for_chat(task_details):
    """Format detected task as a confirmation message for chat"""
    confirmation = f"✅ I've created a task for you:\n\n"
    confirmation += f"**{task_details['title']}**\n\n"
    
    if task_details.get('priority'):
        priority_emoji = {'high': '🔴', 'medium': '🟡', 'low': '🟢'}
        confirmation += f"• Priority: {priority_emoji.get(task_details['priority'], '')} {task_details['priority'].title()}\n"
    
    if task_details.get('category'):
        confirmation += f"• Category: {task_details['category'].title()}\n"
    
    if task_details.get('due_date'):
        due_str = task_details['due_date'].strftime('%B %d, %Y at %I:%M %p')
        confirmation += f"• Due: {due_str}\n"
    
    if task_details.get('estimated_time'):
        hours = task_details['estimated_time'] // 60
        mins = task_details['estimated_time'] % 60
        if hours > 0:
            confirmation += f"• Estimated Time: {hours}h {mins}m\n"
        else:
            confirmation += f"• Estimated Time: {mins} minutes\n"
    
    confirmation += f"\nYou can view and manage all your tasks in the Task Hub! 📋"
    
    return confirmation
