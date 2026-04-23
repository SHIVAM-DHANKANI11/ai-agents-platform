import requests
import logging

logger = logging.getLogger(__name__)

def send_push_notification(topic, title, message, url=None, priority="default", tags=None):
    """
    Send a real-time push notification to a mobile phone via ntfy.sh
    """
    if not topic:
        return False
        
    try:
        ntfy_url = f"https://ntfy.sh/{topic}"
        headers = {
            "Title": title.encode('utf-8'),
        }
        
        if url:
            headers["Click"] = url
            
        if priority != "default":
            # high, urgent, low
            headers["Priority"] = priority
            
        if tags:
            headers["Tags"] = ",".join(tags)
            
        response = requests.post(
            ntfy_url,
            data=message.encode('utf-8'),
            headers=headers,
            timeout=5
        )
        
        response.raise_for_status()
        logger.info(f"Push notification sent successfully to topic: {topic}")
        return True
    except Exception as e:
        logger.error(f"Failed to send mobile push notification to {topic}: {e}")
        return False

def notify_user(user, title, message, url=None, priority="default", tags=None):
    """Notify a single user if they have configured their mobile phone push topic"""
    try:
        topic = user.profile.mobile_push_topic
        if topic:
            return send_push_notification(
                topic=topic,
                title=title, 
                message=message, 
                url=url, 
                priority=priority,
                tags=tags
            )
    except Exception as e:
        logger.error(f"Error reading user profile for push topic: {e}")
    return False
