// app/components/FormTextArea.tsx
'use client';
import React from 'react';

export type FormTextAreaProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
};

const FormTextArea = ({
  label,
  name,
  value,
  onChange,
  required = false,
}: FormTextAreaProps) => {
  return (
    <label className="block mb-4">
      <span className="text-gray-700">{label}</span>
      <textarea
        name={name}
        className="mt-1 p-2 border rounded w-full"
        value={value}
        onChange={onChange}
        required={required}
      ></textarea>
    </label>
  );
};

export default FormTextArea;
