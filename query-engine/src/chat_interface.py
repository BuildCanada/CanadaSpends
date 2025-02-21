import asyncio
from indexer import CSVIndexer
import sys
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich.prompt import Prompt
from rich import print
from rich.spinner import Spinner

console = Console()

def display_welcome():
    welcome_text = """
    🇨🇦 Welcome to Canada Spends Chat! 🇨🇦
    
    Ask questions about Canadian government spending data.
    Type 'q', 'quit', or 'exit' to end the chat.
    Type 'clear' to clear the screen.
    """
    console.print(Panel(welcome_text, title="Canada Spends Chat", border_style="blue"))

async def initialize_engine():
    with console.status("[bold blue]Initializing query engine...", spinner="dots"):
        try:
            indexer = CSVIndexer()
            csv_path = "/app/data/otpmopeom-apdtmacdpam-2024.csv"
            query_engine = await indexer.initialize_and_index(csv_path)
            return indexer, query_engine
        except Exception as e:
            console.print(f"[red]Error initializing query engine: {str(e)}")
            sys.exit(1)

async def process_query(query_engine, question: str):
    """Process a single query and display the response."""
    with console.status("[bold blue]Thinking...", spinner="dots"):
        try:
            response = await query_engine.query(question)
            console.print("\n[bold green]Canada Spends Chat[/bold green]")
            console.print(Panel(str(response), border_style="green"))
        except Exception as e:
            console.print(f"\n[red]Error: {str(e)}[/red]")

def handle_command(command: str) -> bool:
    """Handle special commands. Returns True if should exit chat."""
    if command in ['q', 'quit', 'exit']:
        console.print("\n[yellow]Goodbye! Thanks for using Canada Spends Chat![/yellow]\n")
        return True
        
    if command == 'clear':
        console.clear()
        display_welcome()
        
    return False

async def chat_loop(query_engine):
    """Main chat loop."""
    while True:
        try:
            question = Prompt.ask("\n[bold blue]You[/bold blue]").strip()
            
            if not question:
                continue
                
            if handle_command(question.lower()):
                break
                
            await process_query(query_engine, question)
                
        except KeyboardInterrupt:
            console.print("\n[yellow]Goodbye! Thanks for using Canada Spends Chat![/yellow]\n")
            break

async def main():
    console.clear()
    display_welcome()
    
    indexer = None
    try:
        indexer, query_engine = await initialize_engine()
        console.print("\n[green]✓ Query engine ready![/green]\n")
        await chat_loop(query_engine)
    except (KeyboardInterrupt, asyncio.CancelledError):
        # Handle both keyboard interrupt and asyncio cancellation
        pass
    finally:
        if indexer:
            indexer.close()
            console.print("[dim]Connection closed.[/dim]")
        # Exit cleanly without showing the asyncio cancellation traceback
        sys.exit(0)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        # Handle any KeyboardInterrupt that bubbles up
        sys.exit(0) 