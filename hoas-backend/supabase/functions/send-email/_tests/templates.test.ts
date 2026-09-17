// Deno tests: run with `deno test --allow-read supabase/functions/send-email/_tests/templates.test.ts`
// from hoas-backend directory.
import { assert, assertStringIncludes, assertThrows } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { renderEmailTemplate, EMAIL_TYPES } from "../_templates/registry.ts";
import { MOCK_DATA } from "../_templates/mockData.ts";

const config = { appUrl: 'https://hoas-test.app', supportEmail: 'support@hoas.app', logoUrl: '', brandName: 'HOAS' };

Deno.test("all 20 registered types render html + text + subject", () => {
  assert(EMAIL_TYPES.length === 20, `expected 20 types, got ${EMAIL_TYPES.length}`);
  for (const type of EMAIL_TYPES) {
    const mock = (MOCK_DATA as any)[type];
    assert(mock, `missing mock for ${type}`);
    const out = renderEmailTemplate(type, mock.data, { ...config, ...(mock.config || {}) });
    assert(out.subject && out.subject.length > 3, `${type}: subject missing`);
    assert(out.html.includes('<table'), `${type}: html should be table-based`);
    assert(out.html.includes('HOAS'), `${type}: html should contain brand`);
    assert(out.textBody && out.textBody.length > 10, `${type}: text missing`);
    // CTA URL must appear in html or text when template defines one
    assert(out.html.includes('http') || out.textBody.includes('http'), `${type}: CTA/app url missing`);
  }
});

Deno.test("optional variables do not break rendering", () => {
  const out = renderEmailTemplate('account_rejected', { userName: 'Asha' }, config);
  assertStringIncludes(out.html, 'Asha');
  const out2 = renderEmailTemplate('administrative_report', { recipientName: 'Boss' }, config);
  assertStringIncludes(out2.html, 'Boss');
});

Deno.test("missing required variables produce useful errors", () => {
  assertThrows(() => renderEmailTemplate('password_reset', { userName: 'x' } as any, config), Error, 'Missing required variables for password_reset');
  assertThrows(() => renderEmailTemplate('complaint_created', {} as any, config), Error, 'Missing required variables');
});

Deno.test("unknown event types produce useful errors", () => {
  assertThrows(() => renderEmailTemplate('not_a_real_type', {}, config), Error, 'Unsupported email template type');
});

Deno.test("user content is escaped (no HTML injection)", () => {
  const out = renderEmailTemplate('new_announcement', {
    userName: '<img src=x onerror=alert(1)>',
    title: '<script>alert("x")</script>',
    summary: '<b>bold</b> & <i>italic</i>',
  }, config);
  assert(!out.html.includes('<script>alert'), 'raw script must be escaped');
  assert(out.html.includes('&lt;script&gt;'), 'script should be escaped');
  assert(out.html.includes('&lt;img'), 'img should be escaped');
});

Deno.test("security: account_created never includes passwords", () => {
  const out = renderEmailTemplate('account_created', {
    userName: 'Student', email: 's@example.com', role: 'student', studentId: 'STU1',
    tempPassword: 'should-never-appear-123',
  }, config);
  assert(!out.html.includes('should-never-appear-123'), 'password leaked into html');
  assert(!out.textBody.includes('should-never-appear-123'), 'password leaked into text');
  assertStringIncludes(out.html, 'STU1');
});

Deno.test("account_created card layout is valid + reset link renders", () => {
  const out = renderEmailTemplate('account_created', {
    userName: 'Faziya Shaik', email: 'tasneemshaik606@gmail.com', role: 'student',
    studentId: 'STU-539', collegeName: 'A.K. Vishwantha Reddy Degree College, Mulkanoor',
    loginUrl: 'https://hoas-client-4n13.vercel.app',
    resetLink: 'https://hoas-client-4n13.vercel.app/set-password?token=abc',
  }, config);
  assert(!out.html.includes('</td></tr>'), 'broken nested td/tr from old EmailCard');
  assertStringIncludes(out.html, 'Set Your Password');
  assertStringIncludes(out.html, 'STU-539');
  assertStringIncludes(out.html, 'tasneemshaik606@gmail.com');
  // email must not be uppercased by badge
  assert(!out.html.includes('TASNEEMSHAIK606@GMAIL.COM'), 'email must preserve case');
});
