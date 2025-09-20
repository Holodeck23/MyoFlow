# Clinic & AI Orchestration Roadmap

> **Purpose**: Define how MyoFlow evolves from a solo-practitioner tool into a clinic-ready, AI-assisted operations system while keeping implementation realistic for a small team.

## Phase R1 – Solo Practitioner Baseline (Current Focus)
- **Objective**: Deliver a complete workflow for one therapist (Dave's original use case).
- **Key Deliverables**:
  - Secure client intake + record storage (field-level encryption, role checks).
  - Reliable appointment flow with travel buffers and reminders.
  - Stripe payment integration with Austrian invoice/PDF export.
  - Admin surface to review appointments, invoices, and revenue status.
- **Exit Criteria**: A single practitioner can run their entire practice inside MyoFlow without manual workarounds.

## Phase R2 – Clinic Foundations
- **Objective**: Support multi-therapist, multi-room clinics with deterministic scheduling.
- **Key Deliverables**:
  - Data model for therapists, rooms, capacity, and availability rules.
  - Scheduling engine that prevents room/therapist conflicts and supports overrides.
  - Shared calendar views + permissions for managers vs. therapists.
  - Audit logs to track who scheduled or moved appointments.
- **Exit Criteria**: A clinic admin can manually coordinate rooms, therapists, and appointments without double-booking.

## Phase R3 – AI Reception & Automation Layer
- **Objective**: Layer intelligence on top of the clinic foundation to reduce human coordination overhead.
- **Key Deliverables**:
  - Recommendation engine suggesting optimal slots given therapist expertise, travel, and room constraints.
  - Voice AI receptionist (phone + web) that captures requests, proposes slots, and escalates edge cases to humans.
  - Automated follow-up workflows (confirmation SMS/email, waitlist juggling, newsletter prompts).
  - Monitoring + fallback tooling so humans can audit and override AI decisions quickly.
- **Exit Criteria**: Front-desk staff handle exceptions while AI manages the default intake and allocation flows.

## Guardrails & Dependencies
- AI layers **must not** ship before deterministic scheduling (R2) is stable; unreliable data will erode trust.
- Every phase needs explicit logging/audit trails so clinics can explain decisions to regulators and clients.
- Voice AI requires consent workflows and secure transcript storage aligned with Austrian privacy law.

## Recommended Next Steps
1. Finish R1 security + payments and release a solo beta.
2. Draft detailed data schemas + API contracts for R2 (therapists, rooms, capacity rules).
3. Prototype AI allocation logic offline (simulation) before plugging into production scheduling.

*Last updated: 2025-09-20*
