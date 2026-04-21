from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

AUDIO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio')
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')

CORRECT_PASSWORD = "7395"

TRUTH_TEXT = """
【解密档案 - 第73号录音带真相】

日期：1973年9月15日

录音来源：时空档案馆，编号73-95号档案

我是陈启明，时空档案馆的研究员。这是我最后的记录。

三年来，我终于找到了那个秘密。

他们说我疯了，但我知道真相。

那个装置确实存在。它不只是传说。

7395，这是坐标。

北纬73度，东经95度。

在那里，在那个被遗忘的山谷深处，藏着改变一切的秘密。

我把真相隐藏在噪音背后。

如果你听到这段录音，说明你已经破解了密码。

你现在知道了真相。

请继续我的发现。

这是我最后的希望。

——陈启明
1973.09.15
"""

@app.route('/')
def index():
    return send_from_directory(STATIC_DIR, 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(STATIC_DIR, filename)

@app.route('/audio/<path:filename>')
def audio_files(filename):
    return send_from_directory(AUDIO_DIR, filename)

@app.route('/api/verify-password', methods=['POST'])
def verify_password():
    data = request.get_json()
    password = data.get('password', '').strip()
    
    if password == CORRECT_PASSWORD:
        return jsonify({
            'success': True,
            'message': '密码正确！真相已解锁。',
            'truth': TRUTH_TEXT,
            'audio_url': '/audio/truth.mp3'
        })
    else:
        return jsonify({
            'success': False,
            'message': '密码错误。请再试一次。'
        })

if __name__ == '__main__':
    os.makedirs(AUDIO_DIR, exist_ok=True)
    os.makedirs(STATIC_DIR, exist_ok=True)
    print("时空档案馆服务启动中...")
    print(f"服务地址: http://localhost:9973")
    print("请在浏览器中打开上述地址开始游戏。")
    app.run(host='0.0.0.0', port=9973, debug=False)
