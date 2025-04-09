// app/profile/page.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
// Import your existing BGIMG if you want the background
import BGIMG from "../components/BGIMG";

export default function Profile() {
  // User data stored in state
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    studentId: "SBU123456",
    licensePlate: "ABC-1234",
    profileImage: "/profile-pic.jpg", // Place this file in public/ or update path
  });

  // Tracks which fields are currently editable
  const [editMode, setEditMode] = useState({
    name: false,
    email: false,
    studentId: false,
    licensePlate: false,
  });

  // Toggles edit/read-only state for a specific field
  function toggleEdit(field: keyof typeof editMode) {
    // If we're switching from edit→save, you could also handle saving to a backend here
    setEditMode((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  // Handles changing the value of the specified field in the user object
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof user
  ) {
    setUser((prev) => ({ ...prev, [field]: e.target.value }));
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center">
      {/* Background image, slightly opaque */}
      <BGIMG url="/map-bg.jpg" />

      {/* Profile card container; z-10 to ensure it's above the background */}
      <div className="relative z-10 w-full max-w-xl p-4">
        <div className="bg-white border border-black rounded shadow-md p-6 flex flex-col items-center">
          {/* Profile picture */}
          <div className="w-32 h-32 mb-4 rounded-full overflow-hidden border-4 border-red-600">
            <Image
              src={user.profileImage}
              alt="Profile Picture"
              width={128}
              height={128}
            />
          </div>

          {/* Editable fields */}
          <ProfileField
            label="Name"
            value={user.name}
            editing={editMode.name}
            onEdit={() => toggleEdit("name")}
            onChange={(e) => handleChange(e, "name")}
          />

          <ProfileField
            label="Email"
            value={user.email}
            editing={editMode.email}
            onEdit={() => toggleEdit("email")}
            onChange={(e) => handleChange(e, "email")}
          />

          <ProfileField
            label="Student ID"
            value={user.studentId}
            editing={editMode.studentId}
            onEdit={() => toggleEdit("studentId")}
            onChange={(e) => handleChange(e, "studentId")}
          />

          <ProfileField
            label="License Plate"
            value={user.licensePlate}
            editing={editMode.licensePlate}
            onEdit={() => toggleEdit("licensePlate")}
            onChange={(e) => handleChange(e, "licensePlate")}
          />
        </div>
      </div>
    </main>
  );
}

// A small helper component for each row with label, input, and ED button
function ProfileField({
  label,
  value,
  editing,
  onEdit,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onEdit: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between mb-4">
      <strong className="text-black mb-1 sm:mb-0">{label}:</strong>
      <div className="flex items-center w-full sm:w-auto">
        <input
          type="text"
          className={`border rounded px-2 py-1 text-black ${
            editing ? "border-red-600 bg-white" : "border-gray-400 bg-gray-100"
          } sm:mr-2 w-full sm:w-auto`}
          readOnly={!editing}
          value={value}
          onChange={onChange}
        />
        <button
          onClick={onEdit}
          className="bg-black text-white rounded px-2 py-1 hover:bg-gray-800 ml-2"
        >
          {editing ? "SAVE" : "Edit"}
        </button>
      </div>
    </div>
  );
}
