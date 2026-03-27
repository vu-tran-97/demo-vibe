# Sprint 7 Prompt Map

## Sprint Goal
Enable email notifications across the platform and allow users to choose between Buyer and Seller roles during signup, laying the foundation for role-differentiated user experiences.

## Previous Sprint Carryover
Sprint 6 (Final Polish) completed all planned features. No carryover items. Retrospective was not conducted.

## Feature 1: Email Service Integration

### 1.1 Design Prompt
/feature-dev "Write the design document for the Email Service module
to docs/blueprints/011-email-service/blueprint.md.
- Integrate email sending via SMTP (Nodemailer) or external provider (SendGrid/AWS SES)
- Welcome email on signup
- Order confirmation email on successful checkout
- Password reset email
- Email template system (HTML templates with variable interpolation)
- Rate limiting for email sends
- Email send logging (TL_COMM_EMAIL_LOG collection)
- Environment-based config (SMTP host, port, credentials)
- Queue-based async sending to avoid blocking API responses
Refer to docs/database/database-design.md for DB schema.
Do not modify any code yet."

### 1.2 DB Design Reflection Prompt
/feature-dev "Add/update the email-related collections in
docs/database/database-design.md:
- TL_COMM_EMAIL_LOG (email send log: recipient, subject, template, status, sentAt, error)
- Also update the ERD and FK relationship summary. Follow standard terminology dictionary.
Do not modify any code yet."

### 1.3 Test Case Prompt
/feature-dev "Based on the feature requirements in docs/blueprints/011-email-service/blueprint.md,
write test cases to docs/tests/test-cases/sprint-7/email-service-test-cases.md.
Use Given-When-Then format, include unit/integration/edge cases.
Do not modify any code yet."

### 1.4 Implementation Prompt
/feature-dev "Strictly follow the contents of docs/blueprints/011-email-service/blueprint.md and
docs/database/database-design.md to proceed with development.
- Create server/src/mail/ module with MailService, MailModule
- Implement email templates (welcome, order-confirmation, password-reset)
- Integrate with auth module (send welcome email on signup)
- Integrate with order module (send confirmation on checkout)
- Use Nodemailer with SMTP config from environment variables
- Add email send logging to database
Write tests referencing docs/tests/test-cases/sprint-7/email-service-test-cases.md,
and once implementation is complete, run all tests and
report results to docs/tests/test-reports/."

## Feature 2: Role-Based Signup (Buyer/Seller)

### 2.1 Design Prompt
/feature-dev "Write the design document for Role-Based Signup
to docs/blueprints/012-role-signup/blueprint.md.
- Add role selection step to signup flow (Buyer or Seller)
- Buyer: default role, can browse and purchase products
- Seller: can list products, manage inventory, view sales dashboard
- Update signup DTO to accept role field
- Update signup form UI with role selection (radio buttons or cards)
- Role-specific onboarding: Seller gets redirected to product creation after signup
- Update auth modal and standalone signup page
- Ensure existing users remain as BUYER (backward compatible)
- Role badge display in user menu and settings
Refer to docs/database/database-design.md for DB schema.
Do not modify any code yet."

### 2.2 DB Design Reflection Prompt
/feature-dev "Review and confirm the existing useRoleCd field in TB_COMM_USER
supports the Buyer/Seller role selection in docs/database/database-design.md:
- useRoleCd: 'BUYER' | 'SELLER' (already exists, default 'BUYER')
- Verify no additional schema changes are needed
- Update documentation if necessary. Follow standard terminology dictionary.
Do not modify any code yet."

### 2.3 Test Case Prompt
/feature-dev "Based on the feature requirements in docs/blueprints/012-role-signup/blueprint.md,
write test cases to docs/tests/test-cases/sprint-7/role-signup-test-cases.md.
Use Given-When-Then format, include unit/integration/edge cases.
Do not modify any code yet."

### 2.4 Implementation Prompt
/feature-dev "Strictly follow the contents of docs/blueprints/012-role-signup/blueprint.md and
docs/database/database-design.md to proceed with development.
- Update server/src/auth/dto/signup.dto.ts to accept optional role field
- Update server/src/auth/auth.service.ts signup logic to set role
- Update frontend signup form (AuthModal + standalone page) with role selection UI
- Add role badge to UserMenu and settings page
- Seller-specific redirect after signup (to product creation)
- Send role-appropriate welcome email (integrate with Feature 1)
Write tests referencing docs/tests/test-cases/sprint-7/role-signup-test-cases.md,
and once implementation is complete, run all tests and
report results to docs/tests/test-reports/."
