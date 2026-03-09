import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  HeadingLevel,
  PageBreak,
  TabStopPosition,
  TabStopType,
} from "docx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Deliverable {
  name: string;
  description: string;
  estimated_weeks: number;
}

interface SOW {
  id: string;
  customer_name: string;
  project_title: string;
  deliverables: Deliverable[];
  timeline_weeks: number;
  success_metrics: string[];
  risks: string[];
  budget_mentioned: string;
  region: string;
  special_requirements: string;
  status: string;
  created_at: string;
}

const PURPLE = "9333EA";
const NAVY = "0F1629";
const GRAY_700 = "374151";
const GRAY_500 = "6B7280";
const LIGHT_BG = "F9F5FF";
const WHITE = "FFFFFF";

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 400, after: 200 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 6, color: PURPLE, space: 8 },
    },
    shading: { type: ShadingType.SOLID, color: LIGHT_BG },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 24,
        color: NAVY,
        font: "Helvetica",
      }),
    ],
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text, size: 20, color: GRAY_700, font: "Helvetica" }),
    ],
  });
}

function bulletItem(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    bullet: { level: 0 },
    children: [
      new TextRun({ text, size: 20, color: GRAY_700, font: "Helvetica" }),
    ],
  });
}

function noBorderCell(children: Paragraph[], shading?: string, width?: number): TableCell {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: shading ? { type: ShadingType.SOLID, color: shading } : undefined,
    borders: {
      top: { style: BorderStyle.NONE, size: 0 },
      bottom: { style: BorderStyle.NONE, size: 0 },
      left: { style: BorderStyle.NONE, size: 0 },
      right: { style: BorderStyle.NONE, size: 0 },
    },
    children,
  });
}

function buildDocument(sow: SOW): Document {
  const createdDate = new Date(sow.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const provider = "EngagementFlow";
  const client = sow.customer_name || "Client";
  const title = sow.project_title || "Statement of Work";
  const deliverables = sow.deliverables || [];
  const metrics = sow.success_metrics || [];
  const risks = sow.risks || [];

  // ── Cover Page ──────────────────────────────────────────────────────────

  const coverElements: Paragraph[] = [
    new Paragraph({ spacing: { before: 3000 }, children: [] }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: client,
          bold: true,
          size: 56,
          color: NAVY,
          font: "Helvetica",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: "────────",
          size: 28,
          color: PURPLE,
          font: "Helvetica",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: title,
          size: 32,
          color: GRAY_500,
          font: "Helvetica",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: createdDate,
          size: 20,
          color: GRAY_500,
          font: "Helvetica",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `Status: ${(sow.status || "draft").toUpperCase()}`,
          size: 18,
          color: PURPLE,
          font: "Helvetica",
        }),
      ],
    }),
    new Paragraph({ spacing: { before: 2000 }, children: [] }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Prepared by ${provider}`,
          size: 20,
          color: GRAY_500,
          font: "Helvetica",
        }),
      ],
    }),
    new Paragraph({ children: [new TextRun({ break: 1, text: "" }), new PageBreak()] }),
  ];

  // ── Executive Summary ───────────────────────────────────────────────────

  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          noBorderCell(
            [
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({ text: "BUDGET", bold: true, size: 16, color: GRAY_500, font: "Helvetica" }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: sow.budget_mentioned || "TBD",
                    bold: true,
                    size: 28,
                    color: "059669",
                    font: "Helvetica",
                  }),
                ],
              }),
            ],
            "ECFDF5",
            33
          ),
          noBorderCell(
            [
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({ text: "TIMELINE", bold: true, size: 16, color: GRAY_500, font: "Helvetica" }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: sow.timeline_weeks ? `${sow.timeline_weeks} Weeks` : "TBD",
                    bold: true,
                    size: 28,
                    color: "2563EB",
                    font: "Helvetica",
                  }),
                ],
              }),
            ],
            "EFF6FF",
            33
          ),
          noBorderCell(
            [
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({ text: "REGION", bold: true, size: 16, color: GRAY_500, font: "Helvetica" }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: sow.region || "Global",
                    bold: true,
                    size: 28,
                    color: "D97706",
                    font: "Helvetica",
                  }),
                ],
              }),
            ],
            "FFFBEB",
            33
          ),
        ],
      }),
    ],
  });

  const execSummaryElements = [
    sectionHeading("Executive Summary"),
    summaryTable,
    new Paragraph({ spacing: { before: 200 }, children: [] }),
    bodyParagraph(
      `This Statement of Work outlines the engagement between ${client} and ${provider} for the ${title} engagement. The scope, deliverables, timeline, and commercial terms detailed herein constitute the agreed framework for execution.`
    ),
  ];

  // ── Deliverables Table ──────────────────────────────────────────────────

  const deliverableElements: (Paragraph | Table)[] = [sectionHeading("Deliverables")];

  if (deliverables.length > 0) {
    const headerRow = new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.SOLID, color: NAVY },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "DELIVERABLE", bold: true, size: 18, color: WHITE, font: "Helvetica" }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 55, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.SOLID, color: NAVY },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "DESCRIPTION", bold: true, size: 18, color: WHITE, font: "Helvetica" }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.SOLID, color: NAVY },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "WEEKS", bold: true, size: 18, color: WHITE, font: "Helvetica" }),
              ],
            }),
          ],
        }),
      ],
    });

    const dataRows = deliverables.map(
      (d, i) =>
        new TableRow({
          children: [
            new TableCell({
              shading: i % 2 === 1 ? { type: ShadingType.SOLID, color: LIGHT_BG } : undefined,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: d.name, bold: true, size: 20, color: NAVY, font: "Helvetica" }),
                  ],
                }),
              ],
            }),
            new TableCell({
              shading: i % 2 === 1 ? { type: ShadingType.SOLID, color: LIGHT_BG } : undefined,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: d.description, size: 18, color: GRAY_700, font: "Helvetica" }),
                  ],
                }),
              ],
            }),
            new TableCell({
              shading: i % 2 === 1 ? { type: ShadingType.SOLID, color: LIGHT_BG } : undefined,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: d.estimated_weeks ? String(d.estimated_weeks) : "\u2014",
                      size: 20,
                      color: GRAY_700,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
    );

    deliverableElements.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    }));
  } else {
    deliverableElements.push(bodyParagraph("No deliverables specified."));
  }

  // ── Metrics, Risks, Special Requirements ────────────────────────────────

  const detailElements: Paragraph[] = [];

  if (metrics.length > 0) {
    detailElements.push(sectionHeading("Success Metrics"));
    metrics.forEach((m) => detailElements.push(bulletItem(m)));
  }

  if (risks.length > 0) {
    detailElements.push(sectionHeading("Risks"));
    risks.forEach((r) => detailElements.push(bulletItem(r)));
  }

  if (sow.special_requirements) {
    detailElements.push(sectionHeading("Special Requirements"));
    detailElements.push(bodyParagraph(sow.special_requirements));
  }

  // ── Signature Page ──────────────────────────────────────────────────────

  const signatureElements: Paragraph[] = [
    new Paragraph({ children: [new PageBreak()] }),
    sectionHeading("Authorisation & Signatures"),
    bodyParagraph(
      `This Statement of Work (\u201CSOW\u201D) is entered into between ${client} (\u201CClient\u201D) and ${provider} (\u201CProvider\u201D) in connection with the ${title} engagement. The scope of work, deliverables, timeline of ${sow.timeline_weeks ? `${sow.timeline_weeks} weeks` : "[duration]"}, and commercial terms outlined in the preceding sections constitute the full agreement between both parties for this engagement.`
    ),
    new Paragraph({
      spacing: { before: 200, after: 400 },
      children: [
        new TextRun({
          text: "By signing below, both parties agree to the terms of this Statement of Work.",
          bold: true,
          size: 20,
          color: NAVY,
          font: "Helvetica",
        }),
      ],
    }),
  ];

  const sigLine = (label: string) => [
    new Paragraph({
      spacing: { before: 200 },
      children: [
        new TextRun({ text: label.toUpperCase(), size: 14, color: GRAY_500, font: "Helvetica" }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
      },
      children: [new TextRun({ text: " ", size: 20 })],
    }),
  ];

  const sigBlock = (title: string): Paragraph[] => [
    new Paragraph({
      spacing: { before: 300, after: 100 },
      children: [
        new TextRun({ text: title.toUpperCase(), bold: true, size: 20, color: NAVY, font: "Helvetica" }),
      ],
    }),
    ...sigLine("Signature"),
    ...sigLine("Printed Name"),
    ...sigLine("Title"),
    ...sigLine("Date"),
    ...sigLine("Company"),
  ];

  signatureElements.push(...sigBlock("Client"));
  signatureElements.push(...sigBlock("Provider"));

  // Confidentiality notice
  signatureElements.push(
    new Paragraph({ spacing: { before: 600 }, children: [] }),
    new Paragraph({
      spacing: { before: 100 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "CONFIDENTIAL \u2014 This document and the information contained herein are proprietary and confidential. Unauthorised reproduction, distribution, or disclosure is strictly prohibited.",
          size: 14,
          color: GRAY_500,
          italics: true,
          font: "Helvetica",
        }),
      ],
    })
  );

  // ── Assemble Document ───────────────────────────────────────────────────

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: "Helvetica", size: 20 },
        },
        heading1: {
          run: { font: "Helvetica", size: 28, bold: true, color: NAVY },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 1200, bottom: 1000, left: 1200 },
          },
        },
        headers: {
          default: {
            options: { children: [
              new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
                border: {
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: PURPLE, space: 4 },
                },
                children: [
                  new TextRun({ text: provider, bold: true, size: 16, color: GRAY_500, font: "Helvetica" }),
                  new TextRun({ text: "\t", size: 16 }),
                  new TextRun({ text: title, size: 16, color: GRAY_500, font: "Helvetica" }),
                ],
              }),
            ]},
          },
        },
        children: [
          ...coverElements,
          ...execSummaryElements,
          ...deliverableElements,
          ...detailElements,
          ...signatureElements,
        ],
      },
    ],
  });
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: sow, error } = await supabase
      .from("sows")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !sow) {
      return NextResponse.json({ error: "SOW not found" }, { status: 404 });
    }

    const s = sow as SOW;
    const doc = buildDocument(s);
    const buffer = await Packer.toBuffer(doc);

    const filename = (s.project_title || "SOW")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/\s+/g, "_");

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}.docx"`,
      },
    });
  } catch (err) {
    console.error("DOCX generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate DOCX" },
      { status: 500 }
    );
  }
}
