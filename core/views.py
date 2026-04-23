"""
Core views for AI SaaS Dashboard
"""
import json
import os
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse, HttpResponse, FileResponse
from django.views.decorators.http import require_http_methods, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.db.models import Count, Q
from django.utils import timezone

from .models import (
    UserProfile, ChatSession, ChatMessage, Task, 
    CalendarEvent, FileUpload, UserActivity
)
from .utils import send_chat_message, get_assistant_system_prompt, ASSISTANTS, generate_file_summary
from .services.n8n_service import (
    notify_task_created, notify_file_uploaded, 
    process_chat_intent, send_reminder_notification
)
from .services.task_detection import detect_task_intent, format_task_for_chat
from .services.email_service import send_task_created_email
from .services.mobile_push import notify_user
from .services.sms_service import send_sms


# ==================== AUTHENTICATION VIEWS ====================

def signup_view(request):
    """User registration view"""
    if request.user.is_authenticated:
        return redirect('chat')
    
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')
        password_confirm = request.POST.get('password_confirm', '')
        
        errors = {}
        
        if not username:
            errors['username'] = 'Username is required'
        elif User.objects.filter(username=username).exists():
            errors['username'] = 'Username already exists'
        
        if not email:
            errors['email'] = 'Email is required'
        elif User.objects.filter(email=email).exists():
            errors['email'] = 'Email already registered'
        
        if not password:
            errors['password'] = 'Password is required'
        elif len(password) < 8:
            errors['password'] = 'Password must be at least 8 characters'
        
        if password != password_confirm:
            errors['password_confirm'] = 'Passwords do not match'
        
        if errors:
            return JsonResponse({'success': False, 'errors': errors})
        
        user = User.objects.create_user(username=username, email=email, password=password)
        UserActivity.objects.create(user=user, activity_type='login', description='Account created')
        
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        return JsonResponse({'success': True, 'redirect': '/chat/'})
    
    return render(request, 'auth/signup.html')


def login_view(request):
    """User login view"""
    if request.user.is_authenticated:
        return redirect('chat')
    
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        remember = request.POST.get('remember') == 'on'
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            if remember:
                request.session.set_expiry(1209600)  # 2 weeks
            else:
                request.session.set_expiry(0)  # Browser session
            
            UserActivity.objects.create(user=user, activity_type='login')
            return JsonResponse({'success': True, 'redirect': '/chat/'})
        else:
            return JsonResponse({'success': False, 'error': 'Invalid username or password'})
    
    return render(request, 'auth/login.html')


@login_required
def logout_view(request):
    """User logout view"""
    logout(request)
    return redirect('login')


@login_required
def profile_view(request):
    """User profile view"""
    if request.method == 'POST':
        user = request.user
        profile = user.profile
        
        user.email = request.POST.get('email', user.email)
        
        if 'avatar' in request.FILES:
            profile.avatar = request.FILES['avatar']
        
        if request.POST.get('groq_api_key') is not None:
            profile.groq_api_key = request.POST.get('groq_api_key')
            
        if request.POST.get('mobile_push_topic') is not None:
            profile.mobile_push_topic = request.POST.get('mobile_push_topic')
            
        if request.POST.get('phone_number') is not None:
            profile.phone_number = request.POST.get('phone_number')
        if request.POST.get('twilio_account_sid') is not None:
            profile.twilio_account_sid = request.POST.get('twilio_account_sid')
        if request.POST.get('twilio_auth_token') is not None:
            profile.twilio_auth_token = request.POST.get('twilio_auth_token')
        if request.POST.get('twilio_from_number') is not None:
            profile.twilio_from_number = request.POST.get('twilio_from_number')
        
        user.save()
        profile.save()
        
        messages.success(request, 'Profile updated successfully')
        return redirect('profile')
    
    return render(request, 'auth/profile.html')


# ==================== DASHBOARD VIEWS ====================
@login_required
def dashboard_view(request):
    """Main dashboard view"""
    # Get user stats
    total_chats = ChatSession.objects.filter(user=request.user).count()
    total_messages = ChatMessage.objects.filter(session__user=request.user).count()
    active_tasks = Task.objects.filter(user=request.user, completed=False).count()
    completed_tasks = Task.objects.filter(user=request.user, completed=True).count()
    upcoming_events = CalendarEvent.objects.filter(
        user=request.user, 
        date__gte=timezone.now().date()
    ).count()
    total_files = FileUpload.objects.filter(user=request.user).count()
    
    # Get recent chats
    recent_chats = ChatSession.objects.filter(user=request.user)[:5]
    
    # Get today's tasks
    today_tasks = Task.objects.filter(
        user=request.user,
        completed=False,
        due_date__date=timezone.now().date()
    )[:5]
    
    # Get streak info
    profile = request.user.profile
    streak_info = {
        'current_streak': profile.current_streak,
        'longest_streak': profile.longest_streak,
        'total_completed': profile.total_tasks_completed
    }
    
    from datetime import datetime
    hour = datetime.now().hour
    if hour < 12:
        greeting = "Good morning"
        sub = "Let's make this week amazing!"
    elif hour < 17:
        greeting = "Good afternoon"
        sub = "Ready to assign your task?"
    else:
        greeting = "Good evening"
        sub = "Let's review your day!"

    context = {
        'total_chats': total_chats,
        'total_messages': total_messages,
        'active_tasks': active_tasks,
        'completed_tasks': completed_tasks,
        'upcoming_events': upcoming_events,
        'total_files': total_files,
        'recent_chats': recent_chats,
        'streak_info': streak_info,
        'today_tasks': today_tasks,
        'greeting': greeting,
        'sub': sub,
    }
    
    return render(request, 'dashboard/dashboard.html', context)


@login_required
def dashboard_pro_view(request):
    """Premium dark mode dashboard view with stopwatch, focus music, and goals tracker"""
    # Get user stats for pro dashboard
    total_chats = ChatSession.objects.filter(user=request.user).count()
    total_tasks = Task.objects.filter(user=request.user).count()
    completed_tasks = Task.objects.filter(user=request.user, completed=True).count()
    total_files = FileUpload.objects.filter(user=request.user).count()
    
    # Get recent tasks
    recent_tasks = Task.objects.filter(user=request.user)[:5]
    
    context = {
        'total_chats': total_chats,
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'total_files': total_files,
        'recent_tasks': recent_tasks,
    }
    
    return render(request, 'dashboard/dashboard_pro.html', context)


@login_required
def dashboard_ultimate_view(request):
    """Ultimate dashboard with all features"""
    from .models import UserProfile
    
    try:
        profile = request.user.profile
    except:
        profile = None
    
    streak_info = {
        'current_streak': profile.current_streak if profile else 0,
        'longest_streak': profile.longest_streak if profile else 0,
        'total_completed': profile.total_tasks_completed if profile else 0
    }
    
    return render(request, 'dashboard/dashboard_ultimate.html', {
        'streak_info': streak_info
    })


@login_required
def chat_view(request, session_id=None):
    """AI Chat interface view"""
    from .models import ChatSession, ChatMessage
    from .utils import ASSISTANTS
    
    current_session = None
    messages_list = []
    assistant_type = request.GET.get('assistant', 'general')
    
    if session_id:
        current_session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        messages_list = ChatMessage.objects.filter(session=current_session)
    elif 'assistant' in request.GET:
        # User wants a specific assistant type
        # Find the most recent session of this type or create one
        last_session = ChatSession.objects.filter(
            user=request.user, 
            assistant_type=assistant_type
        ).order_by('-created_at').first()
        
        if last_session:
            current_session = last_session
            messages_list = ChatMessage.objects.filter(session=current_session)
        else:
            # Create a new session of this type
            current_session = ChatSession.objects.create(
                user=request.user,
                title=f"New {ASSISTANTS.get(assistant_type, {}).get('name', 'AI')} Chat",
                assistant_type=assistant_type
            )
            messages_list = []
    else:
        # Get most recent session across all types
        last_session = ChatSession.objects.filter(user=request.user).order_by('-created_at').first()
        if last_session:
            current_session = last_session
            messages_list = ChatMessage.objects.filter(session=current_session)
    
    # Get all sessions for sidebar
    sessions = ChatSession.objects.filter(user=request.user).order_by('-created_at')
    
    context = {
        'current_session': current_session,
        'messages': messages_list,
        'sessions': sessions,
        'assistants': ASSISTANTS,
    }
    
    return render(request, 'dashboard/chat.html', context)


@login_required
def dashboard_ultimate_v2_view(request):
    """Ultimate Dashboard V2 with Achievement Badges & Time Blocking"""
    from .models import UserProfile
    
    try:
        profile = request.user.profile
    except:
        profile = None
    
    streak_info = {
        'current_streak': profile.current_streak if profile else 0,
        'longest_streak': profile.longest_streak if profile else 0,
        'total_completed': profile.total_tasks_completed if profile else 0
    }
    
    return render(request, 'dashboard/dashboard_ultimate_v2.html', {
        'streak_info': streak_info
    })


@login_required
def dashboard_ultimate_v3_view(request):
    """Ultimate Dashboard V3 with Smart Breaks & Weekly Goals"""
    from .models import UserProfile
    
    try:
        profile = request.user.profile
    except:
        profile = None
    
    streak_info = {
        'current_streak': profile.current_streak if profile else 0,
        'longest_streak': profile.longest_streak if profile else 0,
        'total_completed': profile.total_tasks_completed if profile else 0
    }
    
    return render(request, 'dashboard/dashboard_ultimate_v3.html', {
        'streak_info': streak_info
    })


@login_required
def dashboard_ultimate_v6_view(request):
    """Ultimate Dashboard V6 with ALL Features - Smart Tasks, Energy Scheduler, Music & Journal"""
    from .models import UserProfile
    
    try:
        profile = request.user.profile
    except:
        profile = None
    
    streak_info = {
        'current_streak': profile.current_streak if profile else 0,
        'longest_streak': profile.longest_streak if profile else 0,
        'total_completed': profile.total_tasks_completed if profile else 0
    }
    
    from datetime import datetime
    hour = datetime.now().hour
    if hour < 12:
        greeting = "Good morning"
        sub = "Let's make this week amazing!"
    elif hour < 17:
        greeting = "Good afternoon"
        sub = "Ready to assign your task?"
    else:
        greeting = "Good evening"
        sub = "Let's review your day!"
    
    return render(request, 'dashboard/dashboard_ultimate_v6.html', {
        'streak_info': streak_info,
        'greeting': greeting,
        'sub': sub,
    })


@login_required
def dashboard_ultimate_v7_view(request):
    """Ultimate Dashboard V7 with ALL Features - AI Delegation, Mind-Map, Deep Work Analytics"""
    from .models import UserProfile
    
    try:
        profile = request.user.profile
    except:
        profile = None
    
    streak_info = {
        'current_streak': profile.current_streak if profile else 0,
        'longest_streak': profile.longest_streak if profile else 0,
        'total_completed': profile.total_tasks_completed if profile else 0
    }
    
    from datetime import datetime
    hour = datetime.now().hour
    if hour < 12:
        greeting = "Good morning"
        sub = "Let's make this week amazing!"
    elif hour < 17:
        greeting = "Good afternoon"
        sub = "Ready to assign your task?"
    else:
        greeting = "Good evening"
        sub = "Let's review your day!"
    
    return render(request, 'dashboard/dashboard_ultimate_v7.html', {
        'streak_info': streak_info,
        'greeting': greeting,
        'sub': sub,
    })


@login_required
@require_POST
def api_send_message(request):
    """API endpoint to send message to AI"""
    try:
        data = json.loads(request.body)
        message = data.get('message', '').strip()
        session_id = data.get('session_id')
        
        if not message:
            return JsonResponse({'success': False, 'error': 'Message is required'})
        
        # Get or create session
        if session_id:
            session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        else:
            session = ChatSession.objects.create(user=request.user, title=message[:50])
        
        # Save user message
        ChatMessage.objects.create(session=session, role='user', content=message)
        
        # Check if message contains a task intent
        task_details = detect_task_intent(message)
        created_task = None
        
        if task_details:
            # Create task from chat message
            try:
                created_task = Task.objects.create(
                    user=request.user,
                    title=task_details['title'],
                    description=task_details.get('description', ''),
                    priority=task_details.get('priority', 'medium'),
                    category=task_details.get('category', 'other'),
                    due_date=task_details.get('due_date'),
                    estimated_time=task_details.get('estimated_time'),
                    source='chat',
                    email_notification=True
                )
                
                logger.info(f"Task created from chat: {created_task.id} - {created_task.title}")
                
                # Send email notification (non-blocking, won't break if email fails)
                try:
                    send_task_created_email(request.user, created_task)
                except Exception as email_error:
                    logger.warning(f"Email notification failed (task still created): {str(email_error)}")
                    
            except Exception as e:
                logger.error(f"Failed to create task from chat: {str(e)}")
        
        # Send to n8n for intent processing (async, don't wait)
        process_chat_intent(message, session.id, request.user)
        
        # Get conversation history
        history = ChatMessage.objects.filter(session=session).order_by('created_at')
        messages_for_api = []
        
        # Add system prompt based on assistant type
        system_prompt = get_assistant_system_prompt(session.assistant_type)
        messages_for_api.append({'role': 'system', 'content': system_prompt})
        
        for msg in history:
            messages_for_api.append({'role': msg.role, 'content': msg.content})
        
        # Get AI response
        api_key = request.user.profile.groq_api_key or settings.GROQ_API_KEY
        response_content = send_chat_message(messages_for_api, api_key)
        
        # Save AI response
        ai_message = ChatMessage.objects.create(
            session=session, 
            role='assistant', 
            content=response_content
        )
        
        # Update session title if it's the first message
        if history.count() <= 2 and session.title == 'New Chat':
            session.title = message[:50]
            session.save()
        
        # Log activity
        UserActivity.objects.create(
            user=request.user, 
            activity_type='chat', 
            description=f'Message in {session.title}'
        )
        
        return JsonResponse({
            'success': True, 
            'response': response_content,
            'session_id': session.id,
            'message_id': ai_message.id,
            'task_created': created_task is not None,
            'task_id': created_task.id if created_task else None,
            'task_title': created_task.title if created_task else None
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
def api_get_history(request, session_id):
    """API endpoint to get chat history"""
    session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    messages = ChatMessage.objects.filter(session=session).values('role', 'content', 'created_at')
    return JsonResponse({'success': True, 'messages': list(messages)})


@login_required
def api_get_sessions(request):
    """API endpoint to get all chat sessions"""
    sessions = ChatSession.objects.filter(user=request.user).values(
        'id', 'title', 'assistant_type', 'created_at', 'updated_at'
    )
    return JsonResponse({'success': True, 'sessions': list(sessions)})


@login_required
@require_POST
def api_create_session(request):
    """API endpoint to create new chat session"""
    data = json.loads(request.body)
    assistant_type = data.get('assistant_type', 'general')
    
    session = ChatSession.objects.create(
        user=request.user,
        title='New Chat',
        assistant_type=assistant_type
    )
    
    return JsonResponse({
        'success': True, 
        'session_id': session.id,
        'title': session.title
    })


@login_required
@require_POST
def api_rename_session(request, session_id):
    """API endpoint to rename chat session"""
    session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    data = json.loads(request.body)
    new_title = data.get('title', '').strip()
    
    if new_title:
        session.title = new_title
        session.save()
    
    return JsonResponse({'success': True})


@login_required
@require_POST
def api_delete_session(request, session_id):
    """API endpoint to delete chat session"""
    session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    session.delete()
    return JsonResponse({'success': True})


@login_required
@require_POST
def api_clear_chat(request, session_id):
    """API endpoint to clear chat messages"""
    session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    ChatMessage.objects.filter(session=session).delete()
    return JsonResponse({'success': True})


@login_required
def notifications_view(request):
    """Notifications view"""
    return render(request, 'dashboard/notifications.html')

@login_required
def help_view(request):
    """Help page view"""
    return render(request, 'dashboard/help.html')

# ==================== TASK VIEWS ====================

@login_required
def tasks_view(request):
    """Task manager view"""
    filter_type = request.GET.get('filter', 'all')
    
    tasks = Task.objects.filter(user=request.user)
    
    if filter_type == 'active':
        tasks = tasks.filter(completed=False)
    elif filter_type == 'completed':
        tasks = tasks.filter(completed=True)
    elif filter_type == 'high':
        tasks = tasks.filter(priority='high')
    
    tasks = tasks.order_by('-created_at')
    
    context = {
        'tasks': tasks,
        'filter': filter_type,
        'total_count': Task.objects.filter(user=request.user).count(),
        'active_count': Task.objects.filter(user=request.user, completed=False).count(),
        'completed_count': Task.objects.filter(user=request.user, completed=True).count(),
    }
    
    return render(request, 'dashboard/tasks.html', context)


@login_required
def tasks_board_view(request):
    """Task board view with drag-and-drop"""
    context = {
        'tasks': Task.objects.filter(user=request.user).order_by('-created_at'),
    }
    return render(request, 'dashboard/tasks-board.html', context)


@login_required
def api_get_tasks(request):
    """API endpoint to get tasks"""
    filter_type = request.GET.get('filter', 'all')
    tasks = Task.objects.filter(user=request.user)
    
    if filter_type == 'active':
        tasks = tasks.filter(completed=False)
    elif filter_type == 'completed':
        tasks = tasks.filter(completed=True)
    
    tasks = tasks.values('id', 'title', 'description', 'completed', 'priority', 'due_date', 'kanban_status', 'created_at')
    return JsonResponse({'success': True, 'tasks': list(tasks)})


@login_required
@require_POST
def api_create_task(request):
    """API endpoint to create task"""
    try:
        data = json.loads(request.body)
        
        task = Task.objects.create(
            user=request.user,
            title=data.get('title', ''),
            description=data.get('description', ''),
            priority=data.get('priority', 'medium'),
            due_date=data.get('due_date') or None
        )
        
        # Notify n8n about new task (non-blocking)
        try:
            notify_task_created(task, request.user)
        except Exception as e:
            logger.warning(f"Failed to notify n8n: {e}")
        
        UserActivity.objects.create(user=request.user, activity_type='task_created', description=task.title)
        
        # Real-time mobile push notification
        notify_user(
            user=request.user,
            title="New Task Created",
            message=f"Task: {task.title}\nPriority: {task.priority.capitalize()}",
            tags=["clipboard", "task"]
        )
        
        # Real-time SMS text message
        send_sms(
            user=request.user,
            body=f"New Task Created: {task.title} (Priority: {task.priority.capitalize()})"
        )
        
        return JsonResponse({'success': True, 'task_id': task.id})
    except Exception as e:
        logger.error(f"Error creating task: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@login_required
@require_POST
def api_update_task(request, task_id):
    """API endpoint to update task"""
    task = get_object_or_404(Task, id=task_id, user=request.user)
    data = json.loads(request.body)
    
    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)
    task.priority = data.get('priority', task.priority)
    task.due_date = data.get('due_date') or task.due_date
    if 'kanban_status' in data:
        task.kanban_status = data['kanban_status']
    task.save()
    
    return JsonResponse({'success': True})


@login_required
@require_POST
def api_toggle_task(request, task_id):
    """API endpoint to toggle task completion with streak tracking"""
    from django.utils import timezone
    from datetime import date, timedelta
    
    task = get_object_or_404(Task, id=task_id, user=request.user)
    task.completed = not task.completed
    task.save()
    
    streak_info = None
    
    if task.completed:
        UserActivity.objects.create(user=request.user, activity_type='task_completed', description=task.title)
        
        # Update streak
        profile = request.user.profile
        today = date.today()
        
        if profile.last_task_date:
            days_diff = (today - profile.last_task_date).days
            
            if days_diff == 0:
                # Already completed today, just increment total
                pass
            elif days_diff == 1:
                # Consecutive day, increase streak
                profile.current_streak += 1
                if profile.current_streak > profile.longest_streak:
                    profile.longest_streak = profile.current_streak
            else:
                # Streak broken, reset to 1
                profile.current_streak = 1
        else:
            # First task ever
            profile.current_streak = 1
            profile.longest_streak = 1
        
        profile.last_task_date = today
        profile.total_tasks_completed += 1
        profile.save()
        
        # Real-time mobile push notification
        notify_user(
            user=request.user,
            title="Task Completed! 🎉",
            message=f"Awesome work finishing '{task.title}'. Current streak: {profile.current_streak} days!",
            tags=["tada", "check"]
        )
        
        # Real-time SMS text message
        send_sms(
            user=request.user,
            body=f"Task Completed! 🎉 Awesome work finishing '{task.title}'. Current streak: {profile.current_streak} days!"
        )
        profile.save()
        
        streak_info = {
            'current_streak': profile.current_streak,
            'longest_streak': profile.longest_streak,
            'total_completed': profile.total_tasks_completed
        }
    
    return JsonResponse({
        'success': True, 
        'completed': task.completed,
        'streak': streak_info
    })


@login_required
@require_POST
def api_delete_task(request, task_id):
    """API endpoint to delete task"""
    task = get_object_or_404(Task, id=task_id, user=request.user)
    task.delete()
    return JsonResponse({'success': True})


# ==================== CALENDAR VIEWS ====================

@login_required
def calendar_view(request):
    """Calendar view"""
    today = timezone.now().date()
    year = int(request.GET.get('year', today.year))
    month = int(request.GET.get('month', today.month))
    
    # Get events for the month
    start_date = datetime(year, month, 1).date()
    if month == 12:
        end_date = datetime(year + 1, 1, 1).date()
    else:
        end_date = datetime(year, month + 1, 1).date()
    
    events = CalendarEvent.objects.filter(
        user=request.user,
        date__gte=start_date,
        date__lt=end_date
    )
    
    context = {
        'year': year,
        'month': month,
        'events': events,
        'today': today,
    }
    
    return render(request, 'dashboard/calendar.html', context)


@login_required
def api_get_events(request):
    """API endpoint to get calendar events"""
    year = int(request.GET.get('year', timezone.now().year))
    month = int(request.GET.get('month', timezone.now().month))
    
    start_date = datetime(year, month, 1).date()
    if month == 12:
        end_date = datetime(year + 1, 1, 1).date()
    else:
        end_date = datetime(year, month + 1, 1).date()
    
    events = CalendarEvent.objects.filter(
        user=request.user,
        date__gte=start_date,
        date__lt=end_date
    ).values('id', 'title', 'description', 'date', 'time', 'all_day', 'color')
    
    return JsonResponse({'success': True, 'events': list(events)})


@login_required
@require_POST
def api_create_event(request):
    """API endpoint to create calendar event"""
    data = json.loads(request.body)
    
    event = CalendarEvent.objects.create(
        user=request.user,
        title=data.get('title', ''),
        description=data.get('description', ''),
        date=data.get('date'),
        time=data.get('time') or None,
        all_day=data.get('all_day', False),
        color=data.get('color', '#6366f1')
    )
    
    UserActivity.objects.create(user=request.user, activity_type='event_created', description=event.title)
    
    return JsonResponse({'success': True, 'event_id': event.id})


@login_required
@require_POST
def api_update_event(request, event_id):
    """API endpoint to update calendar event"""
    event = get_object_or_404(CalendarEvent, id=event_id, user=request.user)
    data = json.loads(request.body)
    
    event.title = data.get('title', event.title)
    event.description = data.get('description', event.description)
    event.date = data.get('date', event.date)
    event.time = data.get('time') or event.time
    event.all_day = data.get('all_day', event.all_day)
    event.color = data.get('color', event.color)
    event.save()
    
    return JsonResponse({'success': True})


@login_required
@require_POST
def api_delete_event(request, event_id):
    """API endpoint to delete calendar event"""
    event = get_object_or_404(CalendarEvent, id=event_id, user=request.user)
    event.delete()
    return JsonResponse({'success': True})


# ==================== FILE VIEWS ====================

@login_required
def files_view(request):
    """File manager view"""
    files = FileUpload.objects.filter(user=request.user).order_by('-uploaded_at')
    
    # Calculate storage used
    total_size = sum(f.file_size for f in files)
    
    context = {
        'files': files,
        'total_files': files.count(),
        'total_size': total_size,
    }
    
    return render(request, 'dashboard/files.html', context)


@login_required
def api_get_files(request):
    """API endpoint to get files"""
    files = FileUpload.objects.filter(user=request.user).values(
        'id', 'original_name', 'file_type', 'file_size', 'uploaded_at', 'description'
    ).order_by('-uploaded_at')
    return JsonResponse({'success': True, 'files': list(files)})


@login_required
@require_POST
def api_upload_file(request):
    """API endpoint to upload file with optional AI summary"""
    if 'file' not in request.FILES:
        return JsonResponse({'success': False, 'error': 'No file provided'})
    
    uploaded_file = request.FILES['file']
    generate_summary = request.POST.get('generate_summary', 'false').lower() == 'true'
    
    file_upload = FileUpload.objects.create(
        user=request.user,
        file=uploaded_file,
        original_name=uploaded_file.name,
        file_type=uploaded_file.content_type or 'application/octet-stream',
        file_size=uploaded_file.size,
        description=request.POST.get('description', '')
    )
    
    UserActivity.objects.create(
        user=request.user, 
        activity_type='file_uploaded', 
        description=file_upload.original_name
    )
    
    # Generate AI summary if requested
    summary = None
    task_created = False
    if generate_summary:
        try:
            summary = generate_file_summary(file_upload, request.user)
            # Create a task from the summary
            task = Task.objects.create(
                user=request.user,
                title=f"Review: {file_upload.original_name[:50]}",
                description=f"AI Summary:\n{summary[:500]}...",
                priority='medium',
                source='file_upload'
            )
            task_created = True
            
            # Notify n8n
            try:
                notify_file_uploaded(file_upload, request.user)
            except Exception as e:
                logger.warning(f"Failed to notify n8n: {e}")
                
        except Exception as e:
            logger.error(f"Failed to generate summary: {e}")
            summary = f"Error generating summary: {str(e)}"
    
    return JsonResponse({
        'success': True, 
        'file_id': file_upload.id,
        'file_name': file_upload.original_name,
        'summary': summary,
        'task_created': task_created
    })


@login_required
def api_download_file(request, file_id):
    """API endpoint to download file"""
    file_upload = get_object_or_404(FileUpload, id=file_id, user=request.user)
    
    response = FileResponse(file_upload.file)
    response['Content-Disposition'] = f'attachment; filename="{file_upload.original_name}"'
    return response


@login_required
@require_POST
def api_delete_file(request, file_id):
    """API endpoint to delete file"""
    file_upload = get_object_or_404(FileUpload, id=file_id, user=request.user)
    
    # Delete actual file
    if file_upload.file:
        file_upload.file.delete(save=False)
    
    file_upload.delete()
    return JsonResponse({'success': True})


# ==================== ASSISTANT VIEWS ====================

@login_required
def assistants_view(request):
    """AI Assistants view"""
    context = {
        'assistants': ASSISTANTS,
    }
    return render(request, 'dashboard/assistants.html', context)


@login_required
def explore_view(request):
    """Explore page - AI templates, use cases, and integrations"""
    
    # Get user's recent activity for personalization
    user_task_count = Task.objects.filter(user=request.user).count()
    user_chat_count = ChatSession.objects.filter(user=request.user).count()
    user_is_active = user_chat_count > 5 or user_task_count > 10
    
    # AI Templates/Prompts
    ai_templates = [
        {
            'id': 1,
            'title': 'Email Writer',
            'description': 'Draft professional emails with proper tone and structure',
            'icon': 'fa-envelope',
            'category': 'Writing',
            'prompt': 'Help me write a professional email to [recipient] about [topic]. The tone should be [formal/casual/friendly].',
            'popularity': 95,
            'difficulty': 'Beginner',
            'time_to_complete': '2 min',
            'featured': True
        },
        {
            'id': 2,
            'title': 'Code Reviewer',
            'description': 'Get code reviews and improvement suggestions',
            'icon': 'fa-code',
            'category': 'Development',
            'prompt': 'Please review this code and suggest improvements:\n\n[Paste your code here]',
            'popularity': 88,
            'difficulty': 'Intermediate',
            'time_to_complete': '5 min',
            'featured': True
        },
        {
            'id': 3,
            'title': 'Meeting Summarizer',
            'description': 'Summarize meeting notes into actionable items',
            'icon': 'fa-users',
            'category': 'Productivity',
            'prompt': 'Summarize these meeting notes and extract action items:\n\n[Paste meeting notes]',
            'popularity': 92,
            'difficulty': 'Beginner',
            'time_to_complete': '3 min',
            'featured': False
        },
        {
            'id': 4,
            'title': 'Content Creator',
            'description': 'Generate blog posts, social media content, and marketing copy',
            'icon': 'fa-pen-fancy',
            'category': 'Marketing',
            'prompt': 'Create engaging content about [topic] for [platform/audience]. Include key points and call-to-action.',
            'popularity': 85,
            'difficulty': 'Intermediate',
            'time_to_complete': '10 min',
            'featured': True
        },
        {
            'id': 5,
            'title': 'Data Analyst',
            'description': 'Analyze data and generate insights',
            'icon': 'fa-chart-line',
            'category': 'Analytics',
            'prompt': 'Analyze this data and provide insights:\n\n[Describe or paste your data]',
            'popularity': 78,
            'difficulty': 'Advanced',
            'time_to_complete': '15 min',
            'featured': False
        },
        {
            'id': 6,
            'title': 'Learning Assistant',
            'description': 'Learn new concepts with explanations and examples',
            'icon': 'fa-graduation-cap',
            'category': 'Education',
            'prompt': 'Explain [concept/topic] to me in simple terms with practical examples.',
            'popularity': 90,
            'difficulty': 'Beginner',
            'time_to_complete': '5 min',
            'featured': False
        },
        {
            'id': 7,
            'title': 'Resume Builder',
            'description': 'Create ATS-friendly resumes and cover letters',
            'icon': 'fa-file-alt',
            'category': 'Career',
            'prompt': 'Help me create a professional resume for [job title] position. My experience: [list your experience]',
            'popularity': 82,
            'difficulty': 'Intermediate',
            'time_to_complete': '20 min',
            'featured': True
        },
        {
            'id': 8,
            'title': 'Business Plan Generator',
            'description': 'Create comprehensive business plans and strategies',
            'icon': 'fa-briefcase',
            'category': 'Business',
            'prompt': 'Create a business plan for [business idea]. Include market analysis, revenue model, and growth strategy.',
            'popularity': 75,
            'difficulty': 'Advanced',
            'time_to_complete': '30 min',
            'featured': False
        },
        {
            'id': 9,
            'title': 'Social Media Manager',
            'description': 'Plan and schedule social media content calendars',
            'icon': 'fa-share-alt',
            'category': 'Marketing',
            'prompt': 'Create a 7-day social media content calendar for [brand/business] on [platforms].',
            'popularity': 87,
            'difficulty': 'Intermediate',
            'time_to_complete': '8 min',
            'featured': False
        },
        {
            'id': 10,
            'title': 'SQL Query Builder',
            'description': 'Generate complex SQL queries from natural language',
            'icon': 'fa-database',
            'category': 'Development',
            'prompt': 'Create a SQL query to [describe what data you need]. Database schema: [describe tables]',
            'popularity': 80,
            'difficulty': 'Intermediate',
            'time_to_complete': '5 min',
            'featured': True
        },
        {
            'id': 11,
            'title': 'Legal Document Analyzer',
            'description': 'Review contracts and legal documents for key clauses',
            'icon': 'fa-gavel',
            'category': 'Legal',
            'prompt': 'Analyze this legal document and highlight important clauses, risks, and obligations:\n\n[Paste document]',
            'popularity': 73,
            'difficulty': 'Advanced',
            'time_to_complete': '15 min',
            'featured': False
        },
        {
            'id': 12,
            'title': 'Fitness Coach',
            'description': 'Create personalized workout and nutrition plans',
            'icon': 'fa-dumbbell',
            'category': 'Health',
            'prompt': 'Create a [duration] workout plan for [goal]. My current fitness level: [beginner/intermediate/advanced]',
            'popularity': 84,
            'difficulty': 'Beginner',
            'time_to_complete': '10 min',
            'featured': False
        },
    ]
    
    # Use Cases
    use_cases = [
        {
            'id': 1,
            'title': 'Automate Daily Reports',
            'description': 'Generate daily status reports automatically from your tasks and calendar',
            'icon': 'fa-file-alt',
            'color': '#6366f1',
            'difficulty': 'Easy',
            'time_saved': '2 hours/day'
        },
        {
            'id': 2,
            'title': 'Smart Task Management',
            'description': 'Let AI prioritize and organize your tasks based on deadlines and importance',
            'icon': 'fa-tasks',
            'color': '#10b981',
            'difficulty': 'Easy',
            'time_saved': '1.5 hours/day'
        },
        {
            'id': 3,
            'title': 'Meeting Preparation',
            'description': 'Auto-generate meeting agendas and prepare talking points',
            'icon': 'fa-calendar-check',
            'color': '#f59e0b',
            'difficulty': 'Medium',
            'time_saved': '45 min/meeting'
        },
        {
            'id': 4,
            'title': 'Research Assistant',
            'description': 'Gather information and summarize research on any topic',
            'icon': 'fa-search',
            'color': '#ef4444',
            'difficulty': 'Medium',
            'time_saved': '3 hours/research'
        },
        {
            'id': 5,
            'title': 'Customer Support Automation',
            'description': 'Draft responses to common customer inquiries instantly',
            'icon': 'fa-headset',
            'color': '#8b5cf6',
            'difficulty': 'Easy',
            'time_saved': '4 hours/day'
        },
        {
            'id': 6,
            'title': 'Content Repurposing',
            'description': 'Transform one piece of content into multiple formats',
            'icon': 'fa-sync-alt',
            'color': '#ec4899',
            'difficulty': 'Advanced',
            'time_saved': '5 hours/week'
        },
    ]
    
    # Integrations
    integrations = [
        {
            'id': 'google_calendar',
            'name': 'Google Calendar',
            'description': 'Sync events and manage your schedule',
            'icon': 'fa-calendar',
            'status': 'connected' if request.user.profile.google_calendar_connected else 'available',
            'color': '#4285f4',
            'category': 'Productivity'
        },
        {
            'id': 'slack',
            'name': 'Slack',
            'description': 'Send notifications and updates to Slack channels',
            'icon': 'fa-slack',
            'status': 'available',
            'color': '#4a154b',
            'category': 'Communication'
        },
        {
            'id': 'notion',
            'name': 'Notion',
            'description': 'Sync tasks and notes with Notion workspace',
            'icon': 'fa-sticky-note',
            'status': 'available',
            'color': '#000000',
            'category': 'Productivity'
        },
        {
            'id': 'github',
            'name': 'GitHub',
            'description': 'Track issues, PRs, and repository activity',
            'icon': 'fa-github',
            'status': 'available',
            'color': '#333333',
            'category': 'Development'
        },
        {
            'id': 'trello',
            'name': 'Trello',
            'description': 'Manage boards and cards from Trello',
            'icon': 'fa-trello',
            'status': 'available',
            'color': '#0079bf',
            'category': 'Project Management'
        },
        {
            'id': 'zapier',
            'name': 'Zapier',
            'description': 'Connect with 5000+ apps through Zapier',
            'icon': 'fa-bolt',
            'status': 'available',
            'color': '#ff4a00',
            'category': 'Automation'
        },
        {
            'id': 'microsoft_teams',
            'name': 'Microsoft Teams',
            'description': 'Integrate with Teams meetings and chats',
            'icon': 'fa-microsoft',
            'status': 'available',
            'color': '#6264a7',
            'category': 'Communication'
        },
        {
            'id': 'dropbox',
            'name': 'Dropbox',
            'description': 'Access and manage files from Dropbox',
            'icon': 'fa-dropbox',
            'status': 'available',
            'color': '#0061fe',
            'category': 'Storage'
        },
    ]
    
    # Advanced Features / Workflows
    workflows = [
        {
            'id': 1,
            'title': 'Morning Briefing Automation',
            'description': 'Get a personalized morning briefing with weather, calendar, tasks, and news',
            'icon': 'fa-sun',
            'steps': 4,
            'complexity': 'Intermediate',
            'features': ['Weather API', 'Calendar Sync', 'Task Summary', 'News Feed']
        },
        {
            'id': 2,
            'title': 'Weekly Report Generator',
            'description': 'Automatically compile weekly progress reports from tasks and activities',
            'icon': 'fa-chart-bar',
            'steps': 3,
            'complexity': 'Advanced',
            'features': ['Data Aggregation', 'Template Engine', 'PDF Export', 'Email Delivery']
        },
        {
            'id': 3,
            'title': 'Smart Email Sorting',
            'description': 'AI-powered email categorization and priority inbox management',
            'icon': 'fa-inbox',
            'steps': 5,
            'complexity': 'Advanced',
            'features': ['NLP Classification', 'Priority Scoring', 'Auto-labeling', 'Smart Filters']
        },
        {
            'id': 4,
            'title': 'Knowledge Base Builder',
            'description': 'Automatically organize notes and documents into searchable knowledge base',
            'icon': 'fa-database',
            'steps': 6,
            'complexity': 'Expert',
            'features': ['Document Parsing', 'Semantic Search', 'Auto-tagging', 'Relationship Mapping']
        },
    ]
    
    # AI Tools & Capabilities
    ai_capabilities = [
        {
            'id': 1,
            'name': 'Natural Language Processing',
            'description': 'Understand and process human language with high accuracy',
            'icon': 'fa-language',
            'use_cases': ['Sentiment Analysis', 'Text Classification', 'Entity Recognition'],
            'badge': 'Core'
        },
        {
            'id': 2,
            'name': 'Code Generation',
            'description': 'Write, debug, and optimize code in multiple programming languages',
            'icon': 'fa-laptop-code',
            'use_cases': ['Python', 'JavaScript', 'HTML/CSS', 'SQL'],
            'badge': 'Popular'
        },
        {
            'id': 3,
            'name': 'Image Analysis',
            'description': 'Extract information and insights from images',
            'icon': 'fa-image',
            'use_cases': ['OCR', 'Object Detection', 'Scene Understanding'],
            'badge': 'Beta'
        },
        {
            'id': 4,
            'name': 'Voice Commands',
            'description': 'Control the platform using voice instructions',
            'icon': 'fa-microphone',
            'use_cases': ['Task Creation', 'Quick Actions', 'Dictation'],
            'badge': 'New'
        },
    ]
    
    # Community Resources
    community_resources = [
        {
            'id': 1,
            'title': 'Prompt Engineering Guide',
            'type': 'Tutorial',
            'description': 'Master the art of writing effective prompts',
            'icon': 'fa-book',
            'duration': '30 min',
            'level': 'Beginner'
        },
        {
            'id': 2,
            'title': 'API Documentation',
            'type': 'Documentation',
            'description': 'Complete API reference for developers',
            'icon': 'fa-code',
            'duration': 'Reference',
            'level': 'Developer'
        },
        {
            'id': 3,
            'title': 'Best Practices Webinar',
            'type': 'Video',
            'description': 'Learn from AI experts and power users',
            'icon': 'fa-video',
            'duration': '1 hour',
            'level': 'All Levels'
        },
        {
            'id': 4,
            'title': 'Community Forum',
            'type': 'Community',
            'description': 'Connect with other users and share tips',
            'icon': 'fa-users',
            'duration': 'Ongoing',
            'level': 'All Levels'
        },
    ]
    
    # Trending Now (based on popularity and recent usage)
    trending_templates = [t for t in ai_templates if t['popularity'] >= 85][:5]
    
    # Personalized Recommendations based on user activity
    if user_is_active:
        recommended_templates = [t for t in ai_templates if t['difficulty'] in ['Intermediate', 'Advanced']][:4]
    else:
        recommended_templates = [t for t in ai_templates if t['difficulty'] == 'Beginner'][:4]
    
    # Featured Templates
    featured_templates = [t for t in ai_templates if t.get('featured', False)]
    
    # Platform Stats
    platform_stats = {
        'total_templates': len(ai_templates),
        'total_workflows': len(workflows),
        'total_integrations': len(integrations),
        'active_users': 1247,  # Could be from database
        'tasks_created_today': 342,
        'time_saved_hours': 15680
    }
    
    # Interactive Demos
    interactive_demos = [
        {
            'id': 1,
            'title': 'Try AI Writing',
            'description': 'Experience AI-powered content generation live',
            'icon': 'fa-pen-nib',
            'demo_type': 'writing',
            'color': '#6366f1'
        },
        {
            'id': 2,
            'title': 'Test Code Generation',
            'description': 'See AI write code in real-time',
            'icon': 'fa-terminal',
            'demo_type': 'coding',
            'color': '#10b981'
        },
        {
            'id': 3,
            'title': 'Try Task Automation',
            'description': 'Watch AI create and organize tasks',
            'icon': 'fa-magic',
            'demo_type': 'automation',
            'color': '#f59e0b'
        },
    ]
    
    # Success Stories / Testimonials
    success_stories = [
        {
            'id': 1,
            'user': 'Sarah K.',
            'role': 'Product Manager',
            'story': 'Saved 10+ hours per week on meeting summaries and reports',
            'avatar': 'SK',
            'rating': 5,
            'template_used': 'Meeting Summarizer'
        },
        {
            'id': 2,
            'user': 'Mike R.',
            'role': 'Software Developer',
            'story': 'Code reviewer caught bugs I would have missed. Game changer!',
            'avatar': 'MR',
            'rating': 5,
            'template_used': 'Code Reviewer'
        },
        {
            'id': 3,
            'user': 'Emily T.',
            'role': 'Marketing Director',
            'story': 'Content creator template 3x our social media output',
            'avatar': 'ET',
            'rating': 5,
            'template_used': 'Content Creator'
        },
    ]
    
    # Quick Actions
    quick_actions = [
        {
            'id': 1,
            'title': 'Create Task via Chat',
            'description': 'Use natural language to create tasks instantly',
            'icon': 'fa-plus-circle',
            'action_url': 'chat',
            'color': '#6366f1'
        },
        {
            'id': 2,
            'title': 'Start New Project',
            'description': 'Set up a complete project with AI assistance',
            'icon': 'fa-folder-plus',
            'action_url': 'tasks',
            'color': '#10b981'
        },
        {
            'id': 3,
            'title': 'Schedule Meeting',
            'description': 'AI finds best time and sends invites',
            'icon': 'fa-calendar-plus',
            'action_url': 'calendar',
            'color': '#f59e0b'
        },
        {
            'id': 4,
            'title': 'Generate Report',
            'description': 'Create weekly/monthly progress reports',
            'icon': 'fa-file-export',
            'action_url': 'chat',
            'color': '#ef4444'
        },
    ]
    
    # Challenges & Achievements
    challenges = [
        {
            'id': 1,
            'title': 'Prompt Master',
            'description': 'Use 10 different templates this week',
            'icon': 'fa-trophy',
            'progress': 0,
            'target': 10,
            'reward': 'Expert Badge',
            'difficulty': 'Intermediate'
        },
        {
            'id': 2,
            'title': 'Automation Expert',
            'description': 'Complete your first workflow automation',
            'icon': 'fa-robot',
            'progress': 0,
            'target': 1,
            'reward': 'Automation Badge',
            'difficulty': 'Advanced'
        },
        {
            'id': 3,
            'title': 'Integration Pioneer',
            'description': 'Connect 3 external tools',
            'icon': 'fa-plug',
            'progress': 1 if request.user.profile.google_calendar_connected else 0,
            'target': 3,
            'reward': 'Integration Badge',
            'difficulty': 'Beginner'
        },
    ]
    
    context = {
        'ai_templates': ai_templates,
        'use_cases': use_cases,
        'integrations': integrations,
        'workflows': workflows,
        'ai_capabilities': ai_capabilities,
        'community_resources': community_resources,
        'trending_templates': trending_templates,
        'recommended_templates': recommended_templates,
        'featured_templates': featured_templates,
        'platform_stats': platform_stats,
        'interactive_demos': interactive_demos,
        'success_stories': success_stories,
        'quick_actions': quick_actions,
        'challenges': challenges,
        'user_is_active': user_is_active,
    }
    return render(request, 'dashboard/explore.html', context)


@login_required
def api_get_assistants(request):
    """API endpoint to get available assistants"""
    return JsonResponse({'success': True, 'assistants': ASSISTANTS})


@login_required
@require_POST
def api_set_assistant(request):
    """API endpoint to set assistant for session"""
    data = json.loads(request.body)
    session_id = data.get('session_id')
    assistant_type = data.get('assistant_type', 'general')
    
    session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    session.assistant_type = assistant_type
    session.save()
    
    return JsonResponse({'success': True})


# ==================== ANALYTICS VIEWS ====================

@login_required
def analytics_view(request):
    """Analytics dashboard view"""
    context = {
        'total_chats': ChatSession.objects.filter(user=request.user).count(),
        'total_messages': ChatMessage.objects.filter(session__user=request.user).count(),
        'total_tasks': Task.objects.filter(user=request.user).count(),
        'completed_tasks': Task.objects.filter(user=request.user, completed=True).count(),
        'total_events': CalendarEvent.objects.filter(user=request.user).count(),
        'total_files': FileUpload.objects.filter(user=request.user).count(),
    }
    return render(request, 'dashboard/analytics.html', context)


@login_required
def api_get_stats(request):
    """API endpoint to get user statistics"""
    stats = {
        'total_chats': ChatSession.objects.filter(user=request.user).count(),
        'total_messages': ChatMessage.objects.filter(session__user=request.user).count(),
        'active_sessions': ChatSession.objects.filter(user=request.user, is_active=True).count(),
        'total_tasks': Task.objects.filter(user=request.user).count(),
        'completed_tasks': Task.objects.filter(user=request.user, completed=True).count(),
        'pending_tasks': Task.objects.filter(user=request.user, completed=False).count(),
        'total_events': CalendarEvent.objects.filter(user=request.user).count(),
        'upcoming_events': CalendarEvent.objects.filter(
            user=request.user, 
            date__gte=timezone.now().date()
        ).count(),
        'total_files': FileUpload.objects.filter(user=request.user).count(),
        'recent_activities': list(UserActivity.objects.filter(user=request.user)[:10].values(
            'activity_type', 'description', 'created_at'
        ))
    }
    return JsonResponse({'success': True, 'stats': stats})


@login_required
def api_get_analytics_detailed(request):
    """API endpoint to get detailed daily task completion stats for the last 7 days"""
    from django.db.models.functions import TruncDate
    
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=6)
    
    # Get completed tasks count per day
    daily_stats = Task.objects.filter(
        user=request.user,
        completed=True,
        updated_at__date__gte=start_date,
        updated_at__date__lte=end_date
    ).annotate(date=TruncDate('updated_at')).values('date').annotate(count=Count('id')).order_by('date')
    
    # Fill in zeros for days with no activity
    stats_map = {stat['date']: stat['count'] for stat in daily_stats}
    labels = []
    data = []
    
    for i in range(7):
        current_date = start_date + timedelta(days=i)
        labels.append(current_date.strftime('%a'))
        data.append(stats_map.get(current_date, 0))
        
    return JsonResponse({
        'success': True,
        'labels': labels,
        'data': data
    })



# ==================== SETTINGS VIEWS ====================

@login_required
def settings_view(request):
    """Settings view"""
    return render(request, 'dashboard/settings.html')


@login_required
@require_POST
def api_update_settings(request):
    """API endpoint to update user settings"""
    data = json.loads(request.body)
    profile = request.user.profile
    
    if 'groq_api_key' in data:
        profile.groq_api_key = data['groq_api_key']
    
    profile.save()
    return JsonResponse({'success': True})


@login_required
@require_POST
def api_update_theme(request):
    """API endpoint to update theme preference"""
    data = json.loads(request.body)
    profile = request.user.profile
    profile.theme_preference = data.get('theme', 'dark')
    profile.save()
    return JsonResponse({'success': True})


# ==================== n8n WEBHOOK ENDPOINTS ====================

@csrf_exempt
@require_POST
def n8n_task_webhook(request):
    """
    Webhook endpoint for n8n to create tasks
    n8n sends: {"title": "...", "description": "...", "due_date": "...", "priority": "...", "user_id": 1}
    """
    try:
        # Verify webhook secret
        secret = request.headers.get('X-Webhook-Secret')
        if secret != settings.N8N_WEBHOOK_SECRET:
            return JsonResponse({'success': False, 'error': 'Invalid secret'}, status=401)
        
        data = json.loads(request.body)
        
        # Get user
        user_id = data.get('user_id')
        if not user_id:
            return JsonResponse({'success': False, 'error': 'user_id required'}, status=400)
        
        user = get_object_or_404(User, id=user_id)
        
        # Create task
        task = Task.objects.create(
            user=user,
            title=data.get('title', 'New Task'),
            description=data.get('description', ''),
            due_date=data.get('due_date'),
            priority=data.get('priority', 'medium'),
            source='n8n_automation'
        )
        
        # Log activity
        UserActivity.objects.create(
            user=user,
            activity_type='task_created',
            description=f'Task "{task.title}" created via n8n automation'
        )
        
        return JsonResponse({
            'success': True,
            'task_id': task.id,
            'message': 'Task created successfully'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.error(f"n8n webhook error: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@require_POST
def n8n_reminder_webhook(request):
    """
    Webhook endpoint for n8n to send reminders
    n8n sends: {"task_id": 1, "user_id": 1, "reminder_type": "24h_before"}
    """
    try:
        # Verify webhook secret
        secret = request.headers.get('X-Webhook-Secret')
        if secret != settings.N8N_WEBHOOK_SECRET:
            return JsonResponse({'success': False, 'error': 'Invalid secret'}, status=401)
        
        data = json.loads(request.body)
        
        task_id = data.get('task_id')
        user_id = data.get('user_id')
        
        if not task_id or not user_id:
            return JsonResponse({'success': False, 'error': 'task_id and user_id required'}, status=400)
        
        task = get_object_or_404(Task, id=task_id, user_id=user_id)
        
        # Here you could send email, push notification, etc.
        # For now, we just log it
        UserActivity.objects.create(
            user_id=user_id,
            activity_type='reminder_sent',
            description=f'Reminder for task "{task.title}" ({data.get("reminder_type", "default")})'
        )
        
        return JsonResponse({
            'success': True,
            'message': f'Reminder sent for task: {task.title}'
        })
        
    except Exception as e:
        logger.error(f"n8n reminder webhook error: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@require_POST
def n8n_file_summary_webhook(request):
    """
    Webhook endpoint for n8n to create tasks from file summaries
    n8n sends: {"user_id": 1, "file_id": 1, "summary": "...", "action_items": [...]}
    """
    try:
        # Verify webhook secret
        secret = request.headers.get('X-Webhook-Secret')
        if secret != settings.N8N_WEBHOOK_SECRET:
            return JsonResponse({'success': False, 'error': 'Invalid secret'}, status=401)
        
        data = json.loads(request.body)
        
        user_id = data.get('user_id')
        file_id = data.get('file_id')
        action_items = data.get('action_items', [])
        
        if not user_id:
            return JsonResponse({'success': False, 'error': 'user_id required'}, status=400)
        
        user = get_object_or_404(User, id=user_id)
        file_upload = None
        if file_id:
            file_upload = get_object_or_404(FileUpload, id=file_id, user=user)
        
        # Create tasks from action items
        created_tasks = []
        for item in action_items:
            task = Task.objects.create(
                user=user,
                title=item.get('title', 'Action Item'),
                description=f"From file: {file_upload.filename if file_upload else 'Unknown'}\n\n{item.get('description', '')}",
                priority=item.get('priority', 'medium'),
                source='file_ai_summary'
            )
            created_tasks.append({'id': task.id, 'title': task.title})
        
        return JsonResponse({
            'success': True,
            'tasks_created': len(created_tasks),
            'tasks': created_tasks
        })
        
    except Exception as e:
        logger.error(f"n8n file summary webhook error: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


# ==================== SEARCH API ====================

@login_required
def api_search(request):
    """Global search across tasks, files, chats, and calendar events"""
    query = request.GET.get('q', '').strip()
    
    if not query or len(query) < 2:
        return JsonResponse({'success': True, 'results': []})
    
    try:
        results = []
        user = request.user
        
        # Search Tasks
        tasks = Task.objects.filter(
            user=user,
            title__icontains=query
        ) | Task.objects.filter(
            user=user,
            description__icontains=query
        )
        
        for task in tasks[:5]:
            results.append({
                'type': 'task',
                'id': task.id,
                'title': task.title,
                'description': task.description[:100] if task.description else '',
                'url': '/tasks/',
                'icon': 'fa-check-circle',
                'color': '#10b981'
            })
        
        # Search Files
        files = FileUpload.objects.filter(
            user=user,
            original_name__icontains=query
        ) | FileUpload.objects.filter(
            user=user,
            description__icontains=query
        )
        
        for file in files[:5]:
            results.append({
                'type': 'file',
                'id': file.id,
                'title': file.original_name,
                'description': file.description[:100] if file.description else '',
                'url': '/files/',
                'icon': 'fa-file',
                'color': '#3b82f6'
            })
        
        # Search Chat Sessions
        sessions = ChatSession.objects.filter(
            user=user,
            title__icontains=query
        )
        
        for session in sessions[:5]:
            results.append({
                'type': 'chat',
                'id': session.id,
                'title': session.title,
                'description': f'Chat session • {session.created_at.strftime("%b %d, %Y")}',
                'url': f'/chat/{session.id}/',
                'icon': 'fa-comments',
                'color': '#6366f1'
            })
        
        # Search Calendar Events
        events = CalendarEvent.objects.filter(
            user=user,
            title__icontains=query
        ) | CalendarEvent.objects.filter(
            user=user,
            description__icontains=query
        )
        
        for event in events[:5]:
            results.append({
                'type': 'event',
                'id': event.id,
                'title': event.title,
                'description': f'{event.date.strftime("%b %d, %Y")} • {event.description[:50] if event.description else ""}',
                'url': '/calendar/',
                'icon': 'fa-calendar',
                'color': '#f59e0b'
            })
        
        return JsonResponse({
            'success': True,
            'query': query,
            'results': results,
            'total': len(results)
        })
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


# ==================== GOOGLE CALENDAR INTEGRATION ====================

@login_required
def google_calendar_auth(request):
    """Initiate Google Calendar OAuth flow"""
    from .services.google_calendar_service import GoogleCalendarService
    
    result = GoogleCalendarService.get_auth_url(request.user)
    
    if result['success']:
        return redirect(result['auth_url'])
    else:
        messages.error(request, f"Failed to connect Google Calendar: {result.get('error', 'Unknown error')}")
        return redirect('settings')


@login_required
def google_calendar_callback(request):
    """Handle Google Calendar OAuth callback"""
    from .services.google_calendar_service import GoogleCalendarService
    
    code = request.GET.get('code')
    error = request.GET.get('error')
    
    if error:
        messages.error(request, f"Google Calendar authorization failed: {error}")
        return redirect('settings')
    
    if not code:
        messages.error(request, "Authorization code not received")
        return redirect('settings')
    
    result = GoogleCalendarService.exchange_code(code, request.user)
    
    if result['success']:
        messages.success(request, "Google Calendar connected successfully!")
    else:
        messages.error(request, f"Failed to connect: {result.get('error', 'Unknown error')}")
    
    return redirect('settings')


@login_required
def google_calendar_disconnect(request):
    """Disconnect Google Calendar"""
    from .services.google_calendar_service import GoogleCalendarService
    
    result = GoogleCalendarService.disconnect(request.user)
    
    if result['success']:
        messages.success(request, "Google Calendar disconnected")
    else:
        messages.error(request, "Failed to disconnect")
    
    return redirect('settings')


@login_required
def api_google_calendar_events(request):
    """API endpoint to fetch Google Calendar events"""
    from .services.google_calendar_service import GoogleCalendarService
    
    result = GoogleCalendarService.get_calendar_events(request.user)
    return JsonResponse(result)


@login_required
@require_POST
def api_google_calendar_create_event(request):
    """API endpoint to create Google Calendar event"""
    from .services.google_calendar_service import GoogleCalendarService
    from datetime import datetime
    
    try:
        data = json.loads(request.body)
        
        title = data.get('title')
        description = data.get('description', '')
        start_time = datetime.fromisoformat(data.get('start_time'))
        end_time = datetime.fromisoformat(data.get('end_time'))
        
        result = GoogleCalendarService.create_calendar_event(
            request.user, title, description, start_time, end_time
        )
        
        return JsonResponse(result)
        
    except Exception as e:
        logger.error(f"Error creating calendar event: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=400)
