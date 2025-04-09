import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegisterForm from '../../p4sbu/components/RegisterForm'; // Adjust path as needed
import axios from 'axios';

jest.mock('axios');

describe('RegisterForm Component', () => {
  it('should submit the form successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { message: 'User registered successfully' } });

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'johndoe@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Permit Type/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/License Plate/i), { target: { value: 'ABC123' } });
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Main St' } });

    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    expect(await screen.findByText(/User registered successfully/i)).toBeInTheDocument();
  });

  it('should show error for missing fields', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { error: 'Missing required fields' } } });

    render(<RegisterForm />);

    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    expect(await screen.findByText(/Missing required fields/i)).toBeInTheDocument();
  });
});
