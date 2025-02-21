import asyncio
import uvicorn
import threading
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
import sys
import time

console = Console()

def display_startup_message():
    welcome_text = """
    🇨🇦 Canada Spends Query Engine 🇨🇦
    
    The API server is starting up...
    
    Once it's ready, you can:
    1. Use the interactive chat interface
    2. Access the API at http://localhost:8000
    3. View API docs at http://localhost:8000/docs
    
    Press Ctrl+C to exit
    """
    console.print(Panel(welcome_text, title="Welcome", border_style="blue"))

def run_api_server():
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)

def start_chat():
    from chat_interface import main
    asyncio.run(main())

if __name__ == "__main__":
    console.clear()
    display_startup_message()
    
    # Start the API server in a separate thread
    api_thread = threading.Thread(target=run_api_server, daemon=True)
    api_thread.start()
    
    # Wait for the API to start
    time.sleep(2)
    
    while True:
        try:
            console.print("\n[bold blue]Would you like to start the interactive chat? (y/n)[/bold blue]")
            choice = Prompt.ask("Choice").lower()
            
            if choice in ['y', 'yes']:
                start_chat()
                break
            elif choice in ['n', 'no']:
                console.print("\n[yellow]API server is running. Press Ctrl+C to exit.[/yellow]")
                api_thread.join()
                break
            else:
                console.print("[red]Please enter 'y' or 'n'[/red]")
                
        except KeyboardInterrupt:
            console.print("\n[yellow]Shutting down...[/yellow]")
            sys.exit(0) 