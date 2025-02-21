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
            return await indexer.initialize_and_index(csv_path)
        except Exception as e:
            console.print(f"[red]Error initializing query engine: {str(e)}")
            sys.exit(1)

async def main():
    console.clear()
    display_welcome()
    
    query_engine = await initialize_engine()
    console.print("\n[green]✓ Query engine ready![/green]\n")

    while True:
        try:
            question = Prompt.ask("\n[bold blue]You[/bold blue]").strip()
            
            if question.lower() in ['q', 'quit', 'exit']:
                console.print("\n[yellow]Goodbye! Thanks for using Canada Spends Chat![/yellow]\n")
                break
                
            if question.lower() == 'clear':
                console.clear()
                display_welcome()
                continue
                
            if not question:
                continue
                
            with console.status("[bold blue]Thinking...", spinner="dots"):
                try:
                    response = await query_engine.query(question)
                    console.print("\n[bold green]Assistant[/bold green]")
                    console.print(Panel(str(response), border_style="green"))
                except Exception as e:
                    console.print(f"\n[red]Error: {str(e)}[/red]")
                
        except KeyboardInterrupt:
            console.print("\n[yellow]Goodbye! Thanks for using Canada Spends Chat![/yellow]\n")
            break
        except Exception as e:
            console.print(f"\n[red]An unexpected error occurred: {str(e)}[/red]")

if __name__ == "__main__":
    asyncio.run(main()) 