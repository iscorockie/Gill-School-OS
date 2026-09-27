"use client";
import PasswordReset from "@/components/PasswordReset.jsx";

export default function StudentForgotPage() {
  return (
    <PasswordReset
      portal="student"
      title="Reset student password"
      subtitle="Gill International School · Najjera"
      identifierLabel="Student username"
      identifierPlaceholder="e.g. jordan.nansubuga"
      signInHref="/student/login"
      note="Ask your parent first — the reset code is emailed to them, and they enter it with you."
    />
  );
}
