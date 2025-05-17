import React, { useState } from 'react';
import './Projects.css'; 

function Projects() {
  const [expandedProject, setExpandedProject] = useState(null);

  const projects = [
    {
      title: "Learning Platform with Gemini Pro",
      description: "Developed a learning platform using React and Java, enabling personalized interactions for STEM students.",
      timeline: "Sept 2023 - Feb 2024",
      technologies: "React, Java, Gemini Pro (LLM)",
      review: "Invaluable experience in software development, collaboration, and leadership.",
    },
    {
      title: "Network Security at Bally's Casino",
      description: "Implemented and maintained network systems while ensuring robust security controls.",
      timeline: "Jan 2023 - Sept 2023",
      technologies: "AS400, Network Security",
      review: "Required a proactive approach to cybersecurity to protect sensitive data.",
    },
    {
      title: "Helpdesk Support at DDOE",
      description: "Provided technical support and improved processes like inventory management.",
      timeline: "July 2020 - July 2021",
      technologies: "PowerShell, MS Excel, Inventory Management Systems",
      review: "Developed critical thinking, adaptability, and problem-solving skills.",
    },
    {
      title: "AI SaaS Platform",
      description: "Developed a scalable AI-powered SaaS platform for web developers who want to prototype generated AI content.",
      timeline: "Mar 2024 - Present",
      technologies: "Next.js, Node.js, Replicate AI, Gemini Pro, Tailwind CSS, OpenAI",
      review: "Challenging project involving complex AI model integration and cloud deployment.",
      github: "https://github.com/invidias-codem/ai-saas"
    },
    {
      title: "Subnet Calculator",
      description: "Created a user-friendly subnet calculator with binary/decimal conversion capabilities.",
      timeline: "2023",
      technologies: "HTML, CSS, JavaScript",
      review: "Practical tool demonstrating strong understanding of networking concepts.",
      github: "https://github.com/invidias-codem/subnet-calc"
    },
    {
      title: "Personal Portfolio Website",
      description: "Designed and built my personal portfolio website to showcase my skills and projects.",
      timeline: "Ongoing",
      technologies: "React, Rest API, Tailwind CSS",
      review: "Creative project allowing me to experiment with modern web development techniques.",
      github: "https://github.com/invidias-codem/"
    }
  ];

  const toggleProject = (index) => {
    setExpandedProject(expandedProject === index ? null : index);
  };

  return (
    <section className="projects">
      <div className="projects__title">
        <h2>Recent Projects</h2>
      </div>
      <div className="projects__container">
        {projects.map((project, index) => (
          <div key={index} className={`project-card ${expandedProject === index ? 'expanded' : ''}`}>
            <div className="project-card__content">
              <h3 className="project-card__title">{project.title}</h3>
              <p className="project-card__description">{project.description}</p>
              <button
                className="project-card__read-more-button"
                onClick={() => toggleProject(index)}
                aria-expanded={expandedProject === index}
              >
                {expandedProject === index ? 'Read Less' : 'Read More'}
              </button>
            </div>
            {expandedProject === index && (
              <div className="project-details">
                <p><span className="detail-label">Timeline:</span> <span className="detail-content">{project.timeline}</span></p>
                <p><span className="detail-label">Technologies:</span> <span className="detail-content">{project.technologies}</span></p>
                <p><span className="detail-label">Review:</span> <span className="detail-content">{project.review}</span></p>
                {project.github && (
                  <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-details__github-link-button">
                    View on GitHub
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="text-center mt-5">
  {/* PDF Preview */}
  <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', height: '600px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
    <embed
      src="Jair's_Resume(2025).pdf"
      type="application/pdf"
      width="100%"
      height="100%"
      title="Resume Preview"
    />
    {}
  </div>

  {/* Download Button */}
  <a
    href="Jair's_Resume(2025).pdf"
    download="Jair's_Resume(2025).pdf"
    className="download-resume-button"
    style={{ display: 'inline-block', marginTop: '20px' }}
  >
    Download Resume (PDF)
  </a>
</div>

    </section>
  );
}

export default Projects;