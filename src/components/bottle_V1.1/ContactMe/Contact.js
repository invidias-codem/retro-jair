import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { FaLinkedin, FaGithub } from 'react-icons/fa';
import './contact.css';
import { getFunctionsClient } from '../../../firebase';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: 'General Inquiry',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus('Please fill in all fields.');
      setLoading(false);
      return;
    }
    if (formData.message.length > 5000) {
      setStatus('Your message is too long (max 5000 characters).');
      setLoading(false);
      return;
    }

    try {
      const sanitizedFormData = {
        name: DOMPurify.sanitize(formData.name),
        email: DOMPurify.sanitize(formData.email),
        reason: formData.reason,
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
    <section className="contact jj-container">
      <header className="jj-section-head">
        <p className="eyebrow">Contact</p>
        <h1 className="jj-section-title">Get In Touch</h1>
        <p className="jj-section-sub">
          Open to engineering roles, consulting, and collaboration. Send a note — or connect directly.
        </p>
      </header>

      <div className="contact-layout">
        <form onSubmit={handleSubmit} className="contact-form jj-card">
          <div className="form-group">
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" required className="form-input" />
          </div>
          <div className="form-group">
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Your Email" required className="form-input" />
          </div>
          <div className="form-group">
            <select name="reason" value={formData.reason} onChange={handleChange} required className="form-select">
              <option value="General Inquiry">General Inquiry</option>
              <option value="Hiring">Hiring</option>
              <option value="Consultation Request">Consultation Request</option>
            </select>
          </div>
          <div className="form-group">
            <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Subject" required className="form-input" />
          </div>
          <div className="form-group">
            <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Your Message" required className="form-textarea" />
          </div>
          <button type="submit" className="submit-button jj-btn jj-btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Message'}
          </button>
          {status && (
            <div className={`status-message ${status.includes('error') ? 'error' : 'success'}`}>{status}</div>
          )}
        </form>

        <aside className="contact-aside">
          <div className="jj-card contact-card">
            <h3>Direct</h3>
            <p className="contact-card-note">Prefer async? Reach me on professional networks.</p>
            <a href="https://www.linkedin.com/in/joshua-mohammed14/" target="_blank" rel="noopener noreferrer" className="jj-btn jj-btn-quiet contact-social">
              <FaLinkedin /> LinkedIn
            </a>
            <a href="https://github.com/invidias-codem" target="_blank" rel="noopener noreferrer" className="jj-btn jj-btn-quiet contact-social">
              <FaGithub /> GitHub
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default Contact;
