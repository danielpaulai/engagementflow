import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Deliverable {
  name: string;
  description: string;
  estimated_weeks: number;
}

export interface SOWArtifact {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  section: "hld" | "appendix";
  appendix_label: string;
  file_size: number;
}

export interface SOW {
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

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  accent: "#7C3AED",
  white: "#FFFFFF",
  bg: "#FAFAFA",
  sigBg: "#F9F9F9",
  gray200: "#E5E7EB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray700: "#374151",
  gray900: "#111827",
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  // Content pages
  page: {
    paddingTop: 80,
    paddingBottom: 56,
    paddingHorizontal: 60,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: C.gray700,
    backgroundColor: C.white,
  },

  // Page header (fixed)
  pageHeader: { position: "absolute", top: 28, left: 60, right: 60 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  headerClient: { fontSize: 9, color: C.gray500 },
  headerPageNum: { fontSize: 9, color: C.gray500 },
  headerRule: { height: 0.5, backgroundColor: C.gray200 },

  // Document title area (first page)
  brandName: { fontSize: 13, color: C.gray400, marginBottom: 32 },
  docTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: C.gray900,
    lineHeight: 1.15,
    marginBottom: 8,
  },
  docSubtitle: { fontSize: 13, color: C.gray500, marginBottom: 6 },
  docMeta: { fontSize: 10, color: C.gray400, marginBottom: 4 },
  titleDivider: { height: 0.5, backgroundColor: C.gray200, marginTop: 20, marginBottom: 60 },

  // Section heading
  sectionWrap: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 16,
  },
  sectionBar: { width: 3, backgroundColor: C.accent, marginRight: 12 },
  sectionText: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.gray900,
    paddingVertical: 2,
  },
  sectionSpacing: { height: 60 },

  // Summary grid
  summaryRow: { flexDirection: "row", gap: 24, marginBottom: 20 },
  summaryItem: { flex: 1 },
  summaryLabel: {
    fontSize: 9,
    color: C.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.gray900 },

  // Body text
  bodyText: { fontSize: 11, color: C.gray700, lineHeight: 1.7, marginBottom: 8 },

  // Deliverable table
  tableHeaderRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 0,
    backgroundColor: C.white,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 0,
    backgroundColor: C.bg,
  },
  tCellName: { flex: 3, fontSize: 10, fontFamily: "Helvetica-Bold", color: C.gray900, paddingRight: 8 },
  tCellDesc: { flex: 5, fontSize: 10, color: C.gray700, lineHeight: 1.5, paddingRight: 8 },
  tCellWeeks: { flex: 1, fontSize: 10, color: C.gray700, textAlign: "right" },

  // List
  listItem: { flexDirection: "row", marginBottom: 6, paddingLeft: 2 },
  bullet: { width: 14, fontSize: 10, color: C.gray400 },
  listText: { flex: 1, fontSize: 11, color: C.gray700, lineHeight: 1.6 },

  // Signature block
  sigBlock: {
    backgroundColor: C.sigBg,
    padding: 32,
    marginTop: 24,
  },
  sigIntro: { fontSize: 11, color: C.gray700, lineHeight: 1.7, marginBottom: 32 },
  sigRow: { flexDirection: "row", gap: 48 },
  sigColumn: { flex: 1 },
  sigColumnTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.gray900,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 24,
  },
  sigField: { marginBottom: 20 },
  sigLine: { height: 0.5, backgroundColor: C.gray400, marginBottom: 6 },
  sigLabel: { fontSize: 9, color: C.gray400 },

  // Confidentiality footer
  confWrap: { position: "absolute", bottom: 28, left: 60, right: 60 },
  confRule: { height: 0.5, backgroundColor: C.gray200, marginBottom: 8 },
  confText: { fontSize: 7, color: C.gray400, lineHeight: 1.5, textAlign: "center" },
  appendixHeader: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.gray900,
    marginBottom: 4,
  },
  appendixSubtext: {
    fontSize: 10,
    color: C.gray500,
    marginBottom: 16,
  },
  appendixItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    backgroundColor: C.bg,
  },
  appendixItemLabel: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.gray900,
  },
  appendixItemFile: {
    fontSize: 9,
    color: C.gray400,
  },
  appendixDivider: {
    height: 0.5,
    backgroundColor: C.gray200,
    marginBottom: 20,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const V = View;
const T = Text;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Main Document Builder ────────────────────────────────────────────────────

export function buildSOWDocument(sow: SOW, artifacts: SOWArtifact[] = []): React.ReactElement {
  const createdDate = formatDate(sow.created_at);
  const provider = "EngagementFlow";
  const title = sow.project_title || "Statement of Work";
  const client = sow.customer_name || "Client";
  const deliverables = sow.deliverables || [];
  const metrics = sow.success_metrics || [];
  const risks = sow.risks || [];

  // ── Page header (fixed on every page) ───────────────────────────────────

  const pageHeader = React.createElement(
    V,
    { style: st.pageHeader, fixed: true },
    React.createElement(
      V,
      { style: st.headerRow },
      React.createElement(T, { style: st.headerClient }, client),
      React.createElement(T, {
        style: st.headerPageNum,
        render: ({ pageNumber: pn }: { pageNumber: number }) => String(pn),
      })
    ),
    React.createElement(V, { style: st.headerRule })
  );

  // ── Section heading builder ─────────────────────────────────────────────

  const heading = (text: string, key?: string) =>
    React.createElement(
      V,
      { style: st.sectionWrap, ...(key ? { key } : {}) },
      React.createElement(V, { style: st.sectionBar }),
      React.createElement(T, { style: st.sectionText }, text)
    );

  const sectionSpacer = (key: string) =>
    React.createElement(V, { style: st.sectionSpacing, key });

  // ── Signature field builder ─────────────────────────────────────────────

  const sigField = (label: string) =>
    React.createElement(
      V,
      { style: st.sigField },
      React.createElement(V, { style: st.sigLine }),
      React.createElement(T, { style: st.sigLabel }, label)
    );

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE 1: TITLE + EXECUTIVE SUMMARY + DELIVERABLES
  // ═══════════════════════════════════════════════════════════════════════

  const deliverableRows = deliverables.map((d, i) => {
    const rowStyle = i % 2 === 1 ? st.tableRowAlt : st.tableRow;
    return React.createElement(
      V,
      { key: `del-${i}`, style: rowStyle },
      React.createElement(T, { style: st.tCellName }, d.name),
      React.createElement(T, { style: st.tCellDesc }, d.description),
      React.createElement(
        T,
        { style: st.tCellWeeks },
        d.estimated_weeks ? String(d.estimated_weeks) : "\u2014"
      )
    );
  });

  const page1 = React.createElement(
    Page,
    { size: "A4", style: st.page },
    pageHeader,

    // Brand name
    React.createElement(T, { style: st.brandName }, provider),

    // Document title
    React.createElement(T, { style: st.docTitle }, title),
    React.createElement(T, { style: st.docSubtitle }, `Prepared for ${client}`),
    React.createElement(T, { style: st.docMeta }, createdDate),
    React.createElement(
      T,
      { style: st.docMeta },
      `Status: ${(sow.status || "draft").replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}`
    ),
    React.createElement(V, { style: st.titleDivider }),

    // Executive Summary
    heading("Executive Summary"),

    // Summary grid
    React.createElement(
      V,
      { style: st.summaryRow },
      React.createElement(
        V,
        { style: st.summaryItem },
        React.createElement(T, { style: st.summaryLabel }, "Budget"),
        React.createElement(T, { style: st.summaryValue }, sow.budget_mentioned || "TBD")
      ),
      React.createElement(
        V,
        { style: st.summaryItem },
        React.createElement(T, { style: st.summaryLabel }, "Timeline"),
        React.createElement(
          T,
          { style: st.summaryValue },
          sow.timeline_weeks ? `${sow.timeline_weeks} Weeks` : "TBD"
        )
      ),
      React.createElement(
        V,
        { style: st.summaryItem },
        React.createElement(T, { style: st.summaryLabel }, "Region"),
        React.createElement(T, { style: st.summaryValue }, sow.region || "Global")
      )
    ),

    React.createElement(
      T,
      { style: st.bodyText },
      `This Statement of Work outlines the engagement between ${client} and ${provider} for the ${title} engagement. The scope, deliverables, timeline, and commercial terms detailed herein constitute the agreed framework for execution.`
    ),

    sectionSpacer("sp1"),

    // Deliverables
    heading("Deliverables"),
    deliverables.length > 0
      ? React.createElement(
          V,
          {},
          React.createElement(
            V,
            { style: st.tableHeaderRow },
            React.createElement(
              T,
              { style: { ...st.tableHeaderCell, flex: 3 } },
              "Deliverable"
            ),
            React.createElement(
              T,
              { style: { ...st.tableHeaderCell, flex: 5 } },
              "Description"
            ),
            React.createElement(
              T,
              {
                style: {
                  ...st.tableHeaderCell,
                  flex: 1,
                  textAlign: "right" as const,
                },
              },
              "Weeks"
            )
          ),
          ...deliverableRows
        )
      : React.createElement(T, { style: st.bodyText }, "No deliverables specified.")
  );

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE 2: METRICS, RISKS, SPECIAL REQUIREMENTS (conditional)
  // ═══════════════════════════════════════════════════════════════════════

  const hasDetails =
    metrics.length > 0 || risks.length > 0 || !!sow.special_requirements;

  const detailChildren: React.ReactNode[] = [pageHeader];

  if (metrics.length > 0) {
    detailChildren.push(heading("Success Metrics", "sm-h"));
    metrics.forEach((m, i) => {
      detailChildren.push(
        React.createElement(
          V,
          { key: `sm-${i}`, style: st.listItem },
          React.createElement(T, { style: st.bullet }, "\u2022"),
          React.createElement(T, { style: st.listText }, m)
        )
      );
    });
  }

  if (risks.length > 0) {
    if (metrics.length > 0) detailChildren.push(sectionSpacer("sp-r"));
    detailChildren.push(heading("Risks", "r-h"));
    risks.forEach((r, i) => {
      detailChildren.push(
        React.createElement(
          V,
          { key: `r-${i}`, style: st.listItem },
          React.createElement(T, { style: st.bullet }, "\u2022"),
          React.createElement(T, { style: st.listText }, r)
        )
      );
    });
  }

  if (sow.special_requirements) {
    detailChildren.push(sectionSpacer("sp-sr"));
    detailChildren.push(heading("Special Requirements", "sr-h"));
    detailChildren.push(
      React.createElement(
        T,
        { key: "sr-body", style: st.bodyText },
        sow.special_requirements
      )
    );
  }

  const hldArtifacts = artifacts.filter((a) => a.section === "hld");
  const appendixArtifacts = artifacts.filter((a) => a.section === "appendix");

  if (hldArtifacts.length > 0) {
    detailChildren.push(sectionSpacer("sp-hld"));
    detailChildren.push(heading("High Level Design", "hld-h"));
    hldArtifacts.forEach((artifact, i) => {
      detailChildren.push(
        React.createElement(
          V,
          { key: `hld-${i}`, style: st.listItem },
          React.createElement(T, { style: st.bullet }, "\u2022"),
          React.createElement(T, { style: st.listText }, artifact.file_name)
        )
      );
    });
  }

  const detailsPage = hasDetails || hldArtifacts.length > 0
    ? React.createElement(
        Page,
        { size: "A4", style: st.page },
        ...detailChildren
      )
    : null;

  // ═══════════════════════════════════════════════════════════════════════
  // LAST PAGE: SIGNATURE
  // ═══════════════════════════════════════════════════════════════════════

  const signaturePage = React.createElement(
    Page,
    { size: "A4", style: st.page },
    pageHeader,

    heading("Authorisation & Signatures"),

    React.createElement(
      V,
      { style: st.sigBlock },
      React.createElement(
        T,
        { style: st.sigIntro },
        `This Statement of Work is entered into between ${client} and ${provider} in connection with the ${title} engagement. By signing below, both parties agree to the terms outlined in the preceding sections.`
      ),

      React.createElement(
        V,
        { style: st.sigRow },
        // Client column
        React.createElement(
          V,
          { style: st.sigColumn },
          React.createElement(T, { style: st.sigColumnTitle }, "Client"),
          sigField("Authorised Signature"),
          sigField("Printed Name"),
          sigField("Title"),
          sigField("Date")
        ),
        // Provider column
        React.createElement(
          V,
          { style: st.sigColumn },
          React.createElement(T, { style: st.sigColumnTitle }, "Provider"),
          sigField("Authorised Signature"),
          sigField("Printed Name"),
          sigField("Title"),
          sigField("Date")
        )
      )
    ),

    // Confidentiality footer
    React.createElement(
      V,
      { style: st.confWrap },
      React.createElement(V, { style: st.confRule }),
      React.createElement(
        T,
        { style: st.confText },
        "CONFIDENTIAL \u2014 This document and the information contained herein are proprietary and confidential. Unauthorised reproduction, distribution, or disclosure is strictly prohibited."
      )
    )
  );

  // ═══════════════════════════════════════════════════════════════════════
  // APPENDICES PAGE
  // ═══════════════════════════════════════════════════════════════════════

  const appendixPage = appendixArtifacts.length > 0
    ? React.createElement(
        Page,
        { size: "A4", style: st.page },
        pageHeader,
        heading("Appendices"),
        React.createElement(V, { style: st.appendixDivider }),
        ...appendixArtifacts.map((artifact, i) =>
          React.createElement(
            V,
            { key: `app-${i}`, style: st.appendixItem },
            React.createElement(
              V,
              { style: { flex: 1 } },
              React.createElement(
                T,
                { style: st.appendixItemLabel },
                artifact.appendix_label || `Appendix ${String.fromCharCode(65 + i)}`
              ),
              React.createElement(
                T,
                { style: st.appendixItemFile },
                artifact.file_name
              )
            )
          )
        )
      )
    : null;

  // ═══════════════════════════════════════════════════════════════════════
  // ASSEMBLE DOCUMENT
  // ═══════════════════════════════════════════════════════════════════════

  const pages: React.ReactNode[] = [page1];
  if (detailsPage) pages.push(detailsPage);
  if (appendixPage) pages.push(appendixPage);
  pages.push(signaturePage);

  return React.createElement(Document, {}, ...pages);
}
