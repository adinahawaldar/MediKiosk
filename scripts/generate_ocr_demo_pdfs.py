from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

OUT = Path(__file__).resolve().parents[1] / "output" / "pdf" / "ocr-demo"
OUT.mkdir(parents=True, exist_ok=True)
styles = getSampleStyleSheet()
title = ParagraphStyle("DemoTitle", parent=styles["Title"], alignment=TA_CENTER, fontSize=18, leading=22, spaceAfter=12)
body = ParagraphStyle("DemoBody", parent=styles["BodyText"], fontSize=11, leading=16)

def make_pdf(filename, heading, rows, notes):
    doc = SimpleDocTemplate(str(OUT / filename), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=18*mm, bottomMargin=18*mm)
    story = [Paragraph("HOSPITALOS MEDIKIOSK - DEMO DOCUMENT", title), Paragraph(heading, styles["Heading2"]), Spacer(1, 8)]
    story.append(Paragraph("Synthetic test data only - not a real medical record.", ParagraphStyle("Notice", parent=body, textColor=colors.HexColor("#9f1239"))))
    story.append(Spacer(1, 12))
    table = Table([[Paragraph(str(a), body), Paragraph(str(b), body)] for a, b in rows], colWidths=[55*mm, 115*mm])
    table.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.7, colors.HexColor("#334155")), ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#e2e8f0")), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    story.extend([table, Spacer(1, 16), Paragraph("Clinical notes", styles["Heading3"])])
    story.extend(Paragraph(f"- {note}", body) for note in notes)
    story.extend([Spacer(1, 24), Paragraph("Physician review required. OCR output is a draft and must not be treated as a signed prescription or diagnosis.", ParagraphStyle("Footer", parent=body, fontSize=9, textColor=colors.HexColor("#475569")))])
    doc.build(story)

make_pdf("demo-prescription.pdf", "Prescription", [("Patient", "Demo Patient A"), ("Diagnosis", "Type 2 Diabetes Mellitus"), ("Medicines", "Metformin 500 mg BD; Amlodipine 5 mg OD"), ("Instructions", "Take after food. Review in 14 days.")], ["Medication list extracted from a synthetic prescription."])
make_pdf("demo-lab-report.pdf", "Lab Report", [("Patient", "Demo Patient B"), ("Test", "HbA1c"), ("Result", "8.2 %"), ("Reference", "Below 5.7 %"), ("Flag", "ELEVATED - physician review required")], ["Synthetic laboratory report for OCR abnormal-value testing."])
make_pdf("demo-discharge-summary.pdf", "Discharge Summary", [("Patient", "Demo Patient C"), ("Admission", "01/09/2026"), ("Diagnosis", "Acute gastritis"), ("Treatment", "Hydration and acid suppression"), ("Follow-up", "Outpatient review after 7 days")], ["Synthetic discharge summary for OCR diagnosis and follow-up testing."])
print(f"Created demo OCR PDFs in {OUT}")
