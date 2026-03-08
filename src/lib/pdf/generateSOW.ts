import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Deliverable {
  name: string;
  description: string;
  estimated_weeks: number;
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
  navy: "#0F1629",
  navyLight: "#1A1A2E",
  purple: "#9333EA",
  purpleBg: "#F9F5FF",
  purpleMid: "#E9D5FF",
  white: "#FFFFFF",
  offWhite: "#F9F5FF",
  gray100: "#F3F4F6",
  gray300: "#D1D5DB",
  gray500: "#6B7280",
  gray700: "#374151",
  gray900: "#111827",
  green: "#059669",
  greenBg: "#ECFDF5",
  blue: "#2563EB",
  blueBg: "#EFF6FF",
  amber: "#D97706",
  amberBg: "#FFFBEB",
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  // Cover
  coverPage: { backgroundColor: C.navy, position: "relative", padding: 0 },
  coverContent: { flex: 1, justifyContent: "center", paddingHorizontal: 72, paddingTop: 120 },
  coverClient: { fontSize: 38, fontFamily: "Helvetica-Bold", color: C.white, letterSpacing: -0.5, marginBottom: 16, lineHeight: 1.1 },
  coverTitle: { fontSize: 18, fontFamily: "Helvetica", color: C.purpleMid, marginBottom: 8, lineHeight: 1.4 },
  coverDivider: { width: 64, height: 3, backgroundColor: C.purple, marginVertical: 28 },
  coverDate: { fontSize: 11, color: C.gray500, marginBottom: 4 },
  coverStatus: { fontSize: 10, color: C.purple, textTransform: "uppercase", letterSpacing: 1.5 },
  coverFooter: { position: "absolute", bottom: 48, left: 72, right: 72 },
  coverFooterRule: { height: 1, backgroundColor: "#2A2A4A", marginBottom: 16 },
  coverFooterText: { fontSize: 10, color: C.gray500 },
  coverFooterBrand: { fontSize: 10, color: C.purple, fontFamily: "Helvetica-Bold", marginTop: 2 },

  // Diagonal lines
  diagContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  diagLine: { position: "absolute", height: 1, backgroundColor: "#1E2540", transform: "rotate(-35deg)", transformOrigin: "0 0" },

  // Content pages
  contentPage: { paddingTop: 72, paddingBottom: 64, paddingHorizontal: 56, fontSize: 10, fontFamily: "Helvetica", color: C.gray900 },

  // Page header
  pageHeader: { position: "absolute", top: 28, left: 56, right: 56 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  headerLeft: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.gray500, textTransform: "uppercase", letterSpacing: 1 },
  headerRight: { fontSize: 8, color: C.gray500, maxWidth: 280 },
  headerRule: { height: 1, backgroundColor: C.purple, opacity: 0.4 },

  // Page number
  pageNum: { position: "absolute", bottom: 28, right: 56, fontSize: 8, color: C.gray500 },

  // Section heading
  sectionWrap: { flexDirection: "row", alignItems: "center", marginTop: 24, marginBottom: 14 },
  sectionBar: { width: 3, backgroundColor: C.purple, marginRight: 10, alignSelf: "stretch" },
  sectionBg: { flex: 1, backgroundColor: C.purpleBg, paddingVertical: 8, paddingHorizontal: 12 },
  sectionText: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.navy, textTransform: "uppercase", letterSpacing: 0.8 },

  // Stat boxes
  statRow: { flexDirection: "row", gap: 16, marginBottom: 20 },
  statBox: { flex: 1, borderRadius: 6, padding: 16, alignItems: "center" },
  statLabel: { fontSize: 8, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  statValue: { fontSize: 18, fontFamily: "Helvetica-Bold" },

  // Deliverable table
  tableBorder: { borderWidth: 1, borderColor: C.gray300, borderRadius: 4, overflow: "hidden", marginBottom: 4 },
  tHeaderRow: { flexDirection: "row", backgroundColor: C.navyLight, paddingVertical: 8, paddingHorizontal: 10 },
  tHeaderCell: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.white, textTransform: "uppercase", letterSpacing: 0.5 },
  tRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  tRowAlt: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, backgroundColor: C.offWhite, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  tCellName: { flex: 3, fontSize: 10, fontFamily: "Helvetica-Bold", color: C.gray900, paddingRight: 8 },
  tCellDesc: { flex: 5, fontSize: 9, color: C.gray700, paddingRight: 8, lineHeight: 1.4 },
  tCellWeeks: { flex: 1, fontSize: 10, color: C.gray700, textAlign: "right" },

  // List
  listItem: { flexDirection: "row", marginBottom: 5, paddingLeft: 4 },
  bullet: { width: 14, fontSize: 10, color: C.purple },
  listText: { flex: 1, fontSize: 10, color: C.gray700, lineHeight: 1.5 },

  // Body text
  bodyText: { fontSize: 10, color: C.gray700, lineHeight: 1.6, marginBottom: 6 },

  // Signature page
  sigIntro: { fontSize: 10, color: C.gray700, lineHeight: 1.6, marginBottom: 8 },
  sigAgreement: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.gray900, lineHeight: 1.6, marginTop: 12, marginBottom: 32 },
  sigRow: { flexDirection: "row", gap: 40, marginBottom: 24 },
  sigBlock: { flex: 1, borderWidth: 1, borderColor: C.gray300, borderRadius: 6, padding: 20 },
  sigBlockTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.navy, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 20 },
  sigField: { marginBottom: 16 },
  sigLabel: { fontSize: 8, color: C.gray500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  sigLine: { height: 1, backgroundColor: C.gray300 },
  confWrap: { position: "absolute", bottom: 28, left: 56, right: 56 },
  confRule: { height: 1, backgroundColor: C.gray100, marginBottom: 8 },
  confText: { fontSize: 7, color: C.gray500, lineHeight: 1.5, textAlign: "center" },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const V = View;
const T = Text;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// ─── Main Document Builder ────────────────────────────────────────────────────

export function buildSOWDocument(sow: SOW): React.ReactElement {
  const createdDate = formatDate(sow.created_at);
  const provider = "EngagementFlow";
  const title = sow.project_title || "Statement of Work";
  const client = sow.customer_name || "Client";
  const deliverables = sow.deliverables || [];
  const metrics = sow.success_metrics || [];
  const risks = sow.risks || [];

  // ── Build diagonal lines for cover ──────────────────────────────────────

  const diagLines: React.ReactElement[] = [];
  for (let i = 0; i < 20; i++) {
    diagLines.push(
      React.createElement(V, { key: `d${i}`, style: { ...st.diagLine, width: 900, top: -100 + i * 55, left: -200 } })
    );
  }

  // ── Page header + page number (reused) ──────────────────────────────────

  const pageHeader = React.createElement(
    V, { style: st.pageHeader, fixed: true },
    React.createElement(
      V, { style: st.headerRow },
      React.createElement(T, { style: st.headerLeft }, provider),
      React.createElement(T, { style: st.headerRight }, title)
    ),
    React.createElement(V, { style: st.headerRule })
  );

  const pageNumber = React.createElement(T, {
    style: st.pageNum,
    render: ({ pageNumber: pn }: { pageNumber: number }) => String(pn),
    fixed: true,
  });

  // ── Section heading builder ─────────────────────────────────────────────

  const heading = (text: string, key?: string) =>
    React.createElement(
      V, { style: st.sectionWrap, ...(key ? { key } : {}) },
      React.createElement(V, { style: st.sectionBar }),
      React.createElement(V, { style: st.sectionBg },
        React.createElement(T, { style: st.sectionText }, text)
      )
    );

  // ── Signature field builder ─────────────────────────────────────────────

  const sigField = (label: string, last?: boolean) =>
    React.createElement(
      V, { style: last ? { ...st.sigField, marginBottom: 0 } : st.sigField },
      React.createElement(T, { style: st.sigLabel }, label),
      React.createElement(V, { style: st.sigLine })
    );

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE 1: COVER
  // ═══════════════════════════════════════════════════════════════════════

  const coverPage = React.createElement(
    Page, { size: "A4", style: st.coverPage },
    // Diagonal pattern background
    React.createElement(V, { style: st.diagContainer }, ...diagLines),
    // Main content
    React.createElement(
      V, { style: st.coverContent },
      React.createElement(T, { style: st.coverClient }, client),
      React.createElement(V, { style: st.coverDivider }),
      React.createElement(T, { style: st.coverTitle }, title),
      React.createElement(V, { style: { height: 24 } }),
      React.createElement(T, { style: st.coverDate }, createdDate),
      React.createElement(T, { style: st.coverStatus }, `Status: ${(sow.status || "draft").toUpperCase()}`)
    ),
    // Footer
    React.createElement(
      V, { style: st.coverFooter },
      React.createElement(V, { style: st.coverFooterRule }),
      React.createElement(T, { style: st.coverFooterText }, "Prepared by"),
      React.createElement(T, { style: st.coverFooterBrand }, provider)
    )
  );

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE 2: EXECUTIVE SUMMARY + DELIVERABLES
  // ═══════════════════════════════════════════════════════════════════════

  const deliverableRows = deliverables.map((d, i) => {
    const isLast = i === deliverables.length - 1;
    const base = i % 2 === 1 ? st.tRowAlt : st.tRow;
    const rowStyle = isLast ? { ...base, borderBottomWidth: 0 } : base;
    return React.createElement(
      V, { key: `del-${i}`, style: rowStyle },
      React.createElement(T, { style: st.tCellName }, d.name),
      React.createElement(T, { style: st.tCellDesc }, d.description),
      React.createElement(T, { style: st.tCellWeeks }, d.estimated_weeks ? String(d.estimated_weeks) : "—")
    );
  });

  const execPage = React.createElement(
    Page, { size: "A4", style: st.contentPage },
    pageHeader,
    pageNumber,

    // Executive Summary heading
    heading("Executive Summary"),

    // Three stat boxes
    React.createElement(
      V, { style: st.statRow },
      React.createElement(
        V, { style: { ...st.statBox, backgroundColor: C.greenBg } },
        React.createElement(T, { style: { ...st.statLabel, color: C.green } }, "Budget"),
        React.createElement(T, { style: { ...st.statValue, color: C.green } }, sow.budget_mentioned || "TBD")
      ),
      React.createElement(
        V, { style: { ...st.statBox, backgroundColor: C.blueBg } },
        React.createElement(T, { style: { ...st.statLabel, color: C.blue } }, "Timeline"),
        React.createElement(T, { style: { ...st.statValue, color: C.blue } }, sow.timeline_weeks ? `${sow.timeline_weeks} Weeks` : "TBD")
      ),
      React.createElement(
        V, { style: { ...st.statBox, backgroundColor: C.amberBg } },
        React.createElement(T, { style: { ...st.statLabel, color: C.amber } }, "Region"),
        React.createElement(T, { style: { ...st.statValue, color: C.amber } }, sow.region || "Global")
      )
    ),

    // Overview paragraph
    React.createElement(T, { style: st.bodyText },
      `This Statement of Work outlines the engagement between ${client} and ${provider} for the ${title} engagement. The scope, deliverables, timeline, and commercial terms detailed herein constitute the agreed framework for execution.`
    ),

    // Deliverables heading + table
    heading("Deliverables"),
    deliverables.length > 0
      ? React.createElement(
          V, { style: st.tableBorder },
          React.createElement(
            V, { style: st.tHeaderRow },
            React.createElement(T, { style: { ...st.tHeaderCell, flex: 3 } }, "Deliverable"),
            React.createElement(T, { style: { ...st.tHeaderCell, flex: 5 } }, "Description"),
            React.createElement(T, { style: { ...st.tHeaderCell, flex: 1, textAlign: "right" as const } }, "Weeks")
          ),
          ...deliverableRows
        )
      : React.createElement(T, { style: st.bodyText }, "No deliverables specified.")
  );

  // ═══════════════════════════════════════════════════════════════════════
  // PAGE 3: METRICS, RISKS, SPECIAL REQUIREMENTS (conditional)
  // ═══════════════════════════════════════════════════════════════════════

  const hasDetails = metrics.length > 0 || risks.length > 0 || !!sow.special_requirements;

  const detailChildren: React.ReactNode[] = [pageHeader, pageNumber];

  if (metrics.length > 0) {
    detailChildren.push(heading("Success Metrics", "sm-h"));
    metrics.forEach((m, i) => {
      detailChildren.push(
        React.createElement(
          V, { key: `sm-${i}`, style: st.listItem },
          React.createElement(T, { style: st.bullet }, "\u2022"),
          React.createElement(T, { style: st.listText }, m)
        )
      );
    });
  }

  if (risks.length > 0) {
    detailChildren.push(heading("Risks", "r-h"));
    risks.forEach((r, i) => {
      detailChildren.push(
        React.createElement(
          V, { key: `r-${i}`, style: st.listItem },
          React.createElement(T, { style: st.bullet }, "\u2022"),
          React.createElement(T, { style: st.listText }, r)
        )
      );
    });
  }

  if (sow.special_requirements) {
    detailChildren.push(heading("Special Requirements", "sr-h"));
    detailChildren.push(React.createElement(T, { key: "sr-body", style: st.bodyText }, sow.special_requirements));
  }

  const detailsPage = hasDetails
    ? React.createElement(Page, { size: "A4", style: st.contentPage }, ...detailChildren)
    : null;

  // ═══════════════════════════════════════════════════════════════════════
  // LAST PAGE: SIGNATURE PAGE
  // ═══════════════════════════════════════════════════════════════════════

  const signaturePage = React.createElement(
    Page, { size: "A4", style: st.contentPage },
    pageHeader,
    pageNumber,

    heading("Authorisation & Signatures"),

    // Engagement recap
    React.createElement(T, { style: st.sigIntro },
      `This Statement of Work (\u201CSOW\u201D) is entered into between ${client} (\u201CClient\u201D) and ${provider} (\u201CProvider\u201D) in connection with the ${title} engagement. The scope of work, deliverables, timeline of ${sow.timeline_weeks ? `${sow.timeline_weeks} weeks` : "[duration]"}, and commercial terms outlined in the preceding sections constitute the full agreement between both parties for this engagement.`
    ),

    React.createElement(T, { style: st.sigAgreement },
      "By signing below, both parties agree to the terms of this Statement of Work."
    ),

    // Two side-by-side signature blocks
    React.createElement(
      V, { style: st.sigRow },
      // Client block
      React.createElement(
        V, { style: st.sigBlock },
        React.createElement(T, { style: st.sigBlockTitle }, "Client"),
        sigField("Signature"),
        sigField("Printed Name"),
        sigField("Title"),
        sigField("Date"),
        sigField("Company", true)
      ),
      // Provider block
      React.createElement(
        V, { style: st.sigBlock },
        React.createElement(T, { style: st.sigBlockTitle }, "Provider"),
        sigField("Signature"),
        sigField("Printed Name"),
        sigField("Title"),
        sigField("Date"),
        sigField("Company", true)
      )
    ),

    // Confidentiality footer
    React.createElement(
      V, { style: st.confWrap },
      React.createElement(V, { style: st.confRule }),
      React.createElement(T, { style: st.confText },
        "CONFIDENTIAL \u2014 This document and the information contained herein are proprietary and confidential. This Statement of Work is intended solely for the use of the parties named above. Unauthorised reproduction, distribution, or disclosure of this document or its contents is strictly prohibited. All intellectual property, methodologies, and deliverables referenced remain the property of their respective owners until transfer conditions outlined herein are fulfilled."
      )
    )
  );

  // ═══════════════════════════════════════════════════════════════════════
  // ASSEMBLE DOCUMENT
  // ═══════════════════════════════════════════════════════════════════════

  const pages: React.ReactNode[] = [coverPage, execPage];
  if (detailsPage) pages.push(detailsPage);
  pages.push(signaturePage);

  return React.createElement(Document, {}, ...pages);
}
