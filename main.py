import os

from flask import Flask, send_file

app = Flask(__name__)

@app.route("/")
def index():
    return send_file('src/index.html')

@app.route('/style.css')
def style():
    return send_file('src/style.css')

@app.route('/script.js')
def script():
    return send_file('src/script.js')

def main():
    app.run(port=int(os.environ.get('PORT', 80)))

if __name__ == "__main__":
    main()
