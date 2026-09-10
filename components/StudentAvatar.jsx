"use client";

const STUDENT_PHOTOS = {
  "s-pres-1": "/students/maya-nansubuga.jpg",
  "s-main-1": "/students/jordan-nansubuga.jpg",
};

function initials(name = "Student") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function StudentAvatar({ student, size = 56, className = "", style }) {
  const photo = student?.photo || STUDENT_PHOTOS[student?.id];
  const preSchool = student?.campus === "preschool";

  return (
    <div
      className={`student-avatar ${className}`.trim()}
      style={{
        width: size,
        height: size,
        background: preSchool ? "var(--cream)" : "var(--peri-l)",
        borderColor: preSchool ? "var(--sun2)" : "var(--peri-2)",
        color: preSchool ? "var(--gips-deep)" : "var(--maroon)",
        fontFamily: preSchool ? "var(--fpd)" : "var(--fd)",
        ...style,
      }}
      aria-label={student?.name ? `${student.name}'s profile photo` : "Student profile photo"}
    >
      <span aria-hidden="true">{initials(student?.name)}</span>
      {photo && (
        <img
          src={photo}
          alt=""
          loading="lazy"
          onError={(event) => { event.currentTarget.style.display = "none"; }}
        />
      )}
    </div>
  );
}
