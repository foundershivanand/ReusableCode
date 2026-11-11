#!/usr/bin/env python3
"""
Generate professional PDF documents for Mobile Product Factory:
1. AGENTS.pdf
2. FACTORY_MANUAL.pdf
3. MODULES_CATALOG.pdf
4. CHECKLIST.pdf
5. ALL_MODULES_DOCS.pdf
"""

import os
import re
import json
import glob
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
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
            self.draw_footer(num_pages)
            super().showPage()
        super().save()

    def draw_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        # Top line
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(40, 35, 572, 35)
        # Footer text
        footer_text = f"Mobile Product Factory (163 Modules) • https://github.com/sh15aa/Appreusable • Page {self._pageNumber} of {page_count}"
        self.drawCentredString(306, 22, footer_text)
        self.restoreState()

def create_styles():
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=8
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=12
    )
    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#2563eb'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155'),
        spaceAfter=4
    )
    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155'),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=3
    )
    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#0f172a'),
        backColor=colors.HexColor('#f1f5f9'),
        borderColor=colors.HexColor('#cbd5e1'),
        borderWidth=0.5,
        borderPadding=4,
        spaceBefore=4,
        spaceAfter=6
    )
    meta_box_style = ParagraphStyle(
        'MetaBox',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1e40af'),
        backColor=colors.HexColor('#eff6ff'),
        borderColor=colors.HexColor('#bfdbfe'),
        borderWidth=0.5,
        borderPadding=5,
        spaceBefore=4,
        spaceAfter=8
    )
    return {
        'title': title_style,
        'subtitle': subtitle_style,
        'h1': h1_style,
        'h2': h2_style,
        'body': body_style,
        'bullet': bullet_style,
        'code': code_style,
        'meta': meta_box_style
    }

def clean_text(text):
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    code_spans = []
    def save_code(m):
        code_spans.append(m.group(1))
        return f"___CODESPAN_{len(code_spans)-1}___"
    text = re.sub(r'`([^`]+)`', save_code, text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', text)
    for i, c in enumerate(code_spans):
        text = text.replace(f"___CODESPAN_{i}___", f'<font name="Courier" color="#2563eb">{c}</font>')
    return text

def safe_paragraph(text, style):
    try:
        return Paragraph(clean_text(text), style)
    except Exception:
        plain = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        plain = re.sub(r'[`*#_]', '', plain)
        return Paragraph(plain, style)

def parse_markdown_to_flowables(md_content, styles):
    flowables = []
    lines = md_content.split('\n')
    in_code_block = False
    code_buffer = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith('```'):
            if in_code_block:
                in_code_block = False
                code_text = '\n'.join(code_buffer)
                code_clean = code_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                flowables.append(Paragraph(f"<pre>{code_clean}</pre>", styles['code']))
                code_buffer = []
            else:
                in_code_block = True
                code_buffer = []
            continue

        if in_code_block:
            code_buffer.append(line)
            continue

        if not stripped:
            flowables.append(Spacer(1, 3))
            continue

        if stripped.startswith('# '):
            flowables.append(safe_paragraph(stripped[2:], styles['title']))
        elif stripped.startswith('## '):
            flowables.append(safe_paragraph(stripped[3:], styles['h1']))
        elif stripped.startswith('### '):
            flowables.append(safe_paragraph(stripped[4:], styles['h2']))
        elif stripped.startswith('- ') or stripped.startswith('* '):
            flowables.append(safe_paragraph(f"• {stripped[2:]}", styles['bullet']))
        elif stripped.startswith('---'):
            flowables.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e2e8f0'), spaceAfter=6, spaceBefore=6))
        else:
            flowables.append(safe_paragraph(line, styles['body']))

    return flowables

def build_pdf_from_markdown(md_path, pdf_path, doc_title, subtitle=""):
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
    with open(md_path, 'r', errors='ignore') as f:
        content = f.read()

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=50
    )
    styles = create_styles()
    flowables = []
    
    flowables.append(safe_paragraph(doc_title, styles['title']))
    if subtitle:
        flowables.append(safe_paragraph(subtitle, styles['subtitle']))
    flowables.append(safe_paragraph("<b>Repository:</b> https://github.com/sh15aa/Appreusable &nbsp;|&nbsp; <b>Total Modules:</b> 163 &nbsp;|&nbsp; <b>Status:</b> Production-Grade", styles['meta']))
    flowables.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=10))

    flowables.extend(parse_markdown_to_flowables(content, styles))
    
    doc.build(flowables, canvasmaker=NumberedCanvas)
    print(f"✅ Generated PDF: {pdf_path}")

def build_modules_catalog_pdf(json_path, pdf_path):
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    modules = data.get('modules', [])
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=50
    )
    styles = create_styles()
    flowables = []

    flowables.append(safe_paragraph("Enterprise Mobile Product Factory", styles['title']))
    flowables.append(safe_paragraph("Complete Directory & Technical Specifications of all 163 Hardened Modules", styles['subtitle']))
    flowables.append(safe_paragraph("<b>GitHub:</b> https://github.com/sh15aa/Appreusable &nbsp;|&nbsp; <b>Author:</b> foundershivanand@gmail.com", styles['meta']))
    flowables.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=12))

    current_cat = None
    for m in modules:
        cat = m.get('category', 'general').replace('_', ' ').title()
        if cat != current_cat:
            current_cat = cat
            flowables.append(Spacer(1, 8))
            flowables.append(safe_paragraph(f"Category: {current_cat}", styles['h1']))
            flowables.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#93c5fd'), spaceAfter=6))

        mod_box = []
        mod_box.append(safe_paragraph(f"<b>[{m['id']}]</b> &nbsp; {m.get('name', '')}", styles['h2']))
        
        info_line = f"<b>Platform:</b> {m.get('platform','')} | <b>Path:</b> `{m.get('path','')}` | <b>Status:</b> {m.get('status','')}"
        mod_box.append(safe_paragraph(info_line, styles['body']))
        
        desc = m.get('description', '')
        if desc:
            mod_box.append(safe_paragraph(desc, styles['body']))
        
        if m.get('capabilities'):
            caps = " • ".join(m['capabilities'])
            mod_box.append(safe_paragraph(f"<b>Key Capabilities:</b> {caps}", styles['body']))

        if m.get('platform') == 'flutter':
            git_dep = f"{m['id']}:\n  git:\n    url: https://github.com/sh15aa/Appreusable.git\n    path: {m.get('path','')}\n    ref: main"
            mod_box.append(Paragraph(f"<pre>{git_dep}</pre>", styles['code']))
        
        mod_box.append(Spacer(1, 4))
        flowables.append(KeepTogether(mod_box))

    doc.build(flowables, canvasmaker=NumberedCanvas)
    print(f"✅ Generated Catalog PDF: {pdf_path}")

def build_checklist_pdf(tasks_json_path, pdf_path):
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
    with open(tasks_json_path, 'r') as f:
        tasks_data = json.load(f)

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=50
    )
    styles = create_styles()
    flowables = []

    flowables.append(safe_paragraph("Master 360+ Product Factory Checklist", styles['title']))
    flowables.append(safe_paragraph("Granular Verification & Quality Audit Matrix Across 10 Layers & 16 Phases (Rule 63)", styles['subtitle']))
    flowables.append(safe_paragraph(f"<b>Total Tasks:</b> {len(tasks_data)} &nbsp;|&nbsp; <b>Repo:</b> https://github.com/sh15aa/Appreusable", styles['meta']))
    flowables.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=12))

    grouped = {}
    for task_id, t in tasks_data.items():
        layer = t.get('layer', 'Other')
        phase = t.get('phase', 'Other')
        if layer not in grouped:
            grouped[layer] = {}
        if phase not in grouped[layer]:
            grouped[layer][phase] = []
        grouped[layer][phase].append(t)

    for layer, phases in grouped.items():
        flowables.append(Spacer(1, 10))
        flowables.append(safe_paragraph(f"📁 {layer}", styles['h1']))
        flowables.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cbd5e1'), spaceAfter=6))

        for phase, task_list in phases.items():
            flowables.append(safe_paragraph(f"<b>{phase}</b> ({len(task_list)} tasks)", styles['h2']))
            
            table_data = [["ID", "Task Description", "Status"]]
            for t in task_list:
                table_data.append([
                    safe_paragraph(f"<b>{t.get('id','')}</b>", styles['body']),
                    safe_paragraph(t.get('description',''), styles['body']),
                    safe_paragraph("[  ] Pending", styles['body'])
                ])
            
            t_table = Table(table_data, colWidths=[65, 395, 70])
            t_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0f172a')),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,0), 7.5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
                ('TOPPADDING', (0,0), (-1,-1), 2.5),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ]))
            flowables.append(t_table)
            flowables.append(Spacer(1, 6))

    doc.build(flowables, canvasmaker=NumberedCanvas)
    print(f"✅ Generated Checklist PDF: {pdf_path}")

def build_all_modules_docs_pdf(pdf_path):
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
    modules = sorted(glob.glob('modules/mod_*'), key=lambda p: int(re.search(r'mod_(\d+)', p).group(1)))
    
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=50
    )
    styles = create_styles()
    flowables = []

    flowables.append(safe_paragraph("Enterprise Mobile Product Factory: Comprehensive Reference Manual", styles['title']))
    flowables.append(safe_paragraph("Complete Technical Specifications & READMEs of All 163 Hardened Modules", styles['subtitle']))
    flowables.append(safe_paragraph("<b>GitHub:</b> https://github.com/sh15aa/Appreusable &nbsp;|&nbsp; <b>Developer:</b> foundershivanand@gmail.com", styles['meta']))
    flowables.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=12))

    for m in modules:
        readme_path = os.path.join(m, 'README.md')
        if os.path.exists(readme_path):
            with open(readme_path, 'r', errors='ignore') as f:
                content = f.read()
            flowables.extend(parse_markdown_to_flowables(content, styles))
            flowables.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e2e8f0'), spaceAfter=8, spaceBefore=8))

    doc.build(flowables, canvasmaker=NumberedCanvas)
    print(f"✅ Generated All Modules Docs PDF: {pdf_path}")

if __name__ == '__main__':
    out_dir = 'site/pdfs'
    print("Generating PDF documents...")
    build_pdf_from_markdown('AGENTS.md', f'{out_dir}/AGENTS.pdf', "AI Agent Protocol & Instructions (AGENTS.md)", "Guidelines for Autonomous Agent Code Reuse & Monorepo Integration")
    build_pdf_from_markdown('README.md', f'{out_dir}/FACTORY_MANUAL.pdf', "Mobile Product Factory Architectural Manual", "163 Modules, Zero-Trust Rules, and Clean Architecture for Android & iOS")
    build_modules_catalog_pdf('registry/modules.json', f'{out_dir}/MODULES_CATALOG.pdf')
    build_checklist_pdf('modules/mod_63_master_checklist_tracker/master_tasks.json', f'{out_dir}/CHECKLIST.pdf')
    build_all_modules_docs_pdf(f'{out_dir}/ALL_MODULES_DOCS.pdf')
    print("All PDFs successfully generated!")
