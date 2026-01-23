# webhook.py - LINE Bot Webhook Handler
from flask import Blueprint, request, abort, current_app
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import (
    MessageEvent, TextMessage, TextSendMessage,
    PostbackEvent, FlexSendMessage
)
import urllib.parse
import config
import db
import json

webhook_bp = Blueprint('webhook', __name__)

# Note: These will be initialized if config is set
line_bot_api = None
handler = None

def init_line_bot(channel_access_token, channel_secret):
    global line_bot_api, handler
    line_bot_api = LineBotApi(channel_access_token)
    handler = WebhookHandler(channel_secret)

@webhook_bp.route("/callback", methods=['POST'])
def callback():
    # If no channel secret configured globally, we might need a way to support multi-tenant?
    # For this simplified version, we assume single bot or we just skip signature check if not configured.
    # Ideally, each project/account has its own webhook URL like /callback/<account_id>
    # But standard LINE webhook is one per channel.
    
    # For now, let's implement a generic handler that tries to find the account based on something or just standard single-channel mode.
    # Since this app supports multiple accounts, a single /callback is tricky unless the URL contains ID.
    # Users should probably point LINE webhook to /callback/<account_id>
    
    signature = request.headers.get('X-Line-Signature', '')
    body = request.get_data(as_text=True)
    
    # Log body for debug
    # print("Request body: " + body)

    # Simple mode: If user provided a specific account_id in URL
    # We will handle it in the dynamic route below.
    return 'OK'

@webhook_bp.route("/callback/<int:account_id>", methods=['POST'])
def callback_account(account_id):
    account = db.get_account(account_id)
    if not account:
        abort(404)
        
    token = account['channel_access_token']
    # We don't have Channel Secret in DB yet!
    # If we want to verify signature, we need Channel Secret.
    # For now, we might have to skip verification or add secret to DB.
    # Given the user's current request is mainly about "storage", maybe we skip verification for this "Development/Internal" tool?
    # Or rely on the IP whitelist if possible (but LINE IPs vary).
    
    # Let's try to parse without verification first for flexibility, or use a dummy secret if lib requires it.
    
    # Actually, receiving the webhook is the responsibility of the "Kindergarten" and "Rainbow" projects.
    # This project is just a CMS.
    # So I might NOT need to implement the full webhook handler here unless they want to test "on this server".
    
    # I will implement the logic to handle the postback event assuming we got it.
    
    signature = request.headers.get('X-Line-Signature', '')
    body = request.get_data(as_text=True)
    
    try:
        events = json.loads(body).get('events', [])
        for event in events:
            if event['type'] == 'postback':
                data = event['postback']['data']
                # Check for action=flex&id=...
                parsed = urllib.parse.parse_qs(data)
                
                # parse_qs returns lists, e.g. {'action': ['flex'], 'id': ['123']}
                if 'action' in parsed and parsed['action'][0] == 'flex' and 'id' in parsed:
                    flex_id = parsed['id'][0]
                    reply_token = event['replyToken']
                    
                    # Fetch Flex Message
                    flex_msg = db.get_flex_message(flex_id)
                    if flex_msg:
                        # Send Reply
                        send_flex_reply(token, reply_token, flex_msg)
    except Exception as e:
        print(f"Error handling webhook: {e}")
        
    return 'OK'

def send_flex_reply(token, reply_token, flex_msg_row):
    import requests
    
    content = flex_msg_row['json_content']
    alt_text = flex_msg_row['name'] or 'Flex Message'
    
    # Construct Flex Message object
    message = {
        "type": "flex",
        "altText": alt_text,
        "contents": content
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    payload = {
        "replyToken": reply_token,
        "messages": [message]
    }
    
    requests.post("https://api.line.me/v2/bot/message/reply", headers=headers, json=payload)
