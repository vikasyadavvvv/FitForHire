import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ATSResume = () => {
  const [formData, setFormData] = useState({
    jobPosition: '',
    Fullname: '',
    email: '',
    phone: '',
    education: '',
    skills: '',
    workExperience: [{ role: '', company: '', duration: '', description: '' }],
    projects: [{ title: '', description: '', technologies: '' }],
    portfolioUrl: '',
    linkedinUrl: '',
    certifications: [''],
    languages: [''],
    achievements: ['']
  });

  const [generatedResume, setGeneratedResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayItem = (field, index) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const handleExperienceChange = (index, field, value) => {
    const newExperience = [...formData.workExperience];
    newExperience[index][field] = value;
    setFormData(prev => ({ ...prev, workExperience: newExperience }));
  };

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, { role: '', company: '', duration: '', description: '' }]
    }));
  };

  const removeExperience = (index) => {
    const newExperience = formData.workExperience.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, workExperience: newExperience }));
  };

  const handleProjectChange = (index, field, value) => {
    const newProjects = [...formData.projects];
    newProjects[index][field] = value;
    setFormData(prev => ({ ...prev, projects: newProjects }));
  };

  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, { title: '', description: '', technologies: '' }]
    }));
  };

  const removeProject = (index) => {
    const newProjects = formData.projects.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, projects: newProjects }));
  };

  const generateResume = async () => {
    if (!formData.jobPosition || !formData.Fullname || !formData.email || !formData.phone || !formData.education || !formData.skills) {
      setError('Missing required fields: jobPosition, Fullname, email, phone, education, and skills are mandatory');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://fitforhire-production.up.railway.app/api/resume/generate-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          skills: formData.skills.split(',').map(skill => skill.trim()),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate resume');
      }

      const data = await response.json();
      setGeneratedResume(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

 const downloadPDF = async () => {
  try {
    setLoading(true);
    setError('');

    // Create a print-specific stylesheet
    const printCSS = `
      @media print {
        * {
          color: #000 !important;
          background: #fff !important;
        }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.5;
        }
        a { text-decoration: none; }
      }
    `;

    // Create a clone with print styles
    const resumeElement = document.getElementById('resume-preview');
    const clone = resumeElement.cloneNode(true);
    
    // Add print styles
    const style = document.createElement('style');
    style.textContent = printCSS;
    clone.prepend(style);
    
    // Open print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(clone.outerHTML);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Trigger print (which includes PDF save option)
    printWindow.print();

  } catch (error) {
    console.error('PDF generation error:', error);
    setError('Failed to generate PDF. Please use your browser\'s print function instead.');
  } finally {
    setLoading(false);
  }
};

const downloadText = () => {
    const resumeElement = document.getElementById('resume-preview');
    const text = resumeElement.innerText;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.Fullname.replace(/\s+/g, '_')}_Resume.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-8">ATS-Optimized Resume Generator</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-gray-500 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Personal Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Position You're Applying For*</label>
                <input
                  type="text"
                  name="jobPosition"
                  value={formData.jobPosition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Software Engineer"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                <input
                  type="text"
                  name="Fullname"
                  value={formData.Fullname}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone*</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (123) 456-7890"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education*</label>
                <textarea
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. BSc Computer Science, University of XYZ, 2020"
                  rows="2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)*</label>
                <textarea
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. JavaScript, React, Node.js, Python"
                  rows="3"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio URL</label>
                <input
                  type="url"
                  name="portfolioUrl"
                  value={formData.portfolioUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yourportfolio.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-800">Work Experience</h2>
            {formData.workExperience.map((exp, index) => (
              <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Role</label>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => handleExperienceChange(index, 'role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Frontend Developer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Tech Corp Inc."
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={exp.duration}
                    onChange={(e) => handleExperienceChange(index, 'duration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Jan 2020 - Present"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={exp.description}
                    onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Describe your responsibilities and achievements"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => removeExperience(index)}
                  className="text-red-600 text-sm font-medium hover:text-red-800"
                >
                  Remove Experience
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addExperience}
              className="mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              + Add Work Experience
            </button>
            
            <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-800">Projects</h2>
            {formData.projects.map((proj, index) => (
              <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                  <input
                    type="text"
                    value={proj.title}
                    onChange={(e) => handleProjectChange(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. E-commerce Website"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={proj.description}
                    onChange={(e) => handleProjectChange(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Describe the project and your role"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Technologies Used</label>
                  <input
                    type="text"
                    value={proj.technologies}
                    onChange={(e) => handleProjectChange(index, 'technologies', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. React, Node.js, MongoDB"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => removeProject(index)}
                  className="text-red-600 text-sm font-medium hover:text-red-800"
                >
                  Remove Project
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addProject}
              className="mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              + Add Project
            </button>
            
            <h2 className="text-xl font-semibold mt-8 mb-4 text-gray-800">Additional Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                {formData.certifications.map((cert, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={cert}
                      onChange={(e) => handleArrayChange('certifications', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. AWS Certified Developer"
                    />
                    {formData.certifications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('certifications', index)}
                        className="ml-2 px-3 text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('certifications')}
                  className="mt-1 px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
                >
                  + Add Certification
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                {formData.languages.map((lang, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={lang}
                      onChange={(e) => handleArrayChange('languages', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. English (Fluent)"
                    />
                    {formData.languages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('languages', index)}
                        className="ml-2 px-3 text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('languages')}
                  className="mt-1 px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
                >
                  + Add Language
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Achievements</label>
                {formData.achievements.map((ach, index) => (
                  <div key={index} className="flex mb-2">
                    <textarea
                      value={ach}
                      onChange={(e) => handleArrayChange('achievements', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Employee of the Month, June 2022"
                      rows="2"
                    />
                    {formData.achievements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('achievements', index)}
                        className="ml-2 px-3 text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('achievements')}
                  className="mt-1 px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
                >
                  + Add Achievement
                </button>
              </div>
            </div>
            
            <div className="mt-8">
              <button
                onClick={generateResume}
                disabled={loading}
                className={`w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Generating Resume...' : 'Generate ATS-Optimized Resume'}
              </button>
              
              {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}
            </div>
          </div>
          
          {/* Resume Preview Section */}
          <div className="bg-gray-500 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Resume Preview</h2>
            
            {generatedResume ? (
                <div>
        <div className="flex space-x-4 mb-4">
          <button
            onClick={downloadPDF}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Download PDF 
          </button>
          <button
            onClick={downloadText}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Download Text
          </button>
        </div>
        
        <div id="resume-preview" className="p-6 border border-gray-200 rounded-md">
          {/* Contact Info - Always shown */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">{formData.Fullname}</h1>
            <div className="flex flex-wrap gap-x-4 text-sm text-gray-600 mt-1">
              <span>{formData.email}</span>
              <span>{formData.phone}</span>
              {formData.linkedinUrl && <span>{formData.linkedinUrl}</span>}
              {formData.portfolioUrl && <span>{formData.portfolioUrl}</span>}
            </div>
          </div>
          
          {/* Professional Summary - Always shown */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold border-b border-gray-300 pb-1 mb-2">Professional Summary</h2>
            <p className="text-black">{generatedResume.professionalSummary}</p>
          </div>
          
          {/* Dynamic Sections - Only show if they have content */}
          {generatedResume.resumeSections
            .filter(section => {
              // Filter out empty sections
              if (Array.isArray(section.content)) {
                return section.content.length > 0;
              }
              return section.content && section.content.trim() !== '';
            })
            .map((section, index) => (
              <div key={index} className="mb-6">
                <h2 className="text-lg font-semibold border-b border-gray-300 pb-1 mb-2">{section.sectionName}</h2>
                {Array.isArray(section.content) ? (
                  <ul className="list-disc pl-5 space-y-1 text-black">
                    {section.content.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700">{section.content}</p>
                )}
              </div>
            ))}
        </div>
        
        {/* Optimization Tips - Only show if they exist */}
        {generatedResume.atsOptimizationTips && generatedResume.atsOptimizationTips.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">ATS Optimization Tips</h3>
            <ul className="list-disc pl-5 space-y-1 text-black">
              {generatedResume.atsOptimizationTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Keywords - Only show if they exist */}
        {generatedResume.keywords && generatedResume.keywords.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 text-black">Important Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {generatedResume.keywords.map((keyword, index) => (
                <span key={index} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
  ) : (
              <div className="flex items-center justify-center h-64 bg-gray-500 rounded-md">
                <p className="text-black">Your generated resume will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATSResume;