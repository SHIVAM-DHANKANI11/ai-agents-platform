"""
Google Calendar Integration Service
Handles OAuth and calendar sync with Gmail/Google Calendar
"""
import os
import json
from datetime import datetime, timedelta
from django.conf import settings
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
import logging

logger = logging.getLogger(__name__)

# Google Calendar API scopes
SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
    'openid'
]


class GoogleCalendarService:
    """Service for Google Calendar integration"""
    
    @staticmethod
    def get_auth_url(user):
        """Generate OAuth URL for user authorization"""
        try:
            client_config = {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "project_id": settings.GOOGLE_PROJECT_ID,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
                }
            }
            
            flow = Flow.from_client_config(
                client_config,
                scopes=SCOPES,
                redirect_uri=settings.GOOGLE_REDIRECT_URI
            )
            
            # Generate URL for authorization
            auth_url, state = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                prompt='consent'
            )
            
            return {'success': True, 'auth_url': auth_url, 'state': state}
            
        except Exception as e:
            logger.error(f"Error generating auth URL: {e}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def exchange_code(code, user):
        """Exchange authorization code for tokens"""
        try:
            client_config = {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            }
            
            flow = Flow.from_client_config(
                client_config,
                scopes=SCOPES,
                redirect_uri=settings.GOOGLE_REDIRECT_URI
            )
            
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            # Save tokens to user profile
            profile = user.profile
            profile.google_calendar_token = json.dumps({
                'token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'token_uri': credentials.token_uri,
                'client_id': credentials.client_id,
                'client_secret': credentials.client_secret,
                'scopes': credentials.scopes,
                'expiry': credentials.expiry.isoformat() if credentials.expiry else None
            })
            profile.google_calendar_connected = True
            
            # Fetch user email
            try:
                oauth2_service = build('oauth2', 'v2', credentials=credentials)
                user_info = oauth2_service.userinfo().get().execute()
                profile.google_calendar_email = user_info.get('email', '')
            except Exception as e:
                logger.error(f"Error fetching Google user info: {e}")
                
            profile.save()
            
            return {'success': True}
            
        except Exception as e:
            logger.error(f"Error exchanging code: {e}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_credentials(user):
        """Get valid credentials for user"""
        try:
            profile = user.profile
            if not profile.google_calendar_token:
                return None
            
            token_info = json.loads(profile.google_calendar_token)
            
            credentials = Credentials(
                token=token_info.get('token'),
                refresh_token=token_info.get('refresh_token'),
                token_uri=token_info.get('token_uri'),
                client_id=token_info.get('client_id'),
                client_secret=token_info.get('client_secret'),
                scopes=token_info.get('scopes')
            )
            
            # Refresh if expired
            if credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
                # Save refreshed token
                profile.google_calendar_token = json.dumps({
                    'token': credentials.token,
                    'refresh_token': credentials.refresh_token,
                    'token_uri': credentials.token_uri,
                    'client_id': credentials.client_id,
                    'client_secret': credentials.client_secret,
                    'scopes': credentials.scopes,
                    'expiry': credentials.expiry.isoformat() if credentials.expiry else None
                })
                profile.save()
            
            return credentials
            
        except Exception as e:
            logger.error(f"Error getting credentials: {e}")
            return None
    
    @staticmethod
    def get_calendar_events(user, max_results=10):
        """Fetch events from user's Google Calendar"""
        try:
            credentials = GoogleCalendarService.get_credentials(user)
            if not credentials:
                return {'success': False, 'error': 'Not connected to Google Calendar'}
            
            service = build('calendar', 'v3', credentials=credentials)
            
            # Get events from now to 30 days ahead
            now = datetime.utcnow().isoformat() + 'Z'
            future = (datetime.utcnow() + timedelta(days=30)).isoformat() + 'Z'
            
            events_result = service.events().list(
                calendarId='primary',
                timeMin=now,
                timeMax=future,
                maxResults=max_results,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            formatted_events = []
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))
                
                formatted_events.append({
                    'id': event['id'],
                    'title': event.get('summary', 'No Title'),
                    'description': event.get('description', ''),
                    'start': start,
                    'end': end,
                    'location': event.get('location', ''),
                    'link': event.get('htmlLink', '')
                })
            
            return {'success': True, 'events': formatted_events}
            
        except Exception as e:
            logger.error(f"Error fetching calendar events: {e}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def create_calendar_event(user, title, description, start_time, end_time):
        """Create an event in user's Google Calendar"""
        try:
            credentials = GoogleCalendarService.get_credentials(user)
            if not credentials:
                return {'success': False, 'error': 'Not connected to Google Calendar'}
            
            service = build('calendar', 'v3', credentials=credentials)
            
            event = {
                'summary': title,
                'description': description,
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': 'UTC',
                },
            }
            
            event = service.events().insert(calendarId='primary', body=event).execute()
            
            return {
                'success': True,
                'event_id': event['id'],
                'link': event.get('htmlLink', '')
            }
            
        except Exception as e:
            logger.error(f"Error creating calendar event: {e}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def disconnect(user):
        """Disconnect Google Calendar"""
        try:
            profile = user.profile
            profile.google_calendar_token = None
            profile.google_calendar_connected = False
            profile.save()
            return {'success': True}
        except Exception as e:
            logger.error(f"Error disconnecting: {e}")
            return {'success': False, 'error': str(e)}
