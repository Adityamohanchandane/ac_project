from http.server import HTTPServer, SimpleHTTPRequestHandler
import webbrowser
import os

PORT = 8000

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()

    def do_GET(self):
        # Redirect to register.php if root is accessed
        if self.path == '/':
            self.path = '/register.php'
        return SimpleHTTPRequestHandler.do_GET(self)

def run():
    web_dir = os.path.join(os.path.dirname(__file__), '.')
    os.chdir(web_dir)
    
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    
    print(f"Serving at http://localhost:{PORT}")
    webbrowser.open(f'http://localhost:{PORT}')
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.socket.close()

if __name__ == '__main__':
    run()
