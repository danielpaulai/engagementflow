export interface SOWTemplateDeliverable {
  name: string;
  description: string;
  week: string;
  owner: string;
}

export interface SOWTemplateMetric {
  metric: string;
  baseline: string;
  target: string;
  measurement: string;
}

export interface SOWTemplateRisk {
  risk: string;
  likelihood: string;
  impact: string;
  mitigation: string;
}

export interface SOWTemplate {
  id: string;
  name: string;
  subtitle: string;
  engagementType: string;
  duration: string;
  overview: string;
  sections: string[];
  deliverables: SOWTemplateDeliverable[];
  successMetrics: SOWTemplateMetric[];
  risks: SOWTemplateRisk[];
  commercialTerms: Record<string, string>;
  assumptions?: string[];
  outOfScope?: string[];
}

export const SOW_TEMPLATES: SOWTemplate[] = [
  {
    id: "resident-engineer",
    name: "Resident Engineer",
    subtitle: "Dedicated On-Site or Remote Engineer Placement",
    engagementType: "Resident Engineer Services",
    duration: "6 or 12 Months",
    overview:
      "A dedicated Resident Engineer placed with the client on a defined term basis to provide hands-on technical support, product expertise, and operational continuity. The RE acts as an embedded extension of the client's team, handling day-to-day operational tasks, incident response, health monitoring, and knowledge transfer for the agreed technology platform.",
    sections: [
      "Service Onboarding",
      "Day-to-Day Operations",
      "Incident and Problem Management",
      "Health Monitoring and Reporting",
      "Knowledge Transfer",
      "Project Governance",
    ],
    deliverables: [
      {
        name: "RE Onboarding and Environment Familiarisation",
        description:
          "Structured onboarding covering client environment, escalation paths, tooling access, and key contacts. Includes documented runbook of RE responsibilities.",
        week: "Wk 1-2",
        owner: "Provider",
      },
      {
        name: "Weekly Status Report",
        description:
          "Weekly summary of activities completed, incidents handled, open items, and upcoming tasks. Delivered every Friday.",
        week: "Weekly",
        owner: "Provider",
      },
      {
        name: "Incident Response Support",
        description:
          "First-line response to platform incidents during agreed coverage hours. Triage, containment, and escalation to vendor support where required.",
        week: "Ongoing",
        owner: "Provider",
      },
      {
        name: "Platform Health Monitoring",
        description:
          "Proactive daily monitoring of platform health, performance metrics, and alert queues. Issues flagged within agreed SLA.",
        week: "Ongoing",
        owner: "Provider",
      },
      {
        name: "Monthly Health Report",
        description:
          "Consolidated monthly report covering platform performance, incidents handled, open risks, and recommended optimisations.",
        week: "Monthly",
        owner: "Provider",
      },
      {
        name: "Change and Configuration Management",
        description:
          "Implementation of approved changes to platform configuration, policies, and integrations following the client change control process.",
        week: "Ongoing",
        owner: "Joint",
      },
      {
        name: "Knowledge Transfer Sessions",
        description:
          "Structured knowledge transfer to client team members covering platform operations, best practices, and runbook walkthroughs. Minimum one session per month.",
        week: "Monthly",
        owner: "Provider",
      },
      {
        name: "End-of-Term Handover Report",
        description:
          "Comprehensive handover document covering all configurations made, incidents handled, open items, and recommendations for continuity.",
        week: "Final Month",
        owner: "Provider",
      },
    ],
    successMetrics: [
      {
        metric: "Incident First Response Time",
        baseline: "Defined at kickoff",
        target: "< 30 minutes during coverage hours",
        measurement: "Incident ticket timestamps",
      },
      {
        metric: "Platform Availability",
        baseline: "Defined at kickoff",
        target: ">= 99.5% during coverage hours",
        measurement: "Platform monitoring dashboard",
      },
      {
        metric: "Weekly Report Delivery",
        baseline: "Not tracked",
        target: "100% on time (every Friday)",
        measurement: "Report delivery log",
      },
      {
        metric: "Change Success Rate",
        baseline: "Defined at kickoff",
        target: ">= 98% changes implemented without rollback",
        measurement: "Change log",
      },
      {
        metric: "Knowledge Transfer Completion",
        baseline: "0 sessions",
        target: "Minimum 1 session per month",
        measurement: "Session attendance records",
      },
      {
        metric: "Client Satisfaction (CSAT)",
        baseline: "N/A",
        target: ">= 9/10 at mid-term and end-of-term review",
        measurement: "Satisfaction survey",
      },
    ],
    risks: [
      {
        risk: "RE access to client systems delayed at start",
        likelihood: "Medium",
        impact: "High",
        mitigation:
          "Access requirements checklist shared 2 weeks before start date; named client IT owner accountable for provisioning",
      },
      {
        risk: "Scope creep beyond agreed RE responsibilities",
        likelihood: "High",
        impact: "Medium",
        mitigation:
          "Clear out-of-scope definition agreed at kickoff; additional project work handled via separate SOW or change request",
      },
      {
        risk: "RE knowledge gap on specific client platform version",
        likelihood: "Low",
        impact: "Medium",
        mitigation:
          "Pre-placement assessment of RE skills against client environment; vendor training arranged if gap identified",
      },
      {
        risk: "RE replacement required mid-term",
        likelihood: "Low",
        impact: "High",
        mitigation:
          "Replacement RE provided within 10 business days; overlap period of minimum 5 days for handover",
      },
    ],
    commercialTerms: {
      "Monthly Service Fee": "[INSERT MONTHLY FEE]",
      "Term": "[6 or 12] Months",
      "Coverage Hours": "[INSERT HOURS, e.g. Monday to Friday 08:00-18:00 local time]",
      "Engagement Model": "[On-site / Remote / Hybrid]",
      "Payment Structure": "Monthly in advance",
      "Additional Resources": "Additional RE days available at [INSERT DAY RATE] per day",
      "Notice Period": "30 days written notice for early termination after minimum 3-month commitment",
    },
    assumptions: [
      "Client will provide all necessary system access, VPN credentials, and tooling licences required for the RE to perform their role",
      "Client will designate a named point of contact for the RE to report to and escalate issues",
      "The RE will follow the client change control process for all configuration changes",
      "Coverage hours are defined as the agreed working hours in the client timezone",
      "The RE is not responsible for issues caused by third-party vendor software bugs outside of the agreed platform scope",
    ],
    outOfScope: [
      "Development of new platform features or custom integrations not in the original platform scope",
      "Business process development or documentation beyond the agreed technology scope",
      "Support for technology platforms not listed in this SOW",
      "Post-production support outside of agreed coverage hours unless an on-call arrangement is separately agreed",
    ],
  },
  {
    id: "securestart",
    name: "SecureStart",
    subtitle: "Cybersecurity Platform Onboarding & Activation Program",
    engagementType: "Platform Onboarding and Activation",
    duration: "8 Weeks",
    overview:
      "A structured 8-week engagement designed to activate, configure, and operationalise the cybersecurity platform across the client environment. The program ensures the client achieves measurable security outcomes from day one, with full adoption and go-live readiness confirmed by week eight.",
    sections: [
      "Environment Discovery",
      "Platform Configuration",
      "Integration Activation",
      "Detection Rule Library",
      "Runbook Library",
      "User Training",
      "Go-Live Certification",
      "Post-Launch Review",
    ],
    deliverables: [
      {
        name: "Environment Discovery Report",
        description:
          "Full audit of existing security tooling, network topology, user directory, and integration landscape",
        week: "Wk 1-2",
        owner: "Provider",
      },
      {
        name: "Platform Configuration Blueprint",
        description:
          "Documented architecture plan covering data ingestion, detection rules, alert thresholds, and role-based access controls",
        week: "Wk 2-3",
        owner: "Provider",
      },
      {
        name: "Integration Activation Package",
        description:
          "Live configuration of all agreed integrations: SIEM, EDR/XDR, cloud platforms (AWS/Azure/GCP), and identity provider (AD/Okta)",
        week: "Wk 3-5",
        owner: "Joint",
      },
      {
        name: "Detection Rule Library (v1)",
        description:
          "Initial set of 50+ tuned detection rules mapped to MITRE ATT&CK framework, calibrated to reduce false positives below 5%",
        week: "Wk 4-5",
        owner: "Provider",
      },
      {
        name: "Runbook Library (v1)",
        description:
          "10 documented incident response runbooks covering top threat scenarios relevant to the client's industry",
        week: "Wk 5-6",
        owner: "Provider",
      },
      {
        name: "User Training Programme",
        description:
          "Role-based training for SOC analysts, IT administrators, and executive stakeholders across 3 structured sessions",
        week: "Wk 6-7",
        owner: "Provider",
      },
      {
        name: "Go-Live Certification Report",
        description:
          "Formal sign-off document confirming all activation criteria met, platform operational, and team trained",
        week: "Wk 7-8",
        owner: "Provider",
      },
      {
        name: "30-Day Post-Launch Review",
        description:
          "Health scorecard, alert fidelity analysis, performance metrics, and prioritised optimisation backlog",
        week: "Wk 10-11",
        owner: "Provider",
      },
    ],
    successMetrics: [
      {
        metric: "Platform Activation Rate",
        baseline: "0%",
        target: "100% by Week 4",
        measurement: "Internal platform dashboard",
      },
      {
        metric: "Integration Coverage",
        baseline: "0 connected",
        target: "All agreed integrations live",
        measurement: "Integration audit log",
      },
      {
        metric: "Alert False Positive Rate",
        baseline: "Industry avg 45%",
        target: "< 5% within 60 days",
        measurement: "Monthly fidelity report",
      },
      {
        metric: "User Training Completion",
        baseline: "0%",
        target: "100% of designated users",
        measurement: "LMS completion records",
      },
      {
        metric: "Mean Time to Detect (MTTD)",
        baseline: "Not established",
        target: "< 15 minutes for P1 alerts",
        measurement: "Platform analytics",
      },
      {
        metric: "Customer Satisfaction (CSAT)",
        baseline: "N/A",
        target: ">= 9/10 at go-live",
        measurement: "Post-engagement survey",
      },
    ],
    risks: [
      {
        risk: "Delayed access to client systems",
        likelihood: "Medium",
        impact: "High",
        mitigation:
          "Access checklist shared in Week 1 kickoff; escalation path defined with client IT lead",
      },
      {
        risk: "Integration incompatibility with legacy tools",
        likelihood: "Low",
        impact: "High",
        mitigation:
          "Environment discovery in Week 1 surfaces compatibility issues before configuration begins",
      },
      {
        risk: "Low user adoption post-training",
        likelihood: "Medium",
        impact: "Medium",
        mitigation:
          "Role-based training with pre and post assessments; 30-day check-in included in scope",
      },
      {
        risk: "Detection rule tuning delays",
        likelihood: "Low",
        impact: "Medium",
        mitigation:
          "Parallel workstream; rules can be activated incrementally from Week 4 onwards",
      },
    ],
    commercialTerms: {
      "Total Engagement Fee": "[INSERT FEE]",
      "Payment Structure": "50% on SOW signature, 50% on go-live certification",
      "Travel and Expenses": "Included for up to 2 on-site visits; additional travel billed at cost",
      "Out-of-Scope Work": "Additional integrations, platforms, or users not listed in Section 3",
      "Change Control": "Any scope changes require written approval from both parties",
    },
    assumptions: [
      "Client will designate a named project sponsor and a technical point of contact within 5 business days of SOW signature",
      "Client will provide VPN or direct system access required for configuration activities within 5 business days of kickoff",
      "All integrations listed in Section 3 are technically feasible within the client environment",
      "Client stakeholders will be available for scheduled training sessions with no more than 48 hours notice to reschedule",
      "Client is responsible for any third-party licensing costs associated with integrated platforms",
    ],
  },
  {
    id: "threatguard",
    name: "ThreatGuard",
    subtitle: "Managed Detection and Response Customer Success Programme",
    engagementType: "MDR Customer Success - Premium Tier",
    duration: "12 Months (renewable)",
    overview:
      "A 12-month structured engagement delivering proactive threat detection, continuous monitoring optimisation, and strategic security guidance through a dedicated Cybersecurity Advisor embedded within the client relationship. Designed for organisations operating an MDR subscription who require a high-touch success model to accelerate security maturity and demonstrate ongoing ROI to executive stakeholders.",
    sections: [
      "Operational Excellence (Weekly)",
      "Strategic Guidance (Monthly)",
      "Executive Alignment (Quarterly)",
      "Threat Hunting",
      "Incident Post-Mortems",
    ],
    deliverables: [
      {
        name: "Onboarding Success Plan",
        description:
          "30/60/90-day success plan with named milestones, KPIs, and escalation protocols",
        week: "Wk 1-2",
        owner: "Provider",
      },
      {
        name: "Weekly Threat Digest",
        description:
          "Curated threat intelligence relevant to client industry delivered every Monday",
        week: "Ongoing",
        owner: "Provider",
      },
      {
        name: "Monthly Security Scorecard",
        description:
          "Standardised health report covering detection coverage, alert fidelity, MTTD, MTTR, and open risks",
        week: "Monthly",
        owner: "Provider",
      },
      {
        name: "Runbook Library (Maintained)",
        description:
          "Continuously updated library of incident response runbooks, reviewed quarterly",
        week: "Quarterly",
        owner: "Provider",
      },
      {
        name: "Quarterly Business Review",
        description:
          "Formal QBR deck with executive-level metrics, threat landscape summary, and programme roadmap",
        week: "Q1,Q2,Q3,Q4",
        owner: "Provider",
      },
      {
        name: "Annual Security Maturity Report",
        description:
          "Year-end assessment comparing security maturity at programme start vs completion, with Year 2 roadmap",
        week: "Month 12",
        owner: "Provider",
      },
      {
        name: "Incident Post-Mortems",
        description:
          "Formal root cause analysis and lessons learned document for any P1 or P2 incident within 5 business days",
        week: "As needed",
        owner: "Provider",
      },
      {
        name: "Threat Hunt Reports",
        description:
          "Proactive threat hunt executed quarterly, with findings and remediation guidance",
        week: "Quarterly",
        owner: "Provider",
      },
    ],
    successMetrics: [
      {
        metric: "Mean Time to Detect (MTTD) - P1",
        baseline: "Established at kickoff",
        target: "< 15 minutes",
        measurement: "Platform analytics",
      },
      {
        metric: "Mean Time to Respond (MTTR) - P1",
        baseline: "Established at kickoff",
        target: "< 4 hours",
        measurement: "Incident tickets",
      },
      {
        metric: "Alert Fidelity Rate",
        baseline: "Established at kickoff",
        target: "> 95% true positives",
        measurement: "Monthly fidelity report",
      },
      {
        metric: "Threat Hunt Coverage",
        baseline: "0 hunts/year",
        target: "4 hunts/year minimum",
        measurement: "Hunt completion records",
      },
      {
        metric: "Detection Rule Coverage (ATT&CK)",
        baseline: "Established at kickoff",
        target: "> 80% tactic coverage",
        measurement: "ATT&CK Navigator mapping",
      },
      {
        metric: "Executive Engagement Score",
        baseline: "N/A",
        target: ">= 9/10 QBR satisfaction",
        measurement: "Post-QBR survey",
      },
    ],
    risks: [
      {
        risk: "Alert fatigue leading to SOC burnout",
        likelihood: "Medium",
        impact: "High",
        mitigation:
          "Monthly alert fidelity reviews with proactive rule tuning; escalation threshold adjustments",
      },
      {
        risk: "Emerging threat not covered by current rules",
        likelihood: "Medium",
        impact: "High",
        mitigation:
          "Weekly threat intelligence review; emergency rule deployment within 24 hours of zero-day disclosure",
      },
      {
        risk: "Low executive engagement with QBRs",
        likelihood: "Low",
        impact: "Medium",
        mitigation:
          "Board-ready reporting format; CA to brief client sponsor pre-QBR on agenda and key messages",
      },
      {
        risk: "Platform configuration drift over time",
        likelihood: "Medium",
        impact: "Medium",
        mitigation:
          "Quarterly configuration health check included in programme; automated drift alerts enabled",
      },
    ],
    commercialTerms: {
      "Total Programme Fee": "[INSERT ANNUAL FEE]",
      "Payment Structure": "Quarterly in advance",
      "Renewal Terms": "Auto-renew with 90 days written notice to terminate",
      "Additional Incidents": "P1 post-mortems included; forensic deep-dives billed separately",
      "SLA Credits": "Defined in master services agreement",
    },
  },
  {
    id: "crisisready",
    name: "CrisisReady",
    subtitle: "Incident Response Readiness and Retainer Programme",
    engagementType: "IR Readiness Build + Annual Retainer",
    duration: "10 Weeks readiness + 12 Months retainer",
    overview:
      "A structured readiness engagement combining a 10-week IR preparation phase with an ongoing annual retainer for emergency response. The programme prepares the client to detect, contain, and recover from cybersecurity incidents before they cause material business harm, ensuring the client has documented plans, trained personnel, and guaranteed response capacity on standby 24/7/365.",
    sections: [
      "IR Capability Assessment",
      "Incident Response Plan",
      "Communication Playbook",
      "IR Runbook Library",
      "First Responder Training",
      "Tabletop Exercise",
      "Retainer Services",
    ],
    deliverables: [
      {
        name: "IR Capability Assessment",
        description:
          "Current state audit covering people, processes, and technology readiness against NIST 800-61 Rev.3 and PICERL phases",
        week: "Wk 1-2",
        owner: "Provider",
      },
      {
        name: "Incident Response Plan (IRP)",
        description:
          "Full IRP document covering all 6 phases: Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned",
        week: "Wk 3-5",
        owner: "Provider",
      },
      {
        name: "Communication Playbook",
        description:
          "Internal and external communication templates for incidents including breach notification, executive briefing, and media statement frameworks",
        week: "Wk 4-5",
        owner: "Provider",
      },
      {
        name: "IR Runbook Library",
        description:
          "15 threat-specific runbooks: ransomware, BEC, supply chain, insider threat, data exfiltration, DDoS, and more",
        week: "Wk 5-7",
        owner: "Provider",
      },
      {
        name: "First Responder Training",
        description:
          "Half-day workshop for IT and security staff covering initial triage, evidence preservation, and escalation protocols",
        week: "Wk 7-8",
        owner: "Provider",
      },
      {
        name: "Tabletop Exercise",
        description:
          "Executive and technical tabletop exercise simulating a realistic ransomware scenario with facilitated debrief and gap identification",
        week: "Wk 9",
        owner: "Provider",
      },
      {
        name: "Retainer Activation Package",
        description:
          "Signed retainer agreement, portal access, escalation contacts, evidence collection tools installed and tested",
        week: "Wk 10",
        owner: "Joint",
      },
    ],
    successMetrics: [
      {
        metric: "IR Plan Completion",
        baseline: "No documented plan",
        target: "IRP approved by Week 5",
        measurement: "Document sign-off",
      },
      {
        metric: "Tabletop Exercise Score",
        baseline: "Not run",
        target: "< 3 critical gaps identified",
        measurement: "Facilitator debrief report",
      },
      {
        metric: "First Responder Training Completion",
        baseline: "0%",
        target: "100% of designated team",
        measurement: "Attendance register",
      },
      {
        metric: "Retainer Activation Time",
        baseline: "Undefined",
        target: "< 2 hours from call to IR lead engaged",
        measurement: "Retainer test call logs",
      },
      {
        metric: "Mean Time to Contain - P1 (Ransomware)",
        baseline: "Industry avg 72 hours",
        target: "< 24 hours",
        measurement: "Post-incident report",
      },
      {
        metric: "Regulatory Notification Readiness",
        baseline: "Unknown",
        target: "72-hour GDPR/NIS2 capability confirmed",
        measurement: "Legal review sign-off",
      },
    ],
    risks: [
      {
        risk: "Ransomware event before readiness phase completion",
        likelihood: "Low",
        impact: "Critical",
        mitigation:
          "Emergency retainer pre-activation available from Week 1 at prioritised hourly rate",
      },
      {
        risk: "Tabletop exercise reveals critical process gaps",
        likelihood: "Medium",
        impact: "Medium",
        mitigation:
          "Gap remediation is in scope; additional runbooks developed post-exercise within retainer hours",
      },
      {
        risk: "Key IR personnel change post-training",
        likelihood: "Medium",
        impact: "Medium",
        mitigation:
          "Training materials provided for self-service onboarding; refresh training available at reduced rate",
      },
      {
        risk: "Regulatory breach notification requirements change",
        likelihood: "Low",
        impact: "High",
        mitigation:
          "Annual IRP refresh includes regulatory update review as standard",
      },
    ],
    commercialTerms: {
      "Readiness Phase Fee": "[INSERT FEE]",
      "Annual Retainer Fee": "[INSERT ANNUAL RETAINER FEE]",
      "Prepaid Hours Included": "[X] hours per year",
      "Overage Rate": "[INSERT HOURLY RATE] per hour beyond allocation",
      "Payment - Readiness Phase": "50% on SOW signature, 50% on IRP delivery",
      "Payment - Retainer": "Annual in advance",
    },
    outOfScope: [
      "Hours consumed beyond the prepaid annual allocation",
      "Digital forensics beyond 48 hours of investigation time",
      "Legal expert witness services or litigation support",
      "Physical security assessment or on-site evidence seizure beyond agreed geography",
    ],
  },
  {
    id: "clearsight",
    name: "ClearSight",
    subtitle: "Security Posture Assessment and Transformation Roadmap",
    engagementType: "Security Posture Assessment + Transformation Roadmap",
    duration: "6 Weeks",
    overview:
      "A 6-week structured evaluation that delivers a complete, evidence-based view of the client's current cybersecurity posture, quantified risk exposure, and a prioritised 12-month transformation roadmap. The assessment provides executive leadership with the clarity needed to make confident, defensible security investment decisions aligned to business risk appetite.",
    sections: [
      "Governance and Risk Management",
      "Asset and Exposure Management",
      "Identity and Access Control",
      "Threat Detection and Response",
      "Data Protection and Encryption",
      "Resilience and Recovery",
    ],
    deliverables: [
      {
        name: "Discovery Workshop",
        description:
          "Facilitated on-site workshop with security, IT, and business leadership to map environment, priorities, and risk appetite",
        week: "Wk 1",
        owner: "Joint",
      },
      {
        name: "Technical Evidence Collection",
        description:
          "Structured evidence collection across all 6 domains via questionnaires, tool outputs, policy reviews, and system walkthroughs",
        week: "Wk 2-4",
        owner: "Joint",
      },
      {
        name: "Maturity Scoring Model",
        description:
          "Quantified maturity score per domain (1-5 scale) with evidence citations and peer benchmarking comparison",
        week: "Wk 4-5",
        owner: "Provider",
      },
      {
        name: "Risk Exposure Register",
        description:
          "Prioritised list of security gaps with associated risk scores, compliance implications, and business impact assessment",
        week: "Wk 4-5",
        owner: "Provider",
      },
      {
        name: "Technical Assessment Report",
        description:
          "Full 40-60 page assessment report with domain-by-domain findings, evidence, and remediation recommendations",
        week: "Wk 5-6",
        owner: "Provider",
      },
      {
        name: "Executive Summary",
        description:
          "5-7 page plain-language summary for CISO and C-suite: current posture, top 5 risks, and investment priorities",
        week: "Wk 6",
        owner: "Provider",
      },
      {
        name: "12-Month Transformation Roadmap",
        description:
          "Prioritised remediation roadmap structured in 90-day sprints with effort estimates, cost ranges, and expected risk reduction per initiative",
        week: "Wk 6",
        owner: "Provider",
      },
      {
        name: "Board Presentation Deck",
        description:
          "30-slide executive presentation suitable for board or audit committee delivery, authored and ready to present",
        week: "Wk 6",
        owner: "Provider",
      },
    ],
    successMetrics: [
      {
        metric: "Assessment Coverage",
        baseline: "N/A",
        target: "All 6 domains fully evidenced",
        measurement: "Evidence tracker sign-off",
      },
      {
        metric: "Current Posture Score",
        baseline: "Established at discovery",
        target: "Accurate, evidence-based score",
        measurement: "Assessment report",
      },
      {
        metric: "Critical Gaps Identified",
        baseline: "Unknown",
        target: "100% of P1 gaps surfaced",
        measurement: "Risk exposure register",
      },
      {
        metric: "Roadmap Prioritisation Quality",
        baseline: "N/A",
        target: "Executive sponsor approval",
        measurement: "Sign-off meeting",
      },
      {
        metric: "Time to Board Presentation",
        baseline: "N/A",
        target: "Board deck ready by Week 6",
        measurement: "Delivery confirmation",
      },
      {
        metric: "Client Satisfaction (CSAT)",
        baseline: "N/A",
        target: ">= 9/10",
        measurement: "Post-engagement survey",
      },
    ],
    risks: [
      {
        risk: "Incomplete access to evidence and system data",
        likelihood: "Medium",
        impact: "High",
        mitigation:
          "Evidence requirements shared 2 weeks before discovery; named client owner accountable for each domain",
      },
      {
        risk: "Assessment findings trigger urgent remediation beyond scope",
        likelihood: "Medium",
        impact: "Medium",
        mitigation:
          "Critical findings briefed verbally within 24 hours of identification; expedited SOW available for immediate remediation",
      },
      {
        risk: "Stakeholder availability for discovery workshop",
        likelihood: "Low",
        impact: "Medium",
        mitigation:
          "Workshop booked at SOW signature; minimum attendee list defined and confirmed upfront",
      },
      {
        risk: "Board presentation delayed due to leadership schedules",
        likelihood: "Medium",
        impact: "Low",
        mitigation:
          "Presentation deck delivered regardless; live presentation rescheduled within 30 days at no additional cost",
      },
    ],
    commercialTerms: {
      "Total Assessment Fee": "[INSERT FEE]",
      "Payment Structure": "50% on SOW signature, 50% on report delivery",
      "Follow-On Engagement": "Roadmap implementation available as separate SOW at preferred rate",
      "Confidentiality": "All findings treated as confidential; NDA applies",
      "IP Ownership": "Client owns all deliverables upon full payment",
    },
  },
  {
    id: "complianceforge",
    name: "ComplianceForge",
    subtitle: "Regulatory Compliance Acceleration Programme",
    engagementType: "Compliance Acceleration - Fixed Scope",
    duration: "16 Weeks to audit-ready state",
    overview:
      "A 16-week structured engagement designed to bring the client from current state to audit-ready compliance against the target regulatory standard. The programme delivers a complete policy library, evidence collection framework, control implementation roadmap, and pre-audit preparation, culminating in a mock audit that confirms audit-readiness before the formal certification engagement.",
    sections: [
      "Compliance Gap Assessment (Weeks 1-3)",
      "Policy and Control Library Build (Weeks 4-8)",
      "Control Implementation and Evidence Collection (Weeks 9-13)",
      "Audit Preparation and Mock Audit (Weeks 14-16)",
    ],
    deliverables: [
      {
        name: "Compliance Gap Analysis Report",
        description:
          "Structured gap report mapping all standard requirements to current controls, with severity scoring and remediation effort estimates",
        week: "Wk 3",
        owner: "Provider",
      },
      {
        name: "Information Security Policy Library",
        description:
          "Complete set of custom-authored policies meeting the requirements of the target standard (25-40 policies)",
        week: "Wk 6-8",
        owner: "Provider",
      },
      {
        name: "Control Owner Matrix",
        description:
          "RACI-style accountability framework assigning each control to a named internal owner with review cadence",
        week: "Wk 7",
        owner: "Provider",
      },
      {
        name: "Evidence Collection Runbook",
        description:
          "Step-by-step guide for each control: what evidence is required, collection method, storage location, and review frequency",
        week: "Wk 8",
        owner: "Provider",
      },
      {
        name: "GRC Platform Configuration",
        description:
          "Full setup and population of the selected GRC platform with all controls, evidence links, and automated reminders",
        week: "Wk 9-11",
        owner: "Provider",
      },
      {
        name: "Third-Party Risk Programme",
        description:
          "Vendor security questionnaire, risk tier classification system, and review cadence implemented for all in-scope vendors",
        week: "Wk 10-11",
        owner: "Joint",
      },
      {
        name: "Security Awareness Training",
        description:
          "Annual training programme deployed to all in-scope staff, with completion tracking and reporting capability",
        week: "Wk 12",
        owner: "Provider",
      },
      {
        name: "Mock Audit Report",
        description:
          "Independent mock audit findings with detailed pass/fail per control, plus remediation guidance for any failures",
        week: "Wk 15",
        owner: "Assessor",
      },
      {
        name: "Audit Readiness Certification",
        description:
          "Formal sign-off confirming all critical and high controls are evidenced and the client is ready for formal audit",
        week: "Wk 16",
        owner: "Provider",
      },
    ],
    successMetrics: [
      {
        metric: "Critical Gap Remediation Rate",
        baseline: "Identified at Phase 1",
        target: "100% of Critical gaps closed before mock audit",
        measurement: "Gap tracker",
      },
      {
        metric: "Policy Library Coverage",
        baseline: "0%",
        target: "100% of required policies authored and approved",
        measurement: "Policy register",
      },
      {
        metric: "Evidence Coverage Rate",
        baseline: "0%",
        target: ">= 95% of controls fully evidenced",
        measurement: "GRC platform dashboard",
      },
      {
        metric: "Mock Audit Pass Rate",
        baseline: "N/A",
        target: "0 Critical findings; < 3 High findings",
        measurement: "Mock audit report",
      },
      {
        metric: "Staff Training Completion",
        baseline: "0%",
        target: "100% of in-scope staff before formal audit",
        measurement: "LMS completion report",
      },
      {
        metric: "Time to Audit-Ready",
        baseline: "Current gap unknown",
        target: "Audit-ready within 16 weeks",
        measurement: "Audit readiness sign-off",
      },
    ],
    risks: [
      {
        risk: "Control remediation takes longer than estimated",
        likelihood: "Medium",
        impact: "High",
        mitigation:
          "Weekly control implementation sprints with burn-down tracking; escalation to steering committee at 20% schedule slip",
      },
      {
        risk: "Third-party vendors non-responsive to questionnaires",
        likelihood: "High",
        impact: "Medium",
        mitigation:
          "Vendor outreach starts Week 10; non-responsive vendors flagged as risk in audit evidence; compensating controls documented",
      },
      {
        risk: "Scope expansion (additional systems or geographies)",
        likelihood: "Medium",
        impact: "High",
        mitigation:
          "Scope locked at Phase 1 gate sign-off; any expansion requires change control and fee adjustment",
      },
      {
        risk: "Critical findings at mock audit delay formal audit",
        likelihood: "Low",
        impact: "High",
        mitigation:
          "Mock audit findings addressed within 2-week sprint; formal audit rescheduled at no additional programme cost",
      },
      {
        risk: "Key internal control owner leaves during programme",
        likelihood: "Medium",
        impact: "Medium",
        mitigation:
          "Succession requirements built into control owner matrix; provider can assume temporary control owner role during transition",
      },
    ],
    commercialTerms: {
      "Total Programme Fee": "[INSERT FEE]",
      "Payment Structure": "33% on signature, 33% at Phase 2 gate, 34% at audit-ready sign-off",
      "GRC Platform Licensing": "Excluded; client procures directly",
      "Certification Audit Fees": "Excluded; payable directly to certification body",
      "Post-Certification Maintenance": "Annual maintenance retainer available; quoted separately",
      "IP Ownership": "All deliverables become client property upon full payment",
    },
    outOfScope: [
      "Penetration testing or vulnerability scanning (except where required by the target standard)",
      "Legal or regulatory legal counsel (client should engage specialist legal advice)",
      "Formal certification audit fees (paid directly to the certification body)",
      "Cloud infrastructure remediation or configuration changes beyond policy and control design",
      "Custom software development to automate evidence collection",
    ],
  },
];

export function getTemplateById(id: string): SOWTemplate | undefined {
  return SOW_TEMPLATES.find((t) => t.id === id);
}

export function getTemplateNames(): { id: string; name: string; subtitle: string }[] {
  return SOW_TEMPLATES.map((t) => ({ id: t.id, name: t.name, subtitle: t.subtitle }));
}

export function buildTemplatePrompt(template: SOWTemplate): string {
  const deliverablesList = template.deliverables
    .map((d) => `  - ${d.name} (${d.week}, Owner: ${d.owner}): ${d.description}`)
    .join("\n");

  const metricsList = template.successMetrics
    .map((m) => `  - ${m.metric}: Target ${m.target} (Measured by: ${m.measurement})`)
    .join("\n");

  const risksList = template.risks
    .map((r) => `  - ${r.risk} [${r.likelihood}/${r.impact}]: ${r.mitigation}`)
    .join("\n");

  const commercialList = Object.entries(template.commercialTerms)
    .map(([k, v]) => `  - ${k}: ${v}`)
    .join("\n");

  let prompt = `
TEMPLATE CONTEXT — Use this as the structural foundation for the SOW:

Template: ${template.name} — ${template.subtitle}
Engagement Type: ${template.engagementType}
Duration: ${template.duration}

Overview: ${template.overview}

Sections: ${template.sections.join(", ")}

Standard Deliverables:
${deliverablesList}

Success Metrics:
${metricsList}

Risks & Mitigations:
${risksList}

Commercial Terms:
${commercialList}`;

  if (template.assumptions && template.assumptions.length > 0) {
    prompt += `\n\nAssumptions:\n${template.assumptions.map((a) => `  - ${a}`).join("\n")}`;
  }

  if (template.outOfScope && template.outOfScope.length > 0) {
    prompt += `\n\nOut of Scope:\n${template.outOfScope.map((o) => `  - ${o}`).join("\n")}`;
  }

  prompt += `\n\nIMPORTANT: Use this template as the baseline structure. Adapt deliverables, timelines, and metrics based on the actual customer conversation. Replace placeholder values (like [INSERT FEE]) with any amounts mentioned in the transcript.`;

  return prompt;
}
