import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ReactPDF from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import React from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1a1a2e",
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#0A1628",
    marginBottom: 4,
  },
  customer: {
    fontSize: 13,
    color: "#666666",
    marginBottom: 4,
  },
  date: {
    fontSize: 10,
    color: "#999999",
    marginBottom: 24,
  },
  statusBadge: {
    fontSize: 9,
    color: "#0077CC",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0A1628",
    marginBottom: 10,
    marginTop: 20,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 8,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    borderRadius: 6,
    padding: 12,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0A1628",
  },
  deliverableName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    flex: 1,
  },
  deliverableWeeks: {
    fontSize: 10,
    color: "#666666",
    width: 60,
    textAlign: "right",
  },
  deliverableDesc: {
    fontSize: 10,
    color: "#666666",
    marginTop: 2,
    marginBottom: 4,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 4,
  },
  bullet: {
    width: 14,
    fontSize: 10,
  },
  listText: {
    flex: 1,
    fontSize: 11,
    color: "#333333",
  },
  bodyText: {
    fontSize: 11,
    color: "#333333",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#AAAAAA",
  },
});

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

function SOWDocument({ sow }: { sow: SOW }) {
  const createdDate = new Date(sow.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      // Header
      React.createElement(Text, { style: styles.title }, sow.project_title || "Untitled SOW"),
      React.createElement(Text, { style: styles.customer }, sow.customer_name),
      React.createElement(Text, { style: styles.date }, `Created ${createdDate}`),
      React.createElement(Text, { style: styles.statusBadge }, `Status: ${sow.status}`),

      // Executive Summary
      React.createElement(Text, { style: styles.sectionTitle }, "Executive Summary"),
      React.createElement(
        View,
        { style: styles.summaryGrid },
        React.createElement(
          View,
          { style: styles.summaryItem },
          React.createElement(Text, { style: styles.summaryLabel }, "Timeline"),
          React.createElement(Text, { style: styles.summaryValue }, `${sow.timeline_weeks} weeks`)
        ),
        React.createElement(
          View,
          { style: styles.summaryItem },
          React.createElement(Text, { style: styles.summaryLabel }, "Budget"),
          React.createElement(Text, { style: styles.summaryValue }, sow.budget_mentioned || "Not mentioned")
        ),
        React.createElement(
          View,
          { style: styles.summaryItem },
          React.createElement(Text, { style: styles.summaryLabel }, "Region"),
          React.createElement(Text, { style: styles.summaryValue }, sow.region || "Not specified")
        )
      ),

      // Deliverables
      React.createElement(Text, { style: styles.sectionTitle }, "Deliverables"),
      ...(sow.deliverables || []).map((d, i) =>
        React.createElement(
          View,
          { key: i, style: styles.row },
          React.createElement(
            View,
            { style: { flex: 1 } },
            React.createElement(
              View,
              { style: { flexDirection: "row", justifyContent: "space-between" } },
              React.createElement(Text, { style: styles.deliverableName }, d.name),
              React.createElement(Text, { style: styles.deliverableWeeks }, `${d.estimated_weeks} weeks`)
            ),
            React.createElement(Text, { style: styles.deliverableDesc }, d.description)
          )
        )
      ),

      // Success Metrics
      ...(sow.success_metrics && sow.success_metrics.length > 0
        ? [
            React.createElement(Text, { key: "sm-title", style: styles.sectionTitle }, "Success Metrics"),
            ...sow.success_metrics.map((m, i) =>
              React.createElement(
                View,
                { key: `sm-${i}`, style: styles.listItem },
                React.createElement(Text, { style: styles.bullet }, "\u2022"),
                React.createElement(Text, { style: styles.listText }, m)
              )
            ),
          ]
        : []),

      // Risks
      ...(sow.risks && sow.risks.length > 0
        ? [
            React.createElement(Text, { key: "r-title", style: styles.sectionTitle }, "Risks"),
            ...sow.risks.map((r, i) =>
              React.createElement(
                View,
                { key: `r-${i}`, style: styles.listItem },
                React.createElement(Text, { style: styles.bullet }, "\u2022"),
                React.createElement(Text, { style: styles.listText }, r)
              )
            ),
          ]
        : []),

      // Special Requirements
      ...(sow.special_requirements
        ? [
            React.createElement(Text, { key: "sr-title", style: styles.sectionTitle }, "Special Requirements"),
            React.createElement(Text, { key: "sr-body", style: styles.bodyText }, sow.special_requirements),
          ]
        : []),

      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, null, "EngagementFlow"),
        React.createElement(Text, null, `Generated ${createdDate}`)
      )
    )
  );
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
    const pdfStream = await ReactPDF.renderToStream(
      React.createElement(SOWDocument, { sow: s })
    );

    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    const filename = (s.project_title || "SOW").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
