import React, { useState } from 'react';
import { FaUser, FaGraduationCap, FaTools, FaBriefcase, FaProjectDiagram, 
         FaCertificate, FaLanguage, FaTrophy, FaLink, FaLinkedin, 
         FaDownload, FaPlus, FaTrash, FaSpinner } from 'react-icons/fa';

const ATSResume = () => {
  const [formData, setFormData] = useState({
    jobPosition: '',
    Fullname:"",
    email: '',
    phone: '',
    education: '',
    skills: '',
    workExperience: [],
    projects: [],
    certifications: [],
    languages: [],
    achievements: [],
    portfolioUrl: '',
    linkedinUrl: ''
  });

  const [generatedResume, setGeneratedResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayInputChange = (section, index, field, value) => {
    setFormData(prev => {
      const newArray = [...prev[section]];
      newArray[index][field] = value;
      return { ...prev, [section]: newArray };
    });
  };

  const addNewItem = (section, template) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], template]
    }));
  };

  const removeItem = (section, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const generateResume = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare the data for API
      const requestData = {
        ...formData,
        skills: formData.skills.split('\n').filter(skill => skill.trim() !== ''),
        certifications: formData.certifications.map(c => c.name),
        languages: formData.languages.map(l => l.name),
        achievements: formData.achievements.map(a => a.description)
      };

      // Call your backend API
      const response = await fetch('https://fitforhire-production.up.railway.app/api/resume/generate-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
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

  const downloadResume = () => {
    if (!generatedResume) return;
    
    // Create a formatted text version of the resume
    let resumeText = `RESUME - ${formData.jobPosition}\n\n`;
    resumeText += `Professional Summary:\n${generatedResume.professionalSummary}\n\n`;

    generatedResume.resumeSections.forEach(section => {
      resumeText += `${section.sectionName}:\n`;
      if (Array.isArray(section.content)) {
        section.content.forEach(item => resumeText += `• ${item}\n`);
      } else {
        resumeText += `${section.content}\n`;
      }
      resumeText += '\n';
    });

    // Create download link
    const blob = new Blob([resumeText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATS_Resume_${formData.jobPosition.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-blue-500 sm:text-4xl">
            ATS-Friendly Resume Generator
          </h1>
          <p className="mt-3 text-xl text-white">
            Create a resume optimized for Applicant Tracking Systems
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <form onSubmit={generateResume} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-black shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <FaUser className="text-blue-500 mr-2" />
                  <h2 className="text-lg font-medium text-white">Basic Information</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="jobPosition" className="block text-sm font-medium text-white">
                      Target Job Position *
                    </label>
                    <input
                      type="text"
                      id="jobPosition"
                      name="jobPosition"
                      value={formData.jobPosition}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                                    <div>
                    <label htmlFor="jobPosition" className="block text-sm font-medium text-white">
                        Name *
                    </label>
                    <input
                      type="text"
                      id="Fullname"
                      name="Fullname"
                      value={formData.Fullname}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-white">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Education */}
              <div className="bg-black shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <FaGraduationCap className="text-blue-500 mr-2" />
                  <h2 className="text-lg font-medium text-white">Education *</h2>
                </div>
                <div>
                  <label htmlFor="education" className="block text-sm font-medium text-white">
                    Education Details
                  </label>
                  <textarea
                    id="education"
                    name="education"
                    rows={3}
                    value={formData.education}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-2 text-sm text-white">
                    Example: B.S. in Computer Science, University of Example, 2020
                  </p>
                </div>
              </div>

              {/* Skills */}
              <div className="bg-black shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <FaTools className="text-blue-500 mr-2" />
                  <h2 className="text-lg font-medium text-white">Skills *</h2>
                </div>
                <div>
                  <label htmlFor="skills" className="block text-sm font-medium text-white">
                    Add your skills (comma separated or one per line)
                  </label>
                  <textarea
                    id="skills"
                    name="skills"
                    rows={3}
                    value={formData.skills}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Example: JavaScript, React, Node.js, Python, Project Management
                  </p>
                </div>
              </div>

              {/* Work Experience */}
              <div className="bg-black shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FaBriefcase className="text-blue-500 mr-2" />
                    <h2 className="text-lg font-medium text-blue-500">Work Experience</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => addNewItem('workExperience', { role: '', company: '', duration: '', description: '' })}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaPlus className="mr-1" /> Add Experience
                  </button>
                </div>
                {formData.workExperience.length === 0 ? (
                  <p className="text-sm text-gray-500">No work experience added</p>
                ) : (
                  <div className="space-y-4">
                    {formData.workExperience.map((exp, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-white">Experience #{index + 1}</h3>
                          <button
                            type="button"
                            onClick={() => removeItem('workExperience', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-white">Job Title</label>
                            <input
                              type="text"
                              value={exp.role}
                              onChange={(e) => handleArrayInputChange('workExperience', index, 'role', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white">Company</label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => handleArrayInputChange('workExperience', index, 'company', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-white">Duration (e.g., Jan 2020 - Present)</label>
                          <input
                            type="text"
                            value={exp.duration}
                            onChange={(e) => handleArrayInputChange('workExperience', index, 'duration', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white">Description</label>
                          <textarea
                            rows={3}
                            value={exp.description}
                            onChange={(e) => handleArrayInputChange('workExperience', index, 'description', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Projects */}
              <div className="bg-black shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FaProjectDiagram className="text-blue-500 mr-2" />
                    <h2 className="text-lg font-medium text-blue-500">Projects</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => addNewItem('projects', { title: '', description: '', technologies: '' })}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaPlus className="mr-1" /> Add Project
                  </button>
                </div>
                {formData.projects.length === 0 ? (
                  <p className="text-sm text-gray-500">No projects added</p>
                ) : (
                  <div className="space-y-4">
                    {formData.projects.map((project, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-white">Project #{index + 1}</h3>
                          <button
                            type="button"
                            onClick={() => removeItem('projects', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-white">Project Title</label>
                          <input
                            type="text"
                            value={project.title}
                            onChange={(e) => handleArrayInputChange('projects', index, 'title', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-white">Description</label>
                          <textarea
                            rows={3}
                            value={project.description}
                            onChange={(e) => handleArrayInputChange('projects', index, 'description', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white">Technologies Used</label>
                          <input
                            type="text"
                            value={project.technologies}
                            onChange={(e) => handleArrayInputChange('projects', index, 'technologies', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certifications */}
              <div className="bg-black shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FaCertificate className="text-blue-500 mr-2" />
                    <h2 className="text-lg font-medium text-blue-500">Certifications</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => addNewItem('certifications', { name: '' })}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaPlus className="mr-1" /> Add Certification
                  </button>
                </div>
                {formData.certifications.length === 0 ? (
                  <p className="text-sm text-gray-500">No certifications added</p>
                ) : (
                  <div className="space-y-3">
                    {formData.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center">
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => handleArrayInputChange('certifications', index, 'name', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem('certifications', index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Languages */}
              <div className="bg-black shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FaLanguage className="text-blue-500 mr-2" />
                    <h2 className="text-lg font-medium text-blue-500">Languages</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => addNewItem('languages', { name: '' })}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaPlus className="mr-1" /> Add Language
                  </button>
                </div>
                {formData.languages.length === 0 ? (
                  <p className="text-sm text-gray-500">No languages added</p>
                ) : (
                  <div className="space-y-3">
                    {formData.languages.map((lang, index) => (
                      <div key={index} className="flex items-center">
                        <input
                          type="text"
                          value={lang.name}
                          onChange={(e) => handleArrayInputChange('languages', index, 'name', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem('languages', index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div className="bg-black shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FaTrophy className="text-blue-500 mr-2" />
                    <h2 className="text-lg font-medium text-blue-500">Achievements</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => addNewItem('achievements', { description: '' })}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaPlus className="mr-1" /> Add Achievement
                  </button>
                </div>
                {formData.achievements.length === 0 ? (
                  <p className="text-sm text-gray-500">No achievements added</p>
                ) : (
                  <div className="space-y-3">
                    {formData.achievements.map((achievement, index) => (
                      <div key={index} className="flex items-start">
                        <textarea
                          rows={2}
                          value={achievement.description}
                          onChange={(e) => handleArrayInputChange('achievements', index, 'description', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem('achievements', index)}
                          className="ml-2 text-red-500 hover:text-red-700 mt-2"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="bg-black shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <FaLink className="text-blue-500 mr-2" />
                  <h2 className="text-lg font-medium text-blue-500">Links</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="portfolioUrl" className="block text-sm font-medium text-white">
                      Portfolio URL
                    </label>
                    <input
                      type="url"
                      id="portfolioUrl"
                      name="portfolioUrl"
                      value={formData.portfolioUrl}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="linkedinUrl" className="block text-sm font-medium text-white">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      id="linkedinUrl"
                      name="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Generating Resume...
                    </>
                  ) : (
                    'Generate ATS-Optimized Resume'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {generatedResume ? (
              <div className="bg-black shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-300">Generated Resume</h2>
                  <button
                    onClick={downloadResume}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <FaDownload className="mr-2" /> Download Resume
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Professional Summary</h3>
                    <p className="mt-2 text-white whitespace-pre-line">{generatedResume.professionalSummary}</p>
                  </div>

                  {generatedResume.resumeSections.map((section, index) => (
                    <div key={index}>
                      <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">{section.sectionName}</h3>
                      {Array.isArray(section.content) ? (
                        <ul className="mt-2 pl-5 list-disc">
                          {section.content.map((item, i) => (
                            <li key={i} className="text-white mb-1">{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-white whitespace-pre-line">{section.content}</p>
                      )}
                    </div>
                  ))}

                  {generatedResume.atsOptimizationTips && generatedResume.atsOptimizationTips.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h3 className="text-lg font-medium text-blue-800 mb-2">ATS Optimization Tips</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {generatedResume.atsOptimizationTips.map((tip, index) => (
                          <li key={index} className="text-blue-700">{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {generatedResume.keywords && generatedResume.keywords.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Important Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {generatedResume.keywords.map((keyword, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 flex items-center justify-center h-64">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No resume generated yet</h3>
                  <p className="mt-1 text-sm text-gray-900">Fill out the form and click "Generate Resume" to create your ATS-optimized resume.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATSResume;