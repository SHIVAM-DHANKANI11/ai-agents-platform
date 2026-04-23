from django.contrib import admin
from .models import (
    UserProfile, ChatSession, ChatMessage, Task,
    CalendarEvent, FileUpload, UserActivity
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'theme_preference', 'created_at']
    search_fields = ['user__username', 'user__email']


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'assistant_type', 'created_at', 'updated_at']
    list_filter = ['assistant_type', 'created_at']
    search_fields = ['title', 'user__username']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['session', 'role', 'content_preview', 'created_at']
    list_filter = ['role', 'created_at']
    
    def content_preview(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'completed', 'priority', 'due_date']
    list_filter = ['completed', 'priority', 'created_at']
    search_fields = ['title', 'description']


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'date', 'time', 'all_day']
    list_filter = ['date', 'all_day']
    search_fields = ['title', 'description']


@admin.register(FileUpload)
class FileUploadAdmin(admin.ModelAdmin):
    list_display = ['original_name', 'user', 'file_type', 'file_size', 'uploaded_at']
    list_filter = ['file_type', 'uploaded_at']


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ['user', 'activity_type', 'description', 'created_at']
    list_filter = ['activity_type', 'created_at']
    search_fields = ['user__username', 'description']
