"use client";

import { useEffect, useState } from "react";
import { Plus, BookOpen, Pencil, Trash2, X } from "lucide-react";
import GlowButton from "@/components/ui/GlowButton";

interface CatalogService {
  id: string;
  service_name: string;
  description: string;
  hours_min: number;
  hours_max: number;
  base_rate: number;
  currency: string;
  out_of_scope: string;
  region: string;
  loe_method: string;
  commercial_model: string;
  qualifying_questions: { question: string; field_type: string; required: boolean }[];
  unit_price: number;
  unit_type: string;
  created_at: string;
}

const LOE_METHODS = [
  { value: "fixed_task", label: "Fixed Task List", description: "Pre-defined tasks with set mandays" },
  { value: "formula", label: "Formula-Driven", description: "Calculate effort from numeric inputs" },
  { value: "excel_upload", label: "Excel Calculator", description: "Upload your own LoE spreadsheet" },
];

const COMMERCIAL_MODELS = [
  { value: "fixed", label: "Fixed Price", description: "Single fee for defined scope" },
  { value: "tm", label: "Time & Materials", description: "Hourly or daily rate, billed on actuals" },
  { value: "re", label: "Residency", description: "Monthly fee for embedded engineer" },
];

const UNIT_TYPES = [
  { value: "engagement", label: "Per Engagement" },
  { value: "day", label: "Per Day" },
  { value: "hour", label: "Per Hour" },
  { value: "month", label: "Per Month" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "SGD", "MYR", "AED", "AUD", "CAD"];

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  SGD: "S$",
  MYR: "RM",
  AED: "AED ",
  AUD: "A$",
  CAD: "C$",
};

const emptyForm = {
  service_name: "",
  description: "",
  hours_min: "",
  hours_max: "",
  base_rate: "",
  currency: "USD",
  out_of_scope: "",
  region: "",
  loe_method: "fixed_task",
  commercial_model: "fixed",
  unit_price: "",
  unit_type: "engagement",
  qualifying_questions: [] as { question: string; field_type: string; required: boolean }[],
};

export default function CatalogPage() {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogService | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newQuestion, setNewQuestion] = useState("");

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/catalog");
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch (err) {
      console.error("Failed to fetch catalog:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setPanelOpen(true);
  };

  const openEdit = (service: CatalogService) => {
    setEditing(service);
    setForm({
      service_name: service.service_name,
      description: service.description,
      hours_min: String(service.hours_min || ""),
      hours_max: String(service.hours_max || ""),
      base_rate: String(service.base_rate || ""),
      currency: service.currency || "USD",
      out_of_scope: service.out_of_scope,
      region: service.region,
      qualifying_questions: service.qualifying_questions || [],
      loe_method: service.loe_method || "fixed_task",
      commercial_model: service.commercial_model || "fixed",
      unit_price: String(service.unit_price || ""),
      unit_type: service.unit_type || "engagement",
    });
    setError("");
    setPanelOpen(true);
  };

  const handleSave = async () => {
    if (!form.service_name.trim()) {
      setError("Service name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const method = editing ? "PATCH" : "POST";
      const baseBody = {
        ...form,
        qualifying_questions: form.qualifying_questions,
        loe_method: form.loe_method,
        commercial_model: form.commercial_model,
        unit_price: typeof form.unit_price === "string" ? parseFloat(form.unit_price) || 0 : form.unit_price,
        unit_type: form.unit_type,
      };
      const body = editing ? { id: editing.id, ...baseBody } : baseBody;

      const res = await fetch("/api/catalog", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save service.");
      } else {
        setPanelOpen(false);
        fetchServices();
      }
    } catch {
      setError("Something went wrong.");
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/catalog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setServices(services.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    setForm((prev) => ({
      ...prev,
      qualifying_questions: [
        ...(prev.qualifying_questions as { question: string; field_type: string; required: boolean }[]),
        { question: newQuestion.trim(), field_type: "text", required: false },
      ],
    }));
    setNewQuestion("");
  };

  const removeQuestion = (index: number) => {
    setForm((prev) => ({
      ...prev,
      qualifying_questions: (prev.qualifying_questions as { question: string; field_type: string; required: boolean }[]).filter((_, i) => i !== index),
    }));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="text-3xl font-heading font-semibold tracking-tight text-gray-900 dark:text-white">
            Solution Catalog
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Your services, rates and scope boundaries.
          </p>
        </div>
        <GlowButton onClick={openAdd}>
          <Plus size={16} />
          Add Service
        </GlowButton>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : services.length === 0 ? (
        <div className="premium-card rounded-[2.5rem] p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F3F0FF] flex items-center justify-center mx-auto mb-5">
            <BookOpen size={28} className="text-[#9333EA]" />
          </div>
          <p className="text-gray-500 mb-6 text-lg">
            No services yet. Add your first service to the catalog.
          </p>
          <GlowButton onClick={openAdd}>
            <Plus size={16} />
            Add Service
          </GlowButton>
        </div>
      ) : (
        <div className="premium-card rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-white/5">
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    Service
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    Description
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    Hours
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    Rate
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    Region
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">SKU Config</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {services.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-[#FDFCFF] transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {s.service_name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-[240px] truncate">
                      {s.description || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                      {s.hours_min}–{s.hours_max}h
                    </td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                      {CURRENCY_SYMBOLS[s.currency] || s.currency || "$"}{s.base_rate.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {s.region || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-[#F3F0FF] text-[#9333EA] font-medium">
                          {s.loe_method === "fixed_task" ? "Fixed Tasks" : s.loe_method === "formula" ? "Formula" : "Excel"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 font-medium">
                          {s.commercial_model === "fixed" ? "Fixed Price" : s.commercial_model === "tm" ? "T&M" : "RE"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#9333EA] hover:bg-[#F3F0FF] transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-in Panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPanelOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1A1A1D] shadow-2xl flex flex-col animate-slide-in">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editing ? "Edit Service" : "Add Service"}
              </h3>
              <button
                onClick={() => setPanelOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Service Name *
                </label>
                <input
                  value={form.service_name}
                  onChange={(e) => updateForm("service_name", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors"
                  placeholder="e.g. Penetration Testing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 resize-y transition-colors"
                  placeholder="What does this service include?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Min Hours
                  </label>
                  <input
                    type="text"
                    value={form.hours_min}
                    onChange={(e) => updateForm("hours_min", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors"
                    placeholder="e.g. 40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Max Hours
                  </label>
                  <input
                    type="text"
                    value={form.hours_max}
                    onChange={(e) => updateForm("hours_max", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors"
                    placeholder="e.g. 120"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Base Rate
                </label>
                <div className="flex gap-3">
                  <select
                    value={form.currency}
                    onChange={(e) => updateForm("currency", e.target.value)}
                    className="px-3 py-3 rounded-xl border border-gray-200 text-gray-800 bg-white focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors text-sm"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={form.base_rate}
                    onChange={(e) => updateForm("base_rate", e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors"
                    placeholder="e.g. 15000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Out of Scope Notes
                </label>
                <textarea
                  value={form.out_of_scope}
                  onChange={(e) => updateForm("out_of_scope", e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 resize-y transition-colors"
                  placeholder="What is NOT included in this service?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Region
                </label>
                <input
                  value={form.region}
                  onChange={(e) => updateForm("region", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors"
                  placeholder="e.g. UK, US, Global"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 pt-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#9333EA] mb-4">SKU Configuration</p>

                {/* LoE Method */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">LoE Calculation Method</label>
                  <div className="space-y-2">
                    {LOE_METHODS.map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => updateForm("loe_method", method.value)}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                          form.loe_method === method.value
                            ? "border-[#9333EA] bg-[#F3F0FF]"
                            : "border-gray-200 hover:border-[#9333EA]/40"
                        }`}
                      >
                        <p className={`text-sm font-medium ${form.loe_method === method.value ? "text-[#9333EA]" : "text-gray-800"}`}>{method.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{method.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Commercial Model */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Commercial Model</label>
                  <div className="space-y-2">
                    {COMMERCIAL_MODELS.map((model) => (
                      <button
                        key={model.value}
                        type="button"
                        onClick={() => updateForm("commercial_model", model.value)}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                          form.commercial_model === model.value
                            ? "border-[#9333EA] bg-[#F3F0FF]"
                            : "border-gray-200 hover:border-[#9333EA]/40"
                        }`}
                      >
                        <p className={`text-sm font-medium ${form.commercial_model === model.value ? "text-[#9333EA]" : "text-gray-800"}`}>{model.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{model.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Unit Price */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit Price</label>
                  <div className="flex gap-3">
                    <select
                      value={form.unit_type}
                      onChange={(e) => updateForm("unit_type", e.target.value)}
                      className="px-3 py-3 rounded-xl border border-gray-200 text-gray-800 bg-white focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors text-sm"
                    >
                      {UNIT_TYPES.map((u) => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={form.unit_price}
                      onChange={(e) => updateForm("unit_price", e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors"
                      placeholder="e.g. 8500"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Used in the LoE calculator: effort × unit price = commercial total</p>
                </div>

                {/* Qualifying Questions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Qualifying Questions</label>
                  <p className="text-xs text-gray-400 mb-3">Questions the consultant must answer to run the LoE calculator for this service.</p>
                  {(form.qualifying_questions as { question: string }[]).length > 0 && (
                    <div className="space-y-2 mb-3">
                      {(form.qualifying_questions as { question: string }[]).map((q, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                          <p className="flex-1 text-sm text-gray-700">{q.question}</p>
                          <button
                            type="button"
                            onClick={() => removeQuestion(i)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addQuestion()}
                      placeholder="e.g. How many devices are in scope?"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="px-4 py-2.5 rounded-xl bg-[#9333EA] text-white text-sm font-medium hover:bg-[#7E22CE] transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
            </div>

            {/* Panel Footer */}
            <div className="px-8 py-5 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setPanelOpen(false)}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <GlowButton onClick={handleSave} loading={saving}>
                {saving ? "Saving..." : editing ? "Update" : "Add Service"}
              </GlowButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
