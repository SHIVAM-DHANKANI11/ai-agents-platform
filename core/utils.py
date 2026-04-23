"""
Utility functions for AI integration and helpers
"""
import groq
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Assistant configurations
ASSISTANTS = {
    'general': {
        'name': 'General AI',
        'icon': 'fa-robot',
        'color': '#6366f1',
        'description': 'Your all-purpose AI assistant for any task',
        'system_prompt': '''You are a helpful, friendly, and knowledgeable AI assistant. 
You provide clear, accurate, and concise responses. 
When appropriate, use formatting like bullet points or code blocks to make your answers more readable.
Always be polite and professional.'''
    },
    'coding': {
        'name': 'Coding Assistant',
        'icon': 'fa-code',
        'color': '#3b82f6',
        'description': 'Expert programmer for code help and debugging',
        'system_prompt': '''You are an expert programmer and software developer. 
You help with coding questions, debugging, code reviews, and explaining programming concepts.
When providing code:
- Use proper syntax highlighting with markdown code blocks
- Explain your code clearly
- Follow best practices and clean code principles
- Consider edge cases and error handling
- If the language isn't specified, ask or provide a general solution
Languages you excel at: Python, JavaScript, TypeScript, Java, C++, Go, Rust, SQL, HTML/CSS, and more.'''
    },
    'study': {
        'name': 'Study Assistant',
        'icon': 'fa-graduation-cap',
        'color': '#10b981',
        'description': 'Your personal tutor for learning any subject',
        'system_prompt': '''You are a patient and effective tutor. 
You help students learn and understand complex topics by:
- Breaking down difficult concepts into simpler parts
- Using analogies and examples to illustrate ideas
- Asking guiding questions to promote understanding
- Providing practice problems when appropriate
- Encouraging critical thinking
Adapt your explanations to the student's level of understanding.'''
    },
    'resume': {
        'name': 'Resume Builder',
        'icon': 'fa-file-lines',
        'color': '#f59e0b',
        'description': 'Professional resume and career assistant',
        'system_prompt': '''You are a professional resume writer and career coach.
You help users create compelling resumes, cover letters, and improve their job search.
Your expertise includes:
- Resume formatting and structure
- Highlighting achievements and skills
- Tailoring resumes for specific job descriptions
- Writing effective cover letters
- Interview preparation tips
- LinkedIn profile optimization
Always provide actionable advice and specific examples.'''
    },
    'writing': {
        'name': 'Writing Assistant',
        'icon': 'fa-pen-nib',
        'color': '#ec4899',
        'description': 'Creative writing and editing helper',
        'system_prompt': '''You are a skilled writing assistant and editor.
You help with various writing tasks including:
- Creative writing and storytelling
- Business emails and professional communication
- Essays and academic papers
- Blog posts and articles
- Proofreading and grammar correction
- Style and tone adjustments
Provide constructive feedback and suggestions for improvement.'''
    },
    'data': {
        'name': 'Data Scientist',
        'icon': 'fa-chart-network',
        'color': '#fbbf24',
        'description': 'Advanced data analysis, SQL, and visualization expert',
        'system_prompt': '''You are an expert data scientist and analyst. 
You help users with:
- Writing and optimizing SQL queries
- Data analysis using Python (Pandas, NumPy)
- Creating visualizations (Matplotlib, Seaborn, Plotly)
- Statistical analysis and machine learning concepts
- CSV/Excel data processing and cleanup
- Trend discovery and predictive insights
Always provide code when relevant and explain the insights derived from the data.'''
    }
}


def get_groq_client(api_key=None):
    """Initialize and return Groq client"""
    key = api_key or settings.GROQ_API_KEY
    if not key:
        raise ValueError("Groq API key not configured")
    return groq.Groq(api_key=key)


def send_chat_message(messages, api_key=None, model=None, temperature=0.7, max_tokens=4096):
    """
    Send messages to Groq API and return response
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        api_key: Optional API key (uses settings.GROQ_API_KEY if not provided)
        model: Model to use (defaults to settings.GROQ_MODEL)
        temperature: Sampling temperature (0-1)
        max_tokens: Maximum tokens in response
    
    Returns:
        str: AI response content
    """
    try:
        client = get_groq_client(api_key)
        
        response = client.chat.completions.create(
            model=model or settings.GROQ_MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=0.9,
            stream=False
        )
        
        return response.choices[0].message.content
        
    except groq.AuthenticationError as e:
        logger.error(f"Groq API authentication error: {e}")
        raise Exception("Invalid API key. Please check your Groq API key in settings.")
    except groq.RateLimitError as e:
        logger.error(f"Groq API rate limit exceeded: {e}")
        raise Exception("Rate limit exceeded. Please try again in a moment.")
    except groq.APIError as e:
        logger.error(f"Groq API error: {e}")
        raise Exception(f"AI service error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in send_chat_message: {e}")
        raise Exception("An unexpected error occurred. Please try again.")


def get_assistant_system_prompt(assistant_type):
    """Get system prompt for assistant type"""
    assistant = ASSISTANTS.get(assistant_type, ASSISTANTS['general'])
    return assistant['system_prompt']


def estimate_tokens(text):
    """Rough estimate of token count (very approximate)"""
    # A very rough estimate: ~4 characters per token on average
    return len(text) // 4


def truncate_conversation(messages, max_tokens=6000):
    """
    Truncate conversation to fit within token limit
    Keeps system prompt and most recent messages
    """
    if not messages:
        return messages
    
    total_tokens = sum(estimate_tokens(msg['content']) for msg in messages)
    
    if total_tokens <= max_tokens:
        return messages
    
    # Keep system message and remove oldest messages
    system_messages = [msg for msg in messages if msg['role'] == 'system']
    other_messages = [msg for msg in messages if msg['role'] != 'system']
    
    # Remove messages from the beginning until under limit
    while total_tokens > max_tokens and len(other_messages) > 2:
        removed = other_messages.pop(0)
        total_tokens -= estimate_tokens(removed['content'])
    
    return system_messages + other_messages


def format_file_size(size_bytes):
    """Format file size in human readable format"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"


def get_file_icon(file_type):
    """Get FontAwesome icon class based on file type"""
    if file_type.startswith('image/'):
        return 'fa-image'
    elif file_type == 'application/pdf':
        return 'fa-file-pdf'
    elif file_type.startswith('text/'):
        return 'fa-file-lines'
    elif file_type.startswith('video/'):
        return 'fa-file-video'
    elif file_type.startswith('audio/'):
        return 'fa-file-audio'
    elif 'zip' in file_type or 'compressed' in file_type:
        return 'fa-file-zipper'
    elif 'spreadsheet' in file_type or 'excel' in file_type or 'csv' in file_type:
        return 'fa-file-excel'
    elif 'presentation' in file_type or 'powerpoint' in file_type:
        return 'fa-file-powerpoint'
    elif 'word' in file_type or 'document' in file_type:
        return 'fa-file-word'
    else:
        return 'fa-file'


def generate_file_summary(file_upload, user):
    """
    Generate AI summary of uploaded file
    Supports text files, PDFs, and other readable formats
    """
    try:
        # Read file content
        file_content = ""
        file_path = file_upload.file.path
        
        # Handle text files
        if file_upload.file_type.startswith('text/'):
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                file_content = f.read()
        
        # Handle PDFs (basic text extraction)
        elif file_upload.file_type == 'application/pdf':
            try:
                import PyPDF2
                with open(file_path, 'rb') as f:
                    pdf_reader = PyPDF2.PdfReader(f)
                    for page in pdf_reader.pages:
                        file_content += page.extract_text() + "\n"
            except ImportError:
                file_content = "PDF text extraction requires PyPDF2. Install with: pip install PyPDF2"
        
        # Limit content length
        max_chars = 8000
        if len(file_content) > max_chars:
            file_content = file_content[:max_chars] + "..."
        
        if not file_content.strip():
            return "Could not extract text from this file type."
        
        # Generate summary using Groq
        client = groq.Client(api_key=settings.GROQ_API_KEY)
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a document summarizer. Provide a concise summary of the document content. Focus on key points, main ideas, and actionable items. Keep the summary under 300 words."
                },
                {
                    "role": "user",
                    "content": f"Please summarize this document:\n\n{file_content}"
                }
            ],
            max_tokens=500,
            temperature=0.3
        )
        
        summary = response.choices[0].message.content
        return summary
        
    except Exception as e:
        logger.error(f"Error generating file summary: {e}")
        return f"Error generating summary: {str(e)}"
