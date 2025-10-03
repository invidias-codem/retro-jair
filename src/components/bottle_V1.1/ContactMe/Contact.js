import React, { useState } from 'react';
import DOMPurify from 'dompurify'; // Import DOMPurify
import './contact.css';
import { getFunctionsClient } from '../../../firebase';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: 'General Inquiry',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    // --- Client-Side Validation ---
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus('Please fill in all fields.');
      setLoading(false);
      return;
    }
    if (formData.message.length > 5000) { // Example length check
      setStatus('Your message is too long (max 5000 characters).');
      setLoading(false);
      return;
    }

    try {
      // --- Sanitize data before sending ---
      const sanitizedFormData = {
        name: DOMPurify.sanitize(formData.name),
        email: DOMPurify.sanitize(formData.email),
        reason: formData.reason, // No sanitization needed for select dropdown
        subject: DOMPurify.sanitize(formData.subject),
        message: DOMPurify.sanitize(formData.message),
      };

      const functions = await getFunctionsClient();
      const { httpsCallable } = await import('firebase/functions');
      const submitContactForm = httpsCallable(functions, 'submitContactForm');

      const result = await submitContactForm(sanitizedFormData);
      
      if (result.data.success) {
        setFormData({ name: '', email: '', reason: 'General Inquiry', subject: '', message: '' });
        setStatus('Message sent successfully!');
      } else {
        // Handle validation errors from the server
        setStatus(result.data.errors ? result.data.errors[0].msg : 'An unknown error occurred.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus('There was an error sending your message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-container">
      <h2 className="contact-title">Get In Touch</h2>
      <form onSubmit={handleSubmit} className="contact-form">
        <div className="form-group">
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" required className="form-input"/>
        </div>
        <div className="form-group">
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Your Email" required className="form-input"/>
        </div>
        {/* --- ADD THIS DROPDOWN --- */}
        <div className="form-group">
          <select name="reason" value={formData.reason} onChange={handleChange} required className="form-select">
            <option value="General Inquiry">General Inquiry</option>
            <option value="Hiring">Hiring</option>
            <option value="Consultation Request">Consultation Request</option>
          </select>
        </div>
        <div className="form-group">
          <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Subject" required className="form-input"/>
        </div>
        <div className="form-group">
          <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Your Message" required className="form-textarea"/>
        </div>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Sending...' : 'Send Message'}
        </button>
        {status && (
          <div className={`status-message ${status.includes('error') ? 'error' : 'success'}`}>
            {status}
          </div>
        )}
      </form>
    </div>
  );
}

export default Contact;