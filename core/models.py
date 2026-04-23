"""
Core models for AI SaaS Dashboard
"""
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import os


class UserProfile(models.Model):
    """Extended user profile with additional settings"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', default='avatars/default.png')
    theme_preference = models.CharField(max_length=10, default='dark', choices=[
        ('dark', 'Dark'),
        ('light', 'Light'),
        ('auto', 'Auto')
    ])
    groq_api_key = models.CharField(max_length=255, blank=True, null=True)
    
    # Streak tracking
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_task_date = models.DateField(null=True, blank=True)
    total_tasks_completed = models.PositiveIntegerField(default=0)
    
    # Google Calendar integration
    google_calendar_token = models.TextField(null=True, blank=True)
    google_calendar_connected = models.BooleanField(default=False)
    google_calendar_email = models.EmailField(null=True, blank=True)
    
    # Mobile Push Notifications (via ntfy.sh)
    # Mobile Push Notifications (via ntfy.sh)
    mobile_push_topic = models.CharField(max_length=100, blank=True, null=True, help_text="Secret ntfy.sh topic for phone notifications")
    
    # SMS Notifications (via Twilio)
    phone_number = models.CharField(max_length=20, blank=True, null=True, help_text="Your phone number including country code (e.g. +1234567890)")
    twilio_account_sid = models.CharField(max_length=255, blank=True, null=True)
    twilio_auth_token = models.CharField(max_length=255, blank=True, null=True)
    twilio_from_number = models.CharField(max_length=20, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    class Meta:
        db_table = 'user_profiles'


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create user profile when user is created"""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save user profile when user is saved"""
    instance.profile.save()


class ChatSession(models.Model):
    """Chat session for organizing conversations"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions')
    title = models.CharField(max_length=200, default='New Chat')
    assistant_type = models.CharField(max_length=20, default='general', choices=[
        ('general', 'General AI'),
        ('coding', 'Coding Assistant'),
        ('study', 'Study Assistant'),
        ('resume', 'Resume Builder')
    ])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.title}"

    class Meta:
        db_table = 'chat_sessions'
        ordering = ['-updated_at']


class ChatMessage(models.Model):
    """Individual chat messages"""
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System')
    ]

    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    tokens_used = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.session.title} - {self.role}"

    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']


class Task(models.Model):
    """User tasks with priority and due dates"""
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High')
    ]

    SOURCE_CHOICES = [
        ('manual', 'Manual'),
        ('chat', 'Chat'),
        ('file_upload', 'File Upload'),
        ('n8n', 'n8n Automation')
    ]

    CATEGORY_CHOICES = [
        ('work', 'Work'),
        ('personal', 'Personal'),
        ('health', 'Health'),
        ('learning', 'Learning'),
        ('shopping', 'Shopping'),
        ('other', 'Other')
    ]

    KANBAN_STATUS_CHOICES = [
        ('backlog', 'Backlog'),
        ('planner', 'AI Planner'),
        ('executor', 'AI Executor'),
        ('done', 'Done')
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    completed = models.BooleanField(default=False)
    priority = models.CharField(max_length=10, default='medium', choices=PRIORITY_CHOICES)
    kanban_status = models.CharField(max_length=20, default='backlog', choices=KANBAN_STATUS_CHOICES)
    category = models.CharField(max_length=20, default='other', choices=CATEGORY_CHOICES)
    tags = models.JSONField(default=list, blank=True, help_text="List of tags")
    due_date = models.DateTimeField(null=True, blank=True)
    estimated_time = models.PositiveIntegerField(null=True, blank=True, help_text="Estimated time in minutes")
    actual_time = models.PositiveIntegerField(null=True, blank=True, help_text="Actual time spent in minutes")
    source = models.CharField(max_length=20, default='manual', choices=SOURCE_CHOICES)
    email_notification = models.BooleanField(default=True, help_text="Send email notifications for this task")
    parent_task = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='subtasks', help_text="Parent task for subtasks")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']


class CalendarEvent(models.Model):
    """Calendar events for scheduling"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calendar_events')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)
    all_day = models.BooleanField(default=False)
    color = models.CharField(max_length=7, default='#6366f1')  # Hex color
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.date}"

    class Meta:
        db_table = 'calendar_events'
        ordering = ['date', 'time']


class FileUpload(models.Model):
    """User file uploads"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploads')
    file = models.FileField(upload_to='uploads/%Y/%m/')
    original_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size = models.BigIntegerField()
    description = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.original_name

    def filename(self):
        return os.path.basename(self.file.name)

    def get_file_extension(self):
        return os.path.splitext(self.original_name)[1].lower()

    def is_image(self):
        return self.file_type.startswith('image/')

    class Meta:
        db_table = 'file_uploads'
        ordering = ['-uploaded_at']


class UserActivity(models.Model):
    """Track user activity for analytics"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=50, choices=[
        ('login', 'Login'),
        ('chat', 'Chat Message'),
        ('task_created', 'Task Created'),
        ('task_completed', 'Task Completed'),
        ('file_uploaded', 'File Uploaded'),
        ('event_created', 'Event Created')
    ])
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.activity_type}"

    class Meta:
        db_table = 'user_activities'
        ordering = ['-created_at']


# ==================== ADVANCED FEATURES (V2) ====================

class SmartSuggestion(models.Model):
    """AI-powered smart task suggestions based on user patterns"""
    CATEGORY_CHOICES = [
        ('productivity', 'Productivity'),
        ('health', 'Health & Wellness'),
        ('learning', 'Learning & Development'),
        ('work', 'Work Tasks'),
        ('personal', 'Personal Growth'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='suggestions')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    priority = models.CharField(max_length=10, default='medium', choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ])
    estimated_time = models.PositiveIntegerField(help_text="Estimated time in minutes", default=30)
    is_accepted = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    suggestion_reason = models.TextField(blank=True, help_text="Why this was suggested")
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.user.username}"

    class Meta:
        db_table = 'smart_suggestions'
        ordering = ['-created_at']


class PomodoroSession(models.Model):
    """Pomodoro timer focus sessions"""
    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('interrupted', 'Interrupted'),
        ('abandoned', 'Abandoned'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pomodoro_sessions')
    duration_minutes = models.PositiveIntegerField(default=25)
    break_duration_minutes = models.PositiveIntegerField(default=5)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    task_title = models.CharField(max_length=255, blank=True, help_text="What you worked on")
    interruptions_count = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    started_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def actual_duration(self):
        if self.completed_at:
            return int((self.completed_at - self.started_at).total_seconds() / 60)
        return 0

    def __str__(self):
        return f"{self.user.username} - {self.duration_minutes}min session"

    class Meta:
        db_table = 'pomodoro_sessions'
        ordering = ['-started_at']


class DailyHabit(models.Model):
    """Daily habit tracking with streak system"""
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekdays', 'Weekdays Only'),
        ('custom', 'Custom Days'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='habits')
    name = models.CharField(max_length=255)
    icon = models.CharField(max_length=50, default='✅', help_text="Emoji icon")
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    custom_days = models.CharField(max_length=50, blank=True, help_text="Comma-separated days (0-6)")
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    total_completions = models.PositiveIntegerField(default=0)
    target_per_week = models.PositiveIntegerField(default=7)
    reminder_time = models.TimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.user.username}"

    class Meta:
        db_table = 'daily_habits'
        ordering = ['name']


class HabitCompletion(models.Model):
    """Track individual habit completions"""
    habit = models.ForeignKey(DailyHabit, on_delete=models.CASCADE, related_name='completions')
    date = models.DateField()
    completed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'habit_completions'
        unique_together = ['habit', 'date']
        ordering = ['-date']


class ProductivityMetric(models.Model):
    """Daily productivity metrics for analytics"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='metrics')
    date = models.DateField()
    tasks_completed = models.PositiveIntegerField(default=0)
    pomodoro_sessions = models.PositiveIntegerField(default=0)
    focus_minutes = models.PositiveIntegerField(default=0)
    habits_completed = models.PositiveIntegerField(default=0)
    productivity_score = models.FloatField(default=0.0, help_text="0-100 score")
    mood_rating = models.PositiveIntegerField(null=True, blank=True, help_text="1-5 rating")
    energy_level = models.PositiveIntegerField(null=True, blank=True, help_text="1-10 level")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.date}"

    class Meta:
        db_table = 'productivity_metrics'
        unique_together = ['user', 'date']
        ordering = ['-date']


class VoiceCommand(models.Model):
    """Voice command history and quick actions"""
    COMMAND_TYPES = [
        ('create_task', 'Create Task'),
        ('set_reminder', 'Set Reminder'),
        ('start_timer', 'Start Timer'),
        ('log_habit', 'Log Habit'),
        ('quick_note', 'Quick Note'),
        ('search', 'Search'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='voice_commands')
    command_type = models.CharField(max_length=50, choices=COMMAND_TYPES)
    transcript = models.TextField(help_text="What was said")
    action_taken = models.TextField(help_text="What action was performed")
    success = models.BooleanField(default=True)
    confidence_score = models.FloatField(null=True, blank=True, help_text="Speech recognition confidence")
    executed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.command_type}"

    class Meta:
        db_table = 'voice_commands'
        ordering = ['-executed_at']


# ==================== TASK HUB ENHANCEMENTS ====================

class TaskComment(models.Model):
    """Comments on tasks for collaboration and notes"""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Comment by {self.user.username} on {self.task.title}"
    
    class Meta:
        db_table = 'task_comments'
        ordering = ['created_at']


class TaskAttachment(models.Model):
    """File attachments for tasks"""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='task_attachments/%Y/%m/')
    filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_attachments')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.filename} - {self.task.title}"
    
    class Meta:
        db_table = 'task_attachments'
        ordering = ['-uploaded_at']


class TaskTemplate(models.Model):
    """Reusable task templates"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_templates')
    name = models.CharField(max_length=200, help_text="Template name")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, default='medium', choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ])
    category = models.CharField(max_length=20, default='other', choices=[
        ('work', 'Work'),
        ('personal', 'Personal'),
        ('health', 'Health'),
        ('learning', 'Learning'),
        ('shopping', 'Shopping'),
        ('other', 'Other')
    ])
    estimated_time = models.PositiveIntegerField(null=True, blank=True, help_text="Minutes")
    is_public = models.BooleanField(default=False, help_text="Share with all users")
    usage_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.user.username}"
    
    class Meta:
        db_table = 'task_templates'
        ordering = ['-usage_count']


class EmailNotificationLog(models.Model):
    """Track email notifications sent to users"""
    NOTIFICATION_TYPES = [
        ('task_created', 'Task Created'),
        ('task_due_soon', 'Task Due Soon'),
        ('task_overdue', 'Task Overdue'),
        ('daily_summary', 'Daily Summary'),
        ('weekly_report', 'Weekly Report'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_logs')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    subject = models.CharField(max_length=255)
    sent_at = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)
    task = models.ForeignKey(Task, null=True, blank=True, on_delete=models.SET_NULL, related_name='email_logs')
    
    def __str__(self):
        return f"{self.user.username} - {self.notification_type} - {self.sent_at}"
    
    class Meta:
        db_table = 'email_notification_logs'
        ordering = ['-sent_at']
