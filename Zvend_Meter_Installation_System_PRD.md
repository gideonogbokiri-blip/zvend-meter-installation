# Zvend Meter Installation System  
**Product Requirements Document & AI Prompt**  
Version 1.0 | August 2026

---

## 1. Project Overview

**Product Name:** Zvend Meter Installation System  
**Type:** Hybrid application  
- **Web App** – for Secretary, GM, MD, and IT  
- **Mobile App** (or responsive PWA) – primarily for Field Technicians  

**Purpose:**  
Digitize and control the end-to-end process of meter installation/activation. The system ensures that physical meters are correctly matched, location is captured, customer/facility data is recorded, and the request goes through a strict multi-level approval chain before IT generates and issues the final activation code.

**Core Goal:**  
Replace paper-based processes with a controlled digital workflow that includes barcode scanning, GPS capture, role-based approvals, and automatic generation of an activation code by IT.

---

## 2. User Roles & Permissions

| Role              | Platform     | Main Responsibilities                                      | Key Actions                                      |
|-------------------|--------------|------------------------------------------------------------|--------------------------------------------------|
| **Secretary**     | Web          | Creates meter entries, manages facilities, confirms field data | Create meter + facility, Confirm field submission, Close completed jobs |
| **Field Technician** | Mobile     | Scans physical meter, captures GPS & personal details     | Select meter → Scan → Compare → Submit address + name |
| **GM**            | Web          | Reviews and forwards approved requests                    | Review → Send to MD                              |
| **MD**            | Web          | Final management approval                                 | Approve / Reject                                 |
| **IT**            | Web          | Executes technical work and generates activation code     | Carry out task → Generate Code → Return to Secretary |
(onces it is being fowareded they everyone can see it like both the gm and md but Gm just sent it to md because of aprroval)
md can over see things.
---

## 3. Complete Workflow (Aligned with Original Flowchart + Clarifications)

### Step-by-Step Process

1. **Secretary initiates**  
   - Creates a new meter entry  
   - Selects / adds Facility  
   - Inputs the official Meter Number  
   - Status becomes: **Pending Field Scan**

2. **Field Technician action**  
   - Opens the mobile app  
   - Sees list of meters assigned / available for scanning  
   - Clicks on a specific Meter Number  
   - Camera opens → scans the physical meter barcode  
   - System **compares** scanned number with the official meter number created by Secretary  
     - If **match** → proceed  
     - If **mismatch** → block submission + show clear error  
   - Captures GPS coordinates automatically  
   - Inputs:  
     - Full Address of installation  
     - coustomer’s full name  
   - Submits the form  
   - Status becomes: **Pending Secretary Confirmation**

3. **Secretary confirms**  
   - Reviews the scanned data, GPS, address, and technician name  
   - Confirms correctness  
   - Sends to GM  
   - Status: **Pending GM Review**

4. **GM reviews**  
   - Reviews all information  
   - Forwards to MD  
   - Status: **Pending MD Approval**

5. **MD Approval**  
   - MD reviews and **Approves** (or Rejects with reason)  
   - On Approve → Status: **Pending IT Action**

6. **IT carries out the task**  
   - IT receives the approved request  
   - Performs the technical work (profiling / configuration)  
   - System generates a unique **Activation Code**  
   - IT marks task as completed and returns the request to Secretary  
   - Status: **Pending Final Closure**

7. **Secretary final closure**  
   - Sees the Activation Code  
   - Confirms everything is complete  
   - Closes the request  
   - The item is removed from the active **Meter Activation List**  
   - Status: **Completed** (archived)

---

## 4. Key Functional Requirements

### 4.1 Meter Creation (Secretary)
- Create new meter record with:
  - Official Meter Number (unique)
  - Facility (dropdown or searchable list)
  - Optional notes
- Ability to edit or cancel before field scan starts

### 4.2 Field Scanning (Mobile – Field Technician)
- List of pending meters (filterable)
- One-tap select meter → open camera scanner
- Real-time barcode scan
- Automatic comparison with official meter number
- Auto-capture of GPS coordinates (with accuracy indicator)
- Form fields:
  - Installation Address (required)
  - Field Technician Full Name (required)
  - Optional photo of installed meter
- Offline support preferred (queue submission when online)

### 4.3 Approval Chain
- Clear status tracking at every stage
- Ability to Reject at GM or MD level with mandatory comment
- Rejected items return to Secretary with reason
- Full audit trail (who did what and when)

### 4.4 IT Stage
- Dedicated queue for IT
- Ability to add internal notes
- inpute the that it has been profiled 
- Code is unique, readable, and permanently linked to the meter
- After generation, automatic return to Secretary

### 4.5 Meter Activation List (Dashboard)
- Central list showing all active (non-closed) requests
- Columns: Meter Number, Facility, Status, Field Tech, Date Created, Current Stage
- Filters by status, facility, date range
- Color-coded status badges

### 4.6 Notifications
- In-app notifications + optional email when a task reaches a user’s stage
- Especially important for GM, MD, and IT

---

## 5. Suggested Data Model (Simplified)

**Meter installtion**
- id
- officialMeterNumber (unique)
- facilityId
- status (enum: PendingFieldScan | PendingSecretaryConfirm | PendingGM | PendingMD | PendingIT | PendingClosure | Completed | Rejected)
- scannedMeterNumber
- gpsLatitude
- gpsLongitude
- installationAddress
- fieldTechnicianName
- activationCode (generated by IT)
- createdBy (Secretary)
- createdAt
- updatedAt
- rejectionReason (nullable)

**Facility**
- id
- name
- location / address
- active (boolean)

**User**
- id
- fullName
- role (Secretary | FieldTechnician | GM | MD | IT)
- email
- phone (optional)

**AuditLog**
- id
- meterActivationId
- userId
- action
- timestamp
- notes

---

## 6. UI / Screen Recommendations

### Mobile (Field Technician)
1. Login
2. Home – Pending Scans list
3. Meter Detail + Scan button
4. Camera Scanner view
5. Post-scan form (Address + Name + Submit)
6. Success / Error feedback

### Web (Admin roles)
1. Login
2. Dashboard – Meter Activation List
3. Create New Meter (Secretary)
4. Detail view with full history + action buttons according to role
5. IT queue with “Generate Code” button
6. Settings / Facility management (Secretary)

---

## 7. Technical Recommendations (for development)

- **Frontend**
  - Web: React / Next.js or Vue
  - Mobile: React Native or Flutter (or high-quality PWA)
- **Backend**: Node.js / NestJS or Laravel / Django
- **Database**: PostgreSQL
- **Authentication**: Role-based JWT + refresh tokens
- **Barcode**: Use a reliable library (e.g. html5-qrcode or native scanner)
- **GPS**: Browser Geolocation API + accuracy check
- **File storage**: For optional meter photos (S3 / Cloudinary)
- **Notifications**: In-app + email (SendGrid / Resend)

---

## 8. Acceptance Criteria (Must Have)

- [ ] Secretary can create a meter + facility and it appears in the Field Technician list
- [ ] Field Technician can scan barcode and system correctly validates match/mismatch
- [ ] GPS coordinates are captured and stored
- [ ] Address + Field Technician name are required before submission
- [ ] Full sequential approval flow works: Secretary → GM → MD → IT → Secretary
- [ ] IT can generate a unique Activation Code
- [ ] Completed items leave the active Meter Activation List
- [ ] Full audit trail is recorded
- [ ] Role-based access is strictly enforced
- [ ] Rejection with reason is possible at GM and MD stages

---

## 9. Nice-to-Have Features (Phase 2)

- Photo upload of the physical meter after installation
- Signature capture by Field Technician
- Export reports (Excel / PDF)
- Multi-facility filtering and statistics dashboard
- SMS / WhatsApp notifications
- Offline-first mobile experience with sync

---

## 10. Prompt for AI Code Generation

Use the content of this document as the primary source of truth when generating the application.

**Instruction to AI coding tools:**

> Build a complete hybrid Meter Installation System called **meter intallation system** based on the Product Requirements Document above.  
> Implement the exact workflow described in Section 3.  
> Create both a responsive web application for administrative roles (Secretary, GM, MD, IT) and a mobile-friendly interface (or React Native/Flutter app) for Field Technicians.  
> Enforce strict role-based access control.  
> Include barcode scanning with validation, GPS capture, multi-level approvals, Activation Code generation by IT, and a central Meter Activation List that removes completed items.  
> Use modern best practices for security, UI/UX, and data integrity.  
> Generate clean, well-structured, production-ready code with proper separation of concerns.

---

**End of Document**

*This PRD is ready to be used as a detailed prompt for developers or AI coding assistants.*