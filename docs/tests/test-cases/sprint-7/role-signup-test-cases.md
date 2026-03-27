# Role-Based Signup Test Cases (Sprint 7)

## Unit Tests

### Signup DTO Validation

#### TC-ROLE-001: Signup with role BUYER
- **Given**: Signup DTO with role = "BUYER"
- **When**: Validation runs
- **Then**: Passes validation, role is accepted

#### TC-ROLE-002: Signup with role SELLER
- **Given**: Signup DTO with role = "SELLER"
- **When**: Validation runs
- **Then**: Passes validation, role is accepted

#### TC-ROLE-003: Signup with no role (default)
- **Given**: Signup DTO without role field
- **When**: Validation runs
- **Then**: Passes validation, role defaults to "BUYER"

#### TC-ROLE-004: Signup with role ADMIN rejected
- **Given**: Signup DTO with role = "ADMIN"
- **When**: Validation runs
- **Then**: Fails validation with error (ADMIN cannot be self-assigned)

#### TC-ROLE-005: Signup with invalid role rejected
- **Given**: Signup DTO with role = "INVALID"
- **When**: Validation runs
- **Then**: Fails validation with error

### AuthService Signup

#### TC-ROLE-006: Create user with BUYER role
- **Given**: Valid signup data with role = "BUYER"
- **When**: AuthService.signup() is called
- **Then**: User is created with useRoleCd = "BUYER"

#### TC-ROLE-007: Create user with SELLER role
- **Given**: Valid signup data with role = "SELLER"
- **When**: AuthService.signup() is called
- **Then**: User is created with useRoleCd = "SELLER"

#### TC-ROLE-008: Create user without role defaults to BUYER
- **Given**: Valid signup data without role field
- **When**: AuthService.signup() is called
- **Then**: User is created with useRoleCd = "BUYER"

#### TC-ROLE-009: JWT token includes correct role
- **Given**: User signs up with role = "SELLER"
- **When**: JWT tokens are generated
- **Then**: Access token payload contains role = "SELLER"

## Integration Tests

### API Endpoint

#### TC-ROLE-INT-001: POST /api/auth/signup with SELLER role
- **Given**: Valid signup body with role = "SELLER"
- **When**: POST /api/auth/signup
- **Then**: Response 201 with user.role = "SELLER", accessToken contains SELLER role

#### TC-ROLE-INT-002: POST /api/auth/signup without role
- **Given**: Valid signup body without role
- **When**: POST /api/auth/signup
- **Then**: Response 201 with user.role = "BUYER"

#### TC-ROLE-INT-003: POST /api/auth/signup with ADMIN role blocked
- **Given**: Signup body with role = "ADMIN"
- **When**: POST /api/auth/signup
- **Then**: Response 400 with validation error

#### TC-ROLE-INT-004: Seller can access product creation after signup
- **Given**: User signed up with role = "SELLER"
- **When**: GET /api/products/my with seller's access token
- **Then**: Response 200 (seller has access to product management)

### Frontend

#### TC-ROLE-UI-001: Role selector displays on signup form
- **Given**: User opens signup modal or page
- **When**: Signup form renders
- **Then**: Two role cards (Buyer/Seller) are visible, Buyer is selected by default

#### TC-ROLE-UI-002: Selecting Seller role updates form state
- **Given**: Signup form is open with Buyer selected
- **When**: User clicks Seller card
- **Then**: Seller card shows selected state, Buyer card is deselected

#### TC-ROLE-UI-003: Buyer signup redirects to homepage
- **Given**: User fills signup form with Buyer role
- **When**: Signup is successful
- **Then**: User is redirected to "/" (homepage)

#### TC-ROLE-UI-004: Seller signup redirects to product creation
- **Given**: User fills signup form with Seller role
- **When**: Signup is successful
- **Then**: User is redirected to "/dashboard/products/create"

#### TC-ROLE-UI-005: Role badge shows in user menu
- **Given**: User is logged in as SELLER
- **When**: User menu dropdown is opened
- **Then**: "Seller" badge is displayed next to user info

#### TC-ROLE-UI-006: Role badge shows on settings page
- **Given**: User is logged in as BUYER
- **When**: User visits settings page
- **Then**: "Buyer" role badge is displayed in account info section

## Edge Cases

#### TC-ROLE-EDGE-001: Existing BUYER users unaffected
- **Given**: Users created before this feature (no role in signup)
- **When**: They log in
- **Then**: Their role remains "BUYER", no errors

#### TC-ROLE-EDGE-002: Social login users default to BUYER
- **Given**: User signs up via Google/Kakao/Naver social login
- **When**: Social signup flow completes
- **Then**: User is created with useRoleCd = "BUYER" (social login doesn't offer role selection)
