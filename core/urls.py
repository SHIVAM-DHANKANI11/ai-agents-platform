"""
URL configuration for core app
"""
from django.urls import path
from . import views

urlpatterns = [
    # Dashboard
    path('', views.dashboard_ultimate_v7_view, name='home'),
    path('dashboard/', views.dashboard_ultimate_v7_view, name='dashboard'),
    path('dashboard-pro/', views.dashboard_pro_view, name='dashboard_pro'),
    path('dashboard-ultimate/', views.dashboard_ultimate_view, name='dashboard_ultimate'),
    path('dashboard-ultimate-v2/', views.dashboard_ultimate_v2_view, name='dashboard_ultimate_v2'),
    path('dashboard-ultimate-v3/', views.dashboard_ultimate_v3_view, name='dashboard_ultimate_v3'),
    path('dashboard-ultimate-v6/', views.dashboard_ultimate_v6_view, name='dashboard_ultimate_v6'),
    path('dashboard-ultimate-v7/', views.dashboard_ultimate_v7_view, name='dashboard_ultimate_v7'),
    
    # Auth
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    
    # Chat
    path('chat/', views.chat_view, name='chat'),
    path('chat/<int:session_id>/', views.chat_view, name='chat_session'),
    
    # Explore
    path('explore/', views.explore_view, name='explore'),
    
    # Tasks
    path('tasks/', views.tasks_view, name='tasks'),
    path('tasks/board/', views.tasks_board_view, name='tasks_board'),
    
    # Calendar
    path('calendar/', views.calendar_view, name='calendar'),
    
    # Files
    path('files/', views.files_view, name='files'),
    
    # Assistants
    path('assistants/', views.assistants_view, name='assistants'),
    
    # Analytics
    path('analytics/', views.analytics_view, name='analytics'),
    
    # Notifications
    path('notifications/', views.notifications_view, name='notifications'),

    # Help
    path('help/', views.help_view, name='help'),
    
    # Settings
    path('settings/', views.settings_view, name='settings'),
    
    # n8n Webhooks
    path('api/n8n/task/', views.n8n_task_webhook, name='n8n_task'),
    path('api/n8n/reminder/', views.n8n_reminder_webhook, name='n8n_reminder'),
    path('api/n8n/file-summary/', views.n8n_file_summary_webhook, name='n8n_file_summary'),
    
    # API Endpoints
    # Chat API
    path('api/chat/send/', views.api_send_message, name='api_chat_send'),
    path('api/chat/history/<int:session_id>/', views.api_get_history, name='api_chat_history'),
    path('api/chat/sessions/', views.api_get_sessions, name='api_chat_sessions'),
    path('api/chat/sessions/new/', views.api_create_session, name='api_chat_new'),
    path('api/chat/sessions/<int:session_id>/rename/', views.api_rename_session, name='api_chat_rename'),
    path('api/chat/sessions/<int:session_id>/delete/', views.api_delete_session, name='api_chat_delete'),
    path('api/chat/sessions/<int:session_id>/clear/', views.api_clear_chat, name='api_chat_clear'),
    
    # Tasks API
    path('api/tasks/', views.api_get_tasks, name='api_tasks'),
    path('api/tasks/create/', views.api_create_task, name='api_task_create'),
    path('api/tasks/<int:task_id>/update/', views.api_update_task, name='api_task_update'),
    path('api/tasks/<int:task_id>/toggle/', views.api_toggle_task, name='api_task_toggle'),
    path('api/tasks/<int:task_id>/delete/', views.api_delete_task, name='api_task_delete'),
    
    # Calendar API
    path('api/calendar/events/', views.api_get_events, name='api_calendar_events'),
    path('api/calendar/events/create/', views.api_create_event, name='api_calendar_create'),
    path('api/calendar/events/<int:event_id>/update/', views.api_update_event, name='api_calendar_update'),
    path('api/calendar/events/<int:event_id>/delete/', views.api_delete_event, name='api_calendar_delete'),
    
    # Files API
    path('api/files/', views.api_get_files, name='api_files'),
    path('api/files/upload/', views.api_upload_file, name='api_file_upload'),
    path('api/files/<int:file_id>/delete/', views.api_delete_file, name='api_file_delete'),
    path('api/files/<int:file_id>/download/', views.api_download_file, name='api_file_download'),
    
    # Assistants API
    path('api/assistants/', views.api_get_assistants, name='api_assistants'),
    path('api/assistants/set/', views.api_set_assistant, name='api_assistant_set'),
    
    # Analytics API
    path('api/analytics/stats/', views.api_get_stats, name='api_stats'),
    path('api/analytics/detailed/', views.api_get_analytics_detailed, name='api_analytics_detailed'),
    
    # Settings API
    path('api/settings/update/', views.api_update_settings, name='api_settings_update'),
    path('api/settings/theme/', views.api_update_theme, name='api_theme_update'),
    
    # Search API
    path('api/search/', views.api_search, name='api_search'),
    
    # Google Calendar Integration
    path('calendar/google/auth/', views.google_calendar_auth, name='google_calendar_auth'),
    path('calendar/google/callback/', views.google_calendar_callback, name='google_calendar_callback'),
    path('calendar/google/disconnect/', views.google_calendar_disconnect, name='google_calendar_disconnect'),
    path('api/calendar/google/events/', views.api_google_calendar_events, name='api_google_calendar_events'),
    path('api/calendar/google/events/create/', views.api_google_calendar_create_event, name='api_google_calendar_create_event'),
]
