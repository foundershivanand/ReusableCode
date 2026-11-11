"""
Command Line Interface (CLI) for the AI Agent Product Factory.
"""

import asyncio
import json
import typer
from rich.console import Console
from rich.table import Table

from agent_factory.evaluation.dataset import GoldenDataset, TestCase
from agent_factory.evaluation.regression import RegressionRunner
from agent_factory.factory import AgentFactory
from templates.coding_agent import create_coding_agent
from templates.content_agent import create_content_agent
from templates.research_agent import create_research_agent

app = typer.Typer(help="AI Agent Product Factory CLI")
console = Console()


@app.command()
def list_templates():
    """List available pre-configured agent templates."""
    table = Table(title="Available Agent Templates")
    table.add_column("Template ID", style="cyan", no_wrap=True)
    table.add_column("Name", style="magenta")
    table.add_column("Capabilities", style="green")

    table.add_row("research", "Autonomous Web & Deep Research Agent", "web_search, browser, citations, fact_verification")
    table.add_row("content", "Autonomous Content Strategy Agent", "web_search, browser, structured_output")
    table.add_row("coding", "Autonomous Coding & Data Analysis Agent", "python_sandbox, file_processor, self_verification")

    console.print(table)


@app.command()
def run(
    template: str = typer.Argument(..., help="Template name ('research', 'content', 'coding')"),
    goal: str = typer.Argument(..., help="Task goal for the agent to execute")
):
    """Run an agent template with a specified goal."""
    factory = AgentFactory()

    if template == "research":
        agent = create_research_agent(factory)
    elif template == "content":
        agent = create_content_agent(factory)
    elif template == "coding":
        agent = create_coding_agent(factory)
    else:
        console.print(f"[bold red]Error: Unknown template '{template}'. Use 'list-templates' to view available.[/bold red]")
        raise typer.Exit(1)

    console.print(f"[bold green]Starting Agent:[/bold green] {agent.agent_name} ({agent.agent_id})")
    console.print(f"[bold yellow]Goal:[/bold yellow] {goal}\n")

    result = asyncio.run(agent.run(goal))
    console.print("[bold blue]Agent Execution Result:[/bold blue]")
    console.print(result)


@app.command()
def eval(
    template: str = typer.Argument(..., help="Template name ('research', 'content', 'coding')")
):
    """Run automated benchmark evaluation against an agent template."""
    factory = AgentFactory()

    if template == "research":
        agent = create_research_agent(factory)
    elif template == "content":
        agent = create_content_agent(factory)
    elif template == "coding":
        agent = create_coding_agent(factory)
    else:
        console.print(f"[bold red]Unknown template '{template}'.[/bold red]")
        raise typer.Exit(1)

    # Build benchmark test cases
    dataset = GoldenDataset(
        dataset_id=f"eval-{template}-v1",
        agent_target=agent.agent_id,
        test_cases=[
            TestCase(
                case_id="case_1",
                description=f"Standard task execution for {template} agent",
                input_prompt=f"Perform core operational task for {template}",
                expected_output_keywords=["Completed Task"]
            )
        ]
    )

    console.print(f"[bold green]Running Regression Benchmark on {agent.agent_name}...[/bold green]")
    runner = RegressionRunner()
    report = asyncio.run(runner.evaluate_agent(agent, dataset))

    table = Table(title=f"Benchmark Report - {agent.agent_id}")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="magenta")

    table.add_row("Total Cases", str(report.total_cases))
    table.add_row("Passed Cases", str(report.passed_cases))
    table.add_row("Pass Rate", f"{report.pass_rate * 100:.1f}%")
    table.add_row("Status", "[green]PASSED[/green]" if report.passed else "[red]FAILED[/red]")

    console.print(table)


@app.command()
def serve(
    host: str = typer.Option("127.0.0.1", help="Host address to bind"),
    port: int = typer.Option(8000, help="Port to listen on")
):
    """Start the production FastAPI agent gateway server."""
    import uvicorn
    console.print(f"[bold green]Starting Agent API Server on http://{host}:{port}...[/bold green]")
    uvicorn.run("agent_factory.api.server:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    app()
