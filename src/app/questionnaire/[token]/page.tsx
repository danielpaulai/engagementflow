"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Loader2, FileText } from "lucide-react";

const QUESTIONS = [
  { key: "org_name", label: "What is your organisation name and primary industry?", placeholder: "e.g. Acme Financial Services, Financial Services / Banking" },
  { key: "employees_regions", label: "How many employees and in which regions?", placeholder: "e.g. 2,500 employees across UK, US, and Singapore" },
  { key: "security_tools", label: "What security tools are you currently using?", placeholder: "e.g. CrowdStrike EDR, Splunk SIEM, AWS Security Hub, Microsoft Defender" },
  { key: "primary_challenge", label: "What is your primary security challenge right now?", placeholder: "e.g. Lack of 24/7 monitoring, alert fatigue, no incident response plan" },
  { key: "compliance_frameworks", label: "What compliance frameworks apply to your organisation?", placeholder: "e.g. ISO 27001, SOC 2 Type II, PCI DSS, GDPR" },
  { key: "success_90_days", label: "What does success look like in 90 days?", placeholder: "e.g. Full MDR coverage, reduced MTTD to under 15 minutes, compliance audit passed" },
  { key: "budget_range", label: "What is your approximate budget range for this engagement?", placeholder: "e.g. $50,000 - $75,000" },
  { key: "target_start_date", label: "What is your target start date?", placeholder: "e.g. Q2 2026, April 2026, ASAP" },
  { key: "key_stakeholders", label: "Who are the key stakeholders involved in this decision?", placeholder: "e.g. CISO (Jane Smith), VP Engineering (John Doe), CFO (approver)" },
  { key: "additional_info", label: "Is there anything else we should know before our call?", placeholder: "e.g. Previous vendor issues, specific concerns, timeline constraints" },
];

interface QuestionnaireData {
  id: string;
  client_name: string;
  engagement_type: string;
  status: string;
  answers: Record<string, string>;
}

export default function PublicQuestionnairePage() {
  const { token } = useParams();
  const [data, setData] = useState<QuestionnaireData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/questionnaire/${token}`);
        if (res.ok) {
          const d = await res.json();
          setData(d);
          if (d.status === "completed") {
            setSubmitted(true);
            setAnswers(d.answers || {});
          }
        } else {
          setError("Questionnaire not found.");
        }
      } catch {
        setError("Failed to load questionnaire.");
      }
      setLoading(false);
    };
    fetchData();
  }, [token]);

  const handleSubmit = async () => {
    // Check at least 3 questions answered
    const answered = Object.values(answers).filter((v) => v.trim()).length;
    if (answered < 3) {
      setError("Please answer at least 3 questions before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/questionnaire/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to submit.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#9333EA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4">
        <div className="text-center">
          <FileText size={40} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-3">Thank You!</h1>
          <p className="text-gray-400 text-base leading-relaxed">
            Your responses have been received. We will review your answers and tailor our approach
            for your upcoming engagement call. You can close this page now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2.5 mb-6">
            <FileText size={22} className="text-[#9333EA]" />
            <span className="text-white font-semibold text-lg tracking-tight">EngagementFlow</span>
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
            Discovery Questionnaire
          </h1>
          <p className="text-gray-400 text-base">
            Hello {data?.client_name}. Please answer the questions below so we can prepare for your engagement.
            {data?.engagement_type && (
              <span className="block mt-1 text-[#9333EA] font-medium">
                {data.engagement_type}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="space-y-8">
          {QUESTIONS.map((q, i) => (
            <div key={q.key}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <span className="text-[#9333EA] mr-2">{i + 1}.</span>
                {q.label}
              </label>
              <textarea
                value={answers[q.key] || ""}
                onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                placeholder={q.placeholder}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder-gray-600 p-4 resize-y focus:outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 transition-colors"
              />
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm mt-6">{error}</p>}

        <div className="mt-10 mb-16">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-white transition-all disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #9333EA, #4F46E5)",
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Questionnaire"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
