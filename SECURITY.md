# Security Policy

## Reporting a Vulnerability

We take the security of Railroad Arcade seriously. If you discover a security vulnerability, please follow our responsible disclosure process.

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please email us at: **security@railroad-arcade.app** (or open a private security advisory on GitHub)

Include the following information:
- Type of vulnerability (e.g., XSS, SQL injection, authentication bypass)
- Location of the affected code (file path, line numbers if known)
- Step-by-step instructions to reproduce
- Potential impact of the vulnerability
- Any suggested fixes (optional but appreciated)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Investigation**: We will investigate and provide an initial assessment within 7 days
- **Resolution**: Critical vulnerabilities will be addressed as quickly as possible
- **Disclosure**: We will coordinate disclosure timing with you

### Scope

The following are in scope for security reports:

- Authentication and authorization flaws
- Data exposure or leakage
- Cross-site scripting (XSS)
- SQL injection
- Server-side request forgery (SSRF)
- Remote code execution
- Payment processing vulnerabilities
- Token/session hijacking

### Out of Scope

- Denial of service attacks
- Social engineering
- Physical security issues
- Issues in third-party dependencies (report to the dependency maintainer)
- Issues requiring physical access to the server

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :x:                |
| < 1.0   | :x:                |

---

## Security Best Practices

### For Contributors

- Never commit secrets, API keys, or credentials
- Use environment variables for sensitive configuration
- Validate and sanitize all user input
- Use parameterized queries (Prisma handles this)
- Follow the principle of least privilege

### For Deployment

- Always use HTTPS in production
- Set secure cookie flags
- Configure proper CORS headers
- Enable rate limiting
- Keep dependencies updated
- Use strong, unique NEXTAUTH_SECRET
- Set proper CSP headers

---

## Known Security Measures

Railroad Arcade implements the following security measures:

### Authentication
- Password hashing with bcryptjs (12 rounds)
- JWT-based sessions with 30-day expiration
- CSRF protection via NextAuth

### API Security
- Rate limiting (100 req/10s general, 5 req/min auth)
- Input validation on all endpoints
- Proper HTTP status codes and error messages

### Payment Security
- Webhook signature verification for all payment providers
- No storage of payment credentials
- Server-side payment processing only

### Data Protection
- PostgreSQL with SSL connections
- Minimal data collection
- User data encryption at rest (via Neon)

---

## Acknowledgments

We appreciate the security researchers who help keep Railroad Arcade safe. Contributors who report valid security issues will be acknowledged here (with permission).

---

Thank you for helping keep Railroad Arcade secure!
