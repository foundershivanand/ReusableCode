#!/usr/bin/env python3
"""
Generates high quality PDFs for:
1. AGENTS.md (Agent Directives & Guidelines)
2. README.md (Architecture Blueprint)
3. modules-catalog.pdf (Complete 40-module catalog)
"""

import os
import json
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Preformatted
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "AI Agent Product Factory • Reusable Code Library")
            self.drawRightString(558, 750, "github.com/sh15aa/agentreusable")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)
        
        # Footer
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        self.drawString(54, 32, "Confidential & Open Source • https://github.com/sh15aa/agentreusable")
        self.drawRightString(558, 32, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def get_styles():
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=14
    )
    
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#2563eb'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Code'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#0f172a'),
        backColor=colors.HexColor('#f1f5f9'),
        spaceBefore=4,
        spaceAfter=6,
        leftIndent=10,
        rightIndent=10,
        borderPadding=6
    )

    badge_style = ParagraphStyle(
        'Badge_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor('#1e40af')
    )

    return {
        'title': title_style,
        'subtitle': subtitle_style,
        'h1': h1_style,
        'h2': h2_style,
        'body': body_style,
        'code': code_style,
        'badge': badge_style
    }


def generate_agents_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    styles = get_styles()
    story = []

    # Title Banner
    story.append(Paragraph("AI AGENT PRODUCT FACTORY: AGENTS.MD", styles['title']))
    story.append(Paragraph("<b>Durable Core Directive & Reusable Catalog for AI Coding Agents</b><br/>Repository: https://github.com/sh15aa/agentreusable • Status: Production Ready", styles['subtitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=10))

    # Core Directive Box
    directive_html = """
    <b>🎯 CORE DIRECTIVE FOR ALL AI AGENTS</b><br/><br/>
    Before creating, scaffolding, or implementing ANY agent functionality (gateway, memory, planning, tools, sandbox, security, human-in-the-loop, evaluation, or observability):<br/>
    1. <b>Check registry/modules.json</b> for existing capabilities.<br/>
    2. <b>Reuse the existing module</b> whenever compatible.<br/>
    3. <b>DO NOT recreate or reinvent</b> functionality that already exists in this library.<br/>
    4. When working in an external project folder, install or link this library directly from GitHub.
    """
    directive_table = Table(
        [[Paragraph(directive_html, styles['body'])]],
        colWidths=[504]
    )
    directive_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#3b82f6')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(directive_table)
    story.append(Spacer(1, 10))

    # Priority Hierarchy
    story.append(Paragraph("Priority Hierarchy", styles['h1']))
    priority_code = "PRIORITY HIERARCHY:\nExisting Reusable Module from `agentsreusable`\n    > Existing Project Adaptation\n        > New Implementation (Only if capability is absent)"
    story.append(Preformatted(priority_code, styles['code']))

    # Direct Consumption from GitHub
    story.append(Paragraph("Direct Consumption from GitHub", styles['h1']))
    story.append(Paragraph("Any AI agent working in a different folder can consume this library directly:", styles['body']))
    
    install_snippet = """# Using uv (recommended)
uv add git+https://github.com/sh15aa/agentreusable.git

# Using pip
pip install git+https://github.com/sh15aa/agentreusable.git

# pyproject.toml
dependencies = [
    "agentsreusable @ git+https://github.com/sh15aa/agentreusable.git"
]"""
    story.append(Preformatted(install_snippet, styles['code']))

    story.append(Paragraph("Remote Module Discovery URL", styles['h2']))
    story.append(Paragraph("AI agents can inspect the catalog live without downloading the whole repository manually:", styles['body']))
    story.append(Preformatted("Registry URL: https://raw.githubusercontent.com/sh15aa/agentreusable/main/registry/modules.json\nAgent Instructions: https://raw.githubusercontent.com/sh15aa/agentreusable/main/AGENTS.md", styles['code']))

    # Sample Agent Implementation
    story.append(Paragraph("Code Import Pattern for Consuming Agents", styles['h1']))
    sample_code = """import asyncio
from agent_factory.core.identity import AgentConfig, AgentIdentity, AgentManifest
from agent_factory.core.gateway import LLMGateway
from agent_factory.factory import AgentFactory
from agent_factory.tools.registry import ToolRegistry
from agent_factory.tools.builtins.search import WebSearchTool

async def build_custom_agent():
    identity = AgentIdentity(
        agent_id="my-agent-1", 
        agent_name="Market Analyst",
        description="Analyses renewable market trends"
    )
    manifest = AgentManifest(
        identity=identity,
        config=AgentConfig(system_prompt="Analyze renewable energy."),
        capabilities=["web_search"]
    )
    factory = AgentFactory()
    agent = factory.build_agent(manifest)
    result = await agent.run("Summarize latest renewable energy trends")
    print("Agent Result:", result)

if __name__ == "__main__":
    asyncio.run(build_custom_agent())"""
    story.append(Preformatted(sample_code, styles['code']))

    # Rules for adding new code
    story.append(Paragraph("Rules for Adding New Reusable Modules", styles['h1']))
    rules_text = """1. Build the module cleanly in the appropriate category directory (agent_factory/core, memory, tools, etc.).<br/>
2. Write unit tests in tests/ verifying nominal and failure cases (uv run pytest).<br/>
3. Add the module entry to registry/modules.json.<br/>
4. NEVER commit secrets, API keys, or machine-specific absolute paths.<br/>
5. Keep abstractions minimal, modular, and self-contained."""
    story.append(Paragraph(rules_text, styles['body']))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generated {output_path}")


def generate_architecture_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    styles = get_styles()
    story = []

    story.append(Paragraph("AI AGENT PRODUCT FACTORY: ARCHITECTURE BLUEPRINT", styles['title']))
    story.append(Paragraph("<b>10 Core Layers & 40+ Production Modules Specification</b><br/>GitHub: https://github.com/sh15aa/agentreusable • Python 3.12+ • Enterprise Grade", styles['subtitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=10))

    layers_data = [
        ("Layer 1: Identity & Config", "AgentIdentity, AgentConfig, AgentManifest, Environment policies, status tracking."),
        ("Layer 2: LLM Gateway & Economics", "Multi-provider routing by task complexity, streaming, cost economics, pricing models, fallback cascades."),
        ("Layer 3: Multi-Tier Memory", "Working memory scratchpad, conversation compaction, semantic vector search, episodic experience learning, hybrid RAG (BM25+Dense)."),
        ("Layer 4: Sandboxed Tools & Builtins", "Central ToolRegistry, WebSearchTool, BrowserTool (SSRF-hardened), PythonSandboxTool (AST-hardened), FileProcessingTool."),
        ("Layer 5: Orchestration & Workflows", "PlanningEngine dynamic decomposition, WorkflowEngine parallel DAG execution, SupervisorAgent multi-agent messaging."),
        ("Layer 6: Human-in-the-Loop", "HumanApprovalQueue for high/critical risk tool actions with pause/resume state persistence."),
        ("Layer 7: Validation & Verification", "StructuredOutputEngine Pydantic parsing with auto-repair, SelfVerificationEngine fact verification, CitationEngine source provenance."),
        ("Layer 8: Security & Governance", "RBAC permissions, MemoryGovernance PII redaction (email/phone/SSN), SecretStore zero-leak isolation, SSRF network validation."),
        ("Layer 9: Evaluation & Benchmarks", "GoldenDataset evaluation test cases, LLMAsJudge 1-5 rubric scoring, RegressionRunner automated benchmarks."),
        ("Layer 10: Observability & APIs", "Tracer distributed spans, AuditLogger tamper-evident log, AgentAnalytics metrics, FastAPI production SSE server."),
    ]

    story.append(Paragraph("10 Architectural Layers Overview", styles['h1']))
    table_rows = [[Paragraph(f"<b>{name}</b>", styles['body']), Paragraph(desc, styles['body'])] for name, desc in layers_data]
    table = Table(table_rows, colWidths=[150, 354])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(table)
    story.append(Spacer(1, 12))

    story.append(Paragraph("Factory CLI Commands", styles['h1']))
    cli_snippet = """# List available agent templates
uv run python -m cli.main list-templates

# Run an agent template directly
uv run python -m cli.main run research "Investigate latest developments in autonomous AI"

# Run automated regression benchmarks
uv run python -m cli.main eval research"""
    story.append(Preformatted(cli_snippet, styles['code']))

    story.append(Paragraph("Master Assembler: AgentFactory", styles['h1']))
    factory_snippet = """from agent_factory.factory import AgentFactory
from templates.research_agent import create_research_agent

factory = AgentFactory()
agent = create_research_agent(factory)
result = await agent.run("Investigate new breakthroughs")"""
    story.append(Preformatted(factory_snippet, styles['code']))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generated {output_path}")


def generate_catalog_pdf(registry_path, output_path):
    with open(registry_path, 'r') as f:
        data = json.load(f)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    styles = get_styles()
    story = []

    story.append(Paragraph("AI AGENT PRODUCT FACTORY: MODULE CATALOG", styles['title']))
    story.append(Paragraph(f"<b>Complete Catalog of all {len(data['modules'])} Production Modules</b><br/>Repository: https://github.com/sh15aa/agentreusable • Install: uv add git+https://github.com/sh15aa/agentreusable.git", styles['subtitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=10))

    # Group by category
    categories = {}
    for m in data['modules']:
        cat = m['category'].capitalize()
        categories.setdefault(cat, []).append(m)

    for cat_name, cat_modules in categories.items():
        story.append(Paragraph(f"{cat_name} Modules ({len(cat_modules)})", styles['h1']))
        
        for mod in cat_modules:
            mod_box = []
            header = f"<b>{mod['name']}</b> &nbsp; <font color='#2563eb'>[{mod['id']}]</font> &nbsp; <font color='#16a34a'>● {mod['status'].upper()}</font>"
            mod_box.append([Paragraph(header, styles['body'])])
            
            body_content = f"""<b>Path:</b> <font face='Courier'>{mod['path']}</font><br/>
<b>Description:</b> {mod['description']}<br/>
<b>Core Exports:</b> {', '.join(mod['exports'])}"""
            mod_box.append([Paragraph(body_content, styles['body'])])
            
            if 'usage_example' in mod and mod['usage_example']:
                mod_box.append([Preformatted(mod['usage_example'], styles['code'])])
                
            t = Table(mod_box, colWidths=[504])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
                ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#ffffff')),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('LEFTPADDING', (0,0), (-1,-1), 8),
                ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ]))
            story.append(t)
            story.append(Spacer(1, 6))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generated {output_path}")


if __name__ == "__main__":
    os.makedirs("site/pdfs", exist_ok=True)
    generate_agents_pdf("site/pdfs/agents-directive.pdf")
    generate_architecture_pdf("site/pdfs/architecture-blueprint.pdf")
    generate_catalog_pdf("registry/modules.json", "site/pdfs/modules-catalog.pdf")
