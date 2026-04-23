import logging
from twilio.rest import Client

logger = logging.getLogger(__name__)

def send_sms(user, body):
    """
    Send a real SMS text message to the user's phone via Twilio
    """
    try:
        profile = user.profile
        
        # Check if user has SMS configured
        if not all([profile.phone_number, profile.twilio_account_sid, 
                   profile.twilio_auth_token, profile.twilio_from_number]):
            return False
            
        client = Client(profile.twilio_account_sid, profile.twilio_auth_token)
        
        message = client.messages.create(
            body=f"[AI Dashboard]: {body}",
            from_=profile.twilio_from_number,
            to=profile.phone_number
        )
        
        logger.info(f"SMS sent successfully to {profile.phone_number}. SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Failed to send SMS to {user.username}: {e}")
        return False
