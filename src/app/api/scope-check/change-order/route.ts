import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ReactPDF from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import React from "react";

interface OutOfScopeItem {
  item: string;
  reason: string;
  estimated_effort?: string;
}

interface CatalogMatch {
  service_name: string;
  description: string;
  hours_min: number;
  hours_max: number;
  base_rate: number;
  currency: string;
  region: string;
}

interface ChangeOrderLine {
  item: string;
  reason: string;
  estimated_effort: string;
  matched_service: string | null;
  hours_min: number;
  hours_max: number;
  rate: number;
  currency: string;
}

interface ChangeOrderData {
  change_order_number: string;
  date: string;
  original_sow_title: string;
  original_sow_customer: string;
  line_items: ChangeOrderLine[];
  total_min: number;
  total_max: number;
  currency: string;
}

// ── PDF Styles ────────────────────────────────────────────────────────────────

const C = {
  navy: "#0F1629",
  navyLight: "#1A1A2E",
  purple: "#9333EA",
  purpleBg: "#F9F5FF",
  white: "#FFFFFF",
  gray100: "#F3F4F6",
  gray300: "#D1D5DB",
  gray500: "#6B7280",
  gray700: "#374151",
  gray900: "#111827",
};

const st = StyleSheet.create({
  page: { paddingTop: 72, paddingBottom: 64, paddingHorizontal: 56, fontSize: 10, fontFamily: "Helvetica", color: C.gray900 },
  header: { position: "absolute", top: 28, left: 56, right: 56 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  headerLeft: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.gray500, textTransform: "uppercase", letterSpacing: 1 },
  headerRight: { fontSize: 8, color: C.gray500 },
  headerRule: { height: 1, backgroundColor: C.purple, opacity: 0.4 },
  pageNum: { position: "absolute", bottom: 28, right: 56, fontSize: 8, color: C.gray500 },
  sectionWrap: { flexDirection: "row", alignItems: "center", marginTop: 24, marginBottom: 14 },
  sectionBar: { width: 3, backgroundColor: C.purple, marginRight: 10, alignSelf: "stretch" },
  sectionBg: { flex: 1, backgroundColor: C.purpleBg, paddingVertical: 8, paddingHorizontal: 12 },
  sectionText: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.navy, textTransform: "uppercase", letterSpacing: 0.8 },
  bodyText: { fontSize: 10, color: C.gray700, lineHeight: 1.6, marginBottom: 6 },
  tHeaderRow: { flexDirection: "row", backgroundColor: C.navyLight, paddingVertical: 8, paddingHorizontal: 10 },
  tHeaderCell: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.white, textTransform: "uppercase", letterSpacing: 0.5 },
  tRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  tRowAlt: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, backgroundColor: C.purpleBg, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  totalRow: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 10, backgroundColor: C.purpleBg, borderTopWidth: 2, borderTopColor: C.purple },
  tableBorder: { borderWidth: 1, borderColor: C.gray300, borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  sigField: { marginBottom: 16 },
  sigLabel: { fontSize: 8, color: C.gray500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  sigLine: { height: 1, backgroundColor: C.gray300 },
  sigBlock: { flex: 1, borderWidth: 1, borderColor: C.gray300, borderRadius: 6, padding: 20 },
  sigBlockTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.navy, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 20 },
  sigRow: { flexDirection: "row", gap: 40, marginTop: 20, marginBottom: 24 },
  confWrap: { position: "absolute", bottom: 28, left: 56, right: 56 },
  confRule: { height: 1, backgroundColor: C.gray100, marginBottom: 8 },
  confText: { fontSize: 7, color: C.gray500, lineHeight: 1.5, textAlign: "center" },
});

const V = View;
const T = Text;

function heading(text: string, key?: string) {
  return React.createElement(V, { style: st.sectionWrap, ...(key ? { key } : {}) },
    React.createElement(V, { style: st.sectionBar }),
    React.createElement(V, { style: st.sectionBg },
      React.createElement(T, { style: st.sectionText }, text)
    )
  );
}

function sigField(label: string, last?: boolean) {
  return React.createElement(V, { style: last ? { ...st.sigField, marginBottom: 0 } : st.sigField },
    React.createElement(T, { style: st.sigLabel }, label),
    React.createElement(V, { style: st.sigLine })
  );
}

function buildChangeOrderPDF(data: ChangeOrderData) {
  const provider = "EngagementFlow";
  const pageHeader = React.createElement(V, { style: st.header, fixed: true },
    React.createElement(V, { style: st.headerRow },
      React.createElement(T, { style: st.headerLeft }, provider),
      React.createElement(T, { style: st.headerRight }, `Change Order ${data.change_order_number}`)
    ),
    React.createElement(V, { style: st.headerRule })
  );
  const pageNum = React.createElement(T, {
    style: st.pageNum,
    render: ({ pageNumber }: { pageNumber: number }) => String(pageNumber),
    fixed: true,
  });

  const currSym = data.currency === "USD" ? "$" : data.currency === "EUR" ? "\u20AC" : data.currency === "GBP" ? "\u00A3" : `${data.currency} `;

  // Table rows
  const tableRows = data.line_items.map((li, i) => {
    const rowStyle = i % 2 === 1 ? st.tRowAlt : st.tRow;
    const isLast = i === data.line_items.length - 1;
    return React.createElement(V, { key: `li-${i}`, style: isLast ? { ...rowStyle, borderBottomWidth: 0 } : rowStyle },
      React.createElement(T, { style: { flex: 4, fontSize: 9, color: C.gray900, fontFamily: "Helvetica-Bold", paddingRight: 6 } }, li.item),
      React.createElement(T, { style: { flex: 2, fontSize: 9, color: C.gray700, paddingRight: 6 } }, li.matched_service || "Custom"),
      React.createElement(T, { style: { flex: 1, fontSize: 9, color: C.gray700, textAlign: "center" } }, `${li.hours_min}-${li.hours_max}`),
      React.createElement(T, { style: { flex: 1, fontSize: 9, color: C.gray700, textAlign: "right" } }, `${currSym}${li.rate.toLocaleString()}`)
    );
  });

  const totalMin = `${currSym}${data.total_min.toLocaleString()}`;
  const totalMax = `${currSym}${data.total_max.toLocaleString()}`;

  return React.createElement(Document, {},
    React.createElement(Page, { size: "A4", style: st.page },
      pageHeader,
      pageNum,

      // Title
      React.createElement(T, { style: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.navy, marginBottom: 4 } }, `Change Order ${data.change_order_number}`),
      React.createElement(T, { style: { fontSize: 11, color: C.gray500, marginBottom: 4 } }, `Date: ${data.date}`),
      React.createElement(T, { style: { fontSize: 11, color: C.gray500, marginBottom: 20 } }, `Reference: ${data.original_sow_title} - ${data.original_sow_customer}`),

      heading("Scope Change Items"),
      React.createElement(T, { style: st.bodyText },
        `The following items have been identified as outside the scope of the original Statement of Work. This Change Order formalises the additional work required, with estimated effort and rates drawn from the service catalog where applicable.`
      ),

      // Table
      React.createElement(V, { style: st.tableBorder },
        React.createElement(V, { style: st.tHeaderRow },
          React.createElement(T, { style: { ...st.tHeaderCell, flex: 4 } }, "Item"),
          React.createElement(T, { style: { ...st.tHeaderCell, flex: 2 } }, "Service"),
          React.createElement(T, { style: { ...st.tHeaderCell, flex: 1, textAlign: "center" } }, "Hours"),
          React.createElement(T, { style: { ...st.tHeaderCell, flex: 1, textAlign: "right" } }, "Rate"),
        ),
        ...tableRows,
        // Total row
        React.createElement(V, { style: st.totalRow },
          React.createElement(T, { style: { flex: 4, fontSize: 10, fontFamily: "Helvetica-Bold", color: C.navy } }, "TOTAL ADDITIONAL FEE"),
          React.createElement(T, { style: { flex: 2, fontSize: 9, color: C.gray500 } }, ""),
          React.createElement(T, { style: { flex: 2, fontSize: 10, fontFamily: "Helvetica-Bold", color: C.purple, textAlign: "right" } }, `${totalMin} - ${totalMax}`)
        )
      ),

      // Agreement text
      heading("Authorisation"),
      React.createElement(T, { style: { ...st.bodyText, fontFamily: "Helvetica-Bold" } },
        "By signing below, both parties agree to the additional scope and fees outlined in this Change Order."
      ),

      // Signature blocks
      React.createElement(V, { style: st.sigRow },
        React.createElement(V, { style: st.sigBlock },
          React.createElement(T, { style: st.sigBlockTitle }, "Client"),
          sigField("Signature"),
          sigField("Printed Name"),
          sigField("Date"),
          sigField("Title", true)
        ),
        React.createElement(V, { style: st.sigBlock },
          React.createElement(T, { style: st.sigBlockTitle }, "Provider"),
          sigField("Signature"),
          sigField("Printed Name"),
          sigField("Date"),
          sigField("Title", true)
        )
      ),

      // Confidentiality
      React.createElement(V, { style: st.confWrap },
        React.createElement(V, { style: st.confRule }),
        React.createElement(T, { style: st.confText },
          "CONFIDENTIAL \u2014 This Change Order is subject to the terms and conditions of the original Statement of Work."
        )
      )
    )
  );
}

export async function POST(req: Request) {
  try {
    const { out_of_scope, sow_title, sow_customer } = await req.json();

    if (!out_of_scope || !Array.isArray(out_of_scope) || out_of_scope.length === 0) {
      return NextResponse.json({ error: "No out-of-scope items provided" }, { status: 400 });
    }

    // Match out-of-scope items against solution_catalog
    const searchTerms: string[] = [];
    for (const item of out_of_scope as OutOfScopeItem[]) {
      const words = item.item.split(/\s+/).filter((w: string) => w.length > 3);
      searchTerms.push(...words);
    }
    const unique = Array.from(new Set(searchTerms.map((t) => t.toLowerCase()))).slice(0, 15);

    let catalogMatches: CatalogMatch[] = [];
    if (unique.length > 0) {
      const conditions = unique
        .map((term) => `service_name.ilike.%${term}%,description.ilike.%${term}%`)
        .join(",");

      const { data } = await supabaseAdmin
        .from("solution_catalog")
        .select("service_name, description, hours_min, hours_max, base_rate, currency, region")
        .or(conditions)
        .limit(10);

      if (data) catalogMatches = data;
    }

    // Build line items
    const lineItems: ChangeOrderLine[] = (out_of_scope as OutOfScopeItem[]).map((oos) => {
      // Try to find a catalog match for this item
      const itemWords = oos.item.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const match = catalogMatches.find((cm) =>
        itemWords.some((w) => cm.service_name.toLowerCase().includes(w) || cm.description.toLowerCase().includes(w))
      );

      if (match) {
        return {
          item: oos.item,
          reason: oos.reason,
          estimated_effort: oos.estimated_effort || "TBD",
          matched_service: match.service_name,
          hours_min: match.hours_min,
          hours_max: match.hours_max,
          rate: match.base_rate,
          currency: match.currency || "USD",
        };
      }

      // Parse estimated_effort for rough hours
      const effortStr = oos.estimated_effort || "";
      const dayMatch = effortStr.match(/(\d+)/);
      const days = dayMatch ? parseInt(dayMatch[1]) : 2;

      return {
        item: oos.item,
        reason: oos.reason,
        estimated_effort: oos.estimated_effort || "TBD",
        matched_service: null,
        hours_min: days * 6,
        hours_max: days * 8,
        rate: 0,
        currency: "USD",
      };
    });

    const currency = lineItems.find((li) => li.rate > 0)?.currency || "USD";
    const totalMin = lineItems.reduce((sum, li) => sum + li.hours_min * (li.rate > 0 ? li.rate / li.hours_max : 0), 0);
    const totalMax = lineItems.reduce((sum, li) => sum + (li.rate > 0 ? li.rate : 0), 0);

    const now = new Date();
    const coNumber = `CO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    const changeOrderData: ChangeOrderData = {
      change_order_number: coNumber,
      date: dateStr,
      original_sow_title: sow_title || "Original SOW",
      original_sow_customer: sow_customer || "Client",
      line_items: lineItems,
      total_min: Math.round(totalMin),
      total_max: Math.round(totalMax),
      currency,
    };

    // Generate PDF
    const pdfDoc = buildChangeOrderPDF(changeOrderData);
    const pdfStream = await ReactPDF.renderToStream(pdfDoc);
    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);
    const pdfBase64 = pdfBuffer.toString("base64");

    return NextResponse.json({
      change_order: changeOrderData,
      pdf_base64: pdfBase64,
    });
  } catch (err) {
    console.error("Change order error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
