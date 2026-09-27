"use client";
import PasswordReset from "@/components/PasswordReset.jsx";

export default function ParentForgotPage() {
  return (
    <PasswordReset
      portal="parent"
      title="Reset family password"
      subtitle="Gill International School · Najjera"
      identifierLabel="Family username or parent email"
      identifierPlaceholder="e.g. nansubuga.family or you@example.com"
      signInHref="/portal/login"
      note="The code goes to the parent email on file. Both parents share the one family password."
    />
  );
}
