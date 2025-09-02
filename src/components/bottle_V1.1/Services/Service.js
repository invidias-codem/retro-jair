import React from 'react';
import { Link } from 'react-router-dom';
import './Services.css';

function Services() {
  const servicesList = [
    {
      title: "Custom AI Agent Development",
      description: "Building intelligent, conversational AI agents tailored to your business needs using modern language models like Gemini.",
    },
    {
      title: "Web Application Development",
      description: "Creating responsive, high-performance web applications from the ground up with a focus on clean code and user experience.",
    },
    {
      title: "React & Node.js Consulting",
      description: "Providing expert guidance and development support for your projects using the latest features of React and Node.js.",
    },
    {
      title: "UI/UX Design for Web Apps",
      description: "Designing intuitive and visually appealing user interfaces with a unique retro-futuristic aesthetic.",
    }
  ];

  return (
    <section className="services">
      <div className="services__title">
        <h2>Services Offered</h2>
      </div>
      <div className="services__container">
        {servicesList.map((service, index) => (
          <div key={index} className="service-card">
            <h3 className="service-card__title">{service.title}</h3>
            <p className="service-card__description">{service.description}</p>
          </div>
        ))}
      </div>
      <div className="services__contact-prompt">
        <p>Ready to build something amazing together?</p>
        <Link to="/contact" className="services__contact-button">
          Contact Me
        </Link>
      </div>
    </section>
  );
}

export default Services;