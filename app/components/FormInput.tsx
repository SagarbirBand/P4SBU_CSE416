// app/components/FormInput.tsx
'use client';
import React from 'react';

export type FormInputProps = {
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
};

const FormInput = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  required = false,
}: FormInputProps) => {
  return (
    <label className="block mb-4">
      <span className="text-gray-700">{label}</span>
      <input
        type={type}
        name={name}
        className="mt-1 p-2 border rounded w-full"
        value={value}
        onChange={onChange}
        required={required}
      />
    </label>
  );
};

export default FormInput;
