"use client";
import PasswordReset from "@/components/PasswordReset.jsx";

export default function StaffForgotPage() {
  return (
    <PasswordReset
      portal="staff"
      title="Reset staff password"
      subtitle="Gill School OS · Staff Portal"
      identifierLabel="School email address"
      identifierPlaceholder="you@gill.ac.ug"
      identifierType="email"
      signInHref="/staff"
      note="The code goes to your school mailbox. No email? Ask the Head of School to re-send your invite."
    />
  );
}
