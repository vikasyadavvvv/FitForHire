import React from 'react';
import { useState } from 'react';
import { saveAs } from 'file-saver';

export default function ResumeForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    portfolioUrl: '',
    linkedinUrl: '',
    professionalSummary: '',
    targetJobTitle: '',
    targetJobDescription: '',
    skills: [''],
    education: [{ institution: '', degree: '', field: '', year: '' }],
    workExperience: [{ company: '', position: '', duration: '', responsibilities: [''] }],
    projects: [{ title: '', description: '', technologies: [''] }],
    certificates: ['']
  });

  const [generatedResume, setGeneratedResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const handleNestedArrayChange = (field, index, subField, value) => {
    const newArray = [...formData[field]];
    newArray[index][subField] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field, template) => {
    setFormData({ ...formData, [field]: [...formData[field], template] });
  };

  const removeArrayItem = (field, index) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  // Basic validation mirroring backend requirements
  if (!formData.name || !formData.email || !formData.phone || 
      !formData.skills || formData.skills.length === 0 ||
      !formData.education || formData.education.length === 0) {
    setError('Missing required fields: Name, Email, Phone, Skills, and Education are mandatory');
    setLoading(false);
    return;
  }

  try {
    const response = await fetch('https://fitforhire-production.up.railway.app/api/resume/generate-ats-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({
        ...formData,
        // Ensure arrays are properly sent even if empty
        certificates: formData.certificates || [],
        projects: formData.projects || [],
        workExperience: formData.workExperience || [],
        // Optional fields with defaults
        portfolioUrl: formData.portfolioUrl || "",
        linkedinUrl: formData.linkedinUrl || "",
        professionalSummary: formData.professionalSummary || "",
        targetJobTitle: formData.targetJobTitle || "",
        targetJobDescription: formData.targetJobDescription || ""
      })
    });

    // Handle non-200 responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `Request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.atsResume || !data.analysis) {
      throw new Error('Invalid response format from server');
    }

    setGeneratedResume(data);
  } catch (err) {
    // Handle different error types
    let errorMessage = err.message;
    
    if (err.message.includes('Failed to fetch')) {
      errorMessage = 'Network error - could not connect to server';
    } else if (err.message.includes('<!DOCTYPE html>')) {
      errorMessage = 'Server error occurred';
    } else if (err.name === 'SyntaxError') {
      errorMessage = 'Invalid server response format';
    }
    
    setError(errorMessage);
    console.error("Resume generation failed:", err);
  } finally {
    setLoading(false);
  }
};

const exportResume = (format) => {
    if (!generatedResume) return;
    
    const blob = new Blob([generatedResume.atsResume], { 
      type: format === 'pdf' ? 'application/pdf' : 'application/msword' 
    });
    saveAs(blob, `ATS_Resume_${formData.name.replace(/\s+/g, '_')}.${format}`);
  };

  return (
    <div className="resume-builder">
      <form onSubmit={handleSubmit}>
        <h2>Contact Information</h2>
        <div className="form-group">
          <label>Full Name*</label>
          <input 
            name="name" 
            type="text"
            value={formData.name}
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="form-group">
          <label>Email*</label>
          <input 
            name="email" 
            type="email" 
            value={formData.email}
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="form-group">
          <label>Phone*</label>
          <input 
            name="phone" 
            type="tel" 
            value={formData.phone}
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="form-group">
          <label>LinkedIn URL</label>
          <input 
            name="linkedinUrl" 
            type="url" 
            value={formData.linkedinUrl}
            onChange={handleChange} 
          />
        </div>

        <div className="form-group">
          <label>Portfolio URL</label>
          <input 
            name="portfolioUrl" 
            type="url" 
            value={formData.portfolioUrl}
            onChange={handleChange} 
          />
        </div>

        <h2>Target Position</h2>
        <div className="form-group">
          <label>Desired Job Title</label>
          <input 
            name="targetJobTitle" 
            type="text"
            value={formData.targetJobTitle}
            onChange={handleChange} 
          />
        </div>

        <div className="form-group">
          <label>Job Description (Optional)</label>
          <textarea 
            name="targetJobDescription" 
            value={formData.targetJobDescription}
            onChange={handleChange}
            rows="5"
          />
        </div>

        <h2>Professional Summary</h2>
        <div className="form-group">
          <textarea 
            name="professionalSummary" 
            value={formData.professionalSummary}
            onChange={handleChange}
            rows="5"
            placeholder="Leave blank to auto-generate based on your skills and experience"
          />
        </div>

        <h2>Skills*</h2>
        {formData.skills.map((skill, index) => (
          <div key={index} className="array-item">
            <input
              className='text-black'
              value={skill}
              type="text"
              onChange={(e) => handleArrayChange('skills', index, e.target.value)}
              placeholder="e.g., JavaScript, Project Management"
            />
            {formData.skills.length > 1 && (
              <button
                type="button" 
                className="remove-btn"
                onClick={() => removeArrayItem('skills', index)}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button 
          type="button" 
          className="add-btn"
          onClick={() => addArrayItem('skills', '')}
        >
          + Add Skill
        </button>

        <h2>Education*</h2>
        {formData.education.map((edu, index) => (
          <div key={index} className="nested-array-item">
            <div className="form-group">
              <label>Institution*</label>
              <input
               type="text"
               className='text-black'
                value={edu.institution}
                onChange={(e) => handleNestedArrayChange('education', index, 'institution', e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Degree*</label>
                <input
                  type="text"
                  className='text-black'
                  value={edu.degree}
                  onChange={(e) => handleNestedArrayChange('education', index, 'degree', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Field of Study*</label>
                <input
                 type="text"
                  className='text-black'
                  value={edu.field}
                  onChange={(e) => handleNestedArrayChange('education', index, 'field', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Year*</label>
                <input
                  type="text"
                  className='text-black'
                  value={edu.year}
                  onChange={(e) => handleNestedArrayChange('education', index, 'year', e.target.value)}
                  required
                />
              </div>
            </div>
            {formData.education.length > 1 && (
              <button 
                type="button" 
                className="remove-btn"
                onClick={() => removeArrayItem('education', index)}
              >
                Remove Education
              </button>
            )}
          </div>
        ))}
        <button 
          type="button" 
          className="add-btn"
          onClick={() => addArrayItem('education', { 
            institution: '', 
            degree: '', 
            field: '', 
            year: '' 
          })}
        >
          + Add Education
        </button>

        <h2>Work Experience</h2>
        {formData.workExperience.map((exp, index) => (
          <div key={index} className="nested-array-item">
            <div className="form-row">
              <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  className='text-black'
                  value={exp.company}
                  onChange={(e) => handleNestedArrayChange('workExperience', index, 'company', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Position</label>
                <input
                  type="text"
                  className='text-black'
                  value={exp.position}
                  onChange={(e) => handleNestedArrayChange('workExperience', index, 'position', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Duration</label>
                <input
                  type="text"
                  className='text-black'
                  value={exp.duration}
                  onChange={(e) => handleNestedArrayChange('workExperience', index, 'duration', e.target.value)}
                  placeholder="e.g., Jan 2020 - Present"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Responsibilities</label>
              {exp.responsibilities.map((resp, respIndex) => (
                <div key={respIndex} className="array-item">
                  <input
                  type="text"
                  className='text-black'
                    value={resp}
                    onChange={(e) => {
                      const newExp = [...formData.workExperience];
                      newExp[index].responsibilities[respIndex] = e.target.value;
                      setFormData({ ...formData, workExperience: newExp });
                    }}
                    placeholder="e.g., Managed a team of 5 developers"
                  />
                  {exp.responsibilities.length > 1 && (
                    <button 
                      type="button" 
                      className="remove-btn"
                      onClick={() => {
                        const newExp = [...formData.workExperience];
                        newExp[index].responsibilities = newExp[index].responsibilities.filter(
                          (_, i) => i !== respIndex
                        );
                        setFormData({ ...formData, workExperience: newExp });
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                className="add-btn"
                onClick={() => {
                  const newExp = [...formData.workExperience];
                  newExp[index].responsibilities.push('');
                  setFormData({ ...formData, workExperience: newExp });
                }}
              >
                + Add Responsibility
              </button>
            </div>
            {formData.workExperience.length > 1 && (
              <button 
                type="button" 
                className="remove-btn"
                onClick={() => removeArrayItem('workExperience', index)}
              >
                Remove Experience
              </button>
            )}
          </div>
        ))}
        <button 
          type="button" 
          className="add-btn"
          onClick={() => addArrayItem('workExperience', { 
            company: '', 
            position: '', 
            duration: '', 
            responsibilities: [''] 
          })}
        >
          + Add Experience
        </button>

        <h2>Projects</h2>
        {formData.projects.map((proj, index) => (
          <div key={index} className="nested-array-item">
            <div className="form-group">
              <label>Project Title</label>
              <input
               type="text"
                className='text-black'

                value={proj.title}
                onChange={(e) => handleNestedArrayChange('projects', index, 'title', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                type="text"
                className='text-black'
                value={proj.description}
                onChange={(e) => handleNestedArrayChange('projects', index, 'description', e.target.value)}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Technologies</label>
              {proj.technologies.map((tech, techIndex) => (
                <div key={techIndex} className="array-item">
                  <input
                  type="text"
                  className='text-black'

                    value={tech}
                    onChange={(e) => {
                      const newProjects = [...formData.projects];
                      newProjects[index].technologies[techIndex] = e.target.value;
                      setFormData({ ...formData, projects: newProjects });
                    }}
                    placeholder="e.g., React, Node.js"
                  />
                  {proj.technologies.length > 1 && (
                    <button 
                      type="button" 
                      className="remove-btn"
                      onClick={() => {
                        const newProjects = [...formData.projects];
                        newProjects[index].technologies = newProjects[index].technologies.filter(
                          (_, i) => i !== techIndex
                        );
                        setFormData({ ...formData, projects: newProjects });
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                className="add-btn"
                onClick={() => {
                  const newProjects = [...formData.projects];
                  newProjects[index].technologies.push('');
                  setFormData({ ...formData, projects: newProjects });
                }}
              >
                + Add Technology
              </button>
            </div>
            {formData.projects.length > 1 && (
              <button 
                type="button" 
                className="remove-btn"
                onClick={() => removeArrayItem('projects', index)}
              >
                Remove Project
              </button>
            )}
          </div>
        ))}
        <button 
          type="button" 
          className="add-btn"
          onClick={() => addArrayItem('projects', { 
            title: '', 
            description: '', 
            technologies: [''] 
          })}
        >
          + Add Project
        </button>

        <h2>Certifications</h2>
        {formData.certificates.map((cert, index) => (
          <div key={index} className="array-item">
            <input
             type="text"
             className='text-black'

              value={cert}
              onChange={(e) => handleArrayChange('certificates', index, e.target.value)}
              placeholder="e.g., AWS Certified Developer"
            />
            {formData.certificates.length > 1 && (
              <button 
                type="button" 
                className="remove-btn"
                onClick={() => removeArrayItem('certificates', index)}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button 
          type="button" 
          className="add-btn"
          onClick={() => addArrayItem('certificates', '')}
        >
          + Add Certification
        </button>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Generating Resume...' : 'Generate ATS Resume'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </form>

      {generatedResume && (
        <div className="resume-preview">
          <h2>Your ATS-Optimized Resume</h2>
          
          <div className="ats-score">
            <strong>ATS Score:</strong> {generatedResume.analysis.score}/100
          </div>

          <div className="resume-content">
            <pre>{generatedResume.atsResume}</pre>
          </div>

          <div className="export-options">
            <h3>Export Options:</h3>
            <button onClick={() => exportResume('pdf')}>Download as PDF</button>
            <button onClick={() => exportResume('doc')}>Download as DOC</button>
          </div>

          <div className="improvement-tips">
            <h3>Improvement Suggestions:</h3>
            <ul>
              {generatedResume.analysis.topImprovements.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}