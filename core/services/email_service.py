"""
Email notification service for Task Hub
Sends various email notifications to users
"""
import logging
from datetime import datetime, timedelta
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.contrib.auth.models import User
from core.models import Task, EmailNotificationLog

logger = logging.getLogger(__name__)


def send_task_created_email(user, task):
    """Send email when a task is created (especially from AI chat)"""
    if not user.email or not task.email_notification:
        return False
    
    # Check if email is configured
    if not getattr(settings, 'EMAIL_HOST', None):
        logger.warning("Email not configured - skipping email notification")
        return False
    
    subject = f"📋 New Task Created: {task.title}"
    
    # HTML content
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🎯 New Task Added!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0;">{task.title}</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #6b7280; margin: 5px 0;"><strong>Priority:</strong> 
                    <span style="color: {'#ef4444' if task.priority == 'high' else '#f59e0b' if task.priority == 'medium' else '#10b981'}; font-weight: bold;">
                        {task.priority.upper()}
                    </span>
                </p>
                
                <p style="color: #6b7280; margin: 5px 0;"><strong>Category:</strong> {task.category.title()}</p>
                
                {f"<p style='color: #6b7280; margin: 5px 0;'><strong>Due Date:</strong> {task.due_date.strftime('%B %d, %Y at %I:%M %p')}</p>" if task.due_date else ''}
                
                {f"<p style='color: #6b7280; margin: 5px 0;'><strong>Estimated Time:</strong> {task.estimated_time} minutes</p>" if task.estimated_time else ''}
                
                {f"<hr style='border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;'><p style='color: #374151; margin: 10px 0;'><strong>Description:</strong></p><p style='color: #6b7280; line-height: 1.6;'>{task.description}</p>" if task.description else ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{settings.SITE_URL}/tasks/" 
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                    View in Task Hub →
                </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
                This task was created via AI Assistant on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}
            </p>
        </div>
    </div>
    """
    
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=strip_tags(html_content),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        
        # Log successful email
        EmailNotificationLog.objects.create(
            user=user,
            notification_type='task_created',
            subject=subject,
            success=True,
            task=task
        )
        
        logger.info(f"Task created email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send task created email: {str(e)}")
        
        # Log failed email
        EmailNotificationLog.objects.create(
            user=user,
            notification_type='task_created',
            subject=subject,
            success=False,
            error_message=str(e),
            task=task
        )
        return False


def send_daily_summary_email(user):
    """Send daily task summary email"""
    if not user.email:
        return False
    
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)
    
    # Get tasks due today
    tasks_due_today = Task.objects.filter(
        user=user,
        completed=False,
        due_date__date=today
    ).order_by('priority', 'due_date')
    
    # Get tasks due in next 3 days
    tasks_due_soon = Task.objects.filter(
        user=user,
        completed=False,
        due_date__date__gt=today,
        due_date__date__lte=tomorrow + timedelta(days=2)
    ).order_by('due_date')[:5]
    
    # Get overdue tasks
    overdue_tasks = Task.objects.filter(
        user=user,
        completed=False,
        due_date__lt=datetime.now()
    ).order_by('-due_date')
    
    subject = f"📅 Your Daily Task Summary - {today.strftime('%B %d, %Y')}"
    
    # Build overdue tasks HTML
    overdue_html = ""
    if overdue_tasks:
        overdue_items = "".join([f"<li style='color: #7f1d1d; margin: 5px 0;'>{task.title}</li>" for task in overdue_tasks])
        overdue_html = f"""
        <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <h3 style="color: #991b1b; margin: 0 0 10px 0;">⚠️ Overdue Tasks ({overdue_tasks.count()})</h3>
            <ul style="margin: 0; padding-left: 20px;">{overdue_items}</ul>
        </div>
        """
    
    # Build today's tasks HTML
    if tasks_due_today:
        today_items = "".join([
            f"<li style='color: #374151; margin: 8px 0;'><strong>{task.title}</strong> "
            f"<span style=\"color: {'#ef4444' if task.priority == 'high' else '#f59e0b' if task.priority == 'medium' else '#10b981'}; font-size: 12px; margin-left: 10px;\">"
            f"{task.priority.upper()}</span></li>" for task in tasks_due_today
        ])
        today_html = f"""
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1f2937; margin-top: 0;">🎯 Due Today ({tasks_due_today.count()})</h3>
            <ul style="margin: 0; padding-left: 20px;">{today_items}</ul>
        </div>
        """
    else:
        today_html = """
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1f2937; margin-top: 0;">🎯 Due Today</h3>
            <p style="color: #6b7280;">No tasks due today! 🎉</p>
        </div>
        """
    
    # Build coming soon HTML
    coming_soon_html = ""
    if tasks_due_soon:
        soon_items = "".join([
            f"<li style='color: #374151; margin: 8px 0;'>{task.title} - <em>{task.due_date.strftime('%b %d')}</em></li>"
            for task in tasks_due_soon
        ])
        coming_soon_html = f"""
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1f2937; margin-top: 0;">📆 Coming Up</h3>
            <ul style="margin: 0; padding-left: 20px;">{soon_items}</ul>
        </div>
        """
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">📅 Daily Summary</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">{today.strftime('%A, %B %d, %Y')}</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
            {overdue_html}
            {today_html}
            {coming_soon_html}
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{settings.SITE_URL}/tasks/" 
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                    Open Task Hub →
                </a>
            </div>
        </div>
    </div>
    """
    
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=strip_tags(html_content),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        
        EmailNotificationLog.objects.create(
            user=user,
            notification_type='daily_summary',
            subject=subject,
            success=True
        )
        
        logger.info(f"Daily summary sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send daily summary: {str(e)}")
        EmailNotificationLog.objects.create(
            user=user,
            notification_type='daily_summary',
            subject=subject,
            success=False,
            error_message=str(e)
        )
        return False


def send_due_date_reminder(task):
    """Send reminder when task is due soon (24 hours before)"""
    user = task.user
    if not user.email or not task.email_notification:
        return False
    
    subject = f"⏰ Reminder: {task.title} is due soon!"
    
    time_until_due = task.due_date - datetime.now()
    hours_until_due = int(time_until_due.total_seconds() / 3600)
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">⏰ Task Reminder</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937;">{task.title}</h2>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="color: #92400e; margin: 0; font-size: 16px;">
                    ⏱️ Due in <strong>{hours_until_due} hours</strong>
                </p>
                <p style="color: #92400e; margin: 10px 0 0 0;">
                    📅 Due: {task.due_date.strftime('%B %d, %Y at %I:%M %p')}
                </p>
            </div>
            
            {f"<p style='color: #6b7280; line-height: 1.6;'>{task.description}</p>" if task.description else ''}
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{settings.SITE_URL}/tasks/" 
                   style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                    Mark as Complete ✓
                </a>
            </div>
        </div>
    </div>
    """
    
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=strip_tags(html_content),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        
        EmailNotificationLog.objects.create(
            user=user,
            notification_type='task_due_soon',
            subject=subject,
            success=True,
            task=task
        )
        
        return True
    except Exception as e:
        logger.error(f"Failed to send due date reminder: {str(e)}")
        return False
